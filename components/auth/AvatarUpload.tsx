'use client'
import { useState } from 'react'
import Image from 'next/image'
import { uploadAvatar } from '@/lib/actions/auth.actions'
import { useAuthStore } from '@/lib/stores/authStore'
import { Loader2, Camera, AlertCircle } from 'lucide-react'

interface AvatarUploadProps {
  userId:     string
  initialUrl: string | null
  onUpload:   (url: string) => void
}

export function AvatarUpload({ userId, initialUrl, onUpload }: AvatarUploadProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [preview, setPreview] = useState<string | null>(initialUrl)
  const { updateAvatar } = useAuthStore()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview local immédiat
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('avatar', file)

    const result = await uploadAvatar(userId, formData)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      setPreview(initialUrl ?? null)
      return
    }

    if (result.data) {
      // ── Mettre à jour le store global pour que l'avatar
      // s'affiche partout instantanément ──────────────────
      updateAvatar(result.data.url)
      onUpload(result.data.url)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 relative">
          {preview ? (
            <Image
              src={preview}
              alt="Avatar"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-400">
              <Camera className="w-8 h-8" />
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>

        <label className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 rounded-full cursor-pointer hover:bg-emerald-600 transition-colors shadow-lg">
          <Camera className="w-4 h-4 text-white" />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
          />
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  )
}
