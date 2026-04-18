'use server'
import { adviseGroupCreation } from '@/lib/ai/modules/group-advisor'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'

export async function getGroupAdvice(params: {
  invitedUserIds:  string[]
  desiredAmount:   number
  desiredFrequency: string
}): Promise<ActionResult<any>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const advice = await adviseGroupCreation({
    creatorId: user.id,
    ...params
  })

  return { data: advice, success: true }
}
