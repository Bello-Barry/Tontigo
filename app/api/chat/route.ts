import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

export const dynamic = 'force-dynamic'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: `Tu es le "Coach Likelemba".`,
      messages,
    })
    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error("Chat API Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
