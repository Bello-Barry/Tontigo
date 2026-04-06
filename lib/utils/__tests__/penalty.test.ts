import { describe, it, expect } from 'vitest'
import { calculateDailyPenalty, calculateTotalPenalties, shouldEliminate, getPenaltyLevel } from '../penalty'

describe('penalty utils', () => {
  describe('calculateDailyPenalty', () => {
    it('calculates daily penalty correctly', () => {
      expect(calculateDailyPenalty(10000, 1)).toBe(100)
    })
  })

  describe('calculateTotalPenalties', () => {
    it('calculates total penalties correctly', () => {
      expect(calculateTotalPenalties(10000, 1, 5)).toBe(500)
    })
  })

  describe('shouldEliminate', () => {
    it('returns true if penalties >= totalPaid', () => {
      expect(shouldEliminate(1000, 1000)).toBe(true)
      expect(shouldEliminate(1000, 1200)).toBe(true)
    })

    it('returns false if penalties < totalPaid', () => {
      expect(shouldEliminate(1000, 500)).toBe(false)
    })
  })

  describe('getPenaltyLevel', () => {
    it('returns none for 0 days', () => {
      expect(getPenaltyLevel(0)).toBe('none')
    })
    it('returns warning for 1-3 days', () => {
      expect(getPenaltyLevel(2)).toBe('warning')
    })
    it('returns critical for > 3 days', () => {
      expect(getPenaltyLevel(5)).toBe('critical')
    })
  })
})
