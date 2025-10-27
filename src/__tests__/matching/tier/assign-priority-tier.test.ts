/**
 * Unit Tests: Priority Tier Assignment Algorithm
 *
 * Tests the assignPriorityTier and getTierRationale functions with:
 * - Boundary conditions for each tier
 * - Edge cases (HIGH_VALUE_REACH special case)
 * - All tier transitions
 * - Rationale generation
 *
 * Story 2.7: Priority Tiering System
 */

import { describe, it, expect } from 'vitest'
import { assignPriorityTier, getTierRationale } from '@/server/lib/matching/assign-priority-tier'
import { PriorityTier } from '@prisma/client'

describe('assignPriorityTier', () => {
  describe('MUST_APPLY tier', () => {
    it('assigns MUST_APPLY when all criteria met: match 90+, probability 70%+, strategic value 3.0+', () => {
      const result = assignPriorityTier(94, 0.72, 5.0, 5000)
      expect(result).toBe(PriorityTier.MUST_APPLY)
    })

    it('assigns MUST_APPLY at exact thresholds: 90, 0.7, 3.0', () => {
      const result = assignPriorityTier(90, 0.7, 3.0, 5000)
      expect(result).toBe(PriorityTier.MUST_APPLY)
    })

    it('does NOT assign MUST_APPLY when match is 89 (below threshold)', () => {
      const result = assignPriorityTier(89, 0.7, 3.0, 5000)
      expect(result).not.toBe(PriorityTier.MUST_APPLY)
      expect(result).toBe(PriorityTier.SHOULD_APPLY)
    })

    it('does NOT assign MUST_APPLY when probability is 0.69 (below threshold)', () => {
      const result = assignPriorityTier(90, 0.69, 3.0, 5000)
      expect(result).not.toBe(PriorityTier.MUST_APPLY)
      expect(result).toBe(PriorityTier.SHOULD_APPLY)
    })

    it('does NOT assign MUST_APPLY when strategic value is 2.9 (below threshold)', () => {
      const result = assignPriorityTier(90, 0.7, 2.9, 5000)
      expect(result).not.toBe(PriorityTier.MUST_APPLY)
      expect(result).toBe(PriorityTier.SHOULD_APPLY)
    })
  })

  describe('SHOULD_APPLY tier', () => {
    it('assigns SHOULD_APPLY when match 75+ and probability 40%+', () => {
      const result = assignPriorityTier(80, 0.5, 2.5, 3000)
      expect(result).toBe(PriorityTier.SHOULD_APPLY)
    })

    it('assigns SHOULD_APPLY at exact thresholds: 75, 0.4', () => {
      const result = assignPriorityTier(75, 0.4, 2.0, 3000)
      expect(result).toBe(PriorityTier.SHOULD_APPLY)
    })

    it('does NOT assign SHOULD_APPLY when match is 74 (below threshold)', () => {
      const result = assignPriorityTier(74, 0.5, 2.5, 3000)
      expect(result).not.toBe(PriorityTier.SHOULD_APPLY)
      expect(result).toBe(PriorityTier.IF_TIME_PERMITS)
    })

    it('does NOT assign SHOULD_APPLY when probability is 0.39 (below threshold)', () => {
      const result = assignPriorityTier(75, 0.39, 2.5, 3000)
      expect(result).not.toBe(PriorityTier.SHOULD_APPLY)
      expect(result).toBe(PriorityTier.IF_TIME_PERMITS)
    })
  })

  describe('HIGH_VALUE_REACH tier', () => {
    it('assigns HIGH_VALUE_REACH when award $10K+ and probability <25%', () => {
      const result = assignPriorityTier(55, 0.15, 1.8, 15000)
      expect(result).toBe(PriorityTier.HIGH_VALUE_REACH)
    })

    it('assigns HIGH_VALUE_REACH at exact thresholds: $10,000, 0.24', () => {
      const result = assignPriorityTier(60, 0.24, 2.0, 10000)
      expect(result).toBe(PriorityTier.HIGH_VALUE_REACH)
    })

    it('assigns HIGH_VALUE_REACH even with very low match score (52) if award is high', () => {
      const result = assignPriorityTier(52, 0.08, 1.0, 50000)
      expect(result).toBe(PriorityTier.HIGH_VALUE_REACH)
    })

    it('does NOT assign HIGH_VALUE_REACH when award is $9,999 (below threshold)', () => {
      const result = assignPriorityTier(60, 0.15, 1.8, 9999)
      expect(result).not.toBe(PriorityTier.HIGH_VALUE_REACH)
      expect(result).toBe(PriorityTier.IF_TIME_PERMITS)
    })

    it('does NOT assign HIGH_VALUE_REACH when probability is 0.25 (not below threshold)', () => {
      const result = assignPriorityTier(60, 0.25, 1.8, 15000)
      expect(result).not.toBe(PriorityTier.HIGH_VALUE_REACH)
      expect(result).toBe(PriorityTier.IF_TIME_PERMITS)
    })
  })

  describe('IF_TIME_PERMITS tier (fallback)', () => {
    it('assigns IF_TIME_PERMITS as fallback when no other criteria met', () => {
      const result = assignPriorityTier(65, 0.3, 2.0, 2000)
      expect(result).toBe(PriorityTier.IF_TIME_PERMITS)
    })

    it('assigns IF_TIME_PERMITS for decent match with moderate probability', () => {
      const result = assignPriorityTier(70, 0.35, 1.5, 3500)
      expect(result).toBe(PriorityTier.IF_TIME_PERMITS)
    })

    it('assigns IF_TIME_PERMITS when match is low', () => {
      const result = assignPriorityTier(50, 0.2, 1.0, 2000)
      expect(result).toBe(PriorityTier.IF_TIME_PERMITS)
    })
  })

  describe('Edge cases and boundary transitions', () => {
    it('assigns correctly at 89→90 match score boundary', () => {
      expect(assignPriorityTier(89, 0.7, 3.0, 5000)).toBe(PriorityTier.SHOULD_APPLY)
      expect(assignPriorityTier(90, 0.7, 3.0, 5000)).toBe(PriorityTier.MUST_APPLY)
    })

    it('assigns correctly at 74→75 match score boundary', () => {
      expect(assignPriorityTier(74, 0.5, 2.5, 3000)).toBe(PriorityTier.IF_TIME_PERMITS)
      expect(assignPriorityTier(75, 0.5, 2.5, 3000)).toBe(PriorityTier.SHOULD_APPLY)
    })

    it('handles zero values gracefully', () => {
      const result = assignPriorityTier(0, 0, 0, 0)
      expect(result).toBe(PriorityTier.IF_TIME_PERMITS)
    })

    it('handles maximum values gracefully', () => {
      const result = assignPriorityTier(100, 1.0, 10.0, 100000)
      expect(result).toBe(PriorityTier.MUST_APPLY)
    })

    it('HIGH_VALUE_REACH takes precedence over IF_TIME_PERMITS for high awards', () => {
      const result = assignPriorityTier(60, 0.2, 1.5, 20000)
      expect(result).toBe(PriorityTier.HIGH_VALUE_REACH)
    })
  })
})

