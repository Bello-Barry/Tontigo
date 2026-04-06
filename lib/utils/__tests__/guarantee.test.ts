import { describe, it, expect } from 'vitest'
import { calculateGuarantee, getGuaranteeLabel } from '../guarantee'

describe('guarantee utils', () => {
  describe('calculateGuarantee', () => {
    it('calculates guarantee for first position', () => {
      // maxMembers = 10, turnPosition = 1, amount = 1000
      // ratio = (10 - 1) / (10 - 1) = 1
      // result = 1000 * 10 * 1 = 10000
      expect(calculateGuarantee(1, 10, 1000)).toBe(10000)
    })

    it('calculates guarantee for middle position', () => {
      // maxMembers = 11, turnPosition = 6, amount = 1000
      // ratio = (11 - 6) / (11 - 1) = 5 / 10 = 0.5
      // result = 1000 * 11 * 0.5 = 5500
      expect(calculateGuarantee(6, 11, 1000)).toBe(5500)
    })

    it('calculates guarantee for last position', () => {
      // maxMembers = 10, turnPosition = 10, amount = 1000
      // ratio = (10 - 10) / (10 - 1) = 0
      // result = 0
      expect(calculateGuarantee(10, 10, 1000)).toBe(0)
    })
  })

  describe('getGuaranteeLabel', () => {
    it('returns correct labels based on ratio', () => {
      expect(getGuaranteeLabel(1, 10)).toBe('Très élevée')
      expect(getGuaranteeLabel(5, 10)).toBe('Élevée')
      expect(getGuaranteeLabel(8, 10)).toBe('Modérée')
      expect(getGuaranteeLabel(10, 10)).toBe('Faible')
    })
  })
})
