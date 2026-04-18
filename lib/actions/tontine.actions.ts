'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { calculateGuarantee } from '@/lib/utils/guarantee'
import { calculatePayoutCommission } from '@/lib/utils/commission'
import { recordRevenue } from './commission.actions'
import { creditWalletFromPayout } from './wallet.actions'
import type { ActionResult } from '@/lib/types'

// CRÉER UN GROUPE
export async function createGroup(data: any): Promise<ActionResult<{ id: string }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const { data: group, error } = await serviceClient
    .from('tontine_groups')
    .insert({
      ...data,
      creator_id: user.id,
      invite_code: inviteCode,
      current_members: 1,
      status: 'en_attente',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Créer le membership du créateur
  await serviceClient.from('memberships').insert({
    group_id: group.id,
    user_id: user.id,
    turn_position: 1,
    status: 'actif',
  })

  // Créer le pool de solidarité
  await serviceClient.from('solidarity_pool').insert({
    group_id: group.id,
    balance: 0,
  })

  revalidatePath('/tontine')
  return { data: { id: group.id }, success: true }
}

// REJOINDRE UN GROUPE PAR CODE
export async function joinGroupByCode(code: string): Promise<ActionResult<{ id: string }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: group, error: gError } = await serviceClient
    .from('tontine_groups')
    .select('*')
    .eq('invite_code', code.toUpperCase())
    .single()

  if (gError || !group) return { error: 'Code d\'invitation invalide.' }
  if (group.status !== 'en_attente') return { error: 'Ce groupe a déjà démarré.' }
  if (group.current_members >= group.max_members) return { error: 'Groupe complet.' }

  const { data: profile } = await supabase.from('users').select('trust_score').eq('id', user.id).single()
  if (profile && profile.trust_score < group.min_trust_score) {
    return { error: `Score de confiance insuffisant. Requis: ${group.min_trust_score}, le tien: ${profile.trust_score}` }
  }

  // Vérifier si déjà membre
  const { data: existing } = await serviceClient
    .from('memberships').select('id').eq('group_id', group.id).eq('user_id', user.id).maybeSingle()
  if (existing) return { error: 'Tu es déjà membre de ce groupe.' }

  const nextPosition = group.current_members + 1
  const guarantee = group.requires_guarantee
    ? calculateGuarantee(nextPosition, group.max_members, group.amount)
    : 0

  const { error: mError } = await serviceClient.from('memberships').insert({
    group_id:         group.id,
    user_id:          user.id,
    turn_position:    nextPosition,
    guarantee_amount: guarantee,
  })
  if (mError) return { error: mError.message }

  await serviceClient.from('tontine_groups')
    .update({ current_members: nextPosition })
    .eq('id', group.id)

  // Notifier les autres membres
  const { data: others } = await serviceClient
    .from('memberships').select('user_id').eq('group_id', group.id).neq('user_id', user.id)

  if (others?.length) {
    await serviceClient.from('notifications').insert(
      others.map(m => ({
        user_id:      m.user_id,
        title:        'Nouveau membre',
        body:         `Un nouveau membre a rejoint "${group.name}".`,
        type:         'new_member',
        reference_id: group.id,
      }))
    )
  }

  revalidatePath('/tontine')
  return { data: { id: group.id }, success: true }
}

// DÉMARRER UN GROUPE
export async function startGroup(groupId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: group } = await serviceClient
    .from('tontine_groups').select('*').eq('id', groupId).single()

  if (!group)                      return { error: 'Groupe introuvable' }
  if (group.creator_id !== user.id) return { error: 'Seul le créateur peut démarrer le groupe' }
  if (group.current_members < 2)    return { error: 'Minimum 2 membres requis' }
  if (group.status !== 'en_attente') return { error: 'Le groupe est déjà démarré' }

  const dueDate = getNextDueDate(group.frequency)

  const { data: members } = await serviceClient
    .from('memberships').select('id').eq('group_id', groupId).eq('status', 'actif')

  if (members?.length) {
    await serviceClient.from('contributions').insert(
      members.map(m => ({
        membership_id: m.id,
        group_id:      groupId,
        amount:        group.amount,
        due_date:      dueDate,
        status:        'en_attente' as const,
      }))
    )
  }

  await serviceClient.from('tontine_groups').update({
    status:     'actif',
    started_at: new Date().toISOString(),
  }).eq('id', groupId)

  // Notifier tous les membres
  const { data: allMembers } = await serviceClient
    .from('memberships').select('user_id').eq('group_id', groupId)
  if (allMembers) {
    await serviceClient.from('notifications').insert(
      allMembers.map(m => ({
        user_id:      m.user_id,
        title:        '🚀 Tontine démarrée !',
        body:         `"${group.name}" est maintenant active. Première cotisation due le ${dueDate}.`,
        type:         'group_started',
        reference_id: groupId,
      }))
    )
  }

  revalidatePath(`/tontine/${groupId}`)
  return { success: true }
}

