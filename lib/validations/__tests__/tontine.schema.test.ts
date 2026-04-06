import { describe, it, expect } from 'vitest'
import { createGroupSchema } from '../tontine.schema'

describe('tontine schemas', () => {
  describe('createGroupSchema', () => {
    it('validates correct group data', () => {
      const data = {
        name: 'Ma Tontine',
        amount: 5000,
        frequency: 'hebdomadaire',
        max_members: 10,
        penalty_rate: 1,
        order_type: 'tirage_au_sort',
        is_public: true,
        min_trust_score: 30,
        requires_guarantee: true
      }
      expect(createGroupSchema.safeParse(data).success).toBe(true)
    })

    it('rejects invalid data', () => {
      const data = {
        name: 'Ab', // too short
        amount: 500, // too low
        frequency: 'yearly', // invalid enum
        max_members: 1, // too few
      }
      const result = createGroupSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})
