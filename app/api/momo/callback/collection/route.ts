import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('MTN MoMo Collection Callback received:', body)

    const { externalId, status, amount } = body

    if (!externalId) {
      return NextResponse.json({ error: 'Missing externalId' }, { status: 400 })
    }

    if (status === 'SUCCESSFUL') {
      // 1. Chercher dans les COTISATIONS (Tontine)
      const { data: contribution } = await serviceClient
        .from('contributions')
        .select('*, memberships(total_paid, user_id)')
        .eq('payment_reference', externalId)
        .maybeSingle()

      if (contribution && contribution.status !== 'paye') {
        const membership = contribution.memberships as any
        
        // Finaliser la cotisation
        await serviceClient.from('contributions').update({
          status:            'paye',
          paid_at:           new Date().toISOString(),
        }).eq('id', contribution.id)

        // Mettre à jour le total payé du membre
        await serviceClient.from('memberships').update({
          total_paid: Number(membership.total_paid) + Number(amount),
        }).eq('id', contribution.membership_id)

        // Alimenter le pool de solidarité (2%)
        const solidarityAmount = Math.round(Number(amount) * 0.02)
        await serviceClient.rpc('increment_solidarity_pool', {
          p_group_id: contribution.group_id,
          p_amount:   solidarityAmount,
        })

        // Notifier l'utilisateur
        await serviceClient.from('notifications').insert({
          user_id: membership.user_id,
          title:   '✅ Cotisation confirmée',
          body:    `Ton paiement de ${amount} FCFA a été validé par MTN MoMo.`,
          type:    'payment_success'
        })

        revalidatePath(`/tontine/${contribution.group_id}`)
      }

      // 2. Chercher dans les TRANSACTIONS (Épargne)
      const { data: transaction } = await serviceClient
        .from('transactions')
        .select('*')
        .eq('external_reference', externalId)
        .eq('type', 'epargne')
        .maybeSingle()

      if (transaction && transaction.status === 'pending') {
        // Finaliser l'épargne
        const vaultId = transaction.reference_id

        // Vérifier si déjà traité dans savings_contributions
        const { data: existingContrib } = await serviceClient
          .from('savings_contributions')
          .select('id')
          .eq('payment_reference', externalId)
          .maybeSingle()

        if (!existingContrib) {
          await serviceClient.from('savings_contributions').insert({
            vault_id:          vaultId,
            user_id:           transaction.user_id,
            amount:            Number(amount),
            payment_reference: externalId,
          })

          // Mettre à jour le solde du coffre
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

          // Mettre à jour le statut de la transaction
          await serviceClient.from('transactions').update({
            status:      'success',
            description: transaction.description.replace('(En cours)', '').trim()
          }).eq('id', transaction.id)

          revalidatePath('/epargne')
          revalidatePath(`/epargne/${vaultId}`)
        }
      }
    } else if (status === 'FAILED' || status === 'REJECTED') {
      // Gérer l'échec
      await serviceClient.from('transactions')
        .update({ status: 'failed' })
        .eq('external_reference', externalId)
      
      await serviceClient.from('contributions')
        .update({ status: 'en_attente' }) // Reset status if it was pending
        .eq('payment_reference', externalId)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Callback Collection Error:', err)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
