import type { UserProfile, TontineGroup, MatchingProfile } from '@/lib/types'

export function calculateMatchScore(
  user: Pick<UserProfile, 'trust_score' | 'total_groups_completed'>,
  group: Pick<TontineGroup, 'min_trust_score'>
): number {
  let score = 0
  // Score de confiance suffisant : 40 points
  if (user.trust_score >= group.min_trust_score) score += 40
  // Bonus groupes complétés : max 30 points
  score += Math.min(user.total_groups_completed * 5, 30)
  // Bonus niveau confiance : max 30 points
  if (user.trust_score >= 80) score += 30
  else if (user.trust_score >= 60) score += 20
  else if (user.trust_score >= 40) score += 10
  return Math.min(score, 100)
}

export function sortGroupsByMatchScore(
  groups: TontineGroup[],
  user: UserProfile
): MatchingProfile[] {
  return groups
    .map(g => ({
      group_id:             g.id,
      group_name:           g.name,
      amount:               g.amount,
      frequency:            g.frequency,
      current_members:      g.current_members,
      max_members:          g.max_members,
      min_trust_score:      g.min_trust_score,
      creator_trust_score:  g.creator?.trust_score ?? 50,
      match_score:          calculateMatchScore(user, g),
    }))
    .filter(g => g.match_score >= 40) // Seuil minimum de compatibilité
    .sort((a, b) => b.match_score - a.match_score)
}
