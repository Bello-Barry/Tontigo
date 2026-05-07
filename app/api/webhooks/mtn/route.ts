import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    console.log('MTN webhook payload:', payload)

    const { reference, status, amount, externalId } = payload

    const refId = reference || externalId

    if (!refId) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
    }

    if (status === 'SUCCESSFUL') {
      // 1. Chercher dans les cotisations
      try {
        const { data: contrib } = await serviceClient
          .from('contributions')
          .select('id, membership_id, group_id, amount, status')
          .eq('payment_reference', refId)
          .maybeSingle()

        if (contrib && contrib.status !== 'paye') {
          await serviceClient.from('contributions').update({
            status:  'paye',
            paid_at: new Date().toISOString(),
          }).eq('id', contrib.id)

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

          const { checkPayoutsStatus } = await import('@/lib/actions/tontine.actions')
          await checkPayoutsStatus(contrib.group_id).catch(console.error)
        }
      } catch (e) {
        console.error('Error processing contribution:', e)
      }

      // 2. Chercher dans les transactions épargne
      try {
        const { data: transaction } = await serviceClient
          .from('transactions')
          .select('*')
          .eq('external_reference', refId)
          .maybeSingle()

        if (transaction && transaction.status === 'pending') {
          const vaultId = transaction.reference_id

          await serviceClient.from('savings_contributions').insert({
            vault_id:          vaultId,
            user_id:          transaction.user_id,
            amount:          Number(amount),
            payment_reference: refId,
          })

          const { data: vault } = await serviceClient
            .from('savings_vaults')
            .select('current_balance')
            .eq('id', vaultId)
            .single()

          if (vault) {
            await serviceClient.from('savings_vaults').update({
              current_balance: Number(vault.current_balance) + Number(amount),
            }).eq('id', vaultId)
          }

          await serviceClient.from('transactions').update({
            status:      'success',
            description: transaction.description.replace('(En cours)', '').trim()
          }).eq('id', transaction.id)
        }
      } catch (e) {
        console.error('Error processing transaction:', e)
      }

      // 3. Chercher dans les mouvements de portefeuille
      try {
        const { data: movement } = await serviceClient
          .from('wallet_movements')
          .select('*')
          .eq('external_ref', refId)
          .maybeSingle()

        if (movement && movement.status === 'pending') {
          await serviceClient.from('wallet_movements').update({
            status:      'success',
            description: movement.description.replace('(En attente confirmation)', '').trim()
          }).eq('id', movement.id)
        }
      } catch (e) {
        console.error('Error processing wallet movement:', e)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('MTN webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
