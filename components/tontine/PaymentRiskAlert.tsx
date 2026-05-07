'use client'
import { AlertTriangle, TrendingDown, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface PaymentRisk {
  userId:          string
  userName:        string
  risk_score:      number
  risk_level:      'low' | 'medium' | 'high' | 'critical'
  probability:     number
  main_factors:    string[]
  recommendation:  string
}

interface PaymentRiskAlertProps {
  risks: PaymentRisk[]
}

const LEVEL_CONFIG = {
  low:      { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Faible' },
  medium:   { color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20',  label: 'Moyen'  },
  high:     { color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20',  label: 'Élevé'  },
  critical: { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',        label: 'Critique'},
}

export function PaymentRiskAlert({ risks }: PaymentRiskAlertProps) {
  const [open, setOpen] = useState(false)
  const highRisks = risks.filter(r => r.risk_score >= 60)

  if (highRisks.length === 0) return null

  return (
    <div className="glass-card border border-orange-500/20 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-orange-500/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-left">
            <p className="text-orange-300 font-bold text-sm">
              ⚠️ {highRisks.length} alerte{highRisks.length > 1 ? 's' : ''} de risque détectée{highRisks.length > 1 ? 's' : ''}
            </p>
            <p className="text-slate-500 text-xs">Analyse IA — Risques de défaut de paiement</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {highRisks.map((risk, i) => {
            const cfg = LEVEL_CONFIG[risk.risk_level]
            return (
              <div key={i} className={`rounded-2xl border p-4 space-y-2 ${cfg.bg}`}>
                <div className="flex items-center justify-between">
                  <p className="text-white font-bold text-sm">{risk.userName}</p>
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
                    <TrendingDown className="w-3.5 h-3.5" />
                    Risque {cfg.label} ({risk.risk_score}/100)
                  </div>
                </div>

                {risk.main_factors.length > 0 && (
                  <ul className="space-y-0.5">
                    {risk.main_factors.map((f, j) => (
                      <li key={j} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-orange-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                <div className={`text-xs font-semibold ${cfg.color} border-t border-white/5 pt-2`}>
                  💡 {risk.recommendation}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
