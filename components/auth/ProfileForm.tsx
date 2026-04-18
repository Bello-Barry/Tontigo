'use client'
import { useState, useEffect } from 'react'
import { updateProfile } from '@/lib/actions/auth.actions'
import { useAuthStore } from '@/lib/stores/authStore'
import { AvatarUpload } from './AvatarUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-toastify'
import { Loader2, Save } from 'lucide-react'

interface ProfileFormProps {
  userId: string
  initialData: {
    full_name:     string
    quartier:      string
    profession:    string
    wallet_mtn:    string
    wallet_airtel: string
    avatar_url:    string
  }
}

export function ProfileForm({ userId, initialData }: ProfileFormProps) {
  const { user, setUser } = useAuthStore()

  // Priorité : store Zustand > props (le store est mis à jour après upload)
  const currentAvatarUrl = user?.avatar_url ?? initialData.avatar_url ?? ''

  const [formData, setFormData] = useState({
    full_name:     user?.full_name ?? initialData.full_name,
    quartier:      user?.quartier ?? initialData.quartier,
    profession:    user?.profession ?? initialData.profession,
    wallet_mtn:    user?.wallet_mtn ?? initialData.wallet_mtn,
    wallet_airtel: user?.wallet_airtel ?? initialData.wallet_airtel,
    avatar_url:    currentAvatarUrl,
  })

  const [loading, setLoading] = useState(false)

  // Sync si le store change (ex: upload depuis un autre onglet)
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        avatar_url: user.avatar_url ?? prev.avatar_url,
        full_name: user.full_name ?? prev.full_name,
      }))
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await updateProfile(userId, formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Profil mis à jour !')
      if (user) {
        setUser({ ...user, ...formData })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="glass-card p-4 sm:p-6 space-y-6">
        <div className="flex justify-center">
          <AvatarUpload
            userId={userId}
            initialUrl={formData.avatar_url}
            onUpload={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-slate-300">Nom complet</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profession" className="text-slate-300">Profession</Label>
            <Input
              id="profession"
              value={formData.profession}
              onChange={handleChange}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quartier" className="text-slate-300">Quartier</Label>
            <Input
              id="quartier"
              value={formData.quartier}
              onChange={handleChange}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-700">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Numéros Mobile Money
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wallet_mtn" className="text-slate-300">MTN MoMo</Label>
              <Input
                id="wallet_mtn"
                placeholder="06 xxx xx xx"
                value={formData.wallet_mtn}
                onChange={handleChange}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet_airtel" className="text-slate-300">Airtel Money</Label>
              <Input
                id="wallet_airtel"
                placeholder="05 xxx xx xx"
                value={formData.wallet_airtel}
                onChange={handleChange}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
