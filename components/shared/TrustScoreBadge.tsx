import { getTrustScoreColor, getTrustScoreBgColor, getTrustScoreLabel } from '@/lib/utils/trust-score'
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react'

interface TrustScoreBadgeProps {
  score: number;
  showIcon?: boolean;
}

export function TrustScoreBadge({ score, showIcon = true }: TrustScoreBadgeProps) {
  const colorClass = getTrustScoreColor(score)
  const bgClass    = getTrustScoreBgColor(score)
  const label      = getTrustScoreLabel(score)

  let Icon = Shield
  if (score >= 80) Icon = ShieldCheck
  if (score < 50)  Icon = ShieldAlert

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm font-medium ${bgClass} ${colorClass}`}>
      {showIcon && <Icon className="w-4 h-4" />}
      <span>{score}/100</span>
      <span className="opacity-70 text-xs hidden sm:inline">({label})</span>
    </div>
  )
}
