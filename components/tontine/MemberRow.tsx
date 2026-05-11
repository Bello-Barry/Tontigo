import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TrustScoreBadge } from '@/components/shared/TrustScoreBadge'
import { CheckCircle2, AlertCircle, ShieldAlert, MoreVertical, Ban } from 'lucide-react'
import type { Membership, UserProfile } from '@/lib/types'
import { formatFCFA, sanitizeUrl } from '@/lib/utils/format'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface MemberRowProps {
  membership: Membership & { user: UserProfile }
  isCurrentUser: boolean
  isCreator: boolean
  groupId?: string
}

export function MemberRow({ membership, isCurrentUser, isCreator, groupId }: MemberRowProps) {
  const { user, turn_position, guarantee_amount, status, total_paid, has_received_payout } = membership

  return (
    <div className={`flex items-center justify-between p-3 sm:p-4 ${isCurrentUser ? 'bg-slate-800/30' : 'bg-transparent'}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
          {turn_position}
        </div>
        
        <Avatar className="h-10 w-10 border-slate-700">
          <AvatarImage src={sanitizeUrl(user.avatar_url) || ''} />
          <AvatarFallback className="bg-slate-700 text-slate-300">
            {user.full_name?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white flex items-center gap-1.5 text-xs sm:text-sm truncate">
            {user.full_name}
            {isCurrentUser && <span className="text-[8px] sm:text-[10px] bg-slate-700 text-slate-400 px-1 sm:px-1.5 py-0.5 rounded uppercase font-bold tracking-wider shrink-0">Moi</span>}
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
            <TrustScoreBadge score={user.trust_score} size="sm" />
            {status === 'fugitif' && <Badge variant="destructive" className="h-3.5 px-1 text-[8px] font-bold">Fugitif</Badge>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-white font-bold text-sm">{formatFCFA(total_paid)}</p>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Total versé</p>
        </div>

        {/* Status icon or Dropdown for actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {has_received_payout ? (
            <div className="p-1 sm:p-1.5 rounded-full bg-emerald-500/10 text-emerald-500" title="A déjà reçu sa cagnotte">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          ) : (
            <div className="p-1 sm:p-1.5 rounded-full bg-slate-800 text-slate-500" title="En attente de son tour">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}

          {isCreator && !isCurrentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-white">
                <DropdownMenuItem className="text-red-400 focus:text-red-400 flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  Signaler comme fugitif
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}
