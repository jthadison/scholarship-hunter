/**
 * Tests for Strategic Value ROI Calculation
 *
 * Story 2.6 - Task 11.2: Unit tests for ROI calculation
 * Tests different effort multipliers and ROI formula
 */

import { describe, it, expect } from 'vitest'
import {
  calculateStrategicValue,
  calculateStrategicValueWithMatchBoost,
} from '@/server/lib/matching/calculate-strategic-value'

describe('calculateStrategicValue', () => {
  describe('ROI formula calculation', () => {
    it('should calculate strategic value with LOW effort (1.0x multiplier)', () => {
      const result = calculateStrategicValue({
        matchScore: 88,
        successProbability: 72, // 72%
        awardAmount: 5000,
        effortLevel: 'LOW',
      })

      // Expected: (5000 * 0.72 * 1.0) / 1000 = 3.6
      expect(result.strategicValue).toBeCloseTo(3.6, 1)
      expect(result.expectedValue).toBeCloseTo(3600, 0)
      expect(result.effortAdjustedValue).toBeCloseTo(3600, 0)
    })

    it('should calculate strategic value with MEDIUM effort (0.7x multiplier)', () => {
      const result = calculateStrategicValue({
        matchScore: 85,
        successProbability: 60,
        awardAmount: 10000,
        effortLevel: 'MEDIUM',
      })

      // Expected: (10000 * 0.60 * 0.7) / 1000 = 4.2
      expect(result.strategicValue).toBeCloseTo(4.2, 1)
      expect(result.expectedValue).toBeCloseTo(6000, 0)
      expect(result.effortAdjustedValue).toBeCloseTo(4200, 0)
    })

    it('should calculate strategic value with HIGH effort (0.4x multiplier)', () => {
      const result = calculateStrategicValue({
        matchScore: 90,
        successProbability: 80,
        awardAmount: 8000,
        effortLevel: 'HIGH',
      })

      // Expected: (8000 * 0.80 * 0.4) / 1000 = 2.56
      expect(result.strategicValue).toBeCloseTo(2.56, 2)
      expect(result.expectedValue).toBeCloseTo(6400, 0)
      expect(result.effortAdjustedValue).toBeCloseTo(2560, 0)
    })
  })

  describe('Best Bet scenarios (strategicValue >= 5.0)', () => {
    it('should classify high award + high probability + low effort as BEST_BET', () => {
      const result = calculateStrategicValue({
        matchScore: 95,
        successProbability: 85,
        awardAmount: 10000,
        effortLevel: 'LOW',
      })

      // (10000 * 0.85 * 1.0) / 1000 = 8.5
      expect(result.strategicValue).toBeGreaterThanOrEqual(5.0)
      expect(result.strategicValue).toBeCloseTo(8.5, 1)
    })

    it('should reach BEST_BET threshold with moderate values', () => {
      const result = calculateStrategicValue({
        matchScore: 80,
        successProbability: 70,
        awardAmount: 7500,
        effortLevel: 'LOW',
      })

      // (7500 * 0.70 * 1.0) / 1000 = 5.25
      expect(result.strategicValue).toBeGreaterThanOrEqual(5.0)
      expect(result.strategicValue).toBeCloseTo(5.25, 2)
    })
  })

  describe('Edge cases', () => {
    it('should return 0 for $0 award amount', () => {
      const result = calculateStrategicValue({
        matchScore: 90,
        successProbability: 80,
        awardAmount: 0,
        effortLevel: 'LOW',
      })

      expect(result.strategicValue).toBe(0)
      expect(result.expectedValue).toBe(0)
    })

    it('should return 0 for 0% success probability', () => {
      const result = calculateStrategicValue({
        matchScore: 90,
        successProbability: 0,
        awardAmount: 5000,
        effortLevel: 'LOW',
      })

      expect(result.strategicValue).toBe(0)
      expect(result.expectedValue).toBe(0)
    })

    it('should return 0 for negative award amount', () => {
      const result = calculateStrategicValue({
        matchScore: 90,
        successProbability: 80,
        awardAmount: -1000,
        effortLevel: 'LOW',
      })

      expect(result.strategicValue).toBe(0)
    })

    it('should cap strategic value at 10 for extreme cases', () => {
      const result = calculateStrategicValue({
        matchScore: 100,
        successProbability: 100,
        awardAmount: 50000,
        effortLevel: 'LOW',
      })

      // (50000 * 1.0 * 1.0) / 1000 = 50 -> capped at 10
      expect(result.strategicValue).toBe(10)
    })
  })

  describe('Effort multiplier impact', () => {
    const baseParams = {
      matchScore: 85,
      successProbability: 70,
      awardAmount: 6000,
    }

    it('should show HIGH effort reduces strategic value by 60%', () => {
      const low = calculateStrategicValue({ ...baseParams, effortLevel: 'LOW' })
      const high = calculateStrategicValue({ ...baseParams, effortLevel: 'HIGH' })

      // HIGH multiplier is 0.4 (60% reduction from 1.0)
      expect(high.strategicValue).toBeCloseTo(low.strategicValue * 0.4, 2)
    })

    it('should show MEDIUM effort reduces strategic value by 30%', () => {
      const low = calculateStrategicValue({ ...baseParams, effortLevel: 'LOW' })
      const medium = calculateStrategicValue({ ...baseParams, effortLevel: 'MEDIUM' })

      // MEDIUM multiplier is 0.7 (30% reduction from 1.0)
      expect(medium.strategicValue).toBeCloseTo(low.strategicValue * 0.7, 2)
    })
  })

  describe('Probability impact', () => {
    it('should show strategic value scales linearly with probability', () => {
      const prob50 = calculateStrategicValue({
        matchScore: 80,
        successProbability: 50,
        awardAmount: 5000,
        effortLevel: 'LOW',
      })

      const prob100 = calculateStrategicValue({
        matchScore: 80,
        successProbability: 100,
        awardAmount: 5000,
        effortLevel: 'LOW',
      })

      expect(prob100.strategicValue).toBeCloseTo(prob50.strategicValue * 2, 1)
    })
  })

  describe('Award amount impact', () => {
    it('should show strategic value scales linearly with award amount', () => {
      const award5k = calculateStrategicValue({
        matchScore: 80,
        successProbability: 70,
        awardAmount: 5000,
        effortLevel: 'LOW',
      })

      const award10k = calculateStrategicValue({
        matchScore: 80,
        successProbability: 70,
        awardAmount: 10000,
        effortLevel: 'LOW',
      })

      expect(award10k.strategicValue).toBeCloseTo(award5k.strategicValue * 2, 1)
    })
  })
})

