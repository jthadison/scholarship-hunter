import { describe, it, expect } from 'vitest'
import {
  essayCreateSchema,
} from '../../../src/lib/validations/essay'

describe('Essay Validation Schemas', () => {
  describe('essayCreateSchema', () => {
    it('should validate a complete valid essay', () => {
      const validEssay = {
        studentId: 'clabcdef1234567890',
        applicationId: 'clxyz1234567890abc',
        title: 'Why I Want to Study Computer Science',
        prompt: 'Describe your passion for computer science and how it aligns with your career goals.',
        content: 'Computer science has always been my passion. From a young age, I have been fascinated by technology.',
        wordCount: 19,
        phase: 'DRAFTING',
        isComplete: false,
        aiGenerated: false,
        personalized: true,
        qualityScore: 85,
        version: 1,
        themes: ['technology', 'passion', 'career'],
      }

      const result = essayCreateSchema.safeParse(validEssay)
      expect(result.success).toBe(true)
    })

    it('should validate essay with only required fields', () => {
      const minimalEssay = {
        studentId: 'clabcdef1234567890',
        title: 'My Essay',
        prompt: 'Write about yourself',
      }

      const result = essayCreateSchema.safeParse(minimalEssay)
      expect(result.success).toBe(true)
    })

    describe('Quality score validation', () => {
      it('should accept quality score of 0', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          qualityScore: 0,
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(true)
      })

      it('should accept quality score of 100', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          qualityScore: 100,
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(true)
      })

      it('should accept quality score of 75', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          qualityScore: 75,
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(true)
      })

      it('should reject quality score below 0', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          qualityScore: -1,
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(false)
      })

      it('should reject quality score above 100', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          qualityScore: 101,
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(false)
      })
    })

    describe('Word count validation', () => {
      it('should accept matching word count', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          content: 'This is a test essay with exactly five words.',
          wordCount: 9,
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(true)
      })

      it('should accept word count within 10 words of actual', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          content: 'This is a test.',
          wordCount: 8, // Actual is 4, difference of 4 is acceptable
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(true)
      })

      it('should reject word count more than 10 words off', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          content: 'This is a test.',
          wordCount: 50, // Actual is 4, difference of 46 is too much
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('wordCount')
        }
      })

      it('should accept zero word count with empty content', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          content: '',
          wordCount: 0,
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(true)
      })
    })

    describe('AI generation validation', () => {
      it('should accept AI-generated essay with aiModel specified', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          aiGenerated: true,
          aiModel: 'gpt-4',
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(true)
      })

      it('should reject AI-generated essay without aiModel', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          aiGenerated: true,
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('aiModel')
        }
      })

      it('should accept non-AI essay without aiModel', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          aiGenerated: false,
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(true)
      })
    })

    describe('Enum validation', () => {
      it('should accept valid phase enum values', () => {
        const validPhases = ['DISCOVERY', 'STRUCTURE', 'DRAFTING', 'REVISION', 'POLISH', 'FINALIZATION']

        validPhases.forEach((phase) => {
          const essay = {
            studentId: 'clabcdef1234567890',
            title: 'Test',
            prompt: 'Test prompt here',
            phase,
          }
          const result = essayCreateSchema.safeParse(essay)
          expect(result.success).toBe(true)
        })
      })

      it('should reject invalid phase enum value', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          phase: 'INVALID_PHASE',
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(false)
      })
    })

    describe('Required fields validation', () => {
      it('should reject missing studentId', () => {
        const essay = {
          title: 'Test',
          prompt: 'Test prompt here',
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(false)
      })

      it('should reject empty title', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: '',
          prompt: 'Test prompt here',
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(false)
      })

      it('should reject prompt shorter than 10 characters', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Short',
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(false)
      })
    })

    describe('Version control validation', () => {
      it('should accept version 1 (default)', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          version: 1,
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(true)
      })

      it('should accept higher version numbers', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          version: 5,
          previousVersionId: 'clprev1234567890xyz',
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(true)
      })

      it('should reject version 0', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          version: 0,
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(false)
      })

      it('should reject negative version', () => {
        const essay = {
          studentId: 'clabcdef1234567890',
          title: 'Test',
          prompt: 'Test prompt here',
          version: -1,
        }
        const result = essayCreateSchema.safeParse(essay)
        expect(result.success).toBe(false)
      })
    })
  })
})
