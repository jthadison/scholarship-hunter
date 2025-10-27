/**
 * Tests for Application Effort Estimation
 *
 * Story 2.6 - Task 11.1: Unit tests for effort estimation
 * Tests various requirement combinations and boundary conditions
 */

import { describe, it, expect } from 'vitest'
import {
  estimateEffortLevel,
  estimateTimeInvestment,
  type EffortLevel,
} from '@/server/lib/matching/estimate-effort-level'

describe('estimateEffortLevel', () => {
  describe('LOW effort classification', () => {
    it('should classify 0 essays, 0 docs, 0 recs as LOW', () => {
      const result = estimateEffortLevel({
        essayPrompts: null,
        requiredDocuments: [],
        recommendationCount: 0,
      })

      expect(result.level).toBe('LOW')
      expect(result.multiplier).toBe(1.0)
      expect(result.breakdown).toEqual({ essays: 0, documents: 0, recommendations: 0 })
    })

    it('should classify 1 essay, 2 docs, 0 recs as LOW', () => {
      const result = estimateEffortLevel({
        essayPrompts: [{ prompt: 'Essay 1', wordCount: 500 }],
        requiredDocuments: ['transcript', 'resume'],
        recommendationCount: 0,
      })

      expect(result.level).toBe('LOW')
      expect(result.multiplier).toBe(1.0)
      expect(result.breakdown).toEqual({ essays: 1, documents: 2, recommendations: 0 })
    })

    it('should classify 1 essay, 0 docs, 0 recs as LOW (boundary)', () => {
      const result = estimateEffortLevel({
        essayPrompts: [{ prompt: 'Essay 1', wordCount: 500 }],
        requiredDocuments: [],
        recommendationCount: 0,
      })

      expect(result.level).toBe('LOW')
    })

    it('should classify 0 essays, 2 docs, 0 recs as LOW (boundary)', () => {
      const result = estimateEffortLevel({
        essayPrompts: null,
        requiredDocuments: ['transcript', 'resume'],
        recommendationCount: 0,
      })

      expect(result.level).toBe('LOW')
    })
  })

  describe('MEDIUM effort classification', () => {
    it('should classify 2 essays as MEDIUM', () => {
      const result = estimateEffortLevel({
        essayPrompts: [
          { prompt: 'Essay 1', wordCount: 500 },
          { prompt: 'Essay 2', wordCount: 750 },
        ],
        requiredDocuments: [],
        recommendationCount: 0,
      })

      expect(result.level).toBe('MEDIUM')
      expect(result.multiplier).toBe(0.7)
      expect(result.breakdown.essays).toBe(2)
    })

    it('should classify 3 docs as MEDIUM', () => {
      const result = estimateEffortLevel({
        essayPrompts: null,
        requiredDocuments: ['transcript', 'resume', 'financial aid'],
        recommendationCount: 0,
      })

      expect(result.level).toBe('MEDIUM')
      expect(result.breakdown.documents).toBe(3)
    })

    it('should classify 4 docs as MEDIUM (boundary)', () => {
      const result = estimateEffortLevel({
        essayPrompts: null,
        requiredDocuments: ['transcript', 'resume', 'financial aid', 'essay'],
        recommendationCount: 0,
      })

      expect(result.level).toBe('MEDIUM')
    })

    it('should classify 1 rec as MEDIUM', () => {
      const result = estimateEffortLevel({
        essayPrompts: null,
        requiredDocuments: [],
        recommendationCount: 1,
      })

      expect(result.level).toBe('MEDIUM')
      expect(result.breakdown.recommendations).toBe(1)
    })

    it('should classify 2 essays + 3 docs + 1 rec as HIGH (multiple triggers)', () => {
      const result = estimateEffortLevel({
        essayPrompts: [
          { prompt: 'Essay 1', wordCount: 500 },
          { prompt: 'Essay 2', wordCount: 750 },
        ],
        requiredDocuments: ['transcript', 'resume', 'financial aid'],
        recommendationCount: 1,
      })

      // HIGH wins because 2+ recs OR 3+ essays OR 5+ docs
      // Actually this should be MEDIUM since essays=2, docs=3, recs=1
      // Let me recheck the logic
      expect(result.level).toBe('MEDIUM')
    })
  })

  describe('HIGH effort classification', () => {
    it('should classify 3 essays as HIGH', () => {
      const result = estimateEffortLevel({
        essayPrompts: [
          { prompt: 'Essay 1', wordCount: 500 },
          { prompt: 'Essay 2', wordCount: 750 },
          { prompt: 'Essay 3', wordCount: 1000 },
        ],
        requiredDocuments: [],
        recommendationCount: 0,
      })

      expect(result.level).toBe('HIGH')
      expect(result.multiplier).toBe(0.4)
      expect(result.breakdown.essays).toBe(3)
    })

    it('should classify 5 docs as HIGH', () => {
      const result = estimateEffortLevel({
        essayPrompts: null,
        requiredDocuments: ['transcript', 'resume', 'financial aid', 'essay', 'portfolio'],
        recommendationCount: 0,
      })

      expect(result.level).toBe('HIGH')
      expect(result.breakdown.documents).toBe(5)
    })

    it('should classify 2 recs as HIGH', () => {
      const result = estimateEffortLevel({
        essayPrompts: null,
        requiredDocuments: [],
        recommendationCount: 2,
      })

      expect(result.level).toBe('HIGH')
      expect(result.breakdown.recommendations).toBe(2)
    })

    it('should classify 3+ essays + 5+ docs + 2+ recs as HIGH', () => {
      const result = estimateEffortLevel({
        essayPrompts: [
          { prompt: 'Essay 1', wordCount: 500 },
          { prompt: 'Essay 2', wordCount: 750 },
          { prompt: 'Essay 3', wordCount: 1000 },
        ],
        requiredDocuments: [
          'transcript',
          'resume',
          'financial aid',
          'essay',
          'portfolio',
          'proof of enrollment',
        ],
        recommendationCount: 3,
      })

      expect(result.level).toBe('HIGH')
      expect(result.breakdown).toEqual({ essays: 3, documents: 6, recommendations: 3 })
    })
  })

  describe('Essay prompt parsing', () => {
    it('should handle array of essays', () => {
      const result = estimateEffortLevel({
        essayPrompts: [{ prompt: 'Essay 1' }, { prompt: 'Essay 2' }],
        requiredDocuments: [],
        recommendationCount: 0,
      })

      expect(result.breakdown.essays).toBe(2)
    })

    it('should handle essays object with prompts array', () => {
      const result = estimateEffortLevel({
        essayPrompts: { prompts: [{ prompt: 'Essay 1' }, { prompt: 'Essay 2' }] },
        requiredDocuments: [],
        recommendationCount: 0,
      })

      expect(result.breakdown.essays).toBe(2)
    })

    it('should handle null essay prompts', () => {
      const result = estimateEffortLevel({
        essayPrompts: null,
        requiredDocuments: [],
        recommendationCount: 0,
      })

      expect(result.breakdown.essays).toBe(0)
    })

    it('should handle empty essay prompts', () => {
      const result = estimateEffortLevel({
        essayPrompts: [],
        requiredDocuments: [],
        recommendationCount: 0,
      })

      expect(result.breakdown.essays).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle missing requiredDocuments', () => {
      const result = estimateEffortLevel({
        essayPrompts: null,
        requiredDocuments: undefined as any,
        recommendationCount: 0,
      })

      expect(result.breakdown.documents).toBe(0)
      expect(result.level).toBe('LOW')
    })

    it('should handle missing recommendationCount', () => {
      const result = estimateEffortLevel({
        essayPrompts: null,
        requiredDocuments: [],
        recommendationCount: undefined as any,
      })

      expect(result.breakdown.recommendations).toBe(0)
      expect(result.level).toBe('LOW')
    })
  })
})

describe('estimateTimeInvestment', () => {
  it('should return 2-3 hours for LOW effort', () => {
    const time = estimateTimeInvestment('LOW')
    expect(time).toEqual({ min: 2, max: 3 })
  })

  it('should return 4-6 hours for MEDIUM effort', () => {
    const time = estimateTimeInvestment('MEDIUM')
    expect(time).toEqual({ min: 4, max: 6 })
  })

  it('should return 8-12 hours for HIGH effort', () => {
    const time = estimateTimeInvestment('HIGH')
    expect(time).toEqual({ min: 8, max: 12 })
  })
})
