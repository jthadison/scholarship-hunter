/**
 * Gap Analysis Router (tRPC)
 *
 * Provides type-safe API endpoints for gap analysis operations:
 * - analyze: Run complete gap analysis for student
 * - getImpact: Get projected impact of hypothetical changes (simulator)
 * - compareToHistory: Show progress since last analysis
 * - getHistory: Get previous analysis snapshots
 *
 * Story: 5.3 - Gap Analysis - Profile Improvement Recommendations
 * @module server/routers/gap-analysis
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import {
  findReachScholarships,
  compareProfileToRequirements,
  calculateGapImpact,
  aggregateGaps,
  prioritizeGapsByImpact,
  calculateImpactSummary,
} from '@/lib/gap-analysis/analyzer'
import { generateRoadmap } from '@/lib/gap-analysis/roadmap'
import {
  projectProfileStrength,
  projectWithHypotheticalChanges,
} from '@/lib/gap-analysis/projector'
import type { Gap, GapAnalysisResult } from '@/lib/gap-analysis/types'
import type { StudentWithProfile } from '@/lib/matching/hard-filter'
import type { Prisma } from '@prisma/client'

/**
 * Hypothetical changes schema for simulator
 */
const HypotheticalChangesSchema = z.object({
  gpa: z.number().min(0).max(4.0).optional(),
  satScore: z.number().min(400).max(1600).optional(),
  actScore: z.number().min(1).max(36).optional(),
  volunteerHours: z.number().min(0).max(5000).optional(),
  hasLeadership: z.boolean().optional(),
  leadershipCount: z.number().min(0).max(10).optional(),
  extracurricularCount: z.number().min(0).max(20).optional(),
})

/**
 * Gap analysis router with query and mutation procedures
 */
