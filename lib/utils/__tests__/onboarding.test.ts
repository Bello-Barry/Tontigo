import { describe, it, expect } from 'vitest'
import { isProfileComplete, calculateAge, isAdult } from '../onboarding'

describe('onboarding utils', () => {
  // ---------------------------------------------------------------------------
  // calculateAge
  // ---------------------------------------------------------------------------
  describe('calculateAge', () => {
    it('returns correct age for a past birthday', () => {
      const today = new Date()
      const birth = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate())
      expect(calculateAge(birth.toISOString().split('T')[0])).toBe(25)
    })

    it('returns age minus 1 when birthday has not occurred yet this year', () => {
      // Use a fixed date in the future within the year to guarantee the birthday hasn't passed.
      // Strategy: pick a date 20 years ago but push the month 2 months ahead so it hasn't occurred yet.
      const today = new Date()
      // Target: someone born 20 years ago whose birthday is 2 months from now
      const futureBirth = new Date(today)
      futureBirth.setFullYear(futureBirth.getFullYear() - 20)
      futureBirth.setMonth(futureBirth.getMonth() + 2) // 2 months in future
      expect(calculateAge(futureBirth.toISOString().split('T')[0])).toBe(19)
    })
  })

  // ---------------------------------------------------------------------------
  // isAdult
  // ---------------------------------------------------------------------------
  describe('isAdult', () => {
    it('returns true for someone exactly 18 years old today', () => {
      const today = new Date()
      const birth = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
      expect(isAdult(birth.toISOString().split('T')[0])).toBe(true)
    })

    it('returns false for someone under 18', () => {
      const today = new Date()
      const birth = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate())
      expect(isAdult(birth.toISOString().split('T')[0])).toBe(false)
    })

    it('returns true for a 30-year-old', () => {
      const today = new Date()
      const birth = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate())
      expect(isAdult(birth.toISOString().split('T')[0])).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // isProfileComplete
  // ---------------------------------------------------------------------------
  describe('isProfileComplete', () => {
    const complete = {
      full_name:    'Jean Dupont',
      date_of_birth: '1990-01-01',
      quartier:     'Poto-Poto',
      profession:   'Commerçant(e)',
      wallet_mtn:   '061234567',
      wallet_airtel: '',
      onboarding_done: true,
    }

    it('returns true for a fully completed profile', () => {
      expect(isProfileComplete(complete)).toBe(true)
    })

    it('returns false when full_name is missing', () => {
      expect(isProfileComplete({ ...complete, full_name: null })).toBe(false)
    })

    it('returns false when full_name is the placeholder "Utilisateur"', () => {
      expect(isProfileComplete({ ...complete, full_name: 'Utilisateur' })).toBe(false)
    })

    it('returns false when date_of_birth is missing', () => {
      expect(isProfileComplete({ ...complete, date_of_birth: null })).toBe(false)
    })

    it('returns false when quartier is missing', () => {
      expect(isProfileComplete({ ...complete, quartier: null })).toBe(false)
    })

    it('returns false when profession is missing', () => {
      expect(isProfileComplete({ ...complete, profession: null })).toBe(false)
    })

    it('returns false when both wallets are missing', () => {
      expect(isProfileComplete({ ...complete, wallet_mtn: null, wallet_airtel: null })).toBe(false)
    })

    it('returns true when only airtel wallet is provided', () => {
      expect(isProfileComplete({ ...complete, wallet_mtn: null, wallet_airtel: '051234567' })).toBe(true)
    })

    it('returns false when onboarding_done is false', () => {
      expect(isProfileComplete({ ...complete, onboarding_done: false })).toBe(false)
    })
  })
})
