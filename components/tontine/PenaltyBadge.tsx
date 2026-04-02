import { Badge } from '@/components/ui/badge'
import { getPenaltyLevel } from '@/lib/utils/penalty'
import { AlertTriangle } from 'lucide-react'

export function PenaltyBadge({ daysLate }: { daysLate: number }) {
  const level = getPenaltyLevel(daysLate)
  
  if (level === 'none') return null
  
  if (level === 'warning') {
    return (
      <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 gap-1">
        <AlertTriangle className="w-3 h-3" /> {daysLate} j de retard
      </Badge>
    )
  }
  
  return (
    <Badge variant="destructive" className="gap-1 animate-pulse">
      <AlertTriangle className="w-3 h-3" /> {daysLate} j de retard (Critique)
    </Badge>
  )
}
