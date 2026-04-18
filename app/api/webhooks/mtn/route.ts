import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    // Validation du payload...
    const { externalId, status, amount } = payload

    if (!externalId) {
      return NextResponse.json({ error: 'Missing externalId' }, { status: 400 })
    }

    if (externalId.startsWith('TG-COT-')) {
      // Traitement cotisation
      const contributionId = externalId.split('-')[2] 
      
      if (status === 'SUCCESSFUL') {
        const { data: contrib } = await serviceClient
          .from('contributions')
          .select('membership_id, group_id, amount')
          .eq('id', contributionId)
          .single()

        if (contrib) {
          await serviceClient.from('contributions').update({
            status: 'paye',
            paid_at: new Date().toISOString(),
          }).eq('id', contributionId)

          const { data: membership } = await serviceClient
            .from('memberships')
            .select('total_paid')
            .eq('id', contrib.membership_id)
            .single()

          if (membership) {
            await serviceClient.from('memberships').update({
              total_paid: Number(membership.total_paid) + Number(contrib.amount)
            }).eq('id', contrib.membership_id)
          }

          // Vérifier si le tour est fini et déclencher le payout
          const { checkPayoutsStatus } = await import('@/lib/actions/tontine.actions')
          await checkPayoutsStatus(contrib.group_id).catch(console.error)
        }
      }
    } else if (externalId.startsWith('LK-WALLET-')) {
        // Traitement retrait portefeuille (disbursement callback)
        // Logique à implémenter selon le retour MTN
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
