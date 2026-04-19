// ⚡ OBLIGATOIRE pour le streaming sur Vercel
export const runtime = 'edge'

import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { createClient } from '@supabase/supabase-js'

// Client Supabase compatible Edge Runtime
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const SYSTEM_PROMPT = `Tu es le "Coach Likelemba", l'assistant d'intelligence artificielle intégré à l'application Likelemba (anciennement Tontigo).
La plateforme aide les utilisateurs d'Afrique francophone (notamment au Congo, Brazzaville) à gérer leurs finances personnelles à travers l'épargne collaborative (les Tontines/Likelemba) et l'épargne individuelle (les coffres-forts).

Ton but est d'aider les utilisateurs, de répondre à leurs questions sur la plateforme et de leur donner d'excellents conseils financiers pour éviter les pénalités et faire grandir leur « Trust Score » (Score de Confiance).

Règles :
- Sois très chaleureux, encourageant et concis.
- Utilise un langage clair, simple (français sans jargon complexe) et accessible.
- Tu peux glisser quelques mots d'argot local congolais avec modération (ex: Mbote, Ko luka, etc.) pour créer du lien.
- Tu as interdiction de donner des conseils financiers légaux qui engageraient ta responsabilité, ajoute des clauses de style "C'est un conseil personnel" si on te demande d'investir de grosses sommes.
- Si on te demande qui t'a créé, réponds "L'équipe d'ingénierie de Likelemba propulsée par Gemini".`

export async function POST(req: Request) {
  try {
    // ── 1. Auth depuis le header Authorization ────────────────
    const authHeader  = req.headers.get('Authorization') || ''
    const accessToken = authHeader.replace('Bearer ', '').trim()

    if (!accessToken) {
      return new Response('Non authentifié', { status: 401 })
    }

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error } = await anonClient.auth.getUser(accessToken)

    if (error || !user) {
      return new Response('Token invalide', { status: 401 })
    }

    const userId = user.id

    // ── 2. Parsing et validation ──────────────────────────────
    let body: any
    try {
      body = await req.json()
    } catch {
      return new Response('Body invalide', { status: 400 })
    }

    const { message, history, conversationId } = body

    if (!message?.trim()) {
      return new Response('Message vide', { status: 400 })
    }

    const safeMessage = message.trim().slice(0, 3000)

    const coreMessages = [
      ...(Array.isArray(history) ? history : [])
        .slice(-20)
        .filter((m: any) => m?.role && m?.content)
        .map((m: any) => ({
          role:    m.role    as 'user' | 'assistant',
          content: String(m.content).slice(0, 2000),
        })),
      { role: 'user' as const, content: safeMessage },
    ]

    // ── 3. Valider conversationId ─────────────────────────────
    let validConversationId: string | null = null
    if (conversationId && typeof conversationId === 'string') {
      const service = getServiceClient()
      const { data: conv } = await service
        .from('ai_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .maybeSingle()
      validConversationId = conv?.id ?? null
    }

    // ── 4. Stream avec sauvegarde dans onFinish ───────────────
    const result = streamText({
      model:       google('gemini-2.0-flash'),
      system:      SYSTEM_PROMPT,
      messages:    coreMessages,
      max_tokens:  800,
      temperature: 0.75,

      onFinish: async ({ text: fullReply }) => {
        if (!fullReply?.trim()) return

        try {
          const service = getServiceClient()
          let targetId  = validConversationId

          if (!targetId) {
            const title = safeMessage.slice(0, 60) +
              (safeMessage.length > 60 ? '...' : '')

            const { data: conv } = await service
              .from('ai_conversations')
              .insert({
                user_id:    userId,
                title,
                updated_at: new Date().toISOString(),
              })
              .select('id')
              .single()

            targetId = conv?.id ?? null
          }

          if (targetId) {
            await service.from('ai_messages').insert([
              { conversation_id: targetId, role: 'user',      content: safeMessage      },
              { conversation_id: targetId, role: 'assistant', content: fullReply.trim() },
            ])

            await service
              .from('ai_conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', targetId)
          }
        } catch (err) {
          console.error('onFinish save error:', err)
        }
      },
    } as any)

    // ── 5. Retourner le stream texte brut ─────────────────────
    return new Response(result.textStream as any, {
      headers: {
        'Content-Type':  'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })

  } catch (error: any) {
    console.error('IA Stream error:', error?.message)
    return new Response('Une erreur est survenue', { status: 500 })
  }
}
