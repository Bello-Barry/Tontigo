'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  type OnboardingStep1Input,
  type OnboardingStep2Input,
  type OnboardingStep3Input,
} from '@/lib/validations/auth.schema'
import { completeOnboarding } from '@/lib/actions/auth.actions'
import { BRAZZAVILLE_QUARTIERS, PROFESSIONS } from '@/lib/utils/onboarding'
import { AvatarUpload } from './AvatarUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, ArrowRight, CheckCircle2, User, MapPin, Wallet } from 'lucide-react'

interface OnboardingFormProps {
  userId: string
}

type Step = 1 | 2 | 3

const STEP_CONFIG = [
  { label: 'Identité',    icon: User    },
  { label: 'Localisation', icon: MapPin  },
  { label: 'Paiements',   icon: Wallet  },
]

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const [step, setStep]         = useState<Step>(1)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Données accumulées entre les étapes
  const [step1Data, setStep1Data] = useState<OnboardingStep1Input | null>(null)
  const [step2Data, setStep2Data] = useState<OnboardingStep2Input | null>(null)

  // ── Formulaire Etape 1 ────────────────────────────────────────
  const form1 = useForm<OnboardingStep1Input>({
    resolver: zodResolver(onboardingStep1Schema),
    defaultValues: step1Data ?? undefined,
  })

  // ── Formulaire Etape 2 ────────────────────────────────────────
  const form2 = useForm<OnboardingStep2Input>({
    resolver: zodResolver(onboardingStep2Schema),
    defaultValues: step2Data ?? undefined,
  })

  // ── Formulaire Etape 3 ────────────────────────────────────────
  const form3 = useForm<OnboardingStep3Input>({
    resolver: zodResolver(onboardingStep3Schema),
  })

  // ── Soumissions ───────────────────────────────────────────────
  const handleStep1 = form1.handleSubmit((data) => {
    setStep1Data(data)
    setStep(2)
  })

  const handleStep2 = form2.handleSubmit((data) => {
    setStep2Data(data)
    setStep(3)
  })

  const handleStep3 = form3.handleSubmit(async (data) => {
    if (!step1Data || !step2Data) return
    setLoading(true)
    setError('')

    const result = await completeOnboarding(userId, {
      ...step1Data,
      ...step2Data,
      ...data,
      avatar_url: avatarUrl || undefined,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  })

  // ── UI ────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Barre de progression */}
      <div className="space-y-3">
        <div className="flex justify-between">
          {STEP_CONFIG.map((s, i) => {
            const stepNum = (i + 1) as Step
            const isDone    = step > stepNum
            const isCurrent = step === stepNum
            const Icon = s.icon
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className={`
                  w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                  ${isDone    ? 'bg-emerald-500 border-emerald-500' : ''}
                  ${isCurrent ? 'bg-emerald-500/20 border-emerald-500' : ''}
                  ${!isDone && !isCurrent ? 'bg-slate-800 border-slate-600' : ''}
                `}>
                  {isDone
                    ? <CheckCircle2 className="w-4 h-4 text-white" />
                    : <Icon className={`w-4 h-4 ${isCurrent ? 'text-emerald-400' : 'text-slate-500'}`} />
                  }
                </div>
                <span className={`text-xs ${isCurrent ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
        {/* Barre de progression ligne */}
        <div className="h-1 bg-slate-700 rounded-full relative overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500 absolute left-0 top-0 bottom-0"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* ── ETAPE 1 : Identité ───────────────────────────────── */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">Qui es-tu ?</h2>
            <p className="text-slate-400 text-sm mt-1">Ton identité sur Tontigo</p>
          </div>

          <AvatarUpload userId={userId} onUpload={setAvatarUrl} />

          <div className="space-y-2">
            <Label className="text-slate-300">Nom complet *</Label>
            <Input
              placeholder="Ex : Jean-Pierre Mouamba"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
              {...form1.register('full_name')}
            />
            {form1.formState.errors.full_name && (
              <p className="text-red-400 text-sm">{form1.formState.errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Date de naissance *</Label>
            <Input
              type="date"
              max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="bg-slate-800 border-slate-700 text-white h-12"
              {...form1.register('date_of_birth')}
            />
            {form1.formState.errors.date_of_birth && (
              <p className="text-red-400 text-sm">{form1.formState.errors.date_of_birth.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center">
            Continuer <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      )}

      {/* ── ETAPE 2 : Localisation & Profession ─────────────── */}
      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">Où et quoi ?</h2>
            <p className="text-slate-400 text-sm mt-1">Ta localisation et ton activité</p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Quartier / Arrondissement *</Label>
            {/* @ts-ignore */}
            <Select onValueChange={(val) => form2.setValue('quartier', val)} defaultValue={form2.getValues('quartier') as string | undefined}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
                <SelectValue placeholder="Sélectionne ton quartier..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                {BRAZZAVILLE_QUARTIERS.map((q) => (
                  <SelectItem key={q} value={q} className="text-white hover:bg-slate-700">
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form2.formState.errors.quartier && (
              <p className="text-red-400 text-sm">{form2.formState.errors.quartier.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Profession / Activité *</Label>
            {/* @ts-ignore */}
            <Select onValueChange={(val) => form2.setValue('profession', val)} defaultValue={form2.getValues('profession') as string | undefined}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
                <SelectValue placeholder="Sélectionne ta profession..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                {PROFESSIONS.map((p) => (
                  <SelectItem key={p} value={p} className="text-white hover:bg-slate-700">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form2.formState.errors.profession && (
              <p className="text-red-400 text-sm">{form2.formState.errors.profession.message}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1 h-12 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <Button type="submit" className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center">
              Continuer <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      )}

      {/* ── ETAPE 3 : Wallets Mobile Money ───────────────────── */}
      {step === 3 && (
        <form onSubmit={handleStep3} className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">Tes wallets</h2>
            <p className="text-slate-400 text-sm mt-1">
              Pour recevoir et envoyer de l'argent
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <p className="text-blue-300 text-xs text-center">
              💡 Au moins un numéro Mobile Money est requis pour participer aux tontines.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] font-bold text-black">M</span>
              Numéro MTN Money
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">
                +242
              </span>
              <Input
                type="tel"
                placeholder="06 123 45 678"
                className="pl-14 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
                {...form3.register('wallet_mtn')}
              />
            </div>
            {form3.formState.errors.wallet_mtn && (
              <p className="text-red-400 text-sm">{form3.formState.errors.wallet_mtn.message}</p>
            )}
            <p className="text-slate-500 text-xs">Commence par 06</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-slate-500 text-xs">ou</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">A</span>
              Numéro Airtel Money
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">
                +242
              </span>
              <Input
                type="tel"
                placeholder="05 123 45 678"
                className="pl-14 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
                {...form3.register('wallet_airtel')}
              />
            </div>
            {form3.formState.errors.wallet_airtel && (
              <p className="text-red-400 text-sm">{form3.formState.errors.wallet_airtel.message}</p>
            )}
            <p className="text-slate-500 text-xs">Commence par 05 ou 04</p>
          </div>

          {form3.formState.errors.root && (
            <p className="text-red-400 text-sm text-center">{form3.formState.errors.root.message}</p>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="flex-1 h-12 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center"
            >
              {loading ? 'Création...' : '🚀 Terminer'}
            </Button>
          </div>

          <p className="text-center text-slate-500 text-xs">
            Tu pourras modifier ces informations dans ton profil
          </p>
        </form>
      )}
    </div>
  )
}
