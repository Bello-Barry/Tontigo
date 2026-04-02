export type TrustEvent =
  | 'on_time_payment'
  | 'late_payment'
  | 'elimination'
  | 'group_completed'
  | 'dispute_filed_against'
  | 'fugitive'

export function getTrustScoreDelta(event: TrustEvent, daysLate?: number): number {
  switch (event) {
    case 'on_time_payment':        return +2
    case 'late_payment':           return daysLate ? -Math.min(daysLate * 2, 15) : -5
    case 'elimination':            return -20
    case 'group_completed':        return +10
    case 'dispute_filed_against':  return -15
    case 'fugitive':               return -50
    default:                       return 0
  }
}

export function getTrustScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

export function getTrustScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30'
  if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30'
  if (score >= 40) return 'bg-orange-500/20 border-orange-500/30'
  return 'bg-red-500/20 border-red-500/30'
}

export function getTrustScoreLabel(score: number): string {
  if (score >= 80) return 'Expert'
  if (score >= 60) return 'Fiable'
  if (score >= 40) return 'Nouveau'
  return 'À risque'
}
