'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Users, Target, Wallet, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const { user } = useAuthStore()
  const pathname = usePathname()

  const NAV_ITEMS = [
    { href: '/dashboard',    label: 'Accueil',   icon: Home },
    { href: '/tontine',      label: 'Tontines',  icon: Users },
    { href: '/portefeuille', label: 'Argent',    icon: Wallet },
    { href: '/epargne',      label: 'Épargne',   icon: Target },
    { href: '/profile',      label: 'Profil',    icon: User },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          if (item.href === '/profile') {
            return (
              <Link
                key={item.href}
                href="/profile"
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[52px] transition-colors touch-target",
                  isActive ? "text-emerald-400" : "text-slate-500"
                )}
              >
                <div className={cn(
                  "relative w-5 h-5 rounded-full overflow-hidden border",
                  isActive ? "border-emerald-400" : "border-transparent bg-slate-700"
                )}>
                  {user?.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.full_name ?? ''}
                      fill
                      className="object-cover"
                      unoptimized
                      key={user.avatar_url}
                    />
                  ) : (
                    <User className="w-full h-full p-0.5" />
                  )}
                </div>
                <span className="text-[9px] font-medium leading-none">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[52px] transition-colors touch-target",
                isActive ? "text-emerald-400" : "text-slate-500"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
