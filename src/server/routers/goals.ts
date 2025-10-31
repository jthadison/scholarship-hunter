/**
 * Goals Router (tRPC)
 *
 * Provides type-safe API endpoints for profile goal management:
 * - create: Create a new goal
 * - update: Update goal progress
 * - list: List goals with filtering
 * - getById: Get single goal by ID
 * - getHistory: Get completed goals
 * - delete: Delete a goal
 *
 * Story: 5.4 - Profile Improvement Tracker
 * @module server/routers/goals
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { GoalType, GoalStatus } from '@prisma/client'
import {
  calculateGoalImpact,
  validateGoalValues,
} from '@/lib/goals/impact-calculator'

/**
 * Input validation schemas
 */
const CreateGoalSchema = z.object({
  goalType: z.nativeEnum(GoalType),
  targetValue: z.number().positive('Target value must be positive'),
  currentValue: z.number().nonnegative('Current value cannot be negative').optional().default(0),
  targetDate: z.date().refine((date) => date > new Date(), {
    message: 'Target date must be in the future',
  }),
  notes: z.string().max(1000).optional(),
})

const UpdateGoalSchema = z.object({
  id: z.string().cuid(),
  currentValue: z.number().nonnegative('Current value cannot be negative').optional(),
  status: z.nativeEnum(GoalStatus).optional(),
  notes: z.string().max(1000).optional(),
})

const ListGoalsSchema = z.object({
  status: z.nativeEnum(GoalStatus).optional(),
  limit: z.number().min(1).max(50).default(50),
  offset: z.number().nonnegative().default(0),
})

const GoalIdSchema = z.object({
  id: z.string().cuid(),
})

/**
 * Goals router with CRUD procedures
 */
