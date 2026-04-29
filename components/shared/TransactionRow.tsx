'use client'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownRight, ArrowUpRight, PiggyBank, CircleDollarSign, Wallet, CreditCard, ShieldAlert, CheckCircle2, Clock } from "lucide-react"
import { formatFCFA, formatDateShort } from "@/lib/utils/format"
import { generateTransactionReceipt } from "@/lib/utils/pdf"
import { Download } from "lucide-react"

interface TransactionRowProps {
  tx: any
  profile?: any
}

export function TransactionRow({ tx }: TransactionRowProps) {
  // Entrant: versement (tontine reçue) ou retrait_epargne (retour vers wallet)
  // Sortant: cotisation, avance dépôt épargne, abonnement, matching, ...
  const isIncoming = tx.type === 'versement' || tx.type === 'retrait_epargne'
  
  const getIcon = () => {
    if (tx.status === 'failed') return <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
    switch (tx.type) {
      case 'epargne':
      case 'retrait_epargne':
        return <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5" />
      case 'cotisation':
      case 'versement':
        return <CircleDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
      case 'abonnement':
        return <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
      default:
        return isIncoming ? <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
    }
  }

  const getStatusColor = () => {
    switch (tx.status) {
      case 'success': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
      case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'failed':  return 'text-red-500 bg-red-500/10 border-red-500/20'
      default:        return 'text-slate-400 bg-slate-500/10'
    }
  }

  return (
    <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`p-2 rounded-full ${isIncoming ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {getIcon()}
        </div>
        <div>
          <p className="font-medium text-sm sm:text-base line-clamp-1">{tx.description || tx.type}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span>{formatDateShort(tx.created_at)}</span>
            {tx.wallet_used && (
              <>
                <span>•</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  tx.wallet_used === 'mtn' ? 'bg-yellow-400 text-black' : 'bg-red-600 text-white'
                }`}>
                  {tx.wallet_used}
                </span>
              </>
            )}
            {tx.external_reference && (
              <>
                <span>•</span>
                <span className="font-mono text-[10px]">Ref: {tx.external_reference.slice(0, 8)}...</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-sm sm:text-base ${isIncoming ? 'text-emerald-500' : 'text-slate-200'}`}>
          {isIncoming ? '+' : '-'}{formatFCFA(tx.amount)}
        </p>
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs border ${getStatusColor()}`}>
          {(tx.status === 'success' || tx.status === 'Réussi') && <CheckCircle2 className="w-3 h-3" />}
          {tx.status === 'pending' && <Clock className="w-3 h-3 animate-pulse" />}
          {tx.status === 'failed' && <ShieldAlert className="w-3 h-3" />}
          <span className="capitalize">
            {tx.status === 'success' ? 'Réussi' : tx.status === 'pending' ? 'En attente' : tx.status === 'failed' ? 'Échoué' : tx.status}
          </span>
        </div>

        {(tx.status === 'success' || tx.status === 'Réussi') && (
          <button 
            onClick={() => generateTransactionReceipt(tx, profile)}
            className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground hover:text-white transition-colors ml-auto"
          >
            <Download className="w-3 h-3" />
            <span>Reçu PDF</span>
          </button>
        )}
      </div>
    </div>
  )
}
