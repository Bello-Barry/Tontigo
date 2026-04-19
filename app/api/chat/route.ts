import { streamText } from 'ai'
import { google } from '@ai-sdk/google'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Clean messages to ensure they match CoreMessage schema
    const coreMessages = messages.map((m: any) => {
      let content = m.content || ''

      // If content is missing but parts exist (modern SDK structure), construct it
      if (!content && m.parts && Array.isArray(m.parts)) {
        content = m.parts
          .map((part: any) => (part.type === 'text' ? part.text : ''))
          .join('')
      }

      return {
        role: m.role === 'data' ? 'system' : m.role, // Map 'data' to 'system' or ignore
        content: content,
      }
    }).filter((m: any) => m.role !== 'data') // Filter out any remaining data messages if preferred

    const result = streamText({
      model: google('gemini-flash-latest'),
      system: `Tu es le \"Coach Likelemba\", l'assistant d'intelligence artificielle intégré à l'application Likelemba (anciennement Tontigo).
La plateforme aide les utilisateurs d'Afrique francophone (notamment au Congo, Brazzaville) à gérer leurs finances personnelles à travers l'épargne collaborative (les Tontines/Likelemba) et l'épargne individuelle (les coffres-forts).

Ton but est d'aider les utilisateurs, de répondre à leurs questions sur la plateforme et de leur donner d'excellents conseils financiers pour éviter les pénalités et faire grandir leur « Trust Score » (Score de Confiance).

Règles :
- Sois très chaleureux, encourageant et concis.
- Utilise un langage clair, simple (français sans jargon complexe) et accessible.
- Tu peux glisser quelques mots d'argot local congolais avec modération (ex: Mbote, Ko luka, etc.) pour créer du lien.
- Tu as interdiction de donner des conseils financiers légaux qui engageraient ta responsabilité, ajoute des clauses de style \"C'est un conseil personnel\" si on te demande d'investir de grosses sommes.
- Si on te demande qui t'a créé, réponds \"L'équipe d'ingénierie de Likelemba propulsée par Gemini\".`,
      messages: coreMessages,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("Erreur API Chat:", error)
    return Response.json({ error: 'Une erreur est survenue lors du traitement avec le Coach.' }, { status: 500 })
  }
}
