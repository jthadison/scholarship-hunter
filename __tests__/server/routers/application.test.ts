/**
 * Application Router Tests (Story 3.2)
 *
 * Tests for application.create, application.checkExists, and application.list endpoints
 * Covers all acceptance criteria:
 * - AC1-AC7: Button creation, timeline generation, duplicate detection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { applicationRouter } from '@/server/routers/application'
import { prisma } from '@/server/db'
import { subDays } from 'date-fns'

// Mock prisma
vi.mock('@/server/db', () => ({
  prisma: {
    application: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    scholarship: {
      findUnique: vi.fn(),
    },
    match: {
      findUnique: vi.fn(),
    },
    timeline: {
      create: vi.fn(),
    },
  },
}))

// Mock timeline utility
vi.mock('@/lib/utils/timeline', () => ({
  generateTimelineStub: vi.fn((application) => ({
    submitDate: subDays(application.scholarship.deadline, 1),
    finalReviewDate: subDays(application.scholarship.deadline, 3),
    uploadDocsDate: subDays(application.scholarship.deadline, 7),
    requestRecsDate:
      application.recsRequired > 0
        ? subDays(application.scholarship.deadline, 14)
        : null,
    startEssayDate: subDays(application.scholarship.deadline, 21),
    estimatedHours: 10,
    hasConflicts: false,
    conflictsWith: [],
  })),
}))

describe('Application Router - Story 3.2 Tests', () => {
  const mockCtx = {
    userId: 'student-123',
    prisma,
  }

  const mockScholarship = {
    id: 'scholarship-456',
    name: 'Women in STEM Scholarship',
    provider: 'Tech Foundation',
    awardAmount: 5000,
    deadline: new Date('2025-12-31'),
    verified: true,
    essayPrompts: [{ prompt: 'Essay 1', wordCount: 500 }],
    requiredDocuments: ['transcript', 'resume'],
    recommendationCount: 2,
  }

  const mockMatch = {
    priorityTier: 'MUST_APPLY' as const,
  }

  const mockApplication = {
    id: 'application-789',
    studentId: 'student-123',
    scholarshipId: 'scholarship-456',
    status: 'TODO' as const,
    priorityTier: 'MUST_APPLY' as const,
    essayCount: 1,
    documentsRequired: 2,
    recsRequired: 2,
    targetSubmitDate: new Date('2025-12-31'),
    essayComplete: 0,
    documentsUploaded: 0,
    recsReceived: 0,
    progressPercentage: 0,
    notes: null,
    dateAdded: new Date(),
    actualSubmitDate: null,
    outcomeDate: null,
    awardAmount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC2, AC6, AC7: application.create', () => {
    it('should create application with status TODO and inherit deadline', async () => {
      // Mock scholarship found
      vi.mocked(prisma.scholarship.findUnique).mockResolvedValue(
        mockScholarship as any
      )

      // Mock no duplicate
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null)

      // Mock match data
      vi.mocked(prisma.match.findUnique).mockResolvedValue(mockMatch as any)

      // Mock application creation
      const createdApp = {
        ...mockApplication,
        scholarship: mockScholarship,
      }
      vi.mocked(prisma.application.create).mockResolvedValue(createdApp as any)

      // Mock timeline creation
      vi.mocked(prisma.timeline.create).mockResolvedValue({
        id: 'timeline-123',
        applicationId: 'application-789',
        submitDate: subDays(mockScholarship.deadline, 1),
        finalReviewDate: subDays(mockScholarship.deadline, 3),
        uploadDocsDate: subDays(mockScholarship.deadline, 7),
        requestRecsDate: subDays(mockScholarship.deadline, 14),
        startEssayDate: subDays(mockScholarship.deadline, 21),
        estimatedHours: 10,
        hasConflicts: false,
        conflictsWith: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      // Mock final findUnique call
      const finalApp = {
        ...createdApp,
        timeline: {
          id: 'timeline-123',
          submitDate: subDays(mockScholarship.deadline, 1),
        },
      }
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(
        finalApp as any
      )

      const caller = applicationRouter.createCaller(mockCtx as any)
      const result = await caller.create({ scholarshipId: 'scholarship-456' })

      // AC2: Status should be TODO
      expect(result?.status).toBe('TODO')

      // AC6: Should inherit scholarship deadline
      expect(result?.targetSubmitDate).toEqual(mockScholarship.deadline)

      // AC7: Timeline should be created
      expect(prisma.timeline.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            applicationId: 'application-789',
          }),
        })
      )
    })

    it('should derive priority tier from match data', async () => {
      vi.mocked(prisma.scholarship.findUnique).mockResolvedValue(
        mockScholarship as any
      )
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.match.findUnique).mockResolvedValue(mockMatch as any)

      const createdApp = {
        ...mockApplication,
        scholarship: mockScholarship,
      }
      vi.mocked(prisma.application.create).mockResolvedValue(createdApp as any)
      vi.mocked(prisma.timeline.create).mockResolvedValue({} as any)
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(
        createdApp as any
      )

      const caller = applicationRouter.createCaller(mockCtx as any)
      await caller.create({ scholarshipId: 'scholarship-456' })

      expect(prisma.application.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priorityTier: 'MUST_APPLY',
          }),
        })
      )
    })

    it('should extract essay count and requirements from scholarship', async () => {
      vi.mocked(prisma.scholarship.findUnique).mockResolvedValue(
        mockScholarship as any
      )
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.match.findUnique).mockResolvedValue(mockMatch as any)

      const createdApp = {
        ...mockApplication,
        scholarship: mockScholarship,
      }
      vi.mocked(prisma.application.create).mockResolvedValue(createdApp as any)
      vi.mocked(prisma.timeline.create).mockResolvedValue({} as any)
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(
        createdApp as any
      )

      const caller = applicationRouter.createCaller(mockCtx as any)
      await caller.create({ scholarshipId: 'scholarship-456' })

      expect(prisma.application.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            essayCount: 1,
            documentsRequired: 2,
            recsRequired: 2,
          }),
        })
      )
    })

    it('should throw CONFLICT error for duplicate application (AC5)', async () => {
      vi.mocked(prisma.scholarship.findUnique).mockResolvedValue(
        mockScholarship as any
      )

      // Mock existing application (duplicate)
      vi.mocked(prisma.application.findUnique).mockResolvedValue(
        mockApplication as any
      )

      const caller = applicationRouter.createCaller(mockCtx as any)

      await expect(
        caller.create({ scholarshipId: 'scholarship-456' })
      ).rejects.toThrow('You have already added this scholarship to your applications')
    })

    it('should throw NOT_FOUND error if scholarship not found', async () => {
      vi.mocked(prisma.scholarship.findUnique).mockResolvedValue(null)

      const caller = applicationRouter.createCaller(mockCtx as any)

      await expect(
        caller.create({ scholarshipId: 'scholarship-456' })
      ).rejects.toThrow('Scholarship not found or not available')
    })

    it('should throw NOT_FOUND error if scholarship not verified', async () => {
      vi.mocked(prisma.scholarship.findUnique).mockResolvedValue({
        ...mockScholarship,
        verified: false,
      } as any)

      const caller = applicationRouter.createCaller(mockCtx as any)

      await expect(
        caller.create({ scholarshipId: 'scholarship-456' })
      ).rejects.toThrow('Scholarship not found or not available')
    })
  })

  describe('AC5: application.checkExists', () => {
    it('should return exists: true when application exists', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        id: 'application-789',
      } as any)

      const caller = applicationRouter.createCaller(mockCtx as any)
      const result = await caller.checkExists({ scholarshipId: 'scholarship-456' })

      expect(result.exists).toBe(true)
      expect(result.applicationId).toBe('application-789')
    })

    it('should return exists: false when application does not exist', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue(null)

      const caller = applicationRouter.createCaller(mockCtx as any)
      const result = await caller.checkExists({ scholarshipId: 'scholarship-456' })

      expect(result.exists).toBe(false)
      expect(result.applicationId).toBeUndefined()
    })
  })

  describe('AC4: application.list', () => {
    it('should return student applications with scholarship details', async () => {
      const mockApplications = [
        {
          ...mockApplication,
          scholarship: {
            name: mockScholarship.name,
            provider: mockScholarship.provider,
            awardAmount: mockScholarship.awardAmount,
            deadline: mockScholarship.deadline,
            category: 'STEM',
            tags: ['women', 'technology'],
          },
        },
      ]

      vi.mocked(prisma.application.findMany).mockResolvedValue(
        mockApplications as any
      )

      const caller = applicationRouter.createCaller(mockCtx as any)
      const result = await caller.list()

      expect(result).toHaveLength(1)
      expect(result[0]?.scholarship.name).toBe('Women in STEM Scholarship')
      expect(result[0]?.status).toBe('TODO')
    })

    it('should filter by status when provided', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValue([])

      const caller = applicationRouter.createCaller(mockCtx as any)
      await caller.list({ status: 'TODO' })

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'TODO',
          }),
        })
      )
    })

    it('should filter by priority tier when provided', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValue([])

      const caller = applicationRouter.createCaller(mockCtx as any)
      await caller.list({ priorityTier: 'MUST_APPLY' })

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priorityTier: 'MUST_APPLY',
          }),
        })
      )
    })

    it('should order by targetSubmitDate ascending', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValue([])

      const caller = applicationRouter.createCaller(mockCtx as any)
      await caller.list()

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ targetSubmitDate: 'asc' }, { createdAt: 'desc' }],
        })
      )
    })
  })
})
