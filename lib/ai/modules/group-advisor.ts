import { callAIJSON } from '../client'
import { serviceClient } from '@/lib/supabase/service'

interface GroupRecommendation {
  recommended_amount:    number
  recommended_frequency: 'quotidien' | 'hebdomadaire' | 'mensuel'
  recommended_penalty:   number
  recommended_max_members: number
  suggested_turn_order:  string[]  // user_ids dans l'ordre optimal
  risk_assessment:       'faible' | 'modéré' | 'élevé'
  risk_score:            number
  warnings:              string[]
  advice:                string
  compatibility_scores:  Record<string, number>  // userId → score compatibilité
}

/**
 * Suggérer les paramètres optimaux pour un nouveau groupe.
 */
export async function adviseGroupCreation(params: {
  creatorId:       string
  invitedUserIds:  string[]
  desiredAmount:   number
  desiredFrequency: string
}): Promise<GroupRecommendation> {
  const fallback: GroupRecommendation = {
    recommended_amount:      params.desiredAmount,
    recommended_frequency:   params.desiredFrequency as any,
    recommended_penalty:     5,
    recommended_max_members: params.invitedUserIds.length + 1,
    suggested_turn_order:    [],
    risk_assessment:         'modéré',
    risk_score:              50,
    warnings:                [],
    advice:                  'Groupe créé avec les paramètres par défaut.',
    compatibility_scores:    {},
  }

  try {
    const allUserIds = [params.creatorId, ...params.invitedUserIds]
    const { data: members } = await serviceClient
      .from('users')
      .select('id, trust_score, badge, total_groups_completed, total_groups_failed, profession')
      .in('id', allUserIds)

    if (!members || members.length < 2) return fallback

    const memberProfiles = members.map(m => ({
      id:          m.id,
      trust_score: m.trust_score,
      badge:       m.badge,
      completed:   m.total_groups_completed,
      failed:      m.total_groups_failed,
      profession:  m.profession ?? 'inconnue',
      is_creator:  m.id === params.creatorId,
    }))

    const avgTrustScore = memberProfiles.reduce((s, m) => s + m.trust_score, 0) / memberProfiles.length

    const prompt = `
Tu es un conseiller expert en tontines au Congo Brazzaville.
Analyse ce groupe et recommande les meilleurs paramètres.

MEMBRES DU GROUPE :
${memberProfiles.map(m => `
  - ${m.is_creator ? '[CRÉATEUR]' : '[MEMBRE]'}
    Score confiance: ${m.trust_score}/100 (${m.badge})
    Groupes réussis: ${m.completed} | Échoués: ${m.failed}
    Profession: ${m.profession}
`).join('')}

PARAMÈTRES SOUHAITÉS :
- Montant cotisation : ${params.desiredAmount} FCFA
- Fréquence : ${params.desiredFrequency}
- Nombre de membres : ${allUserIds.length}

CONTEXTE :
- Score de confiance moyen du groupe : ${Math.round(avgTrustScore)}/100

Recommande les paramètres optimaux pour minimiser les risques.
L'ordre des tours doit mettre les membres les plus fiables en premier.

Retourne exactement ce JSON :
{
  "recommended_amount": <entier FCFA>,
  "recommended_frequency": "<quotidien|hebdomadaire|mensuel>",
  "recommended_penalty": <décimal entre 2 et 15>,
  "recommended_max_members": ${allUserIds.length},
  "suggested_turn_order": ${JSON.stringify(memberProfiles.map(m => m.id))},
  "risk_assessment": "<faible|modéré|élevé>",
  "risk_score": <entier 0-100>,
  "warnings": ["<avertissement>"],
  "advice": "<conseil principal>",
  "compatibility_scores": {
    ${memberProfiles.map(m => `"${m.id}": <entier 0-100>`).join(',\n    ')}
  }
}
`

    return await callAIJSON<GroupRecommendation>({
      system: `Tu es un expert en tontines et microfinance africaine.
               Tu analyses les profils financiers pour créer des groupes équilibrés.`,
      prompt,
      maxTokens: 500,
      fallback,
    })

  } catch (error) {
    console.error('adviseGroupCreation failed:', error)
    return fallback
  }
}
