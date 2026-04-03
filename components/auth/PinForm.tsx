'use client'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Lock } from 'lucide-react'

interface PinFormProps {
  title:       string
  description: string
  onSubmit:    (pin: string) => Promise<void>
  loading?:    boolean
  error?:      string
}

export function PinForm({ title, description, onSubmit, loading, error }: PinFormProps) {
  const [pin, setPin]         = useState(['', '', '', ''])
  const [visible, setVisible] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    if (value && index < 3) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const newPin = [...pin]
      newPin[index - 1] = ''
      setPin(newPin)
      inputs.current[index - 1]?.focus()
    }
  }

  const handleConfirm = async () => {
    const fullPin = pin.join('')
    if (fullPin.length === 4) await onSubmit(fullPin)
  }

  const isComplete = pin.every(d => d !== '')

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>

      {/* 4 cases PIN */}
      <div className="flex justify-center gap-3">
        {pin.map((digit, i) => (
          <input
            key={i}
            ref={el => { inputs.current[i] = el }}
            type={visible ? 'text' : 'password'}
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className="
              w-14 h-16 text-center text-2xl font-bold
              bg-slate-800 border-2 border-slate-700
              focus:border-emerald-500 focus:outline-none
              rounded-xl text-white transition-colors caret-transparent
            "
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="flex items-center gap-2 text-slate-400 text-sm mx-auto"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        {visible ? 'Masquer' : 'Afficher'} le PIN
      </button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      <Button
        onClick={handleConfirm}
        disabled={!isComplete || loading}
        className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold disabled:opacity-40"
      >
        {loading ? 'Chargement...' : 'Confirmer'}
      </Button>
    </div>
  )
}
