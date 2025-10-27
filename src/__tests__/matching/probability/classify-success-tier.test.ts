/**
 * Tests for Success Tier Classification
 *
 * Story 2.5: Success Probability Prediction
 * Tests AC#3: Tier classification thresholds and AC#4: Display format
 */

import { describe, it, expect } from 'vitest'
import {
  classifySuccessTier,
  formatTierDisplay,
  getTierColor,
} from '@/server/lib/matching/classify-success-tier'

describe('classifySuccessTier', () => {
  describe('AC#3: Tier threshold boundaries', () => {
    describe('Strong Match (70-100%)', () => {
      it('should classify 70% as Strong Match', () => {
        const result = classifySuccessTier(70)
        expect(result.tier).toBe('STRONG_MATCH')
        expect(result.probability).toBe(70)
      })

      it('should classify 85% as Strong Match', () => {
        const result = classifySuccessTier(85)
        expect(result.tier).toBe('STRONG_MATCH')
      })

      it('should classify 100% as Strong Match', () => {
        const result = classifySuccessTier(100)
        expect(result.tier).toBe('STRONG_MATCH')
      })
    })

    describe('Competitive Match (40-69%)', () => {
      it('should classify 69% as Competitive Match (boundary)', () => {
        const result = classifySuccessTier(69)
        expect(result.tier).toBe('COMPETITIVE_MATCH')
        expect(result.probability).toBe(69)
      })

      it('should classify 40% as Competitive Match (boundary)', () => {
        const result = classifySuccessTier(40)
        expect(result.tier).toBe('COMPETITIVE_MATCH')
      })

      it('should classify 55% as Competitive Match', () => {
        const result = classifySuccessTier(55)
        expect(result.tier).toBe('COMPETITIVE_MATCH')
      })
    })

    describe('Reach (10-39%)', () => {
      it('should classify 39% as Reach (boundary)', () => {
        const result = classifySuccessTier(39)
        expect(result.tier).toBe('REACH')
        expect(result.probability).toBe(39)
      })

      it('should classify 10% as Reach (boundary)', () => {
        const result = classifySuccessTier(10)
        expect(result.tier).toBe('REACH')
      })

      it('should classify 25% as Reach', () => {
        const result = classifySuccessTier(25)
        expect(result.tier).toBe('REACH')
      })
    })

    describe('Long-Shot (<10%)', () => {
      it('should classify 9% as Long-Shot (boundary)', () => {
        const result = classifySuccessTier(9)
        expect(result.tier).toBe('LONG_SHOT')
        expect(result.probability).toBe(9)
      })

      it('should classify 5% as Long-Shot', () => {
        const result = classifySuccessTier(5)
        expect(result.tier).toBe('LONG_SHOT')
      })

      it('should classify 0% as Long-Shot', () => {
        const result = classifySuccessTier(0)
        expect(result.tier).toBe('LONG_SHOT')
      })
    })
  })

  describe('Display metadata', () => {
    it('should include label for Strong Match', () => {
      const result = classifySuccessTier(72)
      expect(result.label).toBe('Strong Match')
      expect(result.description).toBe('Apply immediately, high confidence')
      expect(result.color).toBe('green')
    })

    it('should include label for Competitive Match', () => {
      const result = classifySuccessTier(55)
      expect(result.label).toBe('Competitive Match')
      expect(result.description).toBe('Solid opportunity, worth effort')
      expect(result.color).toBe('blue')
    })

    it('should include label for Reach', () => {
      const result = classifySuccessTier(25)
      expect(result.label).toBe('Reach')
      expect(result.description).toBe('Long shot, but possible')
      expect(result.color).toBe('orange')
    })

    it('should include label for Long-Shot', () => {
      const result = classifySuccessTier(8)
      expect(result.label).toBe('Long-Shot')
      expect(result.description).toBe('Very competitive, consider if high value')
      expect(result.color).toBe('red')
    })
  })

  describe('Edge cases', () => {
    it('should handle probability > 100%', () => {
      const result = classifySuccessTier(150)
      expect(result.tier).toBe('STRONG_MATCH')
      expect(result.probability).toBe(150) // Probability value passed through
    })

    it('should handle negative probability', () => {
      const result = classifySuccessTier(-5)
      expect(result.tier).toBe('LONG_SHOT')
      expect(result.probability).toBe(-5)
    })

    it('should handle decimal probabilities', () => {
      const result = classifySuccessTier(69.5)
      expect(result.tier).toBe('COMPETITIVE_MATCH') // 69.5 < 70
    })
  })
})

describe('formatTierDisplay', () => {
  describe('AC#4: Display format', () => {
    it('should format as "{probability}% success probability - {tier}"', () => {
      const tierResult = classifySuccessTier(72)
      const formatted = formatTierDisplay(tierResult)

      expect(formatted).toBe('72% success probability - Strong Match')
    })

    it('should format Competitive Match correctly', () => {
      const tierResult = classifySuccessTier(55)
      const formatted = formatTierDisplay(tierResult)

      expect(formatted).toBe('55% success probability - Competitive Match')
    })

    it('should format Reach correctly', () => {
      const tierResult = classifySuccessTier(25)
      const formatted = formatTierDisplay(tierResult)

      expect(formatted).toBe('25% success probability - Reach')
    })

    it('should format Long-Shot correctly', () => {
      const tierResult = classifySuccessTier(8)
      const formatted = formatTierDisplay(tierResult)

      expect(formatted).toBe('8% success probability - Long-Shot')
    })
  })
})

describe('getTierColor', () => {
  it('should return green for Strong Match', () => {
    const color = getTierColor('STRONG_MATCH')
    expect(color).toBe('green')
  })

  it('should return blue for Competitive Match', () => {
    const color = getTierColor('COMPETITIVE_MATCH')
    expect(color).toBe('blue')
  })

  it('should return orange for Reach', () => {
    const color = getTierColor('REACH')
    expect(color).toBe('orange')
  })

  it('should return red for Long-Shot', () => {
    const color = getTierColor('LONG_SHOT')
    expect(color).toBe('red')
  })
})

describe('Boundary condition comprehensive testing', () => {
  // Test all critical boundary values
  const boundaries = [
    { prob: 0, expectedTier: 'LONG_SHOT' },
    { prob: 9, expectedTier: 'LONG_SHOT' },
    { prob: 10, expectedTier: 'REACH' },
    { prob: 39, expectedTier: 'REACH' },
    { prob: 40, expectedTier: 'COMPETITIVE_MATCH' },
    { prob: 69, expectedTier: 'COMPETITIVE_MATCH' },
    { prob: 70, expectedTier: 'STRONG_MATCH' },
    { prob: 100, expectedTier: 'STRONG_MATCH' },
  ]

  boundaries.forEach(({ prob, expectedTier }) => {
    it(`should classify ${prob}% as ${expectedTier}`, () => {
      const result = classifySuccessTier(prob)
      expect(result.tier).toBe(expectedTier)
    })
  })
})
