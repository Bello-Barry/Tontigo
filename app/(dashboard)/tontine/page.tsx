import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GroupCard } from '@/components/tontine/GroupCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { PlusCircle, Search } from 'lucide-react'
import Link from 'next/link'
import type { TontineGroup } from '@/lib/types'

export default async function TontineListPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: memberships } = await supabase
    .from('memberships')
    .select('group_id')
    .eq('user_id', user!.id)

  let groups: TontineGroup[] = []
  
  if (memberships && memberships.length > 0) {
    const groupIds = memberships.map(m => m.group_id)
    const { data } = await supabase
      .from('tontine_groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false })
      
    if (data) groups = data as unknown as TontineGroup[]
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mes Tontines</h2>
          <p className="text-muted-foreground mt-1">Gérez vos groupes et cotisations.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/tontine/join">
            <Button variant="outline"><Search className="w-4 h-4 mr-2" /> Rejoindre</Button>
          </Link>
          <Link href="/tontine/create">
            <Button><PlusCircle className="w-4 h-4 mr-2" /> Créer</Button>
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState 
          title="Aucune tontine" 
          description="Vous ne participez à aucun groupe pour le moment. Rejoignez un groupe existant ou créez le vôtre."
          action={
            <Link href="/tontine/create"><Button>Créer un groupe</Button></Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
