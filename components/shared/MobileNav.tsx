import Link from 'next/link'
import { Home, Users, Target, Wallet } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export function MobileNav() {
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
      <Link href="/epargne" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
        <Target className="w-5 h-5" />
        <span className="text-[10px]">Épargne</span>
      </Link>
      <Link href="/transactions" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
        <Wallet className="w-5 h-5" />
        <span className="text-[10px]">Activité</span>
      </Link>
      <div className="flex flex-col items-center gap-1">
        <ThemeToggle />
        <span className="text-[10px] text-muted-foreground">Thème</span>
      </div>
    </nav>
  )
}
