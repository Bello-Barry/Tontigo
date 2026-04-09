import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getRevenueStats } from '@/lib/actions/commission.actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatFCFA } from '@/lib/utils/format'
import { ShieldCheck, TrendingUp, Users, Wallet } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Simple vérification: en prod on vérifierait un rôle "ADMIN"
  // Ici on laisse ouvert pour le test de développement, ou on vérifiera via middleware si c'est le founder

  const { data: stats } = await getRevenueStats()
  const s = stats || { total: 0, byType: {}, last30Days: 0, last7Days: 0 }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
           <ShieldCheck className="w-6 h-6" /> Administration Likelemba
        </h2>
        <p className="text-muted-foreground mt-1">Tableau de bord fondateur et revenus générés.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Revenus Totaux</span>
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-extrabold text-primary">{formatFCFA(s.total)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">30 Derniers Jours</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold">{formatFCFA(s.last30Days)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Frais de Cagnottes (1.5%)</span>
              <Wallet className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{formatFCFA((s.byType as any)?.commission_payout || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Matching / Pro</span>
              <Users className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">
              {formatFCFA(((s.byType as any)?.matching_fee || 0) + ((s.byType as any)?.subscription || 0))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
