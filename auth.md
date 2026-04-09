# 🔧 TONTIGO — FIX AUTH : Remplacement OTP SMS par Numéro + PIN

---

## 🎯 CONTEXTE

L'application Likelemba utilise actuellement une authentification OTP par SMS via Supabase,
qui nécessite un provider externe payant non disponible gratuitement.

**Objectif** : Remplacer entièrement ce système par une auth **Numéro de téléphone + PIN à 4 chiffres**,
100% gratuite, utilisant uniquement Supabase Auth natif (email/password sous le capot).

**Principe technique** :
- L'"email" Supabase = numéro formaté automatiquement → `242XXXXXXXXX@tontigo.app`
- Le "password" Supabase = le PIN à 4 chiffres (géré par Supabase, haché automatiquement)
- L'utilisateur ne voit jamais d'email. Il entre uniquement son numéro + PIN.
- Ce modèle est identique aux apps bancaires africaines (Ecobank, LCB Mobile) — familier pour les utilisateurs congolais.

---

## FICHIERS À MODIFIER OU CRÉER

```
lib/utils/auth-helpers.ts          CREER
lib/validations/auth.schema.ts     MODIFIER
lib/actions/auth.actions.ts        REECRIRE COMPLETEMENT
components/auth/PhoneForm.tsx      REECRIRE
components/auth/OtpForm.tsx        SUPPRIMER
components/auth/PinForm.tsx        CREER
components/auth/CreatePinForm.tsx  CREER
app/(auth)/login/page.tsx          MODIFIER
app/(auth)/register/page.tsx       MODIFIER
```

---

## ETAPE 1 — Utilitaire de conversion numéro → email fictif

### `lib/utils/auth-helpers.ts` — CREER CE FICHIER

```typescript
/**
 * Convertit un numéro de téléphone congolais en email fictif Supabase.
 * L'utilisateur ne verra jamais cet email.
 *
 * Exemples :
 *   "0612345678"    → "242612345678@tontigo.app"
 *   "+242612345678" → "242612345678@tontigo.app"
 */
export function phoneToFakeEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('242')
    ? digits
    : `242${digits.startsWith('0') ? digits.slice(1) : digits}`
  return `${normalized}@tontigo.app`
}

/**
 * Extrait le numéro lisible depuis un email fictif.
 */
export function fakeEmailToPhone(email: string): string {
  const digits = email.replace('@tontigo.app', '')
  return `+${digits}`
}

/**
 * Valide qu'un numéro est un numéro congolais valide.
 * Accepte : 06XXXXXXX, 05XXXXXXX, 04XXXXXXX (MTN/Airtel Congo)
 */
export function isValidCongoPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('242') ? digits.slice(3) : digits
  return /^(06|05|04)\d{7}$/.test(normalized)
}

/**
 * Normalise un numéro en format stockage (sans +, avec 242).
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('242')
    ? digits
    : `242${digits.startsWith('0') ? digits.slice(1) : digits}`
}

/**
 * Formate un numéro pour l'affichage utilisateur.
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const local = digits.startsWith('242') ? digits.slice(3) : digits
  return `+242 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`
}
```

---

## ETAPE 2 — Schémas Zod mis à jour

### `lib/validations/auth.schema.ts` — REMPLACER ENTIEREMENT

```typescript
import { z } from 'zod'

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(9, 'Numéro trop court')
    .refine((val) => {
      const digits = val.replace(/\D/g, '')
      const local = digits.startsWith('242') ? digits.slice(3) : digits
      return /^(06|05|04)\d{7}$/.test(local)
    }, 'Numéro congolais invalide (ex: 06 123 45 678)'),
})

export const pinSchema = z.object({
  pin: z
    .string()
    .length(4, 'Le PIN doit contenir exactement 4 chiffres')
    .regex(/^\d{4}$/, 'Le PIN ne doit contenir que des chiffres'),
})

export const createPinSchema = z
  .object({
    pin:         z.string().length(4).regex(/^\d{4}$/),
    pin_confirm: z.string().length(4).regex(/^\d{4}$/),
  })
  .refine((data) => data.pin === data.pin_confirm, {
    message: 'Les PIN ne correspondent pas',
    path:    ['pin_confirm'],
  })

export const onboardingSchema = z.object({
  full_name:     z.string().min(2, 'Nom trop court').max(60),
  wallet_mtn:    z.string().optional().or(z.literal('')),
  wallet_airtel: z.string().optional().or(z.literal('')),
})

export type PhoneInput      = z.infer<typeof phoneSchema>
export type PinInput        = z.infer<typeof pinSchema>
export type CreatePinInput  = z.infer<typeof createPinSchema>
export type OnboardingInput = z.infer<typeof onboardingSchema>
```

