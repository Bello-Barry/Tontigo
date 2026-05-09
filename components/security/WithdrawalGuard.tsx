'use client'
import { useState, useEffect, useCallback } from 'react'
import { Fingerprint, Lock, Eye, EyeOff, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface WithdrawalGuardProps {
  amount:     number
  onSuccess:  () => void
  onCancel:   () => void
}

type Step = 'checking' | 'biometric' | 'pin' | 'success'

export function WithdrawalGuard({ amount, onSuccess, onCancel }: WithdrawalGuardProps) {
  const [step, setStep]               = useState<Step>('checking')
  const [hasBiometric, setHasBiometric] = useState(false)
  const [pin, setPin]                 = useState('')
  const [showPin, setShowPin]         = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  // ── Vérifier la disponibilité de la biométrie ────────────
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        if (typeof window === 'undefined' || !window.PublicKeyCredential) {
          setHasBiometric(false)
          setStep('pin')
          return
        }
        const available = await PublicKeyCredential
          .isUserVerifyingPlatformAuthenticatorAvailable()
        setHasBiometric(available)
        setStep(available ? 'biometric' : 'pin')
      } catch {
        setHasBiometric(false)
        setStep('pin')
      }
    }
    checkBiometric()
  }, [])

  // ── Authentification biométrique ─────────────────────────
  const handleBiometric = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32))

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Likelemba',
            id:   window.location.hostname,
          },
          user: {
            id:          crypto.getRandomValues(new Uint8Array(16)),
            name:        'likelemba-user',
            displayName: 'Likelemba User',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7  },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification:        'required',
            residentKey:             'discouraged',
          },
          timeout: 60000,
          attestation: 'none',
        },
      })

      if (credential) {
        setStep('success')
        setTimeout(onSuccess, 500)
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Biométrie annulée ou refusée.')
      } else if (err.name === 'NotSupportedError') {
        setError('Biométrie non supportée sur cet appareil.')
        setStep('pin')
        return
      } else {
        setError('Erreur biométrie. Utilise ton PIN.')
        setStep('pin')
        return
      }
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  // ── Authentification PIN ─────────────────────────────────
  const handlePinVerify = async () => {
    if (pin.length !== 4) { setError('PIN à 4 chiffres requis'); return }
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Session expirée'); setLoading(false); return }

      const { data: profile } = await supabase
        .from('users')
        .select('phone')
        .eq('id', user.id)
        .single()

      if (!profile) { setError('Profil introuvable'); setLoading(false); return }

      // Normalisation identique à phoneToFakeEmail
      const digits = profile.phone.replace(/\D/g, '')
      const normalized = digits.startsWith('242')
        ? digits
        : `242${digits.startsWith('0') ? digits.slice(1) : digits}`
      const fakeEmail = `${normalized}@likelemba.app`

      const { error: authError } = await supabase.auth.signInWithPassword({
        email:    fakeEmail,
        password: pin,
      })

      if (authError) {
        setError('PIN incorrect. Réessaie.')
        setPin('')
        setLoading(false)
        return
      }

      setStep('success')
      setTimeout(onSuccess, 500)

    } catch {
      setError('Erreur de vérification. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (n: number) =>
    new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-semibold text-sm">Confirmation retrait</span>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Montant */}
          <div className="text-center py-3 bg-slate-800/50 rounded-2xl">
            <p className="text-slate-400 text-xs mb-1">Montant à retirer</p>
            <p className="text-emerald-400 text-2xl font-bold">{formatAmount(amount)}</p>
          </div>

          {/* ── Étape : vérification ── */}
          {step === 'checking' && (
            <div className="text-center py-6">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 text-sm mt-3">Vérification...</p>
            </div>
          )}

          {/* ── Étape : biométrie ── */}
          {step === 'biometric' && (
            <div className="space-y-4">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30">
                  <Fingerprint className="w-10 h-10 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Confirme ton identité</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Utilise ton empreinte digitale ou Face ID
                  </p>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-xs text-center bg-red-400/10 rounded-xl py-2 px-3">
                  {error}
                </p>
              )}

              <Button
                onClick={handleBiometric}
                disabled={loading}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl gap-2"
              >
                <Fingerprint className="w-4 h-4" />
                {loading ? 'Vérification...' : 'Scanner mon empreinte'}
              </Button>

              <button
                onClick={() => { setStep('pin'); setError('') }}
                className="w-full text-slate-500 text-xs hover:text-slate-300 transition-colors py-2"
              >
                Utiliser mon PIN à la place
              </button>
            </div>
          )}

          {/* ── Étape : PIN ── */}
          {step === 'pin' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-700">
                  <Lock className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-white font-semibold">Entre ton PIN</p>
                <p className="text-slate-400 text-xs">Le même PIN que pour te connecter</p>
              </div>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '')
                    setPin(v)
                    setError('')
                  }}
                  onKeyDown={e => e.key === 'Enter' && pin.length === 4 && handlePinVerify()}
                  placeholder="• • • •"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3.5 text-center text-2xl tracking-[1rem] text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-xs text-center">{error}</p>
              )}

              <Button
                onClick={handlePinVerify}
                disabled={loading || pin.length !== 4}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl disabled:opacity-40"
              >
                {loading ? 'Vérification...' : 'Confirmer le retrait'}
              </Button>

              {hasBiometric && (
                <button
                  onClick={() => { setStep('biometric'); setError(''); setPin('') }}
                  className="w-full text-slate-500 text-xs hover:text-slate-300 transition-colors py-2 flex items-center justify-center gap-1.5"
                >
                  <Fingerprint className="w-3 h-3" />
                  Utiliser la biométrie
                </button>
              )}
            </div>
          )}

          {/* ── Étape : succès ── */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-white font-semibold">Identité confirmée !</p>
              <p className="text-slate-400 text-xs">Traitement du retrait en cours...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
