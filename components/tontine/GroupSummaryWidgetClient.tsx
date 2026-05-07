'use client'
import { GroupSummaryWidget } from './GroupSummaryWidget'
import { getGroupAISummary } from '@/lib/actions/tontine.actions'

export function GroupSummaryWidgetClient({ groupId }: { groupId: string }) {
  const handleGenerate = async (id: string) => {
    const result = await getGroupAISummary(id)
    if (result.error || !result.data) return null
    return result.data
  }

  return <GroupSummaryWidget groupId={groupId} onGenerate={handleGenerate} />
}
