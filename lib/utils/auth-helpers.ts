/**
 * Convertit un numéro de téléphone congolais en email fictif Supabase.
 * L'utilisateur ne verra jamais cet email.
 *
 * Exemples :
 *   "0612345678"    → "242612345678@tontigo.app"
 *   "+242612345678" → "242612345678@tontigo.app"
 */
export function phoneToFakeEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('242')
    ? digits
    : `242${digits.startsWith('0') ? digits.slice(1) : digits}`
  return `${normalized}@tontigo.app`
}

/**
 * Extrait le numéro lisible depuis un email fictif.
 */
export function fakeEmailToPhone(email: string): string {
  const digits = email.replace('@tontigo.app', '')
  return `+${digits}`
}

/**
 * Valide qu'un numéro est un numéro congolais valide.
 * Accepte : 06XXXXXXX, 05XXXXXXX, 04XXXXXXX (MTN/Airtel Congo)
 */
export function isValidCongoPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('242') ? digits.slice(3) : digits
  return /^(06|05|04)\d{7}$/.test(normalized)
}

/**
 * Normalise un numéro en format stockage (sans +, avec 242).
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('242')
    ? digits
    : `242${digits.startsWith('0') ? digits.slice(1) : digits}`
}

/**
 * Formate un numéro pour l'affichage utilisateur.
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const local = digits.startsWith('242') ? digits.slice(3) : digits
  return `+242 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`
}
