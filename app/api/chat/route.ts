import { streamText, convertToCoreMessages } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const coreMessages = convertToCoreMessages(messages)

    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: `Tu es le "Coach Likelemba", l'assistant IA de l'application Likelemba.`,
      messages: coreMessages,
    })

    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error("Erreur API Chat:", error)
    return new Response(`Erreur: ${error.message}`, { status: 500 })
  }
}
