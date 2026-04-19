'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { phoneToFakeEmail, isValidCongoPhone, normalizePhone } from '@/lib/utils/auth-helpers'
import { onboardingSchema } from '@/lib/validations/auth.schema'
import type { ActionResult } from '@/lib/types'
import { detectDuplicateAccount } from '@/lib/ai/modules/duplicate-detection'

// INSCRIPTION : numéro + PIN
export async function registerWithPin(
  phone: string,
  pin: string
): Promise<ActionResult> {
  if (!isValidCongoPhone(phone)) {
    return { error: 'Numéro de téléphone congolais invalide.' }
  }

  const normalized = normalizePhone(phone)

  try {
    // Vérifier le blacklist
    const { data: blacklisted } = await serviceClient
      .from('phone_blacklist')
      .select('id')
      .eq('phone', normalized)
      .maybeSingle()

    if (blacklisted) {
      return { error: 'Ce numéro est banni de la plateforme Likelemba.' }
    }

    // Vérifier si le numéro existe déjà
    const { data: existingUser } = await serviceClient
      .from('users')
      .select('id')
      .eq('phone', normalized)
      .maybeSingle()

    if (existingUser) {
      return { error: 'Ce numéro est déjà associé à un compte. Connecte-toi.' }
    }

    const fakeEmail = phoneToFakeEmail(phone)

    // Créer le compte Supabase Auth (sans envoyer d'email réel)
    const { data, error } = await serviceClient.auth.admin.createUser({
      email:         fakeEmail,
      password:      pin,
      email_confirm: true, // Confirmer automatiquement — aucun email envoyé
      user_metadata: { phone: normalized },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'Ce numéro est déjà associé à un compte.' }
      }
      return { error: error.message }
    }

    // Créer le profil dans public.users
    await serviceClient.from('users').upsert({
      id:    data.user.id,
      phone: normalized,
    })

  } catch (err: any) {
    console.error('registerWithPin error:', err)
    return { error: 'Erreur lors de l\'inscription' }
  }

  redirect('/onboarding')
}

// CONNEXION : numéro + PIN
export async function loginWithPin(
  phone: string,
  pin: string
): Promise<ActionResult> {
  const fakeEmail = phoneToFakeEmail(phone)
  const supabase  = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email:    fakeEmail,
      password: pin,
    })

    if (error) {
      return { error: 'Numéro ou PIN incorrect.' }
    }

    // Vérifier si le compte est banni
    const { data: profile } = await serviceClient
      .from('users')
      .select('is_banned, full_name, onboarding_done')
      .eq('id', data.user.id)
      .single()

    if (profile?.is_banned) {
      await supabase.auth.signOut()
      return { error: 'Ce compte est banni de la plateforme Likelemba.' }
    }

    // Rediriger vers onboarding si profil incomplet
    if (!profile?.onboarding_done || !profile?.full_name || profile.full_name === 'Utilisateur') {
      redirect('/onboarding')
    }

  } catch (err: any) {
    if (err.message === 'NEXT_REDIRECT') throw err
    console.error('loginWithPin error:', err)
    return { error: 'Erreur lors de la connexion' }
  }

  redirect('/dashboard')
}

// VÉRIFIER si un numéro existe (pour PhoneForm)
export async function checkPhoneExists(phone: string): Promise<boolean> {
  const normalized = normalizePhone(phone)
  const { data } = await serviceClient
    .from('users')
    .select('id')
    .eq('phone', normalized)
    .maybeSingle()
  return !!data
}

// CHANGER LE PIN (depuis la page profil)
export async function changePin(
  currentPin: string,
  newPin: string
): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    // Vérifier l'ancien PIN
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email:    user.email!,
      password: currentPin,
    })
    if (verifyError) return { error: 'PIN actuel incorrect.' }

    // Changer le PIN
    const { error } = await serviceClient.auth.admin.updateUserById(user.id, {
      password: newPin,
    })
    if (error) return { error: error.message }
    return { success: true }
  } catch (err: any) {
    console.error('changePin error:', err)
    return { error: 'Erreur lors du changement de PIN' }
  }
}

