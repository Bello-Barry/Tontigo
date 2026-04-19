import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWalletData } from '@/lib/actions/wallet.actions'
import { WalletCard } from '@/components/wallet/WalletCard'
import { WalletMovementRow } from '@/components/wallet/WalletMovementRow'
import { WithdrawWalletButton } from '@/components/wallet/WithdrawWalletButton'
import { formatFCFA, formatDate } from '@/lib/utils/format'
import { Wallet, TrendingUp, PiggyBank, History } from 'lucide-react'

export default async function PortefeuillePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await getWalletData()
  if (result.error || !result.data) redirect('/dashboard')

  const { wallet, movements } = result.data
  const hasBalance = Number(wallet.total_balance) > 0

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4 sm:space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Mon Portefeuille
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Fonds disponibles pour retrait
          </p>
        </div>
        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
          <Wallet className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      {/* Solde total */}
      <div className="glass-card p-5 sm:p-6 text-center space-y-2">
        <p className="text-slate-400 text-sm">Total disponible</p>
        <p className="text-4xl sm:text-5xl font-bold likelemba-gradient-text">
          {formatFCFA(wallet.total_balance)}
        </p>
        {!hasBalance && (
          <p className="text-slate-500 text-xs">
            Tes cagnottes et épargnes débloquées apparaîtront ici
          </p>
        )}
      </div>

      {/* Détail par source */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Cagnottes tontine */}
        <WalletCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          title="Cagnottes Tontine"
          balance={Number(wallet.tontine_balance)}
          lastCreditAt={wallet.last_tontine_credit_at}
          emptyMessage="Aucune cagnotte reçue"
          colorClass="border-emerald-500/20 bg-emerald-500/5"
        />

        {/* Épargne débloquée */}
        <WalletCard
          icon={<PiggyBank className="w-5 h-5 text-blue-400" />}
          title="Épargne Débloquée"
          balance={Number(wallet.savings_balance)}
          lastCreditAt={wallet.last_savings_credit_at}
          emptyMessage="Aucune épargne disponible"
          colorClass="border-blue-500/20 bg-blue-500/5"
        />
      </div>

      {/* Actions de retrait */}
      {hasBalance && (
        <div className="space-y-3">
          <h2 className="text-slate-300 font-semibold text-sm">Retirer mes fonds</h2>

          {/* Retrait cagnottes */}
          {Number(wallet.tontine_balance) > 0 && (
            <WithdrawWalletButton
              source="tontine"
              maxAmount={Number(wallet.tontine_balance)}
              label="Retirer mes cagnottes"
              userId={user.id}
            />
          )}

          {/* Retrait épargne */}
          {Number(wallet.savings_balance) > 0 && (
            <WithdrawWalletButton
              source="savings"
              maxAmount={Number(wallet.savings_balance)}
              label="Retirer mon épargne"
              userId={user.id}
            />
          )}

          {/* Retrait tout */}
          {Number(wallet.tontine_balance) > 0 && Number(wallet.savings_balance) > 0 && (
            <WithdrawWalletButton
              source="all"
              maxAmount={Number(wallet.total_balance)}
              label={`Tout retirer (${formatFCFA(wallet.total_balance)})`}
              userId={user.id}
              variant="primary"
            />
          )}
        </div>
      )}

      {/* Historique des mouvements */}
      {movements.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-slate-300 font-semibold flex items-center gap-2 text-sm">
            <History className="w-4 h-4" />
            Historique ({movements.length})
          </h2>
          <div className="glass-card divide-y divide-slate-700/50 overflow-hidden">
            {movements.map(m => (
              <WalletMovementRow key={m.id} movement={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
