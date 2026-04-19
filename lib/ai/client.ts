import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

const AI_MODELS = {
  fast:     'gemini-1.5-flash',
  balanced: 'gemini-1.5-flash-8b',
  pro:      'gemini-1.5-pro',
} as const

type ModelTier = keyof typeof AI_MODELS

const LIMITS = {
  maxPromptLength:  8_000,
  maxSystemLength:  2_000,
  maxTokens:        1_000,
  maxTokensJSON:    600,
  maxRetries:       2,
} as const

function sanitizeInput(text: string, maxLength: number): string {
  return text
    .slice(0, maxLength)
    .replace(/ignore\s+(all\s+)?previous\s+instructions?/gi, '[filtré]')
    .replace(/system\s*:/gi, '[filtré]')
    .replace(/\[INST\]|\[\/INST\]/g, '')
    .replace(/<\|im_start\|>|<\|im_end\|>/g, '')
    .trim()
}

export async function callAI(params: {
  system:     string
  prompt:     string
  maxTokens?: number
  jsonMode?:  boolean
  model?:     ModelTier
}): Promise<string> {
  const safeSystem = sanitizeInput(params.system, LIMITS.maxSystemLength)
  const safePrompt = sanitizeInput(params.prompt, LIMITS.maxPromptLength)

  const systemPrompt = params.jsonMode
    ? `${safeSystem}\n\nRéponds UNIQUEMENT avec un objet JSON valide. Aucun texte avant ou après. Aucun bloc markdown. JSON pur.`
    : safeSystem

  const maxTokens = Math.min(params.maxTokens ?? LIMITS.maxTokens, LIMITS.maxTokens)
  const modelId = AI_MODELS[params.model ?? 'fast']
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= LIMITS.maxRetries; attempt++) {
    try {
      const { text } = await generateText({
        model:       google(modelId),
        system:      systemPrompt,
        prompt:      safePrompt,
        maxCompletionTokens: maxTokens,
        temperature: params.jsonMode ? 0.1 : 0.7,
      } as any)
      return text?.trim() ?? ''
    } catch (error: any) {
      lastError = error
      console.error(`callAI attempt ${attempt}/${LIMITS.maxRetries} failed:`, {
        model:     modelId,
        errorCode: error?.status ?? error?.code,
        message:   error?.message?.slice(0, 200),
      })
      if ([401, 403, 429, 400].includes(error?.status)) break
      if (attempt < LIMITS.maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 1000))
      }
    }
  }

  console.error('callAI all retries failed:', lastError?.message)
  return ''
}

export async function callAIJSON<T>(params: {
  system:     string
  prompt:     string
  maxTokens?: number
  model?:     ModelTier
  fallback:   T
}): Promise<T> {
  try {
    const text = await callAI({
      ...params,
      jsonMode:  true,
      maxTokens: Math.min(params.maxTokens ?? LIMITS.maxTokensJSON, LIMITS.maxTokensJSON),
    })
    if (!text) return params.fallback

    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .trim()

    if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
      console.error('callAIJSON: response is not JSON:', cleaned.slice(0, 100))
      return params.fallback
    }
    return JSON.parse(cleaned) as T
  } catch (error) {
    console.error('callAIJSON parse failed:', error)
    return params.fallback
  }
}
