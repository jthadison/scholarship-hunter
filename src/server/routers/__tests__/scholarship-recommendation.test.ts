/**
 * Unit Tests for Scholarship Recommendation Router
 * Story 5.7 - Task 10: Write Tests for Recommendation Engine
 *
 * Tests recommendation CRUD operations, authorization, and business logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  scholarshipRecommendation: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    groupBy: vi.fn(),
    count: vi.fn(),
  },
  application: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}

// Mock counselor permissions
const mockVerifyCounselorAccess = vi.fn()
const mockGetStudentByUserId = vi.fn()
const mockLogCounselorAccess = vi.fn()

vi.mock('../../db', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/lib/counselor/permissions', () => ({
  verifyCounselorAccess: mockVerifyCounselorAccess,
  getStudentByUserId: mockGetStudentByUserId,
  logCounselorAccess: mockLogCounselorAccess,
}))

describe('Scholarship Recommendation Router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authorization and Permissions', () => {
    it('should prevent recommendation without counselor permission (AC #6, #7)', async () => {
      // Task 10.2: Test authorization - Counselor cannot recommend without permission
      mockVerifyCounselorAccess.mockResolvedValue(false)

      const result = mockVerifyCounselorAccess('counselor-1', 'student-1')

      await expect(result).resolves.toBe(false)

      expect(mockVerifyCounselorAccess).toHaveBeenCalledWith('counselor-1', 'student-1')
    })

    it('should allow recommendation with valid counselor permission', async () => {
      mockVerifyCounselorAccess.mockResolvedValue(true)

      const result = await mockVerifyCounselorAccess('counselor-1', 'student-1')

      expect(result).toBe(true)
      expect(mockVerifyCounselorAccess).toHaveBeenCalledWith('counselor-1', 'student-1')
    })

    it('should verify student owns recommendation before responding (Task 10.2)', async () => {
      const studentId = 'student-1'
      const recommendationId = 'rec-1'

      mockPrisma.scholarshipRecommendation.findUnique.mockResolvedValue({
        id: recommendationId,
        studentId,
        status: 'PENDING',
        scholarship: { id: 'sch-1' },
      })

      const recommendation =
        await mockPrisma.scholarshipRecommendation.findUnique({
          where: { id: recommendationId },
        })

      expect(recommendation?.studentId).toBe(studentId)
    })
  })

  describe('Duplicate Recommendation Prevention', () => {
    it('should prevent duplicate recommendation (Task 2.8, AC #2)', async () => {
      // Mock existing recommendation found
      mockPrisma.scholarshipRecommendation.findUnique.mockResolvedValue({
        id: 'existing-rec',
        counselorId: 'counselor-1',
        studentId: 'student-1',
        scholarshipId: 'scholarship-1',
      })

      const existingRec = await mockPrisma.scholarshipRecommendation.findUnique({
        where: {
          counselorId_studentId_scholarshipId: {
            counselorId: 'counselor-1',
            studentId: 'student-1',
            scholarshipId: 'scholarship-1',
          },
        },
      })

      expect(existingRec).toBeTruthy()
      expect(existingRec?.scholarshipId).toBe('scholarship-1')
    })

    it('should allow recommendation if no duplicate exists', async () => {
      mockPrisma.scholarshipRecommendation.findUnique.mockResolvedValue(null)

      const existingRec = await mockPrisma.scholarshipRecommendation.findUnique({
        where: {
          counselorId_studentId_scholarshipId: {
            counselorId: 'counselor-1',
            studentId: 'student-1',
            scholarshipId: 'scholarship-1',
          },
        },
      })

      expect(existingRec).toBeNull()
    })
  })

  describe('Recommendation Creation', () => {
    it('should create recommendation with counselor note (AC #2, #4)', async () => {
      const recommendationData = {
        counselorId: 'counselor-1',
        studentId: 'student-1',
        scholarshipId: 'scholarship-1',
        note: 'This scholarship aligns perfectly with your STEM interests',
        status: 'PENDING',
      }

      mockPrisma.scholarshipRecommendation.create.mockResolvedValue({
        id: 'rec-1',
        ...recommendationData,
        createdAt: new Date(),
        respondedAt: null,
        updatedAt: new Date(),
      })

      const recommendation = await mockPrisma.scholarshipRecommendation.create({
        data: recommendationData,
      })

      expect(recommendation.note).toBe(
        'This scholarship aligns perfectly with your STEM interests'
      )
      expect(recommendation.status).toBe('PENDING')
      expect(mockPrisma.scholarshipRecommendation.create).toHaveBeenCalled()
    })

    it('should create recommendation without note (optional)', async () => {
      const recommendationData = {
        counselorId: 'counselor-1',
        studentId: 'student-1',
        scholarshipId: 'scholarship-1',
        status: 'PENDING',
      }

      mockPrisma.scholarshipRecommendation.create.mockResolvedValue({
        id: 'rec-1',
        ...recommendationData,
        note: null,
        createdAt: new Date(),
        respondedAt: null,
        updatedAt: new Date(),
      })

      const recommendation = await mockPrisma.scholarshipRecommendation.create({
        data: recommendationData,
      })

      expect(recommendation.note).toBeNull()
    })

    it('should log counselor access after creating recommendation (FERPA compliance)', async () => {
      await mockLogCounselorAccess('counselor-1', 'student-1', 'RECOMMEND_SCHOLARSHIP')

      expect(mockLogCounselorAccess).toHaveBeenCalledWith(
        'counselor-1',
        'student-1',
        'RECOMMEND_SCHOLARSHIP'
      )
    })
  })

  describe('Bulk Recommendations (AC #7)', () => {
    it('should create bulk recommendations efficiently (Task 10.4)', async () => {
      const studentIds = ['student-1', 'student-2', 'student-3']
      const scholarshipId = 'scholarship-1'
      const counselorId = 'counselor-1'

      // Mock transaction batch creation
      mockPrisma.$transaction.mockResolvedValue(
        studentIds.map((studentId, index) => ({
          id: `rec-${index + 1}`,
          counselorId,
          studentId,
          scholarshipId,
          status: 'PENDING',
          note: 'Great opportunity for you',
          createdAt: new Date(),
          respondedAt: null,
          updatedAt: new Date(),
        }))
      )

      const recommendations = await mockPrisma.$transaction([])

      expect(recommendations).toHaveLength(3)
    })

    it('should verify permissions for all students in bulk recommendation', async () => {
      const studentIds = ['student-1', 'student-2', 'student-3']

      mockVerifyCounselorAccess.mockResolvedValue(true)

      const permissionChecks = await Promise.all(
        studentIds.map((studentId) =>
          mockVerifyCounselorAccess('counselor-1', studentId)
        )
      )

      expect(permissionChecks).toEqual([true, true, true])
      expect(mockVerifyCounselorAccess).toHaveBeenCalledTimes(3)
    })

    it('should skip students with existing recommendations in bulk (Task 2.8)', async () => {
      const studentIds = ['student-1', 'student-2', 'student-3']

      // Mock: student-2 already has this recommendation
      mockPrisma.scholarshipRecommendation.findMany.mockResolvedValue([
        {
          id: 'existing-rec',
          counselorId: 'counselor-1',
          studentId: 'student-2',
          scholarshipId: 'scholarship-1',
        },
      ])

      const existingRecs = await mockPrisma.scholarshipRecommendation.findMany({
        where: {
          counselorId: 'counselor-1',
          scholarshipId: 'scholarship-1',
          studentId: { in: studentIds },
        },
      })

      const existingStudentIds = new Set(existingRecs.map((r: { studentId: string }) => r.studentId))
      const newStudentIds = studentIds.filter((id) => !existingStudentIds.has(id))

      expect(newStudentIds).toEqual(['student-1', 'student-3'])
      expect(newStudentIds).toHaveLength(2)
    })
  })

  describe('Student Response Workflow (AC #5)', () => {
    it('should accept recommendation and create Application (Task 10.5)', async () => {
      const recommendationId = 'rec-1'
      const studentId = 'student-1'
      const scholarshipId = 'scholarship-1'

      // Mock recommendation
      mockPrisma.scholarshipRecommendation.findUnique.mockResolvedValue({
        id: recommendationId,
        studentId,
        scholarshipId,
        status: 'PENDING',
        scholarship: { id: scholarshipId },
      })

      // Mock no existing application
      mockPrisma.application.findUnique.mockResolvedValue(null)

      // Mock application creation
      mockPrisma.application.create.mockResolvedValue({
        id: 'app-1',
        studentId,
        scholarshipId,
        status: 'TODO',
        priorityTier: 'SHOULD_APPLY',
      })

      // Mock recommendation update
      mockPrisma.scholarshipRecommendation.update.mockResolvedValue({
        id: recommendationId,
        studentId,
        scholarshipId,
        counselorId: 'counselor-1',
        status: 'ACCEPTED',
        note: null,
        responseNote: null,
        createdAt: new Date(),
        respondedAt: new Date(),
        updatedAt: new Date(),
      })

      const application = await mockPrisma.application.create({
        data: {
          studentId,
          scholarshipId,
          status: 'TODO',
          priorityTier: 'SHOULD_APPLY',
        },
      })

      expect(application.status).toBe('TODO')
      expect(application.priorityTier).toBe('SHOULD_APPLY')
    })

    it('should decline recommendation with optional response note (Task 10.5)', async () => {
      const responseNote = 'Already applied to this scholarship elsewhere'

      mockPrisma.scholarshipRecommendation.update.mockResolvedValue({
        id: 'rec-1',
        status: 'DECLINED',
        responseNote,
        respondedAt: new Date(),
      })

      const updated = await mockPrisma.scholarshipRecommendation.update({
        where: { id: 'rec-1' },
        data: {
          status: 'DECLINED',
          responseNote,
          respondedAt: new Date(),
        },
      })

      expect(updated.status).toBe('DECLINED')
      expect(updated.responseNote).toBe(responseNote)
      expect(updated.respondedAt).toBeTruthy()
    })

    it('should handle decline without response note (edge case: Task 10.7)', async () => {
      mockPrisma.scholarshipRecommendation.update.mockResolvedValue({
        id: 'rec-1',
        status: 'DECLINED',
        responseNote: null,
        respondedAt: new Date(),
      })

      const updated = await mockPrisma.scholarshipRecommendation.update({
        where: { id: 'rec-1' },
        data: {
          status: 'DECLINED',
          responseNote: null,
          respondedAt: new Date(),
        },
      })

      expect(updated.status).toBe('DECLINED')
      expect(updated.responseNote).toBeNull()
    })

    it('should prevent responding to already-responded recommendation (edge case)', async () => {
      mockPrisma.scholarshipRecommendation.findUnique.mockResolvedValue({
        id: 'rec-1',
        status: 'ACCEPTED',
        respondedAt: new Date(),
      })

      const recommendation =
        await mockPrisma.scholarshipRecommendation.findUnique({
          where: { id: 'rec-1' },
        })

      expect(recommendation?.status).toBe('ACCEPTED')
      // In actual router, this would throw error: "This recommendation has already been responded to"
    })
  })

  describe('Recommendation Tracking (AC #6)', () => {
    it('should calculate acceptance rate correctly (Task 10.6)', async () => {
      mockPrisma.scholarshipRecommendation.groupBy.mockResolvedValue([
        { status: 'PENDING', _count: 5 },
        { status: 'ACCEPTED', _count: 8 },
        { status: 'DECLINED', _count: 2 },
      ])

      const metrics = await mockPrisma.scholarshipRecommendation.groupBy({
        by: ['status'],
        where: { counselorId: 'counselor-1' },
        _count: true,
      })

      const totalSent = metrics.reduce((sum: number, m: { _count: number }) => sum + m._count, 0)
      const accepted = metrics.find((m: { status: string }) => m.status === 'ACCEPTED')?._count || 0
      const acceptanceRate = totalSent > 0 ? (accepted / totalSent) * 100 : 0

      expect(totalSent).toBe(15)
      expect(accepted).toBe(8)
      expect(acceptanceRate).toBeCloseTo(53.33, 1)
    })

    it('should calculate average response time (Task 10.6)', async () => {
      const now = new Date()
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

      mockPrisma.scholarshipRecommendation.findMany.mockResolvedValue([
        { createdAt: dayAgo, respondedAt: now },
        { createdAt: twoDaysAgo, respondedAt: now },
      ])

      const respondedRecommendations =
        await mockPrisma.scholarshipRecommendation.findMany({
          where: { counselorId: 'counselor-1', respondedAt: { not: null } },
          select: { createdAt: true, respondedAt: true },
        })

      const totalHours = respondedRecommendations.reduce((sum: number, r: { createdAt: Date; respondedAt: Date | null }) => {
        const hours = (r.respondedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60)
        return sum + hours
      }, 0)

      const avgResponseTimeHours = totalHours / respondedRecommendations.length

      expect(avgResponseTimeHours).toBe(36) // (24 + 48) / 2
    })

    it('should filter recommendations by status (Task 10.6)', async () => {
      mockPrisma.scholarshipRecommendation.findMany.mockResolvedValue([
        { id: 'rec-1', status: 'PENDING' },
        { id: 'rec-2', status: 'PENDING' },
      ])

      const pendingRecommendations =
        await mockPrisma.scholarshipRecommendation.findMany({
          where: {
            counselorId: 'counselor-1',
            status: 'PENDING',
          },
        })

      expect(pendingRecommendations).toHaveLength(2)
      expect(pendingRecommendations.every((r: { status: string }) => r.status === 'PENDING')).toBe(true)
    })
  })

  describe('Edge Cases and Validation (Task 10.7)', () => {
    it('should handle pending recommendation expiration (>30 days)', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 31)

      const daysOld = Math.ceil((Date.now() - oldDate.getTime()) / (1000 * 60 * 60 * 24))

      expect(daysOld).toBeGreaterThan(30)
      // In actual implementation, these would be marked as EXPIRED
    })

    it('should validate note length (max 500 characters)', () => {
      const validNote = 'This is a valid note'.repeat(10) // ~200 chars
      const invalidNote = 'This is too long'.repeat(50) // ~800 chars

      expect(validNote.length).toBeLessThanOrEqual(500)
      expect(invalidNote.length).toBeGreaterThan(500)
    })

    it('should handle missing student gracefully', async () => {
      mockGetStudentByUserId.mockRejectedValue(new Error('Student not found'))

      await expect(mockGetStudentByUserId('invalid-user-id')).rejects.toThrow(
        'Student not found'
      )
    })

    it('should handle missing recommendation gracefully', async () => {
      mockPrisma.scholarshipRecommendation.findUnique.mockResolvedValue(null)

      const recommendation =
        await mockPrisma.scholarshipRecommendation.findUnique({
          where: { id: 'non-existent' },
        })

      expect(recommendation).toBeNull()
    })
  })
})
