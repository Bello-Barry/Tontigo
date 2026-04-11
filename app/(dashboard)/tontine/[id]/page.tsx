import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { WalletSelector } from '@/components/shared/WalletSelector'
import { Loader2, AlertTriangle, CheckCircle2, Wallet, Calendar, Users, Copy } from 'lucide-react'
import type { Contribution } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { TourTimeline } from '@/components/tontine/TourTimeline'
import { CotisationCard } from '@/components/tontine/CotisationCard'
import { ContributionHistory } from '@/components/tontine/ContributionHistory'
import { MemberRow } from '@/components/tontine/MemberRow'
import { SolidarityPoolCard } from '@/components/tontine/SolidarityPoolCard'
import { GroupStatusBadge } from '@/components/tontine/GroupStatusBadge'
import { StartGroupButton } from '@/components/tontine/StartGroupButton'
import { CopyInviteCode } from '@/components/tontine/CopyInviteCode'
import { formatFCFA, getFrequencyLabel } from '@/lib/utils/format'
import { GroupChat } from '@/components/tontine/GroupChat'

interface Props {
  params: { id: string }
}

export default async function GroupDetailPage(props: Props) {
  const params = await props.params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Récupérer le groupe
  const { data: group, error: groupError } = await supabase
    .from('tontine_groups')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (!group || groupError) notFound()

  if (!group) notFound()

  // ─── VÉRIFICATION D'ACCÈS ─────────────────────────────────────
  // RÈGLE : le créateur a toujours accès, même si le membership
  // n'est pas encore visible (délai RLS après création).
  const isCreator = group.creator_id === user.id

  // Si pas créateur → vérifier le membership
  let myMembership: any = null

  if (isCreator) {
    // Le créateur : récupérer son membership directement par user_id + group_id
    // Utiliser .maybeSingle() sans redirect si null (il vient peut-être de créer)
    const { data: creatorMembership } = await supabase
      .from('memberships')
      .select('*')
      .eq('group_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()

    // Si le membership du créateur n'est pas encore visible (délai RLS),
    // construire un membership minimal pour ne pas bloquer l'affichage
    myMembership = creatorMembership ?? {
      id:                  'pending',
      group_id:            params.id,
      user_id:             user.id,
      turn_position:       1,
      guarantee_amount:    0,
      guarantee_paid:      false,
      total_paid:          0,
      total_penalties:     0,
      has_received_payout: false,
      payout_received_at:  null,
      status:              'actif',
      joined_at:           new Date().toISOString(),
    }
  } else {
    // Pas créateur → vérifier le membership normalement
    const { data: membershipData } = await supabase
      .from('memberships')
      .select('*')
      .eq('group_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membershipData) {
      // Vraiment pas membre → rediriger
      redirect('/tontine')
    }

    myMembership = membershipData
  }

  // Récupérer tous les membres avec leurs profils
  const { data: memberships } = await supabase
    .from('memberships')
    .select(`
      *,
      user:user_id (id, full_name, avatar_url, trust_score, badge, status)
    `)
    .eq('group_id', params.id)
    .order('turn_position', { ascending: true })

  // Récupérer la cotisation en cours de l'utilisateur
  const { data: myCotisation } = await supabase
    .from('contributions')
    .select('*')
    .eq('membership_id', myMembership.id)
    .in('status', ['en_attente', 'retard'])
    .order('due_date', { ascending: true })
    .limit(1)
    .maybeSingle()

  // Récupérer tout l'historique des versements
  const { data: contributionHistory } = await supabase
    .from('contributions')
    .select('*')
    .eq('membership_id', myMembership.id)
    .neq('status', 'penalise')
    .order('due_date', { ascending: false })

  // Récupérer le pool de solidarité
  const { data: solidarityPool } = await supabase
    .from('solidarity_pool')
    .select('*')
    .eq('group_id', params.id)
    .single()

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* En-tête groupe */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{group.name}</h1>
            {group.description && (
              <p className="text-slate-400 text-sm mt-1">{group.description}</p>
            )}
          </div>
          <GroupStatusBadge status={group.status} />
        </div>

        {/* Infos clés */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-700/50 rounded-xl p-3">
            <p className="text-slate-400 text-xs">Cotisation</p>
            <p className="text-white font-bold text-lg">{formatFCFA(group.amount)}</p>
            <p className="text-slate-400 text-xs">{getFrequencyLabel(group.frequency)}</p>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-3">
            <p className="text-slate-400 text-xs">Membres</p>
            <p className="text-white font-bold text-lg flex items-center gap-1">
              <Users className="w-4 h-4 text-emerald-400" />
              {group.current_members}/{group.max_members}
            </p>
            <p className="text-slate-400 text-xs">Tour {group.current_turn}</p>
          </div>
        </div>

        {/* Code invitation (si créateur et groupe en attente) */}
        {isCreator && group.status === 'en_attente' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <p className="text-emerald-400 text-xs mb-1">Code d'invitation</p>
            <div className="flex items-center justify-between">
              <code className="text-white font-mono text-lg tracking-widest">{group.invite_code}</code>
              <CopyInviteCode code={group.invite_code} />
            </div>
          </div>
        )}
      </div>

      {/* Démarrer le groupe (créateur uniquement, si en_attente et ≥ 2 membres) */}
      {isCreator && group.status === 'en_attente' && group.current_members >= 2 && (
        <StartGroupButton groupId={group.id} />
      )}

      {/* Ma cotisation à payer */}
      {group.status === 'actif' ? (
        <>
          {myCotisation && (
            <section className="space-y-3">
              <h2 className="text-slate-300 font-semibold">Ma cotisation à payer</h2>
              <CotisationCard
                contribution={myCotisation}
                penaltyRate={group.penalty_rate}
                userId={user.id}
              />
            </section>
          )}
        </>
      ) : (
        <section className="space-y-3">
          <h2 className="text-slate-300 font-semibold">Ma cotisation</h2>
          <div className="glass-card p-5 space-y-3">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-blue-400 text-sm font-medium">💡 Groupe en attente de démarrage</p>
              <p className="text-slate-300 text-sm mt-2">
                Montant de la cotisation: <span className="font-bold text-white">{formatFCFA(group.amount)}</span>
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Fréquence: <span className="font-semibold">{getFrequencyLabel(group.frequency)}</span>
              </p>
              <p className="text-slate-400 text-xs mt-3">
                Les versements seront disponibles une fois que le groupe sera démarré par le créateur.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Historique des versements */}
      {contributionHistory && contributionHistory.length > 0 && (
        <ContributionHistory contributions={contributionHistory as any} />
      )}

      {/* Timeline des tours */}
      {memberships && memberships.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-slate-300 font-semibold">Ordre des tours</h2>
          <TourTimeline
            memberships={memberships as any}
            currentTurn={group.current_turn}
            groupStatus={group.status}
          />
        </section>
      )}

      {/* Pool de solidarité */}
      {solidarityPool && (
        <SolidarityPoolCard balance={solidarityPool.balance} />
      )}

      {/* Liste des membres */}
      {memberships && (
        <section className="space-y-3">
          <h2 className="text-slate-300 font-semibold">
            Membres ({memberships.length})
          </h2>
          <div className="glass-card divide-y divide-slate-700/50">
            {memberships.map(m => (
              <MemberRow
                key={m.id}
                membership={m}
                isCurrentUser={m.user_id === user.id}
                isCreator={isCreator}
                groupId={group.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Floating Chat */}
      <GroupChat 
        groupId={group.id} 
        currentUserId={user.id} 
        members={memberships || []} 
      />
    </div>
  )
}
