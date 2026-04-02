import { z } from 'zod'

export const createGroupSchema = z.object({
  name:               z.string().min(3, 'Minimum 3 caractères').max(50),
  description:        z.string().max(200).optional(),
  amount:             z.number().min(1000, 'Minimum 1 000 FCFA').max(10_000_000),
  frequency:          z.enum(['quotidien', 'hebdomadaire', 'mensuel']),
  max_members:        z.number().int().min(2).max(50),
  penalty_rate:       z.number().min(0.5).max(20),
  order_type:         z.enum(['tirage_au_sort', 'encheres', 'manuel']),
  is_public:          z.boolean().default(false),
  min_trust_score:    z.number().int().min(0).max(100).default(30),
  requires_guarantee: z.boolean().default(true),
})

export const joinGroupSchema = z.object({
  invite_code: z.string().length(8, 'Code d\'invitation invalide (8 caractères)'),
})

export const disputeSchema = z.object({
  member_reported: z.string().uuid(),
  reason:          z.string().min(10, 'Décrivez le problème (min 10 caractères)').max(500),
  evidence:        z.string().max(500).optional(),
})

export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type JoinGroupInput   = z.infer<typeof joinGroupSchema>
export type DisputeInput     = z.infer<typeof disputeSchema>
