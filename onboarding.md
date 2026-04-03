# 🔧 TONTIGO — FIX ONBOARDING : Profil utilisateur complet

---

## 🎯 CONTEXTE

L'onboarding actuel est trop minimal. Après l'authentification (numéro + PIN),
l'utilisateur doit remplir un profil complet avant d'accéder à l'application.

**Champs à collecter (tous obligatoires sauf indication) :**
- Nom complet
- Photo de profil
- Date de naissance
- Quartier / Arrondissement de Brazzaville
- Profession / Activité
- Numéro MTN Money (au moins un des deux wallets obligatoire)
- Numéro Airtel Money (au moins un des deux wallets obligatoire)

**Règle UX** : L'onboarding est découpé en **3 étapes** avec barre de progression.
L'utilisateur ne peut pas accéder au dashboard tant que le profil n'est pas complet.

---

## FICHIERS À MODIFIER OU CRÉER

```
supabase/migrations/002_profile_fields.sql   CREER
lib/validations/auth.schema.ts               MODIFIER (ajouter onboardingSchema)
lib/actions/auth.actions.ts                  MODIFIER (réécrire completeOnboarding)
lib/utils/onboarding.ts                      CREER
components/auth/OnboardingForm.tsx           REECRIRE COMPLETEMENT
components/auth/AvatarUpload.tsx             CREER
app/(auth)/onboarding/page.tsx               REECRIRE COMPLETEMENT
middleware.ts                                MODIFIER (vérifier profil complet)
```

---

## ETAPE 1 — Migration SQL

### `supabase/migrations/002_profile_fields.sql` — CREER

```sql
-- Ajouter les nouveaux champs au profil utilisateur
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS date_of_birth    DATE,
  ADD COLUMN IF NOT EXISTS quartier         TEXT,
  ADD COLUMN IF NOT EXISTS profession       TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_done  BOOLEAN DEFAULT FALSE;

-- Index pour la recherche par quartier (utile pour le matching local)
CREATE INDEX IF NOT EXISTS idx_users_quartier ON public.users(quartier);

-- Vue pour vérifier si un profil est complet
CREATE OR REPLACE VIEW public.user_profile_complete AS
SELECT
  id,
  (
    full_name      IS NOT NULL AND full_name != 'Utilisateur' AND
    date_of_birth  IS NOT NULL AND
    quartier       IS NOT NULL AND
    profession     IS NOT NULL AND
    (wallet_mtn IS NOT NULL OR wallet_airtel IS NOT NULL) AND
    onboarding_done = TRUE
  ) AS is_complete
FROM public.users;
```

**Exécuter ce fichier dans Supabase Dashboard → SQL Editor avant tout le reste.**

---

## ETAPE 2 — Liste des quartiers de Brazzaville

### `lib/utils/onboarding.ts` — CREER

