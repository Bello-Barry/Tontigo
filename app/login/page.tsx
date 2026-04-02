'use client'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PhoneForm } from '@/components/auth/PhoneForm'
import { OtpForm } from '@/components/auth/OtpForm'
import { ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [phone, setPhone] = useState('')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-500/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full" />
      </div>

      <div className="mb-8 text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">
          Tontigo<span className="text-green-500">.</span>
        </h1>
        <p className="text-muted-foreground flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          La tontine numérique sécurisée
        </p>
      </div>

      <Card className="w-full max-w-sm glass-card border-green-500/20 shadow-xl shadow-green-900/5">
        <CardHeader>
          <CardTitle>{phone ? 'Vérification' : 'Connexion / Inscription'}</CardTitle>
          <CardDescription>
            {phone ? 'Entrez le code reçu par SMS' : 'Entrez votre numéro MTN ou Airtel pour continuer'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!phone ? (
            <PhoneForm onSuccess={setPhone} />
          ) : (
            <OtpForm phone={phone} onBack={() => setPhone('')} />
          )}
        </CardContent>
      </Card>
      
      <p className="mt-8 text-xs text-muted-foreground text-center max-w-sm">
        En continuant, vous acceptez nos CGU et confirmez que la tontine est un engagement sérieux.
      </p>
    </div>
  )
}
