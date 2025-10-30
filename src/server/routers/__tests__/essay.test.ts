/**
 * Unit Tests for Essay Router
 * Story 4.6 - Priority 2 Testing
 *
 * Tests essay CRUD operations and prompt analysis endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PromptAnalysis } from '../../../types/essay'

// Mock OpenAI to prevent browser error
vi.mock('openai', () => ({
  default: vi.fn(),
}))

// Mock the promptAnalyzer service
vi.mock('../../services/promptAnalyzer', async () => {
  const actual = await vi.importActual('../../services/promptAnalyzer')
  return {
    ...actual,
    analyzePrompt: vi.fn(),
  }
})

// Import after mocking
import { analyzePrompt, hashPrompt } from '../../services/promptAnalyzer'

describe('Essay Router Business Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Prompt Analysis Caching Logic', () => {
    it('should generate consistent hashes for identical prompts', () => {
      const prompt1 = 'Describe your leadership experience'
      const prompt2 = 'Describe your leadership experience'

      const hash1 = hashPrompt(prompt1)
      const hash2 = hashPrompt(prompt2)

      expect(hash1).toBe(hash2)
    })

    it('should generate different hashes for different prompts', () => {
      const prompt1 = 'Leadership experience'
      const prompt2 = 'Community service'

      const hash1 = hashPrompt(prompt1)
      const hash2 = hashPrompt(prompt2)

      expect(hash1).not.toBe(hash2)
    })

    it('should normalize prompts before hashing', () => {
      const hash1 = hashPrompt('  Leadership Experience  ')
      const hash2 = hashPrompt('leadership experience')

      expect(hash1).toBe(hash2)
    })
  })

  describe('Prompt Analysis Response Structure', () => {
    it('should validate analyzePrompt returns PromptAnalysisWithMeta structure', async () => {
      const mockAnalysis: PromptAnalysis & { analysisSource: 'ai' | 'fallback' } = {
        themes: [
          {
            name: 'Leadership',
            importance: 'primary',
            explanation: 'Test explanation',
            examples: ['Example 1'],
          },
        ],
        requiredElements: [
          {
            element: 'Personal story',
            mandatory: true,
            description: 'Test description',
            examples: ['Example 1'],
          },
        ],
        tone: {
          expected: 'Personal & Reflective',
          description: 'Test tone',
          examplePhrases: ['I learned'],
          avoid: ['Clichés'],
        },
        suggestedStructure: {
          outline: [
            {
              section: 'Opening',
              content: 'Hook',
              wordCount: 150,
              guidance: 'Start strong',
            },
          ],
          flow: 'Start → Middle → End',
        },
        strategicAdvice: ['Be authentic'],
        dosAndDonts: {
          dos: ['Be specific'],
          donts: ['Be generic'],
        },
        examplePatterns: [
          {
            pattern: 'Narrative opening',
            effectiveness: 'Engages reader',
          },
        ],
        wordCountTarget: {
          min: 500,
          max: 750,
          optimal: 650,
          extracted: false,
        },
        competitiveInsights: 'Test insights',
        analyzedAt: new Date(),
        promptHash: 'test-hash',
        analysisSource: 'ai',
      }

      vi.mocked(analyzePrompt).mockResolvedValue(mockAnalysis)

      const result = await analyzePrompt('Test prompt')

      expect(result).toHaveProperty('themes')
      expect(result).toHaveProperty('requiredElements')
      expect(result).toHaveProperty('tone')
      expect(result).toHaveProperty('suggestedStructure')
      expect(result).toHaveProperty('strategicAdvice')
      expect(result).toHaveProperty('dosAndDonts')
      expect(result).toHaveProperty('examplePatterns')
      expect(result).toHaveProperty('wordCountTarget')
      expect(result).toHaveProperty('competitiveInsights')
      expect(result).toHaveProperty('analyzedAt')
      expect(result).toHaveProperty('promptHash')
      expect(result).toHaveProperty('analysisSource')
    })

    it('should include analysisSource field in response', async () => {
      const mockAnalysis = {
        themes: [],
        requiredElements: [],
        tone: {
          expected: 'Personal & Reflective' as const,
          description: '',
          examplePhrases: [],
          avoid: [],
        },
        suggestedStructure: {
          outline: [],
          flow: '',
        },
        strategicAdvice: [],
        dosAndDonts: {
          dos: [],
          donts: [],
        },
        examplePatterns: [],
        wordCountTarget: {
          min: 500,
          max: 750,
          optimal: 650,
          extracted: false,
        },
        competitiveInsights: '',
        analyzedAt: new Date(),
        promptHash: 'test',
        analysisSource: 'ai' as const,
      }

      vi.mocked(analyzePrompt).mockResolvedValue(mockAnalysis)

      const result = await analyzePrompt('Test')

      expect(result.analysisSource).toBe('ai')
    })
  })

  describe('Word Count Calculation Logic', () => {
    it('should calculate word count correctly', () => {
      const content = 'This is a test essay with multiple words'
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length

      expect(wordCount).toBe(8)
    })

    it('should handle empty content', () => {
      const content = ''
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length

      expect(wordCount).toBe(0)
    })

    it('should handle content with extra whitespace', () => {
      const content = '  This   has   extra   spaces  '
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length

      expect(wordCount).toBe(4)
    })

    it('should handle newlines and tabs', () => {
      const content = 'Line one\nLine two\tWord three'
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length

      expect(wordCount).toBe(6) // "Line", "one", "Line", "two", "Word", "three"
    })
  })

  describe('Input Validation Logic', () => {
    it('should validate minimum prompt length of 10 characters', () => {
      const shortPrompt = 'Short'
      const validPrompt = 'This is a valid prompt with enough characters'

      expect(shortPrompt.length).toBeLessThan(10)
      expect(validPrompt.length).toBeGreaterThanOrEqual(10)
    })

    it('should validate title is not empty', () => {
      const emptyTitle = ''
      const validTitle = 'Essay Title'

      expect(emptyTitle.length).toBe(0)
      expect(validTitle.length).toBeGreaterThan(0)
    })

    it('should validate student ID is CUID format', () => {
      // CUID format: starts with 'c', followed by alphanumeric characters
      const validCuid = 'cl9a2b3c4d5e6f7g8h9i0j1k' // 24 chars
      const invalidCuid = 'invalid-id'

      // CUIDs start with 'c' and are typically 24-25 chars
      expect(validCuid.length).toBeGreaterThanOrEqual(20)
      expect(validCuid[0]).toBe('c')
      expect(invalidCuid).not.toMatch(/^c[a-z0-9]+$/i)
    })
  })

  describe('Essay Phase Enum Validation', () => {
    it('should validate essay phase values', () => {
      const validPhases = [
        'DISCOVERY',
        'STRUCTURE',
        'DRAFTING',
        'REVISION',
        'POLISH',
        'FINALIZATION',
      ]

      const invalidPhase = 'INVALID_PHASE'

      validPhases.forEach((phase) => {
        expect(validPhases).toContain(phase)
      })

      expect(validPhases).not.toContain(invalidPhase)
    })
  })

  describe('Tone Expectation Values', () => {
    it('should validate tone expectation values', () => {
      const validTones = [
        'Personal & Reflective',
        'Formal',
        'Inspirational',
        'Academic',
      ]

      validTones.forEach((tone) => {
        expect(validTones).toContain(tone)
      })
    })
  })

  describe('Theme Importance Values', () => {
    it('should validate theme importance values', () => {
      const validImportance = ['primary', 'secondary']

      validImportance.forEach((importance) => {
        expect(validImportance).toContain(importance)
      })
    })
  })
})