```typescript
// Arrondissements et quartiers de Brazzaville
export const BRAZZAVILLE_QUARTIERS = [
  // Arrondissement 1 — Makélékélé
  'Makélékélé', 'Plateau des 15 ans', 'Mfilou-Ngamaba', 'Moungali II',
  // Arrondissement 2 — Bacongo
  'Bacongo', 'Matonge', 'Kinsoundi', 'Nganga-Lingolo',
  // Arrondissement 3 — Poto-Poto
  'Poto-Poto', 'Ouenzé Nord', 'Moungali',
  // Arrondissement 4 — Moungali
  'Moungali', 'Talangaï Nord', 'Mikalou',
  // Arrondissement 5 — Ouenzé
  'Ouenzé', 'Nkombo', 'Tié-Tié',
  // Arrondissement 6 — Talangaï
  'Talangaï', 'Massengo', 'Séka-Séka',
  // Arrondissement 7 — Mfilou
  'Mfilou', 'Ngamaba', 'Madibou',
  // Arrondissement 8 — Djiri
  'Djiri', 'Mbansou', 'Linzolo',
  // Autres zones
  'Centre-ville', 'La Plaine', 'La Corniche',
  'Autre',
] as const

export type QuartierBrazzaville = typeof BRAZZAVILLE_QUARTIERS[number]

// Professions courantes au Congo Brazzaville
export const PROFESSIONS = [
  'Salarié(e) du privé',
  'Fonctionnaire / Agent de l\'État',
  'Commerçant(e)',
  'Entrepreneur(e)',
  'Artisan(e)',
  'Agriculteur / Éleveur',
  'Étudiant(e)',
  'Enseignant(e)',
  'Professionnel(le) de santé',
  'Transporteur / Chauffeur',
  'Sans emploi',
  'Retraité(e)',
  'Autre',
] as const

export type Profession = typeof PROFESSIONS[number]

// Vérifier si un profil est complet
export function isProfileComplete(profile: {
  full_name?:     string | null
  date_of_birth?: string | null
  quartier?:      string | null
  profession?:    string | null
  wallet_mtn?:    string | null
  wallet_airtel?: string | null
  onboarding_done?: boolean
}): boolean {
  return !!(
    profile.full_name &&
    profile.full_name !== 'Utilisateur' &&
    profile.date_of_birth &&
    profile.quartier &&
    profile.profession &&
    (profile.wallet_mtn || profile.wallet_airtel) &&
    profile.onboarding_done
  )
}

// Calculer l'âge depuis la date de naissance
export function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// Vérifier âge minimum (18 ans)
export function isAdult(dateOfBirth: string): boolean {
  return calculateAge(dateOfBirth) >= 18
}
```

---

## ETAPE 3 — Schéma de validation Zod

### Dans `lib/validations/auth.schema.ts` — REMPLACER `onboardingSchema`

```typescript
import { z } from 'zod'
import { isAdult } from '@/lib/utils/onboarding'

// Etape 1 : Identité
export const onboardingStep1Schema = z.object({
  full_name: z
    .string()
    .min(3, 'Le nom complet doit contenir au moins 3 caractères')
    .max(60, 'Le nom est trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom ne doit contenir que des lettres'),
  date_of_birth: z
    .string()
    .min(1, 'La date de naissance est requise')
    .refine(
      (date) => isAdult(date),
      'Tu dois avoir au moins 18 ans pour utiliser Tontigo'
    )
    .refine(
      (date) => new Date(date) > new Date('1900-01-01'),
      'Date de naissance invalide'
    ),
})

// Etape 2 : Localisation et profession
export const onboardingStep2Schema = z.object({
  quartier:   z.string().min(1, 'Sélectionne ton quartier'),
  profession: z.string().min(1, 'Sélectionne ta profession'),
})

// Etape 3 : Wallets Mobile Money
export const onboardingStep3Schema = z
  .object({
    wallet_mtn: z
      .string()
      .refine(
        (val) => !val || /^(242)?(06)\d{7}$/.test(val.replace(/\s/g, '')),
        'Numéro MTN invalide (doit commencer par 06)'
      )
      .optional()
      .or(z.literal('')),
    wallet_airtel: z
      .string()
      .refine(
        (val) => !val || /^(242)?(05|04)\d{7}$/.test(val.replace(/\s/g, '')),
        'Numéro Airtel invalide (doit commencer par 05 ou 04)'
      )
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => !!(data.wallet_mtn || data.wallet_airtel),
    {
      message: 'Tu dois renseigner au moins un numéro Mobile Money (MTN ou Airtel)',
      path:    ['wallet_mtn'],
    }
  )

// Schéma complet (pour la validation finale côté serveur)
export const onboardingSchema = onboardingStep1Schema
  .merge(onboardingStep2Schema)
  .merge(onboardingStep3Schema)

export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>
export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>
export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>
export type OnboardingInput      = z.infer<typeof onboardingSchema>
```

---

## ETAPE 4 — Server Action completeOnboarding mise à jour

