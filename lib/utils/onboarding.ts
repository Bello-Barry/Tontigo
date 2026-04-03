// Arrondissements et quartiers de Brazzaville
export const BRAZZAVILLE_QUARTIERS = [
  // Arrondissement 1 — Makélékélé
  'Makélékélé', 'Plateau des 15 ans', 'Mfilou-Ngamaba', 'Moungali II',
  // Arrondissement 2 — Bacongo
  'Bacongo', 'Matonge', 'Kinsoundi', 'Nganga-Lingolo',
  // Arrondissement 3 — Poto-Poto
  'Poto-Poto', 'Ouenzé Nord', 'Moungali',
  // Arrondissement 4 — Moungali
  'Moungali', 'Talangaï Nord', 'Mikalou',
  // Arrondissement 5 — Ouenzé
  'Ouenzé', 'Nkombo', 'Tié-Tié',
  // Arrondissement 6 — Talangaï
  'Talangaï', 'Massengo', 'Séka-Séka',
  // Arrondissement 7 — Mfilou
  'Mfilou', 'Ngamaba', 'Madibou',
  // Arrondissement 8 — Djiri
  'Djiri', 'Mbansou', 'Linzolo',
  // Autres zones
  'Centre-ville', 'La Plaine', 'La Corniche',
  'Autre',
] as const

export type QuartierBrazzaville = typeof BRAZZAVILLE_QUARTIERS[number]

// Professions courantes au Congo Brazzaville
export const PROFESSIONS = [
  'Salarié(e) du privé',
  'Fonctionnaire / Agent de l\'État',
  'Commerçant(e)',
  'Entrepreneur(e)',
  'Artisan(e)',
  'Agriculteur / Éleveur',
  'Étudiant(e)',
  'Enseignant(e)',
  'Professionnel(le) de santé',
  'Transporteur / Chauffeur',
  'Sans emploi',
  'Retraité(e)',
  'Autre',
] as const

export type Profession = typeof PROFESSIONS[number]

// Vérifier si un profil est complet
export function isProfileComplete(profile: {
  full_name?:     string | null
  date_of_birth?: string | null
  quartier?:      string | null
  profession?:    string | null
  wallet_mtn?:    string | null
  wallet_airtel?: string | null
  onboarding_done?: boolean
}): boolean {
  return !!(
    profile.full_name &&
    profile.full_name !== 'Utilisateur' &&
    profile.date_of_birth &&
    profile.quartier &&
    profile.profession &&
    (profile.wallet_mtn || profile.wallet_airtel) &&
    profile.onboarding_done
  )
}

// Calculer l'âge depuis la date de naissance
export function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// Vérifier âge minimum (18 ans)
export function isAdult(dateOfBirth: string): boolean {
  return calculateAge(dateOfBirth) >= 18
}
