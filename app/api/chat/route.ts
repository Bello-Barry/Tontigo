import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: `Tu es le "Coach Likelemba", l'assistant IA de l'application Likelemba.`,
      messages: messages.map((m: any) => {
        let content = m.content || ''
        if (!content && m.parts) {
          content = m.parts.map((p: any) => p.text || '').join('')
        }
        return { role: m.role, content }
      }),
    })

    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error("Erreur API Chat:", error)
    return new Response(`Erreur: ${error.message}`, { status: 500 })
  }
}