---

## ETAPE 3 — Server Actions Auth réécrites

### `lib/actions/auth.actions.ts` — REMPLACER ENTIEREMENT

```typescript
'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { phoneToFakeEmail, isValidCongoPhone, normalizePhone } from '@/lib/utils/auth-helpers'
import type { ActionResult } from '@/lib/types'

// INSCRIPTION : numéro + PIN
export async function registerWithPin(
  phone: string,
  pin: string
): Promise<ActionResult> {
  if (!isValidCongoPhone(phone)) {
    return { error: 'Numéro de téléphone congolais invalide.' }
  }

  const normalized = normalizePhone(phone)

  // Vérifier le blacklist
  const { data: blacklisted } = await serviceClient
    .from('phone_blacklist')
    .select('id')
    .eq('phone', normalized)
    .maybeSingle()

  if (blacklisted) {
    return { error: 'Ce numéro est banni de la plateforme Likelemba.' }
  }

  // Vérifier si le numéro existe déjà
  const { data: existingUser } = await serviceClient
    .from('users')
    .select('id')
    .eq('phone', normalized)
    .maybeSingle()

  if (existingUser) {
    return { error: 'Ce numéro est déjà associé à un compte. Connecte-toi.' }
  }

  const fakeEmail = phoneToFakeEmail(phone)

  // Créer le compte Supabase Auth (sans envoyer d'email réel)
  const { data, error } = await serviceClient.auth.admin.createUser({
    email:         fakeEmail,
    password:      pin,
    email_confirm: true, // Confirmer automatiquement — aucun email envoyé
    user_metadata: { phone: normalized },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Ce numéro est déjà associé à un compte.' }
    }
    return { error: error.message }
  }

  // Créer le profil dans public.users
  await serviceClient.from('users').upsert({
    id:    data.user.id,
    phone: normalized,
  })

  redirect('/onboarding')
}

// CONNEXION : numéro + PIN
export async function loginWithPin(
  phone: string,
  pin: string
): Promise<ActionResult> {
  const fakeEmail = phoneToFakeEmail(phone)
  const supabase  = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email:    fakeEmail,
    password: pin,
  })

  if (error) {
    // Message générique — ne jamais distinguer "numéro inconnu" de "mauvais PIN"
    return { error: 'Numéro ou PIN incorrect.' }
  }

  // Vérifier si le compte est banni
  const { data: profile } = await serviceClient
    .from('users')
    .select('is_banned, full_name')
    .eq('id', data.user.id)
    .single()

  if (profile?.is_banned) {
    await supabase.auth.signOut()
    return { error: 'Ce compte est banni de la plateforme Likelemba.' }
  }

  // Rediriger vers onboarding si profil incomplet
  if (!profile?.full_name || profile.full_name === 'Utilisateur') {
    redirect('/onboarding')
  }

  redirect('/dashboard')
}

// VÉRIFIER si un numéro existe (pour PhoneForm)
export async function checkPhoneExists(phone: string): Promise<boolean> {
  const normalized = normalizePhone(phone)
  const { data } = await serviceClient
    .from('users')
    .select('id')
    .eq('phone', normalized)
    .maybeSingle()
  return !!data
}

// CHANGER LE PIN (depuis la page profil)
export async function changePin(
  currentPin: string,
  newPin: string
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifier l'ancien PIN
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email:    user.email!,
    password: currentPin,
  })
  if (verifyError) return { error: 'PIN actuel incorrect.' }

  // Changer le PIN
  const { error } = await serviceClient.auth.admin.updateUserById(user.id, {
    password: newPin,
  })
  if (error) return { error: error.message }
  return { success: true }
}

// ONBOARDING : compléter le profil
export async function completeOnboarding(
  userId: string,
  data: {
    full_name:      string
    wallet_mtn?:    string
    wallet_airtel?: string
  }
): Promise<ActionResult> {
  const { error } = await serviceClient
    .from('users')
    .update({
      full_name:     data.full_name,
      wallet_mtn:    data.wallet_mtn    || null,
      wallet_airtel: data.wallet_airtel || null,
      updated_at:    new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) return { error: error.message }
  redirect('/dashboard')
}

// DÉCONNEXION
export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// RÉCUPÉRER L'UTILISATEUR COURANT
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users').select('*').eq('id', user.id).single()

  return profile
}
```

---

## ETAPE 4 — Composants Auth

### `components/auth/PhoneForm.tsx` — REMPLACER

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { phoneSchema, type PhoneInput } from '@/lib/validations/auth.schema'
import { checkPhoneExists } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

