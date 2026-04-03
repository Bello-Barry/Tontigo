'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { registerWithPin } from '@/lib/actions/auth.actions'
import { PhoneForm } from '@/components/auth/PhoneForm'
import { CreatePinForm } from '@/components/auth/CreatePinForm'
import { formatPhoneDisplay } from '@/lib/utils/auth-helpers'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function RegisterContent() {
  const searchParams = useSearchParams()
  const initialPhone = searchParams.get('phone') ?? ''

  const [step, setStep]       = useState<'phone' | 'pin'>(initialPhone ? 'pin' : 'phone')
  const [phone, setPhone]     = useState(initialPhone)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handlePhoneNext = (phone: string, isExisting: boolean) => {
    if (isExisting) {
      window.location.href = '/login'
      return
    }
    setPhone(phone)
    setStep('pin')
  }

  const handlePinSubmit = async (pin: string) => {
    setLoading(true)
    setError('')
    const result = await registerWithPin(phone, pin)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tontigo-gradient-text">Tontigo</h1>
          <p className="text-slate-400 text-sm mt-1">La tontine digitale de confiance</p>
        </div>

        <div className="glass-card p-6 space-y-6">
          {step === 'pin' && (
            <button
              onClick={() => { setStep('phone'); setError('') }}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {formatPhoneDisplay(phone)}
            </button>
          )}

          {step === 'phone' ? (
            <>
              <div>
                <h2 className="text-xl font-bold text-white">Créer un compte</h2>
                <p className="text-slate-400 text-sm mt-1">Entre ton numéro de téléphone</p>
              </div>
              <PhoneForm onNext={handlePhoneNext} />
            </>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-bold text-white">Crée ton PIN secret</h2>
                <p className="text-slate-400 text-sm mt-1">Pour {formatPhoneDisplay(phone)}</p>
              </div>
              <CreatePinForm
                onSubmit={handlePinSubmit}
                loading={loading}
                error={error}
              />
            </>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  )
}
