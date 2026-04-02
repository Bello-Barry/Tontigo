import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OnboardingForm } from '@/components/auth/OnboardingForm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md glass-card">
        <CardHeader>
          <CardTitle>Complétez votre profil</CardTitle>
          <CardDescription>
            Ces informations sont nécessaires pour participer aux tontines et recevoir vos cagnottes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm userId={user.id} />
        </CardContent>
      </Card>
    </div>
  )
}
