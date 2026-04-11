import { Sidebar } from '@/components/shared/Sidebar'
import { MobileNav } from '@/components/shared/MobileNav'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserBadge } from '@/components/shared/UserBadge'
import { TrustScoreBadge } from '@/components/shared/TrustScoreBadge'
import { isProfileComplete } from '@/lib/utils/onboarding'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AICoach } from '@/components/ui/AICoach'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    profile = data
  }

  if (!user || (profile && !isProfileComplete(profile))) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Desktop */}
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header (Topbar) */}
        <header className="h-16 border-b bg-card/50 backdrop-blur flex items-center justify-between px-4 md:px-8 z-10">
          <div className="md:hidden flex items-center gap-2">
             <img src="/logo.png" alt="Logo" className="w-8 h-8" />
             <h1 className="text-xl font-bold text-primary">Likelemba</h1>
          </div>
          
          <div className="hidden md:flex gap-4 items-center">
             {profile && <TrustScoreBadge score={profile.trust_score} />}
             {profile && <UserBadge badge={profile.badge} />}
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <NotificationBell />
            <Link href="/profile">
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-medium uppercase">{profile?.full_name?.substring(0, 2) || 'UU'}</span>
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Contenu de la page */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
        
        {/* Agent IA: Coach Likelemba */}
        <AICoach />
      </main>

      {/* Navigation Mobile */}
      <MobileNav />
    </div>
  )
}
