'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { requestToPay, transfer as momoTransfer, getCollectionStatus, getDisbursementStatus } from '@/lib/momo'
import type { ActionResult } from '@/lib/types'

/**
 * Encaissement Mobile Money (MTN / Airtel)
 */
export async function collectPayment(params: {
  amount: number
  phone: string
  walletType: 'mtn' | 'airtel'
  externalId: string
  message: string
}): Promise<ActionResult<{ reference: string }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  try {
    if (params.walletType === 'mtn') {
      const referenceId = await requestToPay({
        amount: params.amount,
        phone: params.phone,
        externalId: params.externalId || crypto.randomUUID(),
        payerMessage: params.message.slice(0, 80),
        payeeNote: 'Likelemba'
      })
      return { data: { reference: referenceId }, success: true }
    } else {
      const simulatedRef = `AIRTEL-${Date.now()}`
      return { data: { reference: simulatedRef }, success: true }
    }
  } catch (error: any) {
    console.error('collectPayment error:', error)
    return { error: error.message || 'Échec du paiement' }
  }
}

/**
 * Versement / Retrait Mobile Money
 */
export async function transferFunds(params: {
  amount: number
  phone: string
  walletType: 'mtn' | 'airtel'
  externalId: string
  message: string
}): Promise<ActionResult<{ reference: string }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  try {
    if (params.walletType === 'mtn') {
      const referenceId = await momoTransfer({
        amount: params.amount,
        phone: params.phone,
        externalId: params.externalId || crypto.randomUUID(),
        payerMessage: params.message.slice(0, 80),
        payeeNote: 'Likelemba'
      })
      return { data: { reference: referenceId }, success: true }
    } else {
      const simulatedRef = `AIRTEL-OUT-${Date.now()}`
      return { data: { reference: simulatedRef }, success: true }
    }
  } catch (error: any) {
    console.error('transferFunds error:', error)
    return { error: error.message || 'Échec du transfert' }
  }
}

export async function checkPaymentStatus(referenceId: string): Promise<ActionResult<{ status: string }>> {
  try {
    const data = await getCollectionStatus(referenceId)
    return { data: { status: data.status }, success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function checkTransferStatus(referenceId: string): Promise<ActionResult<{ status: string }>> {
  try {
    const data = await getDisbursementStatus(referenceId)
    return { data: { status: data.status }, success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
