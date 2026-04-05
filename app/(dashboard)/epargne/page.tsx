import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VaultCard } from '@/components/epargne/VaultCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { formatFCFA } from '@/lib/utils/format'
import { Plus, Lock } from 'lucide-react'
import Link from 'next/link'

export default async function EpargnePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Récupérer tous les coffres de l'utilisateur
  const { data: vaults } = await supabase
    .from('savings_vaults')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'termine')
    .order('created_at', { ascending: false })

  const totalBalance = vaults?.reduce((sum, v) => sum + (v.current_balance ?? 0), 0) ?? 0
  const activeVaults = vaults?.filter(v => v.status === 'actif') ?? []
  const unlockedVaults = vaults?.filter(v => v.status === 'debloque') ?? []

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Épargne</h1>
          <p className="text-slate-400 text-sm mt-1">{vaults?.length ?? 0} coffre{(vaults?.length ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <Link href="/epargne/create">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
            <Plus className="w-4 h-4" />
            Nouveau coffre
          </Button>
        </Link>
      </div>

      {/* Solde total */}
      {(vaults?.length ?? 0) > 0 && (
        <div className="glass-card p-5 space-y-1">
          <p className="text-slate-400 text-sm flex items-center gap-2">
            <Lock className="w-4 h-4" /> Total épargné (bloqué)
          </p>
          <p className="text-3xl font-bold tontigo-gradient-text">{formatFCFA(totalBalance)}</p>
          <p className="text-slate-500 text-xs">
            {activeVaults.length} coffre{activeVaults.length > 1 ? 's' : ''} actif{activeVaults.length > 1 ? 's' : ''}
            {unlockedVaults.length > 0 && ` · ${unlockedVaults.length} prêt${unlockedVaults.length > 1 ? 's' : ''} au retrait`}
          </p>
        </div>
      )}

      {/* Coffres débloqués (priorité visuelle) */}
      {unlockedVaults.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-slate-300 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Prêts au retrait ({unlockedVaults.length})
          </h2>
          {unlockedVaults.map(v => <VaultCard key={v.id} vault={v} />)}
        </section>
      )}

      {/* Coffres actifs */}
      {activeVaults.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-slate-300 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
            En cours ({activeVaults.length})
          </h2>
          {activeVaults.map(v => <VaultCard key={v.id} vault={v} />)}
        </section>
      )}

      {/* Empty state */}
      {(vaults?.length ?? 0) === 0 && (
        <EmptyState
          title="Aucun coffre d'épargne"
          description="Crée ton premier coffre et commence à épargner. L'argent reste bloqué jusqu'à la date que tu choisis."
          action={
            <Link href="/epargne/create">
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                Créer un coffre
              </Button>
            </Link>
          }
        />
      )}
    </div>
  )
}
