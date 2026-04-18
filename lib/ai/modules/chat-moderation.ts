import { callAIJSON } from '../client'
import { serviceClient } from '@/lib/supabase/service'

type ModerationAction = 'approved' | 'warn' | 'delete' | 'ban_user'

interface ModerationResult {
  action:       ModerationAction
  score:        number   // 0-100
  categories:   string[]
  reason:       string
  auto_applied: boolean
}

/**
 * Modérer automatiquement un message de chat.
 */
export async function moderateMessage(params: {
  messageId: string
  content:   string
  userId:    string
  groupId:   string
}): Promise<ModerationResult> {
  const fallback: ModerationResult = {
    action:       'approved',
    score:        5,
    categories:   [],
    reason:       'Message approuvé',
    auto_applied: false,
  }

  if (params.content.startsWith('[SYSTÈME]') || params.content.length < 3) {
    return fallback
  }

  try {
    const prompt = `
Modère ce message (français/lingala) pour Likelemba.

MESSAGE : "${params.content}"

Critères : Insultes, arnaques, harcèlement, spam, contournement plateforme.

Retourne exactement ce JSON :
{
  "action": "<approved|warn|delete|ban_user>",
  "score": <entier 0-100>,
  "categories": ["<catégorie>"],
  "reason": "<explication>",
  "auto_applied": <true|false>
}
`

    const result = await callAIJSON<ModerationResult>({
      system: `Tu es un modérateur de contenu pour une app financière africaine.`,
      prompt,
      maxTokens: 200,
      fallback,
    })

    if (result.score >= 65) {
      result.auto_applied = true

      if (result.action === 'delete' || result.action === 'ban_user') {
        await serviceClient.from('group_messages').update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        }).eq('id', params.messageId)

        await serviceClient.from('flagged_messages').insert({
          message_id:   params.messageId,
          reason:       result.categories.join(', '),
          ai_score:     result.score,
          ai_reasoning: result.reason,
          action_taken: result.action,
        })

        await serviceClient.from('security_alerts').insert({
          type:     'chat_violation',
          severity: result.action === 'ban_user' ? 'high' : 'medium',
          user_id:  params.userId,
          group_id: params.groupId,
          message:  `Message supprimé automatiquement : ${result.reason}`,
          details:  result,
        })
      }
    }

    return result
  } catch (error) {
    console.error('moderateMessage failed:', error)
    return fallback
  }
}
