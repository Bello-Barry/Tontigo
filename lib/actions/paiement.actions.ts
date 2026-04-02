'use server'

// ─── MTN Mobile Money (Congo Brazzaville) ────────────────────
export async function initiateMtnCollection(params: {
  phone:       string
  amount:      number
  reference:   string
  description: string
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const response = await fetch(
      `${process.env.MTN_MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      {
        method: 'POST',
        headers: {
          'Authorization':             `Bearer ${process.env.MTN_MOMO_API_KEY}`,
          'X-Reference-Id':            params.reference,
          'X-Target-Environment':      process.env.MTN_MOMO_ENV || 'sandbox',
          'Content-Type':              'application/json',
          'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY!,
        },
        body: JSON.stringify({
          amount:      params.amount.toString(),
          currency:    'XAF',
          externalId:  params.reference,
          payer:       { partyIdType: 'MSISDN', partyId: params.phone.replace('+', '') },
          payerMessage: params.description,
          payeeNote:   'Tontigo',
        }),
      }
    )
    return { success: response.status === 202, transactionId: params.reference }
  } catch {
    return { success: false, error: 'Erreur réseau MTN' }
  }
}

export async function initiateMtnDisbursement(params: {
  phone:       string
  amount:      number
  reference:   string
  description: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${process.env.MTN_MOMO_BASE_URL}/disbursement/v1_0/transfer`,
      {
        method: 'POST',
        headers: {
          'Authorization':             `Bearer ${process.env.MTN_MOMO_API_KEY}`,
          'X-Reference-Id':            params.reference,
          'X-Target-Environment':      process.env.MTN_MOMO_ENV || 'sandbox',
          'Content-Type':              'application/json',
          'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY!,
        },
        body: JSON.stringify({
          amount:      params.amount.toString(),
          currency:    'XAF',
          externalId:  params.reference,
          payee:       { partyIdType: 'MSISDN', partyId: params.phone.replace('+', '') },
          payerMessage: params.description,
          payeeNote:   'Tontigo — Cagnotte reçue',
        }),
      }
    )
    return { success: response.status === 202 }
  } catch {
    return { success: false, error: 'Erreur réseau MTN' }
  }
}

// ─── Airtel Money (Congo Brazzaville) ────────────────────────
async function getAirtelToken(): Promise<string | null> {
  try {
    const res = await fetch(`${process.env.AIRTEL_BASE_URL}/auth/oauth2/token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.AIRTEL_CLIENT_ID,
        client_secret: process.env.AIRTEL_CLIENT_SECRET,
        grant_type:    'client_credentials',
      }),
    })
    const data = await res.json()
    return data.access_token ?? null
  } catch {
    return null
  }
}

export async function initiateAirtelCollection(params: {
  phone:       string
  amount:      number
  reference:   string
  description: string
}): Promise<{ success: boolean; error?: string }> {
  const token = await getAirtelToken()
  if (!token) return { success: false, error: 'Impossible de contacter Airtel' }

  try {
    const response = await fetch(`${process.env.AIRTEL_BASE_URL}/merchant/v2/payments/`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
        'X-Country':     'CG',
        'X-Currency':    'XAF',
      },
      body: JSON.stringify({
        reference:   params.reference,
        subscriber:  { country: 'CG', currency: 'XAF', msisdn: params.phone.replace('+', '') },
        transaction: { amount: params.amount, country: 'CG', currency: 'XAF', id: params.reference },
      }),
    })
    const data = await response.json()
    return { success: data.status?.success === true }
  } catch {
    return { success: false, error: 'Erreur réseau Airtel' }
  }
}
