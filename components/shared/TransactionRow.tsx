'use client'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { formatFCFA, formatDateShort } from "@/lib/utils/format"

interface TransactionRowProps {
  tx: any
}

export function TransactionRow({ tx }: TransactionRowProps) {
  // Entrant: versement (tontine reçue) ou retrait_epargne (retour vers wallet)
  // Sortant: cotisation, avance dépôt épargne, abonnement, matching, ...
  const isIncoming = tx.type === 'versement' || tx.type === 'retrait_epargne'
  const isPaymentFee = tx.type === 'matching_fee' || tx.type === 'abonnement'

  return (
    <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`p-2 rounded-full ${isIncoming ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {isIncoming ? <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />}
        </div>
        <div>
          <p className="font-medium text-sm sm:text-base line-clamp-1">{tx.description || tx.type}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span>{formatDateShort(tx.created_at)}</span>
            {tx.wallet_used && (
              <>
                <span>•</span>
                <span className="uppercase font-medium border px-1 rounded">{tx.wallet_used}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${isIncoming ? 'text-emerald-500' : ''}`}>
          {isIncoming ? '+' : '-'}{formatFCFA(tx.amount)}
        </p>
        <Badge variant="outline" className="text-[10px] sm:text-xs font-normal mt-1 border-border bg-background">
          Succès
        </Badge>
      </div>
    </div>
  )
}