interface PhoneFormProps {
  onNext: (phone: string, isExistingUser: boolean) => void
}

export function PhoneForm({ onNext }: PhoneFormProps) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<PhoneInput>({
    resolver: zodResolver(phoneSchema),
  })

  const onSubmit = async (data: PhoneInput) => {
    setLoading(true)
    try {
      const exists = await checkPhoneExists(data.phone)
      onNext(data.phone, exists)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-slate-300">
          Numéro de téléphone
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm select-none">
            🇨🇬 +242
          </span>
          <Input
            id="phone"
            type="tel"
            placeholder="06 123 45 678"
            className="pl-20 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
            {...register('phone')}
          />
        </div>
        {errors.phone && (
          <p className="text-red-400 text-sm">{errors.phone.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
      >
        {loading ? 'Vérification...' : 'Continuer'}
      </Button>

      <p className="text-center text-slate-500 text-xs">
        Aucun SMS envoyé. Ton numéro est ton identifiant.
      </p>
    </form>
  )
}
```

### `components/auth/PinForm.tsx` — CREER

```tsx
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
```

### `components/auth/CreatePinForm.tsx` — CREER

```tsx
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
          Ne partage jamais ton PIN. Likelemba ne te le demandera jamais.
        </p>
      </div>
    </div>
  )
}
```

---

## ETAPE 5 — Pages Auth

### `app/(auth)/login/page.tsx` — REMPLACER ENTIEREMENT

```tsx
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
          <h1 className="text-3xl font-bold tontigo-gradient-text">Likelemba</h1>
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
```

### `app/(auth)/register/page.tsx` — REMPLACER ENTIEREMENT

```tsx
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
          <h1 className="text-3xl font-bold tontigo-gradient-text">Likelemba</h1>
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
```

---

## ETAPE 6 — Changement de PIN dans le profil

Dans `app/(dashboard)/profil/page.tsx`, ajouter une section "Sécurité" avec :
- Un composant `ChangePinSection` qui utilise deux `PinForm` successifs
- Appelle `changePin(currentPin, newPin)` depuis `lib/actions/auth.actions.ts`
- Affiche le succès via `toast.success()` de react-toastify

---

## ETAPE 7 — Nettoyage

```bash
# Supprimer l'ancien composant OTP SMS
rm components/auth/OtpForm.tsx

# Chercher et supprimer toutes les références à sendOtp et verifyOtp
grep -r "sendOtp\|verifyOtp\|signInWithOtp\|OtpForm" --include="*.tsx" --include="*.ts" .
# Supprimer ou commenter chaque occurrence trouvée
```

---

## VERIFICATIONS FINALES

Tester ces scénarios après implémentation :

**Inscription**
- Numéro valide 06XXXXXXX → passe l'étape 1
- Numéro invalide → message d'erreur clair
- Numéro déjà existant → redirige vers /login
- Numéro blacklisté → message de refus
- PIN 4 chiffres → étape confirmation
- PIN confirmation différente → erreur, recommencer depuis le début
- Succès → redirige /onboarding

**Connexion**
- Numéro + PIN corrects → redirige /dashboard
- Mauvais PIN → "Numéro ou PIN incorrect" (message générique)
- Compte banni → message de refus + déconnexion forcée
- Profil incomplet → redirige /onboarding

**Sécurité**
- L'email fictif @tontigo.app n'est jamais visible côté client
- Le PIN n'est jamais stocké en clair (Supabase le hache avec bcrypt)
- Le service role key n'est jamais importé dans un composant client

---

## REGLES ABSOLUES POUR CETTE MODIFICATION

1. **Ne jamais afficher l'email fictif** (@tontigo.app) à l'utilisateur — ni dans l'UI, ni dans les erreurs.
2. **Ne jamais stocker le PIN en clair** — uniquement via Supabase Auth admin qui le hache.
3. **Message d'erreur de connexion toujours générique** : "Numéro ou PIN incorrect" — ne jamais distinguer numéro inconnu de mauvais PIN.
4. **registerWithPin utilise serviceClient.auth.admin.createUser** avec email_confirm: true — aucun email envoyé.
5. **Supprimer OtpForm.tsx** et toute référence à sendOtp / verifyOtp / signInWithOtp dans le codebase.
6. **checkPhoneExists** est la seule action qui peut révéler si un numéro existe — utilisée uniquement pour orienter l'utilisateur (login vs register), pas pour une vérification de sécurité.

---

*Fix auth Likelemba — Numéro + PIN · 100% gratuit · Zéro SMS · Zéro email · Supabase natif*