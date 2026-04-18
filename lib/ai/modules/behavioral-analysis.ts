import { callAIJSON } from '../client'
import { serviceClient } from '@/lib/supabase/service'

interface BehavioralAnalysisResult {
  fugitive_risk_score: number  // 0-100
  behavioral_patterns: string[]
  warning_signs:       string[]
  recommended_action:  'monitor' | 'alert' | 'restrict' | 'none'
  confidence:          number
}

/**
 * Détecter les comportements typiques d'un membre qui va fuir.
 */
export async function analyzeFugitiveBehavior(params: {
  userId:      string
  membershipId: string
  groupId:     string
}): Promise<BehavioralAnalysisResult> {
  const fallback: BehavioralAnalysisResult = {
    fugitive_risk_score: 10,
    behavioral_patterns: [],
    warning_signs:       [],
    recommended_action:  'none',
    confidence:          0.5,
  }

  try {
    const { data: membership } = await serviceClient
      .from('memberships')
      .select('turn_position, total_paid, total_penalties, has_received_payout, payout_received_at')
      .eq('id', params.membershipId)
      .single()

    if (!membership) return fallback

    const { data: contributions } = await serviceClient
      .from('contributions')
      .select('days_late, status')
      .eq('membership_id', params.membershipId)
      .order('created_at', { ascending: true })

    const payoutDate = membership.payout_received_at
    const { data: messages } = await serviceClient
      .from('group_messages')
      .select('created_at')
      .eq('user_id', params.userId)
      .eq('group_id', params.groupId)

    const chatBefore = payoutDate ? messages?.filter(m => new Date(m.created_at) < new Date(payoutDate)).length : 0
    const chatAfter = payoutDate ? messages?.filter(m => new Date(m.created_at) > new Date(payoutDate)).length : 0

    const prompt = `
Analyse le risque de fuite de ce membre de tontine.

SITUATION :
- A déjà reçu sa cagnotte : ${membership.has_received_payout ? 'OUI' : 'Non'}
- Position tour : ${membership.turn_position}

ACTIVITÉ CHAT :
- Messages avant réception : ${chatBefore}
- Messages après réception : ${chatAfter}

PAIEMENTS :
- Retards récents : ${contributions?.slice(-3).filter(c => c.days_late > 0).length ?? 0}/3 derniers

Retourne exactement ce JSON :
{
  "fugitive_risk_score": <entier 0-100>,
  "behavioral_patterns": ["<pattern>"],
  "warning_signs": ["<signe>"],
  "recommended_action": "<none|monitor|alert|restrict>",
  "confidence": <décimal 0-1>
}
`

    const result = await callAIJSON<BehavioralAnalysisResult>({
      system: `Tu détectes les patterns de fuite dans les tontines.`,
      prompt,
      maxTokens: 300,
      fallback,
    })

    if (result.fugitive_risk_score >= 65) {
      await serviceClient.from('security_alerts').insert({
        type:     'fugitive_risk',
        severity: result.fugitive_risk_score >= 80 ? 'critical' : 'high',
        user_id:  params.userId,
        group_id: params.groupId,
        message:  `Risque de fuite détecté (score: ${result.fugitive_risk_score}/100)`,
        details:  result,
      })
    }

    return result
  } catch (error) {
    console.error('analyzeFugitiveBehavior failed:', error)
    return fallback
  }
}
