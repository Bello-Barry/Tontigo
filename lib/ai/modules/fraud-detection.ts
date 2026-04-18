import { callAIJSON } from '../client'
import { serviceClient } from '@/lib/supabase/service'

type FraudAction = 'none' | 'flag' | 'alert_admin' | 'suspend' | 'block'

interface FraudDetectionResult {
  is_suspicious:    boolean
  fraud_score:      number  // 0-100
  fraud_types:      string[]
  evidence:         string[]
  recommended_action: FraudAction
  reasoning:        string
}

/**
 * Analyser une action utilisateur pour détecter une fraude potentielle.
 */
export async function detectFraud(params: {
  userId:      string
  actionType:  'join_group' | 'receive_payout' | 'report_member' | 'create_group'
  contextData: Record<string, any>
}): Promise<FraudDetectionResult> {
  const fallback: FraudDetectionResult = {
    is_suspicious:       false,
    fraud_score:         10,
    fraud_types:         [],
    evidence:            [],
    recommended_action:  'none',
    reasoning:           'Aucune anomalie détectée',
  }

  try {
    const { data: user } = await serviceClient
      .from('users')
      .select('trust_score, badge, total_groups_failed, status, created_at')
      .eq('id', params.userId)
      .single()

    if (!user) return fallback

    const { data: recentTx } = await serviceClient
      .from('transactions')
      .select('type, amount, created_at')
      .eq('user_id', params.userId)
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())

    const accountAgeDays = Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000)

    const prompt = `
Analyse cette action pour détecter une fraude potentielle dans une app de tontine.

UTILISATEUR :
- Score de confiance : ${user.trust_score}/100
- Badge : ${user.badge}
- Groupes échoués : ${user.total_groups_failed}
- Âge du compte : ${accountAgeDays} jours

ACTION ANALYSÉE :
- Type : ${params.actionType}
- Contexte : ${JSON.stringify(params.contextData)}

ACTIVITÉ RÉCENTE (7j) :
- Transactions : ${recentTx?.length ?? 0}

Retourne exactement ce JSON :
{
  "is_suspicious": <true|false>,
  "fraud_score": <entier 0-100>,
  "fraud_types": ["<type_fraude>"],
  "evidence": ["<preuve>"],
  "recommended_action": "<none|flag|alert_admin|suspend|block>",
  "reasoning": "<explication>"
}
`

    const result = await callAIJSON<FraudDetectionResult>({
      system: `Tu es un expert en détection de fraude financière.
               Tu analyses les comportements suspects dans les systèmes de tontine.`,
      prompt,
      maxTokens: 300,
      fallback,
    })

    if (result.fraud_score >= 70) {
      await serviceClient.from('security_alerts').insert({
        type:     'fraud_detection',
        severity: result.fraud_score >= 85 ? 'critical' : 'high',
        user_id:  params.userId,
        message:  `Fraude potentielle détectée : ${result.fraud_types.join(', ')}`,
        details:  result,
      })
    }

    await serviceClient.from('ai_analyses').insert({
      type:         'fraud_detection',
      subject_id:   params.userId,
      subject_type: 'user',
      score:        result.fraud_score,
      result:       result,
      action_taken: result.recommended_action,
    })

    return result
  } catch (error) {
    console.error('detectFraud failed:', error)
    return fallback
  }
}
