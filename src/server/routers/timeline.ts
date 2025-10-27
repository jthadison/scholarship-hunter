/**
 * Timeline Router (tRPC)
 *
 * Provides type-safe API endpoints for timeline operations:
 * - generate: Create timeline for application with milestone dates
 *
 * @module server/routers/timeline
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '../db'
import { generateTimelineStub } from '@/lib/utils/timeline'

/**
 * Timeline router with generation operations
 */
export const timelineRouter = router({
  /**
   * Generate timeline for application
   *
   * Creates Timeline record with milestone dates calculated using backward
   * planning from scholarship deadline. Sprint 1 uses fixed-offset algorithm.
   *
   * @input applicationId - ID of application to generate timeline for
   * @returns Created timeline record
   * @throws NOT_FOUND - If application doesn't exist
   * @throws CONFLICT - If timeline already exists
   */
  generate: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { applicationId } = input
      const studentId = ctx.userId

      // Fetch application with scholarship data
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          scholarship: true,
          timeline: true,
        },
      })

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        })
      }

      // Verify ownership
      if (application.studentId !== studentId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to generate timeline for this application',
        })
      }

      // Check if timeline already exists
      if (application.timeline) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Timeline already exists for this application',
        })
      }

      // Generate timeline using stub algorithm
      const timelineData = generateTimelineStub(application)

      // Create timeline record
      const timeline = await prisma.timeline.create({
        data: {
          applicationId,
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

      return timeline
    }),

  /**
   * Get timeline for application
   *
   * @input applicationId - ID of application
   * @returns Timeline record or null if not found
   */
  getByApplication: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { applicationId } = input
      const studentId = ctx.userId

      // Verify application ownership
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
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
          message: 'You do not have permission to view this timeline',
        })
      }

      const timeline = await prisma.timeline.findUnique({
        where: { applicationId },
      })

      return timeline
    }),
})
