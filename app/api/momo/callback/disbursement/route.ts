import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('MTN MoMo Disbursement Callback received:', body)

    const { externalId, status, financialTransactionId } = body
    if (!externalId) return NextResponse.json({ error: 'Missing externalId' }, { status: 400 })

    if (status === 'SUCCESSFUL') {
      const { data: payout } = await serviceClient
        .from('payouts')
        .select('*')
        .or(`payment_reference.eq.${externalId},id.ilike.%${externalId}%`)
        .maybeSingle()

      if (payout && payout.status !== 'complete') {
        await serviceClient.from('payouts').update({
          status: 'complete',
          payment_reference: financialTransactionId || externalId
        }).eq('id', payout.id)
      }

      const { data: movement } = await serviceClient
        .from('wallet_movements')
        .select('*')
        .or(`external_ref.eq.${externalId},id.ilike.%${externalId}%`)
        .maybeSingle()

      if (movement && movement.status === 'pending') {
        await serviceClient.from('wallet_movements').update({
          status: 'success',
          external_ref: financialTransactionId || externalId
        }).eq('id', movement.id)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Callback Disbursement Error:', err)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
