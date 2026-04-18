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
    const { data: membership } = await serviceClient
      .from('memberships')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership)               return { error: 'Tu n\'est pas membre de ce groupe' }
    if (membership.status !== 'actif') return { error: 'Ton membership n\'est plus actif' }

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
  groupId:         string,
  audioUrl:        string,
  durationSeconds: number
): Promise<ActionResult<{ id: string }>> {

  if (!groupId)                         return { error: 'groupId manquant' }
  if (!audioUrl)                        return { error: 'audioUrl manquant' }
  if (!audioUrl.startsWith('https://')) return { error: 'URL audio invalide' }
  if (durationSeconds < 0)              return { error: 'Durée invalide' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { error: 'Non authentifié' }

    const { data: membership } = await serviceClient
      .from('memberships')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership)               return { error: 'Tu n\'est pas membre de ce groupe' }
    if (membership.status !== 'actif') return { error: 'Ton membership n\'est plus actif' }

    const { data, error } = await serviceClient
      .from('group_messages')
      .insert({
        group_id:               groupId,
        user_id:                user.id,
        content:                '🎤 Message vocal',
        message_type:           'audio',
        audio_url:              audioUrl,
        audio_duration_seconds: Math.round(Math.max(0, durationSeconds)),
        is_deleted:             false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('sendAudioMessage DB error:', error)
      return { error: `Erreur base de données: ${error.message}` }
    }

    return { data: { id: data.id }, success: true }

  } catch (error: any) {
    console.error('sendAudioMessage unexpected error:', error?.message)
    return { error: 'Erreur inattendue lors de l\'envoi' }
  }
}

export async function deleteMessage(messageId: string): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

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
