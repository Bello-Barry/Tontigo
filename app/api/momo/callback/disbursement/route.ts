import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('MTN MoMo Disbursement Callback received:', body)

    const { externalId, status } = body

    if (!externalId) {
      return NextResponse.json({ error: 'Missing externalId' }, { status: 400 })
    }

    // Chercher le mouvement de portefeuille correspondant
    const { data: movement } = await serviceClient
      .from('wallet_movements')
      .select('*')
      .eq('external_ref', externalId)
      .maybeSingle()

    if (!movement) {
      return NextResponse.json({ error: 'Movement not found' }, { status: 404 })
    }

    if (status === 'SUCCESSFUL') {
      if (movement.status === 'pending') {
        // Confirmer le retrait
        await serviceClient.from('wallet_movements').update({
          status:      'success',
          description: movement.description.replace('(En attente confirmation)', '').trim()
        }).eq('id', movement.id)

        // Optionnel: Créer une notification de succès
        await serviceClient.from('notifications').insert({
          user_id: movement.user_id,
          title:   '💸 Retrait réussi',
          body:    `Ton retrait de ${movement.amount} FCFA a été transféré sur ton compte MTN MoMo.`,
          type:    'withdrawal_success'
        })
      }
    } else if (status === 'FAILED' || status === 'REJECTED') {
      if (movement.status === 'pending') {
        // En cas d'échec, il faut RENDRE l'argent au portefeuille virtuel !
        // Car on l'avait débité lors de l'initiation
        
        const { data: wallet } = await serviceClient
          .from('virtual_wallet')
          .select('*')
          .eq('user_id', movement.user_id)
          .single()

        if (wallet) {
          // On recrédite là où on avait débité (tontine_balance par défaut ou selon le type de mouvement)
          // Pour simplifier on recrédite tontine_balance ou on utilise un RPC
          await serviceClient.rpc('increment_wallet_balance', {
            user_id: movement.user_id,
            amount:  Number(movement.amount)
          })
        }

        await serviceClient.from('wallet_movements').update({
          status:      'failed',
          description: `ÉCHEC : ${movement.description}`
        }).eq('id', movement.id)

        await serviceClient.from('notifications').insert({
          user_id: movement.user_id,
          title:   '❌ Retrait échoué',
          body:    `Le transfert de ${movement.amount} FCFA a échoué. Ton solde Tontigo a été recrédité.`,
          type:    'withdrawal_failed'
        })
      }
    }

    revalidatePath('/portefeuille')
    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Callback Disbursement Error:', err)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
