'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { getCollectionStatus, getDisbursementStatus } from '@/lib/momo'
import type { ActionResult } from '@/lib/types'

/**
 * Vérifie manuellement le statut d'une transaction MoMo (Collection ou Disbursement)
 * et met à jour la base de données. Sert de fallback si le webhook échoue.
 */
export async function checkMomoStatus(params: {
  referenceId: string,
  type: 'collection' | 'disbursement'
}): Promise<ActionResult<{ status: string }>> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    let momoData
    if (params.type === 'collection') {
      momoData = await getCollectionStatus(params.referenceId)
    } else {
      momoData = await getDisbursementStatus(params.referenceId)
    }

    const { status } = momoData
    console.log(`Manual check for ${params.type} ${params.referenceId}: ${status}`)

    if (status === 'SUCCESSFUL' || status === 'FAILED' || status === 'REJECTED') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const callbackPath = params.type === 'collection'
        ? '/api/momo/callback/collection'
        : '/api/momo/callback/disbursement'

      // Note: In local/production we use absolute URL if available, else fallback
      // Using fetch to trigger the existing logic in the route handlers
      try {
        await fetch(`${baseUrl}${callbackPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(momoData)
        })
      } catch (fetchErr) {
        console.error("Self-callback fetch failed:", fetchErr)
        // Fallback: If fetch fails (e.g. DNS or local port), we might need to call internal logic
        // But for most cases, this works if APP_URL is correct.
      }
    }

    return { data: { status }, success: true }
  } catch (err: any) {
    console.error('checkMomoStatus error:', err.message)
    return { error: 'Impossible de vérifier le statut auprès de MTN.' }
  }
}

// SIMULATION DE TRANSFERT (DÉCAISSEMENT)
export async function transfer(params: {
  phone: string,
  amount: number,
  externalId: string,
  payerMessage: string,
  payeeNote: string,
  walletType: 'mtn' | 'airtel'
}): Promise<ActionResult> {
  return { success: true }
}
