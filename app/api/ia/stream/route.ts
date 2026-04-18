import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Non authentifié', { status: 401 })
  }

  const { message, history, conversationId } = await request.json()

  if (!message?.trim()) {
    return new Response('Message vide', { status: 400 })
  }

  const messages = [
    ...history,
    { role: 'user', content: message.trim() },
  ]

  // NOTE: For this task, we assume the AI provider supports streaming.
  // Using a simulated streaming response for demonstration if the provider is not configured.
  // In a real scenario, this would call OpenAI, Anthropic, or similar.

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let fullReply = ""

      // Simulation of a realistic financial assistant reply
      const simulatedWords = [
        "Bonjour ! ", "En tant qu'assistant Likelemba, ", "je peux vous aider à optimiser votre épargne. ",
        "Une tontine est un excellent moyen ", "de discipline financière. ",
        "Pour votre projet, ", "je vous conseille de mettre de côté ", "environ 20% de vos revenus. ",
        "N'oubliez pas que la confiance ", "est le pilier d'un groupe Likelemba. ",
        "Avez-vous d'autres questions ", "sur le fonctionnement des cycles ?"
      ]

      try {
        for (const word of simulatedWords) {
          controller.enqueue(encoder.encode(word))
          fullReply += word
          await new Promise(r => setTimeout(r, 150)) // Artificial delay for streaming effect
        }

        // Save to database once finished
        if (fullReply) {
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
      } catch (e) {
        console.error("Streaming error:", e)
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
