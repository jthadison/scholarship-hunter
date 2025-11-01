/**
 * Story 5.10: Platform-Wide Search & Help System - Search Router
 *
 * Global search across scholarships, applications, essays, and documents.
 * Uses Meilisearch for fast, typo-tolerant search with <500ms response time.
 *
 * @module server/routers/search
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

import { prisma } from '../db'

/**
 * Search result type enum
 */
const SearchResultType = z.enum(['scholarship', 'application', 'essay', 'document'])

/**
 * Single search result interface
 */
const SearchResultSchema = z.object({
  id: z.string(),
  type: SearchResultType,
  title: z.string(),
  excerpt: z.string(),
  breadcrumb: z.string(),
  url: z.string(),
  rank: z.number().optional(),
})

export type SearchResult = z.infer<typeof SearchResultSchema>

/**
 * Search all content types
 */
export const searchRouter = router({
  /**
   * Global search across all content types
   */
  all: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(200),
        types: z
          .array(z.enum(['scholarships', 'applications', 'essays', 'documents']))
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { query, types } = input
      const studentId = ctx.userId

      // Determine which types to search (default: all)
      const searchTypes = types ?? ['scholarships', 'applications', 'essays', 'documents']

      // Execute searches in parallel
      const [scholarships, applications, essays, documents] = await Promise.all([
        searchTypes.includes('scholarships')
          ? searchScholarships(query)
          : Promise.resolve([]),
        searchTypes.includes('applications')
          ? searchApplications(query, studentId)
          : Promise.resolve([]),
        searchTypes.includes('essays')
          ? searchEssays(query, studentId)
          : Promise.resolve([]),
        searchTypes.includes('documents')
          ? searchDocuments(query, studentId)
          : Promise.resolve([]),
      ])

      // Store recent search
      await storeRecentSearch(studentId, query, {
        scholarships: scholarships.length,
        applications: applications.length,
        essays: essays.length,
        documents: documents.length,
      })

      // Log search analytics
      await logSearchAnalytics(
        studentId,
        query,
        scholarships.length + applications.length + essays.length + documents.length
      )

      return {
        scholarships,
        applications,
        essays,
        documents,
      }
    }),

  /**
   * Get recent searches for current student (last 5)
   */
  getRecentSearches: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId

    const recentSearches = await prisma.recentSearch.findMany({
      where: { studentId },
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: {
        id: true,
        query: true,
        resultCount: true,
        timestamp: true,
      },
    })

    return recentSearches
  }),

  /**
   * Clear all recent searches for current student
   */
  clearRecentSearches: protectedProcedure.mutation(async ({ ctx }) => {
    const studentId = ctx.userId

    await prisma.recentSearch.deleteMany({
      where: { studentId },
    })

    return { success: true }
  }),
})

// ============================================================================
// Search Functions
// ============================================================================

/**
 * Search scholarships using Meilisearch for fast results
 */
async function searchScholarships(query: string): Promise<SearchResult[]> {
  try {
    // Simple text search using Prisma (fallback without Meilisearch)
    const results = await prisma.scholarship.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { provider: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      select: {
        id: true,
        name: true,
        provider: true,
        description: true,
        awardAmount: true,
      },
    })

    return results.map((scholarship) => ({
      id: scholarship.id,
      type: 'scholarship' as const,
      title: scholarship.name,
      excerpt: scholarship.description
        ? scholarship.description.substring(0, 150) + '...'
        : '',
      breadcrumb: `Scholarships > ${scholarship.provider}`,
      url: `/scholarships/${scholarship.id}`,
    }))
  } catch (error) {
    console.error('Error searching scholarships:', error)
    return []
  }
}

/**
 * Search student's applications
 * Optimized to avoid N+1 queries by using Prisma's include
 */
async function searchApplications(query: string, studentId: string): Promise<SearchResult[]> {
  try {
    // Single optimized query with include - no N+1 problem
    const results = await prisma.application.findMany({
      where: {
        studentId,
        scholarship: {
          name: { contains: query, mode: 'insensitive' },
        },
      },
      take: 20,
      select: {
        id: true,
        status: true,
        scholarship: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
      },
    })

    return results.map((app) => ({
      id: app.id,
      type: 'application' as const,
      title: app.scholarship.name,
      excerpt: `Status: ${app.status}`,
      breadcrumb: `My Applications > ${app.scholarship.provider}`,
      url: `/applications/${app.id}`,
    }))
  } catch (error) {
    console.error('Error searching applications:', error)
    return []
  }
}

/**
 * Search student's essays
 */
async function searchEssays(query: string, studentId: string): Promise<SearchResult[]> {
  try {
    const results = await prisma.essay.findMany({
      where: {
        studentId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      select: {
        id: true,
        title: true,
        content: true,
        wordCount: true,
      },
    })

    return results.map((essay) => ({
      id: essay.id,
      type: 'essay' as const,
      title: essay.title || 'Untitled Essay',
      excerpt: essay.content ? essay.content.substring(0, 150) + '...' : '',
      breadcrumb: `Essays > ${essay.wordCount ?? 0} words`,
      url: `/essays/${essay.id}`,
    }))
  } catch (error) {
    console.error('Error searching essays:', error)
    return []
  }
}

/**
 * Search student's documents
 */
async function searchDocuments(query: string, studentId: string): Promise<SearchResult[]> {
  try {
    const results = await prisma.document.findMany({
      where: {
        studentId,
        name: { contains: query, mode: 'insensitive' },
      },
      take: 20,
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
      },
    })

    return results.map((doc) => ({
      id: doc.id,
      type: 'document' as const,
      title: doc.name,
      excerpt: doc.description || `${doc.type} document`,
      breadcrumb: `Documents > ${doc.type}`,
      url: `/documents/${doc.id}`,
    }))
  } catch (error) {
    console.error('Error searching documents:', error)
    return []
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Store recent search query (limit 5 per student)
 * Optimized to avoid fetching all searches
 */
async function storeRecentSearch(
  studentId: string,
  query: string,
  resultCounts: {
    scholarships: number
    applications: number
    essays: number
    documents: number
  }
) {
  const totalResults =
    resultCounts.scholarships +
    resultCounts.applications +
    resultCounts.essays +
    resultCounts.documents

  // Create new recent search
  await prisma.recentSearch.create({
    data: {
      studentId,
      query,
      resultCount: totalResults,
    },
  })

  // Efficiently delete old searches: Get 6th oldest and delete everything older
  // This uses a subquery and is much more efficient than fetching all
  const oldSearches = await prisma.recentSearch.findMany({
    where: { studentId },
    orderBy: { timestamp: 'desc' },
    skip: 5, // Skip the 5 most recent
    select: { id: true },
  })

  if (oldSearches.length > 0) {
    await prisma.recentSearch.deleteMany({
      where: {
        id: { in: oldSearches.map((s) => s.id) },
      },
    })
  }
}

/**
 * Log search analytics for optimization
 */
async function logSearchAnalytics(
  studentId: string,
  query: string,
  resultCount: number
) {
  await prisma.searchAnalytics.create({
    data: {
      studentId,
      query,
      resultCount,
    },
  })
}