// ONBOARDING : sauvegarder le profil complet
export async function completeOnboarding(
  userId: string,
  data: {
    full_name:      string
    date_of_birth:  string
    quartier:       string
    profession:     string
    wallet_mtn?:    string
    wallet_airtel?: string
    avatar_url?:    string
  }
): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Normaliser les numéros wallet
  const normalizeWallet = (num?: string): string | null => {
    if (!num) return null
    const digits = num.replace(/\D/g, '')
    return digits.startsWith('242') ? digits : `242${digits.startsWith('0') ? digits.slice(1) : digits}`
  }

  try {
    const { error } = await serviceClient
      .from('users')
      .update({
        full_name:       data.full_name.trim(),
        date_of_birth:   data.date_of_birth,
        quartier:        data.quartier,
        profession:      data.profession,
        wallet_mtn:      normalizeWallet(data.wallet_mtn),
        wallet_airtel:   normalizeWallet(data.wallet_airtel),
        avatar_url:      data.avatar_url || null,
        onboarding_done: true,
        // Score de confiance de départ : 50 points de base + 5 bonus profil complet
        trust_score:     55,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) return { error: error.message }

    // S3: Détection de comptes multiples en arrière-plan
    detectDuplicateAccount(userId).catch(console.error)

  } catch (err: any) {
    console.error('completeOnboarding error:', err)
    return { error: 'Erreur lors de la finalisation du profil' }
  }

  redirect('/dashboard')
}

// UPDATE PROFILE
export async function updateProfile(
  userId: string,
  data: {
    full_name?:     string
    quartier?:      string
    profession?:    string
    wallet_mtn?:    string
    wallet_airtel?: string
    avatar_url?:    string
  }
): Promise<ActionResult> {
  const normalizeWallet = (num?: string): string | null => {
    if (!num) return null
    const digits = num.replace(/\D/g, '')
    return digits.startsWith('242') ? digits : `242${digits.startsWith('0') ? digits.slice(1) : digits}`
  }

  try {
    const updateData: any = { ...data, updated_at: new Date().toISOString() }
    if (data.wallet_mtn !== undefined) updateData.wallet_mtn = normalizeWallet(data.wallet_mtn)
    if (data.wallet_airtel !== undefined) updateData.wallet_airtel = normalizeWallet(data.wallet_airtel)

    const { error } = await serviceClient
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/profile')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (err: any) {
    console.error('updateProfile error:', err)
    return { error: 'Erreur lors de la mise à jour du profil' }
  }
}

// UPLOAD AVATAR : retourne l'URL publique
export async function uploadAvatar(
  userId:   string,
  file:     FormData
): Promise<ActionResult<{ url: string }>> {
  try {
    const imageFile = file.get('avatar') as File | null
    if (!imageFile || imageFile.size === 0) {
      return { error: 'Aucun fichier fourni ou fichier vide' }
    }

    if (imageFile.size > 2 * 1024 * 1024) {
      return { error: 'Image trop lourde (maximum 2 Mo)' }
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(imageFile.type)) {
      return { error: 'Format invalide. Utilise JPG, PNG ou WebP.' }
    }

    if (!userId || userId.length < 10) {
      return { error: 'Utilisateur invalide' }
    }

    const ext      = imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const safeExt  = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
    const fileName = `${userId}/avatar.${safeExt}`

    // Upload avec cache-busting pour éviter les images obsolètes
    const { error: uploadError } = await serviceClient.storage
      .from('avatars')
      .upload(fileName, imageFile, {
        upsert:      true,       // Écraser si existe
        contentType: imageFile.type,
        cacheControl: '3600',
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { error: `Erreur storage: ${uploadError.message}` }
    }

    // Obtenir l'URL publique avec un timestamp pour invalider le cache navigateur
    const { data: urlData } = serviceClient.storage
      .from('avatars')
      .getPublicUrl(fileName)

    const urlWithTimestamp = `${urlData.publicUrl}?t=${Date.now()}`

    // ── CORRECTION CRITIQUE : Sauvegarder immédiatement en base ──
    const { error: updateError } = await serviceClient
      .from('users')
      .update({
        avatar_url: urlWithTimestamp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return { error: `Erreur mise à jour profil: ${updateError.message}` }
    }

    // Invalider le cache des pages qui affichent l'avatar
    revalidatePath('/profile')
    revalidatePath('/dashboard')

    return { data: { url: urlWithTimestamp }, success: true }
  } catch (err: any) {
    console.error('uploadAvatar unexpected error:', err)
    return { error: 'Erreur inattendue lors de l\'upload' }
  }
}

// DÉCONNEXION
export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// RÉCUPÉRER L'UTILISATEUR COURANT
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users').select('*').eq('id', user.id).single()

  return profile
}
