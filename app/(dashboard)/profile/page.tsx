import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/auth/ProfileForm'
import { TrustScoreBadge } from '@/components/shared/TrustScoreBadge'
import { UserBadge } from '@/components/shared/UserBadge'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { formatDate } from '@/lib/utils/format'
import { Shield, BarChart3 } from 'lucide-react'
import Image from 'next/image'

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
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4 sm:space-y-6">

      {/* Titre */}
      <h1 className="text-xl sm:text-2xl font-bold text-white dark:text-white">
        Mon profil
      </h1>

      {/* Carte identité — flex adaptatif */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">

          {/* Avatar — plus grand sur mobile car centré */}
          <div className="relative w-20 h-20 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-slate-700 shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {profile.full_name?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
            )}
          </div>

          {/* Infos — centré sur mobile, aligné gauche sur desktop */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-white font-bold text-lg">{profile.full_name}</p>
            <p className="text-slate-400 text-sm">+{profile.phone}</p>
            <div className="flex justify-center sm:justify-start mt-1">
              <UserBadge badge={profile.badge} />
            </div>
          </div>

          {/* Score — en bas sur mobile, à droite sur desktop */}
          <div className="sm:ml-auto">
            <TrustScoreBadge score={profile.trust_score} size="lg" />
          </div>
        </div>
      </div>

      {/* Layout desktop : 2 colonnes pour infos fixes + stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Infos fixes */}
        <div className="glass-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
            <Shield className="w-4 h-4" />
            Informations fixes
          </div>
          {[
            { label: 'Téléphone',        value: `+${profile.phone}` },
            { label: 'Date de naissance', value: profile.date_of_birth ? formatDate(profile.date_of_birth) : '—' },
            { label: 'Membre depuis',    value: formatDate(profile.created_at) },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center gap-2">
              <span className="text-slate-400 text-sm shrink-0">{item.label}</span>
              <span className="text-white text-sm font-medium text-right truncate">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Statistiques */}
        <div className="glass-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
            <BarChart3 className="w-4 h-4" />
            Statistiques
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Complétés', value: profile.total_groups_completed, color: 'text-emerald-400' },
              { label: 'Incidents',  value: profile.total_groups_failed,   color: 'text-red-400'     },
              { label: 'Score',      value: `${profile.trust_score}`,      color: 'text-yellow-400'  },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-700/50 rounded-xl p-2 sm:p-3 text-center">
                <p className={`text-lg sm:text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulaire — pleine largeur */}
      <ProfileForm
        userId={user.id}
        initialData={{
          full_name:     profile.full_name     ?? '',
          quartier:      profile.quartier      ?? '',
          profession:    profile.profession    ?? '',
          wallet_mtn:    profile.wallet_mtn    ?? '',
          wallet_airtel: profile.wallet_airtel ?? '',
          avatar_url:    profile.avatar_url    ?? '',
        }}
      />

      {/* Bouton déconnexion */}
      <div className="pt-4 pb-12 border-t border-slate-700">
        <LogoutButton />
      </div>
    </div>
  )
}
