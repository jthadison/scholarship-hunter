/**
 * Unit Tests for Prompt Analyzer Service
 * Story 4.6 - Priority 2 Testing
 *
 * Tests AI-powered prompt analysis with fallback behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hashPrompt, analyzePrompt } from '../promptAnalyzer'

// Mock OpenAI module
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  }
})

describe('Prompt Analyzer Service', () => {
  describe('hashPrompt', () => {
    it('should generate consistent MD5 hashes', () => {
      const prompt = 'Describe your leadership experience'
      const hash1 = hashPrompt(prompt)
      const hash2 = hashPrompt(prompt)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(32) // MD5 produces 32 hex chars
    })

    it('should normalize whitespace and case', () => {
      const hash1 = hashPrompt('  HELLO World  ')
      const hash2 = hashPrompt('hello world')

      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different prompts', () => {
      const hash1 = hashPrompt('Leadership experience')
      const hash2 = hashPrompt('Community service')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('analyzePrompt', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      // Reset environment variable
      delete process.env.OPENAI_API_KEY
    })

    it('should return fallback analysis when API key is not configured', async () => {
      const prompt = 'Describe a challenging situation you overcame'

      const result = await analyzePrompt(prompt)

      expect(result.analysisSource).toBe('fallback')
      expect(result.themes).toBeDefined()
      expect(result.themes.length).toBeGreaterThan(0)
      expect(result.requiredElements).toBeDefined()
      expect(result.tone).toBeDefined()
      expect(result.suggestedStructure).toBeDefined()
      expect(result.strategicAdvice).toBeDefined()
      expect(result.dosAndDonts).toBeDefined()
      expect(result.examplePatterns).toBeDefined()
      expect(result.wordCountTarget).toBeDefined()
      expect(result.competitiveInsights).toContain('AI analysis was unavailable')
      expect(result.promptHash).toBeDefined()
      expect(result.analyzedAt).toBeInstanceOf(Date)
    })

    it('should return fallback when API key is sk-fallback', async () => {
      process.env.OPENAI_API_KEY = 'sk-fallback'

      const result = await analyzePrompt('Test prompt')

      expect(result.analysisSource).toBe('fallback')
    })

    it('should include proper structure in fallback analysis', async () => {
      const result = await analyzePrompt('Test prompt')

      expect(result.themes[0]).toHaveProperty('name')
      expect(result.themes[0]).toHaveProperty('importance')
      expect(result.themes[0]).toHaveProperty('explanation')
      expect(result.themes[0]).toHaveProperty('examples')

      expect(result.requiredElements[0]).toHaveProperty('element')
      expect(result.requiredElements[0]).toHaveProperty('mandatory')
      expect(result.requiredElements[0]).toHaveProperty('description')
      expect(result.requiredElements[0]).toHaveProperty('examples')

      expect(result.tone).toHaveProperty('expected')
      expect(result.tone).toHaveProperty('description')
      expect(result.tone).toHaveProperty('examplePhrases')
      expect(result.tone).toHaveProperty('avoid')

      expect(result.suggestedStructure).toHaveProperty('outline')
      expect(result.suggestedStructure).toHaveProperty('flow')
      expect(result.suggestedStructure.outline[0]).toHaveProperty('section')
      expect(result.suggestedStructure.outline[0]).toHaveProperty('content')
      expect(result.suggestedStructure.outline[0]).toHaveProperty('wordCount')
      expect(result.suggestedStructure.outline[0]).toHaveProperty('guidance')

      expect(result.dosAndDonts).toHaveProperty('dos')
      expect(result.dosAndDonts).toHaveProperty('donts')

      expect(result.examplePatterns[0]).toHaveProperty('pattern')
      expect(result.examplePatterns[0]).toHaveProperty('effectiveness')

      expect(result.wordCountTarget).toHaveProperty('min')
      expect(result.wordCountTarget).toHaveProperty('max')
      expect(result.wordCountTarget).toHaveProperty('optimal')
      expect(result.wordCountTarget).toHaveProperty('extracted')
      expect(result.wordCountTarget.extracted).toBe(false)
    })

    it('should generate unique hashes for different prompts', async () => {
      const result1 = await analyzePrompt('Leadership prompt')
      const result2 = await analyzePrompt('Community service prompt')

      expect(result1.promptHash).not.toBe(result2.promptHash)
    })

    it('should set analyzedAt to current date', async () => {
      const before = new Date()
      const result = await analyzePrompt('Test prompt')
      const after = new Date()

      expect(result.analyzedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(result.analyzedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should include warning about AI unavailability in fallback', async () => {
      const result = await analyzePrompt('Test prompt')

      expect(result.competitiveInsights).toContain('⚠️ AI analysis was unavailable')
      expect(result.competitiveInsights).toContain('OPENAI_API_KEY')
    })

    it('should provide reasonable word count targets in fallback', async () => {
      const result = await analyzePrompt('Test prompt')

      expect(result.wordCountTarget.min).toBe(500)
      expect(result.wordCountTarget.max).toBe(750)
      expect(result.wordCountTarget.optimal).toBe(650)
    })
  })
})