// PAYER UNE COTISATION
export async function payContribution(
  contributionId: string,
  walletType: 'mtn' | 'airtel'
): Promise<ActionResult<{ reference: string }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: contribution } = await serviceClient
    .from('contributions')
    .select('*, memberships(total_paid, user_id)')
    .eq('id', contributionId)
    .single()

  if (!contribution) return { error: 'Cotisation introuvable' }
  if (contribution.status === 'paye') return { error: 'Cette cotisation est déjà payée' }

  const membership = contribution.memberships as unknown as { total_paid: number; user_id: string }
  if (membership.user_id !== user.id) return { error: 'Non autorisé' }

  const paymentRef = `TG-COT-${Date.now()}-${contributionId.slice(0, 6)}`

  // Simuler le succès du paiement
  const paymentSuccess = true
  if (!paymentSuccess) return { error: 'Échec du paiement mobile' }

  await serviceClient.from('contributions').update({
    status:            'paye',
    paid_at:           new Date().toISOString(),
    payment_reference: paymentRef,
  }).eq('id', contributionId)

  await serviceClient.from('memberships').update({
    total_paid: Number(membership.total_paid) + contribution.amount,
  }).eq('id', contribution.membership_id)

  // Alimenter le pool de solidarité (2%)
  const solidarityAmount = Math.round(contribution.amount * 0.02)
  await serviceClient.rpc('increment_solidarity_pool', {
    p_group_id: contribution.group_id,
    p_amount:   solidarityAmount,
  })

  // Transaction
  await serviceClient.from('transactions').insert({
    user_id:            user.id,
    reference_id:       contributionId,
    type:               'cotisation',
    amount:             contribution.amount,
    wallet_used:        walletType,
    external_reference: paymentRef,
    status:             'success'
  })

  // +2 points de confiance pour paiement à temps
  if (contribution.days_late === 0) {
    await serviceClient.rpc('update_trust_score', { p_user_id: user.id, p_delta: 2 })
  }

  // Vérifier si toutes les cotisations du tour sont payées → déclencher le versement
  await checkAndProcessPayout(contribution.group_id)

  revalidatePath(`/tontine/${contribution.group_id}`)
  return { data: { reference: paymentRef }, success: true }
}

// Vérifier si toutes les cotisations sont payées et verser la cagnotte
async function checkAndProcessPayout(groupId: string): Promise<void> {
  const { data: group } = await serviceClient
    .from('tontine_groups').select('*').eq('id', groupId).single()
  if (!group || group.status !== 'actif') return

  const { data: pendingContribs } = await serviceClient
    .from('contributions')
    .select('id')
    .eq('group_id', groupId)
    .in('status', ['en_attente', 'retard'])

  if (pendingContribs && pendingContribs.length === 0) {
    await processPayout(groupId, group.current_turn)
  }
}

