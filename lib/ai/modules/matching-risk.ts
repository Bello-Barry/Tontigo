import { callAIJSON } from '../client'
import { serviceClient } from '@/lib/supabase/service'

interface MatchingRiskResult {
  can_join:          boolean
  risk_score:        number
  group_risk_impact: number
  reasons:           string[]
  conditions:        string[]
}

/**
 * Évaluer le risque d'accepter un inconnu dans un groupe via matching.
 */
export async function assessMatchingRisk(params: {
  userId:  string
  groupId: string
}): Promise<MatchingRiskResult> {
  const fallback: MatchingRiskResult = {
    can_join:          true,
    risk_score:        30,
    group_risk_impact: 5,
    reasons:           [],
    conditions:        [],
  }

  try {
    const [userResult, groupResult] = await Promise.all([
      serviceClient.from('users')
        .select('trust_score, badge, total_groups_completed, total_groups_failed, created_at')
        .eq('id', params.userId)
        .single(),
      serviceClient.from('tontine_groups')
        .select('min_trust_score, amount, current_turn, max_members')
        .eq('id', params.groupId)
        .single(),
    ])

    const user  = userResult.data
    const group = groupResult.data

    if (!user || !group) return fallback

    const prompt = `
Évalue le risque d'accepter cet inconnu dans ce groupe via matching.

CANDIDAT :
- Trust Score : ${user.trust_score}/100
- Réussis : ${user.total_groups_completed} | Échoués : ${user.total_groups_failed}

GROUPE :
- Min requis : ${group.min_trust_score}/100
- Montant : ${group.amount} FCFA

Retourne exactement ce JSON :
{
  "can_join": <true|false>,
  "risk_score": <entier 0-100>,
  "group_risk_impact": <entier 0-20>,
  "reasons": ["<raison>"],
  "conditions": ["<condition>"]
}
`

    return await callAIJSON<MatchingRiskResult>({
      system: `Tu es un expert en gestion des risques pour les tontines.`,
      prompt,
      maxTokens: 250,
      fallback,
    })
  } catch (error) {
    console.error('assessMatchingRisk failed:', error)
    return fallback
  }
}
