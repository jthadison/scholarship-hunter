/**
 * Timeline Generation Service Tests (Story 3.5 - Task 10)
 *
 * Tests the core timeline generation algorithm including:
 * - Complexity calculation
 * - Estimated hours calculation
 * - Milestone date generation
 * - Edge cases (deadline too close, very complex applications)
 *
 * @see docs/stories/epic-3/story-3.5.md
 */

import { describe, it, expect } from 'vitest'
import { subDays, differenceInDays, addDays } from 'date-fns'
import {
  calculateComplexity,
  calculateEstimatedHours,
  generateOptimizedTimeline,
  validateDeadline,
  getDaysUntilDeadline,
  isDeadlineTooClose,
  extractTimelineInputFromScholarship,
  type TimelineGenerationInput,
} from './generate'

describe('Timeline Generation Service', () => {
  describe('calculateComplexity', () => {
    it('should calculate complexity for 0 essays and 0 recs', () => {
      expect(calculateComplexity(0, 0)).toBe(0)
    })

    it('should calculate complexity for 1 essay and 0 recs', () => {
      expect(calculateComplexity(1, 0)).toBe(1)
    })

    it('should calculate complexity for 2 essays and 1 rec', () => {
      // 2 + (1 * 2) = 4
      expect(calculateComplexity(2, 1)).toBe(4)
    })

    it('should calculate complexity for 3 essays and 2 recs', () => {
      // 3 + (2 * 2) = 7
      expect(calculateComplexity(3, 2)).toBe(7)
    })

    it('should calculate complexity for 5 essays and 3 recs', () => {
      // 5 + (3 * 2) = 11
      expect(calculateComplexity(5, 3)).toBe(11)
    })

    it('should weight recommendations 2x essays', () => {
      const complexity1 = calculateComplexity(2, 0) // 2 essays = 2
      const complexity2 = calculateComplexity(0, 1) // 1 rec = 2
      expect(complexity2).toBe(complexity1)
    })
  })

  describe('calculateEstimatedHours', () => {
    it('should calculate estimated hours for complexity 0', () => {
      expect(calculateEstimatedHours(0)).toBe(0)
    })

    it('should calculate estimated hours for complexity 1', () => {
      expect(calculateEstimatedHours(1)).toBe(2.5)
    })

    it('should calculate estimated hours for complexity 4', () => {
      expect(calculateEstimatedHours(4)).toBe(10)
    })

    it('should calculate estimated hours for complexity 7', () => {
      expect(calculateEstimatedHours(7)).toBe(17.5)
    })

    it('should use 2.5 hours per complexity point', () => {
      const complexity = 10
      expect(calculateEstimatedHours(complexity)).toBe(complexity * 2.5)
    })
  })

  describe('generateOptimizedTimeline', () => {
    const deadline = new Date('2025-12-15T23:59:59Z')

    it('should generate timeline with correct milestone dates for minimal complexity', () => {
      const input: TimelineGenerationInput = {
        deadline,
        essayCount: 1,
        recommendationCount: 0,
      }

      const timeline = generateOptimizedTimeline(input)

      // Complexity = 1, lead time = max(14, 1 * 3) = 14 days
      expect(timeline.startEssayDate).toEqual(subDays(deadline, 14))
      expect(timeline.requestRecsDate).toEqual(subDays(deadline, 14)) // max(14, 0 * 7) = 14
      expect(timeline.uploadDocsDate).toEqual(subDays(deadline, 7))
      expect(timeline.finalReviewDate).toEqual(subDays(deadline, 3))
      expect(timeline.submitDate).toEqual(subDays(deadline, 1))
      expect(timeline.estimatedHours).toBe(2.5) // 1 * 2.5
    })

    it('should generate timeline with correct milestone dates for moderate complexity', () => {
      const input: TimelineGenerationInput = {
        deadline,
        essayCount: 2,
        recommendationCount: 1,
      }

      const timeline = generateOptimizedTimeline(input)

      // Complexity = 2 + (1 * 2) = 4
      // Start essay: max(14, 4 * 3) = max(14, 12) = 14 days (minimum enforced)
      // Request recs: max(14, 1 * 7) = 14 days
      expect(timeline.startEssayDate).toEqual(subDays(deadline, 14))
      expect(timeline.requestRecsDate).toEqual(subDays(deadline, 14))
      expect(timeline.uploadDocsDate).toEqual(subDays(deadline, 7))
      expect(timeline.finalReviewDate).toEqual(subDays(deadline, 3))
      expect(timeline.submitDate).toEqual(subDays(deadline, 1))
      expect(timeline.estimatedHours).toBe(10) // 4 * 2.5
    })

    it('should generate timeline with correct milestone dates for high complexity', () => {
      const input: TimelineGenerationInput = {
        deadline,
        essayCount: 3,
        recommendationCount: 2,
      }

      const timeline = generateOptimizedTimeline(input)

      // Complexity = 3 + (2 * 2) = 7
      // Start essay: max(14, 7 * 3) = 21 days
      // Request recs: max(14, 2 * 7) = 14 days
      expect(timeline.startEssayDate).toEqual(subDays(deadline, 21))
      expect(timeline.requestRecsDate).toEqual(subDays(deadline, 14))
      expect(timeline.uploadDocsDate).toEqual(subDays(deadline, 7))
      expect(timeline.finalReviewDate).toEqual(subDays(deadline, 3))
      expect(timeline.submitDate).toEqual(subDays(deadline, 1))
      expect(timeline.estimatedHours).toBe(17.5) // 7 * 2.5
    })

    it('should generate timeline for very high complexity', () => {
      const input: TimelineGenerationInput = {
        deadline,
        essayCount: 6,
        recommendationCount: 3,
      }

      const timeline = generateOptimizedTimeline(input)

      // Complexity = 6 + (3 * 2) = 12
      // Start essay: max(14, 12 * 3) = 36 days
      // Request recs: max(14, 3 * 7) = 21 days
      expect(timeline.startEssayDate).toEqual(subDays(deadline, 36))
      expect(timeline.requestRecsDate).toEqual(subDays(deadline, 21))
      expect(timeline.estimatedHours).toBe(30) // 12 * 2.5
    })

    it('should enforce minimum 14-day lead time for start date', () => {
      const input: TimelineGenerationInput = {
        deadline,
        essayCount: 0,
        recommendationCount: 0,
      }

      const timeline = generateOptimizedTimeline(input)

      // Complexity = 0, but min lead time = 14
      expect(timeline.startEssayDate).toEqual(subDays(deadline, 14))
    })

    it('should enforce minimum 14-day lead time for rec requests', () => {
      const input: TimelineGenerationInput = {
        deadline,
        essayCount: 2,
        recommendationCount: 1,
      }

      const timeline = generateOptimizedTimeline(input)

      // 1 rec * 7 days = 7, but min = 14
      expect(timeline.requestRecsDate).toEqual(subDays(deadline, 14))
    })

    it('should initialize conflicts as false', () => {
      const input: TimelineGenerationInput = {
        deadline,
        essayCount: 2,
        recommendationCount: 1,
      }

      const timeline = generateOptimizedTimeline(input)

      expect(timeline.hasConflicts).toBe(false)
      expect(timeline.conflictsWith).toEqual([])
    })
  })

  describe('validateDeadline', () => {
    it('should not throw for future deadline', () => {
      const futureDate = addDays(new Date(), 30)
      expect(() => validateDeadline(futureDate)).not.toThrow()
    })

    it('should throw for past deadline', () => {
      const pastDate = subDays(new Date(), 1)
      expect(() => validateDeadline(pastDate)).toThrow('Deadline cannot be in the past')
    })

    it('should not throw for today\'s deadline', () => {
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today
      expect(() => validateDeadline(today)).not.toThrow()
    })
  })

  describe('getDaysUntilDeadline', () => {
    it('should return positive days for future deadline', () => {
      const futureDate = addDays(new Date(), 30)
      const days = getDaysUntilDeadline(futureDate)
      expect(days).toBeGreaterThanOrEqual(29)
      expect(days).toBeLessThanOrEqual(30)
    })

    it('should return negative days for past deadline', () => {
      const pastDate = subDays(new Date(), 5)
      const days = getDaysUntilDeadline(pastDate)
      expect(days).toBeLessThan(0)
      expect(Math.abs(days)).toBeGreaterThanOrEqual(4)
    })

    it('should return 0 for today\'s deadline', () => {
      const today = new Date()
      const days = getDaysUntilDeadline(today)
      expect(days).toBe(0)
    })
  })

  describe('isDeadlineTooClose', () => {
    it('should return true for deadline <7 days away', () => {
      const closeDeadline = addDays(new Date(), 5)
      expect(isDeadlineTooClose(closeDeadline)).toBe(true)
    })

    it('should return false for deadline >=7 days away', () => {
      const futureDeadline = addDays(new Date(), 10)
      expect(isDeadlineTooClose(futureDeadline)).toBe(false)
    })

    it('should return true for deadline 1 day away', () => {
      const tomorrow = addDays(new Date(), 1)
      expect(isDeadlineTooClose(tomorrow)).toBe(true)
    })

    it('should return false for deadline exactly 7 days away', () => {
      const weekAway = addDays(new Date(), 7)
      expect(isDeadlineTooClose(weekAway)).toBe(false)
    })
  })

  describe('extractTimelineInputFromScholarship', () => {
    it('should extract input from scholarship with essay prompts', () => {
      const scholarship = {
        deadline: new Date('2025-12-15'),
        essayPrompts: [
          { prompt: 'Essay 1', wordLimit: 500 },
          { prompt: 'Essay 2', wordLimit: 750 },
        ],
        recommendationCount: 2,
      }

      const input = extractTimelineInputFromScholarship(scholarship)

      expect(input.deadline).toEqual(scholarship.deadline)
      expect(input.essayCount).toBe(2)
      expect(input.recommendationCount).toBe(2)
    })

    it('should handle scholarship with no essay prompts', () => {
      const scholarship = {
        deadline: new Date('2025-12-15'),
        essayPrompts: null,
        recommendationCount: 1,
      }

      const input = extractTimelineInputFromScholarship(scholarship)

      expect(input.essayCount).toBe(0)
      expect(input.recommendationCount).toBe(1)
    })

    it('should handle scholarship with empty essay prompts array', () => {
      const scholarship = {
        deadline: new Date('2025-12-15'),
        essayPrompts: [],
        recommendationCount: 0,
      }

      const input = extractTimelineInputFromScholarship(scholarship)

      expect(input.essayCount).toBe(0)
      expect(input.recommendationCount).toBe(0)
    })

    it('should handle scholarship with non-array essayPrompts', () => {
      const scholarship = {
        deadline: new Date('2025-12-15'),
        essayPrompts: 'invalid', // Not an array
        recommendationCount: 2,
      }

      const input = extractTimelineInputFromScholarship(scholarship)

      expect(input.essayCount).toBe(0)
      expect(input.recommendationCount).toBe(2)
    })
  })

  describe('Performance (AC7: <100ms)', () => {
    it('should generate timeline in <100ms for typical application', () => {
      const input: TimelineGenerationInput = {
        deadline: addDays(new Date(), 60),
        essayCount: 3,
        recommendationCount: 2,
      }

      const start = performance.now()
      generateOptimizedTimeline(input)
      const end = performance.now()

      expect(end - start).toBeLessThan(100)
    })

    it('should generate timeline in <100ms for complex application', () => {
      const input: TimelineGenerationInput = {
        deadline: addDays(new Date(), 90),
        essayCount: 10,
        recommendationCount: 5,
      }

      const start = performance.now()
      generateOptimizedTimeline(input)
      const end = performance.now()

      expect(end - start).toBeLessThan(100)
    })
  })
})
