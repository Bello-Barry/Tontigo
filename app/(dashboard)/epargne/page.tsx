import { createServerSupabaseClient } from '@/lib/supabase/server'
import { VaultCard } from '@/components/epargne/VaultCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import type { SavingsVault } from '@/lib/types'

export default async function EpargneListPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: vaults } = await supabase
    .from('savings_vaults')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const activeVaults = vaults?.filter(v => ['actif', 'debloque'].includes(v.status)) as unknown as SavingsVault[] || []
  const finishedVaults = vaults?.filter(v => v.status === 'termine') as unknown as SavingsVault[] || []

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mon Épargne Bloquée</h2>
          <p className="text-muted-foreground mt-1">Protégez votre argent de vous-même.</p>
        </div>
        <Link href="/epargne/create">
          <Button className="bg-blue-600 hover:bg-blue-700"><PlusCircle className="w-4 h-4 mr-2" /> Nouveau Coffre</Button>
        </Link>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Coffres en cours</h3>
        {activeVaults.length === 0 ? (
          <EmptyState 
            title="Aucun coffre" 
            description="L'épargne bloquée vous permet de mettre de l'argent de côté de façon stricte, sans possibilité de retrait avant la date fixée."
            action={<Link href="/epargne/create"><Button variant="outline">Créer mon premier coffre</Button></Link>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeVaults.map(vault => (
              <VaultCard key={vault.id} vault={vault} />
            ))}
          </div>
        )}
      </div>

      {finishedVaults.length > 0 && (
        <div className="space-y-4 pt-8 border-t">
          <h3 className="font-semibold text-lg text-muted-foreground">Coffres terminés</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60 hover:opacity-100 transition-opacity">
            {finishedVaults.map(vault => (
              <VaultCard key={vault.id} vault={vault} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
