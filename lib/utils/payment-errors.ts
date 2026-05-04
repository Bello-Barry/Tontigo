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
  'RESOURCE_NOT_FOUND': 'Ressource MTN introuvable.',
  'INVALID_CALLBACK_URL_HOST': 'URL de rappel invalide.',
  'BAD_REQUEST': 'Requête mal formée. Vérifiez le numéro ou le montant.',

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

export function humanizePaymentError(errorString: string): string {
  // If the error contains a known code, return the human message
  for (const code in PAYMENT_ERRORS) {
    if (errorString.toUpperCase().includes(code)) {
      return PAYMENT_ERRORS[code]
    }
  }

  // Handle specific HTTP error messages from lib/momo/index.ts
  if (errorString.includes('MTN_ERROR_400')) return PAYMENT_ERRORS['BAD_REQUEST']
  if (errorString.includes('MTN_ERROR_401')) return 'Erreur d\'authentification MTN. Contactez le support.'
  if (errorString.includes('MTN_ERROR_404')) return PAYMENT_ERRORS['RESOURCE_NOT_FOUND']
  if (errorString.includes('MTN_ERROR_500') || errorString.includes('MTN_ERROR_503')) {
    return PAYMENT_ERRORS['SERVICE_UNAVAILABLE']
  }

  return PAYMENT_ERRORS['GENERIC_ERROR']
}
