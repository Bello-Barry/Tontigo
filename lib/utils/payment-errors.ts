export const PAYMENT_ERRORS: Record<string, string> = {
  // MTN MoMo errors
  'NOT_ENOUGH_FUNDS': 'Solde insuffisant — Recharge ton compte MoMo.',
  'PAYER_NOT_FOUND': 'Numéro MTN introuvable ou compte MoMo non actif.',
  'PAYEE_NOT_ALLOWED_TO_RECEIVE': 'Ce numéro ne peut pas recevoir de fonds actuellement.',
  'PAYER_LIMIT_REACHED': 'Limite de transaction atteinte pour ce compte.',
  'APPROVAL_REJECTED': 'Tu as refusé la demande de paiement.',
  'EXPIRED': 'La demande de paiement a expiré.',
  'INTERNAL_PROCESSING_ERROR': 'Erreur technique MTN. Réessaye dans un instant.',
  'SERVICE_UNAVAILABLE': 'Le service MTN MoMo est temporairement indisponible.',

  // Airtel Money errors
  'TIP-0001': 'Erreur technique Airtel. Réessaye plus tard.',
  'TIP-0002': 'Numéro Airtel Money invalide ou non enregistré.',
  'TIP-0003': 'Solde Airtel Money insuffisant.',
  'TIP-0004': 'Transaction refusée par Airtel.',
  'TIP-0005': 'Limite de compte Airtel atteinte.',

  // Likelemba generic errors
  'INVALID_PHONE': 'Le numéro de téléphone est mal formaté.',
  'WALET_NOT_CONFIGURED': 'Configure ton numéro Mobile Money dans ton profil.',
  'GENERIC_ERROR': 'Une erreur est survenue lors du paiement.',
}

export function humanizePaymentError(code: string): string {
  return PAYMENT_ERRORS[code] || PAYMENT_ERRORS['GENERIC_ERROR']
}