export const goalsRouter = router({
  /**
   * Create a new goal
   *
   * Validates goal values, calculates impact estimate, and creates goal record.
   *
   * @param goalType - Type of goal (GPA_IMPROVEMENT, VOLUNTEER_HOURS, etc.)
   * @param targetValue - Target value to achieve
   * @param currentValue - Current value (defaults to 0)
   * @param targetDate - Date by which to achieve goal
   * @param notes - Optional notes
   * @returns Created goal with impact estimate
   */
  create: protectedProcedure
    .input(CreateGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const studentId = ctx.userId

      // Verify student exists
      const student = await ctx.prisma.student.findUnique({
        where: { id: studentId },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student profile not found',
        })
      }

      // Validate goal values
      const validation = validateGoalValues(
        input.goalType,
        input.targetValue,
        input.currentValue
      )

      if (!validation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validation.error || 'Invalid goal values',
        })
      }

      // Calculate impact estimate
      const impactEstimate = calculateGoalImpact(
        input.goalType,
        input.targetValue,
        input.currentValue
      )

      // Determine initial status
      const status = input.currentValue > 0 ? GoalStatus.IN_PROGRESS : GoalStatus.NOT_STARTED

      // Create goal
      const goal = await ctx.prisma.profileGoal.create({
        data: {
          studentId,
          goalType: input.goalType,
          targetValue: input.targetValue,
          currentValue: input.currentValue,
          targetDate: input.targetDate,
          status,
          impactEstimate,
          notes: input.notes,
        },
      })

      return goal
    }),

  /**
   * Update an existing goal
   *
   * Updates progress (currentValue) and/or status.
   * Automatically updates status based on progress.
   *
   * @param id - Goal ID
   * @param currentValue - New current value (optional)
   * @param status - New status (optional)
   * @param notes - Updated notes (optional)
   * @returns Updated goal
   */
  update: protectedProcedure
    .input(UpdateGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const studentId = ctx.userId

      // Verify goal exists and belongs to student
      const existingGoal = await ctx.prisma.profileGoal.findUnique({
        where: { id: input.id },
      })

      if (!existingGoal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Goal not found',
        })
      }

      if (existingGoal.studentId !== studentId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this goal',
        })
      }

      // Determine new status if currentValue is being updated
      let newStatus = input.status || existingGoal.status
      const newCurrentValue = input.currentValue ?? existingGoal.currentValue

      if (input.currentValue !== undefined) {
        // Validate new value
        const validation = validateGoalValues(
          existingGoal.goalType,
          existingGoal.targetValue,
          newCurrentValue
        )

        if (!validation.isValid && newCurrentValue < existingGoal.targetValue) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: validation.error || 'Invalid current value',
          })
        }

        // Auto-update status based on progress
        if (newCurrentValue >= existingGoal.targetValue) {
          newStatus = GoalStatus.COMPLETED
        } else if (newCurrentValue > 0 && existingGoal.status === GoalStatus.NOT_STARTED) {
          newStatus = GoalStatus.IN_PROGRESS
        }
      }

      // Update goal
      const updatedGoal = await ctx.prisma.profileGoal.update({
        where: { id: input.id },
        data: {
          currentValue: newCurrentValue,
          status: newStatus,
          notes: input.notes ?? existingGoal.notes,
        },
      })

      return updatedGoal
    }),

  /**
   * List goals for authenticated student
   *
   * Supports filtering by status and pagination.
   *
   * @param status - Optional status filter
   * @param limit - Max results (default 50)
   * @param offset - Pagination offset (default 0)
   * @returns Object with goals array and total count
   */
  list: protectedProcedure
    .input(ListGoalsSchema)
    .query(async ({ ctx, input }) => {
      const studentId = ctx.userId

      // Build where clause
      const where: any = { studentId }
      if (input.status) {
        where.status = input.status
      }

      // Get goals with pagination
      const [goals, total] = await Promise.all([
        ctx.prisma.profileGoal.findMany({
          where,
          orderBy: [
            { status: 'asc' }, // Active goals first
            { targetDate: 'asc' }, // Then by deadline
          ],
          take: input.limit,
          skip: input.offset,
        }),
        ctx.prisma.profileGoal.count({ where }),
      ])

      return {
        goals,
        total,
      }
    }),

  /**
   * Get a single goal by ID
   *
   * @param id - Goal ID
   * @returns Goal with milestones
   */
  getById: protectedProcedure
    .input(GoalIdSchema)
    .query(async ({ ctx, input }) => {
      const studentId = ctx.userId

      const goal = await ctx.prisma.profileGoal.findUnique({
        where: { id: input.id },
        include: {
          milestones: {
            orderBy: { achievedDate: 'desc' },
          },
        },
      })

      if (!goal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Goal not found',
        })
      }

      if (goal.studentId !== studentId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this goal',
        })
      }

      return goal
    }),

  /**
   * Get completed goals (historical tracking)
   *
   * Returns all completed goals with achievement dates, ordered by completion.
   *
   * @returns Array of completed goals with milestones
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    const completedGoals = await ctx.prisma.profileGoal.findMany({
      where: {
        studentId,
        status: GoalStatus.COMPLETED,
      },
      include: {
        milestones: {
          orderBy: { achievedDate: 'desc' },
          take: 1, // Get the final completion milestone
        },
      },
      orderBy: {
        updatedAt: 'desc', // Most recently completed first
      },
    })

    return completedGoals
  }),

  /**
   * Delete a goal
   *
   * @param id - Goal ID
   * @returns Success indicator
   */
  delete: protectedProcedure
    .input(GoalIdSchema)
    .mutation(async ({ ctx, input }) => {
      const studentId = ctx.userId

      // Verify goal exists and belongs to student
      const goal = await ctx.prisma.profileGoal.findUnique({
        where: { id: input.id },
      })

      if (!goal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Goal not found',
        })
      }

      if (goal.studentId !== studentId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this goal',
        })
      }

      // Delete goal (cascades to milestones)
      await ctx.prisma.profileGoal.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  /**
   * Get aggregate statistics for student's goals
   *
   * Returns summary stats:
   * - Total goals by status
   * - Total profile strength gained from completed goals
   * - Success rate (completed / total)
   *
   * @returns Aggregate statistics object
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    // Get all goals
    const goals = await ctx.prisma.profileGoal.findMany({
      where: { studentId },
      include: {
        milestones: {
          where: {
            profileStrengthAfter: { gt: 0 },
          },
        },
      },
    })

    // Calculate stats
    const totalGoals = goals.length
    const completedGoals = goals.filter((g) => g.status === GoalStatus.COMPLETED).length
    const inProgressGoals = goals.filter((g) => g.status === GoalStatus.IN_PROGRESS).length
    const notStartedGoals = goals.filter((g) => g.status === GoalStatus.NOT_STARTED).length

    // Calculate total profile strength gained
    const totalProfileStrengthGained = goals.reduce((sum, goal) => {
      if (goal.status === GoalStatus.COMPLETED && goal.milestones.length > 0) {
        const milestone = goal.milestones[0]
        if (milestone) {
          const gain = milestone.profileStrengthAfter - milestone.profileStrengthBefore
          return sum + gain
        }
      }
      return sum
    }, 0)

    const successRate = totalGoals > 0 ? completedGoals / totalGoals : 0

    return {
      totalGoals,
      completedGoals,
      inProgressGoals,
      notStartedGoals,
      totalProfileStrengthGained: Math.round(totalProfileStrengthGained),
      successRate,
    }
  }),
})
