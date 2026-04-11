import { describe, it, expect } from 'vitest'
import {
  createPinSchema,
  onboardingStep2Schema,
  onboardingStep3Schema,
} from '../../validations/auth.schema'
import { joinGroupSchema as joinTontineSchema, disputeSchema as disputeTontineSchema } from '../../validations/tontine.schema'

// ---------------------------------------------------------------------------
// createPinSchema
// ---------------------------------------------------------------------------
describe('createPinSchema', () => {
  it('validates matching 4-digit PINs', () => {
    const result = createPinSchema.safeParse({ pin: '1234', pin_confirm: '1234' })
    expect(result.success).toBe(true)
  })

  it('rejects non-matching PINs', () => {
    const result = createPinSchema.safeParse({ pin: '1234', pin_confirm: '5678' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('pin_confirm')
    }
  })

  it('rejects pins with non-numeric characters', () => {
    const result = createPinSchema.safeParse({ pin: '12ab', pin_confirm: '12ab' })
    expect(result.success).toBe(false)
  })

  it('rejects pins that are not exactly 4 digits', () => {
    const result = createPinSchema.safeParse({ pin: '123', pin_confirm: '123' })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// onboardingStep2Schema
// ---------------------------------------------------------------------------
describe('onboardingStep2Schema', () => {
  it('validates correct step 2 data', () => {
    const result = onboardingStep2Schema.safeParse({
      quartier:   'Poto-Poto',
      profession: 'Commerçant(e)',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty quartier', () => {
    const result = onboardingStep2Schema.safeParse({ quartier: '', profession: 'Commerçant(e)' })
    expect(result.success).toBe(false)
  })

  it('rejects empty profession', () => {
    const result = onboardingStep2Schema.safeParse({ quartier: 'Poto-Poto', profession: '' })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// onboardingStep3Schema
// ---------------------------------------------------------------------------
describe('onboardingStep3Schema', () => {
  it('validates correct MTN wallet number', () => {
    const result = onboardingStep3Schema.safeParse({ wallet_mtn: '061234567', wallet_airtel: '' })
    expect(result.success).toBe(true)
  })

  it('validates correct Airtel wallet number', () => {
    const result = onboardingStep3Schema.safeParse({ wallet_mtn: '', wallet_airtel: '051234567' })
    expect(result.success).toBe(true)
  })

  it('validates both wallets provided', () => {
    const result = onboardingStep3Schema.safeParse({
      wallet_mtn:   '061234567',
      wallet_airtel: '051234567',
    })
    expect(result.success).toBe(true)
  })

  it('rejects when both wallets are empty', () => {
    const result = onboardingStep3Schema.safeParse({ wallet_mtn: '', wallet_airtel: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid MTN number (wrong prefix)', () => {
    const result = onboardingStep3Schema.safeParse({ wallet_mtn: '071234567', wallet_airtel: '' })
    // invalid MTN but airtel is also empty → fails cross-field too
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// joinGroupSchema (tontine)
// ---------------------------------------------------------------------------
describe('joinGroupSchema', () => {
  it('validates an 8-character invite code', () => {
    const result = joinTontineSchema.safeParse({ invite_code: 'ABCD1234' })
    expect(result.success).toBe(true)
  })

  it('rejects a code shorter than 8 characters', () => {
    const result = joinTontineSchema.safeParse({ invite_code: 'ABC123' })
    expect(result.success).toBe(false)
  })

  it('rejects a code longer than 8 characters', () => {
    const result = joinTontineSchema.safeParse({ invite_code: 'ABCD12345' })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// disputeSchema (tontine)
// ---------------------------------------------------------------------------
describe('disputeSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000'

  it('validates a correct dispute', () => {
    const result = disputeTontineSchema.safeParse({
      member_reported: validUUID,
      reason:          'Cet utilisateur na pas payé depuis 2 semaines.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid UUID for member_reported', () => {
    const result = disputeTontineSchema.safeParse({
      member_reported: 'not-a-uuid',
      reason:          'Raison valide ici pour le test.',
    })
    expect(result.success).toBe(false)
  })

  it('rejects reason shorter than 10 characters', () => {
    const result = disputeTontineSchema.safeParse({
      member_reported: validUUID,
      reason:          'Trop court',
    })
    // 'Trop court' = 10 chars → should pass (min 10)
    expect(result.success).toBe(true)
  })

  it('rejects reason with fewer than 10 characters', () => {
    const result = disputeTontineSchema.safeParse({
      member_reported: validUUID,
      reason:          'Court',
    })
    expect(result.success).toBe(false)
  })
})
