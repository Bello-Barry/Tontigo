'use client'
import { useEffect, useState } from 'react'
import { Bell, X, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export function NotificationBell() {
  const { user } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchUnreadCount = async () => {
    if (!user) return
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    setUnreadCount(count || 0)
  }

  const fetchNotifications = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) setNotifications(data)
    setLoading(false)
  }

  const markAllAsRead = async () => {
    if (!user) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  useEffect(() => {
    if (!user) return

    fetchUnreadCount()

    const sub = supabase
      .channel('public:notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setUnreadCount(prev => prev + 1)
        setNotifications(prev => [payload.new, ...prev].slice(0, 20))
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [user, supabase])

  return (
    <Popover onOpenChange={(open) => open && fetchNotifications()}>
      <PopoverTrigger className="relative p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors outline-none">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 glass-card border border-slate-700 shadow-xl overflow-hidden" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900/50">
          <h4 className="font-semibold text-white">Notifications</h4>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" />
              Tout marquer lu
            </button>
          )}
        </div>

        <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-700/50">
          {loading && notifications.length === 0 ? (
             <div className="p-4 space-y-3">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex gap-3 animate-pulse">
                   <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0" />
                   <div className="flex-1 space-y-2">
                     <div className="h-3 bg-slate-700 rounded w-3/4" />
                     <div className="h-2 bg-slate-700 rounded w-1/2" />
                   </div>
                 </div>
               ))}
             </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center space-y-2 opacity-50">
              <Bell className="w-8 h-8 mx-auto text-slate-500" />
              <p className="text-sm text-slate-400">Aucune notification pour l'instant.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors ${!notif.is_read ? 'bg-emerald-500/5' : ''}`}
              >
                {!notif.is_read && (
                  <div className="w-2 h-2 bg-emerald-400 rounded-full shrink-0 mt-1.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.is_read ? 'text-white font-medium' : 'text-slate-300'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                    {notif.body}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
