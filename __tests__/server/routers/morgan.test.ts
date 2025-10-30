/**
 * Morgan Router Unit Tests
 * Story 4.10: Morgan Agent - Essay Strategist Dashboard
 *
 * Tests for:
 * - getEssaySummary (AC1, AC6)
 * - getReusabilitySuggestions (AC4)
 * - getQualityAlerts (AC5)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EssayPhase } from '@prisma/client'
import { morganRouter } from '../../../src/server/routers/morgan'
import { prisma } from '../../../src/server/db'
import { calculateAdaptabilityScore } from '../../../src/server/services/essayAdaptability'

// Mock Prisma Client
vi.mock('../../../src/server/db', () => ({
  prisma: {
    student: {
      findUnique: vi.fn(),
    },
    essay: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    application: {
      findMany: vi.fn(),
    },
  },
}))

// Mock essay adaptability service
vi.mock('../../../src/server/services/essayAdaptability', () => ({
  calculateAdaptabilityScore: vi.fn(),
}))

describe('Morgan Router', () => {
  const mockUserId = 'clx1test1234567890'
  const mockStudentId = 'clx2test1234567890'

  const mockCtx = {
    userId: mockUserId,
    prisma,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEssaySummary', () => {
    it('should return in-progress essays, completed essays, and stats (AC1, AC6)', async () => {
      const mockStudent = {
        id: mockStudentId,
        userId: mockUserId,
      }

      const mockInProgressEssays = [
        {
          id: 'essay1',
          studentId: mockStudentId,
          applicationId: 'app1',
          title: 'Community Service Essay',
          prompt: 'Describe your community service',
          content: 'I volunteer...',
          wordCount: 500,
          phase: EssayPhase.DRAFTING,
          isComplete: false,
          qualityScore: 75,
          updatedAt: new Date('2025-10-28'),
          createdAt: new Date('2025-10-20'),
          application: {
            id: 'app1',
            scholarship: {
              name: 'Community Leaders Scholarship',
              deadline: new Date('2025-12-01'),
            },
          },
          aiGenerated: false,
          aiPromptUsed: null,
          aiModel: null,
          personalized: false,
          qualityAssessment: null,
          promptAnalysis: null,
          promptHash: null,
          discoveryNotes: null,
          outline: null,
          revisionFeedback: null,
          version: 1,
          previousVersionId: null,
          themes: ['leadership', 'community'],
          adaptabilityScores: null,
          clonedFrom: null,
        },
      ]

      const mockCompletedEssays = [
        {
          id: 'essay2',
          title: 'Leadership Essay',
          themes: ['leadership', 'teamwork'],
          qualityScore: 85,
          wordCount: 650,
          createdAt: new Date('2025-10-15'),
          updatedAt: new Date('2025-10-22'),
        },
      ]

      vi.mocked(prisma.student.findUnique).mockResolvedValue(mockStudent as any)
      vi.mocked(prisma.essay.findMany)
        .mockResolvedValueOnce(mockInProgressEssays as any)
        .mockResolvedValueOnce(mockCompletedEssays as any)
      vi.mocked(prisma.essay.count).mockResolvedValue(1) // Weekly drafts

      const caller = morganRouter.createCaller(mockCtx)
      const result = await caller.getEssaySummary({ studentId: mockStudentId })

      expect(result.inProgress).toHaveLength(1)
      expect(result.inProgress[0].title).toBe('Community Service Essay')
      expect(result.inProgress[0].phase).toBe(EssayPhase.DRAFTING)
      expect(result.inProgress[0].scholarshipName).toBe('Community Leaders Scholarship')

      expect(result.completed).toHaveLength(1)
      expect(result.completed[0].title).toBe('Leadership Essay')

      expect(result.stats.weeklyDrafts).toBe(1)
      expect(result.stats.librarySize).toBe(1)
      expect(result.stats.avgQualityScore).toBe(85)
    })

    it('should calculate average quality score correctly', async () => {
      const mockStudent = { id: mockStudentId, userId: mockUserId }

      const mockCompletedEssays = [
        {
          id: 'essay1',
          title: 'Essay 1',
          themes: [],
          qualityScore: 80,
          wordCount: 500,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'essay2',
          title: 'Essay 2',
          themes: [],
          qualityScore: 90,
          wordCount: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'essay3',
          title: 'Essay 3',
          themes: [],
          qualityScore: null, // Should be excluded from average
          wordCount: 400,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.student.findUnique).mockResolvedValue(mockStudent as any)
      vi.mocked(prisma.essay.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockCompletedEssays as any)
      vi.mocked(prisma.essay.count).mockResolvedValue(0)

      const caller = morganRouter.createCaller(mockCtx)
      const result = await caller.getEssaySummary({ studentId: mockStudentId })

      // Average of 80 and 90 = 85
      expect(result.stats.avgQualityScore).toBe(85)
    })

    it('should throw error if user does not own student profile', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue({
        id: mockStudentId,
        userId: 'different_user',
      } as any)

      const caller = morganRouter.createCaller(mockCtx)

      await expect(
        caller.getEssaySummary({ studentId: mockStudentId })
      ).rejects.toThrow('Unauthorized')
    })
  })

  describe('getReusabilitySuggestions', () => {
    it('should return reusability suggestions with adaptability scores >= 70% (AC4)', async () => {
      const mockStudent = { id: mockStudentId, userId: mockUserId }

      const mockLibraryEssays = [
        {
          id: 'essay1',
          title: 'Community Service Essay',
          content: 'I volunteer regularly...',
          prompt: 'Describe your community service',
          themes: ['community', 'leadership'],
          wordCount: 500,
          adaptabilityScores: null,
        },
      ]

      const mockActiveApplications = [
        {
          id: 'app1',
          studentId: mockStudentId,
          scholarshipId: 'schol1',
          status: 'IN_PROGRESS' as const,
          scholarship: {
            id: 'schol1',
            name: 'Leadership Award',
            deadline: new Date('2025-12-15'),
            essayPrompts: [
              {
                question: 'Describe your leadership experience in the community',
                wordLimit: 600,
              },
            ],
          },
          essays: [],
        },
      ]

      vi.mocked(prisma.student.findUnique).mockResolvedValue(mockStudent as any)
      vi.mocked(prisma.essay.findMany).mockResolvedValue(mockLibraryEssays as any)
      vi.mocked(prisma.application.findMany).mockResolvedValue(mockActiveApplications as any)

      // Mock adaptability calculation
      vi.mocked(calculateAdaptabilityScore).mockResolvedValue({
        score: 85,
        confidence: 'high',
        matchingThemes: ['community', 'leadership'],
        wordCountCompatible: true,
        structurallyCompatible: true,
        themeOverlap: 0.8,
        wordCountRatio: 0.9,
        structuralSimilarity: 0.85,
      })

      const caller = morganRouter.createCaller(mockCtx)
      const result = await caller.getReusabilitySuggestions({ studentId: mockStudentId })

      expect(result).toHaveLength(1)
      expect(result[0].essay.title).toBe('Community Service Essay')
      expect(result[0].adaptabilityScore).toBe(85)
      expect(result[0].targetScholarship.name).toBe('Leadership Award')
      expect(result[0].matchingThemes).toContain('community')
      expect(result[0].matchingThemes).toContain('leadership')
    })

    it('should filter out suggestions with adaptability < 70%', async () => {
      const mockStudent = { id: mockStudentId, userId: mockUserId }

      const mockLibraryEssays = [
        {
          id: 'essay1',
          title: 'Sports Essay',
          content: 'I play basketball...',
          prompt: 'Describe your athletic achievements',
          themes: ['sports', 'teamwork'],
          wordCount: 400,
          adaptabilityScores: null,
        },
      ]

      const mockActiveApplications = [
        {
          id: 'app1',
          scholarshipId: 'schol1',
          status: 'TODO' as const,
          scholarship: {
            id: 'schol1',
            name: 'STEM Scholarship',
            deadline: new Date('2025-12-01'),
            essayPrompts: [
              {
                question: 'Describe your passion for science',
                wordLimit: 500,
              },
            ],
          },
          essays: [],
        },
      ]

      vi.mocked(prisma.student.findUnique).mockResolvedValue(mockStudent as any)
      vi.mocked(prisma.essay.findMany).mockResolvedValue(mockLibraryEssays as any)
      vi.mocked(prisma.application.findMany).mockResolvedValue(mockActiveApplications as any)

      // Mock low adaptability score
      vi.mocked(calculateAdaptabilityScore).mockResolvedValue({
        score: 45, // Below 70% threshold
        confidence: 'low',
        matchingThemes: [],
        wordCountCompatible: true,
        structurallyCompatible: false,
        themeOverlap: 0.2,
        wordCountRatio: 0.8,
        structuralSimilarity: 0.3,
      })

      const caller = morganRouter.createCaller(mockCtx)
      const result = await caller.getReusabilitySuggestions({ studentId: mockStudentId })

      expect(result).toHaveLength(0)
    })

    it('should return top 3 suggestions sorted by score', async () => {
      const mockStudent = { id: mockStudentId, userId: mockUserId }

      const mockLibraryEssays = [
        { id: 'essay1', title: 'Essay 1', content: 'Content 1', prompt: 'Prompt 1', themes: ['theme1'], wordCount: 500, adaptabilityScores: null },
        { id: 'essay2', title: 'Essay 2', content: 'Content 2', prompt: 'Prompt 2', themes: ['theme2'], wordCount: 600, adaptabilityScores: null },
        { id: 'essay3', title: 'Essay 3', content: 'Content 3', prompt: 'Prompt 3', themes: ['theme3'], wordCount: 550, adaptabilityScores: null },
        { id: 'essay4', title: 'Essay 4', content: 'Content 4', prompt: 'Prompt 4', themes: ['theme4'], wordCount: 450, adaptabilityScores: null },
      ]

      const mockActiveApplications = [
        {
          id: 'app1',
          scholarshipId: 'schol1',
          status: 'IN_PROGRESS' as const,
          scholarship: {
            id: 'schol1',
            name: 'Scholarship 1',
            deadline: new Date('2025-12-01'),
            essayPrompts: [{ question: 'Question 1', wordLimit: 500 }],
          },
          essays: [],
        },
      ]

      vi.mocked(prisma.student.findUnique).mockResolvedValue(mockStudent as any)
      vi.mocked(prisma.essay.findMany).mockResolvedValue(mockLibraryEssays as any)
      vi.mocked(prisma.application.findMany).mockResolvedValue(mockActiveApplications as any)

      // Return decreasing scores
      vi.mocked(calculateAdaptabilityScore)
        .mockResolvedValueOnce({ score: 75, confidence: 'medium', matchingThemes: [], wordCountCompatible: true, structurallyCompatible: true, themeOverlap: 0.7, wordCountRatio: 0.9, structuralSimilarity: 0.75 })
        .mockResolvedValueOnce({ score: 90, confidence: 'high', matchingThemes: [], wordCountCompatible: true, structurallyCompatible: true, themeOverlap: 0.9, wordCountRatio: 0.95, structuralSimilarity: 0.9 })
        .mockResolvedValueOnce({ score: 80, confidence: 'high', matchingThemes: [], wordCountCompatible: true, structurallyCompatible: true, themeOverlap: 0.8, wordCountRatio: 0.9, structuralSimilarity: 0.8 })
        .mockResolvedValueOnce({ score: 85, confidence: 'high', matchingThemes: [], wordCountCompatible: true, structurallyCompatible: true, themeOverlap: 0.85, wordCountRatio: 0.92, structuralSimilarity: 0.85 })

      const caller = morganRouter.createCaller(mockCtx)
      const result = await caller.getReusabilitySuggestions({ studentId: mockStudentId })

      // Should return top 3: essay2 (90), essay4 (85), essay3 (80)
      expect(result).toHaveLength(3)
      expect(result[0].adaptabilityScore).toBe(90)
      expect(result[1].adaptabilityScore).toBe(85)
      expect(result[2].adaptabilityScore).toBe(80)
    })
  })

  describe('getQualityAlerts', () => {
    it('should return essays with quality scores < 60 (AC5)', async () => {
      const mockStudent = { id: mockStudentId, userId: mockUserId }

      const mockLowQualityEssays = [
        {
          id: 'essay1',
          studentId: mockStudentId,
          applicationId: 'app1',
          title: 'Needs Improvement Essay',
          phase: EssayPhase.REVISION,
          wordCount: 450,
          qualityScore: 58,
          isComplete: false,
          qualityAssessment: {
            dimensions: {
              memorability: { score: 45, explanation: 'Not memorable' },
              authenticity: { score: 55, explanation: 'Lacks personal voice' },
              promptAlignment: { score: 48, explanation: 'Partially answers prompt' },
            },
            topSuggestions: [
              {
                priority: 'critical',
                issue: 'Add more specific examples',
                recommendation: 'Include concrete details about your experience',
              },
            ],
          },
          application: {
            id: 'app1',
            scholarship: {
              name: 'Excellence Scholarship',
              deadline: new Date('2025-11-30'),
            },
          },
        },
      ]

      vi.mocked(prisma.student.findUnique).mockResolvedValue(mockStudent as any)
      vi.mocked(prisma.essay.findMany).mockResolvedValue(mockLowQualityEssays as any)

      const caller = morganRouter.createCaller(mockCtx)
      const result = await caller.getQualityAlerts({ studentId: mockStudentId })

      expect(result).toHaveLength(1)
      expect(result[0].qualityScore).toBe(58)
      expect(result[0].essay.title).toBe('Needs Improvement Essay')
      expect(result[0].scholarshipName).toBe('Excellence Scholarship')
      expect(result[0].criticalIssues).toContain('Low memorability - essay doesn\'t stand out')
      expect(result[0].criticalIssues).toContain('Lacks authenticity - needs more personal voice')
      expect(result[0].criticalIssues).toContain('Poor prompt alignment - doesn\'t fully answer question')
      expect(result[0].topSuggestions).toHaveLength(1)
      expect(result[0].topSuggestions[0].issue).toBe('Add more specific examples')
    })

    it('should only return in-progress essays', async () => {
      const mockStudent = { id: mockStudentId, userId: mockUserId }

      vi.mocked(prisma.student.findUnique).mockResolvedValue(mockStudent as any)
      vi.mocked(prisma.essay.findMany).mockResolvedValue([])

      const caller = morganRouter.createCaller(mockCtx)
      const result = await caller.getQualityAlerts({ studentId: mockStudentId })

      expect(prisma.essay.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isComplete: false,
            qualityScore: { lt: 60 },
          }),
        })
      )
      expect(result).toHaveLength(0)
    })

    it('should sort alerts by quality score (lowest first)', async () => {
      const mockStudent = { id: mockStudentId, userId: mockUserId }

      const mockLowQualityEssays = [
        {
          id: 'essay1',
          title: 'Essay 1',
          phase: EssayPhase.DRAFTING,
          wordCount: 400,
          qualityScore: 55,
          isComplete: false,
          qualityAssessment: { dimensions: {}, topSuggestions: [] },
          application: null,
          applicationId: null,
        },
        {
          id: 'essay2',
          title: 'Essay 2',
          phase: EssayPhase.REVISION,
          wordCount: 500,
          qualityScore: 45,
          isComplete: false,
          qualityAssessment: { dimensions: {}, topSuggestions: [] },
          application: null,
          applicationId: null,
        },
      ]

      vi.mocked(prisma.student.findUnique).mockResolvedValue(mockStudent as any)
      vi.mocked(prisma.essay.findMany).mockResolvedValue(mockLowQualityEssays as any)

      const caller = morganRouter.createCaller(mockCtx)
      const result = await caller.getQualityAlerts({ studentId: mockStudentId })

      // Should be ordered by qualityScore ascending (lowest first)
      expect(result[0].qualityScore).toBe(45)
      expect(result[1].qualityScore).toBe(55)
    })
  })
})
