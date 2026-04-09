import Link from 'next/link'
import { Home, Users, Wallet, Target, Activity, Settings } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card h-screen hidden md:flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <img src="/logo.png" alt="Likelemba Logo" className="w-10 h-10" />
        <h1 className="text-xl font-bold text-primary tracking-tight">Likelemba</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Home className="w-5 h-5" />
          <span>Tableau de bord</span>
        </Link>
        <Link href="/tontine" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Users className="w-5 h-5" />
          <span>Mes Tontines</span>
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
          <Wallet className="w-5 h-5" />
          <span>Transactions</span>
        </Link>
      </nav>

      <div className="p-4 border-t flex items-center justify-between">
        <Link href="/profile" className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-5 h-5" />
        </Link>
        <ThemeToggle />
      </div>
    </aside>
  )
}
