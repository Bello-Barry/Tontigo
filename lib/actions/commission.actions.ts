'use server'
import { serviceClient } from '@/lib/supabase/service'
import type { RevenueType } from '@/lib/types'
import type { ActionResult } from '@/lib/types'

interface RecordRevenueInput {
  type:         RevenueType
  amount:       number
  source_id?:   string
  source_type?: string
  description?: string
}

export async function recordRevenue(input: RecordRevenueInput): Promise<void> {
  await serviceClient.from('platform_revenues').insert({
    type:         input.type,
    amount:       input.amount,
    source_id:    input.source_id ?? null,
    source_type:  input.source_type ?? null,
    description:  input.description ?? null,
  })
}

export async function chargeMatchingFee(userId: string, requestId: string): Promise<ActionResult> {
  const FEE = parseInt(process.env.COMMISSION_MATCHING_FEE || '500')

  const ref = `TG-MATCH-${Date.now()}-${userId.slice(0, 6)}`

  await serviceClient.from('transactions').insert({
    user_id:            userId,
    reference_id:       requestId,
    type:               'matching_fee',
    amount:             FEE,
    description:        'Frais de mise en relation Likelemba',
    external_reference: ref,
  })

  await serviceClient.from('matching_requests').update({ fee_paid: true }).eq('id', requestId)

  await recordRevenue({
    type:        'matching_fee',
    amount:      FEE,
    source_id:   requestId,
    source_type: 'matching_request',
    description: `Frais matching utilisateur ${userId.slice(0, 8)}`,
  })

  return { success: true }
}

export async function activateProSubscription(userId: string, walletType: 'mtn' | 'airtel'): Promise<ActionResult> {
  const PRICE = parseInt(process.env.PRO_SUBSCRIPTION_PRICE || '2500')

  const ref = `TG-PRO-${Date.now()}-${userId.slice(0, 6)}`
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  await serviceClient.from('users').update({
    subscription_plan:       'pro',
    subscription_expires_at: expiresAt.toISOString(),
  }).eq('id', userId)

  await serviceClient.from('transactions').insert({
    user_id:            userId,
    type:               'abonnement',
    amount:             PRICE,
    description:        'Abonnement Likelemba Pro — 1 mois',
    wallet_used:        walletType,
    external_reference: ref,
  })

  await recordRevenue({
    type:        'subscription',
    amount:      PRICE,
    source_id:   userId,
    source_type: 'user',
    description: `Abonnement Pro — ${userId.slice(0, 8)}`,
  })

  return { success: true }
}

export async function getRevenueStats(): Promise<ActionResult<{
  total: number
  byType: Record<RevenueType, number>
  last30Days: number
  last7Days: number
}>> {
  const { data: revenues } = await serviceClient
    .from('platform_revenues')
    .select('*')
    .order('created_at', { ascending: false })

  if (!revenues) return { error: 'Impossible de charger les revenus' }

  const now = new Date()
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const d7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)

  const total      = revenues.reduce((s, r) => s + r.amount, 0)
  const last30Days = revenues.filter(r => new Date(r.created_at) >= d30).reduce((s, r) => s + r.amount, 0)
  const last7Days  = revenues.filter(r => new Date(r.created_at) >= d7).reduce((s, r)  => s + r.amount, 0)

  const byType = revenues.reduce((acc, r) => {
    acc[r.type as RevenueType] = (acc[r.type as RevenueType] || 0) + r.amount
    return acc
  }, {} as Record<RevenueType, number>)

  return { data: { total, byType, last30Days, last7Days } }
}
