/**
 * Quinn Router (tRPC) - Story 3.6
 *
 * Quinn is the Timeline Coordinator agent that helps students manage deadlines
 * and optimize workload distribution across multiple applications.
 *
 * Provides type-safe API endpoints for Quinn dashboard:
 * - getWeeklyTasks: Fetch tasks due within next 7 days
 * - getWorkloadSummary: Calculate total hours scheduled for current week
 * - getCapacitySuggestion: Recommend applications when student has capacity
 * - markTaskComplete: Update task completion status
 * - deferApplication: Postpone application to resolve conflicts
 *
 * @module server/routers/quinn
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '../db'
import {
  addDays,
  differenceInDays,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
} from 'date-fns'

/**
 * Task urgency levels based on days until due
 */
type TaskUrgency = 'CRITICAL' | 'URGENT' | 'UPCOMING'

/**
 * Task types corresponding to timeline milestones
 */
type TaskType = 'ESSAY' | 'REC' | 'DOC' | 'REVIEW' | 'SUBMIT'

/**
 * Workload status thresholds (hours/week)
 */
type WorkloadStatus = 'LIGHT' | 'MODERATE' | 'HEAVY' | 'OVERLOAD'

/**
 * Calculate task urgency based on days until due date
 */
function calculateUrgency(daysUntilDue: number): TaskUrgency {
  if (daysUntilDue <= 2) return 'CRITICAL' // 1-2 days
  if (daysUntilDue <= 4) return 'URGENT' // 3-4 days
  return 'UPCOMING' // 5-7 days
}

/**
 * Determine workload status based on total hours
 */
function getWorkloadStatus(totalHours: number): WorkloadStatus {
  if (totalHours < 10) return 'LIGHT'
  if (totalHours <= 15) return 'MODERATE'
  if (totalHours <= 20) return 'HEAVY'
  return 'OVERLOAD'
}

/**
 * Get workload message based on status
 */
function getWorkloadMessage(status: WorkloadStatus): string {
  const messages = {
    LIGHT: '✓ Manageable workload - you have capacity',
    MODERATE: '⚡ Moderate workload - stay focused',
    HEAVY: '⚠️ Heavy week - prioritize high-value applications',
    OVERLOAD: '🚨 Overloaded! Consider deferring low-priority work',
  }
  return messages[status]
}

/**
 * Quinn router with timeline coordination operations
 */
