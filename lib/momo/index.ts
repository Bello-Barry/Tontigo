import crypto from 'crypto'

const BASE_URL = process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com'
const ENV = process.env.MTN_MOMO_ENV || 'sandbox'

// Collection Config
const COLL_SUB_KEY = process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY
const COLL_USER_ID = process.env.MOMO_COLLECTION_API_USER_ID
const COLL_API_KEY = process.env.MOMO_COLLECTION_API_KEY

// Disbursement Config
const DISB_SUB_KEY = process.env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY
const DISB_USER_ID = process.env.MOMO_DISBURSEMENT_API_USER_ID
const DISB_API_KEY = process.env.MOMO_DISBURSEMENT_API_KEY
 
// Cache pour les tokens (mémoire vive - dure le temps de l'instance du serveur)
const tokenCache: Record<string, { token: string; expiresAt: number }> = {}

// Callback Config — Prioritize manual override, then Vercel's internal URL, then APP_URL
const getCallbackHost = () => {
  if (process.env.MOMO_CALLBACK_HOST) return process.env.MOMO_CALLBACK_HOST
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.NEXT_PUBLIC_APP_URL
}

const CALLBACK_HOST = getCallbackHost()

if (CALLBACK_HOST) {
  console.log("MTN MoMo: Callback Host configuré sur", CALLBACK_HOST)
} else {
  console.warn("MTN MoMo: Aucun CALLBACK_HOST détecté. Les paiements ne seront pas mis à jour automatiquement via webhook.")
}

/**
 * Génère un token d'accès pour un produit spécifique (collection ou disbursement)
 */
async function getToken(product: 'collection' | 'disbursement'): Promise<string> {
  // Vérifier le cache
  const cached = tokenCache[product]
  if (cached && cached.expiresAt > Date.now() + 60000) { // On prend une marge de 1min
    return cached.token
  }

  const userId = product === 'collection' ? COLL_USER_ID : DISB_USER_ID
  const apiKey = product === 'collection' ? COLL_API_KEY : DISB_API_KEY
  const subKey = product === 'collection' ? COLL_SUB_KEY : DISB_SUB_KEY

  if (!userId || !apiKey || !subKey) {
    const errorMsg = `Configuration manquante pour ${product}. Vérifiez les variables d'environnement Vercel (Subscription Key, User ID, API Key).`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64')

  const response = await fetch(`${BASE_URL}/${product}/token/`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': subKey,
      'Authorization': `Basic ${auth}`,
      'Content-Length': '0'
    },
    cache: 'no-store'
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Error fetching token for ${product}:`, response.status, errorText)
    throw new Error(`Failed to get ${product} token: ${response.status}`)
  }

  const data = await response.json()

  // Mettre en cache (expires_in est souvent 3600s)
  tokenCache[product] = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  }

  return data.access_token
}

/**
 * Initie une demande de paiement (Encaissement)
 * @returns Le Reference-Id de la transaction
 */
export async function requestToPay(params: {
  amount: number
  phone: string
  externalId: string
  payerMessage: string
  payeeNote: string
}): Promise<string> {
  const token = await getToken('collection')
  const referenceId = crypto.randomUUID()
  const callbackUrl = CALLBACK_HOST ? `${CALLBACK_HOST}/api/momo/callback/collection` : undefined

  console.log(`MTN MoMo: Initiation requestToPay ${referenceId} pour ${params.phone} (${params.amount} FCFA). Callback: ${callbackUrl || 'AUCUN'}`)
  
  const response = await fetch(`${BASE_URL}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Reference-Id': referenceId,
      'X-Target-Environment': ENV,
      'Ocp-Apim-Subscription-Key': COLL_SUB_KEY || '',
      'Content-Type': 'application/json',
      ...(callbackUrl ? { 'X-Callback-Url': callbackUrl } : {})
    } as Record<string, string>,
    body: JSON.stringify({
      amount: params.amount.toString(),
      currency: 'EUR', // Sandbox only supports EUR
      externalId: referenceId, // On passe le referenceId en externalId pour simplifier le callback
      payer: {
        partyIdType: 'MSISDN',
        partyId: params.phone.replace('+', '') // Nettoyage du numéro
      },
      payerMessage: params.payerMessage,
      payeeNote: params.payeeNote
    }),
    cache: 'no-store'
  })

  if (response.status !== 202) {
    const errorText = await response.text()
    console.error('requestToPay error:', response.status, errorText)
    throw new Error(`requestToPay failed with status ${response.status}`)
  }

  return referenceId
}

/**
 * Vérifie le statut d'une demande de paiement
 * Statuts possibles: PENDING, SUCCESSFUL, FAILED
 */
export async function getCollectionStatus(referenceId: string): Promise<any> {
  const token = await getToken('collection')

  const response = await fetch(`${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Target-Environment': ENV,
      'Ocp-Apim-Subscription-Key': COLL_SUB_KEY || ''
    } as Record<string, string>,
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`getCollectionStatus failed with status ${response.status}`)
  }

  return response.json()
}

/**
 * Initie un transfert (Décaissement vers l'utilisateur)
 * @returns Le Reference-Id de la transaction
 */
export async function transfer(params: {
  amount: number
  phone: string
  externalId: string
  payerMessage: string
  payeeNote: string
}): Promise<string> {
  const token = await getToken('disbursement')
  const referenceId = crypto.randomUUID()
  const callbackUrl = CALLBACK_HOST ? `${CALLBACK_HOST}/api/momo/callback/disbursement` : undefined

  console.log(`MTN MoMo: Initiation transfer ${referenceId} pour ${params.phone} (${params.amount} FCFA). Callback: ${callbackUrl || 'AUCUN'}`)

  const response = await fetch(`${BASE_URL}/disbursement/v1_0/transfer`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Reference-Id': referenceId,
      'X-Target-Environment': ENV,
      'Ocp-Apim-Subscription-Key': DISB_SUB_KEY || '',
      'Content-Type': 'application/json',
      ...(callbackUrl ? { 'X-Callback-Url': callbackUrl } : {})
    } as Record<string, string>,
    body: JSON.stringify({
      amount: params.amount.toString(),
      currency: 'EUR', // Sandbox only supports EUR
      externalId: referenceId,
      payee: {
        partyIdType: 'MSISDN',
        partyId: params.phone.replace('+', '')
      },
      payerMessage: params.payerMessage,
      payeeNote: params.payeeNote
    }),
    cache: 'no-store'
  })

  if (response.status !== 202) {
    const errorText = await response.text()
    console.error('transfer error:', response.status, errorText)
    throw new Error(`transfer failed with status ${response.status}`)
  }

  return referenceId
}

/**
 * Vérifie le statut d'un transfert
 * Statuts possibles: PENDING, SUCCESSFUL, FAILED
 */
export async function getDisbursementStatus(referenceId: string): Promise<any> {
  const token = await getToken('disbursement')

  const response = await fetch(`${BASE_URL}/disbursement/v1_0/transfer/${referenceId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Target-Environment': ENV,
      'Ocp-Apim-Subscription-Key': DISB_SUB_KEY || ''
    } as Record<string, string>,
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`getDisbursementStatus failed with status ${response.status}`)
  }

  return response.json()
}
