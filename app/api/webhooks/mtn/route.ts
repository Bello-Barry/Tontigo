import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const { externalId, status, amount, financialTransactionId } = payload

    if (!externalId) {
      return NextResponse.json({ error: 'Missing externalId' }, { status: 400 })
    }

    if (status === 'SUCCESSFUL') {
      // On utilise une recherche flexible par externalId car il peut être tronqué (20 chars)
      const { data: contribution } = await serviceClient
        .from('contributions')
        .select('*, memberships(total_paid, user_id)')
        .or(`payment_reference.eq.${externalId},id.ilike.%${externalId}%`)
        .maybeSingle()

      if (contribution && contribution.status !== 'paye') {
        const membership = contribution.memberships as any

        await serviceClient.from('contributions').update({
          status:            'paye',
          paid_at:           new Date().toISOString(),
          payment_reference: financialTransactionId || externalId
        }).eq('id', contribution.id)

        await serviceClient.from('memberships').update({
          total_paid: Number(membership.total_paid) + Number(amount),
        }).eq('id', contribution.membership_id)

        const { checkPayoutsStatus } = await import('@/lib/actions/tontine.actions')
        await checkPayoutsStatus(contribution.group_id).catch(console.error)
      }

      // Recherche transaction générale
      const { data: transaction } = await serviceClient
        .from('transactions')
        .select('*')
        .or(`external_reference.eq.${externalId},id.ilike.%${externalId}%`)
        .maybeSingle()

      if (transaction && transaction.status === 'pending') {
        await serviceClient.from('transactions').update({
          status: 'success',
          external_reference: financialTransactionId || externalId
        }).eq('id', transaction.id)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
