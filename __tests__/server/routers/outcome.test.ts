/**
 * Outcome Router Tests (Story 5.1)
 *
 * Tests for outcome tracking endpoints:
 * - outcomes.create: Record new outcome
 * - outcomes.update: Edit existing outcome
 * - outcomes.getByStudent: Get outcomes with aggregate metrics
 * - outcomes.getHistory: Chronological outcome log
 *
 * Covers all acceptance criteria:
 * - AC1-AC4: Outcome recording with validation
 * - AC5: Dashboard summary metrics
 * - AC6: Historical outcome log
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { outcomeRouter } from '@/server/routers/outcome'
import { TRPCError } from '@trpc/server'
import { OutcomeResult, ApplicationStatus } from '@prisma/client'

// Mock prisma
const mockPrisma = {
  outcome: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  application: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
}

vi.mock('@/server/db', () => ({
  prisma: mockPrisma,
}))

describe('Outcome Router - Story 5.1 Tests', () => {
  const mockCtx = {
    userId: 'student-123',
    prisma: mockPrisma as any,
  }

  const mockApplication = {
    id: 'application-456',
    studentId: 'student-123',
    scholarshipId: 'scholarship-789',
    status: ApplicationStatus.SUBMITTED,
    scholarship: {
      id: 'scholarship-789',
      name: 'Test Scholarship',
      awardAmount: 5000,
    },
  }

  const mockOutcome = {
    id: 'outcome-101',
    studentId: 'student-123',
    applicationId: 'application-456',
    result: OutcomeResult.AWARDED,
    awardAmountReceived: 4500,
    decisionDate: new Date('2025-10-25'),
    notes: 'Congratulations!',
    feedback: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('outcomes.create', () => {
    const validInput = {
      applicationId: 'application-456',
      result: OutcomeResult.AWARDED,
      awardAmountReceived: 4500,
      decisionDate: new Date('2025-10-25'),
      notes: 'Congratulations!',
    }

    it('AC1, AC2, AC3, AC4: should create outcome with all fields', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(mockApplication)
      mockPrisma.outcome.findUnique.mockResolvedValue(null)
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          outcome: {
            create: vi.fn().mockResolvedValue({
              ...mockOutcome,
              application: mockApplication,
            }),
          },
          application: {
            update: vi.fn().mockResolvedValue(mockApplication),
          },
        })
      })

      const caller = outcomeRouter.createCaller(mockCtx)
      const result = await caller.create(validInput)

      expect(mockPrisma.application.findFirst).toHaveBeenCalledWith({
        where: {
          id: validInput.applicationId,
          studentId: mockCtx.userId,
        },
        include: {
          scholarship: {
            select: {
              id: true,
              name: true,
              awardAmount: true,
            },
          },
        },
      })

      expect(result).toBeDefined()
    })

    it('AC2: should require award amount when outcome is AWARDED', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(mockApplication)
      mockPrisma.outcome.findUnique.mockResolvedValue(null)

      const caller = outcomeRouter.createCaller(mockCtx)

      await expect(
        caller.create({
          ...validInput,
          awardAmountReceived: undefined,
        })
      ).rejects.toThrow('Award amount is required when outcome is AWARDED')
    })

    it('AC1: should allow DENIED outcome without award amount', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(mockApplication)
      mockPrisma.outcome.findUnique.mockResolvedValue(null)
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          outcome: {
            create: vi.fn().mockResolvedValue({
              ...mockOutcome,
              result: OutcomeResult.DENIED,
              awardAmountReceived: null,
              application: mockApplication,
            }),
          },
          application: {
            update: vi.fn().mockResolvedValue(mockApplication),
          },
        })
      })

      const caller = outcomeRouter.createCaller(mockCtx)
      const result = await caller.create({
        applicationId: 'application-456',
        result: OutcomeResult.DENIED,
        decisionDate: new Date('2025-10-25'),
      })

      expect(result).toBeDefined()
    })

    it('should update application status to AWARDED when outcome is AWARDED', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(mockApplication)
      mockPrisma.outcome.findUnique.mockResolvedValue(null)

      const mockOutcomeCreate = vi.fn().mockResolvedValue({
        ...mockOutcome,
        application: mockApplication,
      })
      const mockApplicationUpdate = vi.fn().mockResolvedValue(mockApplication)

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          outcome: { create: mockOutcomeCreate },
          application: { update: mockApplicationUpdate },
        })
      })

      const caller = outcomeRouter.createCaller(mockCtx)
      await caller.create(validInput)

      expect(mockApplicationUpdate).toHaveBeenCalledWith({
        where: { id: validInput.applicationId },
        data: {
          status: ApplicationStatus.AWARDED,
          outcomeDate: validInput.decisionDate,
          awardAmount: validInput.awardAmountReceived,
        },
      })
    })

    it('should update application status to DENIED when outcome is DENIED', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(mockApplication)
      mockPrisma.outcome.findUnique.mockResolvedValue(null)

      const mockApplicationUpdate = vi.fn().mockResolvedValue(mockApplication)

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          outcome: {
            create: vi.fn().mockResolvedValue({
              ...mockOutcome,
              result: OutcomeResult.DENIED,
              application: mockApplication,
            }),
          },
          application: { update: mockApplicationUpdate },
        })
      })

      const caller = outcomeRouter.createCaller(mockCtx)
      await caller.create({
        applicationId: 'application-456',
        result: OutcomeResult.DENIED,
        decisionDate: new Date('2025-10-25'),
      })

      expect(mockApplicationUpdate).toHaveBeenCalledWith({
        where: { id: 'application-456' },
        data: expect.objectContaining({
          status: ApplicationStatus.DENIED,
        }),
      })
    })

    it('should reject if application does not exist', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(null)

      const caller = outcomeRouter.createCaller(mockCtx)

      await expect(caller.create(validInput)).rejects.toThrow(
        'Application not found or does not belong to you'
      )
    })

    it('should reject if outcome already exists for application', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(mockApplication)
      mockPrisma.outcome.findUnique.mockResolvedValue(mockOutcome)

      const caller = outcomeRouter.createCaller(mockCtx)

      await expect(caller.create(validInput)).rejects.toThrow(
        'Outcome already exists for this application'
      )
    })

    it('AC4: should accept outcome with notes up to 500 characters', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(mockApplication)
      mockPrisma.outcome.findUnique.mockResolvedValue(null)

      const longNotes = 'A'.repeat(500)

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          outcome: {
            create: vi.fn().mockResolvedValue({
              ...mockOutcome,
              notes: longNotes,
              application: mockApplication,
            }),
          },
          application: { update: vi.fn().mockResolvedValue(mockApplication) },
        })
      })

      const caller = outcomeRouter.createCaller(mockCtx)
      const result = await caller.create({
        ...validInput,
        notes: longNotes,
      })

      expect(result).toBeDefined()
    })
  })

  describe('outcomes.update', () => {
    const validUpdateInput = {
      id: 'outcome-101',
      result: OutcomeResult.AWARDED,
      awardAmountReceived: 5000,
      decisionDate: new Date('2025-10-26'),
      notes: 'Updated notes',
    }

    it('should update existing outcome', async () => {
      mockPrisma.outcome.findFirst.mockResolvedValue({
        ...mockOutcome,
        application: mockApplication,
      })

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          outcome: {
            update: vi.fn().mockResolvedValue({
              ...mockOutcome,
              ...validUpdateInput,
              application: mockApplication,
            }),
          },
          application: { update: vi.fn().mockResolvedValue(mockApplication) },
        })
      })

      const caller = outcomeRouter.createCaller(mockCtx)
      const result = await caller.update(validUpdateInput)

      expect(result).toBeDefined()
    })

    it('should reject if outcome does not belong to student', async () => {
      mockPrisma.outcome.findFirst.mockResolvedValue(null)

      const caller = outcomeRouter.createCaller(mockCtx)

      await expect(caller.update(validUpdateInput)).rejects.toThrow(
        'Outcome not found or does not belong to you'
      )
    })

    it('should require award amount when changing result to AWARDED', async () => {
      const outcomeWithoutAmount = {
        ...mockOutcome,
        result: OutcomeResult.DENIED,
        awardAmountReceived: null,
        application: mockApplication,
      }

      mockPrisma.outcome.findFirst.mockResolvedValue(outcomeWithoutAmount)

      const caller = outcomeRouter.createCaller(mockCtx)

      await expect(
        caller.update({
          id: 'outcome-101',
          result: OutcomeResult.AWARDED,
          awardAmountReceived: undefined,
        })
      ).rejects.toThrow('Award amount is required when outcome is AWARDED')
    })

    it('should update application status when result changes', async () => {
      mockPrisma.outcome.findFirst.mockResolvedValue({
        ...mockOutcome,
        result: OutcomeResult.DENIED,
        application: mockApplication,
      })

      const mockApplicationUpdate = vi.fn().mockResolvedValue(mockApplication)

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          outcome: {
            update: vi.fn().mockResolvedValue({
              ...mockOutcome,
              result: OutcomeResult.AWARDED,
              application: mockApplication,
            }),
          },
          application: { update: mockApplicationUpdate },
        })
      })

      const caller = outcomeRouter.createCaller(mockCtx)
      await caller.update({
        id: 'outcome-101',
        result: OutcomeResult.AWARDED,
        awardAmountReceived: 5000,
      })

      expect(mockApplicationUpdate).toHaveBeenCalledWith({
        where: { id: 'application-456' },
        data: expect.objectContaining({
          status: ApplicationStatus.AWARDED,
        }),
      })
    })
  })

  describe('outcomes.getByStudent', () => {
    const mockOutcomes = [
      {
        ...mockOutcome,
        result: OutcomeResult.AWARDED,
        awardAmountReceived: 5000,
        application: {
          ...mockApplication,
          scholarship: {
            id: 'scholarship-1',
            name: 'Scholarship 1',
            awardAmount: 5000,
            deadline: new Date('2025-12-31'),
          },
        },
      },
      {
        ...mockOutcome,
        id: 'outcome-102',
        result: OutcomeResult.DENIED,
        awardAmountReceived: null,
        application: {
          ...mockApplication,
          id: 'application-457',
          scholarship: {
            id: 'scholarship-2',
            name: 'Scholarship 2',
            awardAmount: 3000,
            deadline: new Date('2025-11-30'),
          },
        },
      },
      {
        ...mockOutcome,
        id: 'outcome-103',
        result: OutcomeResult.AWARDED,
        awardAmountReceived: 3000,
        application: {
          ...mockApplication,
          id: 'application-458',
          scholarship: {
            id: 'scholarship-3',
            name: 'Scholarship 3',
            awardAmount: 3000,
            deadline: new Date('2025-10-31'),
          },
        },
      },
    ]

    const mockApplications = [
      { id: 'app-1', status: ApplicationStatus.SUBMITTED },
      { id: 'app-2', status: ApplicationStatus.IN_PROGRESS },
      { id: 'app-3', status: ApplicationStatus.AWARDED },
      { id: 'app-4', status: ApplicationStatus.DENIED },
    ]

    it('AC5: should return outcomes with aggregate summary metrics', async () => {
      mockPrisma.outcome.findMany.mockResolvedValue(mockOutcomes)
      mockPrisma.application.findMany.mockResolvedValue(mockApplications)

      const caller = outcomeRouter.createCaller(mockCtx)
      const result = await caller.getByStudent()

      expect(result.outcomes).toHaveLength(3)
      expect(result.summary).toEqual({
        totalAwarded: 2,
        totalDenied: 1,
        totalWaitlisted: 0,
        totalWithdrawn: 0,
        totalPending: 2, // 2 apps not in terminal states
        totalFundingSecured: 8000, // 5000 + 3000
        successRate: 2 / 3, // 2 awarded out of 3 total outcomes
      })
    })

    it('AC5: should calculate success rate correctly', async () => {
      mockPrisma.outcome.findMany.mockResolvedValue([mockOutcomes[1]]) // Only 1 DENIED
      mockPrisma.application.findMany.mockResolvedValue([])

      const caller = outcomeRouter.createCaller(mockCtx)
      const result = await caller.getByStudent()

      expect(result.summary.successRate).toBe(0)
      expect(result.summary.totalFundingSecured).toBe(0)
    })

    it('AC5: should handle zero outcomes correctly', async () => {
      mockPrisma.outcome.findMany.mockResolvedValue([])
      mockPrisma.application.findMany.mockResolvedValue([])

      const caller = outcomeRouter.createCaller(mockCtx)
      const result = await caller.getByStudent()

      expect(result.outcomes).toHaveLength(0)
      expect(result.summary).toEqual({
        totalAwarded: 0,
        totalDenied: 0,
        totalWaitlisted: 0,
        totalWithdrawn: 0,
        totalPending: 0,
        totalFundingSecured: 0,
        successRate: 0,
      })
    })
  })

  describe('outcomes.getHistory', () => {
    it('AC6: should return outcomes ordered by decision date (newest first)', async () => {
      const mockHistoryOutcomes = [
        {
          ...mockOutcome,
          id: 'outcome-1',
          decisionDate: new Date('2025-10-25'),
          application: mockApplication,
        },
        {
          ...mockOutcome,
          id: 'outcome-2',
          decisionDate: new Date('2025-10-20'),
          application: mockApplication,
        },
        {
          ...mockOutcome,
          id: 'outcome-3',
          decisionDate: new Date('2025-10-15'),
          application: mockApplication,
        },
      ]

      mockPrisma.outcome.findMany.mockResolvedValue(mockHistoryOutcomes)

      const caller = outcomeRouter.createCaller(mockCtx)
      const result = await caller.getHistory()

      expect(result).toHaveLength(3)
      expect(mockPrisma.outcome.findMany).toHaveBeenCalledWith({
        where: { studentId: mockCtx.userId },
        include: expect.objectContaining({
          application: expect.any(Object),
        }),
        orderBy: {
          decisionDate: 'desc',
        },
      })
    })

    it('AC6: should include scholarship data in history', async () => {
      const mockHistoryOutcome = {
        ...mockOutcome,
        application: {
          ...mockApplication,
          scholarship: {
            id: 'scholarship-789',
            name: 'Test Scholarship',
            awardAmount: 5000,
          },
        },
      }

      mockPrisma.outcome.findMany.mockResolvedValue([mockHistoryOutcome])

      const caller = outcomeRouter.createCaller(mockCtx)
      const result = await caller.getHistory()

      expect(result[0].application.scholarship).toEqual({
        id: 'scholarship-789',
        name: 'Test Scholarship',
        awardAmount: 5000,
      })
    })
  })

  describe('outcomes.getById', () => {
    it('should return single outcome by ID', async () => {
      mockPrisma.outcome.findFirst.mockResolvedValue({
        ...mockOutcome,
        application: mockApplication,
      })

      const caller = outcomeRouter.createCaller(mockCtx)
      const result = await caller.getById({ id: 'outcome-101' })

      expect(result).toBeDefined()
      expect(result.id).toBe('outcome-101')
    })

    it('should reject if outcome does not belong to student', async () => {
      mockPrisma.outcome.findFirst.mockResolvedValue(null)

      const caller = outcomeRouter.createCaller(mockCtx)

      await expect(caller.getById({ id: 'outcome-101' })).rejects.toThrow(
        'Outcome not found or does not belong to you'
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle $0 award amount (edge case)', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(mockApplication)
      mockPrisma.outcome.findUnique.mockResolvedValue(null)
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          outcome: {
            create: vi.fn().mockResolvedValue({
              ...mockOutcome,
              awardAmountReceived: 0,
              application: mockApplication,
            }),
          },
          application: { update: vi.fn().mockResolvedValue(mockApplication) },
        })
      })

      const caller = outcomeRouter.createCaller(mockCtx)

      // $0 should fail validation (must be positive)
      await expect(
        caller.create({
          applicationId: 'application-456',
          result: OutcomeResult.AWARDED,
          awardAmountReceived: 0,
          decisionDate: new Date('2025-10-25'),
        })
      ).rejects.toThrow()
    })

    it('should handle WAITLISTED outcome', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(mockApplication)
      mockPrisma.outcome.findUnique.mockResolvedValue(null)

      const mockApplicationUpdate = vi.fn().mockResolvedValue(mockApplication)

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          outcome: {
            create: vi.fn().mockResolvedValue({
              ...mockOutcome,
              result: OutcomeResult.WAITLISTED,
              awardAmountReceived: null,
              application: mockApplication,
            }),
          },
          application: { update: mockApplicationUpdate },
        })
      })

      const caller = outcomeRouter.createCaller(mockCtx)
      await caller.create({
        applicationId: 'application-456',
        result: OutcomeResult.WAITLISTED,
        decisionDate: new Date('2025-10-25'),
      })

      expect(mockApplicationUpdate).toHaveBeenCalledWith({
        where: { id: 'application-456' },
        data: expect.objectContaining({
          status: ApplicationStatus.WAITLISTED,
        }),
      })
    })
  })
})
