import crypto from 'crypto'

const BASE_URL = process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com'
const ENV = process.env.MTN_MOMO_ENV || 'sandbox'
const CURRENCY = process.env.MTN_MOMO_CURRENCY || (ENV === 'sandbox' ? 'EUR' : 'XAF')

// Collection Config
const COLL_SUB_KEY = process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY
const COLL_USER_ID = process.env.MOMO_COLLECTION_API_USER_ID
const COLL_API_KEY = process.env.MOMO_COLLECTION_API_KEY

// Disbursement Config
const DISB_SUB_KEY = process.env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY
const DISB_USER_ID = process.env.MOMO_DISBURSEMENT_API_USER_ID
const DISB_API_KEY = process.env.MOMO_DISBURSEMENT_API_KEY
 
// Cache pour les tokens (mémoire vive)
const tokenCache: Record<string, { token: string; expiresAt: number }> = {}

// Callback Config
const getCallbackHost = () => {
  if (process.env.MOMO_CALLBACK_HOST) return process.env.MOMO_CALLBACK_HOST
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.NEXT_PUBLIC_APP_URL
}

const CALLBACK_HOST = getCallbackHost()

/**
 * Génère un token d'accès pour un produit spécifique (collection ou disbursement)
 */
async function getToken(product: 'collection' | 'disbursement'): Promise<string> {
  const cached = tokenCache[product]
  // Expire le token 30 secondes avant pour éviter les race conditions
  if (cached && cached.expiresAt > Date.now() + 30000) {
    return cached.token
  }

  const userId = product === 'collection' ? COLL_USER_ID : DISB_USER_ID
  const apiKey = product === 'collection' ? COLL_API_KEY : DISB_API_KEY
  const subKey = product === 'collection' ? COLL_SUB_KEY : DISB_SUB_KEY

  if (!userId || !apiKey || !subKey) {
    throw new Error(`Configuration manquante pour ${product}.`)
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
    console.error(`MTN Token Error (${product}):`, response.status, errorText)
    throw new Error(`Erreur token MTN ${product}: ${response.status}`)
  }

  const data = await response.json()

  tokenCache[product] = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  }

  return data.access_token
}

/**
 * Nettoie et formate le numéro de téléphone pour MTN (format 2426XXXXXXXX)
 */
function formatPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '') // Ne garder que les chiffres

  // Si le numéro commence par +, on l'enlève (déjà fait par le regex ci-dessus)
  // Si le numéro commence par 06 ou 05 sans l'indicatif 242
  if (cleaned.length === 9 && (cleaned.startsWith('06') || cleaned.startsWith('05'))) {
    cleaned = '242' + cleaned.substring(1)
  }
  // Si le numéro fait 12 chiffres et commence par 242
  if (cleaned.length === 12 && cleaned.startsWith('242')) {
    return cleaned
  }

  // Par défaut, retourner tel quel si déjà formaté ou si format inconnu (pour sandbox)
  return cleaned
}

/**
 * Initie une demande de paiement (Encaissement)
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

  const payload = {
    amount: params.amount.toString(),
    currency: CURRENCY,
    externalId: referenceId,
    payer: {
      partyIdType: 'MSISDN',
      partyId: formatPhone(params.phone)
    },
    payerMessage: params.payerMessage.substring(0, 160),
    payeeNote: params.payeeNote.substring(0, 160)
  }

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
    body: JSON.stringify(payload),
    cache: 'no-store'
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    console.error('MTN requestToPay error:', {
      status: response.status,
      body: errorBody,
      payload
    })
    throw new Error(`Erreur MTN ${response.status}: ${JSON.stringify(errorBody)}`)
  }

  return referenceId
}

/**
 * Initie un transfert (Décaissement)
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

  const payload = {
    amount: params.amount.toString(),
    currency: CURRENCY,
    externalId: referenceId,
    payee: {
      partyIdType: 'MSISDN',
      partyId: formatPhone(params.phone)
    },
    payerMessage: params.payerMessage.substring(0, 160),
    payeeNote: params.payeeNote.substring(0, 160)
  }

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
    body: JSON.stringify(payload),
    cache: 'no-store'
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    console.error('MTN transfer error:', {
      status: response.status,
      body: errorBody,
      payload
    })
    throw new Error(`Erreur MTN ${response.status}: ${JSON.stringify(errorBody)}`)
  }

  return referenceId
}

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
  if (!response.ok) throw new Error(`Status error: ${response.status}`)
  return response.json()
}

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
  if (!response.ok) throw new Error(`Status error: ${response.status}`)
  return response.json()
}