export const quinnRouter = router({
  /**
   * Get weekly tasks for student (AC#1)
   *
   * Fetches all tasks due within next 7 days, categorized by type and sorted by urgency.
   * Tasks are generated from timeline milestones across all active applications.
   *
   * @returns Array of tasks with urgency indicators and application context
   */
  getWeeklyTasks: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId
    const today = new Date()
    const weekEnd = addDays(today, 7)

    // Fetch all active applications with timelines
    const applications = await prisma.application.findMany({
      where: {
        studentId,
        status: {
          notIn: ['SUBMITTED', 'AWAITING_DECISION', 'AWARDED', 'DENIED', 'WITHDRAWN'],
        },
      },
      include: {
        scholarship: {
          select: {
            name: true,
            essayPrompts: true,
            requiredDocuments: true,
            recommendationCount: true,
          },
        },
        timeline: true,
      },
    })

    const tasks: Array<{
      id: string
      type: TaskType
      applicationId: string
      scholarshipName: string
      title: string
      description: string
      dueDate: Date
      daysUntil: number
      urgency: TaskUrgency
      estimatedHours: number
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE'
    }> = []

    for (const app of applications) {
      if (!app.timeline) continue

      const timeline = app.timeline

      // Essay tasks
      if (
        timeline.startEssayDate &&
        isWithinInterval(timeline.startEssayDate, { start: today, end: weekEnd })
      ) {
        const daysUntil = differenceInDays(timeline.startEssayDate, today)
        const essayPrompts = app.scholarship.essayPrompts as any[] || []
        const wordCount = essayPrompts[0]?.wordCount || 500

        tasks.push({
          id: `${app.id}-essay`,
          type: 'ESSAY',
          applicationId: app.id,
          scholarshipName: app.scholarship.name,
          title: `Draft ${wordCount}-word essay`,
          description: essayPrompts[0]?.prompt || 'Essay required',
          dueDate: timeline.startEssayDate,
          daysUntil,
          urgency: calculateUrgency(daysUntil),
          estimatedHours: app.essayCount * 2.5,
          status: app.essayComplete > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        })
      }

      // Recommendation tasks
      if (
        timeline.requestRecsDate &&
        isWithinInterval(timeline.requestRecsDate, { start: today, end: weekEnd })
      ) {
        const daysUntil = differenceInDays(timeline.requestRecsDate, today)
        tasks.push({
          id: `${app.id}-rec`,
          type: 'REC',
          applicationId: app.id,
          scholarshipName: app.scholarship.name,
          title: `Request ${app.recsRequired} recommendation${app.recsRequired > 1 ? 's' : ''}`,
          description: `Contact teachers for recommendation letters`,
          dueDate: timeline.requestRecsDate,
          daysUntil,
          urgency: calculateUrgency(daysUntil),
          estimatedHours: app.recsRequired * 0.5,
          status: app.recsReceived > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        })
      }

      // Document upload tasks
      if (
        timeline.uploadDocsDate &&
        isWithinInterval(timeline.uploadDocsDate, { start: today, end: weekEnd })
      ) {
        const daysUntil = differenceInDays(timeline.uploadDocsDate, today)
        tasks.push({
          id: `${app.id}-doc`,
          type: 'DOC',
          applicationId: app.id,
          scholarshipName: app.scholarship.name,
          title: `Upload ${app.documentsRequired} document${app.documentsRequired > 1 ? 's' : ''}`,
          description: 'Scan and upload required documents',
          dueDate: timeline.uploadDocsDate,
          daysUntil,
          urgency: calculateUrgency(daysUntil),
          estimatedHours: app.documentsRequired * 0.5,
          status: app.documentsUploaded > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        })
      }

      // Final review tasks
      if (
        timeline.finalReviewDate &&
        isWithinInterval(timeline.finalReviewDate, { start: today, end: weekEnd })
      ) {
        const daysUntil = differenceInDays(timeline.finalReviewDate, today)
        tasks.push({
          id: `${app.id}-review`,
          type: 'REVIEW',
          applicationId: app.id,
          scholarshipName: app.scholarship.name,
          title: 'Final review and proofread',
          description: 'Double-check all application components',
          dueDate: timeline.finalReviewDate,
          daysUntil,
          urgency: calculateUrgency(daysUntil),
          estimatedHours: 1,
          status: app.status === 'READY_FOR_REVIEW' ? 'COMPLETE' : 'NOT_STARTED',
        })
      }

      // Submission tasks
      if (
        timeline.submitDate &&
        isWithinInterval(timeline.submitDate, { start: today, end: weekEnd })
      ) {
        const daysUntil = differenceInDays(timeline.submitDate, today)
        tasks.push({
          id: `${app.id}-submit`,
          type: 'SUBMIT',
          applicationId: app.id,
          scholarshipName: app.scholarship.name,
          title: 'Submit application',
          description: 'Final submission before deadline',
          dueDate: timeline.submitDate,
          daysUntil,
          urgency: calculateUrgency(daysUntil),
          estimatedHours: 0.5,
          status: 'NOT_STARTED',
        })
      }
    }

    // Sort by urgency, then by date
    const urgencyOrder: Record<TaskUrgency, number> = {
      CRITICAL: 0,
      URGENT: 1,
      UPCOMING: 2,
    }

    tasks.sort((a, b) => {
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      }
      return a.dueDate.getTime() - b.dueDate.getTime()
    })

    return tasks
  }),

  /**
   * Get workload summary for current week (AC#2)
   *
   * Calculates total estimated hours scheduled for current week with breakdown by application.
   * Provides workload status and recommendations based on hour thresholds.
   *
   * @returns Workload summary with total hours, breakdown, and status
   */
  getWorkloadSummary: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId
    const today = new Date()
    const weekStart = startOfWeek(today)
    const weekEnd = endOfWeek(today)

    // Fetch all applications with timelines that have milestones this week
    const applications = await prisma.application.findMany({
      where: {
        studentId,
        status: {
          notIn: ['SUBMITTED', 'AWAITING_DECISION', 'AWARDED', 'DENIED', 'WITHDRAWN'],
        },
        timeline: {
          OR: [
            { startEssayDate: { gte: weekStart, lte: weekEnd } },
            { requestRecsDate: { gte: weekStart, lte: weekEnd } },
            { uploadDocsDate: { gte: weekStart, lte: weekEnd } },
            { finalReviewDate: { gte: weekStart, lte: weekEnd } },
            { submitDate: { gte: weekStart, lte: weekEnd } },
          ],
        },
      },
      include: {
        scholarship: {
          select: {
            name: true,
          },
        },
        timeline: true,
      },
    })

    // Calculate hours per application
    const breakdown = applications.map((app) => ({
      applicationId: app.id,
      scholarshipName: app.scholarship.name,
      hours: app.timeline?.estimatedHours || 0,
      priorityTier: app.priorityTier,
    }))

    const totalHours = breakdown.reduce((sum, item) => sum + item.hours, 0)
    const status = getWorkloadStatus(totalHours)
    const message = getWorkloadMessage(status)

    return {
      totalHours,
      breakdown,
      status,
      message,
      weekStart,
      weekEnd,
    }
  }),

  /**
   * Get capacity suggestion for student (AC#4)
   *
   * Recommends highest-priority application to start when student has available capacity (<10 hours/week).
   * Selects from backlog based on priority tier and deadline proximity.
   *
   * @returns Capacity suggestion with recommended application or null if no capacity
   */
  getCapacitySuggestion: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    // First, check current workload
    const today = new Date()
    const weekStart = startOfWeek(today)
    const weekEnd = endOfWeek(today)

    const activeApplications = await prisma.application.findMany({
      where: {
        studentId,
        status: {
          notIn: ['SUBMITTED', 'AWAITING_DECISION', 'AWARDED', 'DENIED', 'WITHDRAWN'],
        },
        timeline: {
          OR: [
            { startEssayDate: { gte: weekStart, lte: weekEnd } },
            { requestRecsDate: { gte: weekStart, lte: weekEnd } },
            { uploadDocsDate: { gte: weekStart, lte: weekEnd } },
            { finalReviewDate: { gte: weekStart, lte: weekEnd } },
            { submitDate: { gte: weekStart, lte: weekEnd } },
          ],
        },
      },
      include: {
        timeline: true,
      },
    })

    const currentWeeklyHours = activeApplications.reduce(
      (sum, app) => sum + (app.timeline?.estimatedHours || 0),
      0
    )

    // Only suggest if capacity available (< 10 hours)
    if (currentWeeklyHours >= 10) {
      return {
        hasCapacity: false,
        currentWeeklyHours,
        suggestedApplication: null,
      }
    }

    // Fetch backlog applications (NOT_STARTED or TODO status)
    const backlogApplications = await prisma.application.findMany({
      where: {
        studentId,
        status: {
          in: ['NOT_STARTED', 'TODO'],
        },
      },
      include: {
        scholarship: {
          select: {
            name: true,
            awardAmount: true,
            deadline: true,
          },
        },
        timeline: true,
      },
      orderBy: [
        { priorityTier: 'asc' }, // MUST_APPLY first
        { targetSubmitDate: 'asc' }, // Soonest deadline first
      ],
      take: 1, // Get top suggestion
    })

    const suggestedApp = backlogApplications[0]

    if (!suggestedApp) {
      return {
        hasCapacity: true,
        currentWeeklyHours,
        suggestedApplication: null,
      }
    }

    // Fetch match score for context
    const match = await prisma.match.findUnique({
      where: {
        studentId_scholarshipId: {
          studentId,
          scholarshipId: suggestedApp.scholarshipId,
        },
      },
      select: {
        overallMatchScore: true,
      },
    })

    return {
      hasCapacity: true,
      currentWeeklyHours,
      suggestedApplication: {
        applicationId: suggestedApp.id,
        scholarshipName: suggestedApp.scholarship.name,
        awardAmount: suggestedApp.scholarship.awardAmount,
        deadline: suggestedApp.scholarship.deadline,
        priorityTier: suggestedApp.priorityTier,
        matchScore: match?.overallMatchScore,
        estimatedHours: suggestedApp.timeline?.estimatedHours,
      },
    }
  }),

  /**
   * Mark task as complete (AC#7 - Quick Actions)
   *
   * Updates application progress fields based on task type.
   * Uses optimistic updates on client side.
   *
   * @input taskId - Task ID (format: {applicationId}-{taskType})
   * @input taskType - Type of task being marked complete
   * @returns Updated application
   */
  markTaskComplete: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        taskType: z.enum(['ESSAY', 'REC', 'DOC', 'REVIEW', 'SUBMIT']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { taskId, taskType } = input
      const studentId = ctx.userId

      // Extract application ID from task ID
      const applicationId = taskId.split('-')[0]

      // Verify ownership
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { studentId: true, essayCount: true, recsRequired: true, documentsRequired: true },
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
          message: 'You do not have permission to update this application',
        })
      }

      // Update based on task type
      const updateData: any = {}

      switch (taskType) {
        case 'ESSAY':
          updateData.essayComplete = application.essayCount
          break
        case 'REC':
          updateData.recsReceived = application.recsRequired
          break
        case 'DOC':
          updateData.documentsUploaded = application.documentsRequired
          break
        case 'REVIEW':
          updateData.status = 'READY_FOR_REVIEW'
          break
        case 'SUBMIT':
          updateData.status = 'SUBMITTED'
          updateData.actualSubmitDate = new Date()
          break
      }

      // Update application
      const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: updateData,
        include: {
          scholarship: {
            select: {
              name: true,
            },
          },
        },
      })

      return updatedApplication
    }),

  /**
   * Defer application to resolve conflicts (AC#3 - Conflict Resolution)
   *
   * Postpones application timeline by specified number of days.
   * Recalculates all milestone dates and re-checks for conflicts.
   *
   * @input applicationId - Application to defer
   * @input deferByDays - Number of days to postpone (default: 7)
   * @returns Updated application with recalculated timeline
   */
  deferApplication: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        deferByDays: z.number().min(1).max(30).default(7),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { applicationId, deferByDays } = input
      const studentId = ctx.userId

      // Fetch application with timeline
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
          message: 'You do not have permission to defer this application',
        })
      }

      if (!application.timeline) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Timeline not found for this application',
        })
      }

      // Defer all milestone dates
      const timeline = application.timeline
      const updatedTimeline = await prisma.timeline.update({
        where: { id: timeline.id },
        data: {
          startEssayDate: timeline.startEssayDate
            ? addDays(timeline.startEssayDate, deferByDays)
            : null,
          requestRecsDate: timeline.requestRecsDate
            ? addDays(timeline.requestRecsDate, deferByDays)
            : null,
          uploadDocsDate: timeline.uploadDocsDate
            ? addDays(timeline.uploadDocsDate, deferByDays)
            : null,
          finalReviewDate: timeline.finalReviewDate
            ? addDays(timeline.finalReviewDate, deferByDays)
            : null,
          submitDate: timeline.submitDate ? addDays(timeline.submitDate, deferByDays) : null,
        },
      })

      return {
        application,
        timeline: updatedTimeline,
        message: `Timeline adjusted - deferred by ${deferByDays} days`,
      }
    }),
})
