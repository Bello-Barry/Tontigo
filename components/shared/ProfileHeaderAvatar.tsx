'use client'
import { useAuthStore } from '@/lib/stores/authStore'
import Image from 'next/image'
import { useEffect } from 'react'

export function ProfileHeaderAvatar({ initialProfile }: { initialProfile: any }) {
  const { user, setUser } = useAuthStore()

  useEffect(() => {
    if (initialProfile && !user) {
      setUser(initialProfile)
    }
  }, [initialProfile, user, setUser])

  const avatarUrl = user?.avatar_url || initialProfile?.avatar_url
  const fullName = user?.full_name || initialProfile?.full_name

  return (
    <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden relative">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Avatar"
          fill
          className="object-cover"
          unoptimized
          key={avatarUrl}
        />
      ) : (
        <span className="text-xs font-medium uppercase">
          {fullName?.substring(0, 2) || 'UU'}
        </span>
      )}
    </div>
  )
}
