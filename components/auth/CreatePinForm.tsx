'use client'
import { useState } from 'react'
import { PinForm } from './PinForm'
import { ShieldCheck } from 'lucide-react'

interface CreatePinFormProps {
  onSubmit: (pin: string) => Promise<void>
  loading?: boolean
  error?:   string
}

export function CreatePinForm({ onSubmit, loading, error }: CreatePinFormProps) {
  const [step, setStep]               = useState<'create' | 'confirm'>('create')
  const [firstPin, setFirstPin]       = useState('')
  const [mismatchError, setMismatchError] = useState('')

  const handleFirstPin = async (pin: string) => {
    setFirstPin(pin)
    setMismatchError('')
    setStep('confirm')
  }

  const handleConfirm = async (pin: string) => {
    if (pin !== firstPin) {
      setMismatchError('Les PIN ne correspondent pas. Recommence.')
      setStep('create')
      setFirstPin('')
      return
    }
    await onSubmit(pin)
  }

  return (
    <div className="space-y-4">
      {/* Indicateur d'étape */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <div className={`w-8 h-0.5 transition-colors ${step === 'confirm' ? 'bg-emerald-500' : 'bg-slate-700'}`} />
        <div className={`w-2 h-2 rounded-full transition-colors ${step === 'confirm' ? 'bg-emerald-500' : 'bg-slate-700'}`} />
      </div>

      {step === 'create' ? (
        <PinForm
          title="Crée ton PIN"
          description="Choisis un code secret à 4 chiffres."
          onSubmit={handleFirstPin}
          error={mismatchError}
        />
      ) : (
        <PinForm
          title="Confirme ton PIN"
          description="Entre à nouveau ton PIN pour confirmer."
          onSubmit={handleConfirm}
          loading={loading}
          error={error}
        />
      )}

      <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-300/80 text-xs">
          Ne partage jamais ton PIN. Tontigo ne te le demandera jamais.
        </p>
      </div>
    </div>
  )
}
