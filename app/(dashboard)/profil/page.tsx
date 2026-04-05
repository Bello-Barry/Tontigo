import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/auth/ProfileForm'
import { TrustScoreBadge } from '@/components/shared/TrustScoreBadge'
import { UserBadge } from '@/components/shared/UserBadge'
import { formatDate } from '@/lib/utils/format'
import Image from 'next/image'
import { User, Shield } from 'lucide-react'

export default async function ProfilPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Mon profil</h1>

      {/* Avatar + Score */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-700 shrink-0">
          {profile.avatar_url
            ? <Image src={profile.avatar_url} alt={profile.full_name} fill className="object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-slate-400" />
              </div>
          }
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-lg">{profile.full_name}</p>
          <p className="text-slate-400 text-sm">+{profile.phone}</p>
          <div className="flex items-center gap-2 mt-1">
            <UserBadge badge={profile.badge} />
          </div>
        </div>
        <TrustScoreBadge score={profile.trust_score} size="lg" />
      </div>

      {/* Infos non modifiables */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-medium mb-1">
          <Shield className="w-4 h-4" />
          Informations fixes
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 text-sm">Date de naissance</span>
          <span className="text-white text-sm">
            {profile.date_of_birth ? formatDate(profile.date_of_birth) : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 text-sm">Téléphone</span>
          <span className="text-white text-sm">+{profile.phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 text-sm">Membre depuis</span>
          <span className="text-white text-sm">{formatDate(profile.created_at)}</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Complétés', value: profile.total_groups_completed, color: 'text-emerald-400' },
          { label: 'En cours',  value: 0,                              color: 'text-yellow-400'  },
          { label: 'Incidents', value: profile.total_groups_failed,    color: 'text-red-400'     },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-3 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Formulaire de modification */}
      <ProfileForm profile={profile} userId={user.id} />
    </div>
  )
}
