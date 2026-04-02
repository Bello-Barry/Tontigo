import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VaultCard } from '@/components/epargne/VaultCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowDownRight, Info } from 'lucide-react'
import Link from 'next/link'
import { formatFCFA, formatDate, getDaysUntil } from '@/lib/utils/format'

export default async function VaultDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: vault } = await supabase
    .from('savings_vaults')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user!.id)
    .single()

  if (!vault) redirect('/epargne')

  const { data: contributions } = await supabase
    .from('savings_contributions')
    .select('*')
    .eq('vault_id', vault.id)
    .order('paid_at', { ascending: false })

  const isUnlocked = vault.status === 'debloque'
  const isFinished = vault.status === 'termine'
  const daysLeft = getDaysUntil(vault.unlock_date)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/epargne">
         <Button variant="ghost" size="sm" className="mb-2 -ml-3 text-muted-foreground"><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <VaultCard vault={vault as any} />
        </div>
        
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">Informations</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Créé le</span>
                <span className="font-medium">{formatDate(vault.created_at)}</span>
              </li>
              <li className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Date de déblocage</span>
                <span className="font-medium">{formatDate(vault.unlock_date)}</span>
              </li>
              <li className="flex justify-between pb-2">
                <span className="text-muted-foreground">Frais de retrait</span>
                <span className="font-medium">0.5% à la sortie</span>
              </li>
            </ul>
          </div>

          {!isUnlocked && !isFinished && (
            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex gap-3 text-orange-600">
              <Info className="w-5 h-5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold">Déblocage dans {daysLeft} jour(s)</p>
                <p className="mt-1 opacity-90">Les dépôts restent possibles, mais aucun retrait anticipé ne sera autorisé selon la règle de verrouillage Tontigo.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Historique des dépôts</h3>
        <div className="space-y-3">
          {contributions?.length === 0 ? (
            <div className="text-center p-8 bg-muted/30 rounded-xl text-muted-foreground text-sm">Aucun dépôt n'a encore été effectué.</div>
          ) : (
            contributions?.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-card border rounded-xl">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-full">
                     <ArrowDownRight className="w-4 h-4" />
                   </div>
                   <div>
                     <p className="font-medium">Dépôt</p>
                     <p className="text-xs text-muted-foreground">{formatDate(c.paid_at)}</p>
                   </div>
                 </div>
                 <div className="font-bold text-emerald-500">+{formatFCFA(c.amount)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
