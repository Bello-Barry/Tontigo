import { getTrustScoreColor, getTrustScoreBgColor, getTrustScoreLabel } from '@/lib/utils/trust-score'
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react'

interface TrustScoreBadgeProps {
  score: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TrustScoreBadge({ score, showIcon = true, size = 'md' }: TrustScoreBadgeProps) {
  const colorClass = getTrustScoreColor(score)
  const bgClass    = getTrustScoreBgColor(score)
  const label      = getTrustScoreLabel(score)

  let Icon = Shield
  if (score >= 80) Icon = ShieldCheck
  if (score < 50)  Icon = ShieldAlert

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-4 py-2 text-lg gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  }

  return (
    <div className={`inline-flex items-center rounded-full border font-bold ${sizeClasses[size]} ${bgClass} ${colorClass}`}>
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{score}/100</span>
      {size !== 'sm' && <span className="opacity-70 text-xs hidden sm:inline">({label})</span>}
    </div>
  )
}
