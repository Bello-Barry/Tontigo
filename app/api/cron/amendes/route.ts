import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'

export const maxDuration = 60 // Vercel Cron Max Time

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    await serviceClient.rpc('enforce_penalties_and_eliminations')
    return NextResponse.json({ success: true, message: 'Amendes appliquées' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors du cron des amendes' }, { status: 500 })
  }
}
