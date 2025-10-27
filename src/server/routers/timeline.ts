/**
 * Timeline Router (tRPC) - Story 3.5
 *
 * Provides type-safe API endpoints for timeline operations:
 * - generate: Create timeline for application with milestone dates
 * - recalculate: Update timeline when student starts late or completes milestones
 * - detectConflicts: Check for workload conflicts across multiple applications
 * - getByApplication: Get timeline for specific application
 * - getCalendarView: Get all timelines for calendar visualization
 *
 * @module server/routers/timeline
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '../db'
import {
  generateOptimizedTimeline,
  extractTimelineInputFromScholarship,
  validateDeadline,
} from '../services/timeline/generate'
import {
  detectTimelineConflicts,
  generateConflictWarning,
} from '../services/timeline/conflicts'
import {
  recalculateTimeline,
  shouldRecalculate,
} from '../services/timeline/recalculate'

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

      // Validate deadline is in future
      try {
        validateDeadline(application.scholarship.deadline)
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Invalid deadline',
        })
      }

      // Extract timeline input from scholarship
      const timelineInput = extractTimelineInputFromScholarship(application.scholarship)

      // Generate optimized timeline
      const timelineData = generateOptimizedTimeline(timelineInput)

      // Create timeline record
      const timeline = await prisma.timeline.create({
        data: {
          applicationId,
          submitDate: timelineData.submitDate,
          finalReviewDate: timelineData.finalReviewDate,
          uploadDocsDate: timelineData.uploadDocsDate,
          requestRecsDate: timelineData.requestRecsDate,
          startEssayDate: timelineData.startEssayDate,
          estimatedHours: Math.round(timelineData.estimatedHours),
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

  /**
   * Recalculate timeline when student starts late or completes milestones
   *
   * Triggers recalculation and updates timeline with compressed dates if needed.
   * Returns warnings if timeline is at-risk.
   *
   * @input applicationId - ID of application
   * @returns Updated timeline with adjustment warnings
   * @throws NOT_FOUND - If application or timeline doesn't exist
   */
  recalculate: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { applicationId } = input
      const studentId = ctx.userId

      // Fetch application with timeline and scholarship
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          timeline: true,
          scholarship: true,
        },
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
          message: 'You do not have permission to recalculate this timeline',
        })
      }

      if (!application.timeline) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Timeline not found for this application',
        })
      }

      // Determine if recalculation is needed
      const trigger = shouldRecalculate(
        application.timeline,
        application,
        application.scholarship
      )

      if (!trigger) {
        // No recalculation needed, return existing timeline
        return {
          timeline: application.timeline,
          isAdjusted: false,
          warnings: [],
        }
      }

      // Recalculate timeline
      const recalculated = recalculateTimeline({
        currentTimeline: application.timeline,
        application,
        scholarship: application.scholarship,
        trigger,
      })

      // Update timeline in database
      const updatedTimeline = await prisma.timeline.update({
        where: { id: application.timeline.id },
        data: {
          startEssayDate: recalculated.startEssayDate,
          requestRecsDate: recalculated.requestRecsDate,
          uploadDocsDate: recalculated.uploadDocsDate,
          finalReviewDate: recalculated.finalReviewDate,
          submitDate: recalculated.submitDate,
          estimatedHours: Math.round(recalculated.estimatedHours),
          hasConflicts: recalculated.hasConflicts,
          conflictsWith: recalculated.conflictsWith,
        },
      })

      return {
        timeline: updatedTimeline,
        isAdjusted: recalculated.isAdjusted,
        warnings: recalculated.warnings,
        isAtRisk: recalculated.isAtRisk,
        adjustmentReason: recalculated.adjustmentReason,
      }
    }),

  /**
   * Detect timeline conflicts across student's applications
   *
   * Identifies weeks where multiple applications have overlapping work
   * exceeding 15-hour sustainable threshold.
   *
   * @input studentId - Optional student ID (defaults to authenticated user)
   * @returns Conflict report with conflicted weeks and affected applications
   */
  detectConflicts: protectedProcedure
    .input(
      z.object({
        studentId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const studentId = input.studentId || ctx.userId

      // Verify permission if checking another student's conflicts
      if (studentId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this student\'s conflicts',
        })
      }

      // Fetch all applications with timelines for student
      const applications = await prisma.application.findMany({
        where: { studentId },
        include: {
          timeline: true,
          scholarship: {
            select: {
              name: true,
              deadline: true,
            },
          },
        },
      })

      // Detect conflicts
      const conflictReport = detectTimelineConflicts(applications)

      // Generate warning messages for each conflicted week
      const conflictsWithMessages = conflictReport.conflictedWeeks.map((week) => ({
        ...week,
        warningMessage: generateConflictWarning(week),
      }))

      return {
        hasConflicts: conflictReport.hasConflicts,
        conflictedWeeks: conflictsWithMessages,
        totalConflictedApplications: conflictReport.totalConflictedApplications,
      }
    }),

  /**
   * Get calendar view of all timelines for student
   *
   * Returns all application timelines formatted for calendar display,
   * with milestone dates and metadata.
   *
   * @input startDate - Optional start date filter
   * @input endDate - Optional end date filter
   * @returns Array of applications with timelines for calendar rendering
   */
  getCalendarView: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { startDate, endDate } = input
      const studentId = ctx.userId

      // Build date filter
      const dateFilter = startDate && endDate
        ? {
            timeline: {
              OR: [
                { startEssayDate: { gte: startDate, lte: endDate } },
                { requestRecsDate: { gte: startDate, lte: endDate } },
                { uploadDocsDate: { gte: startDate, lte: endDate } },
                { finalReviewDate: { gte: startDate, lte: endDate } },
                { submitDate: { gte: startDate, lte: endDate } },
              ],
            },
          }
        : {}

      // Fetch applications with timelines
      const applications = await prisma.application.findMany({
        where: {
          studentId,
          ...dateFilter,
        },
        include: {
          timeline: true,
          scholarship: {
            select: {
              name: true,
              deadline: true,
              awardAmount: true,
            },
          },
        },
        orderBy: {
          timeline: {
            submitDate: 'asc',
          },
        },
      })

      // Transform into calendar-friendly format
      const calendarData = applications.map((app) => ({
        applicationId: app.id,
        scholarshipName: app.scholarship.name,
        awardAmount: app.scholarship.awardAmount,
        deadline: app.scholarship.deadline,
        priorityTier: app.priorityTier,
        status: app.status,
        timeline: app.timeline
          ? {
              startEssayDate: app.timeline.startEssayDate,
              requestRecsDate: app.timeline.requestRecsDate,
              uploadDocsDate: app.timeline.uploadDocsDate,
              finalReviewDate: app.timeline.finalReviewDate,
              submitDate: app.timeline.submitDate,
              estimatedHours: app.timeline.estimatedHours,
              hasConflicts: app.timeline.hasConflicts,
            }
          : null,
      }))

      return calendarData
    }),
})
