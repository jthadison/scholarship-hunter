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
  getMissingFields,
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

// ============================================================================
// Story 1.6: Profile Completeness Calculation Tests
// ============================================================================

describe('Profile Completeness Calculation (Story 1.6)', () => {
  it('AC1: should return 0% for empty profile', () => {
    const result = calculateProfileCompleteness({})
    expect(result.completionPercentage).toBe(0)
    expect(result.requiredFieldsComplete).toBe(0)
    expect(result.requiredFieldsTotal).toBe(10) // Story 1.6: 10 required fields
    expect(result.missingRequired.length).toBe(10)
  })

  it('AC1: should calculate 70% when all 10 required fields complete, no optional fields', () => {
    const profile = {
      // Story 1.6: All 10 required fields
      gpa: 3.8,
      graduationYear: 2025,
      currentGrade: '12th Grade' as const,
      gender: 'Female',
      ethnicity: ['Asian' as const],
      state: 'CA' as const,
      citizenship: 'US Citizen' as const,
      intendedMajor: 'Computer Science',
      fieldOfStudy: 'STEM' as const,
      financialNeed: FinancialNeed.MODERATE,
    }
    const result = calculateProfileCompleteness(profile)
    expect(result.completionPercentage).toBe(70)
    expect(result.requiredFieldsComplete).toBe(10)
    expect(result.missingRequired.length).toBe(0)
  })

  it('AC1: should calculate 100% when all required and optional fields complete', () => {
    const profile = {
      // Required (70% weight)
      gpa: 3.8,
      graduationYear: 2025,
      currentGrade: '12th Grade' as const,
      gender: 'Female',
      ethnicity: ['Asian' as const],
      state: 'CA' as const,
      citizenship: 'US Citizen' as const,
      intendedMajor: 'Computer Science',
      fieldOfStudy: 'STEM' as const,
      financialNeed: FinancialNeed.MODERATE,
      // Optional (30% weight) - Story 1.6: 11 optional fields (SAT/ACT counted together)
      satScore: 1450,
      actScore: null, // SAT/ACT counted as one optional field
      classRank: 15,
      extracurriculars: [{ name: 'Debate', category: 'Academic Clubs', hoursPerWeek: 5, yearsInvolved: 2 }],
      volunteerHours: 100,
      workExperience: [{ jobTitle: 'Tutor', employer: 'School', startDate: '2023-01-01', hoursPerWeek: 10 }],
      leadershipRoles: [{ title: 'President', organization: 'Debate Club', startDate: '2024-01-01' }],
      awardsHonors: [{ name: 'Honor Roll', issuer: 'School', date: '2024-05-01', level: 'School' as const }],
      city: 'Los Angeles',
      zipCode: '90210',
      pellGrantEligible: true,
      efcRange: '$0-$5,000' as const,
    }
    const result = calculateProfileCompleteness(profile)
    expect(result.completionPercentage).toBe(100)
    expect(result.requiredFieldsComplete).toBe(10)
    expect(result.optionalFieldsComplete).toBe(11) // All 11 optional fields
  })

  it('AC1: should calculate ~56% when missing 2 required fields but all optional complete', () => {
    const profile = {
      // Required: 8/10 complete (80% of required = 0.8 * 0.7 = 56%)
      gpa: 3.8,
      graduationYear: 2025,
      currentGrade: '12th Grade' as const,
      gender: 'Female',
      ethnicity: ['Asian' as const],
      state: 'CA' as const,
      citizenship: 'US Citizen' as const,
      intendedMajor: 'Computer Science',
      // Missing fieldOfStudy and financialNeed
      // Optional: all complete (100% of optional = 1.0 * 0.3 = 30%)
      satScore: 1450,
      classRank: 15,
      extracurriculars: [{ name: 'Debate', category: 'Academic Clubs', hoursPerWeek: 5, yearsInvolved: 2 }],
      volunteerHours: 100,
      workExperience: [{ jobTitle: 'Tutor', employer: 'School', startDate: '2023-01-01', hoursPerWeek: 10 }],
      leadershipRoles: [{ title: 'President', organization: 'Debate Club', startDate: '2024-01-01' }],
      awardsHonors: [{ name: 'Honor Roll', issuer: 'School', date: '2024-05-01', level: 'School' as const }],
      city: 'Los Angeles',
      zipCode: '90210',
      pellGrantEligible: true,
      efcRange: '$0-$5,000' as const,
    }
    const result = calculateProfileCompleteness(profile)
    // 8/10 required * 70% + 11/11 optional * 30% = 56% + 30% = 86%
    expect(result.completionPercentage).toBeGreaterThanOrEqual(85)
    expect(result.completionPercentage).toBeLessThanOrEqual(87)
  })

  it('AC2: should list missing required fields with correct labels', () => {
    const profile = {
      gpa: 3.8,
      graduationYear: 2025,
      // Missing: currentGrade, gender, ethnicity, state, citizenship, intendedMajor, fieldOfStudy, financialNeed
    }
    const result = calculateProfileCompleteness(profile)
    expect(result.missingRequired).toContain('Current Grade')
    expect(result.missingRequired).toContain('Gender')
    expect(result.missingRequired).toContain('Ethnicity')
    expect(result.missingRequired).toContain('State')
    expect(result.missingRequired).toContain('Citizenship Status')
    expect(result.missingRequired).toContain('Intended Major')
    expect(result.missingRequired).toContain('Field of Study')
    expect(result.missingRequired).toContain('Financial Need Level')
  })

  it('AC2: should list missing optional/recommended fields', () => {
    const profile = {
      gpa: 3.8,
      graduationYear: 2025,
      currentGrade: '12th Grade' as const,
      gender: 'Female',
      ethnicity: ['Asian' as const],
      state: 'CA' as const,
      citizenship: 'US Citizen' as const,
      intendedMajor: 'Computer Science',
      fieldOfStudy: 'STEM' as const,
      financialNeed: FinancialNeed.MODERATE,
      // Missing all optional fields
    }
    const result = calculateProfileCompleteness(profile)
    expect(result.missingRecommended).toContain('SAT or ACT Score')
    expect(result.missingRecommended).toContain('Class Rank')
    expect(result.missingRecommended).toContain('Extracurricular Activities')
  })

  it('should handle arrays (ethnicity, extracurriculars) correctly', () => {
    const profileWithArrays = {
      gpa: 3.8,
      graduationYear: 2025,
      currentGrade: '12th Grade' as const,
      gender: 'Female',
      ethnicity: ['Asian' as const, 'White/Caucasian' as const],
      state: 'CA' as const,
      citizenship: 'US Citizen' as const,
      intendedMajor: 'Computer Science',
      fieldOfStudy: 'STEM' as const,
      financialNeed: FinancialNeed.MODERATE,
      extracurriculars: [{ name: 'Debate', category: 'Academic Clubs', hoursPerWeek: 5, yearsInvolved: 2 }],
    }
    const resultWith = calculateProfileCompleteness(profileWithArrays)
    expect(resultWith.requiredFieldsComplete).toBe(10)
    expect(resultWith.optionalFieldsComplete).toBeGreaterThan(0)

    const profileEmptyArrays = {
      gpa: 3.8,
      graduationYear: 2025,
      currentGrade: '12th Grade' as const,
      gender: 'Female',
      ethnicity: [], // Empty array should count as missing
      state: 'CA' as const,
      citizenship: 'US Citizen' as const,
      intendedMajor: 'Computer Science',
      fieldOfStudy: 'STEM' as const,
      financialNeed: FinancialNeed.MODERATE,
      extracurriculars: [],
    }
    const resultEmpty = calculateProfileCompleteness(profileEmptyArrays)
    expect(resultEmpty.missingRequired).toContain('Ethnicity')
    expect(resultEmpty.missingRecommended).toContain('Extracurricular Activities')
  })
})