### Dans `lib/actions/auth.actions.ts` — REMPLACER `completeOnboarding`

```typescript
// ONBOARDING : sauvegarder le profil complet
export async function completeOnboarding(
  userId: string,
  data: {
    full_name:      string
    date_of_birth:  string
    quartier:       string
    profession:     string
    wallet_mtn?:    string
    wallet_airtel?: string
    avatar_url?:    string
  }
): Promise<ActionResult> {
  // Validation côté serveur
  const parsed = onboardingSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  // Normaliser les numéros wallet
  const normalizeWallet = (num?: string): string | null => {
    if (!num) return null
    const digits = num.replace(/\D/g, '')
    return digits.startsWith('242') ? digits : `242${digits.startsWith('0') ? digits.slice(1) : digits}`
  }

  const { error } = await serviceClient
    .from('users')
    .update({
      full_name:       data.full_name.trim(),
      date_of_birth:   data.date_of_birth,
      quartier:        data.quartier,
      profession:      data.profession,
      wallet_mtn:      normalizeWallet(data.wallet_mtn),
      wallet_airtel:   normalizeWallet(data.wallet_airtel),
      avatar_url:      data.avatar_url || null,
      onboarding_done: true,
      // Score de confiance de départ : 50 points de base + 5 bonus profil complet
      trust_score:     55,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) return { error: error.message }

  redirect('/dashboard')
}

// UPLOAD AVATAR : retourne l'URL publique
export async function uploadAvatar(
  userId: string,
  file: FormData
): Promise<ActionResult<{ url: string }>> {
  const imageFile = file.get('avatar') as File
  if (!imageFile) return { error: 'Aucun fichier fourni' }

  // Vérifications
  if (imageFile.size > 2 * 1024 * 1024) {
    return { error: 'Image trop lourde (maximum 2 Mo)' }
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type)) {
    return { error: 'Format invalide. Utilise JPG, PNG ou WebP.' }
  }

  const ext      = imageFile.name.split('.').pop()
  const fileName = `${userId}/avatar.${ext}`

  const { error: uploadError } = await serviceClient.storage
    .from('avatars')
    .upload(fileName, imageFile, { upsert: true, contentType: imageFile.type })

  if (uploadError) return { error: uploadError.message }

  const { data } = serviceClient.storage.from('avatars').getPublicUrl(fileName)
  return { data: { url: data.publicUrl } }
}
```

**Ajouter aussi cet import en haut du fichier :**
```typescript
import { onboardingSchema } from '@/lib/validations/auth.schema'
```

---

## ETAPE 5 — Composant AvatarUpload

### `components/auth/AvatarUpload.tsx` — CREER

```tsx
'use client'
import { useRef, useState } from 'react'
import { uploadAvatar } from '@/lib/actions/auth.actions'
import { Camera, User, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface AvatarUploadProps {
  userId:   string
  onUpload: (url: string) => void
}

export function AvatarUpload({ userId, onUpload }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const inputRef              = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview local immédiat
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setLoading(true)
    setError('')
    const formData = new FormData()
    formData.append('avatar', file)

    const result = await uploadAvatar(userId, formData)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      setPreview(null)
      return
    }
    if (result.data) onUpload(result.data.url)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Zone de clic */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-24 h-24 rounded-full bg-slate-700 border-2 border-dashed border-slate-500 hover:border-emerald-500 transition-colors overflow-hidden group"
      >
        {preview ? (
          <Image src={preview} alt="Avatar" fill className="object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <User className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition-colors" />
          </div>
        )}

        {/* Overlay camera */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {loading
            ? <Loader2 className="w-6 h-6 text-white animate-spin" />
            : <Camera className="w-6 h-6 text-white" />
          }
        </div>
      </button>

      <p className="text-slate-400 text-xs text-center">
        {preview ? 'Appuie pour changer' : 'Ajoute ta photo (optionnel)'}
      </p>

      {error && <p className="text-red-400 text-xs text-center">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
```

