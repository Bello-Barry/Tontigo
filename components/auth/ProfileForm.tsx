'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-toastify'
import { updateProfile } from '@/lib/actions/auth.actions'
import { AvatarUpload } from './AvatarUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, Save } from 'lucide-react'
import { BRAZZAVILLE_QUARTIERS, PROFESSIONS } from '@/lib/utils/onboarding'
import { useRouter } from 'next/navigation'
import type { UserProfile } from '@/lib/types'

const profileUpdateSchema = z.object({
  full_name:     z.string().min(3).max(60),
  quartier:      z.string().min(1),
  profession:    z.string().min(1),
  wallet_mtn:    z.string().optional().or(z.literal('')),
  wallet_airtel: z.string().optional().or(z.literal('')),
})

type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

interface ProfileFormProps {
  profile: UserProfile
  userId:  string
}

export function ProfileForm({ profile, userId }: ProfileFormProps) {
  const [loading, setLoading]   = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const router = useRouter()

  const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name:     profile.full_name,
      quartier:      profile.quartier      ?? '',
      profession:    profile.profession    ?? '',
      wallet_mtn:    profile.wallet_mtn    ?? '',
      wallet_airtel: profile.wallet_airtel ?? '',
    },
  })

  const onSubmit = async (data: ProfileUpdateInput) => {
    setLoading(true)
    try {
      const result = await updateProfile(userId, {
        ...data,
        avatar_url: avatarUrl || undefined,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('✅ Profil mis à jour !')
      router.refresh() // Rafraîchir pour afficher les nouvelles données
    } catch {
      toast.error('Erreur lors de la mise à jour.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="glass-card p-5 space-y-5">
        <p className="text-slate-300 font-medium">Modifier mon profil</p>

        {/* Avatar */}
        <div className="flex justify-center">
          <AvatarUpload userId={userId} onUpload={setAvatarUrl} initialAvatar={avatarUrl} />
        </div>

        {/* Nom */}
        <div className="space-y-2">
          <Label className="text-slate-300">Nom complet</Label>
          <Input
            className="bg-slate-700 border-slate-600 text-white h-12"
            {...register('full_name')}
          />
          {errors.full_name && <p className="text-red-400 text-sm">{errors.full_name.message}</p>}
        </div>

        {/* Quartier */}
        <div className="space-y-2">
          <Label className="text-slate-300">Quartier</Label>
          <Select
            defaultValue={(profile.quartier as string) || ''}
            onValueChange={val => setValue('quartier', val, { shouldDirty: true })}
          >
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
              {BRAZZAVILLE_QUARTIERS.map(q => (
                <SelectItem key={q} value={q} className="text-white">{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Profession */}
        <div className="space-y-2">
          <Label className="text-slate-300">Profession</Label>
          <Select
            defaultValue={(profile.profession as string) || ''}
            onValueChange={val => setValue('profession', val, { shouldDirty: true })}
          >
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
              {PROFESSIONS.map(p => (
                <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Wallet MTN */}
        <div className="space-y-2">
          <Label className="text-slate-300 flex items-center gap-2">
            <span className="w-4 h-4 bg-yellow-400 rounded-full text-[9px] flex items-center justify-center text-black font-bold">M</span>
            MTN Money
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">+242</span>
            <Input
              type="tel"
              className="pl-14 bg-slate-700 border-slate-600 text-white h-12"
              {...register('wallet_mtn')}
            />
          </div>
          {errors.wallet_mtn && <p className="text-red-400 text-sm">{errors.wallet_mtn.message}</p>}
        </div>

        {/* Wallet Airtel */}
        <div className="space-y-2">
          <Label className="text-slate-300 flex items-center gap-2">
            <span className="w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold">A</span>
            Airtel Money
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">+242</span>
            <Input
              type="tel"
              className="pl-14 bg-slate-700 border-slate-600 text-white h-12"
              {...register('wallet_airtel')}
            />
          </div>
          {errors.wallet_airtel && <p className="text-red-400 text-sm">{errors.wallet_airtel.message}</p>}
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || !isDirty}
        className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold gap-2 disabled:opacity-40"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...</>
          : <><Save className="w-4 h-4" /> Sauvegarder</>
        }
      </Button>
    </form>
  )
}
