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
import {
  generateOptimizedTimeline,
  extractTimelineInputFromScholarship,
} from '../services/timeline/generate'
import { calculateProgressPercentage } from '../services/progress/calculate'
import { canMarkReadyForReview } from '../services/progress/validation'
import { detectAtRiskApplications } from '@/lib/at-risk/detection'
import { getSuggestedFix } from '@/lib/document/autoFixSuggestions'
import { DocumentType } from '@prisma/client'

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

      // Generate optimized timeline (Story 3.5)
      const timelineInput = extractTimelineInputFromScholarship(application.scholarship)
      const timelineData = generateOptimizedTimeline(timelineInput)

      // Create timeline record
      await prisma.timeline.create({
        data: {
          applicationId: application.id,
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
   * Get student's applications (Story 3.3)
   *
   * Returns all applications for authenticated student with scholarship and timeline relations.
   * Ordered by deadline (soonest first).
   * Story 3.9: Excludes archived applications by default
   *
   * @returns Array of applications with scholarship and timeline details
   */
  getByStudent: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    const applications = await prisma.application.findMany({
      where: {
        studentId,
        archived: false, // Story 3.9: Exclude archived applications
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
        timeline: true,
      },
      orderBy: [{ targetSubmitDate: 'asc' }],
    })

    return applications
  }),

  /**
   * List student's applications with filtering and sorting
   *
   * @input status - Filter by application status (optional)
   * @input priorityTier - Filter by priority tier (optional)
   * @returns Array of applications with scholarship details
   * @deprecated Use getByStudent instead
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
   * Update application status (Story 3.3)
   *
   * Updates the status of an application with transition validation.
   * Sets actualSubmitDate when status changes to SUBMITTED.
   *
   * @input applicationId - Application ID to update
   * @input status - New status to set
   * @returns Updated application
   * @throws FORBIDDEN - If transition is invalid
   * @throws NOT_FOUND - If application doesn't exist
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        status: z.enum([
          'NOT_STARTED',
          'TODO',
          'IN_PROGRESS',
          'READY_FOR_REVIEW',
          'SUBMITTED',
          'AWAITING_DECISION',
          'AWARDED',
          'DENIED',
          'WITHDRAWN',
        ]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { applicationId, status } = input
      const studentId = ctx.userId

      // Verify ownership and get progress fields
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        select: {
          studentId: true,
          status: true,
          essayCount: true,
          essayComplete: true,
          documentsRequired: true,
          documentsUploaded: true,
          recsRequired: true,
          recsReceived: true,
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
          message: 'You do not have permission to update this application',
        })
      }

      // Completion gate validation for READY_FOR_REVIEW (AC6)
      if (status === 'READY_FOR_REVIEW') {
        const validation = canMarkReadyForReview(application)
        if (!validation.canMark) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot mark ready for review. Missing: ${validation.missingItems.join(', ')}`,
          })
        }
      }

      // Validate status transition
      const validTransitions: Record<
        string,
        string[]
      > = {
        NOT_STARTED: ['TODO'],
        TODO: ['IN_PROGRESS', 'WITHDRAWN'],
        IN_PROGRESS: ['READY_FOR_REVIEW', 'TODO', 'WITHDRAWN'],
        READY_FOR_REVIEW: ['SUBMITTED', 'IN_PROGRESS'],
        SUBMITTED: ['AWAITING_DECISION'],
        AWAITING_DECISION: ['AWARDED', 'DENIED'],
        AWARDED: [],
        DENIED: [],
        WITHDRAWN: [],
      }

      const currentStatus = application.status
      const allowedTransitions = validTransitions[currentStatus] || []

      if (!allowedTransitions.includes(status) && currentStatus !== status) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Cannot transition from ${currentStatus} to ${status}`,
        })
      }

      // Update application with actualSubmitDate if transitioning to SUBMITTED
      const updateData: any = {
        status,
      }

      if (status === 'SUBMITTED' && currentStatus !== 'SUBMITTED') {
        updateData.actualSubmitDate = new Date()
      }

      const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: updateData,
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

      return updatedApplication
    }),

  /**
   * Update application progress (Story 3.7)
   *
   * Updates essay, document, or recommendation counts and recalculates progress percentage.
   * Used when essays are completed, documents uploaded, or recommendations received.
   *
   * @input applicationId - Application ID to update
   * @input update - Progress updates (essayComplete, documentsUploaded, recsReceived)
   * @returns Updated application with recalculated progress
   */
  updateProgress: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        update: z.object({
          essayComplete: z.number().int().min(0).optional(),
          documentsUploaded: z.number().int().min(0).optional(),
          recsReceived: z.number().int().min(0).optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { applicationId, update } = input
      const studentId = ctx.userId

      // Verify ownership
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        select: {
          studentId: true,
          essayCount: true,
          essayComplete: true,
          documentsRequired: true,
          documentsUploaded: true,
          recsRequired: true,
          recsReceived: true,
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
          message: 'You do not have permission to update this application',
        })
      }

      // Apply updates
      const updatedData = {
        essayComplete: update.essayComplete ?? application.essayComplete,
        documentsUploaded: update.documentsUploaded ?? application.documentsUploaded,
        recsReceived: update.recsReceived ?? application.recsReceived,
      }

      // Recalculate progress percentage
      const progressPercentage = calculateProgressPercentage({
        essayCount: application.essayCount,
        essayComplete: updatedData.essayComplete,
        documentsRequired: application.documentsRequired,
        documentsUploaded: updatedData.documentsUploaded,
        recsRequired: application.recsRequired,
        recsReceived: updatedData.recsReceived,
      })

      // Update application in database
      const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: {
          ...updatedData,
          progressPercentage,
        },
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

      return updatedApplication
    }),

  /**
   * Get progress summary for student's applications (Story 3.7)
   *
   * Returns aggregated progress data for dashboard display.
   * Includes progress percentage, status, deadline for each application.
   *
   * @input statusFilter - Optional array of statuses to filter by
   * @returns Array of applications with progress summary
   */
  getProgressSummary: protectedProcedure
    .input(
      z
        .object({
          statusFilter: z
            .array(
              z.enum([
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
            )
            .optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const studentId = ctx.userId
      const statusFilter = input?.statusFilter

      const applications = await prisma.application.findMany({
        where: {
          studentId,
          ...(statusFilter && statusFilter.length > 0 && { status: { in: statusFilter } }),
        },
        select: {
          id: true,
          progressPercentage: true,
          status: true,
          essayCount: true,
          essayComplete: true,
          documentsRequired: true,
          documentsUploaded: true,
          recsRequired: true,
          recsReceived: true,
          scholarship: {
            select: {
              name: true,
              awardAmount: true,
              deadline: true,
            },
          },
          timeline: {
            select: {
              submitDate: true,
            },
          },
        },
        orderBy: [{ targetSubmitDate: 'asc' }],
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

  /**
   * Get workspace data for single application (Story 3.8)
   *
   * Fetches complete application data graph for workspace interface.
   * Single comprehensive query to reduce N+1 queries and ensure consistent data.
   *
   * @input applicationId - Application ID
   * @returns Complete application data with all relations
   * @throws NOT_FOUND - If application doesn't exist
   * @throws FORBIDDEN - If user doesn't own application
   */
  getWorkspaceData: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { applicationId } = input
      const studentId = ctx.userId

      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          scholarship: {
            select: {
              id: true,
              name: true,
              provider: true,
              awardAmount: true,
              deadline: true,
              category: true,
              description: true,
              essayPrompts: true,
              requiredDocuments: true,
              recommendationCount: true,
              eligibilityCriteria: true,
            },
          },
          timeline: true,
          essays: {
            select: {
              id: true,
              title: true,
              wordCount: true,
              phase: true,
              updatedAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          documents: {
            select: {
              id: true,
              type: true,
              fileName: true,
              fileSize: true,
              createdAt: true,
              compliant: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          recommendations: {
            select: {
              id: true,
              recommenderName: true,
              recommenderEmail: true,
              relationship: true,
              status: true,
              createdAt: true,
              submittedAt: true,
              requestedAt: true,
              receivedAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
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
          message: 'You do not have permission to view this application',
        })
      }

      // Fetch match data for match score badge
      const match = await prisma.match.findUnique({
        where: {
          studentId_scholarshipId: {
            studentId,
            scholarshipId: application.scholarshipId,
          },
        },
        select: {
          overallMatchScore: true,
          priorityTier: true,
        },
      })

      return {
        ...application,
        match: match || null,
      }
    }),

  /**
   * Update application notes (Story 3.8)
   *
   * Updates rich text notes for application. Called by auto-save mechanism
   * with debounced input (500ms) and interval-based saves (every 30 seconds).
   *
   * @input applicationId - Application ID
   * @input notes - Rich text notes content (HTML or JSON)
   * @returns Updated application
   * @throws NOT_FOUND - If application doesn't exist
   * @throws FORBIDDEN - If user doesn't own application
   */
  updateNotes: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        notes: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { applicationId, notes } = input
      const studentId = ctx.userId

      // Verify ownership
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
          message: 'You do not have permission to update this application',
        })
      }

      // Update notes
      const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: { notes },
        select: {
          id: true,
          notes: true,
          updatedAt: true,
        },
      })

      return updatedApplication
    }),

  /**
   * Bulk update applications (Story 3.9)
   *
   * Performs bulk operations on multiple applications atomically.
   * Supports: CHANGE_STATUS, SET_PRIORITY, ARCHIVE, DELETE
   *
   * @input applicationIds - Array of application IDs (max 50)
   * @input action - Bulk action type
   * @input params - Action-specific parameters (status, priorityTier)
   * @returns { success: number, failed: number, errors?: Array }
   * @throws BAD_REQUEST - If too many applications selected (>50)
   */
  bulkUpdate: protectedProcedure
    .input(
      z.object({
        applicationIds: z.array(z.string()).min(1).max(50),
        action: z.enum(['CHANGE_STATUS', 'SET_PRIORITY', 'ARCHIVE', 'DELETE']),
        params: z
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
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { applicationIds, action, params } = input
      const studentId = ctx.userId

      // Validate ownership for all applications
      const applications = await prisma.application.findMany({
        where: {
          id: { in: applicationIds },
          studentId, // Security: Only allow updates to user's own applications
        },
        select: {
          id: true,
          studentId: true,
        },
      })

      // Check if all applications were found (ownership validation)
      if (applications.length !== applicationIds.length) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update some of these applications',
        })
      }

      let success = 0
      let failed = 0
      const errors: Array<{ id: string; reason: string }> = []

      try {
        // Execute bulk action
        switch (action) {
          case 'CHANGE_STATUS':
            if (!params?.status) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Status parameter required for CHANGE_STATUS action',
              })
            }

            const statusResult = await prisma.application.updateMany({
              where: { id: { in: applicationIds } },
              data: {
                status: params.status,
                ...(params.status === 'SUBMITTED' && {
                  actualSubmitDate: new Date(),
                }),
              },
            })
            success = statusResult.count
            break

          case 'SET_PRIORITY':
            if (!params?.priorityTier) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Priority tier parameter required for SET_PRIORITY action',
              })
            }

            const priorityResult = await prisma.application.updateMany({
              where: { id: { in: applicationIds } },
              data: { priorityTier: params.priorityTier },
            })
            success = priorityResult.count
            break

          case 'ARCHIVE':
            const archiveResult = await prisma.application.updateMany({
              where: { id: { in: applicationIds } },
              data: { archived: true },
            })
            success = archiveResult.count
            break

          case 'DELETE':
            const deleteResult = await prisma.application.deleteMany({
              where: { id: { in: applicationIds } },
            })
            success = deleteResult.count
            break

          default:
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid bulk action',
            })
        }
      } catch (error: any) {
        // If error occurred, all operations failed
        failed = applicationIds.length
        errors.push({
          id: 'bulk',
          reason: error.message || 'Unknown error occurred',
        })
      }

      return {
        success,
        failed,
        ...(errors.length > 0 && { errors }),
      }
    }),

  /**
   * Get archived applications (Story 3.9)
   *
   * Returns applications marked as archived for the student.
   *
   * @returns Array of archived applications
   */
  getArchived: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    const applications = await prisma.application.findMany({
      where: {
        studentId,
        archived: true,
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
        timeline: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
    })

    return applications
  }),

  /**
   * Unarchive applications (Story 3.9)
   *
   * Restores archived applications back to active view.
   *
   * @input applicationIds - Array of application IDs to unarchive
   * @returns { updated: number }
   */
  unarchive: protectedProcedure
    .input(
      z.object({
        applicationIds: z.array(z.string()).min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { applicationIds } = input
      const studentId = ctx.userId

      // Verify ownership
      const applications = await prisma.application.findMany({
        where: {
          id: { in: applicationIds },
          studentId,
        },
        select: { id: true },
      })

      if (applications.length !== applicationIds.length) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to unarchive some of these applications',
        })
      }

      const result = await prisma.application.updateMany({
        where: { id: { in: applicationIds } },
        data: { archived: false },
      })

      return { updated: result.count }
    }),

  /**
   * Get at-risk applications for student (Story 3.10)
   *
   * Detects applications at risk of missing deadlines using three criteria:
   * - Rule 1: Deadline <7 days AND progress <50% (WARNING)
   * - Rule 2: Deadline <3 days AND incomplete requirements (URGENT)
   * - Rule 3: Deadline <1 day AND not READY_FOR_REVIEW (CRITICAL)
   *
   * Story 3.10 - Subtask 1.6, 1.7 (AC #1)
   *
   * @returns Array of at-risk applications with reason and severity
   */
  getAtRisk: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    // Fetch active applications with deadline in next 7 days
    const applications = await prisma.application.findMany({
      where: {
        studentId,
        status: {
          notIn: ['SUBMITTED', 'WITHDRAWN', 'AWARDED', 'DENIED'],
        },
        archived: false,
      },
      include: {
        scholarship: true,
      },
    })

    // Run at-risk detection algorithm
    const atRiskApps = detectAtRiskApplications(applications)

    return atRiskApps
  }),

  /**
   * Get at-risk event history for analytics (Story 3.10)
   *
   * Returns historical log of at-risk events for Epic 5 analytics.
   * Can filter by student or specific application.
   *
   * Story 3.10 - Subtask 7.4 (AC #7)
   *
   * @input applicationId - Optional application ID filter
   * @returns Array of AtRiskEvent records with application details
   */
  getAtRiskHistory: protectedProcedure
    .input(
      z
        .object({
          applicationId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const studentId = ctx.userId

      const events = await prisma.atRiskEvent.findMany({
        where: {
          application: {
            studentId,
          },
          ...(input?.applicationId && { applicationId: input.applicationId }),
        },
        include: {
          application: {
            select: {
              id: true,
              status: true,
              scholarship: {
                select: {
                  name: true,
                  deadline: true,
                },
              },
            },
          },
        },
        orderBy: { detectedAt: 'desc' },
        take: 100, // Limit to most recent 100 events
      })

      return events
    }),

  /**
   * Validate document compliance for application (Story 4.3)
   *
   * Checks all documents associated with application against scholarship
   * document requirements. Returns compliance report with issues and suggested fixes.
   *
   * Story 4.3 - Task 4 (AC #3)
   *
   * @input applicationId - Application ID to validate
   * @returns Compliance report with status, document counts, and issues
   */
  validateCompliance: protectedProcedure
    .input(
      z.object({
        applicationId: z.string().cuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { applicationId } = input
      const studentId = ctx.userId

      // Fetch application with scholarship and documents
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          scholarship: {
            select: {
              documentRequirements: true,
              requiredDocuments: true,
            },
          },
          documents: {
            select: {
              id: true,
              name: true,
              type: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              compliant: true,
              validationErrors: true,
            },
          },
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
          message: 'You do not have permission to access this application',
        })
      }

      // Build map of uploaded documents by type
      const uploadedDocsByType = new Map<DocumentType, typeof application.documents[0][]>()
      for (const doc of application.documents) {
        const docs = uploadedDocsByType.get(doc.type) || []
        docs.push(doc)
        uploadedDocsByType.set(doc.type, docs)
      }

      // Check each document type for compliance
      const issues: Array<{
        documentType: DocumentType
        errors: string[]
        suggestedFixes: string[]
      }> = []

      let compliantDocuments = 0
      let totalDocuments = application.documents.length

      // Check required documents
      const requiredDocTypes = (application.scholarship.requiredDocuments || []) as string[]

      for (const docTypeStr of requiredDocTypes) {
        const docType = docTypeStr as DocumentType

        // Check if document exists
        const docsOfType = uploadedDocsByType.get(docType) || []

        if (docsOfType.length === 0) {
          // Missing required document
          issues.push({
            documentType: docType,
            errors: [`Missing required ${docType.toLowerCase().replace('_', ' ')}`],
            suggestedFixes: ['Upload the required document to complete your application'],
          })
          totalDocuments++ // Count missing as part of total
        } else {
          // Check compliance of uploaded documents
          for (const doc of docsOfType) {
            if (!doc.compliant && doc.validationErrors) {
              const errors = doc.validationErrors as Array<{
                code: string
                message: string
                field?: string
                details?: Record<string, unknown>
              }>

              issues.push({
                documentType: doc.type,
                errors: errors.map((e) => e.message),
                suggestedFixes: errors.map((e) => getSuggestedFix(e as any)),
              })
            } else if (doc.compliant) {
              compliantDocuments++
            }
          }
        }
      }

      // Check uploaded documents that aren't in required list
      for (const doc of application.documents) {
        if (!requiredDocTypes.includes(doc.type)) {
          // Optional document - still check compliance
          if (!doc.compliant && doc.validationErrors) {
            const errors = doc.validationErrors as Array<{
              code: string
              message: string
              field?: string
              details?: Record<string, unknown>
            }>

            issues.push({
              documentType: doc.type,
              errors: errors.map((e) => e.message),
              suggestedFixes: errors.map((e) => getSuggestedFix(e as any)),
            })
          } else if (doc.compliant) {
            compliantDocuments++
          }
        }
      }

      return {
        compliant: issues.length === 0 && compliantDocuments === totalDocuments,
        totalDocuments,
        compliantDocuments,
        issues,
      }
    }),
})
