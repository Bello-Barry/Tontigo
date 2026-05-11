export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-CG', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function getDaysUntil(date: string): number {
  const now  = new Date()
  const then = new Date(date)
  return Math.max(0, Math.ceil((then.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export function getFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    quotidien:      'Quotidien',
    hebdomadaire:   'Hebdomadaire',
    mensuel:        'Mensuel',
  }
  return labels[frequency] ?? frequency
}

/**
 * Assainit une URL pour éviter les attaques XSS (ex: javascript:alert(1))
 * Autorise uniquement http, https, et les chemins relatifs.
 */
export function sanitizeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined

  const trimmed = url.trim()

  // Autoriser les chemins relatifs (commençant par /)
  if (trimmed.startsWith('/')) return trimmed

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed
    }
  } catch (e) {
    // Si ce n'est pas une URL valide mais que ça ne semble pas dangereux (pas de proto)
    if (!trimmed.includes(':')) return trimmed
  }

  return undefined
}
