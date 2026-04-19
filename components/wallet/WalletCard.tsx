'use client'
import { formatFCFA, formatDate } from '@/lib/utils/format'

interface WalletCardProps {
  icon:         React.ReactNode
  title:        string
  balance:      number
  lastCreditAt: string | null
  emptyMessage: string
  colorClass:   string
}

export function WalletCard({
  icon, title, balance, lastCreditAt, emptyMessage, colorClass
}: WalletCardProps) {
  const isEmpty = balance <= 0

  return (
    <div className={`glass-card p-4 border ${colorClass} space-y-3`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-slate-300 text-sm font-medium">{title}</span>
      </div>

      {isEmpty ? (
        <div className="text-center py-4">
          <p className="text-slate-600 text-sm">{emptyMessage}</p>
          <div className="w-full h-1 bg-slate-700/50 rounded-full mt-3" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-white">{formatFCFA(balance)}</p>
          {lastCreditAt && (
            <p className="text-slate-500 text-xs">
              Dernier crédit : {formatDate(lastCreditAt)}
            </p>
          )}
          {/* Barre de remplissage visuelle */}
          <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-full" />
          </div>
        </>
      )}
    </div>
  )
}
