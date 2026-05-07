import { serviceClient } from '@/lib/supabase/service'

/**
 * Transcrit un message vocal en texte via Google Gemini.
 * Le résultat est stocké dans la colonne `transcription` de group_messages.
 * 
 * Note: Uses fetch + Gemini REST API to avoid needing the @google/generative-ai package.
 */
export async function transcribeAudioMessage(params: {
  messageId: string
  audioUrl:  string
}): Promise<string | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch(params.audioUrl)
    if (!response.ok) return null

    const audioBuffer = await response.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString('base64')
    const contentType = response.headers.get('content-type') || 'audio/webm'

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: contentType,
                  data:      base64Audio,
                },
              },
              {
                text: `Transcris ce message vocal en français. Sois précis et naturel.
                       Si c'est inaudible, réponds uniquement: "[Audio incompréhensible]"
                       Réponds UNIQUEMENT avec la transcription, aucun autre texte.`,
              },
            ],
          }],
          generationConfig: { maxOutputTokens: 300 },
        }),
      }
    )

    if (!res.ok) return null
    const json = await res.json()
    const transcription = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!transcription) return null

    await serviceClient
      .from('group_messages')
      .update({ transcription })
      .eq('id', params.messageId)

    return transcription
  } catch (error) {
    console.error('transcribeAudioMessage failed:', error)
    return null
  }
}
