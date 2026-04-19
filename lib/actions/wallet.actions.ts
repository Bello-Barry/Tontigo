'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

// ── Créditer le portefeuille après réception d'une cagnotte ──
export async function creditWalletFromPayout(params: {
  userId:      string
  payoutId:    string
  amount:      number
  groupName:   string
}): Promise<void> {
  try {
    // Récupérer le solde actuel
    const { data: wallet } = await serviceClient
      .from('virtual_wallet')
      .select('tontine_balance')
      .eq('user_id', params.userId)
      .single()

    const currentBalance = wallet?.tontine_balance ?? 0
    const newBalance     = Number(currentBalance) + params.amount

    // Mettre à jour le solde
    await serviceClient.from('virtual_wallet').upsert({
      user_id:                params.userId,
      tontine_balance:        newBalance,
      last_tontine_credit_at: new Date().toISOString(),
      updated_at:             new Date().toISOString(),
    })

    // Enregistrer le mouvement
    await serviceClient.from('wallet_movements').insert({
      user_id:        params.userId,
      type:           'tontine_credit',
      amount:         params.amount,
      balance_before: currentBalance,
      balance_after:  newBalance,
      reference_id:   params.payoutId,
      reference_type: 'payout',
      description: `Cagnotte reçue — ${params.groupName}`,
    })
  } catch (err: any) {
    console.error('creditWalletFromPayout error:', err?.message)
  }
}

// ── Créditer le portefeuille quand un coffre se débloque ─────
export async function creditWalletFromVault(params: {
  userId:    string
  vaultId:   string
  amount:    number
  vaultName: string
}): Promise<void> {
  try {
    const { data: wallet } = await serviceClient
      .from('virtual_wallet')
      .select('savings_balance')
      .eq('user_id', params.userId)
      .single()

    const currentBalance = wallet?.savings_balance ?? 0
    const newBalance     = Number(currentBalance) + params.amount

    await serviceClient.from('virtual_wallet').upsert({
      user_id:                params.userId,
      savings_balance:        newBalance,
      last_savings_credit_at: new Date().toISOString(),
      updated_at:             new Date().toISOString(),
    })

    await serviceClient.from('wallet_movements').insert({
      user_id:        params.userId,
      type:           'savings_credit',
      amount:         params.amount,
      balance_before: currentBalance,
      balance_after:  newBalance,
      reference_id:   params.vaultId,
      reference_type: 'vault',
      description: `Épargne débloquée — "${params.vaultName}"`,
    })
  } catch (err: any) {
    console.error('creditWalletFromVault error:', err?.message)
  }
}

// ── Retrait depuis le portefeuille vers Mobile Money ─────────
export async function withdrawFromWallet(params: {
  amount:     number
  walletType: 'mtn' | 'airtel'
  source:     'tontine' | 'savings' | 'all'
}): Promise<ActionResult<{ reference: string; netAmount: number }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  try {
    // Récupérer le portefeuille
    const { data: wallet } = await serviceClient
      .from('virtual_wallet')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!wallet) return { error: 'Portefeuille introuvable' }

    // Vérifier le solde selon la source
    const availableBalance =
      params.source === 'tontine' ? Number(wallet.tontine_balance) :
      params.source === 'savings' ? Number(wallet.savings_balance) :
      Number(wallet.total_balance)

    if (params.amount <= 0)               return { error: 'Montant invalide' }
    if (params.amount > availableBalance)  return { error: `Solde insuffisant. Disponible : ${availableBalance.toLocaleString('fr-FR')} FCFA` }
    if (params.amount < 500)               return { error: 'Retrait minimum : 500 FCFA' }

    // Récupérer le numéro wallet
    const { data: profile } = await serviceClient
      .from('users')
      .select('wallet_mtn, wallet_airtel')
      .eq('id', user.id)
      .single()

    const destPhone = params.walletType === 'mtn'
      ? profile?.wallet_mtn
      : profile?.wallet_airtel

    if (!destPhone) {
      return { error: `Numéro ${params.walletType === 'mtn' ? 'MTN Money' : 'Airtel Money'} non renseigné dans ton profil` }
    }

    // ── S4: Fraude sur gros retraits ──────────────────────────
    if (params.amount > 100000) {
       const { detectFraud } = await import('@/lib/ai/modules/fraud-detection')
       const fraudResult = await detectFraud({
         userId: user.id,
         actionType: 'receive_payout', // Using closest available action type
         contextData: { amount: params.amount, type: 'withdrawal' }
       })
       if (fraudResult.fraud_score >= 90) {
         return { error: 'Transaction bloquée par sécurité. Contacte le support.' }
       }
    }

    // Commission 0% sur les retraits de portefeuille
    const netAmount = params.amount
    const reference = `LK-WALLET-${Date.now()}-${user.id.slice(0, 6)}`

    // MODE SIMULATION / SANDBOX
    const IS_SANDBOX = true // Forcé à true pour test immédiat utilisateur

    if (IS_SANDBOX) {
      const simulatedRef = `SANDBOX-${Date.now()}`

      // Débiter le portefeuille
      const updates: Record<string, any> = { updated_at: new Date().toISOString() }

      if (params.source === 'tontine' || params.source === 'all') {
        const tontineBal = Number(wallet.tontine_balance)
        const debit = params.source === 'all'
          ? Math.min(params.amount, tontineBal)
          : params.amount
        updates.tontine_balance = tontineBal - debit

        if (params.source === 'all' && params.amount > tontineBal) {
          updates.savings_balance = Number(wallet.savings_balance) - (params.amount - tontineBal)
        }
      } else if (params.source === 'savings') {
        updates.savings_balance = Number(wallet.savings_balance) - params.amount
      }

      await serviceClient.from('virtual_wallet').update(updates).eq('user_id', user.id)

      // Enregistrer le mouvement
      await serviceClient.from('wallet_movements').insert({
        user_id:        user.id,
        type:           `withdrawal_${params.walletType}`,
        amount:         netAmount,
        balance_before: availableBalance,
        balance_after:  availableBalance - netAmount,
        description:    `[SIMULATION] Retrait vers ${params.walletType === 'mtn' ? 'MTN Money' : 'Airtel Money'}`,
        wallet_used:    params.walletType,
        external_ref:   simulatedRef,
      })

      revalidatePath('/portefeuille')
      revalidatePath('/dashboard')
      return { data: { reference: simulatedRef, netAmount: params.amount }, success: true }
    }

    // En production : appel MTN réel (à implémenter via lib/mtn/disbursement)
    return { error: 'Service de retrait en maintenance. Réessaye plus tard.' }

  } catch (err: any) {
    console.error('withdrawFromWallet unexpected error:', err?.message)
    return { error: 'Erreur inattendue lors du retrait' }
  }
}

// ── Lire le portefeuille et ses mouvements récents ───────────
export async function getWalletData(): Promise<ActionResult<{
  wallet:    any
  movements: any[]
}>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  try {
    const [walletResult, movementsResult] = await Promise.all([
      supabase
        .from('virtual_wallet')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('wallet_movements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    if (walletResult.error) return { error: walletResult.error.message }

    return {
      data: {
        wallet:    walletResult.data,
        movements: movementsResult.data ?? [],
      },
      success: true,
    }
  } catch (err: any) {
    console.error('getWalletData unexpected error:', err?.message)
    return { error: 'Erreur lors du chargement du portefeuille' }
  }
}
