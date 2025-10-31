/**
 * Positioning Router (tRPC)
 *
 * Provides type-safe API endpoints for competitive positioning:
 * - getCurrent: Get current competitive position snapshot
 * - getHistory: Get historical position snapshots over time
 * - getComparison: Get month-over-month position comparison
 * - getPeerBenchmark: Get anonymized peer comparison data
 * - getAchievements: Get unlocked and locked achievement badges
 *
 * Story: 5.5 - Competitive Positioning Over Time
 * @module server/routers/positioning
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getCompetitivePosition,
  getPositionHistory,
  comparePosition,
  getPeerBenchmark,
  calculateProjectedFunding,
} from "@/lib/positioning/analytics";
import { getBadgesForStudent, checkAndAwardBadges } from "@/lib/positioning/badges";

/**
 * Time range schema for historical queries
 */
const TimeRangeSchema = z.enum(["30d", "90d", "1y", "all"]);

/**
 * Positioning router with query and mutation procedures
 */
export const positioningRouter = router({
  /**
   * Get current competitive position for authenticated student
   *
   * Returns:
   * - Profile strength score (0-100)
   * - Percentile ranking (top X% of platform users)
   * - Scholarship match counts by tier
   * - Projected funding potential
   *
   * @returns Current position snapshot or null if no data
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId;

    // Verify student exists
    const student = await ctx.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Student profile not found",
      });
    }

    const position = await getCompetitivePosition(studentId);

    return position;
  }),

  /**
   * Get position history for authenticated student
   *
   * @param timeRange - "30d" | "90d" | "1y" | "all"
   * @returns Array of historical position snapshots
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        timeRange: TimeRangeSchema.default("90d"),
      })
    )
    .query(async ({ ctx, input }) => {
      const studentId = ctx.userId;

      // Verify student exists
      const student = await ctx.prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student profile not found",
        });
      }

      const history = await getPositionHistory(studentId, input.timeRange);

      return history;
    }),

  /**
   * Get month-over-month position comparison
   *
   * Returns:
   * - Current month metrics
   * - Previous month metrics
   * - Deltas (matches, funding, profile strength)
   * - Improvement sources (GPA, volunteer, test scores, leadership)
   *
   * @returns Comparison data or null if insufficient history
   */
  getComparison: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId;

    // Verify student exists
    const student = await ctx.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Student profile not found",
      });
    }

    const comparison = await comparePosition(studentId);

    return comparison;
  }),

  /**
   * Get peer benchmark comparison (anonymized)
   *
   * Returns:
   * - Peer group definition (similar profile characteristics)
   * - Funding range (min/max/average)
   * - Success rate comparison (peer avg vs student predicted)
   * - Number of students in peer group
   *
   * Privacy: All data is anonymized and aggregated
   *
   * @returns Peer benchmark data or null if no peers found
   */
  getPeerBenchmark: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId;

    // Verify student exists
    const student = await ctx.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Student profile not found",
      });
    }

    const benchmark = await getPeerBenchmark(studentId);

    return benchmark;
  }),

  /**
   * Get achievement badges for authenticated student
   *
   * Returns:
   * - Unlocked badges with unlock dates
   * - Locked badges with criteria to unlock
   *
   * @returns Badges object with unlocked and locked arrays
   */
  getAchievements: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId;

    // Verify student exists
    const student = await ctx.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Student profile not found",
      });
    }

    const badges = await getBadgesForStudent(studentId);

    return badges;
  }),

  /**
   * Get projected funding with optional goal improvements
   *
   * Returns:
   * - Current projected funding
   * - Projected funding after completing active goals (optional)
   *
   * @param includeGoals - Whether to calculate "after improvements" scenario
   * @returns Funding projections
   */
  getProjectedFunding: protectedProcedure
    .input(
      z.object({
        includeGoals: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const studentId = ctx.userId;

      // Verify student exists
      const student = await ctx.prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student profile not found",
        });
      }

      const projections = await calculateProjectedFunding(
        studentId,
        input.includeGoals
      );

      return projections;
    }),

  /**
   * Manually trigger badge check and award
   *
   * This is typically called automatically by the snapshot generation job,
   * but can be triggered manually after profile updates for immediate feedback.
   *
   * @returns Array of newly unlocked badge types
   */
  checkBadges: protectedProcedure.mutation(async ({ ctx }) => {
    const studentId = ctx.userId;

    // Verify student exists
    const student = await ctx.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Student profile not found",
      });
    }

    const newlyUnlocked = await checkAndAwardBadges(studentId);

    return {
      success: true,
      newlyUnlocked,
      count: newlyUnlocked.length,
    };
  }),
});
