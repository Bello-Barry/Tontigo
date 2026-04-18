'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import type { ActionResult } from '@/lib/types'
import { moderateMessage } from '@/lib/ai/modules/chat-moderation'

export async function sendMessage(
  groupId: string,
  content: string
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Message vide' }

  try {
    // Vérifier que l'utilisateur est membre
    const { data: membership } = await supabase
      .from('memberships')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) return { error: 'Non autorisé' }

    const { data, error } = await serviceClient
      .from('group_messages')
      .insert({
        group_id: groupId,
        user_id:  user.id,
        content:  trimmed,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }

    // S5: Modération automatique du chat en arrière-plan
    moderateMessage({
      messageId: data.id,
      content:   trimmed,
      userId:    user.id,
      groupId,
    }).catch(console.error)

    return { data: { id: data.id }, success: true }
  } catch (err: any) {
    console.error('sendMessage error:', err)
    return { error: 'Erreur lors de l\'envoi du message' }
  }
}

export async function sendAudioMessage(
  groupId: string,
  audioUrl: string,
  durationSeconds: number
): Promise<ActionResult<{ id: string }>> {
  // Validation stricte des inputs
  if (!groupId || !audioUrl)        return { error: 'Paramètres invalides' }
  if (durationSeconds < 0)          return { error: 'Durée invalide' }
  if (!audioUrl.startsWith('http')) return { error: 'URL audio invalide' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    // Vérifier que l'utilisateur est membre
    const { data: membership } = await supabase
      .from('memberships')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) return { error: 'Non autorisé' }

    const { data, error } = await serviceClient
      .from('group_messages')
      .insert({
        group_id:                groupId,
        user_id:                 user.id,
        content:                 '🎤 Message vocal',  // Fallback texte
        message_type:            'audio',
        audio_url:               audioUrl,
        audio_duration_seconds:  Math.round(durationSeconds),
      })
      .select('id')
      .single()

    if (error) return { error: error.message }
    return { data: { id: data.id }, success: true }
  } catch (err: any) {
    console.error('sendAudioMessage error:', err)
    return { error: 'Erreur lors de l\'envoi du message vocal' }
  }
}

export async function deleteMessage(messageId: string): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    // Soft delete en mettant à jour is_deleted
    const { error } = await supabase
      .from('group_messages')
      .update({ is_deleted: true })
      .eq('id', messageId)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
    return { success: true }
  } catch (err: any) {
    console.error('deleteMessage error:', err)
    return { error: 'Erreur lors de la suppression' }
  }
}
