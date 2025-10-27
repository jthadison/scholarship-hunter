/**
 * Matching Router (tRPC)
 *
 * Provides type-safe API endpoints for scholarship matching operations:
 * - getMatches: Fetch student's match scores with filtering
 * - getMatchAnalysis: Get/calculate match for specific scholarship
 * - recalculateMatches: Trigger match recalculation for student
 *
 * @module server/routers/matching
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { calculateMatchScore, calculateMatchScoresBatch } from '../lib/matching/calculate-match-score'
import { prisma } from '../db'

/**
 * Matching router with procedures for match score operations
 */
export const matchingRouter = router({
  /**
   * Get all matches for a student with optional filtering
   *
   * Returns existing matches from database. If matches don't exist for scholarships,
   * they must be calculated first via recalculateMatches or getMatchAnalysis.
   *
   * @input studentId - Student to fetch matches for
   * @input filters.minScore - Minimum overall match score (0-100)
   * @input filters.priorityTier - Filter by priority tier
   * @input limit - Max number of results (default: 50)
   * @input offset - Pagination offset (default: 0)
   *
   * @returns Array of Match records with scholarship details
   */
  getMatches: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        filters: z
          .object({
            minScore: z.number().min(0).max(100).optional(),
            priorityTier: z
              .enum(['MUST_APPLY', 'SHOULD_APPLY', 'IF_TIME_PERMITS', 'HIGH_VALUE_REACH'])
              .optional(),
            // Story 2.6: Strategic value filters
            strategicValueTier: z
              .enum(['BEST_BET', 'HIGH_VALUE', 'MEDIUM_VALUE', 'LOW_VALUE'])
              .optional(),
            minStrategicValue: z.number().min(0).max(10).optional(),
          })
          .optional(),
        // Story 2.6: Sort by strategic value
        sortBy: z.enum(['matchScore', 'strategicValue', 'deadline']).default('matchScore'),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const { studentId, filters, sortBy, limit, offset } = input

      // Verify student belongs to authenticated user
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { userId: true },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Student ${studentId} not found`,
        })
      }

      if (student.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only view your own matches',
        })
      }

      // Build filter conditions
      const where: any = {
        studentId,
      }

      if (filters?.minScore !== undefined) {
        where.overallMatchScore = { gte: filters.minScore }
      }

      if (filters?.priorityTier) {
        where.priorityTier = filters.priorityTier
      }

      // Story 2.6: Strategic value filters
      if (filters?.strategicValueTier) {
        where.strategicValueTier = filters.strategicValueTier
      }

      if (filters?.minStrategicValue !== undefined) {
        where.strategicValue = { gte: filters.minStrategicValue }
      }

      // Story 2.6: Determine sort order
      let orderBy: any
      if (sortBy === 'strategicValue') {
        orderBy = { strategicValue: 'desc' }
      } else if (sortBy === 'deadline') {
        orderBy = { scholarship: { deadline: 'asc' } }
      } else {
        orderBy = { overallMatchScore: 'desc' }
      }

      // Fetch matches with scholarship details
      const matches = await prisma.match.findMany({
        where,
        include: {
          scholarship: {
            select: {
              id: true,
              name: true,
              provider: true,
              awardAmount: true,
              awardAmountMax: true,
              deadline: true,
              description: true,
              website: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      })

      // Get total count for pagination
      const totalCount = await prisma.match.count({ where })

      return {
        matches,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      }
    }),

  /**
   * Get or calculate match analysis for a specific student-scholarship pair
   *
   * Returns existing match from database if fresh (< 24 hours old).
   * Otherwise, recalculates on-demand and stores result.
   *
   * @input studentId - Student to analyze
   * @input scholarshipId - Scholarship to analyze against
   *
   * @returns Match record with detailed dimensional scores
   */
  getMatchAnalysis: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        scholarshipId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { studentId, scholarshipId } = input

      // Verify student belongs to authenticated user
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { profile: true },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Student ${studentId} not found`,
        })
      }

      if (student.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only view your own match analysis',
        })
      }

      // Check for existing match
      const existingMatch = await prisma.match.findUnique({
        where: {
          studentId_scholarshipId: {
            studentId,
            scholarshipId,
          },
        },
        include: {
          scholarship: true,
        },
      })

      // If match exists and is fresh (< 24 hours), return it
      const CACHE_TTL_HOURS = 24
      const now = new Date()
      const cacheExpiry = new Date(now.getTime() - CACHE_TTL_HOURS * 60 * 60 * 1000)

      if (existingMatch && existingMatch.calculatedAt > cacheExpiry) {
        return existingMatch
      }

      // Fetch scholarship for calculation
      const scholarship = await prisma.scholarship.findUnique({
        where: { id: scholarshipId },
      })

      if (!scholarship) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Scholarship ${scholarshipId} not found`,
        })
      }

      // Calculate fresh match score
      const matchScore = await calculateMatchScore(student, scholarship)

      // Upsert match record
      const match = await prisma.match.upsert({
        where: {
          studentId_scholarshipId: {
            studentId,
            scholarshipId,
          },
        },
        create: {
          studentId,
          scholarshipId,
          ...matchScore,
        },
        update: {
          ...matchScore,
        },
        include: {
          scholarship: true,
        },
      })

      return match
    }),

  /**
   * Trigger recalculation of all matches for a student
   *
   * Calculates match scores for all eligible scholarships and stores results.
   * This is an expensive operation - use sparingly (e.g., after profile updates).
   *
   * @input studentId - Student to recalculate matches for
   * @input scholarshipIds - Optional array of specific scholarship IDs to recalculate
   *
   * @returns Count of matches calculated and stored
   */
  recalculateMatches: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        scholarshipIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { studentId, scholarshipIds } = input

      // Verify student belongs to authenticated user
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { profile: true },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Student ${studentId} not found`,
        })
      }

      if (student.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only recalculate your own matches',
        })
      }

      // Fetch scholarships to score
      const whereCondition = scholarshipIds
        ? { id: { in: scholarshipIds } }
        : { verified: true } // Only score verified scholarships by default

      const scholarships = await prisma.scholarship.findMany({
        where: whereCondition,
      })

      if (scholarships.length === 0) {
        return { count: 0, message: 'No scholarships found to calculate' }
      }

      // Calculate all match scores in batch (parallelized for performance)
      const matchScores = await calculateMatchScoresBatch(student, scholarships)

      // Upsert all matches in transaction
      await prisma.$transaction(
        matchScores.map((matchScore, index) =>
          prisma.match.upsert({
            where: {
              studentId_scholarshipId: {
                studentId,
                scholarshipId: scholarships[index]!.id,
              },
            },
            create: {
              studentId,
              scholarshipId: scholarships[index]!.id,
              ...matchScore,
            },
            update: {
              ...matchScore,
            },
          })
        )
      )

      return {
        count: matchScores.length,
        message: `Successfully calculated ${matchScores.length} match scores`,
      }
    }),

  /**
   * Get match statistics for a student
   *
   * Returns summary statistics about student's matches:
   * - Total matches
   * - Average match score
   * - Distribution by priority tier
   * - Top 10 matches
   *
   * @input studentId - Student to get stats for
   *
   * @returns Match statistics object
   */
  getMatchStats: protectedProcedure
    .input(z.object({ studentId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { studentId } = input

      // Verify student belongs to authenticated user
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { userId: true },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Student ${studentId} not found`,
        })
      }

      if (student.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only view your own match statistics',
        })
      }

      // Get all matches
      const matches = await prisma.match.findMany({
        where: { studentId },
        include: {
          scholarship: {
            select: {
              name: true,
              provider: true,
              awardAmount: true,
            },
          },
        },
      })

      if (matches.length === 0) {
        return {
          totalMatches: 0,
          averageScore: 0,
          tierDistribution: {},
          topMatches: [],
        }
      }

      // Calculate statistics
      const totalMatches = matches.length
      const averageScore =
        matches.reduce((sum, m) => sum + m.overallMatchScore, 0) / totalMatches

      // Count by priority tier
      const tierDistribution = matches.reduce(
        (acc, match) => {
          const tier = match.priorityTier
          acc[tier] = (acc[tier] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      // Get top 10 matches
      const topMatches = matches
        .sort((a, b) => b.overallMatchScore - a.overallMatchScore)
        .slice(0, 10)
        .map((match) => ({
          scholarshipId: match.scholarshipId,
          scholarshipName: match.scholarship.name,
          provider: match.scholarship.provider,
          awardAmount: match.scholarship.awardAmount,
          overallMatchScore: match.overallMatchScore,
          priorityTier: match.priorityTier,
        }))

      return {
        totalMatches,
        averageScore: Math.round(averageScore),
        tierDistribution,
        topMatches,
      }
    }),
})
