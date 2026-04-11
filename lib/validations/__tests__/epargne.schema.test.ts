import { describe, it, expect } from 'vitest'
import { addDays } from 'date-fns'
import { createVaultSchema, depositVaultSchema } from '../epargne.schema'

// ---------------------------------------------------------------------------
// createVaultSchema
// ---------------------------------------------------------------------------
describe('createVaultSchema', () => {
  function future(days: number): string {
    return addDays(new Date(), days).toISOString().split('T')[0]
  }

  it('validates a correct vault with unlock_date > 30 days', () => {
    const result = createVaultSchema.safeParse({
      name:        'Mon coffre',
      unlock_date: future(35),
    })
    expect(result.success).toBe(true)
  })

  it('rejects unlock_date less than 30 days away', () => {
    const result = createVaultSchema.safeParse({
      name:        'Mon coffre',
      unlock_date: future(10),
    })
    expect(result.success).toBe(false)
  })

  it('rejects unlock_date exactly 29 days away', () => {
    const result = createVaultSchema.safeParse({
      name:        'Mon coffre',
      unlock_date: future(29),
    })
    expect(result.success).toBe(false)
  })

  it('rejects name shorter than 2 characters', () => {
    const result = createVaultSchema.safeParse({
      name:        'A',
      unlock_date: future(35),
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional fields when not provided', () => {
    const result = createVaultSchema.safeParse({
      name:        'Épargne vacances',
      unlock_date: future(60),
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid frequency enum values', () => {
    for (const freq of ['quotidien', 'hebdomadaire', 'mensuel'] as const) {
      const result = createVaultSchema.safeParse({
        name:        'Coffre',
        unlock_date: future(35),
        frequency:   freq,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid frequency values', () => {
    const result = createVaultSchema.safeParse({
      name:        'Coffre',
      unlock_date: future(35),
      frequency:   'annuel',
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// depositVaultSchema
// ---------------------------------------------------------------------------
describe('depositVaultSchema', () => {
  it('validates a correct deposit', () => {
    const result = depositVaultSchema.safeParse({ amount: 5000, wallet_type: 'mtn' })
    expect(result.success).toBe(true)
  })

  it('rejects amount below 500 FCFA', () => {
    const result = depositVaultSchema.safeParse({ amount: 100, wallet_type: 'mtn' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid wallet_type', () => {
    const result = depositVaultSchema.safeParse({ amount: 5000, wallet_type: 'orange' })
    expect(result.success).toBe(false)
  })

  it('accepts airtel as wallet_type', () => {
    const result = depositVaultSchema.safeParse({ amount: 1000, wallet_type: 'airtel' })
    expect(result.success).toBe(true)
  })
})
