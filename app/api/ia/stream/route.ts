import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Non authentifié', { status: 401 })
    }

    const { message, history, conversationId } = await req.json()

    if (!message?.trim()) {
      return new Response('Message vide', { status: 400 })
    }

    const coreMessages = [
      ...history.map((m: any) => ({
        role: m.role,
        content: m.content || '',
      })),
      { role: 'user', content: message.trim() },
    ]

    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: `Tu es le "Coach Likelemba", l'assistant d'intelligence artificielle intégré à l'application Likelemba (anciennement Tontigo).
La plateforme aide les utilisateurs d'Afrique francophone (notamment au Congo, Brazzaville) à gérer leurs finances personnelles à travers l'épargne collaborative (les Tontines/Likelemba) et l'épargne individuelle (les coffres-forts).

Ton but est d'aider les utilisateurs, de répondre à leurs questions sur la plateforme et de leur donner d'excellents conseils financiers pour éviter les pénalités et faire grandir leur « Trust Score » (Score de Confiance).

Règles :
- Sois très chaleureux, encourageant et concis.
- Utilise un langage clair, simple (français sans jargon complexe) et accessible.
- Tu peux glisser quelques mots d'argot local congolais avec modération (ex: Mbote, Ko luka, etc.) pour créer du lien.
- Tu as interdiction de donner des conseils financiers légaux qui engageraient ta responsabilité, ajoute des clauses de style "C'est un conseil personnel" si on te demande d'investir de grosses sommes.
- Si on te demande qui t'a créé, réponds "L'équipe d'ingénierie de Likelemba propulsée par Gemini".`,
      messages: coreMessages,
      onFinish: async (event) => {
        const fullReply = event.text
        let targetId = conversationId

        if (!targetId) {
          const title = message.slice(0, 50) + (message.length > 50 ? '...' : '')
          const { data: conv } = await serviceClient
            .from('ai_conversations')
            .insert({ user_id: user.id, title })
            .select('id')
            .single()
          if (conv) targetId = conv.id
        }

        if (targetId) {
          await serviceClient.from('ai_messages').insert([
            { conversation_id: targetId, role: 'user', content: message.trim() },
            { conversation_id: targetId, role: 'assistant', content: fullReply }
          ])

          await serviceClient
            .from('ai_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', targetId)
        }
      }
    })

    // APRÈS — pipeThrough décode le stream SSE et n'envoie que le texte pur
    // Compatible avec le lecteur manuel fetch() du composant AICoach
    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk)
        // Les chunks SSE du AI SDK ont le format : 0:"texte"\n
        // On extrait uniquement le texte entre les guillemets
        const lines = text.split('\n').filter(l => l.startsWith('0:'))
        for (const line of lines) {
          try {
            // Extraire la valeur JSON après "0:"
            const json = JSON.parse(line.slice(2))
            if (typeof json === 'string') {
              controller.enqueue(new TextEncoder().encode(json))
            }
          } catch {
            // Ignorer les chunks malformés
          }
        }
      }
    })

    // Pipe le stream AI vers notre transformer
    result.toTextStreamResponse().body!.pipeTo(writable).catch(() => {})

    return new Response(readable, {
      headers: {
        'Content-Type':  'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error("Erreur API IA Stream:", error)
    return new Response('Une erreur est survenue', { status: 500 })
  }
}
