import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWalletData } from '@/lib/actions/wallet.actions'
import { WalletCard } from '@/components/wallet/WalletCard'
import { WalletMovementRow } from '@/components/wallet/WalletMovementRow'
import { WithdrawWalletButton } from '@/components/wallet/WithdrawWalletButton'
import { formatFCFA } from '@/lib/utils/format'
import { Wallet, TrendingUp, PiggyBank, History, Sparkles, ShieldCheck, Download } from 'lucide-react'

export default async function PortefeuillePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await getWalletData()
  if (result.error || !result.data) redirect('/dashboard')

  const { wallet, movements } = result.data
  const hasBalance = Number(wallet.total_balance) > 0

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900/20 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -ml-32 -mb-32 rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              Compte Sécurisé
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Mon Portefeuille
            </h1>
            <p className="text-slate-400 max-w-md">
              Gère tes gains de tontines et tes épargnes débloquées en un seul endroit.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-inner">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Solde Total Disponible</p>
            <p className="text-5xl sm:text-6xl font-black text-white tracking-tighter">
              {formatFCFA(wallet.total_balance)}
            </p>
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mt-2">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Fonds prêts pour retrait
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Colonne Gauche: Détails et Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <WalletCard
              icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
              title="Cagnottes Tontine"
              balance={Number(wallet.tontine_balance)}
              lastCreditAt={wallet.last_tontine_credit_at}
              emptyMessage="Aucune cagnotte reçue"
              colorClass="border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all duration-300 group"
            />
            <WalletCard
              icon={<PiggyBank className="w-6 h-6 text-blue-400" />}
              title="Épargne Débloquée"
              balance={Number(wallet.savings_balance)}
              lastCreditAt={wallet.last_savings_credit_at}
              emptyMessage="Aucune épargne disponible"
              colorClass="border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all duration-300 group"
            />
          </div>

          {hasBalance ? (
            <div className="glass-card p-6 border-slate-800 space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Download className="w-5 h-5 text-emerald-400" />
                <h2 className="text-white font-bold">Retrait de fonds</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {Number(wallet.tontine_balance) > 0 && (
                  <WithdrawWalletButton
                    source="tontine"
                    maxAmount={Number(wallet.tontine_balance)}
                    label="Retirer mes cagnottes"
                    userId={user.id}
                  />
                )}
                {Number(wallet.savings_balance) > 0 && (
                  <WithdrawWalletButton
                    source="savings"
                    maxAmount={Number(wallet.savings_balance)}
                    label="Retirer mon épargne"
                    userId={user.id}
                  />
                )}
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
            </div>
          ) : (
             <div className="glass-card p-12 text-center border-dashed border-slate-800">
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Wallet className="w-8 h-8 text-slate-600" />
               </div>
               <p className="text-slate-400 text-sm">Ton portefeuille est vide pour le moment.</p>
               <p className="text-slate-600 text-xs mt-1">Tes gains apparaîtront automatiquement ici dès qu'une tontine est versée ou qu'un coffre arrive à échéance.</p>
             </div>
          )}
        </div>

        {/* Colonne Droite: Historique */}
        <div className="lg:col-span-1">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                Historique
              </h2>
              {movements.length > 0 && (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                  {movements.length} derniers
                </span>
              )}
            </div>

            <div className="glass-card border-slate-800 divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto scrollbar-hide">
              {movements.length > 0 ? (
                movements.map(m => (
                  <WalletMovementRow key={m.id} movement={m} />
                ))
              ) : (
                <div className="p-12 text-center space-y-2">
                  <p className="text-slate-600 text-sm italic">Aucun mouvement</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

