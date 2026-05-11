'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  Home, Users, Wallet, Target, Activity, Settings, 
  LayoutDashboard, CreditCard, ShieldCheck, Sparkles 
} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useAuthStore } from '@/lib/stores/authStore'
import { cn } from '@/lib/utils'
import { sanitizeUrl } from "@/lib/utils/format"

export function Sidebar() {
  const { user } = useAuthStore()
  const pathname = usePathname()

  const navItems = [
    { label: 'Tableau de bord', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Mes Tontines', icon: Users, href: '/tontine' },
    { label: 'Portefeuille', icon: Wallet, href: '/portefeuille', highlight: true },
    { label: 'Matching AI', icon: Sparkles, href: '/matching' },
    { label: 'Coffre-fort', icon: Target, href: '/epargne' },
    { label: 'Transactions', icon: CreditCard, href: '/transactions' },
  ]

  return (
    <aside className="w-72 bg-slate-950/50 backdrop-blur-xl border-r border-white/5 h-screen hidden md:flex flex-col relative z-20 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-500 opacity-50" />
      
      {/* Logo Section */}
      <div className="p-8 flex items-center gap-4 group cursor-pointer">
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 p-[1px]">
          <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center overflow-hidden">
            <Image src="/logo.png" alt="Likelemba" width={32} height={32} className="group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="absolute inset-0 bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Likelemba</h1>
          <span className="text-[10px] text-emerald-500 font-bold tracking-[0.2em] mt-1">ÉCONOMIE SOCIALE</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-white/10 text-white shadow-lg shadow-black/20" 
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-full" />
              )}
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-emerald-400" : "group-hover:text-emerald-300",
                item.highlight && !isActive && "text-emerald-500/70"
              )} />
              <span className="text-sm font-semibold tracking-wide">{item.label}</span>
              {item.highlight && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Profile & Settings Footer */}
      <div className="p-6 mt-auto">
        <div className="p-4 rounded-3xl bg-white/5 border border-white/5 space-y-4">
          <Link href="/profile" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/50 transition-all">
              {user?.avatar_url ? (
                <Image src={sanitizeUrl(user.avatar_url)!} alt={user.full_name ?? ''} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
                  {user?.full_name?.[0] ?? '?'}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">{user?.full_name?.split(' ')[0] ?? 'Utilisateur'}</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold uppercase tracking-wider">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" /> Profil Vérifié
              </span>
            </div>
          </Link>
          
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <ThemeToggle />
            <Link href="/settings" className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
