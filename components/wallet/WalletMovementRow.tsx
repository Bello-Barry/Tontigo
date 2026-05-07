import { formatFCFA, formatDate } from '@/lib/utils/format'
import { TrendingUp, TrendingDown, PiggyBank, ArrowDownCircle } from 'lucide-react'

interface Movement {
  id:          string
  type:        string
  amount:      number
  description: string
  status:      'pending' | 'success' | 'failed'
  created_at:  string
}

const TYPE_CONFIG: Record<string, {
  icon:  React.ReactNode
  color: string
  sign:  '+' | '-'
}> = {
  tontine_credit:    { icon: <TrendingUp className="w-4 h-4" />,       color: 'text-emerald-400', sign: '+' },
  savings_credit:    { icon: <PiggyBank className="w-4 h-4" />,        color: 'text-blue-400',    sign: '+' },
  withdrawal_mtn:    { icon: <ArrowDownCircle className="w-4 h-4" />,  color: 'text-red-400',     sign: '-' },
  withdrawal_airtel: { icon: <ArrowDownCircle className="w-4 h-4" />,  color: 'text-red-400',     sign: '-' },
}

export function WalletMovementRow({ movement }: { movement: Movement }) {
  const config = TYPE_CONFIG[movement.type] ?? {
    icon:  <TrendingDown className="w-4 h-4" />,
    color: 'text-slate-400',
    sign:  '-' as const,
  }

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center ${config.color}`}>
          {config.icon}
        </div>
        <div>
          <p className="text-white text-sm font-medium truncate max-w-[180px]">
            {movement.description}
          </p>
          <p className="text-slate-500 text-xs">{formatDate(movement.created_at)}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className={`font-bold text-sm ${config.color}`}>
          {config.sign}{formatFCFA(movement.amount)}
        </p>
        {movement.status === 'pending' && (
          <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
            En attente
          </span>
        )}
        {movement.status === 'failed' && (
          <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">
            Échoué
          </span>
        )}
      </div>
    </div>
  )
}
