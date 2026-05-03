'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import crypto from 'crypto'
import { requestToPay, transfer as momoTransfer, getCollectionStatus, getDisbursementStatus } from '@/lib/momo'
import type { ActionResult } from '@/lib/types'

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
    }
    return { data: { reference: `SIM-${Date.now()}` }, success: true }
  } catch (error: any) {
    return { error: error.message || 'Échec MoMo' }
  }
}

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
    }
    return { data: { reference: `SIM-OUT-${Date.now()}` }, success: true }
  } catch (error: any) {
    return { error: error.message || 'Échec MoMo' }
  }
}

export async function checkPaymentStatus(referenceId: string) {
  try {
    const data = await getCollectionStatus(referenceId)
    return { data: { status: data.status }, success: true }
  } catch (error: any) { return { error: error.message } }
}

export async function checkTransferStatus(referenceId: string) {
  try {
    const data = await getDisbursementStatus(referenceId)
    return { data: { status: data.status }, success: true }
  } catch (error: any) { return { error: error.message } }
}
