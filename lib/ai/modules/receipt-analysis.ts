interface ReceiptAnalysisResult {
  is_payment_receipt: boolean
  amount:             number | null
  currency:           string | null
  sender:             string | null
  receiver:           string | null
  date:               string | null
  reference:          string | null
  confidence:         number
  notes:              string
}

/**
 * Analyse une image de reçu de paiement via Gemini Vision (REST API).
 */
export async function analyzePaymentReceipt(
  imageBase64: string,
  mimeType:    string = 'image/jpeg'
): Promise<ReceiptAnalysisResult> {
  const fallback: ReceiptAnalysisResult = {
    is_payment_receipt: false,
    amount:     null,
    currency:   null,
    sender:     null,
    receiver:   null,
    date:       null,
    reference:  null,
    confidence: 0,
    notes:      'Analyse impossible',
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) return fallback

  try {
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
                  mime_type: mimeType,
                  data:      imageBase64,
                },
              },
              {
                text: `Analyse cette image. Est-ce un reçu de paiement mobile (MTN MoMo, Airtel Money, Orange Money, virement) ?
                       Extrais toutes les informations disponibles. Réponds UNIQUEMENT avec ce JSON valide :
                       {"is_payment_receipt":true,"amount":5000,"currency":"FCFA","sender":"John Doe","receiver":"Jane","date":"2024-01-15","reference":"TXN12345","confidence":0.95,"notes":"Reçu MTN MoMo authentique"}`,
              },
            ],
          }],
          generationConfig: { maxOutputTokens: 400 },
        }),
      }
    )

    if (!res.ok) return fallback
    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as ReceiptAnalysisResult
  } catch (error) {
    console.error('analyzePaymentReceipt failed:', error)
    return fallback
  }
}