// ============================================================================
// Story 1.6: Missing Fields Detection Tests
// ============================================================================

describe('Missing Fields Detection (Story 1.6)', () => {
  it('AC2: should return prioritized missing fields with prompts', () => {
    const profile = {
      gpa: 3.8,
      graduationYear: 2025,
      // Missing most fields
    }
    const missingFields = getMissingFields(profile)

    expect(missingFields.length).toBeGreaterThan(0)
    expect(missingFields[0]).toHaveProperty('field')
    expect(missingFields[0]).toHaveProperty('label')
    expect(missingFields[0]).toHaveProperty('isRequired')
    expect(missingFields[0]).toHaveProperty('category')
    expect(missingFields[0]).toHaveProperty('prompt')
    expect(missingFields[0]).toHaveProperty('estimatedImpact')
  })

  it('AC2: should generate user-friendly prompts', () => {
    const profile = { gpa: 3.8 }
    const missingFields = getMissingFields(profile)

    const majorField = missingFields.find((f) => f.field === 'intendedMajor')
    expect(majorField).toBeDefined()
    expect(majorField?.prompt).toContain('major')
  })

  it('AC3: should distinguish required from optional fields', () => {
    const profile = { gpa: 3.8, graduationYear: 2025 }
    const missingFields = getMissingFields(profile)

    const requiredFields = missingFields.filter((f) => f.isRequired)
    const optionalFields = missingFields.filter((f) => !f.isRequired)

    expect(requiredFields.length).toBeGreaterThan(0)
    expect(optionalFields.length).toBeGreaterThan(0)

    // Required should come first in the sorted list
    const firstRequiredIndex = missingFields.findIndex((f) => f.isRequired)
    const firstOptionalIndex = missingFields.findIndex((f) => !f.isRequired)
    expect(firstRequiredIndex).toBeLessThan(firstOptionalIndex)
  })

  it('AC2: should provide estimated impact for each field', () => {
    const profile = { gpa: 3.8 }
    const missingFields = getMissingFields(profile)

    expect(missingFields[0].estimatedImpact).toMatch(/\+\d+%/)
  })

  it('AC2: should categorize missing fields', () => {
    const profile = {}
    const missingFields = getMissingFields(profile)

    const categories = new Set(missingFields.map((f) => f.category))
    expect(categories).toContain('Academic')
    expect(categories).toContain('Demographics')
    expect(categories).toContain('Financial')
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
      currentGrade: '12th Grade' as const,
    }
    const result = academicProfileSchema.safeParse(profile)
    expect(result.success).toBe(true)
  })

  it('should validate complete demographic profile', () => {
    const profile = {
      gender: 'Female',
      ethnicity: ['Asian' as const],
      state: 'CA' as const,
      city: 'Los Angeles',
      zipCode: '90210',
      citizenship: 'US Citizen' as const,
    }
    const result = demographicProfileSchema.safeParse(profile)
    expect(result.success).toBe(true)
  })

  it('should validate complete financial profile', () => {
    const profile = {
      financialNeed: FinancialNeed.HIGH,
      pellGrantEligible: true,
      efcRange: '$0-$5,000' as const,
    }
    const result = financialProfileSchema.safeParse(profile)
    expect(result.success).toBe(true)
  })
})
