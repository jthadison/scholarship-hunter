/**
 * Analytics Router (tRPC)
 *
 * Provides type-safe API endpoints for analytics operations:
 * - getSnapshot: Get current analytics snapshot for student
 * - getTrends: Get time-series trend data (funding, applications)
 * - getTierBreakdown: Get success rates grouped by priority tier
 * - getGoalProgress: Compare current funding to student's goal
 *
 * Story: 5.2 - Analytics Dashboard - Success Metrics
 * @module server/routers/analytics
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import {
  calculateSuccessMetrics,
  calculateTierBreakdown,
  calculateFundingTrend,
  calculateApplicationsTrend,
  calculateCumulativeFunding,
  calculateROI,
  calculateOutcomeDistribution,
} from '@/lib/analytics/calculator'

/**
 * Timeframe enum for trend queries
 */
const TimeframeSchema = z.enum(['30d', '90d', '1y', 'all'])
type Timeframe = z.infer<typeof TimeframeSchema>

/**
 * Convert timeframe to number of months
 */
function timeframeToMonths(timeframe: Timeframe): number {
  switch (timeframe) {
    case '30d':
      return 1
    case '90d':
      return 3
    case '1y':
      return 12
    case 'all':
      return 120 // 10 years as "all time"
    default:
      return 12
  }
}

/**
 * Analytics router with query procedures
 */
export const analyticsRouter = router({
  /**
   * Get current analytics snapshot for authenticated student
   *
   * Returns comprehensive success metrics including:
   * - Application counts (total, submitted, awarded, denied, pending)
   * - Success rate (awards / submitted)
   * - Funding metrics (total secured, average award)
   * - Profile metrics (strength score, completion percentage)
   *
   * @returns Analytics snapshot object
   */
  getSnapshot: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    // Verify student exists
    const student = await ctx.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        profile: {
          select: {
            strengthScore: true,
            completionPercentage: true,
          },
        },
      },
    })

    if (!student) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student profile not found',
      })
    }

    // Calculate success metrics (all time)
    const metrics = await calculateSuccessMetrics(ctx.prisma, studentId)

    // Get profile metrics
    const profileStrengthScore = student.profile?.strengthScore ?? 0
    const profileCompletion = student.profile?.completionPercentage ?? 0

    // Count activity metrics
    const matchesGenerated = await ctx.prisma.match.count({
      where: { studentId },
    })

    const essaysWritten = await ctx.prisma.essay.count({
      where: { studentId },
    })

    return {
      ...metrics,
      profileStrengthScore,
      profileCompletion,
      matchesGenerated,
      essaysWritten,
    }
  }),

  /**
   * Get time-series trend data
   *
   * Returns funding and application trends over specified timeframe:
   * - Funding by month (bar chart data)
   * - Applications by month (line chart data)
   * - Cumulative funding growth (line chart data)
   *
   * @input timeframe - Time period ('30d', '90d', '1y', 'all')
   * @returns Trend data arrays
   */
  getTrends: protectedProcedure
    .input(
      z.object({
        timeframe: TimeframeSchema.default('90d'),
      })
    )
    .query(async ({ input, ctx }) => {
      const studentId = ctx.userId
      const months = timeframeToMonths(input.timeframe)

      // Calculate monthly trends
      const [fundingByMonth, applicationsByMonth, cumulativeFunding] = await Promise.all([
        calculateFundingTrend(ctx.prisma, studentId, months),
        calculateApplicationsTrend(ctx.prisma, studentId, months),
        calculateCumulativeFunding(ctx.prisma, studentId),
      ])

      return {
        fundingByMonth,
        applicationsByMonth,
        cumulativeFunding,
      }
    }),

  /**
   * Get success rate breakdown by priority tier
   *
   * Returns tier analysis showing:
   * - Applications count per tier
   * - Awards count per tier
   * - Success rate per tier (0.0 to 1.0)
   * - Total funding per tier
   *
   * Sorted by success rate descending.
   *
   * @returns Array of tier breakdown objects
   */
  getTierBreakdown: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId
    return await calculateTierBreakdown(ctx.prisma, studentId)
  }),

  /**
   * Get funding goal progress
   *
   * Compares current funding secured to student's funding goal from profile.
   *
   * @returns Goal progress object with goal, secured amount, and percentage
   */
  getGoalProgress: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    // Default funding goal (can be made configurable later)
    const goal = 15000 // Default to $15,000

    // Calculate total funding secured
    const metrics = await calculateSuccessMetrics(ctx.prisma, studentId)
    const secured = metrics.totalFundingSecured

    // Calculate percentage (avoid division by zero)
    const percentage = goal > 0 ? (secured / goal) * 100 : 0

    return {
      goal,
      secured,
      percentage: Math.min(percentage, 100), // Cap at 100%
    }
  }),

  /**
   * Get ROI (Return on Investment) analysis
   *
   * Estimates time invested vs. funding secured:
   * - Time invested (essays × 3hrs + applications × 1hr + documents × 0.5hrs)
   * - Funding secured (total award amounts)
   * - Hourly rate (funding / time)
   *
   * @returns ROI analysis object
   */
  getROI: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId
    return await calculateROI(ctx.prisma, studentId)
  }),

  /**
   * Get outcome distribution
   *
   * Returns counts and percentages for:
   * - Awarded
   * - Denied
   * - Waitlisted
   * - Withdrawn
   * - Pending
   *
   * Used for pie chart visualization.
   *
   * @returns Outcome distribution object
   */
  getOutcomeDistribution: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId
    return await calculateOutcomeDistribution(ctx.prisma, studentId)
  }),

  /**
   * Get latest analytics snapshot from database
   *
   * Returns most recent snapshot record for student if exists.
   * Snapshots are generated nightly by background job.
   *
   * @returns Latest snapshot record or null
   */
  getLatestSnapshot: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    const snapshot = await ctx.prisma.analyticsSnapshot.findFirst({
      where: { studentId },
      orderBy: { snapshotDate: 'desc' },
    })

    return snapshot
  }),

  /**
   * Get historical snapshots for trend analysis
   *
   * Returns snapshot history for student ordered by date.
   *
   * @input limit - Maximum number of snapshots to return (default 90, max 365)
   * @returns Array of snapshot records
   */
  getSnapshotHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(365).default(90),
      })
    )
    .query(async ({ input, ctx }) => {
      const studentId = ctx.userId

      const snapshots = await ctx.prisma.analyticsSnapshot.findMany({
        where: { studentId },
        orderBy: { snapshotDate: 'desc' },
        take: input.limit,
      })

      return snapshots
    }),
})
