import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('MTN MoMo Collection Callback received:', body)

    const { externalId, status, amount, financialTransactionId } = body

    if (!externalId) {
      return NextResponse.json({ error: 'Missing externalId' }, { status: 400 })
    }

    if (status === 'SUCCESSFUL') {
      // Rechercher par ID exact ou par externalId tronqué (car limité à 20 chars chez MTN)
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

        const solidarityAmount = Math.round(Number(amount) * 0.02)
        await serviceClient.rpc('increment_solidarity_pool', {
          p_group_id: contribution.group_id,
          p_amount:   solidarityAmount,
        })

        await serviceClient.from('notifications').insert({
          user_id: membership.user_id,
          title:   '✅ Cotisation confirmée',
          body:    `Ton paiement de ${amount} FCFA a été validé.`,
          type:    'payment_success'
        })

        revalidatePath(`/tontine/${contribution.group_id}`)
      }

      // Rechercher dans les TRANSACTIONS générales
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

        if (transaction.type === 'epargne') {
           const vaultId = transaction.reference_id
           const { data: vault } = await serviceClient.from('savings_vaults').select('current_balance').eq('id', vaultId).single()
           if (vault) {
             await serviceClient.from('savings_vaults').update({
               current_balance: Number(vault.current_balance) + Number(amount)
             }).eq('id', vaultId)
           }
           revalidatePath('/epargne')
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Callback Collection Error:', err)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
