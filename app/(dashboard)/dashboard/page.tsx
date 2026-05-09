import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrustScoreBadge } from '@/components/shared/TrustScoreBadge'
import { formatFCFA } from '@/lib/utils/format'
import { Users, Target, Activity, ArrowRight, Wallet, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getWalletData } from '@/lib/actions/wallet.actions'
import { DashboardCharts } from '@/components/shared/DashboardCharts'
import { DashboardAIInsights } from '@/components/shared/DashboardAIInsights'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('users').select('*').eq('id', user!.id).single()
  
  // Portefeuille
  const walletResult = await getWalletData()
  const walletData = walletResult.data?.wallet

  // Statistiques rapides
  const { count: activeGroups } = await supabase
    .from('memberships')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('status', 'actif')

  const { data: myVaults } = await supabase
    .from('savings_vaults')
    .select('current_balance')
    .eq('user_id', user!.id)
    .eq('status', 'actif')

  const totalSavings = myVaults?.reduce((acc, vault) => acc + Number(vault.current_balance), 0) || 0

  // Récupérer les transactions pour les graphiques
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight truncate">Bonjour, {profile?.full_name?.split(' ')[0]} 👋</h2>
          <p className="text-muted-foreground text-sm mt-0.5 sm:mt-1 truncate">Voici le résumé de votre activité financière.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
           <span className="text-xs sm:text-sm text-muted-foreground">Score:</span>
           <TrustScoreBadge score={profile?.trust_score || 50} />
        </div>
      </div>

      {/* Widget Portefeuille */}
      {walletData && Number(walletData.total_balance) > 0 && (
        <Link href="/portefeuille">
          <div className="glass-card p-3 sm:p-4 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-400 text-xs truncate">💰 Disponible pour retrait</p>
                  <p className="text-emerald-400 font-bold text-lg sm:text-xl mt-0.5 truncate">
                    {formatFCFA(walletData.total_balance)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-xs sm:text-sm font-medium shrink-0">
                <span className="hidden sm:inline">Retirer</span> <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="glass-card border-green-500/20 shadow-lg shadow-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tontines Actives</CardTitle>
            <Users className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGroups || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Groupes en cours</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Épargne Bloquée</CardTitle>
            <Target className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFCFA(totalSavings)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total verrouillé</p>
          </CardContent>
        </Card>

        <Card className="glass-card relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Niveau Likelemba</CardTitle>
            <Activity className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{profile?.badge}</div>
            <p className="text-xs text-muted-foreground mt-1">Basé sur votre fiabilité</p>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Artificielle */}
      <DashboardAIInsights />

      {/* Graphiques Financiers */}
      <DashboardCharts transactions={transactions || []} />

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Mes Tontines
            </CardTitle>
            <CardDescription>Gérez vos cotisations et suivez les tours de table.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/tontine">
              <Button variant="outline" className="w-full justify-between group">
                Voir mes groupes
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Épargne Intelligente
            </CardTitle>
            <CardDescription>Mettez de l'argent de côté en toute sécurité.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/epargne">
              <Button variant="outline" className="w-full justify-between group">
                Gérer mes coffres
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
