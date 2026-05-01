import crypto from 'crypto'

const BASE_URL = process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com'
const ENV = process.env.MTN_MOMO_ENV || 'sandbox'
const CURRENCY = process.env.MTN_MOMO_CURRENCY || (ENV === 'sandbox' ? 'EUR' : 'XAF')

const COLL_SUB_KEY = process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY!
const COLL_USER_ID = process.env.MOMO_COLLECTION_API_USER_ID!
const COLL_API_KEY = process.env.MOMO_COLLECTION_API_KEY!

const DISB_SUB_KEY = process.env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY!
const DISB_USER_ID = process.env.MOMO_DISBURSEMENT_API_USER_ID!
const DISB_API_KEY = process.env.MOMO_DISBURSEMENT_API_KEY!
 
const CALLBACK_HOST = process.env.MOMO_CALLBACK_HOST
   || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
   || process.env.NEXT_PUBLIC_APP_URL

async function getToken(product: 'collection' | 'disbursement'): Promise<string> {
  const userId = product === 'collection' ? COLL_USER_ID : DISB_USER_ID
  const apiKey = product === 'collection' ? COLL_API_KEY : DISB_API_KEY
  const subKey = product === 'collection' ? COLL_SUB_KEY : DISB_SUB_KEY

  if (!userId || !apiKey || !subKey) throw new Error(`Missing MoMo config for ${product}`)

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

  if (!response.ok) throw new Error(`MoMo Token Error: ${response.status}`)
  const data = await response.json()
  return data.access_token
}

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

  // IMPORTANT: externalId must be max 20 chars for some MoMo APIs
  // If it's a UUID, we take the last 20 chars or a hash
  const safeExternalId = params.externalId.length > 20
    ? params.externalId.replace(/-/g, '').slice(-20)
    : params.externalId

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
      externalId: safeExternalId,
      payer: { partyIdType: 'MSISDN', partyId: cleanPhone },
      payerMessage: params.payerMessage.slice(0, 80),
      payeeNote: params.payeeNote.slice(0, 80)
    }),
    cache: 'no-store'
  })

  if (response.status !== 202) throw new Error(`MoMo RequestToPay: ${response.status}`)
  return referenceId
}

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
  const safeExternalId = params.externalId.length > 20
    ? params.externalId.replace(/-/g, '').slice(-20)
    : params.externalId

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
      externalId: safeExternalId,
      payee: { partyIdType: 'MSISDN', partyId: cleanPhone },
      payerMessage: params.payerMessage.slice(0, 80),
      payeeNote: params.payeeNote.slice(0, 80)
    }),
    cache: 'no-store'
  })

  if (response.status !== 202) throw new Error(`MoMo Transfer: ${response.status}`)
  return referenceId
}

export async function getCollectionStatus(referenceId: string) {
  const token = await getToken('collection')
  const res = await fetch(`${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Target-Environment': ENV,
      'Ocp-Apim-Subscription-Key': COLL_SUB_KEY
    },
    cache: 'no-store'
  })
  return res.json()
}

export async function getDisbursementStatus(referenceId: string) {
  const token = await getToken('disbursement')
  const res = await fetch(`${BASE_URL}/disbursement/v1_0/transfer/${referenceId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Target-Environment': ENV,
      'Ocp-Apim-Subscription-Key': DISB_SUB_KEY
    },
    cache: 'no-store'
  })
  return res.json()
}
