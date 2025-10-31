import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'
import { prisma } from '../db'
import { TRPCError } from '@trpc/server'
import {
  verifyCounselorAccess,
  getStudentByUserId,
  logCounselorAccess,
} from '@/lib/counselor/permissions'
import {
  getCounselorStudents as fetchCounselorStudents,
  getStudentDetailForCounselor as fetchStudentDetail,
  getCohortAnalytics as fetchCohortAnalytics,
} from '@/lib/counselor/aggregation'

// Counselor-only procedure: verifies user has counselor role
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

// Counselor procedure with student permission check
const counselorWithPermissionProcedure = counselorProcedure.use(
  async ({ ctx, next, rawInput }) => {
    // rawInput is the input object before validation
    const input = rawInput as { studentId?: string }

    if (input.studentId) {
      const hasAccess = await verifyCounselorAccess(ctx.counselorId, input.studentId)

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No permission to access this student',
        })
      }

      // Log access for FERPA compliance
      await logCounselorAccess(ctx.counselorId, input.studentId, 'VIEW_STUDENT')
    }

    return next({ ctx })
  }
)

export const counselorRouter = router({
  // ============================================================================
  // Permission Management
  // ============================================================================

  /**
   * Request access to a student by email
   * Creates a PENDING permission request
   */
  requestAccess: counselorProcedure
    .input(
      z.object({
        studentEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find student by email
      const user = await prisma.user.findUnique({
        where: { email: input.studentEmail },
        include: { student: true },
      })

      if (!user || !user.student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student not found with this email',
        })
      }

      // Check if permission already exists
      const existingPermission =
        await prisma.studentCounselorPermission.findUnique({
          where: {
            studentId_counselorId: {
              studentId: user.student.id,
              counselorId: ctx.counselorId,
            },
          },
        })

      if (existingPermission) {
        // If revoked, can re-request
        if (existingPermission.status === 'REVOKED') {
          const updated = await prisma.studentCounselorPermission.update({
            where: { id: existingPermission.id },
            data: {
              status: 'PENDING',
              revokedAt: null,
            },
          })
          return { success: true, permission: updated }
        }

        // If already pending or active
        return { success: false, message: 'Permission request already exists' }
      }

      // Create new permission request
      const permission = await prisma.studentCounselorPermission.create({
        data: {
          studentId: user.student.id,
          counselorId: ctx.counselorId,
          status: 'PENDING',
          permissionLevel: 'VIEW_DETAILED',
        },
      })

      // TODO: Send email notification to student about access request

      return { success: true, permission }
    }),

  /**
   * Get all pending permission requests for the current student
   */
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    const student = await getStudentByUserId(ctx.userId)

    const requests = await prisma.studentCounselorPermission.findMany({
      where: {
        studentId: student.id,
        status: 'PENDING',
      },
      include: {
        counselor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            schoolName: true,
            schoolDistrict: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return requests
  }),

  /**
   * Grant counselor access (student action)
   */
  grantAccess: protectedProcedure
    .input(
      z.object({
        permissionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const student = await getStudentByUserId(ctx.userId)

      // Verify permission belongs to this student
      const permission = await prisma.studentCounselorPermission.findUnique({
        where: { id: input.permissionId },
      })

      if (!permission || permission.studentId !== student.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Permission not found or does not belong to you',
        })
      }

      if (permission.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Permission is not pending',
        })
      }

      // Grant access
      const updated = await prisma.studentCounselorPermission.update({
        where: { id: input.permissionId },
        data: {
          status: 'ACTIVE',
          grantedAt: new Date(),
        },
      })

      // TODO: Send email notification to counselor about granted access

      return updated
    }),

  /**
   * Revoke counselor access (student action)
   */
  revokeAccess: protectedProcedure
    .input(
      z.object({
        permissionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const student = await getStudentByUserId(ctx.userId)

      // Verify permission belongs to this student
      const permission = await prisma.studentCounselorPermission.findUnique({
        where: { id: input.permissionId },
      })

      if (!permission || permission.studentId !== student.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Permission not found or does not belong to you',
        })
      }

      // Revoke access
      const updated = await prisma.studentCounselorPermission.update({
        where: { id: input.permissionId },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
        },
      })

      // TODO: Send email notification to counselor about revoked access

      return updated
    }),

  /**
   * Get all counselors with access (student view)
   */
  getMyAccessList: protectedProcedure.query(async ({ ctx }) => {
    const student = await getStudentByUserId(ctx.userId)

    const permissions = await prisma.studentCounselorPermission.findMany({
      where: {
        studentId: student.id,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      include: {
        counselor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            schoolName: true,
            schoolDistrict: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return permissions
  }),

  // ============================================================================
  // Counselor Data Access (placeholders - will be implemented in Tasks 3-5)
  // ============================================================================

  /**
   * Get student roster with aggregated metrics
   */
  getStudents: counselorProcedure
    .input(
      z
        .object({
          sortBy: z.enum(['funding', 'successRate', 'atRisk']).optional(),
          filterBy: z.enum(['atRisk', 'inactive']).optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await fetchCounselorStudents(ctx.counselorId, input || {})
    }),

  /**
   * Get detailed student data with permission check
   */
  getStudentDetail: counselorWithPermissionProcedure
    .input(
      z.object({
        studentId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await fetchStudentDetail(input.studentId)
    }),

  /**
   * Get cohort analytics
   */
  getCohortAnalytics: counselorProcedure.query(async ({ ctx }) => {
    return await fetchCohortAnalytics(ctx.counselorId)
  }),

  /**
   * Add private counselor note
   */
  addNote: counselorWithPermissionProcedure
    .input(
      z.object({
        studentId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const note = await prisma.counselorNote.create({
        data: {
          counselorId: ctx.counselorId,
          studentId: input.studentId,
          content: input.content,
        },
      })

      await logCounselorAccess(ctx.counselorId, input.studentId, 'ADD_NOTE')

      return note
    }),

  /**
   * Get notes for a student
   */
  getNotes: counselorWithPermissionProcedure
    .input(
      z.object({
        studentId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const notes = await prisma.counselorNote.findMany({
        where: {
          counselorId: ctx.counselorId,
          studentId: input.studentId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return notes
    }),
})
