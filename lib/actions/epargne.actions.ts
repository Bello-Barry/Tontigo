'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { recordRevenue } from './commission.actions'
import { calculateSavingsCommission } from '@/lib/utils/commission'
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
  return { data, success: true }
}

export async function depositToVault(
  vaultId: string,
  input: DepositVaultInput
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: vault } = await serviceClient
    .from('savings_vaults')
    .select('*').eq('id', vaultId).eq('user_id', user.id).single()

  if (!vault)                  return { error: 'Coffre introuvable' }
  if (vault.status !== 'actif') return { error: 'Ce coffre est clôturé' }

  const ref = `TG-SAVE-${Date.now()}-${vaultId.slice(0, 6)}`

  await serviceClient.from('savings_contributions').insert({
    vault_id:          vaultId,
    user_id:           user.id,
    amount:            input.amount,
    payment_reference: ref,
  })

  await serviceClient.from('savings_vaults').update({
    current_balance: vault.current_balance + input.amount,
  }).eq('id', vaultId)

  await serviceClient.from('transactions').insert({
    user_id:            user.id,
    reference_id:       vaultId,
    type:               'epargne',
    amount:             input.amount,
    description:        `Versement dans "${vault.name}"`,
    wallet_used:        input.wallet_type,
    external_reference: ref,
  })

  revalidatePath('/epargne')
  revalidatePath(`/epargne/${vaultId}`)
  return { success: true }
}

// RETRAIT — uniquement si status === 'debloque'
export async function withdrawFromVault(vaultId: string): Promise<ActionResult<{ netAmount: number }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: vault } = await serviceClient
    .from('savings_vaults').select('*').eq('id', vaultId).eq('user_id', user.id).single()

  if (!vault) return { error: 'Coffre introuvable' }

  // ── VÉRIFICATION ABSOLUE ──────────────────────────────────────────────────
  if (new Date(vault.unlock_date) > new Date()) {
    const daysLeft = Math.ceil((new Date(vault.unlock_date).getTime() - Date.now()) / 86400000)
    return { error: `Retrait impossible. Il reste ${daysLeft} jour(s) avant le déblocage.` }
  }
  if (vault.status !== 'debloque') {
    return { error: 'Le coffre n\'est pas encore débloqué.' }
  }
  if (vault.current_balance <= 0) {
    return { error: 'Solde insuffisant.' }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const { commission, netAmount } = calculateSavingsCommission(vault.current_balance)
  const ref = `TG-WDRAW-${Date.now()}-${vaultId.slice(0, 6)}`

  await serviceClient.from('savings_vaults').update({
    status:          'termine',
    current_balance: 0,
  }).eq('id', vaultId)

  await serviceClient.from('transactions').insert({
    user_id:            user.id,
    reference_id:       vaultId,
    type:               'retrait_epargne',
    amount:             netAmount,
    description:        `Retrait coffre "${vault.name}" (commission: ${commission} FCFA)`,
    wallet_used:        vault.wallet_destination,
    external_reference: ref,
  })

  await recordRevenue({
    type:        'savings_withdrawal',
    amount:      commission,
    source_id:   vaultId,
    source_type: 'savings_vault',
    description: `Commission 0.5% retrait épargne`,
  })

  revalidatePath('/epargne')
  return { data: { netAmount }, success: true }
}
