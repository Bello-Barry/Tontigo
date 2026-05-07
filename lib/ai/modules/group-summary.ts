import { callAIJSON } from '../client'
import { serviceClient } from '@/lib/supabase/service'

interface GroupSummaryResult {
  summary:       string   // Résumé narratif (2-3 phrases)
  key_topics:    string[] // 3-5 sujets abordés
  mood:          'positif' | 'neutre' | 'tendu'
  action_items:  string[] // Ce qu'il faut retenir / faire
}

/**
 * Génère un résumé IA des derniers messages d'un groupe de tontine.
 * Utilisé pour aider les membres à rester à jour sans tout relire.
 */
export async function generateGroupSummary(params: {
  groupId: string
  limit?:  number
}): Promise<GroupSummaryResult | null> {
  const fallback: GroupSummaryResult = {
    summary:      'Aucun contenu à résumer pour le moment.',
    key_topics:   [],
    mood:         'neutre',
    action_items: [],
  }

  try {
    const { data: messages } = await serviceClient
      .from('group_messages')
      .select(`
        content, message_type, transcription, created_at,
        user:user_id (full_name)
      `)
      .eq('group_id', params.groupId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(params.limit ?? 50)

    if (!messages || messages.length < 5) return null

    // Construire un transcript anonymisé
    const transcript = messages
      .reverse()
      .map(m => {
        const user = m.user as any
        const name = user?.full_name?.split(' ')[0] ?? 'Membre'
        if (m.message_type === 'audio' && m.transcription) {
          return `${name}: 🎤 "${m.transcription}"`
        }
        if (m.message_type === 'audio') {
          return `${name}: 🎤 [Message vocal]`
        }
        return `${name}: ${m.content}`
      })
      .join('\n')

    const result = await callAIJSON<GroupSummaryResult>({
      system: `Tu es un assistant qui résume les discussions de groupes de tontine africains.
               Sois concis, bienveillant et pratique. Réponds en français.`,
      prompt: `Voici les derniers messages du groupe de tontine :

${transcript}

Génère un résumé structuré en JSON :
{
  "summary": "<résumé narratif de 2-3 phrases>",
  "key_topics": ["<sujet1>", "<sujet2>", "<sujet3>"],
  "mood": "<positif|neutre|tendu>",
  "action_items": ["<chose à retenir/faire>", "..."]
}`,
      maxTokens: 400,
      fallback,
    })

    // Sauvegarder le résumé en cache
    Promise.resolve(
      serviceClient.from('ai_analyses').insert({
        type:         'group_summary',
        subject_id:   params.groupId,
        subject_type: 'tontine_group',
        result,
      })
    ).catch(() => {})

    return result
  } catch (error) {
    console.error('generateGroupSummary failed:', error)
    return null
  }
}
