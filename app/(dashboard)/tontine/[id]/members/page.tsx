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

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) redirect('/login')

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/tontine/${params.id}`}>
          <button className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">Membres du groupe</h2>
          <p className="text-slate-400 text-sm">{group.name}</p>
        </div>
      </div>

      <div className="glass-card divide-y divide-slate-700/50 overflow-hidden">
        {memberships?.map((m: any) => (
          <MemberRow
            key={m.id}
            membership={m}
            isCurrentUser={m.user_id === currentUser.id}
            isCreator={group.creator_id === currentUser.id}
            groupId={group.id}
          />
        ))}
      </div>
      
      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-sm text-red-400 flex items-start gap-3 mt-8">
        <Flag className="w-5 h-5 shrink-0" />
        <p>Le créateur peut signaler un membre comme <strong className="text-red-300">Fugitif</strong> s'il disparaît après avoir reçu sa cagnotte. Cela le bannit définitivement de Tontigo.</p>
      </div>
    </div>
  )
}