async function processPayout(groupId: string, turnNumber: number): Promise<void> {
  const { data: membership } = await serviceClient
    .from('memberships')
    .select('*, users(wallet_mtn, wallet_airtel)')
    .eq('group_id', groupId)
    .eq('turn_position', turnNumber)
    .single()

  if (!membership) return

  const { data: group } = await serviceClient
    .from('tontine_groups').select('*').eq('id', groupId).single()
  if (!group) return

  const grossAmount = group.amount * group.current_members
  const { commission, netAmount } = calculatePayoutCommission(grossAmount)

  const { data: payout } = await serviceClient.from('payouts').insert({
    group_id:          groupId,
    recipient_id:      membership.user_id,
    membership_id:     membership.id,
    amount:            grossAmount,
    commission_amount: commission,
    net_amount:        netAmount,
    turn_number:       turnNumber,
    status:            'en_attente',
  }).select().single()

  if (!payout) return

  await recordRevenue({
    type:        'commission_payout',
    amount:      commission,
    source_id:   payout.id,
    source_type: 'payout',
    description: `Commission 1.5% sur versement groupe ${group.name}`,
  })

  await serviceClient.from('payouts').update({
    status:  'verse',
    paid_at: new Date().toISOString(),
  }).eq('id', payout.id)

  await serviceClient.from('memberships').update({
    has_received_payout: true,
    payout_received_at:  new Date().toISOString(),
  }).eq('id', membership.id)

  // ── CRÉDITER LE PORTEFEUILLE VIRTUEL ──
  await creditWalletFromPayout({
    userId:    membership.user_id,
    payoutId:  payout.id,
    amount:    netAmount,
    groupName: group.name,
  }).catch(console.error)

  await serviceClient.from('transactions').insert({
    user_id:      membership.user_id,
    reference_id: payout.id,
    type:         'versement',
    amount:       netAmount,
    description:  `Cagnotte reçue — ${group.name} (tour ${turnNumber})`,
    status:       'success'
  })

  await serviceClient.rpc('update_trust_score', { p_user_id: membership.user_id, p_delta: 10 })

  const nextTurn = turnNumber + 1
  if (nextTurn > group.current_members) {
    await serviceClient.from('tontine_groups').update({ status: 'termine' }).eq('id', groupId)

    // 5.1 Recalculer le Trust Score de tous les membres en fin de cycle (S5/Trust AI)
    const { data: allMembers } = await serviceClient
      .from('memberships').select('user_id').eq('group_id', groupId)
    if (allMembers) {
      const { recalculateTrustScoreAI } = await import('@/lib/ai/modules/trust-score-ai')
      for (const m of allMembers) {
        recalculateTrustScoreAI(m.user_id).catch(console.error)
      }
    }
  } else {
    const nextDueDate = getNextDueDate(group.frequency)
    const { data: activeMembers } = await serviceClient
      .from('memberships').select('id').eq('group_id', groupId).eq('status', 'actif')

    if (activeMembers) {
      await serviceClient.from('contributions').insert(
        activeMembers.map(m => ({
          membership_id: m.id,
          group_id:      groupId,
          amount:        group.amount,
          due_date:      nextDueDate,
          status:        'en_attente' as const,
        }))
      )
    }

    await serviceClient.from('tontine_groups')
      .update({ current_turn: nextTurn })
      .eq('id', groupId)
  }

  await serviceClient.from('notifications').insert({
    user_id:      membership.user_id,
    title:        '💰 Cagnotte reçue !',
    body:         `Tu as reçu ${new Intl.NumberFormat('fr-FR').format(netAmount)} FCFA de "${group.name}". Elle est disponible dans ton portefeuille.`,
    type:         'payout_received',
    reference_id: groupId,
  })
}

export async function reportFugitive(groupId: string, memberId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  await serviceClient.from('memberships').update({ status: 'fugitif' })
    .eq('group_id', groupId).eq('user_id', memberId)

  const { data: membership } = await serviceClient
    .from('memberships').select('guarantee_amount').eq('group_id', groupId).eq('user_id', memberId).single()

  if (membership && membership.guarantee_amount > 0) {
    await serviceClient.rpc('seize_guarantee_and_redistribute', {
      p_group_id:          groupId,
      p_fugitive_user_id:  memberId,
      p_guarantee_amount:  membership.guarantee_amount,
    })
  }

  const { data: fugitive } = await serviceClient.from('users').select('phone').eq('id', memberId).single()
  if (fugitive) {
    await serviceClient.from('phone_blacklist').upsert({
      phone:  fugitive.phone,
      reason: `Fuite après réception de cagnotte — Groupe ${groupId}`,
    }, { onConflict: 'phone' })

    await serviceClient.from('users').update({
      is_banned:   true,
      trust_score: 0,
      badge:       'fraudeur',
      status:      'banni',
    }).eq('id', memberId)
  }

  revalidatePath(`/tontine/${groupId}`)
  return { success: true }
}

function getNextDueDate(frequency: string): string {
  const date = new Date()
  if (frequency === 'quotidien')    date.setDate(date.getDate() + 1)
  else if (frequency === 'hebdomadaire') date.setDate(date.getDate() + 7)
  else                               date.setMonth(date.getMonth() + 1)
  return date.toISOString().split('T')[0]
}
