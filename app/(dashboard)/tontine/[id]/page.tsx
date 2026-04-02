import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GroupStatusBadge } from '@/components/tontine/GroupStatusBadge'
import { SolidarityPoolCard } from '@/components/tontine/SolidarityPoolCard'
import { TourTimeline } from '@/components/tontine/TourTimeline'
import { CotisationCard } from '@/components/tontine/CotisationCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, AlertCircle, Play } from 'lucide-react'
import { formatFCFA } from '@/lib/utils/format'
import { startGroup } from '@/lib/actions/tontine.actions'

export default async function TontineDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Récupérer le groupe
  const { data: group } = await supabase
    .from('tontine_groups')
    .select('*, solidarity_pool(balance)')
    .eq('id', params.id)
    .single()

  if (!group) redirect('/tontine')

  // 2. Récupérer les memberships
  const { data: memberships } = await supabase
    .from('memberships')
    .select('*, user:users(*)')
    .eq('group_id', params.id)

  const myMembership = memberships?.find(m => m.user_id === user!.id)
  if (!myMembership) redirect('/tontine')

  // 3. Récupérer ma cotisation en cours
  const { data: currentContrib } = await supabase
    .from('contributions')
    .select('*')
    .eq('membership_id', myMembership.id)
    .in('status', ['en_attente', 'retard', 'penalise'])
    .maybeSingle()

  const isCreator = group.creator_id === user!.id
  const potSize = group.amount * group.current_members
  const poolBalance = group.solidarity_pool?.[0]?.balance || 0

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/tontine">
           <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
             <h2 className="text-2xl font-bold">{group.name}</h2>
             <GroupStatusBadge status={group.status} />
          </div>
          <p className="text-sm text-muted-foreground flexitems-center gap-2 mt-1">
             <Users className="w-4 h-4 inline mr-1" /> {group.current_members}/{group.max_members} membres
             <span className="mx-2">•</span>
             Code d'invitation: <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">{group.invite_code}</span>
          </p>
        </div>
        
        {isCreator && group.status === 'en_attente' && (
          <form action={async () => {
             'use server'
             await startGroup(group.id)
          }}>
            <Button type="submit" disabled={group.current_members < 2} className="bg-emerald-600 hover:bg-emerald-700">
              <Play className="w-4 h-4 mr-2" /> Démarrer
            </Button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border rounded-xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Cagnotte par tour</h3>
              <div className="text-3xl font-extrabold text-primary">{formatFCFA(potSize)}</div>
              <p className="text-sm text-muted-foreground mt-2">Cotisation: {formatFCFA(group.amount)}</p>
            </div>
            <SolidarityPoolCard balance={poolBalance} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">Ma situation</h3>
            {currentContrib ? (
              <CotisationCard contribution={currentContrib as any} />
            ) : group.status === 'actif' ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl p-4 flex items-center justify-between">
                 <span className="font-medium">Tu es à jour pour ce tour.</span>
              </div>
            ) : (
              <div className="bg-muted rounded-xl p-4 text-muted-foreground text-sm flex items-center gap-2">
                 <AlertCircle className="w-4 h-4" /> La tontine n'a pas encore démarré.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Déroulement</h3>
            <Link href={`/tontine/${group.id}/members`}>
              <Button variant="link" size="sm">Gérer les membres</Button>
            </Link>
          </div>
          
          <div className="bg-card border rounded-xl p-4">
            <TourTimeline 
              memberships={memberships as any} 
              currentTurn={group.current_turn} 
              groupStatus={group.status} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}
