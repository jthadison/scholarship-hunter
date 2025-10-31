/**
 * Story 5.8: Parents tRPC Router
 *
 * API procedures for parent portal functionality.
 * All procedures enforce read-only access and permission checks.
 *
 * @module server/api/routers/parents
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { ParentPermission, ParentNotificationFrequency, UserRole } from '@prisma/client'
import {
  verifyParentAccess,
  enforceParentAccess,
  getParentAccessibleStudents,
  auditParentAccess,
} from '@/server/middleware/parent-auth'

/**
 * Parents Router
 *
 * Handles all parent-related operations including:
 * - Access management (grant/revoke by students)
 * - Student data retrieval (read-only)
 * - Notification preferences
 */
export const parentsRouter = router({
  /**
   * Student grants parent access (Student-only procedure)
   * Sends invitation email to parent
   */
  grantAccess: protectedProcedure
    .input(
      z.object({
        parentEmail: z.string().email(),
        permissions: z.array(z.nativeEnum(ParentPermission)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx

      // Get student record
      const student = await db.student.findUnique({
        where: { userId: session.user.id },
        include: { user: true },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student record not found',
        })
      }

      // Check if parent user exists
      let parentUser = await db.user.findUnique({
        where: { email: input.parentEmail },
      })

      // If parent doesn't exist, we'll need to send an invitation
      // For now, we require parent to register first
      if (!parentUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Parent must register an account first. Please have them sign up with this email address.',
        })
      }

      // Verify parent has PARENT role
      if (parentUser.role !== UserRole.PARENT) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User must have Parent role. Please contact support to update account type.',
        })
      }

      // Check if access record already exists
      const existingAccess = await db.studentParentAccess.findUnique({
        where: {
          studentId_parentId: {
            studentId: student.id,
            parentId: parentUser.id,
          },
        },
      })

      if (existingAccess) {
        // Update existing record (re-grant access if previously revoked)
        await db.studentParentAccess.update({
          where: { id: existingAccess.id },
          data: {
            permissions: input.permissions,
            accessGranted: true,
            grantedAt: new Date(),
            revokedAt: null, // Clear revocation if re-granting
          },
        })
      } else {
        // Create new access record
        await db.studentParentAccess.create({
          data: {
            studentId: student.id,
            parentId: parentUser.id,
            permissions: input.permissions,
            accessGranted: true,
            grantedAt: new Date(),
          },
        })

        // Create default notification preferences
        await db.parentNotificationPreferences.create({
          data: {
            parentId: parentUser.id,
            studentId: student.id,
            notifyOnSubmit: true,
            notifyOnAward: true,
            notifyOnDeadline: true,
            emailFrequency: ParentNotificationFrequency.REALTIME,
          },
        })
      }

      // TODO: Send invitation email to parent (Story 5.8 Task 7)
      // await sendParentInvitationEmail(parentUser.email, student.firstName)

      return {
        success: true,
        message: 'Parent access granted successfully',
      }
    }),

  /**
   * Student revokes parent access (Student-only procedure)
   */
  revokeAccess: protectedProcedure
    .input(
      z.object({
        parentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx

      // Get student record
      const student = await db.student.findUnique({
        where: { userId: session.user.id },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student record not found',
        })
      }

      // Find access record
      const access = await db.studentParentAccess.findUnique({
        where: {
          studentId_parentId: {
            studentId: student.id,
            parentId: input.parentId,
          },
        },
      })

      if (!access) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Parent access record not found',
        })
      }

      // Revoke access immediately
      await db.studentParentAccess.update({
        where: { id: access.id },
        data: {
          accessGranted: false,
          revokedAt: new Date(),
        },
      })

      return {
        success: true,
        message: 'Parent access revoked successfully',
      }
    }),

  /**
   * Get list of parents with access (Student-only procedure)
   */
  listParents: protectedProcedure.query(async ({ ctx }) => {
    const { db, session } = ctx

    // Get student record
    const student = await db.student.findUnique({
      where: { userId: session.user.id },
    })

    if (!student) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student record not found',
      })
    }

    // Get all parent access records
    const accessRecords = await db.studentParentAccess.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        // Note: We'll need to add parent user relation to fetch parent details
      },
    })

    return accessRecords
  }),

  /**
   * Get student data for parent dashboard (Parent-only procedure)
   * Returns simplified, read-only view of student's scholarship progress
   */
  getStudentData: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx

      // Enforce parent access
      const access = await enforceParentAccess(
        session.user.id,
        input.studentId,
        ParentPermission.VIEW_APPLICATIONS
      )

      // Audit log
      await auditParentAccess(session.user.id, input.studentId, 'VIEW_DASHBOARD')

      // Fetch student data
      const student = await db.student.findUnique({
        where: { id: input.studentId },
        include: {
          applications: {
            where: { archived: false },
            include: {
              scholarship: true,
              outcome: true,
            },
            orderBy: { targetSubmitDate: 'asc' },
          },
          outcomes: {
            include: {
              application: {
                include: { scholarship: true },
              },
            },
          },
        },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student not found',
        })
      }

      // Calculate funding summary
      const awards = student.outcomes.filter((o) => o.result === 'AWARDED')
      const totalFundingSecured = awards.reduce((sum, award) => sum + (award.awardAmountReceived || 0), 0)

      // Calculate application pipeline counts
      const applications = student.applications
      const inProgressCount = applications.filter((app) =>
        ['NOT_STARTED', 'TODO', 'IN_PROGRESS', 'READY_FOR_REVIEW'].includes(app.status)
      ).length
      const submittedCount = applications.filter((app) =>
        ['SUBMITTED', 'AWAITING_DECISION'].includes(app.status)
      ).length
      const awardedCount = awards.length
      const deniedCount = student.outcomes.filter((o) => o.result === 'DENIED').length

      // Get upcoming deadlines (next 5)
      const upcomingDeadlines = applications
        .filter((app) => app.targetSubmitDate && app.targetSubmitDate > new Date())
        .slice(0, 5)
        .map((app) => ({
          applicationId: app.id,
          scholarshipName: app.scholarship.name,
          deadline: app.targetSubmitDate,
          status: app.status,
          progressPercentage: app.progressPercentage,
        }))

      // Get at-risk applications (deadline <7 days and progress <80%)
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

      const atRiskApplications = applications
        .filter(
          (app) =>
            app.targetSubmitDate &&
            app.targetSubmitDate <= sevenDaysFromNow &&
            app.targetSubmitDate > new Date() &&
            app.progressPercentage < 80
        )
        .map((app) => ({
          applicationId: app.id,
          scholarshipName: app.scholarship.name,
          deadline: app.targetSubmitDate,
          progressPercentage: app.progressPercentage,
          daysRemaining: Math.ceil(
            (app.targetSubmitDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          ),
        }))

      return {
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
        },
        permissions: access.permissions,
        fundingSummary: {
          totalFundingSecured,
          awardsCount: awardedCount,
          denialsCount: deniedCount,
        },
        applicationPipeline: {
          totalApplications: applications.length,
          inProgress: inProgressCount,
          submitted: submittedCount,
          awarded: awardedCount,
          denied: deniedCount,
        },
        upcomingDeadlines,
        atRiskApplications,
      }
    }),

  /**
   * Get permissions for a specific student (Parent-only procedure)
   */
  getPermissions: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { session } = ctx

      const access = await verifyParentAccess(session.user.id, input.studentId)

      if (!access) {
        return {
          hasAccess: false,
          permissions: [],
        }
      }

      return {
        hasAccess: true,
        permissions: access.permissions,
      }
    }),

  /**
   * Get list of students parent has access to (Parent-only procedure)
   */
  getAccessibleStudents: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx

    const accessRecords = await getParentAccessibleStudents(session.user.id)

    // TODO: Include student details once we add the relation to Student model

    return accessRecords
  }),

  /**
   * Update parent notification preferences (Parent-only procedure)
   */
  updateNotificationPreferences: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        notifyOnSubmit: z.boolean(),
        notifyOnAward: z.boolean(),
        notifyOnDeadline: z.boolean(),
        emailFrequency: z.nativeEnum(ParentNotificationFrequency),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx

      // Enforce parent access
      await enforceParentAccess(session.user.id, input.studentId, ParentPermission.RECEIVE_NOTIFICATIONS)

      // Update or create preferences
      const preferences = await db.parentNotificationPreferences.upsert({
        where: {
          parentId_studentId: {
            parentId: session.user.id,
            studentId: input.studentId,
          },
        },
        update: {
          notifyOnSubmit: input.notifyOnSubmit,
          notifyOnAward: input.notifyOnAward,
          notifyOnDeadline: input.notifyOnDeadline,
          emailFrequency: input.emailFrequency,
        },
        create: {
          parentId: session.user.id,
          studentId: input.studentId,
          notifyOnSubmit: input.notifyOnSubmit,
          notifyOnAward: input.notifyOnAward,
          notifyOnDeadline: input.notifyOnDeadline,
          emailFrequency: input.emailFrequency,
        },
      })

      return preferences
    }),

  /**
   * Get parent notification preferences (Parent-only procedure)
   */
  getNotificationPreferences: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx

      // Enforce parent access
      await enforceParentAccess(session.user.id, input.studentId)

      const preferences = await db.parentNotificationPreferences.findUnique({
        where: {
          parentId_studentId: {
            parentId: session.user.id,
            studentId: input.studentId,
          },
        },
      })

      return preferences
    }),
})
