import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

export const runtime = 'edge'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response('Config IA manquante', { status: 500 })
  }

  try {
    const { messages } = await req.json()

    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: `Tu es le "Coach Likelemba", l'assistant IA de l'application Likelemba.`,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content || (m.parts ? m.parts.map((p: any) => p.text || '').join('') : ''),
      })),
    })

    return result.toTextStreamResponse({
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      }
    })
  } catch (error: any) {
    console.error("Chat API POST Error:", error)
    return new Response(error.message, { status: 500 })
  }
}
