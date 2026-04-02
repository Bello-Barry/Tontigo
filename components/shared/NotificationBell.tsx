'use client'
import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function NotificationBell() {
  const { user } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }

    fetchNotifications()

    const sub = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
        () => setUnreadCount(prev => prev + 1)
      )
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [user, supabase])

  return (
    <Popover>
      <PopoverTrigger className="relative p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <h4 className="font-semibold mb-2">Notifications</h4>
        {unreadCount === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune notification.</p>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Vous avez {unreadCount} nouvelle(s) notification(s).</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
