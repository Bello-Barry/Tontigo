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
}

export async function sendAudioMessage(
  groupId: string,
  audioUrl: string,
  durationSeconds: number
): Promise<ActionResult<{ id: string }>> {
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
      audio_duration_seconds:  durationSeconds,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { data: { id: data.id }, success: true }
}

export async function deleteMessage(messageId: string): Promise<ActionResult> {
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
}
