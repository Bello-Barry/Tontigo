import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GroupCard } from '@/components/tontine/GroupCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Plus, QrCode, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TontinePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Récupérer les memberships de l'utilisateur
  const { data: memberships } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  // Récupérer les groupes correspondants (même si memberships vide)
  let groups: any[] = []
  if (memberships && memberships.length > 0) {
    const groupIds = memberships.map(m => m.group_id)
    const { data: allGroups } = await supabase
      .from('tontine_groups')
      .select('*')
      .in('id', groupIds)

    // Combiner les données
    groups = memberships.map(m => {
      const g = allGroups?.find(group => group.id === m.group_id)
      if (!g) return null
      return {
        ...g,
        my_membership: {
          turn_position:    m.turn_position,
          total_paid:       m.total_paid,
          total_penalties:  m.total_penalties,
          has_received_payout: m.has_received_payout,
          status:           m.status,
          guarantee_amount: m.guarantee_amount,
        },
      }
    }).filter(Boolean)
  }

  const actifs     = groups.filter(g => g.status === 'actif')
  const enAttente  = groups.filter(g => g.status === 'en_attente')
  const termines   = groups.filter(g => g.status === 'termine')

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Mes Tontines</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">{groups.length} groupe{groups.length > 1 ? 's' : ''}</p>
        </div>
        <Link href="/tontine/create" className="shrink-0">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2" size="sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Créer</span>
          </Button>
        </Link>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Link href="/tontine/join">
          <button type="button" className="w-full glass-card p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:border-emerald-500/50 transition-colors touch-target">
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
            <span className="text-white text-xs sm:text-sm font-medium truncate">Rejoindre par code</span>
          </button>
        </Link>
        <Link href="/matching">
          <button type="button" className="w-full glass-card p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:border-emerald-500/50 transition-colors touch-target">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
            <span className="text-white text-xs sm:text-sm font-medium truncate">Trouver un groupe</span>
          </button>
        </Link>
      </div>

      {/* Groupes actifs */}
      {actifs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-slate-300 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            Actifs ({actifs.length})
          </h2>
          {actifs.map(g => <GroupCard key={g.id} group={g} myMembership={g.my_membership} />)}
        </section>
      )}

      {/* En attente */}
      {enAttente.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-slate-300 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
            En attente ({enAttente.length})
          </h2>
          {enAttente.map(g => <GroupCard key={g.id} group={g} myMembership={g.my_membership} />)}
        </section>
      )}

      {/* Terminés */}
      {termines.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-slate-300 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-500 rounded-full" />
            Terminés ({termines.length})
          </h2>
          {termines.map(g => <GroupCard key={g.id} group={g} myMembership={g.my_membership} />)}
        </section>
      )}

      {/* Empty state */}
      {groups.length === 0 && (
        <EmptyState
          title="Aucune tontine pour l'instant"
          description="Crée ton premier groupe ou rejoins-en un via un code d'invitation."
          action={
            <Link href="/tontine/create">
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                Créer un groupe
              </Button>
            </Link>
          }
        />
      )}
    </div>
  )
}