**Créer le bucket Supabase Storage :**
Dans Supabase Dashboard → Storage → New bucket :
- Nom : `avatars`
- Public : ✅ oui
- Taille max fichier : 2 Mo
- Types autorisés : `image/jpeg, image/png, image/webp`

---

## ETAPE 6 — Composant OnboardingForm réécrit

### `components/auth/OnboardingForm.tsx` — REECRIRE COMPLETEMENT

```tsx
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
    // Si succès → redirect automatique vers /dashboard
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
        {/* Barre de progression */}
        <div className="h-1 bg-slate-700 rounded-full">
          <div
            className="h-1 bg-emerald-500 rounded-full transition-all duration-500"
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

          {/* Avatar */}
          <AvatarUpload userId={userId} onUpload={setAvatarUrl} />

          {/* Nom complet */}
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

          {/* Date de naissance */}
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

          <Button type="submit" className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 font-semibold">
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

          {/* Quartier */}
          <div className="space-y-2">
            <Label className="text-slate-300">Quartier / Arrondissement *</Label>
            <Select onValueChange={(val) => form2.setValue('quartier', val)}>
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

          {/* Profession */}
          <div className="space-y-2">
            <Label className="text-slate-300">Profession / Activité *</Label>
            <Select onValueChange={(val) => form2.setValue('profession', val)}>
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
            <Button type="submit" className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 font-semibold">
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
              Pour recevoir et envoyer de l'argent via Tontigo
            </p>
          </div>

          {/* Info obligatoire */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <p className="text-blue-300 text-xs text-center">
              💡 Au moins un numéro Mobile Money est requis pour participer aux tontines.
            </p>
          </div>

          {/* MTN Money */}
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

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-slate-500 text-xs">ou</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {/* Airtel Money */}
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

          {/* Erreur globale (au moins un wallet) */}
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
              className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 font-semibold"
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
```

---

## ETAPE 7 — Page Onboarding

### `app/(auth)/onboarding/page.tsx` — REECRIRE ENTIEREMENT

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/auth/OnboardingForm'
import { isProfileComplete } from '@/lib/utils/onboarding'

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Non connecté → login
  if (!user) redirect('/login')

  // Récupérer le profil actuel
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Profil déjà complet → dashboard directement
  if (profile && isProfileComplete(profile)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tontigo-gradient-text">Tontigo</h1>
          <p className="text-slate-400 text-sm mt-1">
            Bienvenue ! Complète ton profil pour commencer 🇨🇬
          </p>
        </div>

        {/* Formulaire */}
        <div className="glass-card p-6">
          <OnboardingForm userId={user.id} />
        </div>

      </div>
    </div>
  )
}
```

---

## ETAPE 8 — Middleware mis à jour

### Dans `middleware.ts` — MODIFIER la logique de redirection

Ajouter `/onboarding` dans les routes publiques ET ajouter une vérification du profil complet :

```typescript
// Dans la liste des routes publiques, s'assurer que /onboarding est présent
const PUBLIC_ROUTES = ['/login', '/register', '/onboarding']

// Après la vérification d'auth existante, ajouter :
// Si connecté mais profil incomplet → forcer l'onboarding
// (Cette vérification est déjà gérée par la page onboarding elle-même
//  et par completeOnboarding qui met onboarding_done = true)
// Le middleware n'a pas besoin de query Supabase à chaque requête
// pour les perfs — la redirection est gérée côté page dashboard.
```

### Dans `app/(dashboard)/layout.tsx` — AJOUTER la vérification

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isProfileComplete } from '@/lib/utils/onboarding'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Vérifier que le profil est complet
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, date_of_birth, quartier, profession, wallet_mtn, wallet_airtel, onboarding_done')
    .eq('id', user.id)
    .single()

  if (!profile || !isProfileComplete(profile)) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar existante */}
      {children}
    </div>
  )
}
```

