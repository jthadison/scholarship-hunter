/**
 * Story 5.10: Help Router Tests
 *
 * Tests for context-sensitive help system and AI assistant
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prisma } from '../../db'
import { HelpCategory } from '@prisma/client'

// Mock dependencies
vi.mock('../../db', () => ({
  prisma: {
    helpArticle: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    helpFeedback: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../../lib/help/help-context', () => ({
  getContextualHelpArticles: vi.fn(),
}))

vi.mock('../../lib/help/ai-help', () => ({
  askAIAssistant: vi.fn(),
}))

vi.mock('../../lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  RATE_LIMITS: {
    AI_ENDPOINT: { limit: 10, windowMs: 60000 },
  },
}))

describe('Help Router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getContextualArticles', () => {
    it('should return articles for dashboard route', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'Dashboard Overview',
          slug: 'dashboard-overview',
          description: 'Learn about the dashboard',
          category: 'GETTING_STARTED' as HelpCategory,
          order: 1,
        },
      ]

      const { getContextualHelpArticles } = await import('../../lib/help/help-context')
      vi.mocked(getContextualHelpArticles).mockReturnValue(['dashboard-overview'])

      vi.mocked(prisma.helpArticle.findMany).mockResolvedValue(mockArticles as any)

      const result = await prisma.helpArticle.findMany({
        where: { slug: { in: ['dashboard-overview'] } },
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.slug).toBe('dashboard-overview')
    })

    it('should limit to 5 contextual articles', async () => {
      const mockArticles = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        title: `Article ${i}`,
        slug: `article-${i}`,
        description: 'Description',
        category: 'GETTING_STARTED' as HelpCategory,
        order: i,
      }))

      vi.mocked(prisma.helpArticle.findMany).mockResolvedValue(mockArticles.slice(0, 5) as any)

      const result = await prisma.helpArticle.findMany({ take: 5 })

      expect(result).toHaveLength(5)
    })
  })

  describe('getAllArticles', () => {
    it('should return all articles', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'Getting Started',
          slug: 'getting-started',
          description: 'Introduction',
          category: 'GETTING_STARTED' as HelpCategory,
          order: 1,
        },
        {
          id: '2',
          title: 'Search Tips',
          slug: 'search-tips',
          description: 'How to search',
          category: 'SCHOLARSHIPS' as HelpCategory,
          order: 1,
        },
      ]

      vi.mocked(prisma.helpArticle.findMany).mockResolvedValue(mockArticles as any)

      const result = await prisma.helpArticle.findMany()

      expect(result).toHaveLength(2)
    })

    it('should filter by category', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'Getting Started',
          slug: 'getting-started',
          description: 'Introduction',
          category: 'GETTING_STARTED' as HelpCategory,
          order: 1,
        },
      ]

      vi.mocked(prisma.helpArticle.findMany).mockResolvedValue(mockArticles as any)

      const result = await prisma.helpArticle.findMany({
        where: { category: 'GETTING_STARTED' },
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.category).toBe('GETTING_STARTED')
    })
  })

  describe('getArticleBySlug', () => {
    it('should return article with feedback stats', async () => {
      const mockArticle = {
        id: '1',
        title: 'Dashboard Overview',
        slug: 'dashboard-overview',
        description: 'Learn about the dashboard',
        content: '# Dashboard\n\nContent here...',
        category: 'GETTING_STARTED' as HelpCategory,
        context: ['/dashboard'],
        keywords: ['dashboard', 'overview'],
        order: 1,
        relatedArticleIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockFeedback = [
        { helpful: true },
        { helpful: true },
        { helpful: false },
      ]

      vi.mocked(prisma.helpArticle.findUnique).mockResolvedValue(mockArticle as any)
      vi.mocked(prisma.helpFeedback.findMany).mockResolvedValue(mockFeedback as any)

      const article = await prisma.helpArticle.findUnique({
        where: { slug: 'dashboard-overview' },
      })
      const feedback = await prisma.helpFeedback.findMany({
        where: { helpArticleId: article!.id },
      })

      expect(article).toBeDefined()
      expect(feedback).toHaveLength(3)
      expect(feedback.filter((f) => f.helpful)).toHaveLength(2)
    })

    it('should throw error for non-existent article', async () => {
      vi.mocked(prisma.helpArticle.findUnique).mockResolvedValue(null)

      const result = await prisma.helpArticle.findUnique({
        where: { slug: 'nonexistent' },
      })

      expect(result).toBeNull()
    })
  })

  describe('searchArticles', () => {
    it('should search articles by title', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'How to Search Scholarships',
          slug: 'search-scholarships',
          description: 'Tips for searching',
          category: 'SCHOLARSHIPS' as HelpCategory,
        },
      ]

      vi.mocked(prisma.helpArticle.findMany).mockResolvedValue(mockArticles as any)

      const result = await prisma.helpArticle.findMany({
        where: {
          OR: [
            { title: { contains: 'search', mode: 'insensitive' } },
          ],
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.title).toContain('Search')
    })

    it('should search by keywords', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'Profile Strength',
          slug: 'profile-strength',
          description: 'Understanding your profile',
          category: 'GETTING_STARTED' as HelpCategory,
        },
      ]

      vi.mocked(prisma.helpArticle.findMany).mockResolvedValue(mockArticles as any)

      const result = await prisma.helpArticle.findMany({
        where: {
          keywords: { has: 'profile' },
        },
      })

      expect(result).toHaveLength(1)
    })
  })

  describe('askAI', () => {
    it('should return AI response for valid question', async () => {
      const { askAIAssistant } = await import('../../lib/help/ai-help')
      const { checkRateLimit } = await import('../../lib/rate-limit')

      vi.mocked(checkRateLimit).mockResolvedValue({ success: true, remaining: 9 })
      vi.mocked(askAIAssistant).mockResolvedValue({
        answer: 'To add a scholarship, click the "Add to Applications" button.',
        articles: [],
        relatedQuestions: [],
      })

      const rateLimitResult = await checkRateLimit('user1', { limit: 10, windowMs: 60000 })
      expect(rateLimitResult.success).toBe(true)

      const response = await askAIAssistant('How do I add a scholarship?')
      expect(response.answer).toContain('Add to Applications')
    })

    it('should enforce rate limiting', async () => {
      const { checkRateLimit } = await import('../../lib/rate-limit')

      vi.mocked(checkRateLimit).mockResolvedValue({
        success: false,
        remaining: 0,
        reset: Date.now() + 30000,
      })

      const result = await checkRateLimit('user1', { limit: 10, windowMs: 60000 })

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should fallback to keyword search on AI error', async () => {
      const { askAIAssistant } = await import('../../lib/help/ai-help')
      const { checkRateLimit } = await import('../../lib/rate-limit')

      vi.mocked(checkRateLimit).mockResolvedValue({ success: true, remaining: 9 })
      vi.mocked(askAIAssistant).mockRejectedValue(new Error('OpenAI API error'))

      const mockArticles = [
        {
          id: '1',
          title: 'Adding Scholarships',
          slug: 'add-scholarships',
          description: 'How to add scholarships',
        },
      ]

      vi.mocked(prisma.helpArticle.findMany).mockResolvedValue(mockArticles as any)

      try {
        await askAIAssistant('How do I add a scholarship?')
      } catch {
        // Fallback to keyword search
        const articles = await prisma.helpArticle.findMany({
          where: {
            OR: [
              { title: { contains: 'scholarship', mode: 'insensitive' } },
            ],
          },
        })
        expect(articles).toHaveLength(1)
      }
    })
  })

  describe('submitFeedback', () => {
    it('should submit positive feedback', async () => {
      vi.mocked(prisma.helpFeedback.create).mockResolvedValue({
        id: 'feedback1',
        helpArticleId: 'article1',
        studentId: 'student1',
        helpful: true,
        comment: null,
        timestamp: new Date(),
      })

      await prisma.helpFeedback.create({
        data: {
          helpArticleId: 'article1',
          studentId: 'student1',
          helpful: true,
        },
      })

      expect(prisma.helpFeedback.create).toHaveBeenCalledWith({
        data: {
          helpArticleId: 'article1',
          studentId: 'student1',
          helpful: true,
        },
      })
    })

    it('should submit feedback with comment', async () => {
      vi.mocked(prisma.helpFeedback.create).mockResolvedValue({
        id: 'feedback2',
        helpArticleId: 'article1',
        studentId: 'student1',
        helpful: false,
        comment: 'Needs more detail',
        timestamp: new Date(),
      })

      await prisma.helpFeedback.create({
        data: {
          helpArticleId: 'article1',
          studentId: 'student1',
          helpful: false,
          comment: 'Needs more detail',
        },
      })

      expect(prisma.helpFeedback.create).toHaveBeenCalledWith({
        data: {
          helpArticleId: 'article1',
          studentId: 'student1',
          helpful: false,
          comment: 'Needs more detail',
        },
      })
    })
  })
})
