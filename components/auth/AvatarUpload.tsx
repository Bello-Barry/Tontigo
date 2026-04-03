'use client'
import { useRef, useState } from 'react'
import { uploadAvatar } from '@/lib/actions/auth.actions'
import { Camera, User, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface AvatarUploadProps {
  userId:   string
  onUpload: (url: string) => void
}

export function AvatarUpload({ userId, onUpload }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const inputRef              = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview local immédiat
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setLoading(true)
    setError('')
    const formData = new FormData()
    formData.append('avatar', file)

    const result = await uploadAvatar(userId, formData)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      setPreview(null)
      return
    }
    if (result.data) onUpload(result.data.url)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Zone de clic */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-24 h-24 rounded-full bg-slate-700 border-2 border-dashed border-slate-500 hover:border-emerald-500 transition-colors overflow-hidden group"
      >
        {preview ? (
          <Image src={preview} alt="Avatar" fill className="object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <User className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition-colors" />
          </div>
        )}

        {/* Overlay camera */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {loading
            ? <Loader2 className="w-6 h-6 text-white animate-spin" />
            : <Camera className="w-6 h-6 text-white" />
          }
        </div>
      </button>

      <p className="text-slate-400 text-xs text-center">
        {preview ? 'Appuie pour changer' : 'Ajoute ta photo (optionnel)'}
      </p>

      {error && <p className="text-red-400 text-xs text-center">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