describe('getTierRationale', () => {
  it('generates correct rationale for MUST_APPLY tier', () => {
    const rationale = getTierRationale(PriorityTier.MUST_APPLY, 94, 0.72, 5.0, 5000)
    expect(rationale).toContain('MUST_APPLY')
    expect(rationale).toContain('94 match')
    expect(rationale).toContain('$5,000')
    expect(rationale).toContain('72%')
    expect(rationale).toContain('5.0')
    expect(rationale).toContain('Exceptional match')
  })

  it('generates correct rationale for SHOULD_APPLY tier', () => {
    const rationale = getTierRationale(PriorityTier.SHOULD_APPLY, 80, 0.5, 2.5, 3000)
    expect(rationale).toContain('SHOULD_APPLY')
    expect(rationale).toContain('80 match')
    expect(rationale).toContain('$3,000')
    expect(rationale).toContain('50%')
    expect(rationale).toContain('Strong match')
  })

  it('generates correct rationale for HIGH_VALUE_REACH tier', () => {
    const rationale = getTierRationale(PriorityTier.HIGH_VALUE_REACH, 55, 0.15, 1.8, 15000)
    expect(rationale).toContain('HIGH_VALUE_REACH')
    expect(rationale).toContain('55 match')
    expect(rationale).toContain('$15,000')
    expect(rationale).toContain('15%')
    expect(rationale).toContain('High-value')
  })

  it('generates correct rationale for IF_TIME_PERMITS tier', () => {
    const rationale = getTierRationale(PriorityTier.IF_TIME_PERMITS, 65, 0.3, 2.0, 2000)
    expect(rationale).toContain('IF_TIME_PERMITS')
    expect(rationale).toContain('65 match')
    expect(rationale).toContain('$2,000')
    expect(rationale).toContain('30%')
    expect(rationale).toContain('Decent match')
  })

  it('formats currency correctly with commas for large amounts', () => {
    const rationale = getTierRationale(PriorityTier.HIGH_VALUE_REACH, 55, 0.15, 1.8, 50000)
    expect(rationale).toContain('$50,000')
  })

  it('rounds match score to nearest integer', () => {
    const rationale = getTierRationale(PriorityTier.MUST_APPLY, 94.7, 0.72, 5.0, 5000)
    expect(rationale).toContain('95 match')
  })

  it('rounds probability to nearest percentage', () => {
    const rationale = getTierRationale(PriorityTier.MUST_APPLY, 94, 0.728, 5.0, 5000)
    expect(rationale).toContain('73%')
  })

  it('formats strategic value with one decimal place', () => {
    const rationale = getTierRationale(PriorityTier.MUST_APPLY, 94, 0.72, 5.23, 5000)
    expect(rationale).toContain('5.2')
  })
})
