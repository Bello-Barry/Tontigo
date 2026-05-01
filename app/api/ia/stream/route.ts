import { streamText, convertToCoreMessages } from 'ai'
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
- À chaque tour, UN membre reçoit la totalité de la cagnotte (appelé "bénéficiaire du tour").
- L'ordre des tours est défini aléatoirement à la création du groupe.
- Le groupe doit être DÉMARRÉ par le créateur une fois le nombre minimum de membres atteint.
- Fréquences disponibles : Quotidien, Hebdomadaire, Mensuel.
- Statuts d'un groupe : "En attente de membres", "En attente de démarrage", "Actif", "Terminé".

### Pénalités et Trust Score
- Le Trust Score (Score de Confiance) va de 0 à 100. Un score élevé donne accès à des groupes plus importants.
- Une pénalité est appliquée si un membre ne paye pas sa cotisation à temps.
- Les pénalités font baisser le Trust Score.
- Payer à temps, être régulier et ne jamais manquer un tour augmente le Trust Score.
- Un Trust Score de 80+ est considéré "Excellent".

### Épargne Bloquée (Coffre-Fort)
- Le Coffre-Fort permet d'épargner individuellement avec une date de déblocage.
- Les fonds sont bloqués jusqu'à la date choisie — impossible de retirer avant sans pénalité.
- C'est idéal pour des projets à long terme (mariage, voyage, achat).

### Portefeuille
- Le portefeuille est le solde disponible sur la plateforme.
- On peut recevoir des fonds dans le portefeuille (bénéfices de tontine, retraits d'épargne).
- Le portefeuille sert à payer les cotisations automatiquement.

### Matching
- Le système de Matching permet de trouver des membres compatibles pour former un nouveau groupe de tontine.
- Basé sur le Trust Score, le montant souhaité et la fréquence préférée.

### Code d'invitation
- Chaque groupe a un code d'invitation unique (ex: 29c100e8).
- Partager ce code permet à d'autres membres de rejoindre le groupe.
`

const BASE_SYSTEM = `Tu es le "Coach Likelemba", l'assistant d'intelligence artificielle de l'application Likelemba.
Ton rôle est d'aider les utilisateurs à comprendre la plateforme et de donner des conseils financiers adaptés au contexte africain.
Sois chaleureux, encourageant et concis.
Utilise quelques mots locaux comme "Mbote !" ou "Makasi".

${LIKELEMBA_KNOWLEDGE}`

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

    // Récupération rapide du profil pour le contexte
    const { data: profile } = await serviceClient
      .from('users')
      .select('full_name, trust_score')
      .eq('id', user.id)
      .single()

    const userContext = `Utilisateur actuel : ${profile?.full_name || 'Membre'}. Trust Score : ${profile?.trust_score || 'N/A'}/100.`

    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: `${BASE_SYSTEM}\n\n${userContext}`,
      messages: convertToCoreMessages([
        ...history,
        { role: 'user', content: message.trim() }
      ]),
      onFinish: async (event) => {
        const fullReply = event.text
        let targetId = conversationId

        if (!targetId) {
          const title = message.slice(0, 60)
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
        }
      }
    })

    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error("AI Stream Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
