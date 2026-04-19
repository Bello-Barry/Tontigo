'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Users, Wallet, Target, Activity, Settings, LayoutDashboard } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useAuthStore } from '@/lib/stores/authStore'

export function Sidebar() {
  const { user } = useAuthStore()

  return (
    <aside className="w-64 border-r bg-card h-screen hidden md:flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <Image src="/logo.png" alt="Likelemba Logo" width={40} height={40} className="w-10 h-10" />
        <h1 className="text-xl font-bold text-primary tracking-tight">Likelemba</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <LayoutDashboard className="w-5 h-5" />
          <span>Tableau de bord</span>
        </Link>
        <Link href="/tontine" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Users className="w-5 h-5" />
          <span>Mes Tontines</span>
        </Link>
        <Link href="/portefeuille" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-emerald-400">
          <Wallet className="w-5 h-5" />
          <span>Portefeuille</span>
        </Link>
        <Link href="/matching" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Activity className="w-5 h-5" />
          <span>Matching</span>
        </Link>
        <Link href="/epargne" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Target className="w-5 h-5" />
          <span>Épargne Bloquée</span>
        </Link>
        <Link href="/transactions" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Activity className="w-5 h-5" />
          <span>Activité</span>
        </Link>
      </nav>

      <div className="p-4 border-t flex items-center justify-between">
        <Link href="/profil" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-700">
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
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {user?.full_name?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
            )}
          </div>
          <Settings className="w-5 h-5" />
        </Link>
        <ThemeToggle />
      </div>
    </aside>
  )
}
