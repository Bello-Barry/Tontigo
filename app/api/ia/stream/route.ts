import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

export const dynamic = 'force-dynamic'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response('Format de messages invalide', { status: 400 })
    }

    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: `Tu es le "Coach Likelemba", l'assistant IA de Likelemba. Réponds en Markdown de manière concise.`,
      messages,
    })

    // Retourne un flux de texte pur
    return result.toTextStreamResponse({
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-transform',
      }
    })
  } catch (error: any) {
    console.error("AI Stream Error:", error)
    return new Response(error.message || 'Erreur IA', { status: 500 })
  }
}
