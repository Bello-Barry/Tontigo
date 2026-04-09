'use client'
import { useState } from 'react'
import { loginWithPin } from '@/lib/actions/auth.actions'
import { PhoneForm } from '@/components/auth/PhoneForm'
import { PinForm } from '@/components/auth/PinForm'
import { formatPhoneDisplay } from '@/lib/utils/auth-helpers'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [step, setStep]       = useState<'phone' | 'pin'>('phone')
  const [phone, setPhone]     = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handlePhoneNext = (phone: string, isExisting: boolean) => {
    if (!isExisting) {
      window.location.href = `/register?phone=${encodeURIComponent(phone)}`
      return
    }
    setPhone(phone)
    setStep('pin')
  }

  const handlePinSubmit = async (pin: string) => {
    setLoading(true)
    setError('')
    const result = await loginWithPin(phone, pin)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-10">
          <img src="/logo.png" alt="Likelemba Logo" className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-3xl font-bold likelemba-gradient-text">Likelemba</h1>
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
                <h2 className="text-xl font-bold text-white">Connexion</h2>
                <p className="text-slate-400 text-sm mt-1">Entre ton numéro de téléphone</p>
              </div>
              <PhoneForm onNext={handlePhoneNext} />
            </>
          ) : (
            <PinForm
              title="Entre ton PIN"
              description={`Code pour ${formatPhoneDisplay(phone)}`}
              onSubmit={handlePinSubmit}
              loading={loading}
              error={error}
            />
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}
