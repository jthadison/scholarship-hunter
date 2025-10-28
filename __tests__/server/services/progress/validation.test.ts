/**
 * Unit Tests: Progress Validation Service
 *
 * Tests completion gate validation logic for READY_FOR_REVIEW status.
 *
 * @module __tests__/server/services/progress/validation.test
 */

import { describe, it, expect } from 'vitest'
import {
  canMarkReadyForReview,
  getBlockingRequirements,
  isApplicationComplete,
} from '@/server/services/progress/validation'

describe('canMarkReadyForReview', () => {
  describe('complete applications', () => {
    it('should allow marking when all requirements complete', () => {
      const result = canMarkReadyForReview({
        essayCount: 2,
        essayComplete: 2,
        documentsRequired: 3,
        documentsUploaded: 3,
        recsRequired: 1,
        recsReceived: 1,
      })

      expect(result).toEqual({
        canMark: true,
        missingItems: [],
      })
    })

    it('should allow marking when no requirements exist', () => {
      const result = canMarkReadyForReview({
        essayCount: 0,
        essayComplete: 0,
        documentsRequired: 0,
        documentsUploaded: 0,
        recsRequired: 0,
        recsReceived: 0,
      })

      expect(result).toEqual({
        canMark: true,
        missingItems: [],
      })
    })
  })

  describe('incomplete applications', () => {
    it('should block when missing 1 essay', () => {
      const result = canMarkReadyForReview({
        essayCount: 2,
        essayComplete: 1,
        documentsRequired: 3,
        documentsUploaded: 3,
        recsRequired: 1,
        recsReceived: 1,
      })

      expect(result.canMark).toBe(false)
      expect(result.missingItems).toContain('1 essay incomplete')
    })

    it('should block when missing 2 essays (plural)', () => {
      const result = canMarkReadyForReview({
        essayCount: 3,
        essayComplete: 1,
        documentsRequired: 0,
        documentsUploaded: 0,
        recsRequired: 0,
        recsReceived: 0,
      })

      expect(result.canMark).toBe(false)
      expect(result.missingItems).toContain('2 essays incomplete')
    })

    it('should block when missing 1 document', () => {
      const result = canMarkReadyForReview({
        essayCount: 2,
        essayComplete: 2,
        documentsRequired: 3,
        documentsUploaded: 2,
        recsRequired: 1,
        recsReceived: 1,
      })

      expect(result.canMark).toBe(false)
      expect(result.missingItems).toContain('1 document missing')
    })

    it('should block when missing multiple documents (plural)', () => {
      const result = canMarkReadyForReview({
        essayCount: 0,
        essayComplete: 0,
        documentsRequired: 5,
        documentsUploaded: 2,
        recsRequired: 0,
        recsReceived: 0,
      })

      expect(result.canMark).toBe(false)
      expect(result.missingItems).toContain('3 documents missing')
    })

    it('should block when missing 1 recommendation', () => {
      const result = canMarkReadyForReview({
        essayCount: 2,
        essayComplete: 2,
        documentsRequired: 3,
        documentsUploaded: 3,
        recsRequired: 2,
        recsReceived: 1,
      })

      expect(result.canMark).toBe(false)
      expect(result.missingItems).toContain('1 recommendation pending')
    })

    it('should block when missing multiple recommendations (plural)', () => {
      const result = canMarkReadyForReview({
        essayCount: 0,
        essayComplete: 0,
        documentsRequired: 0,
        documentsUploaded: 0,
        recsRequired: 3,
        recsReceived: 0,
      })

      expect(result.canMark).toBe(false)
      expect(result.missingItems).toContain('3 recommendations pending')
    })

    it('should block when missing items across all categories', () => {
      const result = canMarkReadyForReview({
        essayCount: 2,
        essayComplete: 0,
        documentsRequired: 3,
        documentsUploaded: 1,
        recsRequired: 1,
        recsReceived: 0,
      })

      expect(result.canMark).toBe(false)
      expect(result.missingItems).toHaveLength(3)
      expect(result.missingItems).toContain('2 essays incomplete')
      expect(result.missingItems).toContain('2 documents missing')
      expect(result.missingItems).toContain('1 recommendation pending')
    })
  })

  describe('edge cases', () => {
    it('should handle all requirements at zero', () => {
      const result = canMarkReadyForReview({
        essayCount: 0,
        essayComplete: 0,
        documentsRequired: 0,
        documentsUploaded: 0,
        recsRequired: 0,
        recsReceived: 0,
      })

      expect(result.canMark).toBe(true)
      expect(result.missingItems).toHaveLength(0)
    })

    it('should handle partial completion correctly', () => {
      const result = canMarkReadyForReview({
        essayCount: 5,
        essayComplete: 3,
        documentsRequired: 10,
        documentsUploaded: 8,
        recsRequired: 3,
        recsReceived: 2,
      })

      expect(result.canMark).toBe(false)
      expect(result.missingItems).toContain('2 essays incomplete')
      expect(result.missingItems).toContain('2 documents missing')
      expect(result.missingItems).toContain('1 recommendation pending')
    })
  })
})

describe('getBlockingRequirements', () => {
  it('should return array of blocking requirement messages', () => {
    const result = getBlockingRequirements({
      essayCount: 2,
      essayComplete: 1,
      documentsRequired: 3,
      documentsUploaded: 2,
      recsRequired: 1,
      recsReceived: 0,
    })

    expect(result).toHaveLength(3)
    expect(result).toContain('1 essay incomplete')
    expect(result).toContain('1 document missing')
    expect(result).toContain('1 recommendation pending')
  })

  it('should return empty array when no blocking requirements', () => {
    const result = getBlockingRequirements({
      essayCount: 2,
      essayComplete: 2,
      documentsRequired: 3,
      documentsUploaded: 3,
      recsRequired: 1,
      recsReceived: 1,
    })

    expect(result).toHaveLength(0)
  })
})

describe('isApplicationComplete', () => {
  it('should return true when all requirements met', () => {
    const result = isApplicationComplete({
      essayCount: 2,
      essayComplete: 2,
      documentsRequired: 3,
      documentsUploaded: 3,
      recsRequired: 1,
      recsReceived: 1,
    })

    expect(result).toBe(true)
  })

  it('should return false when any requirement incomplete', () => {
    const result = isApplicationComplete({
      essayCount: 2,
      essayComplete: 1, // Missing 1
      documentsRequired: 3,
      documentsUploaded: 3,
      recsRequired: 1,
      recsReceived: 1,
    })

    expect(result).toBe(false)
  })

  it('should return true when zero requirements in all categories', () => {
    const result = isApplicationComplete({
      essayCount: 0,
      essayComplete: 0,
      documentsRequired: 0,
      documentsUploaded: 0,
      recsRequired: 0,
      recsReceived: 0,
    })

    expect(result).toBe(true)
  })
})
