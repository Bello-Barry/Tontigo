import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '@/lib/types'

interface AuthStore {
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void
  updateAvatar: (url: string) => void
  updateTrustScore: (score: number) => void
  updateSubscription: (plan: 'free' | 'pro', expiresAt: string | null) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateAvatar: (url: string) =>
        set((state) => ({
          user: state.user ? { ...state.user, avatar_url: url } : null,
        })),
      updateTrustScore: (score) =>
        set((state) => ({
          user: state.user ? { ...state.user, trust_score: score } : null,
        })),
      updateSubscription: (plan, expiresAt) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, subscription_plan: plan, subscription_expires_at: expiresAt }
            : null,
        })),
      clearUser: () => set({ user: null }),
    }),
    { name: 'likelemba-auth' }
  )
)
