'use client'
import type { Contribution } from '@/lib/types'
import { formatFCFA, formatDate } from '@/lib/utils/format'
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react'

interface ContributionHistoryProps {
  contributions: Contribution[]
}

export function ContributionHistory({ contributions }: ContributionHistoryProps) {
  if (!contributions || contributions.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-slate-300 font-semibold">Historique des versements</h2>
        <div className="glass-card p-6 text-center text-slate-400">
          Aucun versement encore
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <h2 className="text-slate-300 font-semibold">Historique des versements ({contributions.length})</h2>
      <div className="glass-card divide-y divide-slate-700/50">
        {contributions.map(c => {
          const isPaid = c.status === 'paye'
          const isLate = c.status === 'retard'
          const isPending = c.status === 'en_attente'
          
          return (
            <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition">
              <div className="flex items-center gap-3 flex-1">
                {isPaid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : isLate ? (
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                )}
                <div>
                  <p className="text-white text-sm font-medium">
                    Cotisation
                    {c.penalty_amount ? ` + Amende` : ''}
                  </p>
                  <p className="text-slate-400 text-xs">
                    Échéance: {formatDate(c.due_date)}
                    {isPaid && c.paid_at && ` — Payé le ${formatDate(c.paid_at)}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${isPaid ? 'text-emerald-400' : isLate ? 'text-red-400' : 'text-blue-400'}`}>
                  {formatFCFA(c.amount + (c.penalty_amount || 0))}
                </p>
                {c.penalty_amount ? (
                  <p className="text-[10px] text-red-400 font-bold">
                    dont {formatFCFA(c.penalty_amount)} amende
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
