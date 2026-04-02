import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MatchingBanner } from '@/components/matching/MatchingBanner'
import { findMatchingGroups } from '@/lib/actions/matching.actions'
import { EmptyState } from '@/components/shared/EmptyState'
import { MatchCard } from '@/components/matching/MatchCard'

export default async function MatchingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Dans cette ébauche, on utilise des filtres par défaut ou on récupère les requêtes actives
  // Si l'utilisateur n'a pas de requête active, on affiche les groupes potentiellement compatibles par défaut
  const { data: profile } = await supabase.from('users').select('*').eq('id', user!.id).single()
  
  const res = await findMatchingGroups({
    amount_min: 5000,
    amount_max: 500000,
    frequency: 'mensuel',
    min_trust_score: profile?.trust_score || 50
  })

  const matches = res.data || []

  return (
    <div className="space-y-8">
      <MatchingBanner />

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Groupes recommandés</h3>
        
        {matches.length === 0 ? (
          <EmptyState 
            title="Aucune correspondance parfaite" 
            description="Votre profil ne correspond actuellement à aucun groupe public ouvert. Augmentez votre score de confiance en créant ou en complétant des groupes privés pour accéder à de meilleures opportunités."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(match => (
              <MatchCard 
                key={match.group_id} 
                match={match} 
                onJoin={() => {}} // Note: En dev réel, cela appelerai une action cliente pour gérer l'état
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
