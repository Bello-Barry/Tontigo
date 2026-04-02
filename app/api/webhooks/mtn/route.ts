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
              total_paid: membership.total_paid + contrib.amount
            }).eq('id', contrib.membership_id)
          }
        }
      } else if (status === 'FAILED') {
        // Gérer l'échec...
      }
    } else if (externalId.startsWith('TG-PRO-')) {
      // Traitement abonnement pro
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
