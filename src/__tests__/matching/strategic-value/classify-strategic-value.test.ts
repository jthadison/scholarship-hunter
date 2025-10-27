/**
 * Tests for Strategic Value Classification
 *
 * Story 2.6 - Task 11.3: Unit tests for tier classification
 * Tests boundary conditions and tier thresholds
 */

import { describe, it, expect } from 'vitest'
import {
  classifyStrategicValue,
  formatStrategicValueDisplay,
  getTierColorClasses,
  TIER_THRESHOLDS,
} from '@/server/lib/matching/classify-strategic-value'

describe('classifyStrategicValue', () => {
  describe('BEST_BET tier (ROI >= 5.0)', () => {
    it('should classify 5.0 as BEST_BET (exact boundary)', () => {
      const result = classifyStrategicValue(5.0)
      expect(result.tier).toBe('BEST_BET')
      expect(result.value).toBe(5.0)
      expect(result.label).toBe('Best Bet')
      expect(result.icon).toBe('⭐')
      expect(result.color).toBe('gold')
    })

    it('should classify 10.0 as BEST_BET (max value)', () => {
      const result = classifyStrategicValue(10.0)
      expect(result.tier).toBe('BEST_BET')
    })

    it('should classify 6.5 as BEST_BET (mid-range)', () => {
      const result = classifyStrategicValue(6.5)
      expect(result.tier).toBe('BEST_BET')
    })
  })

  describe('HIGH_VALUE tier (ROI 3.0-4.9)', () => {
    it('should classify 4.9 as HIGH_VALUE (upper boundary)', () => {
      const result = classifyStrategicValue(4.9)
      expect(result.tier).toBe('HIGH_VALUE')
      expect(result.label).toBe('High Value')
      expect(result.icon).toBe('✓')
      expect(result.color).toBe('green')
    })

    it('should classify 3.0 as HIGH_VALUE (exact boundary)', () => {
      const result = classifyStrategicValue(3.0)
      expect(result.tier).toBe('HIGH_VALUE')
    })

    it('should classify 4.0 as HIGH_VALUE (mid-range)', () => {
      const result = classifyStrategicValue(4.0)
      expect(result.tier).toBe('HIGH_VALUE')
    })
  })

  describe('MEDIUM_VALUE tier (ROI 1.5-2.9)', () => {
    it('should classify 2.9 as MEDIUM_VALUE (upper boundary)', () => {
      const result = classifyStrategicValue(2.9)
      expect(result.tier).toBe('MEDIUM_VALUE')
      expect(result.label).toBe('Medium Value')
      expect(result.icon).toBe('•')
      expect(result.color).toBe('blue')
    })

    it('should classify 1.5 as MEDIUM_VALUE (exact boundary)', () => {
      const result = classifyStrategicValue(1.5)
      expect(result.tier).toBe('MEDIUM_VALUE')
    })

    it('should classify 2.0 as MEDIUM_VALUE (mid-range)', () => {
      const result = classifyStrategicValue(2.0)
      expect(result.tier).toBe('MEDIUM_VALUE')
    })
  })

  describe('LOW_VALUE tier (ROI < 1.5)', () => {
    it('should classify 1.4 as LOW_VALUE (just below threshold)', () => {
      const result = classifyStrategicValue(1.4)
      expect(result.tier).toBe('LOW_VALUE')
      expect(result.label).toBe('Low Value')
      expect(result.icon).toBe('○')
      expect(result.color).toBe('gray')
    })

    it('should classify 0.5 as LOW_VALUE', () => {
      const result = classifyStrategicValue(0.5)
      expect(result.tier).toBe('LOW_VALUE')
    })

    it('should classify 0.0 as LOW_VALUE', () => {
      const result = classifyStrategicValue(0.0)
      expect(result.tier).toBe('LOW_VALUE')
    })
  })

  describe('Boundary conditions', () => {
    it('should classify 4.99999 as HIGH_VALUE (floating point)', () => {
      const result = classifyStrategicValue(4.99999)
      expect(result.tier).toBe('HIGH_VALUE')
    })

    it('should classify 5.00001 as BEST_BET (floating point)', () => {
      const result = classifyStrategicValue(5.00001)
      expect(result.tier).toBe('BEST_BET')
    })

    it('should classify 2.99999 as MEDIUM_VALUE (floating point)', () => {
      const result = classifyStrategicValue(2.99999)
      expect(result.tier).toBe('MEDIUM_VALUE')
    })

    it('should classify 3.00001 as HIGH_VALUE (floating point)', () => {
      const result = classifyStrategicValue(3.00001)
      expect(result.tier).toBe('HIGH_VALUE')
    })

    it('should classify 1.49999 as LOW_VALUE (floating point)', () => {
      const result = classifyStrategicValue(1.49999)
      expect(result.tier).toBe('LOW_VALUE')
    })

    it('should classify 1.50001 as MEDIUM_VALUE (floating point)', () => {
      const result = classifyStrategicValue(1.50001)
      expect(result.tier).toBe('MEDIUM_VALUE')
    })
  })

  describe('Recommendation text', () => {
    it('should include recommendation for each tier', () => {
      const bestBet = classifyStrategicValue(6.0)
      expect(bestBet.recommendation).toContain('Apply immediately')

      const highValue = classifyStrategicValue(4.0)
      expect(highValue.recommendation).toContain('Strong opportunity')

      const mediumValue = classifyStrategicValue(2.0)
      expect(mediumValue.recommendation).toContain('if time permits')

      const lowValue = classifyStrategicValue(1.0)
      expect(lowValue.recommendation).toContain('Consider skipping')
    })
  })
})

