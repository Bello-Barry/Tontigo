import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'

/**
 * Route appelée par un Cron Job (ex: GitHub Actions, Vercel Cron, ou manuellement)
 * pour envoyer des rappels aux membres qui ont une cotisation due demain.
 */
export async function GET(req: Request) {
  // 1. Vérification de sécurité
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. Calculer la date de demain
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    console.log(`Checking for contributions due on: ${tomorrowStr}`)

    // 3. Récupérer les cotisations 'en_attente' dues demain
    const { data: contributions, error } = await serviceClient
      .from('contributions')
      .select(`
        *,
        memberships (
          user_id,
          groups:group_id (
            name
          )
        )
      `)
      .eq('status', 'en_attente')
      .eq('due_date', tomorrowStr)

    if (error) throw error
    if (!contributions || contributions.length === 0) {
      return NextResponse.json({ message: 'No reminders to send' })
    }

    // 4. Envoyer les notifications
    const notifications = contributions.map((c: any) => ({
      user_id: c.memberships.user_id,
      title:   '⏰ Rappel de Cotisation',
      body:    `Ta cotisation de ${new Intl.NumberFormat('fr-FR').format(c.amount)} FCFA pour le groupe "${c.memberships.groups.name}" est due demain (${tomorrowStr}). Pense à régulariser !`,
      type:    'payment_reminder',
      reference_id: c.id
    }))

    const { error: notifError } = await serviceClient
      .from('notifications')
      .insert(notifications)

    if (notifError) throw notifError

    return NextResponse.json({ 
      success: true, 
      sentCount: notifications.length 
    })

  } catch (err: any) {
    console.error('Cron Reminders Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
