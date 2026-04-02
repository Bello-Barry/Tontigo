import { z } from 'zod'

export const matchingFilterSchema = z.object({
  amount_min:      z.number().min(1000),
  amount_max:      z.number().min(1000),
  frequency:       z.enum(['quotidien', 'hebdomadaire', 'mensuel']),
  min_trust_score: z.number().int().min(0).max(100).default(50),
}).refine(d => d.amount_max >= d.amount_min, {
  message: 'Le montant maximum doit être supérieur au minimum',
  path: ['amount_max'],
})

export type MatchingFilterInput = z.infer<typeof matchingFilterSchema>
