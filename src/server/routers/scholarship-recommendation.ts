import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'
import { prisma } from '../db'
import { TRPCError } from '@trpc/server'
import {
  verifyCounselorAccess,
  getStudentByUserId,
  logCounselorAccess,
} from '@/lib/counselor/permissions'

// Counselor-only procedure
const counselorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await prisma.user.findUnique({
    where: { clerkId: ctx.userId },
    include: { counselor: true },
  })

  if (!user || user.role !== 'COUNSELOR' || !user.counselor) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Counselor access required',
    })
  }

  return next({
    ctx: {
      ...ctx,
      counselorId: user.counselor.id,
    },
  })
})

export const scholarshipRecommendationRouter = router({
  // ============================================================================
  // Task 2.1: Create single recommendation
  // ============================================================================

  /**
   * Counselor recommends a scholarship to a student
   * AC #2, #4: Recommendation action with counselor note
   */
  create: counselorProcedure
    .input(
      z.object({
        studentId: z.string(),
        scholarshipId: z.string(),
        note: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Task 2.2: Verify counselor has permission
      const hasAccess = await verifyCounselorAccess(ctx.counselorId, input.studentId)

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            "You don't have permission to recommend scholarships to this student. Ask them to grant access in Settings.",
        })
      }

      // Task 2.8: Prevent duplicate recommendations
      const existing = await prisma.scholarshipRecommendation.findUnique({
        where: {
          counselorId_studentId_scholarshipId: {
            counselorId: ctx.counselorId,
            studentId: input.studentId,
            scholarshipId: input.scholarshipId,
          },
        },
      })

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You have already recommended this scholarship to this student',
        })
      }

      // Create recommendation
      const recommendation = await prisma.scholarshipRecommendation.create({
        data: {
          counselorId: ctx.counselorId,
          studentId: input.studentId,
          scholarshipId: input.scholarshipId,
          note: input.note,
          status: 'PENDING',
        },
        include: {
          scholarship: {
            select: {
              id: true,
              name: true,
              awardAmount: true,
              deadline: true,
            },
          },
        },
      })

      // Log access for FERPA compliance
      await logCounselorAccess(ctx.counselorId, input.studentId, 'RECOMMEND_SCHOLARSHIP')

      // TODO Task 5.3: Trigger notification (Inngest job)

      return recommendation
    }),

  // ============================================================================
  // Task 2.3: Create bulk recommendations
  // ============================================================================

  /**
   * Counselor recommends same scholarship to multiple students
   * AC #7: Bulk recommendations
   */
  createBulk: counselorProcedure
    .input(
      z.object({
        studentIds: z.array(z.string()).min(1).max(100), // Max 100 students at once
        scholarshipId: z.string(),
        note: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify counselor has permission for all students
      const permissionChecks = await Promise.all(
        input.studentIds.map((studentId) =>
          verifyCounselorAccess(ctx.counselorId, studentId)
        )
      )

      const unauthorizedStudents = input.studentIds.filter(
        (_, index) => !permissionChecks[index]
      )

      if (unauthorizedStudents.length > 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You don't have permission to recommend to ${unauthorizedStudents.length} student(s)`,
        })
      }

      // Check for existing recommendations
      const existingRecommendations = await prisma.scholarshipRecommendation.findMany({
        where: {
          counselorId: ctx.counselorId,
          scholarshipId: input.scholarshipId,
          studentId: { in: input.studentIds },
        },
        select: { studentId: true },
      })

      const existingStudentIds = new Set(
        existingRecommendations.map((r) => r.studentId)
      )

      // Filter out students who already have this recommendation
      const newStudentIds = input.studentIds.filter((id) => !existingStudentIds.has(id))

      if (newStudentIds.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'All selected students have already received this recommendation',
        })
      }

      // Batch create recommendations
      const recommendations = await prisma.$transaction(
        newStudentIds.map((studentId) =>
          prisma.scholarshipRecommendation.create({
            data: {
              counselorId: ctx.counselorId,
              studentId,
              scholarshipId: input.scholarshipId,
              note: input.note,
              status: 'PENDING',
            },
          })
        )
      )

      // Log bulk access
      await Promise.all(
        newStudentIds.map((studentId) =>
          logCounselorAccess(ctx.counselorId, studentId, 'RECOMMEND_SCHOLARSHIP')
        )
      )

      // TODO Task 5.3: Trigger bulk notifications

      return {
        created: recommendations.length,
        skipped: existingStudentIds.size,
        recommendations,
      }
    }),

  // ============================================================================
  // Task 2.4: Student responds to recommendation
  // ============================================================================

  /**
   * Student accepts or declines a recommendation
   * AC #5: Accept (add to applications) or decline (with optional reason)
   */
  respond: protectedProcedure
    .input(
      z.object({
        recommendationId: z.string(),
        status: z.enum(['ACCEPTED', 'DECLINED']),
        responseNote: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const student = await getStudentByUserId(ctx.userId)

      // Verify recommendation belongs to this student
      const recommendation = await prisma.scholarshipRecommendation.findUnique({
        where: { id: input.recommendationId },
        include: { scholarship: true },
      })

      if (!recommendation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Recommendation not found',
        })
      }

      if (recommendation.studentId !== student.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This recommendation does not belong to you',
        })
      }

      if (recommendation.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This recommendation has already been responded to',
        })
      }

      // Task 2.7: If accepted, create Application record
      let applicationCreated = false

      if (input.status === 'ACCEPTED') {
        // Check if application already exists
        const existingApp = await prisma.application.findUnique({
          where: {
            studentId_scholarshipId: {
              studentId: student.id,
              scholarshipId: recommendation.scholarshipId,
            },
          },
        })

        if (!existingApp) {
          await prisma.application.create({
            data: {
              studentId: student.id,
              scholarshipId: recommendation.scholarshipId,
              status: 'TODO',
              priorityTier: 'SHOULD_APPLY',
            },
          })
          applicationCreated = true
        }
      }

      // Update recommendation status
      const updated = await prisma.scholarshipRecommendation.update({
        where: { id: input.recommendationId },
        data: {
          status: input.status,
          responseNote: input.responseNote,
          respondedAt: new Date(),
        },
        include: {
          scholarship: {
            select: {
              id: true,
              name: true,
              awardAmount: true,
              deadline: true,
            },
          },
          counselor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      return {
        recommendation: updated,
        applicationCreated,
      }
    }),

  // ============================================================================
  // Task 2.5: Get recommendations by counselor (tracking)
  // ============================================================================

  /**
   * Counselor views all recommendations with response tracking
   * AC #6: Track which recommendations were accepted and outcomes
   */
  getByCounselor: counselorProcedure
    .input(
      z
        .object({
          status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED']).optional(),
          studentId: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input = {} }) => {
      const where: any = {
        counselorId: ctx.counselorId,
      }

      if (input.status) {
        where.status = input.status
      }

      if (input.studentId) {
        where.studentId = input.studentId
      }

      const [recommendations, total] = await prisma.$transaction([
        prisma.scholarshipRecommendation.findMany({
          where,
          include: {
            scholarship: {
              select: {
                id: true,
                name: true,
                awardAmount: true,
                deadline: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.scholarshipRecommendation.count({ where }),
      ])

      // Calculate aggregate metrics
      const metrics = await prisma.scholarshipRecommendation.groupBy({
        by: ['status'],
        where: {
          counselorId: ctx.counselorId,
        },
        _count: true,
      })

      const totalSent = metrics.reduce((sum, m) => sum + m._count, 0)
      const accepted = metrics.find((m) => m.status === 'ACCEPTED')?._count || 0
      const acceptanceRate = totalSent > 0 ? (accepted / totalSent) * 100 : 0

      // Calculate average response time for responded recommendations
      const respondedRecommendations = await prisma.scholarshipRecommendation.findMany({
        where: {
          counselorId: ctx.counselorId,
          respondedAt: { not: null },
        },
        select: {
          createdAt: true,
          respondedAt: true,
        },
      })

      let avgResponseTimeHours = 0
      if (respondedRecommendations.length > 0) {
        const totalHours = respondedRecommendations.reduce((sum, r) => {
          const hours =
            (r.respondedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60)
          return sum + hours
        }, 0)
        avgResponseTimeHours = totalHours / respondedRecommendations.length
      }

      return {
        recommendations,
        total,
        metrics: {
          totalSent,
          acceptanceRate,
          avgResponseTimeHours,
          byStatus: metrics,
        },
      }
    }),

  // ============================================================================
  // Task 2.6: Get recommendations by student
  // ============================================================================

  /**
   * Student views their recommendations
   * AC #3: Student receives recommendations in-app
   */
  getByStudent: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED']).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input = {} }) => {
      const student = await getStudentByUserId(ctx.userId)

      const where: any = {
        studentId: student.id,
      }

      if (input.status) {
        where.status = input.status
      }

      const recommendations = await prisma.scholarshipRecommendation.findMany({
        where,
        include: {
          scholarship: {
            select: {
              id: true,
              name: true,
              provider: true,
              awardAmount: true,
              deadline: true,
              description: true,
            },
          },
          counselor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              schoolName: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      })

      // Separate pending from historical
      const pending = recommendations.filter((r) => r.status === 'PENDING')
      const historical = recommendations.filter((r) => r.status !== 'PENDING')

      return {
        pending,
        historical,
        total: recommendations.length,
      }
    }),
})