---

## ETAPE 9 — Afficher les infos profil complètes

### Dans `app/(dashboard)/profil/page.tsx` — METTRE À JOUR les champs affichés

La page profil doit afficher et permettre de modifier :
- Photo de profil (avec `AvatarUpload`)
- Nom complet
- Date de naissance (non modifiable après validation)
- Quartier (modifiable via Select)
- Profession (modifiable via Select)
- Numéro MTN Money
- Numéro Airtel Money
- Score de confiance (non modifiable, calculé automatiquement)

Pour la modification, créer une Server Action `updateProfile` dans `auth.actions.ts` :

```typescript
export async function updateProfile(
  userId: string,
  data: {
    full_name?:     string
    quartier?:      string
    profession?:    string
    wallet_mtn?:    string
    wallet_airtel?: string
    avatar_url?:    string
  }
): Promise<ActionResult> {
  // Même logique de normalisation des wallets que completeOnboarding
  // date_of_birth NON modifiable après l'onboarding
  const { error } = await serviceClient
    .from('users')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return { error: error.message }
  return { success: true }
}
```

---

## ETAPE 10 — Types mis à jour

### Dans `lib/types/index.ts` — METTRE À JOUR `UserProfile`

```typescript
export interface UserProfile {
  id:                     string
  phone:                  string
  full_name:              string
  avatar_url:             string | null
  date_of_birth:          string | null   // NOUVEAU
  quartier:               string | null   // NOUVEAU
  profession:             string | null   // NOUVEAU
  trust_score:            number
  status:                 UserStatus
  badge:                  UserBadge
  wallet_mtn:             string | null
  wallet_airtel:          string | null
  total_groups_completed: number
  total_groups_failed:    number
  is_banned:              boolean
  banned_until:           string | null
  onboarding_done:        boolean         // NOUVEAU
  subscription_plan:      SubscriptionPlan
  subscription_expires_at: string | null
  created_at:             string
  updated_at:             string
}
```

---

## VERIFICATIONS FINALES

**Flux complet à tester :**

```
1. Inscription  → /register → numéro + PIN → /onboarding
2. Onboarding étape 1 → nom + date de naissance (test âge < 18 → bloqué)
3. Onboarding étape 2 → quartier + profession
4. Onboarding étape 3 → wallet MTN ou Airtel (test sans aucun wallet → bloqué)
5. Soumission → /dashboard
6. Déconnexion → /login
7. Reconnexion → /dashboard (pas de re-onboarding)
8. Accès direct /dashboard sans onboarding_done → redirige /onboarding
```

**Cas limites :**
- [ ] Utilisateur de moins de 18 ans → message clair "Tu dois avoir au moins 18 ans"
- [ ] Aucun wallet saisi → "Au moins un numéro Mobile Money requis"
- [ ] Numéro MTN commençant par 05 → erreur "doit commencer par 06"
- [ ] Image > 2 Mo → erreur "Image trop lourde"
- [ ] Retour arrière entre étapes → données conservées

---

## REGLES ABSOLUES

1. **`onboarding_done = true`** est positionné uniquement dans `completeOnboarding` — jamais ailleurs.
2. **Le dashboard est inaccessible** si `onboarding_done = false` — vérifié dans `DashboardLayout`.
3. **`date_of_birth` est non modifiable** après l'onboarding — ne pas exposer de champ d'édition.
4. **L'âge minimum est 18 ans** — validé côté client (Zod) ET côté serveur (completeOnboarding).
5. **Au moins un wallet** est requis — validé côté client (Zod `.refine`) ET côté serveur.
6. **Les numéros wallet sont normalisés** (format `242XXXXXXXXX`) avant stockage.
7. **Le score de confiance de départ est 55** (50 base + 5 bonus profil complet).

---

*Fix onboarding Tontigo — Profil complet 3 étapes · Brazzaville · Production Ready*