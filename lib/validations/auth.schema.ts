import { z } from 'zod'
import { isAdult } from '@/lib/utils/onboarding'

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

export type PhoneInput           = z.infer<typeof phoneSchema>
export type PinInput             = z.infer<typeof pinSchema>
export type CreatePinInput       = z.infer<typeof createPinSchema>
export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>
export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>
export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>
export type OnboardingInput      = z.infer<typeof onboardingSchema>
