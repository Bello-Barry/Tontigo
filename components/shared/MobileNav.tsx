'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Users, Target, Wallet, User } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useAuthStore } from '@/lib/stores/authStore'

export function MobileNav() {
  const { user } = useAuthStore()

  return (
    <nav className="md:hidden fixed bottom-0 w-full border-t bg-card h-16 flex items-center justify-around px-2 pb-safe z-50">
      <Link href="/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Accueil</span>
      </Link>
      <Link href="/tontine" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
        <Users className="w-5 h-5" />
        <span className="text-[10px]">Tontines</span>
      </Link>
      <Link href="/portefeuille" className="flex flex-col items-center gap-1 text-emerald-500 hover:text-emerald-400 transition-colors">
        <Wallet className="w-5 h-5" />
        <span className="text-[10px]">Argent</span>
      </Link>
      <Link href="/epargne" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
        <Target className="w-5 h-5" />
        <span className="text-[10px]">Épargne</span>
      </Link>
      <Link href="/profil" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
        <div className="relative w-5 h-5 rounded-full overflow-hidden bg-slate-700">
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
            <User className="w-5 h-5" />
          )}
        </div>
        <span className="text-[10px]">Profil</span>
      </Link>
    </nav>
  )
}
