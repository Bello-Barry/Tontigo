import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { VaultProgressBar } from '@/components/epargne/VaultProgressBar'
import { VaultCountdown } from '@/components/epargne/VaultCountdown'
import { WithdrawButton } from '@/components/epargne/WithdrawButton'
import { DepositButton } from '@/components/epargne/DepositButton'
import { formatFCFA, formatDate } from '@/lib/utils/format'
import { Lock, LockOpen, Calendar } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default async function VaultDetailPage(props: Props) {
  const params = await props.params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vault } = await supabase
    .from('savings_vaults')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!vault) notFound()

  // Historique des versements
  const { data: contributions } = await supabase
    .from('savings_contributions')
    .select('*')
    .eq('vault_id', params.id)
    .order('paid_at', { ascending: false })

  const isUnlocked = vault.status === 'debloque'
  const isActive   = vault.status === 'actif'
  const progressPct = vault.target_amount
    ? Math.min(100, Math.round((vault.current_balance / vault.target_amount) * 100))
    : null

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">

      {/* En-tête */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          {isUnlocked
            ? <LockOpen className="w-8 h-8 text-emerald-400" />
            : <Lock className="w-8 h-8 text-amber-400" />
          }
          <div>
            <h1 className="text-xl font-bold text-white">{vault.name}</h1>
            {vault.description && <p className="text-slate-400 text-sm">{vault.description}</p>}
          </div>
        </div>

        {/* Solde */}
        <div className="text-center py-4">
          <p className="text-slate-400 text-sm">Solde actuel</p>
          <p className="text-4xl font-bold likelemba-gradient-text mt-1">
            {formatFCFA(vault.current_balance)}
          </p>
          {vault.target_amount && (
            <p className="text-slate-400 text-sm mt-1">
              sur {formatFCFA(vault.target_amount)} visés
            </p>
          )}
        </div>

        {/* Barre de progression */}
        {vault.target_amount && progressPct !== null && (
          <VaultProgressBar
            current={vault.current_balance}
            target={vault.target_amount}
            percentage={progressPct}
          />
        )}

        {/* Date de déblocage */}
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Calendar className="w-4 h-4" />
          {isUnlocked
            ? <span className="text-emerald-400 font-medium">Débloqué le {formatDate(vault.unlocked_at!)}</span>
            : <span>Se débloque le <strong className="text-white">{formatDate(vault.unlock_date)}</strong></span>
          }
        </div>
      </div>

      {/* Countdown */}
      {isActive && <VaultCountdown unlockDate={vault.unlock_date} />}

      {/* Message déblocage */}
      {isUnlocked && vault.current_balance > 0 && (
        <div className="glass-card p-4 text-center space-y-1">
          <p className="text-2xl">🎉</p>
          <p className="text-white font-bold">Ton coffre est débloqué !</p>
          <p className="text-slate-400 text-sm">Tu peux maintenant retirer ton épargne.</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {/* Bouton Ajouter — toujours visible si actif */}
        {isActive && (
          <DepositButton vaultId={vault.id} />
        )}

        {/* ⚠️ Bouton Retirer — UNIQUEMENT si débloqué */}
        {isUnlocked && vault.current_balance > 0 && (
          <WithdrawButton vault={vault} />
        )}

        {/* Message si pas encore débloqué */}
        {isActive && (
          <p className="text-slate-500 text-xs text-center">
            Le retrait sera disponible le {formatDate(vault.unlock_date)}
          </p>
        )}
      </div>

      {/* Historique des versements */}
      {contributions && contributions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-slate-300 font-semibold">Historique ({contributions.length})</h2>
          <div className="glass-card divide-y divide-slate-700/50">
            {contributions.map(c => (
              <div key={c.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-white text-sm">Versement</p>
                  <p className="text-slate-400 text-xs">{formatDate(c.paid_at)}</p>
                </div>
                <p className="text-emerald-400 font-semibold">+{formatFCFA(c.amount)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
