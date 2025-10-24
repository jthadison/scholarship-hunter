import { describe, it, expect } from 'vitest'
import {
  scholarshipCreateSchema,
  scholarshipUpdateSchema,
  scholarshipFilterSchema,
} from '../../../src/lib/validations/scholarship'

describe('Scholarship Validation Schemas', () => {
  describe('scholarshipCreateSchema', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    it('should validate a complete valid scholarship', () => {
      const validScholarship = {
        name: 'Google Scholarship for Computer Science',
        provider: 'Google',
        description: 'This is a scholarship for students pursuing computer science degrees.',
        website: 'https://google.com/scholarship',
        contactEmail: 'scholarship@google.com',
        awardAmount: 5000,
        awardAmountMax: 10000,
        numberOfAwards: 50,
        renewable: true,
        deadline: tomorrow,
        eligibilityCriteria: { minGPA: 3.5 },
        essayPrompts: [{ prompt: 'Why do you want to study CS?', wordLimit: 500 }],
        requiredDocuments: ['Transcript', 'Resume'],
        recommendationCount: 2,
        applicantPoolSize: 10000,
        acceptanceRate: 0.05,
        sourceUrl: 'https://google.com/scholarship/apply',
        verified: true,
        tags: ['STEM', 'Tech', 'Computer Science'],
        category: 'Merit-based',
      }

      const result = scholarshipCreateSchema.safeParse(validScholarship)
      expect(result.success).toBe(true)
    })

    it('should validate scholarship with only required fields', () => {
      const minimalScholarship = {
        name: 'Basic Scholarship',
        provider: 'Test Provider',
        description: 'A basic scholarship with minimal information.',
        awardAmount: 1000,
        deadline: tomorrow,
      }

      const result = scholarshipCreateSchema.safeParse(minimalScholarship)
      expect(result.success).toBe(true)
    })

    describe('Award amount validation', () => {
      it('should accept positive award amount', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(true)
      })

      it('should reject zero award amount', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 0,
          deadline: tomorrow,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(false)
      })

      it('should reject negative award amount', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: -1000,
          deadline: tomorrow,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(false)
      })

      it('should accept award range when max >= min', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          awardAmountMax: 5000,
          deadline: tomorrow,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(true)
      })

      it('should reject award range when max < min', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 5000,
          awardAmountMax: 1000,
          deadline: tomorrow,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('awardAmountMax')
        }
      })
    })

    describe('Deadline validation', () => {
      it('should accept future deadline', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 30)

        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: futureDate,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(true)
      })

      it('should reject past deadline', () => {
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 1)

        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: pastDate,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(false)
      })
    })

    describe('Recommendation count validation', () => {
      it('should accept 0 recommendations', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
          recommendationCount: 0,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(true)
      })

      it('should accept 5 recommendations (max)', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
          recommendationCount: 5,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(true)
      })

      it('should reject more than 5 recommendations', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
          recommendationCount: 6,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(false)
      })

      it('should reject negative recommendations', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
          recommendationCount: -1,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(false)
      })
    })

    describe('Acceptance rate validation', () => {
      it('should accept acceptance rate of 0.0', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
          acceptanceRate: 0.0,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(true)
      })

      it('should accept acceptance rate of 1.0', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
          acceptanceRate: 1.0,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(true)
      })

      it('should accept acceptance rate of 0.25', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
          acceptanceRate: 0.25,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(true)
      })

      it('should reject acceptance rate above 1.0', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
          acceptanceRate: 1.5,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(false)
      })

      it('should reject acceptance rate below 0.0', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
          acceptanceRate: -0.1,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(false)
      })
    })

    describe('Required fields validation', () => {
      it('should reject missing name', () => {
        const scholarship = {
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(false)
      })

      it('should reject empty name', () => {
        const scholarship = {
          name: '',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(false)
      })

      it('should reject missing provider', () => {
        const scholarship = {
          name: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(false)
      })

      it('should reject description shorter than 10 characters', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Short',
          awardAmount: 1000,
          deadline: tomorrow,
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(false)
      })
    })

    describe('URL validation', () => {
      it('should accept valid website URL', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
          website: 'https://example.com',
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(true)
      })

      it('should reject invalid website URL', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
          website: 'not-a-url',
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(false)
      })

      it('should accept valid email', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
          contactEmail: 'test@example.com',
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(true)
      })

      it('should reject invalid email', () => {
        const scholarship = {
          name: 'Test',
          provider: 'Test',
          description: 'Test description here',
          awardAmount: 1000,
          deadline: tomorrow,
          contactEmail: 'not-an-email',
        }
        const result = scholarshipCreateSchema.safeParse(scholarship)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('scholarshipUpdateSchema', () => {
    it('should allow updating any field', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const update = {
        awardAmount: 2000,
        deadline: tomorrow,
        verified: true,
      }
      const result = scholarshipUpdateSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should allow empty update object', () => {
      const update = {}
      const result = scholarshipUpdateSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should validate field constraints in updates', () => {
      const invalidUpdate = {
        awardAmount: -1000, // Invalid: negative
      }
      const result = scholarshipUpdateSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })
  })

  describe('scholarshipFilterSchema', () => {
    it('should accept valid filter criteria', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const filter = {
        provider: 'Google',
        category: 'Merit-based',
        verified: true,
        minAwardAmount: 1000,
        maxAwardAmount: 10000,
        deadlineAfter: new Date(),
        deadlineBefore: tomorrow,
        tags: ['STEM', 'Tech'],
        renewable: true,
      }
      const result = scholarshipFilterSchema.safeParse(filter)
      expect(result.success).toBe(true)
    })

    it('should accept empty filter object', () => {
      const filter = {}
      const result = scholarshipFilterSchema.safeParse(filter)
      expect(result.success).toBe(true)
    })

    it('should validate award amount constraints', () => {
      const invalidFilter = {
        minAwardAmount: -1000, // Invalid: negative
      }
      const result = scholarshipFilterSchema.safeParse(invalidFilter)
      expect(result.success).toBe(false)
    })
  })
})
