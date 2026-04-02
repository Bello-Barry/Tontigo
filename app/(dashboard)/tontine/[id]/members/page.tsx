import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Flag } from 'lucide-react'
import { MemberRow } from '@/components/tontine/MemberRow'
import { reportFugitive } from '@/lib/actions/tontine.actions'

export default async function MembersPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  
  const { data: group } = await supabase.from('tontine_groups').select('*').eq('id', params.id).single()
  if (!group) redirect('/tontine')

  const { data: memberships } = await supabase
    .from('memberships')
    .select('*, user:users(*), contributions(*)')
    .eq('group_id', params.id)
    .order('turn_position', { ascending: true })

  // Fonction pour vérifier si un membre a payé le tour en cours
  const hasPaidCurrentTurn = (member: any) => {
    if (group.status !== 'actif') return false
    const contrib = member.contributions?.find((c: any) => c.status === 'paye' && new Date(c.created_at).getMonth() === new Date().getMonth())
    return !!contrib
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/tontine/${params.id}`}>
           <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Membres du groupe</h2>
          <p className="text-muted-foreground">{group.name}</p>
        </div>
      </div>

      <div className="space-y-4">
        {memberships?.map((m: any) => (
          <div key={m.id} className="group relative">
            <MemberRow 
              membership={m} 
              isCurrentTurn={m.turn_position === group.current_turn && group.status === 'actif'}
              hasPaidCurrentTurn={hasPaidCurrentTurn(m)}
            />
            {/* Action administrateur (Signaler fugitif) */}
            {group.status === 'actif' && m.status === 'actif' && m.has_received_payout && (
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-full pl-4">
                 <form action={async () => {
                   'use server'
                   await reportFugitive(group.id, m.user_id)
                 }}>
                   <Button type="submit" variant="destructive" size="sm" title="Signaler une fuite (Bannissement)">
                     <Flag className="w-4 h-4" />
                   </Button>
                 </form>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground flex items-start gap-3 mt-8">
        <Flag className="w-5 h-5 text-red-500 shrink-0" />
        <p>Les administrateurs peuvent signaler un membre ayant disparu après avoir reçu sa cagnotte en survolant la ligne du membre. Cela déclenche le profil <strong className="text-foreground">Fugitif</strong>, le bannit de Tontigo, et saisit sa garantie si applicable.</p>
      </div>
    </div>
  )
}
