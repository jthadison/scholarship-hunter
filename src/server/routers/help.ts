/**
 * Story 5.10: Platform-Wide Search & Help System - Help Router
 *
 * Context-sensitive help system with help articles and AI-powered assistant.
 *
 * @module server/routers/help
 */

import { z } from 'zod'
import { router, protectedProcedure, publicProcedure } from '../trpc'
import { prisma } from '../db'
import { TRPCError } from '@trpc/server'
import { getContextualHelpArticles } from '../lib/help/help-context'
import { askAIAssistant } from '../lib/help/ai-help'

/**
 * Help category enum
 */
const HelpCategorySchema = z.enum([
  'GETTING_STARTED',
  'SCHOLARSHIPS',
  'APPLICATIONS',
  'ESSAYS',
  'DOCUMENTS',
  'ANALYTICS',
  'TROUBLESHOOTING',
])

export const helpRouter = router({
  /**
   * Get contextual help articles based on current route
   */
  getContextualArticles: publicProcedure
    .input(
      z.object({
        route: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { route } = input

      // Get relevant article slugs for this route
      const articleSlugs = getContextualHelpArticles(route)

      // Fetch articles from database
      const articles = await prisma.helpArticle.findMany({
        where: {
          slug: { in: articleSlugs },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          category: true,
          order: true,
        },
        orderBy: {
          order: 'asc',
        },
        take: 5, // Max 5 contextual articles
      })

      return articles
    }),

  /**
   * Get all help articles (optionally filtered by category)
   */
  getAllArticles: publicProcedure
    .input(
      z
        .object({
          category: HelpCategorySchema.optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const where = input?.category ? { category: input.category } : {}

      const articles = await prisma.helpArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          category: true,
          order: true,
        },
        orderBy: [{ category: 'asc' }, { order: 'asc' }],
      })

      return articles
    }),

  /**
   * Get a single help article by slug
   */
  getArticleBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ input }) => {
      const article = await prisma.helpArticle.findUnique({
        where: { slug: input.slug },
        include: {
          feedback: {
            select: {
              helpful: true,
            },
          },
        },
      })

      if (!article) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Help article not found',
        })
      }

      // Calculate feedback stats
      const totalFeedback = article.feedback.length
      const helpfulCount = article.feedback.filter((f) => f.helpful).length
      const helpfulPercentage =
        totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : null

      // Get related articles
      const relatedArticles = await prisma.helpArticle.findMany({
        where: {
          id: { in: article.relatedArticleIds },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
        },
      })

      return {
        ...article,
        feedbackStats: {
          totalFeedback,
          helpfulCount,
          helpfulPercentage,
        },
        relatedArticles,
      }
    }),

  /**
   * Search help articles by keywords
   */
  searchArticles: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const { query } = input

      const articles = await prisma.helpArticle.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { keywords: { has: query.toLowerCase() } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          category: true,
        },
        take: 10,
      })

      return articles
    }),

  /**
   * Ask AI help assistant a question
   */
  askAI: protectedProcedure
    .input(
      z.object({
        question: z.string().min(3).max(500),
      })
    )
    .mutation(async ({ input }) => {
      const { question } = input

      try {
        // Use AI assistant to answer question
        const response = await askAIAssistant(question)

        return response
      } catch (error) {
        console.error('AI help assistant error:', error)

        // Fallback to keyword search if AI fails
        const articles = await prisma.helpArticle.findMany({
          where: {
            OR: [
              { title: { contains: question, mode: 'insensitive' } },
              { description: { contains: question, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
          },
          take: 5,
        })

        return {
          answer: 'I couldn\'t process your question, but here are some related help articles:',
          articles: articles.map((a) => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            description: a.description,
          })),
          relatedQuestions: [],
        }
      }
    }),

  /**
   * Submit feedback on help article
   */
  submitFeedback: protectedProcedure
    .input(
      z.object({
        articleId: z.string(),
        helpful: z.boolean(),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { articleId, helpful, comment } = input
      const studentId = ctx.userId

      // Check if article exists
      const article = await prisma.helpArticle.findUnique({
        where: { id: articleId },
      })

      if (!article) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Help article not found',
        })
      }

      // Create feedback
      await prisma.helpFeedback.create({
        data: {
          helpArticleId: articleId,
          studentId,
          helpful,
          comment,
        },
      })

      return { success: true }
    }),
})
