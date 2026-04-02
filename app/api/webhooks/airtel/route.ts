import { NextResponse } from 'next/server'
// import { serviceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    // Logique similaire au webhook MTN pour Airtel
    console.log('Airtel webhook payload:', payload)
    
    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
