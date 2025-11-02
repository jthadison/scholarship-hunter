/**
 * Scholarship Router (tRPC)
 *
 * Provides type-safe API endpoints for scholarship operations:
 * - search: Full-text search with filters, sort, and pagination
 * - getById: Get single scholarship details
 *
 * @module server/routers/scholarship
 */

import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '../db'
import { getScholarshipsIndex } from '../lib/search/meilisearch-client'
import { buildMeilisearchFilter, getSortField } from '../lib/search/build-filter'

/**
 * Scholarship router with search and detail procedures
 */
export const scholarshipRouter = router({
  /**
   * Search scholarships with natural language query, filters, and sorting
   *
   * Uses Meilisearch for fast, typo-tolerant full-text search (<100ms).
   * Enriches results with student match data for authenticated users.
   *
   * @input query - Natural language search query (e.g., "STEM scholarships for women")
   * @input filters - Multi-dimensional filters (award range, deadline, tags, etc.)
   * @input sort - Sort option: 'match' (relevance), 'amount', 'deadline', 'strategicValue'
   * @input limit - Number of results per page (default: 20, max: 100)
   * @input offset - Pagination offset (default: 0)
   *
   * @returns Scholarships array with match data (if authenticated) and total count
   */
  search: publicProcedure
    .input(
      z.object({
        // Search query (optional - can browse all with filters only)
        query: z.string().optional(),

        // Multi-dimensional filters
        filters: z
          .object({
            // Award amount range
            minAward: z.number().min(0).optional(),
            maxAward: z.number().min(0).optional(),

            // Deadline date range
            minDeadline: z.date().optional(),
            maxDeadline: z.date().optional(),

            // Tags (e.g., ['STEM', 'Women', 'Financial Need'])
            tags: z.array(z.string()).optional(),

            // Category filter
            category: z.string().optional(),

            // Priority tier filter (requires authentication) - multi-select
            priorityTier: z
              .array(z.enum(['MUST_APPLY', 'SHOULD_APPLY', 'IF_TIME_PERMITS', 'HIGH_VALUE_REACH']))
              .optional(),

            // Match score minimum (requires authentication)
            minMatchScore: z.number().min(0).max(100).optional(),

            // Effort level filter
            effortLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),

            // Major/field filter
            major: z.string().optional(),
          })
          .optional(),

        // Sort option
        sort: z.enum(['match', 'amount', 'deadline', 'strategicValue']).default('match'),

        // Pagination
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const { query, filters, sort, limit, offset } = input

      try {
        // Build Meilisearch filter string from input filters
        const filterString = filters ? buildMeilisearchFilter(filters) : ''

        // Build sort field
        const sortField = getSortField(sort)

        // Execute Meilisearch search
        const index = getScholarshipsIndex()
        const searchResults = await index.search(query || '', {
          filter: filterString || undefined,
          sort: sortField ? [sortField] : undefined,
          limit,
          offset,
        })

        // Extract scholarship IDs from search results
        const scholarshipIds = searchResults.hits.map((hit) => (hit as { id: string }).id)

        if (scholarshipIds.length === 0) {
          return {
            scholarships: [],
            total: 0,
            hasMore: false,
          }
        }

        // Fetch full scholarship data from Prisma
        const scholarships = await prisma.scholarship.findMany({
          where: {
            id: { in: scholarshipIds },
          },
          include: {
            // Include match data if user is authenticated
            matches: ctx.userId
              ? {
                  where: { studentId: ctx.userId },
                  select: {
                    overallMatchScore: true,
                    priorityTier: true,
                    strategicValue: true,
                    successProbability: true,
                    applicationEffort: true,
                  },
                }
              : false,
          },
        })

        // Sort scholarships to match Meilisearch order
        const scholarshipsMap = new Map(scholarships.map((s) => [s.id, s]))
        const orderedScholarships = scholarshipIds
          .map((id) => scholarshipsMap.get(id))
          .filter((s) => s !== undefined)

        // Apply client-side filters that depend on Match data
        let filteredScholarships = orderedScholarships

        // Filter by priority tier (requires Match data) - multi-select
        if (filters?.priorityTier && filters.priorityTier.length > 0 && ctx.userId) {
          filteredScholarships = filteredScholarships.filter((s) => {
            const match = s.matches?.[0]
            return match && filters.priorityTier!.includes(match.priorityTier)
          })
        }

        // Filter by minimum match score (requires Match data)
        if (filters?.minMatchScore !== undefined && ctx.userId) {
          filteredScholarships = filteredScholarships.filter((s) => {
            const match = s.matches?.[0]
            return match && match.overallMatchScore >= filters.minMatchScore!
          })
        }

        // Filter by effort level
        if (filters?.effortLevel) {
          filteredScholarships = filteredScholarships.filter((s) => {
            const match = s.matches?.[0]
            return match?.applicationEffort === filters.effortLevel
          })
        }

        // Filter by major/field
        if (filters?.major) {
          filteredScholarships = filteredScholarships.filter((s) => {
            // Check if scholarship tags or category include the major
            const tagsInclude = s.tags?.some((tag) =>
              (tag as string).toLowerCase().includes(filters.major!.toLowerCase())
            )
            const categoryInclude = s.category
              ?.toLowerCase()
              .includes(filters.major!.toLowerCase())
            return tagsInclude || categoryInclude
          })
        }

        // Apply strategic value sort if needed
        if (sort === 'strategicValue' && ctx.userId) {
          filteredScholarships.sort((a, b) => {
            const aValue = a.matches?.[0]?.strategicValue ?? 0
            const bValue = b.matches?.[0]?.strategicValue ?? 0
            return bValue - aValue // Descending order
          })
        }

        return {
          scholarships: filteredScholarships,
          total: searchResults.estimatedTotalHits ?? 0,
          hasMore: offset + limit < (searchResults.estimatedTotalHits ?? 0),
        }
      } catch (error) {
        console.error('Meilisearch error, falling back to Prisma:', error)

        // Fallback to Prisma when Meilisearch is unavailable
        try {
          const whereConditions: any = {}

          // Add text search conditions
          if (query) {
            whereConditions.OR = [
              { name: { contains: query, mode: 'insensitive' } },
              { provider: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ]
          }

          // Add filter conditions
          if (filters?.minAward) {
            whereConditions.awardAmount = { ...whereConditions.awardAmount, gte: filters.minAward }
          }
          if (filters?.maxAward) {
            whereConditions.awardAmount = { ...whereConditions.awardAmount, lte: filters.maxAward }
          }
          if (filters?.category) {
            whereConditions.category = filters.category
          }

          // Build orderBy based on sort option
          const orderBy: any = []
          if (sort === 'amount') {
            orderBy.push({ awardAmount: 'desc' })
          } else if (sort === 'deadline') {
            orderBy.push({ deadline: 'asc' })
          } else {
            // Default to name for relevance sort
            orderBy.push({ name: 'asc' })
          }

          // Get total count
          const total = await prisma.scholarship.count({ where: whereConditions })

          // Get scholarships with pagination
          const scholarships = await prisma.scholarship.findMany({
            where: whereConditions,
            include: {
              matches: ctx.userId
                ? {
                    where: { studentId: ctx.userId },
                    select: {
                      overallMatchScore: true,
                      priorityTier: true,
                      strategicValue: true,
                      successProbability: true,
                      applicationEffort: true,
                    },
                  }
                : false,
            },
            orderBy,
            take: limit,
            skip: offset,
          })

          // Apply client-side filters that depend on Match data
          let filteredScholarships = scholarships

          // Filter by priority tier (requires Match data)
          if (filters?.priorityTier && filters.priorityTier.length > 0 && ctx.userId) {
            filteredScholarships = filteredScholarships.filter((s) => {
              const match = s.matches?.[0]
              return match && filters.priorityTier!.includes(match.priorityTier)
            })
          }

          // Filter by minimum match score
          if (filters?.minMatchScore !== undefined && ctx.userId) {
            filteredScholarships = filteredScholarships.filter((s) => {
              const match = s.matches?.[0]
              return match && match.overallMatchScore >= filters.minMatchScore!
            })
          }

          // Filter by effort level
          if (filters?.effortLevel) {
            filteredScholarships = filteredScholarships.filter((s) => {
              const match = s.matches?.[0]
              return match?.applicationEffort === filters.effortLevel
            })
          }

          // Apply strategic value sort if needed
          if (sort === 'strategicValue' && ctx.userId) {
            filteredScholarships.sort((a, b) => {
              const aValue = a.matches?.[0]?.strategicValue ?? 0
              const bValue = b.matches?.[0]?.strategicValue ?? 0
              return bValue - aValue
            })
          }

          return {
            scholarships: filteredScholarships,
            total,
            hasMore: offset + limit < total,
          }
        } catch (fallbackError) {
          console.error('Prisma fallback error:', fallbackError)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to search scholarships. Please try again.',
          })
        }
      }
    }),

  /**
   * Get single scholarship by ID
   *
   * @input id - Scholarship ID
   * @returns Scholarship with match data (if authenticated)
   */
  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const scholarship = await prisma.scholarship.findUnique({
        where: { id: input.id },
        include: {
          matches: ctx.userId
            ? {
                where: { studentId: ctx.userId },
                select: {
                  overallMatchScore: true,
                  priorityTier: true,
                  strategicValue: true,
                  successProbability: true,
                  applicationEffort: true,
                  effortBreakdown: true,
                },
              }
            : false,
        },
      })

      if (!scholarship) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Scholarship not found',
        })
      }

      return scholarship
    }),
})
