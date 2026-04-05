'use client'

interface Props {
  current:    number
  target:     number
  percentage: number
}

export function VaultProgressBar({ current, target, percentage }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">Progression</span>
        <span className="text-emerald-400 font-medium">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
        <div 
          className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