describe('calculateStrategicValueWithMatchBoost', () => {
  it('should apply 10% boost for perfect match score (100)', () => {
    const baseResult = calculateStrategicValue({
      matchScore: 100,
      successProbability: 70,
      awardAmount: 5000,
      effortLevel: 'LOW',
    })

    const boostedResult = calculateStrategicValueWithMatchBoost({
      matchScore: 100,
      successProbability: 70,
      awardAmount: 5000,
      effortLevel: 'LOW',
    })

    // 100 match score gives 10% boost (1.1x)
    expect(boostedResult.strategicValue).toBeCloseTo(baseResult.strategicValue * 1.1, 2)
  })

  it('should apply 5% boost for 50 match score', () => {
    const baseResult = calculateStrategicValue({
      matchScore: 50,
      successProbability: 70,
      awardAmount: 5000,
      effortLevel: 'LOW',
    })

    const boostedResult = calculateStrategicValueWithMatchBoost({
      matchScore: 50,
      successProbability: 70,
      awardAmount: 5000,
      effortLevel: 'LOW',
    })

    // 50 match score gives 5% boost (1.05x)
    expect(boostedResult.strategicValue).toBeCloseTo(baseResult.strategicValue * 1.05, 2)
  })

  it('should apply no boost for 0 match score', () => {
    const baseResult = calculateStrategicValue({
      matchScore: 0,
      successProbability: 70,
      awardAmount: 5000,
      effortLevel: 'LOW',
    })

    const boostedResult = calculateStrategicValueWithMatchBoost({
      matchScore: 0,
      successProbability: 70,
      awardAmount: 5000,
      effortLevel: 'LOW',
    })

    expect(boostedResult.strategicValue).toBeCloseTo(baseResult.strategicValue, 2)
  })

  it('should still cap boosted value at 10', () => {
    const boostedResult = calculateStrategicValueWithMatchBoost({
      matchScore: 100,
      successProbability: 100,
      awardAmount: 50000,
      effortLevel: 'LOW',
    })

    expect(boostedResult.strategicValue).toBe(10)
  })
})
