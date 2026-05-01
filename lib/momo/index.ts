import crypto from 'crypto'

const BASE_URL = process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com'
const ENV = process.env.MTN_MOMO_ENV || 'sandbox'

// Collection Config
const COLL_SUB_KEY = process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY!
const COLL_USER_ID = process.env.MOMO_COLLECTION_API_USER_ID!
const COLL_API_KEY = process.env.MOMO_COLLECTION_API_KEY!

// Disbursement Config
const DISB_SUB_KEY = process.env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY!
const DISB_USER_ID = process.env.MOMO_DISBURSEMENT_API_USER_ID!
const DISB_API_KEY = process.env.MOMO_DISBURSEMENT_API_KEY!
 
 // Callback Config — Use production URL on Vercel, fallback to MOMO_CALLBACK_HOST or VERCEL_URL
 const CALLBACK_HOST = process.env.MOMO_CALLBACK_HOST 
   || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
   || process.env.NEXT_PUBLIC_APP_URL

/**
 * Génère un token d'accès pour un produit spécifique (collection ou disbursement)
 */
async function getToken(product: 'collection' | 'disbursement'): Promise<string> {
  const userId = product === 'collection' ? COLL_USER_ID : DISB_USER_ID
  const apiKey = product === 'collection' ? COLL_API_KEY : DISB_API_KEY
  const subKey = product === 'collection' ? COLL_SUB_KEY : DISB_SUB_KEY

  if (!userId || !apiKey || !subKey) {
    throw new Error(`Missing configuration for ${product}`)
  }

  const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64')

  const response = await fetch(`${BASE_URL}/${product}/token/`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': subKey,
      'Authorization': `Basic ${auth}`,
      'Content-Length': '0'
    },
    // Next.js caching behavior: disable cache for tokens
    cache: 'no-store'
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Error fetching token for ${product}:`, response.status, errorText)
    throw new Error(`Failed to get ${product} token: ${response.status}`)
  }

  const data = await response.json()
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

  // Format the phone to have the correct prefix if needed, usually MSISDN in Sandbox is standard
  // Example for MTN Sandbox: 46733123453
  
  const response = await fetch(`${BASE_URL}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Reference-Id': referenceId,
      'X-Target-Environment': ENV,
      'Ocp-Apim-Subscription-Key': COLL_SUB_KEY,
      'Content-Type': 'application/json',
      ...(CALLBACK_HOST && { 'X-Callback-Url': `${CALLBACK_HOST}/api/momo/callback/collection` })
    },
    body: JSON.stringify({
      amount: params.amount.toString(),
      currency: 'EUR', // Sandbox only supports EUR
      externalId: params.externalId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: params.phone
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
      'Ocp-Apim-Subscription-Key': COLL_SUB_KEY
    },
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

  const response = await fetch(`${BASE_URL}/disbursement/v1_0/transfer`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Reference-Id': referenceId,
      'X-Target-Environment': ENV,
      'Ocp-Apim-Subscription-Key': DISB_SUB_KEY,
      'Content-Type': 'application/json',
      ...(CALLBACK_HOST && { 'X-Callback-Url': `${CALLBACK_HOST}/api/momo/callback/disbursement` })
    },
    body: JSON.stringify({
      amount: params.amount.toString(),
      currency: 'EUR', // Sandbox only supports EUR
      externalId: params.externalId,
      payee: {
        partyIdType: 'MSISDN',
        partyId: params.phone
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
      'Ocp-Apim-Subscription-Key': DISB_SUB_KEY
    },
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`getDisbursementStatus failed with status ${response.status}`)
  }

  return response.json()
}
