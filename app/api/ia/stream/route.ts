import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'

export const runtime = 'edge'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response('Config IA manquante (API KEY)', { status: 500 })
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Non authentifié', { status: 401 })

    const { message, history, conversationId } = await req.json()
    if (!message?.trim()) return new Response('Message vide', { status: 400 })

    const userId = user.id

    // Profil minimal pour le contexte
    const { data: profile } = await serviceClient
      .from('users')
      .select('full_name, trust_score')
      .eq('id', userId)
      .single()

    const systemPrompt = `Tu es le "Coach Likelemba", l'assistant IA de Likelemba.
Utilisateur: ${profile?.full_name || 'Membre'}. Score: ${profile?.trust_score ?? 'N/A'}.
Sois concis, chaleureux, utilise le Markdown.`

    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages: [
        ...history.map((m: any) => ({
          role: m.role,
          content: m.content || (m.parts ? m.parts.map((p: any) => p.text || '').join('') : ''),
        })),
        { role: 'user', content: message.trim() },
      ],
      onFinish: async (event) => {
        try {
          const fullReply = event.text
          let targetId = conversationId
          if (!targetId) {
            const { data: conv } = await serviceClient.from('ai_conversations').insert({ user_id: userId, title: message.slice(0, 50) }).select('id').single()
            if (conv) targetId = conv.id
          }
          if (targetId) {
            await serviceClient.from('ai_messages').insert([
              { conversation_id: targetId, role: 'user', content: message.trim() },
              { conversation_id: targetId, role: 'assistant', content: fullReply }
            ])
          }
        } catch (e) { console.error("OnFinish IA DB Error:", e) }
      }
    })

    return result.toTextStreamResponse({
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      }
    })
  } catch (error: any) {
    console.error("AI Stream POST Error:", error)
    return new Response(error.message, { status: 500 })
  }
}
