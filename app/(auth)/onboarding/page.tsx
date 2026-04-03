import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/auth/OnboardingForm'
import { isProfileComplete } from '@/lib/utils/onboarding'

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile && isProfileComplete(profile)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tontigo-gradient-text">Tontigo</h1>
          <p className="text-slate-400 text-sm mt-1">
            Bienvenue ! Complète ton profil pour commencer 🇨🇬
          </p>
        </div>

        <div className="glass-card p-6">
          <OnboardingForm userId={user.id} />
        </div>

      </div>
    </div>
  )
}