describe('formatStrategicValueDisplay', () => {
  it('should format complete display string with all components', () => {
    const display = formatStrategicValueDisplay({
      tier: 'BEST_BET',
      awardAmount: 5000,
      successProbability: 72,
      effortLevel: 'LOW',
      effortBreakdown: { essays: 1, documents: 2, recommendations: 0 },
    })

    expect(display).toContain('Strategic Value: Best Bet')
    expect(display).toContain('$5,000 award')
    expect(display).toContain('72% success probability')
    expect(display).toContain('LOW effort')
    expect(display).toContain('1 essay')
    expect(display).toContain('2 docs')
  })

  it('should pluralize essays correctly', () => {
    const single = formatStrategicValueDisplay({
      tier: 'HIGH_VALUE',
      awardAmount: 3000,
      successProbability: 60,
      effortLevel: 'MEDIUM',
      effortBreakdown: { essays: 1, documents: 0, recommendations: 0 },
    })
    expect(single).toContain('1 essay')

    const multiple = formatStrategicValueDisplay({
      tier: 'HIGH_VALUE',
      awardAmount: 3000,
      successProbability: 60,
      effortLevel: 'MEDIUM',
      effortBreakdown: { essays: 2, documents: 0, recommendations: 0 },
    })
    expect(multiple).toContain('2 essays')
  })

  it('should pluralize documents correctly', () => {
    const single = formatStrategicValueDisplay({
      tier: 'MEDIUM_VALUE',
      awardAmount: 2000,
      successProbability: 50,
      effortLevel: 'MEDIUM',
      effortBreakdown: { essays: 0, documents: 1, recommendations: 0 },
    })
    expect(single).toContain('1 doc')

    const multiple = formatStrategicValueDisplay({
      tier: 'MEDIUM_VALUE',
      awardAmount: 2000,
      successProbability: 50,
      effortLevel: 'MEDIUM',
      effortBreakdown: { essays: 0, documents: 3, recommendations: 0 },
    })
    expect(multiple).toContain('3 docs')
  })

  it('should pluralize recommendations correctly', () => {
    const single = formatStrategicValueDisplay({
      tier: 'HIGH_VALUE',
      awardAmount: 4000,
      successProbability: 65,
      effortLevel: 'MEDIUM',
      effortBreakdown: { essays: 0, documents: 0, recommendations: 1 },
    })
    expect(single).toContain('1 rec')

    const multiple = formatStrategicValueDisplay({
      tier: 'MEDIUM_VALUE',
      awardAmount: 3000,
      successProbability: 55,
      effortLevel: 'HIGH',
      effortBreakdown: { essays: 0, documents: 0, recommendations: 2 },
    })
    expect(multiple).toContain('2 recs')
  })

  it('should show "no requirements" when all counts are 0', () => {
    const display = formatStrategicValueDisplay({
      tier: 'BEST_BET',
      awardAmount: 1000,
      successProbability: 80,
      effortLevel: 'LOW',
      effortBreakdown: { essays: 0, documents: 0, recommendations: 0 },
    })
    expect(display).toContain('no requirements')
  })

  it('should format large award amounts with commas', () => {
    const display = formatStrategicValueDisplay({
      tier: 'BEST_BET',
      awardAmount: 25000,
      successProbability: 85,
      effortLevel: 'LOW',
      effortBreakdown: { essays: 1, documents: 1, recommendations: 0 },
    })
    expect(display).toContain('$25,000')
  })

  it('should round probability to nearest integer', () => {
    const display = formatStrategicValueDisplay({
      tier: 'HIGH_VALUE',
      awardAmount: 5000,
      successProbability: 72.456,
      effortLevel: 'MEDIUM',
      effortBreakdown: { essays: 2, documents: 2, recommendations: 0 },
    })
    expect(display).toContain('72%')
  })
})

describe('getTierColorClasses', () => {
  it('should return yellow classes for BEST_BET', () => {
    const classes = getTierColorClasses('BEST_BET')
    expect(classes.bg).toContain('yellow')
    expect(classes.text).toContain('yellow')
    expect(classes.border).toContain('yellow')
  })

  it('should return green classes for HIGH_VALUE', () => {
    const classes = getTierColorClasses('HIGH_VALUE')
    expect(classes.bg).toContain('green')
    expect(classes.text).toContain('green')
    expect(classes.border).toContain('green')
  })

  it('should return blue classes for MEDIUM_VALUE', () => {
    const classes = getTierColorClasses('MEDIUM_VALUE')
    expect(classes.bg).toContain('blue')
    expect(classes.text).toContain('blue')
    expect(classes.border).toContain('blue')
  })

  it('should return gray classes for LOW_VALUE', () => {
    const classes = getTierColorClasses('LOW_VALUE')
    expect(classes.bg).toContain('gray')
    expect(classes.text).toContain('gray')
    expect(classes.border).toContain('gray')
  })

  it('should include dark mode variants', () => {
    const classes = getTierColorClasses('BEST_BET')
    expect(classes.bg).toContain('dark:')
    expect(classes.text).toContain('dark:')
    expect(classes.border).toContain('dark:')
  })
})

describe('TIER_THRESHOLDS constants', () => {
  it('should have correct threshold values', () => {
    expect(TIER_THRESHOLDS.BEST_BET).toBe(5.0)
    expect(TIER_THRESHOLDS.HIGH_VALUE).toBe(3.0)
    expect(TIER_THRESHOLDS.MEDIUM_VALUE).toBe(1.5)
  })

  it('should have thresholds in descending order', () => {
    expect(TIER_THRESHOLDS.BEST_BET).toBeGreaterThan(TIER_THRESHOLDS.HIGH_VALUE)
    expect(TIER_THRESHOLDS.HIGH_VALUE).toBeGreaterThan(TIER_THRESHOLDS.MEDIUM_VALUE)
  })
})
