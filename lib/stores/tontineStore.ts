import { create } from 'zustand'
import type { TontineGroup, Membership } from '@/lib/types'

interface TontineStore {
  activeGroup: TontineGroup | null
  groups: TontineGroup[]
  myMemberships: Membership[]
  setActiveGroup: (group: TontineGroup | null) => void
  setGroups: (groups: TontineGroup[]) => void
  setMyMemberships: (memberships: Membership[]) => void
  updateGroupStatus: (groupId: string, status: TontineGroup['status']) => void
}

export const useTontineStore = create<TontineStore>((set) => ({
  activeGroup: null,
  groups: [],
  myMemberships: [],
  setActiveGroup: (group) => set({ activeGroup: group }),
  setGroups: (groups) => set({ groups }),
  setMyMemberships: (memberships) => set({ myMemberships: memberships }),
  updateGroupStatus: (groupId, status) =>
    set((state) => ({
      groups: state.groups.map(g => g.id === groupId ? { ...g, status } : g),
    })),
}))
