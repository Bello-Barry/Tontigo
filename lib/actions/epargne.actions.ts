'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { recordRevenue } from './commission.actions'
import { calculateSavingsCommission } from '@/lib/utils/commission'
import { creditWalletFromVault } from './wallet.actions'
import { requestToPay, getCollectionStatus } from '@/lib/momo'
import type { ActionResult, SavingsVault } from '@/lib/types'
import type { CreateVaultInput, DepositVaultInput } from '@/lib/validations/epargne.schema'

export async function createVault(input: CreateVaultInput): Promise<ActionResult<SavingsVault>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data, error } = await serviceClient
    .from('savings_vaults')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/epargne')
  return { 
    data: JSON.parse(JSON.stringify(data)), 
    success: true 
  }
}

export async function depositToVault(
  vaultId: string,
  input: DepositVaultInput,
  customPhone?: string
): Promise<ActionResult<{ reference?: string }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: vault } = await serviceClient
    .from('savings_vaults')
    .select('*').eq('id', vaultId).eq('user_id', user.id).single()

  if (!vault)                  return { error: 'Coffre introuvable' }
  if (vault.status !== 'actif') return { error: 'Ce coffre est clôturé' }

  if (input.wallet_type === 'mtn') {
    let phoneToUse = customPhone

    if (!phoneToUse) {
      const { data: profile } = await serviceClient
        .from('users')
        .select('wallet_mtn')
        .eq('id', user.id)
        .single()
      phoneToUse = profile?.wallet_mtn
    }

    if (!phoneToUse) {
      return { error: 'Veuillez saisir un numéro MTN Money' }
    }

    try {
      const referenceId = await requestToPay({
        amount: input.amount,
        phone: phoneToUse,
        externalId: vaultId, // UUID pour le callback
        payerMessage: `Épargne Tontigo - ${vault.name}`,
        payeeNote: 'Tontigo'
      })

      // On pré-enregistre le mouvement (mais sans incrémenter le solde encore)
      await serviceClient.from('transactions').insert({
        user_id:            user.id,
        reference_id:       vaultId,
        type:               'epargne',
        amount:             input.amount,
        description:        `Versement MoMo (En cours) dans "${vault.name}"`,
        wallet_used:        'mtn',
        external_reference: referenceId,
        status:             'pending'
      })

      return { data: { reference: referenceId }, success: true }
    } catch (err: any) {
      console.error('MoMo requestToPay error:', err)
      return { error: 'Erreur lors de l\'initiation du paiement MoMo' }
    }
  }

  // --- Simulation ou Airtel ---
  const ref = `TG-SAVE-${Date.now()}-${vaultId.slice(0, 6)}`

  await serviceClient.from('savings_contributions').insert({
    vault_id:          vaultId,
    user_id:           user.id,
    amount:            input.amount,
    payment_reference: ref,
  })

  await serviceClient.from('savings_vaults').update({
    current_balance: Number(vault.current_balance) + input.amount,
  }).eq('id', vaultId)

  await serviceClient.from('transactions').insert({
    user_id:            user.id,
    reference_id:       vaultId,
    type:               'epargne',
    amount:             input.amount,
    description:        `Versement dans "${vault.name}"`,
    wallet_used:        input.wallet_type,
    external_reference: ref,
    status:             'success'
  })

  revalidatePath('/epargne')
  revalidatePath(`/epargne/${vaultId}`)
  return { success: true }
}

/**
 * Vérifie le statut d'un paiement d'épargne MTN et finalise si SUCCESSFUL
 */
export async function verifySavingsPayment(
  referenceId: string,
  vaultId: string
): Promise<ActionResult<{ status: string }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  try {
    const statusData = await getCollectionStatus(referenceId)
    const status = statusData.status // PENDING, SUCCESSFUL, FAILED

    if (status === 'SUCCESSFUL') {
      const { data: vault } = await serviceClient
        .from('savings_vaults')
        .select('*').eq('id', vaultId).eq('user_id', user.id).single()

      if (!vault) return { error: 'Coffre introuvable' }

      // Vérifier si déjà traité (pour éviter les doublons lors du polling)
      const { data: existing } = await serviceClient
        .from('savings_contributions')
        .select('id')
        .eq('payment_reference', referenceId)
        .maybeSingle()

      if (existing) return { data: { status }, success: true }

      // Enregistrer le versement
      await serviceClient.from('savings_contributions').insert({
        vault_id:          vaultId,
        user_id:           user.id,
        amount:            Number(statusData.amount),
        payment_reference: referenceId,
      })

      await serviceClient.from('savings_vaults').update({
        current_balance: Number(vault.current_balance) + Number(statusData.amount),
      }).eq('id', vaultId)

      await serviceClient.from('transactions').insert({
        user_id:            user.id,
        reference_id:       vaultId,
        type:               'epargne',
        amount:             Number(statusData.amount),
        description:        `Versement MoMo dans "${vault.name}"`,
        wallet_used:        'mtn',
        external_reference: referenceId,
        status:             'success'
      })

      revalidatePath('/epargne')
      revalidatePath(`/epargne/${vaultId}`)
    }

    return { data: { status }, success: true }
  } catch (err: any) {
    console.error('verifySavingsPayment error:', err)
    return { error: 'Erreur lors de la vérification' }
  }
}

// RETRAIT — Crédite maintenant le portefeuille
export async function withdrawFromVault(vaultId: string): Promise<ActionResult<{ netAmount: number }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: vault } = await serviceClient
    .from('savings_vaults').select('*').eq('id', vaultId).eq('user_id', user.id).single()

  if (!vault) return { error: 'Coffre introuvable' }

  if (new Date(vault.unlock_date) > new Date()) {
    const daysLeft = Math.ceil((new Date(vault.unlock_date).getTime() - Date.now()) / 86400000)
    return { error: `Retrait impossible. Il reste ${daysLeft} jour(s) avant le déblocage.` }
  }
  if (vault.status !== 'debloque' && vault.status !== 'actif') {
    return { error: 'Le coffre n\'est pas encore débloqué.' }
  }
  if (vault.current_balance <= 0) {
    return { error: 'Solde insuffisant.' }
  }

  const { commission, netAmount } = calculateSavingsCommission(Number(vault.current_balance))

  // ── CRÉDITER LE PORTEFEUILLE ──
  await creditWalletFromVault({
    userId:    user.id,
    vaultId:   vault.id,
    amount:    netAmount,
    vaultName: vault.name,
  })

  await serviceClient.from('savings_vaults').update({
    status:          'termine',
    current_balance: 0,
  }).eq('id', vaultId)

  await serviceClient.from('transactions').insert({
    user_id:            user.id,
    reference_id:       vaultId,
    type:               'retrait_epargne',
    amount:             netAmount,
    description:        `Épargne transférée vers portefeuille : "${vault.name}"`,
    status:             'success'
  })

  await recordRevenue({
    type:        'savings_withdrawal',
    amount:      commission,
    source_id:   vaultId,
    source_type: 'savings_vault',
    description: `Commission 0.5% retrait épargne`,
  })

  revalidatePath('/epargne')
  revalidatePath('/portefeuille')
  return { data: { netAmount }, success: true }
}