export const gapAnalysisRouter = router({
  /**
   * Run complete gap analysis for authenticated student
   *
   * Identifies gaps between current profile and reach scholarship requirements,
   * generates improvement roadmap, projects future profile strength, and
   * calculates impact summary.
   *
   * Results cached for 24 hours (invalidated when profile updates).
   *
   * @returns Complete gap analysis result
   */
  analyze: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    // Fetch student with profile
    const student = await ctx.prisma.student.findUnique({
      where: { userId: ctx.userId },
      include: {
        profile: true,
      },
    })

    if (!student || !student.profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student profile not found. Please complete your profile first.',
      })
    }

    // Check profile completion
    const completionPercentage = student.profile.completionPercentage || 0
    if (completionPercentage < 50) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message:
          'Profile must be at least 50% complete to run gap analysis. Please complete more profile sections.',
      })
    }

    // TODO: Check cache for existing analysis (implement Redis caching)
    // For now, run fresh analysis each time

    // Fetch all scholarships
    const allScholarships = await ctx.prisma.scholarship.findMany({
      where: {
        verified: true,
        deadline: {
          gte: new Date(), // Only future/active scholarships
        },
      },
    })

    if (allScholarships.length === 0) {
      // No scholarships available - return empty result
      return {
        gaps: [],
        roadmap: {
          easy: [],
          moderate: [],
          longTerm: [],
          totalTimelineMonths: 0,
          recommendedSequence: [],
        },
        projection: {
          current: student.profile.strengthScore || 0,
          projected: student.profile.strengthScore || 0,
          increase: 0,
          currentBreakdown: {
            academic: 0,
            experience: 0,
            leadership: 0,
            demographics: 0,
          },
          projectedBreakdown: {
            academic: 0,
            experience: 0,
            leadership: 0,
            demographics: 0,
          },
          currentMatches: 0,
          projectedMatches: 0,
          additionalMatches: 0,
          currentFundingPotential: 0,
          projectedFundingPotential: 0,
          additionalFunding: 0,
        },
        impactSummary: {
          scholarshipsUnlockable: 0,
          potentialFunding: 0,
          averageAward: 0,
          totalGaps: 0,
          gapsByAchievability: {
            easy: 0,
            moderate: 0,
            longTerm: 0,
          },
        },
        analyzedAt: new Date(),
      } as GapAnalysisResult
    }

    // Find reach scholarships (high-value opportunities where student has gaps)
    const reachScholarships = findReachScholarships(
      student as StudentWithProfile,
      allScholarships
    )

    // Identify all gaps across reach scholarships
    const allGaps: Gap[] = []
    for (const scholarship of reachScholarships) {
      const gaps = compareProfileToRequirements(
        student.profile,
        scholarship,
        student as StudentWithProfile
      )
      allGaps.push(...gaps)
    }

    // Aggregate similar gaps
    const aggregatedGaps = aggregateGaps(allGaps)

    // Calculate impact for each gap
    const gapsWithImpact = aggregatedGaps.map((gap) =>
      calculateGapImpact(gap, aggregatedGaps, reachScholarships)
    )

    // Prioritize by impact
    const prioritizedGaps = prioritizeGapsByImpact(gapsWithImpact)

    // Generate roadmap
    const roadmap = generateRoadmap(prioritizedGaps, student.profile)

    // Project profile strength with improvements
    const projection = projectProfileStrength(
      student.profile,
      prioritizedGaps,
      student as StudentWithProfile,
      allScholarships
    )

    // Calculate impact summary
    const impactSummary = calculateImpactSummary(prioritizedGaps)

    // Build result
    const result: GapAnalysisResult = {
      gaps: prioritizedGaps,
      roadmap,
      projection,
      impactSummary,
      analyzedAt: new Date(),
    }

    // Save snapshot to database
    await ctx.prisma.gapAnalysisSnapshot.create({
      data: {
        studentId,
        analysisDate: new Date(),
        gaps: prioritizedGaps as unknown as Prisma.JsonArray,
        profileStrengthCurrent: projection.current,
        profileStrengthProjected: projection.projected,
        scholarshipsUnlockable: impactSummary.scholarshipsUnlockable,
        potentialFunding: impactSummary.potentialFunding,
        roadmap: roadmap as unknown as Prisma.JsonObject,
      },
    })

    return result
  }),

  /**
   * Get projected impact of hypothetical profile changes
   *
   * Used by interactive simulator to show real-time impact of adjusting
   * profile values (e.g., "What if I raise my GPA to 3.6?")
   *
   * @param changes - Hypothetical changes to apply
   * @returns Projected impact (strength, scholarships, funding)
   */
  getImpact: protectedProcedure
    .input(
      z.object({
        hypotheticalChanges: HypotheticalChangesSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      // Fetch student with profile
      const student = await ctx.prisma.student.findUnique({
        where: { userId: ctx.userId },
        include: {
          profile: true,
        },
      })

      if (!student || !student.profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student profile not found',
        })
      }

      // Fetch all scholarships
      const allScholarships = await ctx.prisma.scholarship.findMany({
        where: {
          verified: true,
          deadline: {
            gte: new Date(),
          },
        },
      })

      // Project with hypothetical changes
      const result = projectWithHypotheticalChanges(
        student.profile,
        input.hypotheticalChanges,
        student as StudentWithProfile,
        allScholarships
      )

      return result
    }),

  /**
   * Compare current profile to previous gap analysis
   *
   * Shows progress since last analysis: gaps closed, new scholarships
   * unlocked, profile strength improvement.
   *
   * @returns Progress comparison or null if no previous analysis
   */
  compareToHistory: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    // Get latest snapshot
    const latestSnapshot = await ctx.prisma.gapAnalysisSnapshot.findFirst({
      where: { studentId },
      orderBy: { analysisDate: 'desc' },
    })

    if (!latestSnapshot) {
      return null // No previous analysis
    }

    // Get current profile strength
    const student = await ctx.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        profile: {
          select: {
            strengthScore: true,
          },
        },
      },
    })

    if (!student || !student.profile) {
      return null
    }

    const currentStrength = student.profile.strengthScore || 0
    const previousStrength = latestSnapshot.profileStrengthCurrent

    // Calculate days since last analysis
    const daysSince = Math.floor(
      (Date.now() - latestSnapshot.analysisDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // TODO: Calculate gaps closed by comparing previous gaps to current profile
    // For now, use profile strength change as proxy
    const strengthImprovement = currentStrength - previousStrength
    const estimatedGapsClosed = strengthImprovement > 5 ? Math.floor(strengthImprovement / 10) : 0

    return {
      lastAnalysisDate: latestSnapshot.analysisDate,
      daysSince,
      profileStrengthChange: currentStrength - previousStrength,
      gapsClosed: estimatedGapsClosed,
      gapsRemaining: 0, // TODO: Calculate from current analysis
      newScholarshipsUnlocked: 0, // TODO: Re-run matching to compare
      closedGaps: [], // TODO: Identify which specific gaps were closed
      emergingGaps: [], // TODO: Identify new high-value scholarships added
    }
  }),

  /**
   * Get gap analysis history for student
   *
   * Returns all previous gap analysis snapshots for tracking progress over time.
   *
   * @returns Array of historical snapshots
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    const snapshots = await ctx.prisma.gapAnalysisSnapshot.findMany({
      where: { studentId },
      orderBy: { analysisDate: 'desc' },
      take: 10, // Limit to last 10 analyses
    })

    return snapshots
  }),
})
