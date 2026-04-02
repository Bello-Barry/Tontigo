import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TrustScoreBadge } from '@/components/shared/TrustScoreBadge'
import { CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react'
import type { Membership, UserProfile } from '@/lib/types'
import { formatFCFA } from '@/lib/utils/format'

interface MemberRowProps {
  membership: Membership & { user: UserProfile }
  isCurrentTurn: boolean
  hasPaidCurrentTurn: boolean
}

export function MemberRow({ membership, isCurrentTurn, hasPaidCurrentTurn }: MemberRowProps) {
  const { user, turn_position, guarantee_amount, status } = membership

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${isCurrentTurn ? 'bg-primary/5 border-primary/30' : 'bg-card'}`}>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm text-muted-foreground">
          {turn_position}
        </div>
        
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={user.avatar_url || ''} />
          <AvatarFallback>{user.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div>
          <p className="font-medium flex items-center gap-2">
            {user.full_name}
            {isCurrentTurn && <Badge variant="default" className="text-[10px] h-4 px-1">Bénéficiaire actuel</Badge>}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <TrustScoreBadge score={user.trust_score} showIcon={false} />
            {status === 'fugitif' && <Badge variant="destructive" className="text-[10px] h-4 px-1">Fugitif</Badge>}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        {hasPaidCurrentTurn ? (
          <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
             <CheckCircle2 className="w-4 h-4" /> Payé
          </div>
        ) : (
          <div className="flex items-center gap-1 text-orange-500 text-sm font-medium">
             <AlertCircle className="w-4 h-4" /> En attente
          </div>
        )}
        
        {guarantee_amount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1" title="Garantie anti-fuite exigée">
            <ShieldAlert className="w-3 h-3 text-orange-400" />
            Garantie: {formatFCFA(guarantee_amount)}
          </div>
        )}
      </div>
    </div>
  )
}
