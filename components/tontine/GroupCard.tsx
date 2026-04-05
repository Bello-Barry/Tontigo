import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { GroupStatusBadge } from './GroupStatusBadge'
import { formatFCFA, getFrequencyLabel } from '@/lib/utils/format'
import { Users, Calendar, Award } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { TontineGroup } from '@/lib/types'

interface GroupCardProps {
  group: TontineGroup & {
    my_membership?: {
      turn_position: number
      total_paid: number
      has_received_payout: boolean
    }
  }
  myMembership?: {
    turn_position: number
    total_paid: number
    has_received_payout: boolean
  }
}

export function GroupCard({ group, myMembership }: GroupCardProps) {
  const potSize = group.amount * (group.current_members || 0)
  const member = myMembership || group.my_membership

  return (
    <Card className="glass-card hover:border-emerald-500/30 transition-all group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-lg leading-tight truncate text-white">{group.name}</CardTitle>
          <GroupStatusBadge status={group.status} />
        </div>
        <div className="text-2xl font-bold text-emerald-400 mt-1">
          {formatFCFA(potSize)}
          <span className="text-xs font-normal text-slate-400 ml-1">/ tour</span>
        </div>
      </CardHeader>
      
      <CardContent className="py-2 space-y-3 text-sm">
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5">
             <Calendar className="w-4 h-4 text-blue-400" />
             <span>Cotisation {getFrequencyLabel(group.frequency).toLowerCase()}</span>
          </div>
          <span className="font-semibold text-white">{formatFCFA(group.amount)}</span>
        </div>
        
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5">
             <Users className="w-4 h-4 text-emerald-400" />
             <span>Membres</span>
          </div>
          <span className="text-white font-medium">{group.current_members}/{group.max_members}</span>
        </div>

        {member && (
          <div className="mt-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Ma position</span>
              <span className="text-white font-bold">{member.turn_position}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Total versé</span>
              <span className="text-emerald-400 font-bold">{formatFCFA(member.total_paid)}</span>
            </div>
            {member.has_received_payout && (
              <div className="flex items-center gap-1.5 text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
                <Award className="w-3 h-3" />
                Cagnotte reçue
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4">
        <Link href={`/tontine/${group.id}`} className="w-full">
          <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
            Voir les détails
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
