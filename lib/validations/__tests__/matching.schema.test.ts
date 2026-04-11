import { describe, it, expect } from 'vitest'
import { matchingFilterSchema } from '../matching.schema'

describe('matchingFilterSchema', () => {
  const valid = {
    amount_min:      1000,
    amount_max:      50000,
    frequency:       'mensuel' as const,
    min_trust_score: 50,
  }

  it('validates correct filter data', () => {
    expect(matchingFilterSchema.safeParse(valid).success).toBe(true)
  })

  it('uses default min_trust_score of 50 when not provided', () => {
    const { min_trust_score, ...without } = valid
    const result = matchingFilterSchema.safeParse(without)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.min_trust_score).toBe(50)
    }
  })

  it('rejects amount_min below 1000', () => {
    const result = matchingFilterSchema.safeParse({ ...valid, amount_min: 500 })
    expect(result.success).toBe(false)
  })

  it('rejects amount_max below 1000', () => {
    const result = matchingFilterSchema.safeParse({ ...valid, amount_max: 500 })
    expect(result.success).toBe(false)
  })

  it('rejects when amount_max < amount_min (cross-field validation)', () => {
    const result = matchingFilterSchema.safeParse({ ...valid, amount_min: 50000, amount_max: 10000 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('amount_max')
    }
  })

  it('accepts amount_max equal to amount_min', () => {
    // equal → max >= min → valid
    const result = matchingFilterSchema.safeParse({ ...valid, amount_min: 5000, amount_max: 5000 })
    expect(result.success).toBe(true)
  })

  it('rejects invalid frequency', () => {
    const result = matchingFilterSchema.safeParse({ ...valid, frequency: 'annuel' })
    expect(result.success).toBe(false)
  })

  it('rejects min_trust_score > 100', () => {
    const result = matchingFilterSchema.safeParse({ ...valid, min_trust_score: 110 })
    expect(result.success).toBe(false)
  })

  it('rejects min_trust_score < 0', () => {
    const result = matchingFilterSchema.safeParse({ ...valid, min_trust_score: -5 })
    expect(result.success).toBe(false)
  })

  it('accepts all valid frequency values', () => {
    for (const freq of ['quotidien', 'hebdomadaire', 'mensuel'] as const) {
      expect(matchingFilterSchema.safeParse({ ...valid, frequency: freq }).success).toBe(true)
    }
  })
})
