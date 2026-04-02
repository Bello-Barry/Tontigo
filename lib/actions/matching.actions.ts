'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { chargeMatchingFee } from './commission.actions'
import { sortGroupsByMatchScore } from '@/lib/utils/matching'
import { calculateGuarantee } from '@/lib/utils/guarantee'
import type { ActionResult, MatchingProfile, TontineGroup } from '@/lib/types'
import type { MatchingFilterInput } from '@/lib/validations/matching.schema'

export async function findMatchingGroups(
  filters: MatchingFilterInput
): Promise<ActionResult<MatchingProfile[]>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) return { error: 'Profil introuvable' }

  const { data: groups } = await serviceClient
    .from('tontine_groups')
    .select('*, creator:creator_id(trust_score)')
    .eq('is_public', true)
    .eq('status', 'en_attente')
    .gte('amount', filters.amount_min)
    .lte('amount', filters.amount_max)
    .eq('frequency', filters.frequency!)
    .lte('min_trust_score', profile.trust_score)

  if (!groups) return { data: [] }

  const openGroups = (groups as unknown as TontineGroup[]).filter(
    g => g.current_members < g.max_members
  )

  const matches = sortGroupsByMatchScore(openGroups, profile)

  return { data: matches }
}

export async function joinViaMatching(groupId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) return { error: 'Profil introuvable' }

  const hasPro = profile.subscription_plan === 'pro' &&
    profile.subscription_expires_at &&
    new Date(profile.subscription_expires_at) > new Date()

  const { data: request } = await serviceClient.from('matching_requests').insert({
    user_id:          user.id,
    amount_min:       0,
    amount_max:       9_999_999,
    frequency:        'mensuel',
    matched_group_id: groupId,
    status:           'matche',
  }).select().single()

  if (!request) return { error: 'Erreur lors de la création de la demande' }

  if (!hasPro) {
    const feeResult = await chargeMatchingFee(user.id, request.id)
    if (feeResult.error) return { error: `Frais de matching : ${feeResult.error}` }
  }

  const { data: group } = await serviceClient
    .from('tontine_groups').select('*').eq('id', groupId).single()
  if (!group) return { error: 'Groupe introuvable' }

  const nextPosition = group.current_members + 1
  const guarantee = group.requires_guarantee
    ? calculateGuarantee(nextPosition, group.max_members, group.amount)
    : 0

  await serviceClient.from('memberships').insert({
    group_id:         groupId,
    user_id:          user.id,
    turn_position:    nextPosition,
    guarantee_amount: guarantee,
  })

  await serviceClient.from('tontine_groups')
    .update({ current_members: nextPosition })
    .eq('id', groupId)

  await serviceClient.from('notifications').insert({
    user_id:      group.creator_id,
    title:        '🤝 Nouveau membre via Matching',
    body:         `${profile.full_name} a rejoint ton groupe "${group.name}" via le matching.`,
    type:         'matching_join',
    reference_id: groupId,
  })

  revalidatePath('/matching')
  revalidatePath('/tontine')
  return { success: true }
}

export async function createMatchingRequest(
  filters: MatchingFilterInput
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: existing } = await serviceClient
    .from('matching_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'en_attente')
    .maybeSingle()

  if (existing) return { error: 'Tu as déjà une demande de matching en cours.' }

  await serviceClient.from('matching_requests').insert({
    user_id:        user.id,
    amount_min:     filters.amount_min,
    amount_max:     filters.amount_max,
    frequency:      filters.frequency!,
    min_trust_score: filters.min_trust_score,
    status:         'en_attente',
  })

  revalidatePath('/matching')
  return { success: true }
}
