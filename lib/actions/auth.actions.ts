'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import type { ActionResult } from '@/lib/types'

export async function sendOtp(phone: string): Promise<ActionResult> {
  // Vérifier le blacklist
  const { data: blacklisted } = await serviceClient
    .from('phone_blacklist').select('id').eq('phone', phone).maybeSingle()

  if (blacklisted) {
    return { error: 'Ce numéro est banni de la plateforme Tontigo.' }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: 'sms' }
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function verifyOtp(phone: string, token: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })

  if (error) return { error: 'Code incorrect ou expiré.' }

  // Vérifier si l'onboarding est nécessaire
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', data.user!.id)
    .single()

  if (!profile?.full_name || profile.full_name === 'Utilisateur') {
    redirect('/onboarding')
  }

  redirect('/dashboard')
}

export async function completeOnboarding(
  userId: string,
  data: { full_name: string; wallet_mtn?: string; wallet_airtel?: string }
): Promise<ActionResult> {
  const { error } = await serviceClient
    .from('users')
    .update({
      full_name:     data.full_name,
      wallet_mtn:    data.wallet_mtn || null,
      wallet_airtel: data.wallet_airtel || null,
      updated_at:    new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users').select('*').eq('id', user.id).single()

  return profile
}
