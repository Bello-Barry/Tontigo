import { describe, it, expect } from 'vitest'
import { formatFCFA, formatDate, formatDateShort, getDaysUntil, getFrequencyLabel } from '../format'

describe('format utils', () => {
  describe('formatFCFA', () => {
    it('formats amount in FCFA', () => {
      // Note: Intl might have different space characters depending on environment
      const result = formatFCFA(10000)
      expect(result).toMatch(/10\s?000/ )
      // Depending on the environment, it might be XAF or FCFA
      expect(result).toMatch(/(XAF|FCFA)/)
    })
  })

  describe('formatDate', () => {
    it('formats date in French long format', () => {
      const date = new Date('2023-12-25')
      const result = formatDate(date)
      expect(result).toContain('25')
      expect(result).toContain('décembre')
      expect(result).toContain('2023')
    })
  })

  describe('formatDateShort', () => {
    it('formats date in French short format', () => {
      const date = new Date('2023-12-25')
      const result = formatDateShort(date)
      expect(result).toBe('25/12/2023')
    })
  })

  describe('getDaysUntil', () => {
    it('calculates days correctly', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      expect(getDaysUntil(futureDate.toISOString())).toBe(5)
    })

    it('returns 0 for past dates', () => {
      expect(getDaysUntil('2020-01-01')).toBe(0)
    })
  })

  describe('getFrequencyLabel', () => {
    it('returns correct labels', () => {
      expect(getFrequencyLabel('quotidien')).toBe('Quotidien')
      expect(getFrequencyLabel('hebdomadaire')).toBe('Hebdomadaire')
      expect(getFrequencyLabel('mensuel')).toBe('Mensuel')
    })

    it('returns input if not found', () => {
      expect(getFrequencyLabel('unknown')).toBe('unknown')
    })
  })
})
