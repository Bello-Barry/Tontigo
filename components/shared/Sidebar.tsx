import Link from 'next/link'
import { Home, Users, Wallet, Target, Activity } from 'lucide-react'

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card h-screen hidden md:flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary tracking-tight">Tontigo<span className="text-green-500">.</span></h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
          <Home className="w-5 h-5" />
          <span>Tableau de bord</span>
        </Link>
        <Link href="/tontine" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
          <Users className="w-5 h-5" />
          <span>Mes Tontines</span>
        </Link>
        <Link href="/matching" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
          <Activity className="w-5 h-5" />
          <span>Matching</span>
        </Link>
        <Link href="/epargne" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
          <Target className="w-5 h-5" />
          <span>Épargne Bloquée</span>
        </Link>
        <Link href="/transactions" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
          <Wallet className="w-5 h-5" />
          <span>Transactions</span>
        </Link>
      </nav>
    </aside>
  )
}
