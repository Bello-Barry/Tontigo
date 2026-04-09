import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TransactionRow } from '@/components/shared/TransactionRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatFCFA } from '@/lib/utils/format'

export default async function TransactionsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)
    
  const txs = transactions || []
  
  const totalIn = txs.filter(t => t.type === 'versement' || t.type === 'retrait_epargne').reduce((a, b) => a + b.amount, 0)
  const totalOut = txs.filter(t => t.type !== 'versement' && t.type !== 'retrait_epargne').reduce((a, b) => a + b.amount, 0)

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
        <p className="text-muted-foreground mt-1">Historique de vos paiements mobiles.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
             <div className="p-3 bg-red-500/10 text-red-500 rounded-full">
               <ArrowUpRight className="w-5 h-5" />
             </div>
             <div>
               <p className="text-sm text-muted-foreground font-medium">Débité</p>
               <p className="text-xl font-bold">{formatFCFA(totalOut)}</p>
             </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-emerald-500/20">
          <CardContent className="p-4 flex items-center gap-4">
             <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full">
               <ArrowDownRight className="w-5 h-5" />
             </div>
             <div>
               <p className="text-sm text-muted-foreground font-medium">Reçu (MTN/Airtel)</p>
               <p className="text-xl font-bold text-emerald-500">{formatFCFA(totalIn)}</p>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {txs.length === 0 ? (
          <EmptyState title="Aucune transaction" description="Vous n'avez pas encore effectué de paiements sur Likelemba." />
        ) : (
          txs.map(tx => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </div>
    </div>
  )
}
