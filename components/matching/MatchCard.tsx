'use client'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Calendar, Users } from "lucide-react"
import { formatFCFA } from "@/lib/utils/format"
import { Button } from "@/components/ui/button"
import type { MatchingProfile } from "@/lib/types"

interface MatchCardProps {
  match: MatchingProfile
  onJoin: (groupId: string) => void
  isLoading?: boolean
}

export function MatchCard({ match, onJoin, isLoading }: MatchCardProps) {
  return (
    <Card className="glass-card hover:border-primary/40 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{match.group_name}</CardTitle>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {match.match_score}% Compatible
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-3 rounded-lg">
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3"/> Montant/Tour</span>
            <span className="font-semibold">{formatFCFA(match.amount)}</span>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3"/> Places dispo</span>
            <span className="font-semibold">{match.max_members - match.current_members} places</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Score créateur: {match.creator_trust_score}/100 • Score min. requis: {match.min_trust_score}/100
        </div>

        <Button className="w-full" onClick={() => onJoin(match.group_id)} disabled={isLoading}>
          {isLoading ? "Connexion..." : "Rejoindre via Matching (500 FCFA)"}
        </Button>
      </CardContent>
    </Card>
  )
}
