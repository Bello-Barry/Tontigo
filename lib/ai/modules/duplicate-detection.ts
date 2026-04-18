import { callAIJSON } from '../client'
import { serviceClient } from '@/lib/supabase/service'

interface DuplicateDetectionResult {
  is_duplicate:       boolean
  similarity_score:   number  // 0-100
  matching_signals:   string[]
  suspected_user_ids: string[]
  recommended_action: 'none' | 'flag' | 'block'
}

/**
 * Détecter si un nouvel utilisateur pourrait être un compte dupliqué.
 */
export async function detectDuplicateAccount(
  newUserId: string
): Promise<DuplicateDetectionResult> {
  const fallback: DuplicateDetectionResult = {
    is_duplicate:       false,
    similarity_score:   5,
    matching_signals:   [],
    suspected_user_ids: [],
    recommended_action: 'none',
  }

  try {
    const { data: newUser } = await serviceClient
      .from('users')
      .select('phone, full_name, quartier, profession, wallet_mtn, wallet_airtel')
      .eq('id', newUserId)
      .single()

    if (!newUser) return fallback

    const { data: suspectUsers } = await serviceClient
      .from('users')
      .select('id, phone, full_name, quartier, profession, wallet_mtn, wallet_airtel')
      .in('status', ['banni', 'suspendu'])
      .neq('id', newUserId)
      .limit(50)

    if (!suspectUsers || suspectUsers.length === 0) return fallback

    const prompt = `
Détecte si ce nouvel utilisateur est un doublon d'un compte banni.

NOUVEAU :
- Nom : ${newUser.full_name}
- Quartier : ${newUser.quartier}
- Profession : ${newUser.profession}
- Wallets : ${newUser.wallet_mtn}, ${newUser.wallet_airtel}

SUSPECTS :
${suspectUsers.slice(0, 5).map(u => `- ${u.full_name} (${u.quartier}, ${u.profession})`).join('\n')}

Retourne exactement ce JSON :
{
  "is_duplicate": <true|false>,
  "similarity_score": <entier 0-100>,
  "matching_signals": ["<signal>"],
  "suspected_user_ids": [],
  "recommended_action": "<none|flag|block>"
}
`

    const result = await callAIJSON<DuplicateDetectionResult>({
      system: `Tu détectes les tentatives de contournement de ban.`,
      prompt,
      maxTokens: 250,
      fallback,
    })

    if (result.similarity_score >= 80) {
      await serviceClient.from('security_alerts').insert({
        type:     'duplicate_account',
        severity: 'high',
        user_id:  newUserId,
        message:  `Compte potentiellement dupliqué détecté (similarité: ${result.similarity_score}%)`,
        details:  result,
      })
    }

    return result
  } catch (error) {
    console.error('detectDuplicateAccount failed:', error)
    return fallback
  }
}
