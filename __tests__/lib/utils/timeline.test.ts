/**
 * Timeline Utility Tests (Story 3.2)
 *
 * Tests for timeline generation stub and utility functions
 * Covers AC7: Timeline generation with correct milestone dates
 */

import { describe, it, expect } from 'vitest'
import {
  generateTimelineStub,
  calculateDaysUntilDeadline,
  formatDaysUntilDeadline,
} from '@/lib/utils/timeline'
import { addDays, subDays } from 'date-fns'
import type { Application, Scholarship } from '@prisma/client'

describe('Timeline Utilities - Story 3.2 Tests', () => {
  describe('AC7: generateTimelineStub', () => {
    it('should generate timeline with correct milestone dates', () => {
      const deadline = new Date('2025-12-31')

      const mockApplication: Application & { scholarship: Scholarship } = {
        id: 'app-123',
        studentId: 'student-123',
        scholarshipId: 'scholarship-456',
        status: 'TODO',
        priorityTier: 'MUST_APPLY',
        essayCount: 2,
        documentsRequired: 3,
        recsRequired: 2,
        targetSubmitDate: deadline,
        essayComplete: 0,
        documentsUploaded: 0,
        recsReceived: 0,
        progressPercentage: 0,
        notes: null,
        dateAdded: new Date(),
        actualSubmitDate: null,
        outcomeDate: null,
        awardAmount: null,
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        scholarship: {
          id: 'scholarship-456',
          name: 'Test Scholarship',
          provider: 'Test Provider',
          description: 'Test description',
          website: 'https://test.com',
          contactEmail: 'test@test.com',
          awardAmount: 5000,
          awardAmountMax: null,
          numberOfAwards: 1,
          renewable: false,
          renewalYears: null,
          deadline,
          announcementDate: null,
          eligibilityCriteria: {},
          essayPrompts: [],
          requiredDocuments: [],
          recommendationCount: 2,
          applicantPoolSize: null,
          acceptanceRate: null,
          sourceUrl: null,
          lastVerified: new Date(),
          verified: true,
          tags: [],
          category: 'STEM',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const timeline = generateTimelineStub(mockApplication)

      // Verify milestone dates follow backward planning
      expect(timeline.submitDate).toEqual(subDays(deadline, 1))
      expect(timeline.finalReviewDate).toEqual(subDays(deadline, 3))
      expect(timeline.uploadDocsDate).toEqual(subDays(deadline, 7))
      expect(timeline.requestRecsDate).toEqual(subDays(deadline, 14))
      expect(timeline.startEssayDate).toEqual(subDays(deadline, 21))
    })

    it('should set requestRecsDate to null when no recommendations required', () => {
      const deadline = new Date('2025-12-31')

      const mockApplication: Application & { scholarship: Scholarship } = {
        id: 'app-123',
        studentId: 'student-123',
        scholarshipId: 'scholarship-456',
        status: 'TODO',
        priorityTier: 'MUST_APPLY',
        essayCount: 2,
        documentsRequired: 3,
        recsRequired: 0, // No recommendations
        targetSubmitDate: deadline,
        essayComplete: 0,
        documentsUploaded: 0,
        recsReceived: 0,
        progressPercentage: 0,
        notes: null,
        dateAdded: new Date(),
        actualSubmitDate: null,
        outcomeDate: null,
        awardAmount: null,
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        scholarship: {
          id: 'scholarship-456',
          name: 'Test Scholarship',
          provider: 'Test Provider',
          description: 'Test description',
          website: 'https://test.com',
          contactEmail: 'test@test.com',
          awardAmount: 5000,
          awardAmountMax: null,
          numberOfAwards: 1,
          renewable: false,
          renewalYears: null,
          deadline,
          announcementDate: null,
          eligibilityCriteria: {},
          essayPrompts: [],
          requiredDocuments: [],
          recommendationCount: 0,
          applicantPoolSize: null,
          acceptanceRate: null,
          sourceUrl: null,
          lastVerified: new Date(),
          verified: true,
          tags: [],
          category: 'STEM',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const timeline = generateTimelineStub(mockApplication)

      expect(timeline.requestRecsDate).toBeNull()
    })

    it('should set placeholder estimated hours for Sprint 1', () => {
      const deadline = new Date('2025-12-31')

      const mockApplication: Application & { scholarship: Scholarship } = {
        id: 'app-123',
        studentId: 'student-123',
        scholarshipId: 'scholarship-456',
        status: 'TODO',
        priorityTier: 'MUST_APPLY',
        essayCount: 2,
        documentsRequired: 3,
        recsRequired: 2,
        targetSubmitDate: deadline,
        essayComplete: 0,
        documentsUploaded: 0,
        recsReceived: 0,
        progressPercentage: 0,
        notes: null,
        dateAdded: new Date(),
        actualSubmitDate: null,
        outcomeDate: null,
        awardAmount: null,
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        scholarship: {
          id: 'scholarship-456',
          name: 'Test Scholarship',
          provider: 'Test Provider',
          description: 'Test description',
          website: 'https://test.com',
          contactEmail: 'test@test.com',
          awardAmount: 5000,
          awardAmountMax: null,
          numberOfAwards: 1,
          renewable: false,
          renewalYears: null,
          deadline,
          announcementDate: null,
          eligibilityCriteria: {},
          essayPrompts: [],
          requiredDocuments: [],
          recommendationCount: 2,
          applicantPoolSize: null,
          acceptanceRate: null,
          sourceUrl: null,
          lastVerified: new Date(),
          verified: true,
          tags: [],
          category: 'STEM',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const timeline = generateTimelineStub(mockApplication)

      // Sprint 1 uses fixed placeholder
      expect(timeline.estimatedHours).toBe(10)
      expect(timeline.hasConflicts).toBe(false)
      expect(timeline.conflictsWith).toEqual([])
    })
  })

  describe('AC3: calculateDaysUntilDeadline', () => {
    it('should calculate positive days for future deadline', () => {
      const deadline = addDays(new Date(), 45)
      const days = calculateDaysUntilDeadline(deadline)

      expect(days).toBe(45)
    })

    it('should calculate zero days for today deadline', () => {
      const deadline = new Date()
      const days = calculateDaysUntilDeadline(deadline)

      expect(days).toBe(0)
    })

    it('should calculate negative days for past deadline', () => {
      const deadline = subDays(new Date(), 5)
      const days = calculateDaysUntilDeadline(deadline)

      expect(days).toBe(-5)
    })
  })

  describe('AC3: formatDaysUntilDeadline', () => {
    it('should format "Today" for deadline today', () => {
      const deadline = new Date()
      const formatted = formatDaysUntilDeadline(deadline)

      expect(formatted).toBe('Today')
    })

    it('should format "1 day" for deadline tomorrow', () => {
      const deadline = addDays(new Date(), 1)
      const formatted = formatDaysUntilDeadline(deadline)

      expect(formatted).toBe('1 day')
    })

    it('should format "X days" for multiple days', () => {
      const deadline = addDays(new Date(), 45)
      const formatted = formatDaysUntilDeadline(deadline)

      expect(formatted).toBe('45 days')
    })

    it('should format "Overdue" for past deadline', () => {
      const deadline = subDays(new Date(), 5)
      const formatted = formatDaysUntilDeadline(deadline)

      expect(formatted).toBe('Overdue')
    })
  })
})
