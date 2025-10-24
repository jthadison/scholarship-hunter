import { describe, it, expect } from 'vitest'
import {
  gpaSchema,
  satScoreSchema,
  actScoreSchema,
  classRankSchema,
  graduationYearSchema,
  stateSchema,
  zipCodeSchema,
  citizenshipSchema,
  ethnicitySchema,
  financialNeedSchema,
  calculateProfileCompleteness,
  academicProfileSchema,
  demographicProfileSchema,
  financialProfileSchema,
} from '@/modules/profile/lib/profile-validation'
import { FinancialNeed } from '@prisma/client'

describe('Profile Validation - Academic Fields', () => {
  describe('GPA Validation', () => {
    it('should accept valid GPA values', () => {
      const result = gpaSchema.safeParse({ gpa: 3.75, gpaScale: 4.0 })
      expect(result.success).toBe(true)
    })

    it('should reject GPA below 0.0', () => {
      const result = gpaSchema.safeParse({ gpa: -0.5, gpaScale: 4.0 })
      expect(result.success).toBe(false)
    })

    it('should reject GPA above 4.0', () => {
      const result = gpaSchema.safeParse({ gpa: 4.5, gpaScale: 4.0 })
      expect(result.success).toBe(false)
    })

    it('should accept null GPA (optional field)', () => {
      const result = gpaSchema.safeParse({ gpa: null, gpaScale: 4.0 })
      expect(result.success).toBe(true)
    })
  })

  describe('SAT Score Validation', () => {
    it('should accept valid SAT scores', () => {
      expect(satScoreSchema.safeParse(1450).success).toBe(true)
      expect(satScoreSchema.safeParse(400).success).toBe(true)
      expect(satScoreSchema.safeParse(1600).success).toBe(true)
    })

    it('should reject SAT scores below 400', () => {
      const result = satScoreSchema.safeParse(350)
      expect(result.success).toBe(false)
    })

    it('should reject SAT scores above 1600', () => {
      const result = satScoreSchema.safeParse(1650)
      expect(result.success).toBe(false)
    })

    it('should accept null SAT score (optional)', () => {
      expect(satScoreSchema.safeParse(null).success).toBe(true)
    })
  })

  describe('ACT Score Validation', () => {
    it('should accept valid ACT scores', () => {
      expect(actScoreSchema.safeParse(32).success).toBe(true)
      expect(actScoreSchema.safeParse(1).success).toBe(true)
      expect(actScoreSchema.safeParse(36).success).toBe(true)
    })

    it('should reject ACT scores below 1', () => {
      expect(actScoreSchema.safeParse(0).success).toBe(false)
    })

    it('should reject ACT scores above 36', () => {
      expect(actScoreSchema.safeParse(37).success).toBe(false)
    })
  })

  describe('Class Rank Validation', () => {
    it('should accept valid class rank and size', () => {
      const result = classRankSchema.safeParse({
        classRank: 15,
        classSize: 300,
      })
      expect(result.success).toBe(true)
    })

    it('should reject class rank greater than class size', () => {
      const result = classRankSchema.safeParse({
        classRank: 350,
        classSize: 300,
      })
      expect(result.success).toBe(false)
    })

    it('should accept when only rank is provided', () => {
      const result = classRankSchema.safeParse({
        classRank: 15,
        classSize: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Graduation Year Validation', () => {
    it('should accept current year', () => {
      const currentYear = new Date().getFullYear()
      const result = graduationYearSchema.safeParse(currentYear)
      expect(result.success).toBe(true)
    })

    it('should accept years up to 6 years in future', () => {
      const futureYear = new Date().getFullYear() + 6
      const result = graduationYearSchema.safeParse(futureYear)
      expect(result.success).toBe(true)
    })

    it('should reject past years', () => {
      const pastYear = new Date().getFullYear() - 1
      const result = graduationYearSchema.safeParse(pastYear)
      expect(result.success).toBe(false)
    })

    it('should reject years more than 6 years in future', () => {
      const farFutureYear = new Date().getFullYear() + 7
      const result = graduationYearSchema.safeParse(farFutureYear)
      expect(result.success).toBe(false)
    })
  })
})

describe('Profile Validation - Demographic Fields', () => {
  describe('State Validation', () => {
    it('should accept valid US state codes', () => {
      expect(stateSchema.safeParse('CA').success).toBe(true)
      expect(stateSchema.safeParse('NY').success).toBe(true)
      expect(stateSchema.safeParse('TX').success).toBe(true)
    })

    it('should reject invalid state codes', () => {
      expect(stateSchema.safeParse('XX').success).toBe(false)
      expect(stateSchema.safeParse('California').success).toBe(false)
    })

    it('should accept null (optional)', () => {
      expect(stateSchema.safeParse(null).success).toBe(true)
    })
  })

  describe('ZIP Code Validation', () => {
    it('should accept 5-digit ZIP codes', () => {
      expect(zipCodeSchema.safeParse('90210').success).toBe(true)
    })

    it('should accept 9-digit ZIP codes with dash', () => {
      expect(zipCodeSchema.safeParse('90210-1234').success).toBe(true)
    })

    it('should reject invalid ZIP code formats', () => {
      expect(zipCodeSchema.safeParse('9021').success).toBe(false) // Too short
      expect(zipCodeSchema.safeParse('902101234').success).toBe(false) // No dash
      expect(zipCodeSchema.safeParse('abcde').success).toBe(false) // Letters
    })
  })

  describe('Ethnicity Validation', () => {
    it('should accept valid ethnicity options', () => {
      const result = ethnicitySchema.safeParse(['Asian', 'White/Caucasian'])
      expect(result.success).toBe(true)
    })

    it('should accept empty array', () => {
      const result = ethnicitySchema.safeParse([])
      expect(result.success).toBe(true)
    })

    it('should reject invalid ethnicity values', () => {
      const result = ethnicitySchema.safeParse(['Invalid Ethnicity'])
      expect(result.success).toBe(false)
    })
  })

  describe('Citizenship Validation', () => {
    it('should accept valid citizenship options', () => {
      expect(citizenshipSchema.safeParse('US Citizen').success).toBe(true)
      expect(citizenshipSchema.safeParse('International Student').success).toBe(
        true
      )
    })

    it('should reject invalid citizenship values', () => {
      expect(citizenshipSchema.safeParse('Invalid').success).toBe(false)
    })
  })
})

describe('Profile Validation - Financial Fields', () => {
  describe('Financial Need Validation', () => {
    it('should accept valid FinancialNeed enum values', () => {
      expect(financialNeedSchema.safeParse(FinancialNeed.LOW).success).toBe(
        true
      )
      expect(financialNeedSchema.safeParse(FinancialNeed.MODERATE).success).toBe(
        true
      )
      expect(financialNeedSchema.safeParse(FinancialNeed.HIGH).success).toBe(
        true
      )
      expect(
        financialNeedSchema.safeParse(FinancialNeed.VERY_HIGH).success
      ).toBe(true)
    })

    it('should reject invalid enum values', () => {
      expect(financialNeedSchema.safeParse('INVALID').success).toBe(false)
    })
  })
})

describe('Profile Completeness Calculation', () => {
  it('should return 0% for empty profile', () => {
    const result = calculateProfileCompleteness({})
    expect(result.completionPercentage).toBe(0)
    expect(result.requiredFieldsComplete).toBe(0)
    expect(result.requiredFieldsTotal).toBe(4)
  })

  it('should calculate 70% when all required fields complete, no optional fields', () => {
    const profile = {
      graduationYear: 2025,
      citizenship: 'US Citizen',
      state: 'CA',
      financialNeed: FinancialNeed.MODERATE,
    }
    const result = calculateProfileCompleteness(profile)
    expect(result.completionPercentage).toBe(70)
    expect(result.requiredFieldsComplete).toBe(4)
  })

  it('should calculate 100% when all required and optional fields complete', () => {
    const profile = {
      // Required
      graduationYear: 2025,
      citizenship: 'US Citizen',
      state: 'CA',
      financialNeed: FinancialNeed.MODERATE,
      // Optional
      gpa: 3.8,
      satScore: 1450,
      actScore: 32,
      classRank: 15,
      classSize: 300,
      currentGrade: '12th Grade',
      gender: 'Female',
      ethnicity: ['Asian'],
      city: 'Los Angeles',
      zipCode: '90210',
      pellGrantEligible: true,
      efcRange: '$0-$5,000',
    }
    const result = calculateProfileCompleteness(profile)
    expect(result.completionPercentage).toBe(100)
    expect(result.requiredFieldsComplete).toBe(4)
    expect(result.optionalFieldsComplete).toBe(12)
  })

  it('should list missing required fields', () => {
    const profile = {
      graduationYear: 2025,
      // Missing citizenship, state, financialNeed
    }
    const result = calculateProfileCompleteness(profile)
    expect(result.missingRequired).toContain('Citizenship Status')
    expect(result.missingRequired).toContain('State')
    expect(result.missingRequired).toContain('Financial Need Level')
  })

  it('should list missing recommended fields', () => {
    const profile = {
      graduationYear: 2025,
      citizenship: 'US Citizen',
      state: 'CA',
      financialNeed: FinancialNeed.MODERATE,
      // Missing all optional fields
    }
    const result = calculateProfileCompleteness(profile)
    expect(result.missingRecommended).toContain('GPA')
    expect(result.missingRecommended).toContain('SAT Score')
  })

  it('should handle arrays (ethnicity) correctly', () => {
    const profileWithEthnicity = {
      graduationYear: 2025,
      citizenship: 'US Citizen',
      state: 'CA',
      financialNeed: FinancialNeed.MODERATE,
      ethnicity: ['Asian', 'White/Caucasian'],
    }
    const resultWith = calculateProfileCompleteness(profileWithEthnicity)
    expect(resultWith.optionalFieldsComplete).toBe(1)

    const profileWithoutEthnicity = {
      graduationYear: 2025,
      citizenship: 'US Citizen',
      state: 'CA',
      financialNeed: FinancialNeed.MODERATE,
      ethnicity: [],
    }
    const resultWithout = calculateProfileCompleteness(profileWithoutEthnicity)
    expect(resultWithout.missingRecommended).toContain('Ethnicity')
  })
})

describe('Complete Profile Schemas', () => {
  it('should validate complete academic profile', () => {
    const profile = {
      gpa: 3.8,
      gpaScale: 4.0,
      satScore: 1450,
      actScore: null,
      classRank: 15,
      classSize: 300,
      graduationYear: 2025,
      currentGrade: '12th Grade',
    }
    const result = academicProfileSchema.safeParse(profile)
    expect(result.success).toBe(true)
  })

  it('should validate complete demographic profile', () => {
    const profile = {
      gender: 'Female',
      ethnicity: ['Asian'],
      state: 'CA',
      city: 'Los Angeles',
      zipCode: '90210',
      citizenship: 'US Citizen',
    }
    const result = demographicProfileSchema.safeParse(profile)
    expect(result.success).toBe(true)
  })

  it('should validate complete financial profile', () => {
    const profile = {
      financialNeed: FinancialNeed.HIGH,
      pellGrantEligible: true,
      efcRange: '$0-$5,000',
    }
    const result = financialProfileSchema.safeParse(profile)
    expect(result.success).toBe(true)
  })
})
