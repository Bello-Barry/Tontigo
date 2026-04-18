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

    // Validation immédiate côté client avant l'upload
    if (file.size > 2 * 1024 * 1024) {
      setError('Image trop lourde (maximum 2 Mo)')
      // Vider l'input pour permettre de resélectionner
      e.target.value = ''
      return
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Format invalide. Utilise JPG, PNG ou WebP.')
      e.target.value = ''
      return
    }

    // Preview local immédiat
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setLoading(true)
    setError('')

    // ── IMPORTANT : timeout de sécurité pour éviter le chargement infini ──
    const timeoutId = setTimeout(() => {
      setLoading(false)
      setPreview(initialUrl ?? null)
      setError('Temps dépassé. Vérifie ta connexion et réessaie.')
    }, 20_000)  // 20 secondes max

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const result = await uploadAvatar(userId, formData)

      clearTimeout(timeoutId)

      if (result.error) {
        setError(result.error)
        setPreview(initialUrl ?? null)
        return
      }

      if (result.data) {
        // Mettre à jour le store global pour afficher partout
        updateAvatar(result.data.url)
        onUpload(result.data.url)
      }

    } catch (err: any) {
      clearTimeout(timeoutId)
      setError('Erreur lors de l\'upload. Réessaie.')
      setPreview(initialUrl ?? null)
      console.error('Avatar upload error:', err)
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
      // Vider l'input pour permettre de re-uploader le même fichier
      e.target.value = ''
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
