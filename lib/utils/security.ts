import { headers } from 'next/headers'

/**
 * Valide le secret du webhook pour éviter l'usurpation (spoofing).
 * Le secret doit être envoyé dans le header 'x-webhook-secret'.
 */
export async function validateWebhookSecret(): Promise<boolean> {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) {
    // Si pas de secret configuré en ENV, on refuse par défaut en production
    if (process.env.NODE_ENV === 'production') {
      console.error('WEBHOOK_SECRET is not defined in production!')
      return false
    }
    return true // En dev, on laisse passer si non configuré
  }

  const h = await headers()
  const receivedSecret = h.get('x-webhook-secret')

  return receivedSecret === secret
}
