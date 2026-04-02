import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { GroupStatusBadge } from './GroupStatusBadge'
import { formatFCFA, getFrequencyLabel } from '@/lib/utils/format'
import { Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { TontineGroup } from '@/lib/types'

export function GroupCard({ group }: { group: TontineGroup }) {
  const potSize = group.amount * group.current_members

  return (
    <Card className="glass-card hover:border-primary/30 transition-all group-hover:shadow-md flex flex-col">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-lg leading-tight truncate">{group.name}</CardTitle>
          <GroupStatusBadge status={group.status} />
        </div>
        <div className="text-3xl font-extrabold text-primary mt-2">
          {formatFCFA(potSize)}
          <span className="text-sm font-normal tracking-normal text-muted-foreground ml-1">/ tour</span>
        </div>
      </CardHeader>
      <CardContent className="py-4 space-y-3 flex-1 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-1.5">
             <Calendar className="w-4 h-4 text-blue-500" />
             <span>Cotisation {getFrequencyLabel(group.frequency).toLowerCase()}</span>
          </div>
          <span className="font-semibold text-foreground">{formatFCFA(group.amount)}</span>
        </div>
        
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-1.5">
             <Users className="w-4 h-4 text-emerald-500" />
             <span>Membres ({group.current_members}/{group.max_members})</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-emerald-500" 
                style={{ width: `${(group.current_members / group.max_members) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {group.status === 'actif' && (
           <div className="mt-4 p-3 bg-muted/50 rounded-md border text-xs">
             <span className="text-muted-foreground">Tour en cours:</span>{' '}
             <span className="font-medium">{group.current_turn} / {group.current_members}</span>
           </div>
        )}
      </CardContent>
      <CardFooter className="pt-3 border-t border-border/50 mt-auto">
        <Link href={`/tontine/${group.id}`} className="w-full">
          <Button variant="default" className="w-full">Voir les détails</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
