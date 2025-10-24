import { describe, it, expect } from 'vitest'
import {
  profileCreateSchema,
  profileUpdateSchema,
  profileFilterSchema,
} from '../../../src/lib/validations/profile'

describe('Profile Validation Schemas', () => {
  describe('profileCreateSchema', () => {
    it('should validate a complete valid profile', () => {
      const validProfile = {
        studentId: 'clabcdef1234567890',
        gpa: 3.8,
        gpaScale: 4.0,
        satScore: 1450,
        actScore: 32,
        classRank: 15,
        classSize: 300,
        graduationYear: 2025,
        currentGrade: '12th Grade',
        gender: 'Female',
        ethnicity: ['Asian', 'Pacific Islander'],
        state: 'CA',
        city: 'Los Angeles',
        zipCode: '90001',
        citizenship: 'US Citizen',
        financialNeed: 'MODERATE',
        pellGrantEligible: true,
        efcRange: '5001-10000',
        intendedMajor: 'Computer Science',
        fieldOfStudy: 'STEM',
        careerGoals: 'Software Engineer',
        volunteerHours: 150,
        firstGeneration: false,
        militaryAffiliation: 'None',
      }

      const result = profileCreateSchema.safeParse(validProfile)
      expect(result.success).toBe(true)
    })

    it('should validate profile with only required fields (studentId)', () => {
      const minimalProfile = {
        studentId: 'clabcdef1234567890',
      }

      const result = profileCreateSchema.safeParse(minimalProfile)
      expect(result.success).toBe(true)
    })

    it('should reject invalid studentId format', () => {
      const invalidProfile = {
        studentId: 'invalid-id',
      }

      const result = profileCreateSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
    })

    describe('GPA validation', () => {
      it('should accept GPA of 0.0', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          gpa: 0.0,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should accept GPA of 4.0', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          gpa: 4.0,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should accept GPA of 3.5', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          gpa: 3.5,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should reject GPA below 0.0', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          gpa: -0.1,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('gpa')
        }
      })

      it('should reject GPA above 4.0', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          gpa: 4.1,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('gpa')
        }
      })
    })

    describe('SAT score validation', () => {
      it('should accept SAT score of 400 (minimum)', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          satScore: 400,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should accept SAT score of 1600 (maximum)', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          satScore: 1600,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should accept SAT score of 1200 (mid-range)', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          satScore: 1200,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should reject SAT score below 400', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          satScore: 399,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('satScore')
        }
      })

      it('should reject SAT score above 1600', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          satScore: 1601,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('satScore')
        }
      })

      it('should reject non-integer SAT score', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          satScore: 1200.5,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(false)
      })
    })

    describe('ACT score validation', () => {
      it('should accept ACT score of 1 (minimum)', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          actScore: 1,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should accept ACT score of 36 (maximum)', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          actScore: 36,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should accept ACT score of 28 (mid-range)', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          actScore: 28,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should reject ACT score below 1', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          actScore: 0,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('actScore')
        }
      })

      it('should reject ACT score above 36', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          actScore: 37,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('actScore')
        }
      })
    })

    describe('Graduation year validation', () => {
      it('should accept graduation year of 2024 (minimum)', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          graduationYear: 2024,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should accept graduation year of 2030 (maximum)', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          graduationYear: 2030,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should accept graduation year of 2025', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          graduationYear: 2025,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should reject graduation year before 2024', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          graduationYear: 2023,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('graduationYear')
        }
      })

      it('should reject graduation year after 2030', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          graduationYear: 2031,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('graduationYear')
        }
      })
    })

    describe('Volunteer hours validation', () => {
      it('should accept volunteer hours of 0', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          volunteerHours: 0,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should accept positive volunteer hours', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          volunteerHours: 250,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should reject negative volunteer hours', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          volunteerHours: -10,
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('volunteerHours')
        }
      })
    })

    describe('Enum validation', () => {
      it('should accept valid financialNeed enum values', () => {
        const validValues = ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']

        validValues.forEach((value) => {
          const profile = {
            studentId: 'clabcdef1234567890',
            financialNeed: value,
          }
          const result = profileCreateSchema.safeParse(profile)
          expect(result.success).toBe(true)
        })
      })

      it('should reject invalid financialNeed enum value', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          financialNeed: 'INVALID',
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('financialNeed')
        }
      })
    })

    describe('ZIP code validation', () => {
      it('should accept 5-digit ZIP code', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          zipCode: '90001',
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should accept ZIP+4 format', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          zipCode: '90001-1234',
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should reject invalid ZIP code format', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          zipCode: '900',
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('zipCode')
        }
      })
    })

    describe('State code validation', () => {
      it('should accept 2-character state code', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          state: 'CA',
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })

      it('should reject 1-character state code', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          state: 'C',
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(false)
      })

      it('should reject 3-character state code', () => {
        const profile = {
          studentId: 'clabcdef1234567890',
          state: 'CAL',
        }
        const result = profileCreateSchema.safeParse(profile)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('profileUpdateSchema', () => {
    it('should allow updating any field', () => {
      const update = {
        gpa: 3.9,
        satScore: 1500,
      }
      const result = profileUpdateSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should allow empty update object', () => {
      const update = {}
      const result = profileUpdateSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should not allow updating studentId', () => {
      const update = {
        studentId: 'clabcdef1234567890',
        gpa: 3.9,
      }
      const result = profileUpdateSchema.safeParse(update)
      // studentId should be omitted from update schema
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('studentId')
      }
    })

    it('should validate field constraints in updates', () => {
      const invalidUpdate = {
        gpa: 5.0, // Invalid: above 4.0
      }
      const result = profileUpdateSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })
  })

  describe('profileFilterSchema', () => {
    it('should accept valid filter criteria', () => {
      const filter = {
        graduationYear: 2025,
        intendedMajor: 'Computer Science',
        financialNeed: 'HIGH',
        state: 'CA',
        minGpa: 3.0,
        maxGpa: 4.0,
      }
      const result = profileFilterSchema.safeParse(filter)
      expect(result.success).toBe(true)
    })

    it('should accept empty filter object', () => {
      const filter = {}
      const result = profileFilterSchema.safeParse(filter)
      expect(result.success).toBe(true)
    })

    it('should validate graduation year range', () => {
      const invalidFilter = {
        graduationYear: 2023, // Before 2024
      }
      const result = profileFilterSchema.safeParse(invalidFilter)
      expect(result.success).toBe(false)
    })

    it('should validate GPA range', () => {
      const invalidFilter = {
        minGpa: 5.0, // Above 4.0
      }
      const result = profileFilterSchema.safeParse(invalidFilter)
      expect(result.success).toBe(false)
    })
  })
})
