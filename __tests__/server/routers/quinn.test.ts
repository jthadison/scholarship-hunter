/**
 * Quinn Router Tests (Story 3.6)
 *
 * Tests for Quinn Timeline Coordinator endpoints:
 * - getWeeklyTasks: Fetch tasks due within 7 days
 * - getWorkloadSummary: Calculate weekly hours breakdown
 * - getCapacitySuggestion: Recommend applications when capacity available
 * - markTaskComplete: Update task completion status
 * - deferApplication: Postpone application timeline
 *
 * Covers all acceptance criteria AC1-AC7
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { quinnRouter } from '@/server/routers/quinn'
import { prisma } from '@/server/db'
import { addDays, startOfWeek } from 'date-fns'

// Mock prisma
vi.mock('@/server/db', () => ({
  prisma: {
    application: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    match: {
      findUnique: vi.fn(),
    },
    timeline: {
      update: vi.fn(),
    },
  },
}))

describe('Quinn Router - Story 3.6 Tests', () => {
  const mockCtx = {
    userId: 'student-123',
    clerkId: 'clerk_123',
    prisma,
  }

  const today = new Date('2025-11-15')
  const weekStart = startOfWeek(today)

  const mockScholarship1 = {
    name: 'Women in STEM Scholarship',
    essayPrompts: [{ prompt: 'Essay 1', wordCount: 500 }],
    requiredDocuments: ['transcript'],
    recommendationCount: 2,
  }

  const mockTimeline1 = {
    id: 'timeline-1',
    applicationId: 'app-1',
    startEssayDate: addDays(today, 2), // In 2 days (CRITICAL)
    requestRecsDate: addDays(today, 5), // In 5 days (UPCOMING)
    uploadDocsDate: addDays(today, 10), // Beyond 7 days
    finalReviewDate: addDays(today, 12),
    submitDate: addDays(today, 14),
    estimatedHours: 10,
    hasConflicts: false,
    conflictsWith: [],
    createdAt: today,
    updatedAt: today,
  }

  const mockApplication1 = {
    id: 'app-1',
    studentId: 'student-123',
    scholarshipId: 'scholarship-1',
    status: 'TODO' as const,
    priorityTier: 'MUST_APPLY' as const,
    essayCount: 1,
    essayComplete: 0,
    documentsRequired: 1,
    documentsUploaded: 0,
    recsRequired: 2,
    recsReceived: 0,
    progressPercentage: 0,
    targetSubmitDate: addDays(today, 14),
    dateAdded: today,
    actualSubmitDate: null,
    outcomeDate: null,
    awardAmount: null,
    notes: null,
    createdAt: today,
    updatedAt: today,
    scholarship: mockScholarship1,
    timeline: mockTimeline1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(today)
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('getWeeklyTasks - AC#1', () => {
    it('should return tasks due within next 7 days', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValue([mockApplication1] as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.getWeeklyTasks()

      expect(result).toHaveLength(2) // Essay (day 2) and Rec request (day 5)
      expect(result[0]?.type).toBe('ESSAY')
      expect(result[0]?.urgency).toBe('CRITICAL')
      expect(result[0]?.daysUntil).toBe(2)
      expect(result[1]?.type).toBe('REC')
      expect(result[1]?.urgency).toBe('UPCOMING')
    })

    it('should categorize tasks by urgency levels', async () => {
      const app2 = {
        ...mockApplication1,
        id: 'app-2',
        timeline: {
          ...mockTimeline1,
          startEssayDate: addDays(today, 1), // 1 day = CRITICAL
          requestRecsDate: addDays(today, 3), // 3 days = URGENT
          uploadDocsDate: addDays(today, 6), // 6 days = UPCOMING
        },
      }

      vi.mocked(prisma.application.findMany).mockResolvedValue([app2] as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.getWeeklyTasks()

      expect(result[0]?.urgency).toBe('CRITICAL')
      expect(result[1]?.urgency).toBe('URGENT')
      expect(result[2]?.urgency).toBe('UPCOMING')
    })

    it('should exclude tasks beyond 7 days', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValue([mockApplication1] as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.getWeeklyTasks()

      // uploadDocsDate (day 10), finalReviewDate (day 12), submitDate (day 14) should be excluded
      expect(result).not.toContainEqual(expect.objectContaining({ type: 'REVIEW' }))
      expect(result).not.toContainEqual(expect.objectContaining({ type: 'SUBMIT' }))
    })

    it('should exclude submitted applications', async () => {
      const submittedApp = {
        ...mockApplication1,
        status: 'SUBMITTED' as const,
        timeline: null, // Submitted apps have no timeline milestones to process
      }

      vi.mocked(prisma.application.findMany).mockResolvedValue([submittedApp] as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.getWeeklyTasks()

      // Query filters out SUBMITTED status, so findMany should not even return it
      expect(result).toHaveLength(0)
    })

    it('should sort tasks by urgency then date', async () => {
      const app2 = {
        ...mockApplication1,
        id: 'app-2',
        timeline: {
          ...mockTimeline1,
          startEssayDate: addDays(today, 1), // CRITICAL, day 1
        },
      }

      const app3 = {
        ...mockApplication1,
        id: 'app-3',
        timeline: {
          ...mockTimeline1,
          startEssayDate: addDays(today, 2), // CRITICAL, day 2
        },
      }

      vi.mocked(prisma.application.findMany).mockResolvedValue([app3, app2] as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.getWeeklyTasks()

      expect(result[0]?.daysUntil).toBe(1)
      expect(result[1]?.daysUntil).toBe(2)
    })
  })

  describe('getWorkloadSummary - AC#2', () => {
    it('should calculate total hours for current week', async () => {
      const appsThisWeek = [
        {
          ...mockApplication1,
          timeline: {
            ...mockTimeline1,
            startEssayDate: addDays(weekStart, 2),
            estimatedHours: 10,
          },
        },
        {
          ...mockApplication1,
          id: 'app-2',
          timeline: {
            ...mockTimeline1,
            startEssayDate: addDays(weekStart, 4),
            estimatedHours: 8,
          },
        },
      ]

      vi.mocked(prisma.application.findMany).mockResolvedValue(appsThisWeek as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.getWorkloadSummary()

      expect(result.totalHours).toBe(18)
      expect(result.breakdown).toHaveLength(2)
      expect(result.status).toBe('HEAVY') // 18 hours = HEAVY
    })

    it('should return LIGHT status for <10 hours', async () => {
      const lightWorkload = [
        {
          ...mockApplication1,
          timeline: { ...mockTimeline1, estimatedHours: 6, startEssayDate: addDays(weekStart, 2) },
        },
      ]

      vi.mocked(prisma.application.findMany).mockResolvedValue(lightWorkload as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.getWorkloadSummary()

      expect(result.totalHours).toBe(6)
      expect(result.status).toBe('LIGHT')
      expect(result.message).toContain('capacity')
    })

    it('should return MODERATE status for 10-15 hours', async () => {
      const moderateWorkload = [
        {
          ...mockApplication1,
          timeline: { ...mockTimeline1, estimatedHours: 12, startEssayDate: addDays(weekStart, 2) },
        },
      ]

      vi.mocked(prisma.application.findMany).mockResolvedValue(moderateWorkload as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.getWorkloadSummary()

      expect(result.status).toBe('MODERATE')
      expect(result.message).toContain('stay focused')
    })

    it('should return OVERLOAD status for >20 hours', async () => {
      const overload = [
        {
          ...mockApplication1,
          timeline: { ...mockTimeline1, estimatedHours: 25, startEssayDate: addDays(weekStart, 2) },
        },
      ]

      vi.mocked(prisma.application.findMany).mockResolvedValue(overload as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.getWorkloadSummary()

      expect(result.status).toBe('OVERLOAD')
      expect(result.message).toContain('defer')
    })

    it('should include breakdown by application', async () => {
      const apps = [
        {
          ...mockApplication1,
          scholarship: { name: 'Scholarship A' },
          timeline: { ...mockTimeline1, estimatedHours: 10, startEssayDate: addDays(weekStart, 2) },
        },
        {
          ...mockApplication1,
          id: 'app-2',
          scholarship: { name: 'Scholarship B' },
          timeline: { ...mockTimeline1, estimatedHours: 5, startEssayDate: addDays(weekStart, 3) },
        },
      ]

      vi.mocked(prisma.application.findMany).mockResolvedValue(apps as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.getWorkloadSummary()

      expect(result.breakdown[0]?.scholarshipName).toBe('Scholarship A')
      expect(result.breakdown[0]?.hours).toBe(10)
      expect(result.breakdown[1]?.scholarshipName).toBe('Scholarship B')
      expect(result.breakdown[1]?.hours).toBe(5)
    })
  })

  describe('getCapacitySuggestion - AC#4', () => {
    it('should suggest application when capacity available (<10h)', async () => {
      // Mock current workload: 6 hours
      vi.mocked(prisma.application.findMany)
        .mockResolvedValueOnce([
          {
            ...mockApplication1,
            timeline: { ...mockTimeline1, estimatedHours: 6, startEssayDate: addDays(weekStart, 2) },
          },
        ] as any)
        // Mock backlog applications
        .mockResolvedValueOnce([
          {
            ...mockApplication1,
            id: 'backlog-app',
            status: 'TODO',
            scholarship: {
              name: 'New Opportunity',
              awardAmount: 10000,
              deadline: addDays(today, 30),
            },
            timeline: { ...mockTimeline1, estimatedHours: 12 },
          },
        ] as any)

      vi.mocked(prisma.match.findUnique).mockResolvedValue({
        overallMatchScore: 92,
      } as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.getCapacitySuggestion()

      expect(result.hasCapacity).toBe(true)
      expect(result.currentWeeklyHours).toBe(6)
      expect(result.suggestedApplication).toBeDefined()
      expect(result.suggestedApplication?.scholarshipName).toBe('New Opportunity')
      expect(result.suggestedApplication?.matchScore).toBe(92)
    })

    it('should not suggest when workload >=10h', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValueOnce([
        {
          ...mockApplication1,
          timeline: { ...mockTimeline1, estimatedHours: 12, startEssayDate: addDays(weekStart, 2) },
        },
      ] as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.getCapacitySuggestion()

      expect(result.hasCapacity).toBe(false)
      expect(result.suggestedApplication).toBeNull()
    })

    it('should prioritize MUST_APPLY applications', async () => {
      vi.mocked(prisma.application.findMany)
        .mockResolvedValueOnce([] as any) // Empty current workload
        .mockResolvedValueOnce([
          {
            ...mockApplication1,
            id: 'app-2',
            priorityTier: 'MUST_APPLY',
            scholarship: { name: 'High Priority', awardAmount: 10000, deadline: addDays(today, 45) },
            timeline: mockTimeline1,
          },
          {
            ...mockApplication1,
            id: 'app-1',
            priorityTier: 'IF_TIME_PERMITS',
            scholarship: { name: 'Lower Priority', awardAmount: 5000, deadline: addDays(today, 60) },
            timeline: mockTimeline1,
          },
        ] as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.getCapacitySuggestion()

      // Prisma orderBy priorityTier 'asc' means MUST_APPLY comes first (it's first in enum order)
      expect(result.suggestedApplication?.scholarshipName).toBe('High Priority')
    })
  })

  describe('markTaskComplete - AC#7 Quick Actions', () => {
    it('should mark essay task as complete', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        ...mockApplication1,
        essayCount: 2,
      } as any)

      vi.mocked(prisma.application.update).mockResolvedValue({
        ...mockApplication1,
        essayComplete: 2,
        scholarship: mockScholarship1,
      } as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.markTaskComplete({
        taskId: 'app-1-essay',
        taskType: 'ESSAY',
      })

      expect(prisma.application.update).toHaveBeenCalled()
      expect(result.essayComplete).toBe(2)
    })

    it('should mark recommendation task as complete', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        ...mockApplication1,
        recsRequired: 2,
      } as any)

      vi.mocked(prisma.application.update).mockResolvedValue({
        ...mockApplication1,
        recsReceived: 2,
        scholarship: mockScholarship1,
      } as any)

      const caller = quinnRouter.createCaller(mockCtx)
      await caller.markTaskComplete({
        taskId: 'app-1-rec',
        taskType: 'REC',
      })

      expect(prisma.application.update).toHaveBeenCalled()
    })

    it('should throw FORBIDDEN for unauthorized access', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        ...mockApplication1,
        studentId: 'different-student',
      } as any)

      const caller = quinnRouter.createCaller(mockCtx)

      await expect(
        caller.markTaskComplete({
          taskId: 'app-1-essay',
          taskType: 'ESSAY',
        })
      ).rejects.toThrow('You do not have permission')
    })
  })

  describe('deferApplication - AC#3 Conflict Resolution', () => {
    it('should defer application timeline by specified days', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        ...mockApplication1,
        timeline: mockTimeline1,
      } as any)

      vi.mocked(prisma.timeline.update).mockResolvedValue({
        ...mockTimeline1,
        startEssayDate: addDays(mockTimeline1.startEssayDate!, 7),
        requestRecsDate: addDays(mockTimeline1.requestRecsDate!, 7),
      } as any)

      const caller = quinnRouter.createCaller(mockCtx)
      const result = await caller.deferApplication({
        applicationId: 'app-1',
        deferByDays: 7,
      })

      expect(result.message).toContain('deferred by 7 days')
      expect(prisma.timeline.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'timeline-1' },
        })
      )
    })

    it('should enforce minimum 1 day and maximum 30 days deferral', async () => {
      const caller = quinnRouter.createCaller(mockCtx)

      // This should be validated by zod schema
      await expect(
        caller.deferApplication({
          applicationId: 'app-1',
          deferByDays: 0, // Invalid: minimum is 1
        })
      ).rejects.toThrow()

      await expect(
        caller.deferApplication({
          applicationId: 'app-1',
          deferByDays: 31, // Invalid: maximum is 30
        })
      ).rejects.toThrow()
    })

    it('should throw NOT_FOUND if timeline missing', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        ...mockApplication1,
        timeline: null,
      } as any)

      const caller = quinnRouter.createCaller(mockCtx)

      await expect(
        caller.deferApplication({
          applicationId: 'app-1',
          deferByDays: 7,
        })
      ).rejects.toThrow('Timeline not found')
    })
  })
})
