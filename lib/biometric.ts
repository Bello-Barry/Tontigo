/**
 * Helper WebAuthn — Confirmation biométrique légère côté client.
 * Fonctionne avec Face ID, Touch ID, Windows Hello…
 * Renvoie true si l'utilisateur a confirmé, false si refus/indisponible.
 */
export async function requestBiometricConfirmation(label: string): Promise<boolean> {
  // Vérifier la disponibilité
  if (
    typeof window === 'undefined' ||
    !window.PublicKeyCredential ||
    !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
  ) {
    return true // Pas dispo → laisser passer (dégradation gracieuse)
  }

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    if (!available) return true // Dégradation gracieuse

    // Générer un challenge aléatoire
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 30000,
        userVerification: 'required',
        rpId: window.location.hostname,
        allowCredentials: [], // Tout authenticator disponible
      },
    })

    return !!credential
  } catch (err: any) {
    // L'utilisateur a annulé ou l'authentification a échoué
    if (err.name === 'NotAllowedError') return false
    // Autres erreurs (pas configuré, etc.) → dégradation gracieuse
    console.warn('Biometric unavailable, skipping:', err.message)
    return true
  }
}
