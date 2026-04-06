import { describe, it, expect, vi } from 'vitest'
import { calculatePayoutCommission, calculateSavingsCommission, getMatchingFee } from '../commission'

describe('commission utils', () => {
  describe('calculatePayoutCommission', () => {
    it('calculates 1.5% commission correctly', () => {
      const { commission, netAmount } = calculatePayoutCommission(100000)
      expect(commission).toBe(1500)
      expect(netAmount).toBe(98500)
    })

    it('rounds the commission', () => {
      const { commission } = calculatePayoutCommission(100)
      expect(commission).toBe(2) // 1.5 rounded to 2
    })
  })

  describe('calculateSavingsCommission', () => {
    it('calculates 0.5% commission correctly', () => {
      const { commission, netAmount } = calculateSavingsCommission(100000)
      expect(commission).toBe(500)
      expect(netAmount).toBe(99500)
    })
  })

  describe('getMatchingFee', () => {
    it('returns the default matching fee', () => {
      expect(getMatchingFee()).toBe(500)
    })
  })
})
