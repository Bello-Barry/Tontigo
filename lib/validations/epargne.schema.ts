import { z } from 'zod'
import { addDays, isAfter } from 'date-fns'

export const createVaultSchema = z.object({
  name:               z.string().min(2).max(50),
  description:        z.string().max(200).optional(),
  target_amount:      z.number().min(0).optional(),
  unlock_date:        z.string().refine(
    (date) => isAfter(new Date(date), addDays(new Date(), 29)),
    'La date doit être au moins 30 jours dans le futur'
  ),
  frequency:          z.enum(['quotidien', 'hebdomadaire', 'mensuel']).optional(),
  auto_amount:        z.number().min(0).optional(),
  wallet_destination: z.string().optional(),
})

export const depositVaultSchema = z.object({
  amount:      z.number().min(500, 'Minimum 500 FCFA'),
  wallet_type: z.enum(['mtn', 'airtel']),
})

export type CreateVaultInput  = z.infer<typeof createVaultSchema>
export type DepositVaultInput = z.infer<typeof depositVaultSchema>
