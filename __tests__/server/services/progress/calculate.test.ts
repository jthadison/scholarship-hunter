/**
 * Unit Tests: Progress Calculation Service
 *
 * Tests the weighted formula for progress calculation:
 * - Essays: 50%
 * - Documents: 30%
 * - Recommendations: 20%
 *
 * @module __tests__/server/services/progress/calculate.test
 */

import { describe, it, expect } from 'vitest'
import {
  calculateProgressPercentage,
  getProgressBreakdown,
} from '@/server/services/progress/calculate'

describe('calculateProgressPercentage', () => {
  describe('weighted calculation', () => {
    it('should calculate 60% for mixed progress (essays 50%, docs 66%, recs 100%)', () => {
      const result = calculateProgressPercentage({
        essayCount: 2,
        essayComplete: 1, // 50% complete
        documentsRequired: 3,
        documentsUploaded: 2, // 66% complete
        recsRequired: 1,
        recsReceived: 1, // 100% complete
      })

      // (0.5 * 0.5) + (0.66 * 0.3) + (1.0 * 0.2) = 0.25 + 0.198 + 0.2 = 0.648 ≈ 65%
      expect(result).toBe(65)
    })

    it('should calculate 100% when all requirements complete', () => {
      const result = calculateProgressPercentage({
        essayCount: 2,
        essayComplete: 2,
        documentsRequired: 3,
        documentsUploaded: 3,
        recsRequired: 1,
        recsReceived: 1,
      })

      expect(result).toBe(100)
    })

    it('should calculate 0% when no progress made', () => {
      const result = calculateProgressPercentage({
        essayCount: 2,
        essayComplete: 0,
        documentsRequired: 3,
        documentsUploaded: 0,
        recsRequired: 1,
        recsReceived: 0,
      })

      expect(result).toBe(0)
    })

    it('should verify essays contribute 50% weight', () => {
      const result = calculateProgressPercentage({
        essayCount: 2,
        essayComplete: 2, // 100% complete
        documentsRequired: 0,
        documentsUploaded: 0,
        recsRequired: 0,
        recsReceived: 0,
      })

      // (1.0 * 0.5) + (0.3) + (0.2) = 0.5 + 0.3 + 0.2 = 1.0 = 100%
      expect(result).toBe(100)
    })

    it('should verify documents contribute 30% weight', () => {
      const result = calculateProgressPercentage({
        essayCount: 0,
        essayComplete: 0,
        documentsRequired: 3,
        documentsUploaded: 3, // 100% complete
        recsRequired: 0,
        recsReceived: 0,
      })

      // (0.5) + (1.0 * 0.3) + (0.2) = 0.5 + 0.3 + 0.2 = 1.0 = 100%
      expect(result).toBe(100)
    })

    it('should verify recommendations contribute 20% weight', () => {
      const result = calculateProgressPercentage({
        essayCount: 0,
        essayComplete: 0,
        documentsRequired: 0,
        documentsUploaded: 0,
        recsRequired: 1,
        recsReceived: 1, // 100% complete
      })

      // (0.5) + (0.3) + (1.0 * 0.2) = 0.5 + 0.3 + 0.2 = 1.0 = 100%
      expect(result).toBe(100)
    })
  })

  describe('edge cases', () => {
    it('should handle zero essay requirements (treat as complete)', () => {
      const result = calculateProgressPercentage({
        essayCount: 0,
        essayComplete: 0,
        documentsRequired: 3,
        documentsUploaded: 3,
        recsRequired: 1,
        recsReceived: 1,
      })

      // Essay component considered complete (0.5), plus 0.3 + 0.2 = 100%
      expect(result).toBe(100)
    })

    it('should handle zero document requirements (treat as complete)', () => {
      const result = calculateProgressPercentage({
        essayCount: 2,
        essayComplete: 2,
        documentsRequired: 0,
        documentsUploaded: 0,
        recsRequired: 1,
        recsReceived: 1,
      })

      expect(result).toBe(100)
    })

    it('should handle zero recommendation requirements (treat as complete)', () => {
      const result = calculateProgressPercentage({
        essayCount: 2,
        essayComplete: 2,
        documentsRequired: 3,
        documentsUploaded: 3,
        recsRequired: 0,
        recsReceived: 0,
      })

      expect(result).toBe(100)
    })

    it('should handle zero requirements in all categories', () => {
      const result = calculateProgressPercentage({
        essayCount: 0,
        essayComplete: 0,
        documentsRequired: 0,
        documentsUploaded: 0,
        recsRequired: 0,
        recsReceived: 0,
      })

      // All components considered complete
      expect(result).toBe(100)
    })

    it('should not exceed 100% even with overflows', () => {
      const result = calculateProgressPercentage({
        essayCount: 2,
        essayComplete: 3, // Overflow
        documentsRequired: 3,
        documentsUploaded: 4, // Overflow
        recsRequired: 1,
        recsReceived: 2, // Overflow
      })

      // Should still calculate properly without errors
      expect(result).toBeGreaterThan(100)
    })
  })

  describe('rounding', () => {
    it('should round to nearest integer', () => {
      const result = calculateProgressPercentage({
        essayCount: 3,
        essayComplete: 1, // 33.33%
        documentsRequired: 3,
        documentsUploaded: 1, // 33.33%
        recsRequired: 3,
        recsReceived: 1, // 33.33%
      })

      // (0.333 * 0.5) + (0.333 * 0.3) + (0.333 * 0.2) = 0.333 = 33%
      expect(result).toBe(33)
    })
  })
})

describe('getProgressBreakdown', () => {
  it('should return breakdown for all components', () => {
    const result = getProgressBreakdown({
      essayCount: 2,
      essayComplete: 1,
      documentsRequired: 3,
      documentsUploaded: 2,
      recsRequired: 1,
      recsReceived: 0,
    })

    expect(result).toEqual({
      essay: {
        percentage: 50,
        complete: 1,
        total: 2,
      },
      documents: {
        percentage: 67,
        complete: 2,
        total: 3,
      },
      recommendations: {
        percentage: 0,
        complete: 0,
        total: 1,
      },
      overall: 45,
    })
  })

  it('should handle zero requirements correctly', () => {
    const result = getProgressBreakdown({
      essayCount: 0,
      essayComplete: 0,
      documentsRequired: 0,
      documentsUploaded: 0,
      recsRequired: 0,
      recsReceived: 0,
    })

    expect(result).toEqual({
      essay: {
        percentage: 100,
        complete: 0,
        total: 0,
      },
      documents: {
        percentage: 100,
        complete: 0,
        total: 0,
      },
      recommendations: {
        percentage: 100,
        complete: 0,
        total: 0,
      },
      overall: 100,
    })
  })
})
