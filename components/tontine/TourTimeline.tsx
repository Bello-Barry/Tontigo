import { Check, CircleDot, Clock } from 'lucide-react'
import type { Membership, UserProfile } from '@/lib/types'

interface TourTimelineProps {
  memberships: (Membership & { user: UserProfile })[]
  currentTurn: number
  groupStatus: string
}

export function TourTimeline({ memberships, currentTurn, groupStatus }: TourTimelineProps) {
  const sorted = [...memberships].sort((a, b) => a.turn_position - b.turn_position)

  return (
    <div className="relative border-l-2 border-muted ml-4 space-y-6 pb-4">
      {sorted.map((m) => {
        const isPast = m.turn_position < currentTurn
        const isCurrent = m.turn_position === currentTurn && groupStatus === 'actif'
        const isFuture = m.turn_position > currentTurn || groupStatus === 'en_attente'

        return (
          <div key={m.id} className="relative pl-6">
            {/* Icone sur la ligne */}
            <div className={`absolute -left-[11px] top-1 rounded-full p-1 border-2 bg-background
              ${isPast ? 'border-primary text-primary' : 
                isCurrent ? 'border-orange-500 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 
                'border-muted-foreground text-muted-foreground'}
            `}>
              {isPast ? <Check className="w-3 h-3" /> : 
               isCurrent ? <CircleDot className="w-3 h-3 animate-pulse" /> : 
               <Clock className="w-3 h-3" />}
            </div>

            <div className={`p-3 rounded-lg border ${isCurrent ? 'bg-orange-500/5 border-orange-500/30' : 'bg-card'}`}>
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Tour {m.turn_position}</span>
                <span className="text-xs text-muted-foreground">
                  {m.has_received_payout ? 'Cagnotte versée' : isCurrent ? 'En cours de collecte' : 'En attente'}
                </span>
              </div>
              <p className="text-sm mt-1">{m.user.full_name}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
