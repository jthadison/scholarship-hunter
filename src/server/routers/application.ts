/**
 * Application Router (tRPC)
 *
 * Provides type-safe API endpoints for application operations:
 * - create: Add scholarship to student's applications
 * - list: Get student's applications with status tracking
 *
 * @module server/routers/application
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '../db'
import { generateTimelineStub } from '@/lib/utils/timeline'

/**
 * Application router with CRUD operations
 */
export const applicationRouter = router({
  /**
   * Create new application (add scholarship to My Applications)
   *
   * Creates Application record linking student to scholarship with TODO status.
   * Handles duplicate detection and inherits deadline from scholarship.
   *
   * @input scholarshipId - ID of scholarship to apply to
   * @returns Created application record
   * @throws CONFLICT - If application already exists
   * @throws NOT_FOUND - If scholarship doesn't exist
   */
  create: protectedProcedure
    .input(
      z.object({
        scholarshipId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { scholarshipId } = input
      const studentId = ctx.userId

      // Fetch scholarship to validate and get deadline
      const scholarship = await prisma.scholarship.findUnique({
        where: { id: scholarshipId },
        select: {
          id: true,
          deadline: true,
          verified: true,
          essayPrompts: true,
          requiredDocuments: true,
          recommendationCount: true,
        },
      })

      if (!scholarship || !scholarship.verified) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Scholarship not found or not available',
        })
      }

      // Check for duplicate application
      const existingApplication = await prisma.application.findUnique({
        where: {
          studentId_scholarshipId: {
            studentId,
            scholarshipId,
          },
        },
      })

      if (existingApplication) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You have already added this scholarship to your applications',
        })
      }

      // Fetch match data to inherit priority tier
      const match = await prisma.match.findUnique({
        where: {
          studentId_scholarshipId: {
            studentId,
            scholarshipId,
          },
        },
        select: {
          priorityTier: true,
        },
      })

      // Parse essay prompts to get essay count
      const essayCount =
        scholarship.essayPrompts && Array.isArray(scholarship.essayPrompts)
          ? scholarship.essayPrompts.length
          : 0

      // Create application with timeline in a transaction
      const application = await prisma.application.create({
        data: {
          studentId,
          scholarshipId,
          status: 'TODO',
          priorityTier: match?.priorityTier,
          essayCount,
          documentsRequired: scholarship.requiredDocuments?.length || 0,
          recsRequired: scholarship.recommendationCount || 0,
          targetSubmitDate: scholarship.deadline,
        },
        include: {
          scholarship: true,
        },
      })

      // Generate timeline using stub algorithm
      const timelineData = generateTimelineStub(application)

      // Create timeline record
      await prisma.timeline.create({
        data: {
          applicationId: application.id,
          submitDate: timelineData.submitDate,
          finalReviewDate: timelineData.finalReviewDate,
          uploadDocsDate: timelineData.uploadDocsDate,
          requestRecsDate: timelineData.requestRecsDate,
          startEssayDate: timelineData.startEssayDate,
          estimatedHours: timelineData.estimatedHours,
          hasConflicts: timelineData.hasConflicts,
          conflictsWith: timelineData.conflictsWith,
        },
      })

      // Return application with timeline included
      return await prisma.application.findUnique({
        where: { id: application.id },
        include: {
          scholarship: {
            select: {
              name: true,
              provider: true,
              awardAmount: true,
              deadline: true,
            },
          },
          timeline: true,
        },
      })
    }),

  /**
   * Check if application exists for scholarship
   *
   * @input scholarshipId - ID of scholarship to check
   * @returns { exists: boolean, applicationId?: string }
   */
  checkExists: protectedProcedure
    .input(
      z.object({
        scholarshipId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { scholarshipId } = input
      const studentId = ctx.userId

      const application = await prisma.application.findUnique({
        where: {
          studentId_scholarshipId: {
            studentId,
            scholarshipId,
          },
        },
        select: {
          id: true,
        },
      })

      return {
        exists: !!application,
        applicationId: application?.id,
      }
    }),

  /**
   * List student's applications with filtering and sorting
   *
   * @input status - Filter by application status (optional)
   * @input priorityTier - Filter by priority tier (optional)
   * @returns Array of applications with scholarship details
   */
  list: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum([
              'NOT_STARTED',
              'TODO',
              'IN_PROGRESS',
              'READY_FOR_REVIEW',
              'SUBMITTED',
              'AWAITING_DECISION',
              'AWARDED',
              'DENIED',
              'WITHDRAWN',
            ])
            .optional(),
          priorityTier: z
            .enum(['MUST_APPLY', 'SHOULD_APPLY', 'IF_TIME_PERMITS', 'HIGH_VALUE_REACH'])
            .optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const studentId = ctx.userId

      const applications = await prisma.application.findMany({
        where: {
          studentId,
          ...(input?.status && { status: input.status }),
          ...(input?.priorityTier && { priorityTier: input.priorityTier }),
        },
        include: {
          scholarship: {
            select: {
              name: true,
              provider: true,
              awardAmount: true,
              deadline: true,
              category: true,
              tags: true,
            },
          },
        },
        orderBy: [{ targetSubmitDate: 'asc' }, { createdAt: 'desc' }],
      })

      return applications
    }),

  /**
   * Delete application (remove from My Applications)
   *
   * @input id - Application ID to delete
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const studentId = ctx.userId

      // Verify ownership before deleting
      const application = await prisma.application.findUnique({
        where: { id: input.id },
        select: { studentId: true },
      })

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        })
      }

      if (application.studentId !== studentId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this application',
        })
      }

      await prisma.application.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
