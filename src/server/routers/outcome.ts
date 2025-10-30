/**
 * Outcome Router (tRPC)
 *
 * Provides type-safe API endpoints for outcome tracking operations:
 * - create: Record scholarship outcome (awarded/denied/waitlisted/withdrawn)
 * - update: Edit existing outcome
 * - getByStudent: Get student's outcomes with summary metrics
 * - getHistory: Get chronological outcome log
 *
 * Story: 5.1 - Outcome Tracking & Status Updates
 * @module server/routers/outcome
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { OutcomeResult, ApplicationStatus } from '@prisma/client'

/**
 * Outcome router with CRUD operations and analytics
 */
export const outcomeRouter = router({
  /**
   * Create new outcome for an application
   *
   * Records scholarship decision with optional award amount.
   * Automatically updates application status based on outcome.
   *
   * @input applicationId - ID of application to record outcome for
   * @input result - Outcome result (AWARDED/DENIED/WAITLISTED/WITHDRAWN)
   * @input awardAmountReceived - Award amount in dollars (optional, required for AWARDED)
   * @input decisionDate - Date decision was received
   * @input notes - Free-text notes about outcome (optional)
   * @returns Created outcome record with related application and scholarship data
   * @throws NOT_FOUND - If application doesn't exist or doesn't belong to student
   * @throws CONFLICT - If outcome already exists for application
   * @throws BAD_REQUEST - If AWARDED without amount or invalid amount
   */
  create: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        result: z.nativeEnum(OutcomeResult),
        awardAmountReceived: z.number().int().positive().optional(),
        decisionDate: z.date(),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { applicationId, result, awardAmountReceived, decisionDate, notes } = input
      const studentId = ctx.userId

      // Validate application exists and belongs to student
      const application = await ctx.prisma.application.findFirst({
        where: {
          id: applicationId,
          studentId,
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

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found or does not belong to you',
        })
      }

      // Check if outcome already exists
      const existingOutcome = await ctx.prisma.outcome.findUnique({
        where: { applicationId },
      })

      if (existingOutcome) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Outcome already exists for this application. Use update instead.',
        })
      }

      // Validate award amount for AWARDED outcomes
      if (result === OutcomeResult.AWARDED && !awardAmountReceived) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Award amount is required when outcome is AWARDED',
        })
      }

      // Create outcome and update application status in transaction
      const outcome = await ctx.prisma.$transaction(async (tx) => {
        // Create outcome
        const newOutcome = await tx.outcome.create({
          data: {
            studentId,
            applicationId,
            result,
            awardAmountReceived,
            decisionDate,
            notes,
          },
          include: {
            application: {
              include: {
                scholarship: {
                  select: {
                    id: true,
                    name: true,
                    awardAmount: true,
                  },
                },
              },
            },
          },
        })

        // Update application status based on outcome
        let newStatus: ApplicationStatus
        switch (result) {
          case OutcomeResult.AWARDED:
            newStatus = ApplicationStatus.AWARDED
            break
          case OutcomeResult.DENIED:
            newStatus = ApplicationStatus.DENIED
            break
          case OutcomeResult.WAITLISTED:
            newStatus = ApplicationStatus.WAITLISTED
            break
          case OutcomeResult.WITHDRAWN:
            newStatus = ApplicationStatus.WITHDRAWN
            break
          default:
            newStatus = application.status
        }

        await tx.application.update({
          where: { id: applicationId },
          data: {
            status: newStatus,
            outcomeDate: decisionDate,
            awardAmount: awardAmountReceived ?? undefined,
          },
        })

        return newOutcome
      })

      return outcome
    }),

  /**
   * Update existing outcome
   *
   * Allows editing outcome details (result, amount, date, notes).
   * Updates application status if result changed.
   *
   * @input id - Outcome ID to update
   * @input result - New outcome result (optional)
   * @input awardAmountReceived - New award amount (optional)
   * @input decisionDate - New decision date (optional)
   * @input notes - New notes (optional)
   * @returns Updated outcome record
   * @throws NOT_FOUND - If outcome doesn't exist or doesn't belong to student
   * @throws BAD_REQUEST - If changing to AWARDED without amount
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        result: z.nativeEnum(OutcomeResult).optional(),
        awardAmountReceived: z.number().int().positive().optional(),
        decisionDate: z.date().optional(),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, result, awardAmountReceived, decisionDate, notes } = input
      const studentId = ctx.userId

      // Verify outcome exists and belongs to student
      const existingOutcome = await ctx.prisma.outcome.findFirst({
        where: {
          id,
          studentId,
        },
        include: {
          application: true,
        },
      })

      if (!existingOutcome) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Outcome not found or does not belong to you',
        })
      }

      // Validate award amount if result is AWARDED
      const finalResult = result ?? existingOutcome.result
      if (finalResult === OutcomeResult.AWARDED) {
        const finalAmount = awardAmountReceived ?? existingOutcome.awardAmountReceived
        if (!finalAmount) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Award amount is required when outcome is AWARDED',
          })
        }
      }

      // Update outcome and application status in transaction
      const outcome = await ctx.prisma.$transaction(async (tx) => {
        // Update outcome
        const updatedOutcome = await tx.outcome.update({
          where: { id },
          data: {
            ...(result && { result }),
            ...(awardAmountReceived !== undefined && { awardAmountReceived }),
            ...(decisionDate && { decisionDate }),
            ...(notes !== undefined && { notes }),
          },
          include: {
            application: {
              include: {
                scholarship: {
                  select: {
                    id: true,
                    name: true,
                    awardAmount: true,
                  },
                },
              },
            },
          },
        })

        // Update application status if result changed
        if (result && result !== existingOutcome.result) {
          let newStatus: ApplicationStatus
          switch (result) {
            case OutcomeResult.AWARDED:
              newStatus = ApplicationStatus.AWARDED
              break
            case OutcomeResult.DENIED:
              newStatus = ApplicationStatus.DENIED
              break
            case OutcomeResult.WAITLISTED:
              newStatus = ApplicationStatus.WAITLISTED
              break
            case OutcomeResult.WITHDRAWN:
              newStatus = ApplicationStatus.WITHDRAWN
              break
            default:
              newStatus = existingOutcome.application.status
          }

          await tx.application.update({
            where: { id: existingOutcome.applicationId },
            data: {
              status: newStatus,
              ...(decisionDate && { outcomeDate: decisionDate }),
              ...(awardAmountReceived !== undefined && { awardAmount: awardAmountReceived }),
            },
          })
        }

        return updatedOutcome
      })

      return outcome
    }),

  /**
   * Get student's outcomes with summary metrics
   *
   * Returns all outcomes for authenticated student with aggregate calculations:
   * - Total awards, denials, waitlisted, pending
   * - Total funding secured
   * - Success rate
   *
   * @returns Outcomes array with summary metrics
   */
  getByStudent: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    // Fetch all outcomes for student
    const outcomes = await ctx.prisma.outcome.findMany({
      where: { studentId },
      include: {
        application: {
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
        },
      },
      orderBy: {
        decisionDate: 'desc',
      },
    })

    // Calculate all applications to determine pending count
    const allApplications = await ctx.prisma.application.findMany({
      where: { studentId },
      select: {
        id: true,
        status: true,
      },
    })

    // Calculate aggregate metrics
    const totalAwarded = outcomes.filter((o) => o.result === OutcomeResult.AWARDED).length
    const totalDenied = outcomes.filter((o) => o.result === OutcomeResult.DENIED).length
    const totalWaitlisted = outcomes.filter((o) => o.result === OutcomeResult.WAITLISTED).length
    const totalWithdrawn = outcomes.filter((o) => o.result === OutcomeResult.WITHDRAWN).length

    // Pending = applications without outcomes (status NOT in completed states)
    const totalPending = allApplications.filter(
      (app) =>
        app.status !== ApplicationStatus.AWARDED &&
        app.status !== ApplicationStatus.DENIED &&
        app.status !== ApplicationStatus.WAITLISTED &&
        app.status !== ApplicationStatus.WITHDRAWN
    ).length

    const totalFundingSecured = outcomes
      .filter((o) => o.result === OutcomeResult.AWARDED)
      .reduce((sum, o) => sum + (o.awardAmountReceived ?? 0), 0)

    const totalSubmitted = outcomes.length
    const successRate = totalSubmitted > 0 ? totalAwarded / totalSubmitted : 0

    return {
      outcomes,
      summary: {
        totalAwarded,
        totalDenied,
        totalWaitlisted,
        totalWithdrawn,
        totalPending,
        totalFundingSecured,
        successRate,
      },
    }
  }),

  /**
   * Get chronological outcome history
   *
   * Returns all outcomes ordered by decision date (newest first).
   * Formatted for display in OutcomeHistoryLog component.
   *
   * @returns Outcomes array with related scholarship data
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    const outcomes = await ctx.prisma.outcome.findMany({
      where: { studentId },
      include: {
        application: {
          include: {
            scholarship: {
              select: {
                id: true,
                name: true,
                awardAmount: true,
              },
            },
          },
        },
      },
      orderBy: {
        decisionDate: 'desc',
      },
    })

    return outcomes
  }),

  /**
   * Get single outcome by ID
   *
   * @input id - Outcome ID
   * @returns Outcome record with related data
   * @throws NOT_FOUND - If outcome doesn't exist or doesn't belong to student
   */
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { id } = input
      const studentId = ctx.userId

      const outcome = await ctx.prisma.outcome.findFirst({
        where: {
          id,
          studentId,
        },
        include: {
          application: {
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
          },
        },
      })

      if (!outcome) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Outcome not found or does not belong to you',
        })
      }

      return outcome
    }),
})
