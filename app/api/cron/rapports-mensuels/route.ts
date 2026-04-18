import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'
import { generateMonthlyReport } from '@/lib/ai/modules/monthly-report'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Récupérer tous les utilisateurs actifs
  const { data: users } = await serviceClient
    .from('users')
    .select('id')
    .eq('status', 'actif')
    .eq('onboarding_done', true)

  if (!users) return NextResponse.json({ success: true, count: 0 })

  const batchSize = 10
  let generated = 0

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize)
    await Promise.allSettled(
      batch.map(u => generateMonthlyReport(u.id).catch(console.error))
    )
    generated += batch.length
    await new Promise(r => setTimeout(r, 2000))
  }

  return NextResponse.json({ success: true, generated })
}
