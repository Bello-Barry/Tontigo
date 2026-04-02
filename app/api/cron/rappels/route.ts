import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { data: dueContribs } = await serviceClient
      .from('contributions')
      .select('id, group_id, amount, memberships(user_id)')
      .eq('due_date', tomorrowStr)
      .eq('status', 'en_attente')

    if (dueContribs && dueContribs.length > 0) {
      await serviceClient.from('notifications').insert(
        dueContribs.map(c => ({
          user_id: (c.memberships as any).user_id,
          title: 'Cotisation imminente',
          body: `N'oublie pas ta cotisation de ${c.amount} demain.`,
          type: 'reminder',
          reference_id: c.group_id
        }))
      )
    }

    return NextResponse.json({ success: true, count: dueContribs?.length || 0 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur cron rappels' }, { status: 500 })
  }
}
