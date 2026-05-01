import crypto from 'crypto'

const BASE_URL = process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com'
const ENV = process.env.MTN_MOMO_ENV || 'sandbox'
const CURRENCY = process.env.MTN_MOMO_CURRENCY || (ENV === 'sandbox' ? 'EUR' : 'XAF')

// Collection Config
const COLL_SUB_KEY = process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY!
const COLL_USER_ID = process.env.MOMO_COLLECTION_API_USER_ID!
const COLL_API_KEY = process.env.MOMO_COLLECTION_API_KEY!

// Disbursement Config
const DISB_SUB_KEY = process.env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY!
const DISB_USER_ID = process.env.MOMO_DISBURSEMENT_API_USER_ID!
const DISB_API_KEY = process.env.MOMO_DISBURSEMENT_API_KEY!
 
// Callback Config
const CALLBACK_HOST = process.env.MOMO_CALLBACK_HOST
   || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
   || process.env.NEXT_PUBLIC_APP_URL

/**
 * Génère un token d'accès
 */
async function getToken(product: 'collection' | 'disbursement'): Promise<string> {
  const userId = product === 'collection' ? COLL_USER_ID : DISB_USER_ID
  const apiKey = product === 'collection' ? COLL_API_KEY : DISB_API_KEY
  const subKey = product === 'collection' ? COLL_SUB_KEY : DISB_SUB_KEY

  if (!userId || !apiKey || !subKey) {
    throw new Error(`Configuration MoMo ${product} manquante.`)
  }

  const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64')

  try {
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
      console.error(`Token Error (${product}):`, response.status, errorText)
      throw new Error(`MoMo Token Error: ${response.status}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (err: any) {
    console.error(`MoMo Token Fetch Exception (${product}):`, err.message)
    throw err
  }
}

/**
 * requestToPay
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
  const cleanPhone = params.phone.replace('+', '').trim()

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
      currency: CURRENCY,
      externalId: params.externalId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: cleanPhone
      },
      payerMessage: params.payerMessage.slice(0, 80),
      payeeNote: params.payeeNote.slice(0, 80)
    }),
    cache: 'no-store'
  })

  if (response.status !== 202) {
    const errorText = await response.text()
    console.error('requestToPay API Error:', response.status, errorText)
    throw new Error(`MoMo requestToPay: ${response.status}`)
  }

  return referenceId
}

/**
 * transfer
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
  const cleanPhone = params.phone.replace('+', '').trim()

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
      currency: CURRENCY,
      externalId: params.externalId,
      payee: {
        partyIdType: 'MSISDN',
        partyId: cleanPhone
      },
      payerMessage: params.payerMessage.slice(0, 80),
      payeeNote: params.payeeNote.slice(0, 80)
    }),
    cache: 'no-store'
  })

  if (response.status !== 202) {
    const errorText = await response.text()
    console.error('transfer API Error:', response.status, errorText)
    throw new Error(`MoMo transfer: ${response.status}`)
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
      'Ocp-Apim-Subscription-Key': COLL_SUB_KEY
    },
    cache: 'no-store'
  })
  if (!response.ok) throw new Error(`MoMo Status Error: ${response.status}`)
  return response.json()
}

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
  if (!response.ok) throw new Error(`MoMo Status Error: ${response.status}`)
  return response.json()
}
