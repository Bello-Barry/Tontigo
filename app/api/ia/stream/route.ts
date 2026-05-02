import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
  console.log("AI Stream: Request received")

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("AI Stream: API KEY MISSING")
    return new Response('Config IA manquante', { status: 500 })
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.warn("AI Stream: User not authenticated")
      return new Response('Non authentifié', { status: 401 })
    }

    const { message, history, conversationId } = await req.json()
    if (!message?.trim()) return new Response('Message vide', { status: 400 })

    console.log(`AI Stream: User ${user.id} sending message: "${message.slice(0, 30)}..."`)

    // Profil pour le contexte
    const { data: profile } = await serviceClient
      .from('users')
      .select('full_name, trust_score')
      .eq('id', user.id)
      .single()

    const systemPrompt = `Tu es le "Coach Likelemba", l'assistant IA de Likelemba.
Utilisateur: ${profile?.full_name || 'Membre'}. Score: ${profile?.trust_score ?? 'N/A'}/100.
Sois concis (max 150 mots), chaleureux, et utilise le Markdown pour la mise en forme.`

    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages: [
        ...history.map((m: any) => {
          let content = m.content || ''
          if (!content && m.parts) {
            content = m.parts.map((p: any) => p.text || '').join('')
          }
          return { role: m.role, content }
        }),
        { role: 'user', content: message.trim() },
      ],
      onFinish: async (event) => {
        try {
          const fullReply = event.text
          let targetId = conversationId
          if (!targetId) {
            const { data: conv } = await serviceClient.from('ai_conversations').insert({ user_id: user.id, title: message.slice(0, 60) }).select('id').single()
            if (conv) targetId = conv.id
          }
          if (targetId) {
            await serviceClient.from('ai_messages').insert([
              { conversation_id: targetId, role: 'user', content: message.trim() },
              { conversation_id: targetId, role: 'assistant', content: fullReply }
            ])
          }
          console.log("AI Stream: Conversation saved to DB")
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
    console.error("AI Stream Error:", error)
    return new Response(`Erreur: ${error.message}`, { status: 500 })
  }
}
