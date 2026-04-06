import { describe, it, expect } from 'vitest'
import { getTrustScoreDelta, getTrustScoreColor, getTrustScoreLabel } from '../trust-score'

describe('trust-score utils', () => {
  describe('getTrustScoreDelta', () => {
    it('returns +2 for on_time_payment', () => {
      expect(getTrustScoreDelta('on_time_payment')).toBe(2)
    })

    it('returns negative delta for late_payment', () => {
      expect(getTrustScoreDelta('late_payment', 1)).toBe(-2)
      expect(getTrustScoreDelta('late_payment', 10)).toBe(-15) // capped at 15
    })

    it('returns -50 for fugitive', () => {
      expect(getTrustScoreDelta('fugitive')).toBe(-50)
    })
  })

  describe('getTrustScoreLabel', () => {
    it('returns Expert for score >= 80', () => {
      expect(getTrustScoreLabel(85)).toBe('Expert')
    })
    it('returns Fiable for score >= 60', () => {
      expect(getTrustScoreLabel(65)).toBe('Fiable')
    })
    it('returns Nouveau for score >= 40', () => {
      expect(getTrustScoreLabel(45)).toBe('Nouveau')
    })
    it('returns À risque for score < 40', () => {
      expect(getTrustScoreLabel(30)).toBe('À risque')
    })
  })
})
