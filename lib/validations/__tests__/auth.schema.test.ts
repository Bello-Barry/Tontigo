import { describe, it, expect } from 'vitest'
import { phoneSchema, pinSchema, onboardingStep1Schema } from '../auth.schema'

describe('auth schemas', () => {
  describe('phoneSchema', () => {
    it('validates correct Congolese phone numbers', () => {
      expect(phoneSchema.safeParse({ phone: '061234567' }).success).toBe(true)
      expect(phoneSchema.safeParse({ phone: '051234567' }).success).toBe(true)
      expect(phoneSchema.safeParse({ phone: '041234567' }).success).toBe(true)
      expect(phoneSchema.safeParse({ phone: '242061234567' }).success).toBe(true)
    })

    it('rejects incorrect numbers', () => {
      expect(phoneSchema.safeParse({ phone: '012345678' }).success).toBe(false)
      expect(phoneSchema.safeParse({ phone: '123' }).success).toBe(false)
    })
  })

  describe('pinSchema', () => {
    it('validates 4-digit pins', () => {
      expect(pinSchema.safeParse({ pin: '1234' }).success).toBe(true)
    })

    it('rejects non-4-digit or non-numeric pins', () => {
      expect(pinSchema.safeParse({ pin: '123' }).success).toBe(false)
      expect(pinSchema.safeParse({ pin: '12345' }).success).toBe(false)
      expect(pinSchema.safeParse({ pin: 'abcd' }).success).toBe(false)
    })
  })

  describe('onboardingStep1Schema', () => {
    it('validates correct identity info', () => {
      const data = {
        full_name: 'John Doe',
        date_of_birth: '1990-01-01'
      }
      expect(onboardingStep1Schema.safeParse(data).success).toBe(true)
    })

    it('rejects underaged users', () => {
        const today = new Date()
        const tooYoung = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate()).toISOString().split('T')[0]
        const data = {
            full_name: 'Young Kid',
            date_of_birth: tooYoung
        }
        expect(onboardingStep1Schema.safeParse(data).success).toBe(false)
    })
  })
})
