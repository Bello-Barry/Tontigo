'use client'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Lock, Unlock, TrendingUp } from "lucide-react"
import { formatFCFA, formatDate, getDaysUntil } from "@/lib/utils/format"
import type { SavingsVault } from "@/lib/types"
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export function VaultCard({ vault }: { vault: SavingsVault }) {
  const isUnlocked = vault.status === 'debloque'
  const isFinished = vault.status === 'termine'
  const daysLeft = getDaysUntil(vault.unlock_date)
  
  const progress = vault.target_amount ? Math.min(100, (vault.current_balance / vault.target_amount) * 100) : 0

  return (
    <Card className="glass-card hover:border-primary/30 transition-all flex flex-col relative overflow-hidden">
      {!isUnlocked && !isFinished && (
        <div className="absolute top-0 right-0 p-3 text-muted-foreground opacity-50">
          <Lock className="w-24 h-24 blur-lg" />
        </div>
      )}
      
      <CardContent className="p-5 flex-1 relative z-10 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg">{vault.name}</h3>
            {vault.description && <p className="text-xs text-muted-foreground">{vault.description}</p>}
          </div>
          {isUnlocked ? (
            <Badge className="bg-emerald-500/20 text-emerald-500 border-none"><Unlock className="w-3 h-3 mr-1"/> Débloqué</Badge>
          ) : isFinished ? (
            <Badge variant="secondary">Terminé</Badge>
          ) : (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-none"><Lock className="w-3 h-3 mr-1"/> Verrouillé</Badge>
          )}
        </div>

        <div className="text-3xl font-extrabold mb-1">{formatFCFA(vault.current_balance)}</div>
        {vault.target_amount && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 mb-1.5">
            <span>Progression</span>
            <span>{Math.round(progress)}% de {formatFCFA(vault.target_amount)}</span>
          </div>
        )}
        {vault.target_amount && <Progress value={progress} className="h-2 mb-4 bg-muted/50" />}

        {!isUnlocked && !isFinished && (
          <div className="mt-auto pt-4 flex items-center justify-between bg-muted/30 p-3 rounded-lg border text-sm">
            <span className="text-muted-foreground">Déblocage le:</span>
            <span className="font-semibold">{formatDate(vault.unlock_date)}</span>
          </div>
        )}

        <Link href={`/epargne/${vault.id}`} className="mt-4 w-full">
          <Button variant={isUnlocked ? "default" : "outline"} className="w-full">
            {isUnlocked ? "Retirer les fonds" : "Voir / Dépôt"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
