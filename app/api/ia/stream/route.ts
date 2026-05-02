import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

const LIKELEMBA_KNOWLEDGE = `
## Règles et fonctionnement de la plateforme Likelemba

### Tontines (Likelemba)
- Une tontine est un groupe d'épargne collaborative où chaque membre cotise une somme fixe à intervalles réguliers (quotidien, hebdomadaire, mensuel).
- À chaque tour, UN membre reçoit la totalité de la cagnotte.
- L'ordre des tours est défini aléatoirement à la création du groupe.
- Le groupe doit être DÉMARRÉ par le créateur une fois le nombre minimum de membres atteint.

### Pénalités et Trust Score
- Le Trust Score va de 0 à 100. Un score élevé donne accès à des groupes plus importants.
- Une pénalité est appliquée si un membre ne paye pas sa cotisation à temps.
- Payer à temps augmente le Trust Score (+2 points).

### Épargne Bloquée (Coffre-Fort)
- Le Coffre-Fort permet d'épargner individuellement avec une date de déblocage.
- Les fonds sont bloqués jusqu'à la date choisie.

### Portefeuille
- Le portefeuille est le solde disponible sur la plateforme.
- Il sert à payer les cotisations automatiquement.
`

const BASE_SYSTEM = `Tu es le "Coach Likelemba", l'assistant d'intelligence artificielle de l'application Likelemba.
Ton rôle :
- Aider les utilisateurs à comprendre et utiliser la plateforme.
- Donner des conseils financiers pratiques.
Règles :
- Sois chaleureux, concis (max 200 mots).
- Formate tes réponses avec du Markdown.

${LIKELEMBA_KNOWLEDGE}`

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return new Response('Non authentifié', { status: 401 })

    const { message, history, conversationId } = await req.json()
    if (!message?.trim()) return new Response('Message vide', { status: 400 })

    const userId = user.id

    // Récupération rapide du profil
    const { data: profile } = await serviceClient
      .from('users')
      .select('full_name, trust_score')
      .eq('id', userId)
      .single()

    const systemPrompt = `${BASE_SYSTEM}\n\nUtilisateur : ${profile?.full_name || 'Membre'}. Score : ${profile?.trust_score ?? 'N/A'}/100.`

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
            const { data: conv } = await serviceClient
              .from('ai_conversations')
              .insert({ user_id: userId, title: message.slice(0, 60) })
              .select('id')
              .single()
            if (conv) targetId = conv.id
          }

          if (targetId) {
            await serviceClient.from('ai_messages').insert([
              { conversation_id: targetId, role: 'user', content: message.trim() },
              { conversation_id: targetId, role: 'assistant', content: fullReply }
            ])
          }
        } catch (e) {
          console.error("DB Error in IA Stream onFinish:", e)
        }
      }
    })

    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error("Erreur API IA Stream:", error)
    return new Response(`Erreur: ${error.message}`, { status: 500 })
  }
}
