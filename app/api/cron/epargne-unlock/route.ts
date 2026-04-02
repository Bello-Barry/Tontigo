import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const now = new Date().toISOString()
    
    // Débloquer les coffres dont la date est passée
    const { data: unlockedVaults, error } = await serviceClient
      .from('savings_vaults')
      .update({
        status: 'debloque',
        unlocked_at: now
      })
      .lte('unlock_date', now.split('T')[0])
      .eq('status', 'actif')
      .select()

    if (error) throw error

    // Notifier les utilisateurs
    if (unlockedVaults && unlockedVaults.length > 0) {
      await serviceClient.from('notifications').insert(
        unlockedVaults.map(v => ({
          user_id: v.user_id,
          title: '🔓 Coffre débloqué',
          body: `Ton coffre "${v.name}" est maintenant débloqué !`,
          type: 'vault_unlocked',
          reference_id: v.id
        }))
      )
    }

    return NextResponse.json({ success: true, count: unlockedVaults?.length || 0 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur cron epargne' }, { status: 500 })
  }
}
