import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

/**
 * Fonction centrale d'appel à l'API IA utilisant le AI SDK (Gemini par défaut).
 * Toutes les fonctions IA du projet passent par ici.
 * On utilise gemini-1.5-flash par défaut pour la compatibilité maximale.
 */
export async function callAI(params: {
  system:      string
  prompt:      string
  maxTokens?:  number
  jsonMode?:   boolean
}): Promise<string> {
  try {
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      system: params.jsonMode
        ? `${params.system}\n\nRéponds UNIQUEMENT avec un objet JSON valide. Aucun texte avant ou après. Aucun bloc markdown. JSON pur.`
        : params.system,
      prompt: params.prompt,
      max_tokens: params.maxTokens ?? 500,
    } as any)

    return text.trim()
  } catch (error: any) {
    console.error('AI call failed:', error.message)
    // On ne jette plus l'erreur pour éviter de faire planter l'application
    // On retourne une chaîne vide ou un message d'erreur gracieux
    return ""
  }
}

/**
 * Version JSON garantie — parse et valide la réponse JSON.
 */
export async function callAIJSON<T>(params: {
  system:     string
  prompt:     string
  maxTokens?: number
  fallback:   T
}): Promise<T> {
  try {
    const text = await callAI({
      ...params,
      jsonMode: true,
    })

    if (!text) return params.fallback

    // Nettoyer les éventuels backticks markdown
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/```/g, '')
      .trim()

    return JSON.parse(cleaned) as T
  } catch (error) {
    console.error('AI JSON parse failed, using fallback:', error)
    return params.fallback
  }
}
