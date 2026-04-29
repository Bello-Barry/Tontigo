import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const openrouter = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE || 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENAI_API_KEY,
})
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'

// ─── Base de connaissances Likelemba (RAG simplifié) ────────────────────────
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

### Conseils financiers généraux
- Commencer petit (5,000 - 10,000 FCFA) pour apprendre le système avant de s'engager sur de grandes sommes.
- Toujours vérifier la date de son prochain tour pour ne pas rater un versement.
- Utiliser le Coffre-Fort pour les objectifs à long terme plutôt que de garder l'argent dans le portefeuille.
- Diversifier : participer à plusieurs petites tontines plutôt qu'une grande.
`

const BASE_SYSTEM = `Tu es le "Coach Likelemba", l'assistant d'intelligence artificielle de l'application Likelemba — une plateforme d'épargne collaborative pour les Africains francophones, notamment au Congo-Brazzaville.

Ton rôle :
- Aider les utilisateurs à comprendre et utiliser la plateforme.
- Donner des conseils financiers pratiques et adaptés au contexte africain.
- Encourager les bonnes habitudes d'épargne et de ponctualité.

Règles de comportement :
- Sois chaleureux, encourageant, et CONCIS (max 200 mots sauf si l'utilisateur demande plus de détails).
- Utilise un français simple et accessible, sans jargon complexe.
- Tu peux glisser quelques mots locaux avec modération : "Mbote !" (bonjour en lingala), "Ko luka" (chercher), "Makasi" (fort/courageux).
- N'engage jamais ta responsabilité légale sur des conseils d'investissement — dis "C'est un conseil personnel, consulte un expert financier pour les grandes décisions."
- Si on te demande qui t'a créé, réponds : "L'équipe d'ingénierie de Likelemba, propulsée par Gemini IA de Google."
- Formate tes réponses avec du Markdown : utilise le gras, les listes à puces, les titres. C'est maintenant rendu proprement dans l'interface.

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

    // Use actual user.id
    const userId = user.id

    // ─── Récupération du profil utilisateur (resilient) ───────────────────
    const [profileResult, membershipsResult, walletResult] = await Promise.allSettled([
      serviceClient
        .from('users')
        .select('full_name, trust_score, badge, total_groups_completed')
        .eq('id', userId)
        .single(),
      serviceClient
        .from('memberships')
        .select('tontine_groups(name, amount, frequency, status)')
        .eq('user_id', userId)
        .limit(5),
      serviceClient
        .from('virtual_wallet')
        .select('total_balance')
        .eq('user_id', userId)
        .single(),
    ])

    const profile    = profileResult.status    === 'fulfilled' ? profileResult.value.data    : null
    const memberships= membershipsResult.status === 'fulfilled' ? membershipsResult.value.data : []
    const wallet     = walletResult.status      === 'fulfilled' ? walletResult.value.data      : null

    // ─── Construction du contexte personnalisé ─────────────────────────────
    const activeTontineNames = (memberships || [])
      .map((t: any) => t.tontine_groups?.name)
      .filter(Boolean)
      .join(', ')

    const userContext = `
## Profil de l'utilisateur que tu conseilles en ce moment :
- **Nom** : ${profile?.full_name || 'Utilisateur'}
- **Trust Score** : ${profile?.trust_score ?? 'N/A'}/100 ${
      profile?.trust_score >= 80 ? '(Excellent ⭐)' :
      profile?.trust_score >= 50 ? '(Bon 👍)' :
      profile?.trust_score !== undefined ? '(À améliorer 💪)' : ''
    }
- **Badge** : ${profile?.badge || 'nouveau'}
- **Groupes complétés avec succès** : ${profile?.total_groups_completed ?? 0}
- **Solde portefeuille** : ${wallet?.total_balance?.toLocaleString('fr-FR') ?? 'N/A'} FCFA
- **Tontines actives** : ${activeTontineNames || 'Aucune pour le moment'}

Utilise ces informations pour personnaliser tes conseils. Mentionne son prénom si approprié.`

    const systemPrompt = BASE_SYSTEM + '\n\n' + userContext

    // ─── Construction des messages ─────────────────────────────────────────
    const coreMessages = [
      ...history.map((m: any) => ({
        role: m.role,
        content: m.content || '',
      })),
      { role: 'user', content: message.trim() },
    ]

    console.log("Appel streamText avec message:", message)
    
    // ─── Appel au modèle ───────────────────────────────────────────────────
    const result = streamText({
      model: openrouter('google/gemini-2.0-flash-001'),
      system: systemPrompt,
      messages: coreMessages,
      temperature: 0.7,
      maxOutputTokens: 1500,
      onFinish: async (event) => {
        const fullReply = event.text
        console.log("Réponse IA terminée:", fullReply.slice(0, 50) + "...")
        let targetId = conversationId

        if (!targetId) {
          const title = message.slice(0, 60) + (message.length > 60 ? '...' : '')
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

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Erreur API IA Stream:", error)
    return new Response('Une erreur est survenue', { status: 500 })
  }
}
