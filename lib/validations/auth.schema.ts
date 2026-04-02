import { z } from 'zod'

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(9, 'Numéro invalide')
    .regex(/^(\+?242)?[0-9]{9}$/, 'Format: +242XXXXXXXXX ou 9 chiffres'),
})

export const otpSchema = z.object({
  token: z.string().length(6, 'Le code doit contenir 6 chiffres').regex(/^\d+$/, 'Chiffres uniquement'),
})

export const onboardingSchema = z.object({
  full_name: z.string().min(2, 'Nom trop court').max(60),
  wallet_mtn: z.string().regex(/^(\+?242)?[0-9]{9}$/).optional().or(z.literal('')),
  wallet_airtel: z.string().regex(/^(\+?242)?[0-9]{9}$/).optional().or(z.literal('')),
})

export type PhoneInput      = z.infer<typeof phoneSchema>
export type OtpInput        = z.infer<typeof otpSchema>
export type OnboardingInput = z.infer<typeof onboardingSchema>
