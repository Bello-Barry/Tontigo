'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

// SIMULATION DE TRANSFERT (DÉCAISSEMENT)
export async function transfer(params: {
  phone: string,
  amount: number,
  externalId: string,
  payerMessage: string,
  payeeNote: string,
  walletType: 'mtn' | 'airtel'
}): Promise<ActionResult> {
  // Simuler un appel API réussi
  return { success: true }
}
