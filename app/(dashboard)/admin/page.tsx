import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { getRevenueStats } from '@/lib/actions/commission.actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatFCFA } from '@/lib/utils/format'
import { ShieldCheck, TrendingUp, Users, Wallet, AlertTriangle, ShieldAlert, MessageSquareOff, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: stats } = await getRevenueStats()
  const s = stats || { total: 0, byType: {}, last30Days: 0, last7Days: 0 }

  // 1. Alertes de sécurité non résolues
  const { data: alerts } = await serviceClient
    .from('security_alerts')
    .select('*')
    .eq('is_resolved', false)
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)

  // 2. Stats IA
  const { data: aiStats } = await serviceClient
    .from('ai_analyses')
    .select('type, score')

  const fraudCount = aiStats?.filter(a => a.type === 'fraud_detection' && (a.score || 0) >= 70).length || 0
  const moderationCount = aiStats?.filter(a => a.type === 'chat_moderation' && (a.score || 0) >= 65).length || 0

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto px-4 py-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
           <ShieldCheck className="w-8 h-8" /> Administration Likelemba
        </h2>
        <p className="text-muted-foreground mt-2">Tableau de bord fondateur, revenus et sécurité IA.</p>
      </div>

      {/* Revenus Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Revenus Totaux</span>
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-black text-primary">{formatFCFA(s.total)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">30 Derniers Jours</span>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold">{formatFCFA(s.last30Days)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Frais Cagnottes</span>
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{formatFCFA((s.byType as any)?.commission_payout || 0)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Matching / Pro</span>
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">
              {formatFCFA(((s.byType as any)?.matching_fee || 0) + ((s.byType as any)?.subscription || 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Section Sécurité IA (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-red-100 dark:border-red-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                <ShieldAlert className="w-5 h-5" /> Alertes de Sécurité IA
              </CardTitle>
              <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-bold uppercase">
                En attente
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {!alerts || alerts.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground italic">
                    Aucune alerte de sécurité pour le moment.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors flex items-start gap-4">
                      <div className={cn(
                        "p-2 rounded-xl shrink-0",
                        alert.severity === 'critical' ? "bg-red-100 text-red-600" :
                        alert.severity === 'high' ? "bg-orange-100 text-orange-600" :
                        "bg-yellow-100 text-yellow-600"
                      )}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                            alert.severity === 'critical' ? "bg-red-600 text-white" :
                            alert.severity === 'high' ? "bg-orange-600 text-white" :
                            "bg-yellow-500 text-white"
                          )}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{alert.message}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          Type: {alert.type} | {alert.details?.reasoning || alert.details?.reason || 'Analyse en cours'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0 font-bold">
                        Détails
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Stats IA Rapides (1/3) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Performance IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0 shadow-inner">
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black">{fraudCount}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase">Fraudes Détectées</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
                  <MessageSquareOff className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black">{moderationCount}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase">Messages Modérés</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-sm font-bold mb-3">Économie Estimée (Prévention)</div>
                <div className="text-3xl font-black text-emerald-500">
                  {formatFCFA(fraudCount * 10000 + moderationCount * 500)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  * Basé sur les défauts de paiement évités et le coût de modération manuelle.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
