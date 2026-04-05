import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Récupérer ses memberships
  const { data: memberships, error: mError } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', user.id)

  // Récupérer tous les groupes
  const { data: allGroups, error: gError } = await supabase
    .from('tontine_groups')
    .select('*')

  // Récupérer l'invite code du groupe connu
  const { data: knownGroup } = await supabase
    .from('tontine_groups')
    .select('*')
    .eq('id', '4f890867-c75d-45b2-a31e-7bf62297a1c8')
    .single()

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 text-white">
      <h1 className="text-3xl font-bold">🔍 DEBUG PAGE</h1>

      {/* User info */}
      <div className="bg-slate-900 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-3">👤 User Connecté</h2>
        <pre className="text-sm bg-slate-800 p-3 rounded overflow-auto">
          {JSON.stringify({ id: user.id, email: user.email, phone: user.phone }, null, 2)}
        </pre>
      </div>

      {/* Memberships */}
      <div className="bg-slate-900 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-3">📋 Memberships ({memberships?.length ?? 0})</h2>
        {mError && <p className="text-red-400">Erreur: {mError.message}</p>}
        {memberships && memberships.length > 0 ? (
          <pre className="text-sm bg-slate-800 p-3 rounded overflow-auto max-h-96">
            {JSON.stringify(memberships, null, 2)}
          </pre>
        ) : (
          <p className="text-yellow-400">Aucun membership trouvé pour cet utilisateur</p>
        )}
      </div>

      {/* Groups */}
      <div className="bg-slate-900 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-3">🏘️ Tous les Groupes ({allGroups?.length ?? 0})</h2>
        {gError && <p className="text-red-400">Erreur: {gError.message}</p>}
        {allGroups && allGroups.length > 0 ? (
          <pre className="text-sm bg-slate-800 p-3 rounded overflow-auto max-h-96">
            {JSON.stringify(
              allGroups.map(g => ({
                id: g.id,
                name: g.name,
                creator_id: g.creator_id,
                invite_code: g.invite_code,
                status: g.status,
              })),
              null,
              2
            )}
          </pre>
        ) : (
          <p className="text-yellow-400">Aucun groupe trouvé</p>
        )}
      </div>

      {/* Known group detail */}
      <div className="bg-slate-900 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-3">🎯 Groupe Connu (4f890867-c75d-45b2-a31e-7bf62297a1c8)</h2>
        {knownGroup ? (
          <pre className="text-sm bg-slate-800 p-3 rounded overflow-auto">
            {JSON.stringify(knownGroup, null, 2)}
          </pre>
        ) : (
          <p className="text-gray-400">Groupe non trouvé</p>
        )}
      </div>

      {/* Stats */}
      <div className="bg-emerald-900/30 border border-emerald-500/30 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-2">📊 Résumé</h3>
        <ul className="space-y-2 text-sm">
          <li>User ID: <code className="bg-slate-800 px-2 py-1 rounded">{user.id}</code></li>
          <li>Memberships: <strong>{memberships?.length ?? 0}</strong></li>
          <li>Groupes totaux: <strong>{allGroups?.length ?? 0}</strong></li>
          <li>Invite code du groupe connu: <code className="bg-slate-800 px-2 py-1 rounded">{knownGroup?.invite_code ?? 'NULL'}</code></li>
        </ul>
      </div>
    </div>
  )
}
