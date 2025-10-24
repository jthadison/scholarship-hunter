import { z } from 'zod'
import { FinancialNeed } from '@prisma/client'

// ============================================================================
// Validation Constants
// ============================================================================

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU', 'AS', 'MP'
] as const

export const ETHNICITY_OPTIONS = [
  'Asian',
  'Black/African American',
  'Hispanic/Latino',
  'Native American/Alaska Native',
  'Native Hawaiian/Pacific Islander',
  'White/Caucasian',
  'Two or More Races',
  'Other',
  'Prefer not to say'
] as const

export const CITIZENSHIP_OPTIONS = [
  'US Citizen',
  'Permanent Resident',
  'International Student',
  'DACA Recipient',
  'Refugee/Asylee',
  'Other'
] as const

export const CURRENT_GRADE_OPTIONS = [
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
  'College Freshman',
  'College Sophomore',
  'College Junior',
  'College Senior',
  'Graduate Student',
  'Other'
] as const

// ============================================================================
// Academic Field Validations
// ============================================================================

export const gpaSchema = z.object({
  gpa: z.number()
    .min(0.0, 'GPA must be at least 0.0')
    .max(4.0, 'GPA cannot exceed 4.0 on standard scale')
    .nullable()
    .optional(),
  gpaScale: z.number()
    .min(1.0)
    .max(100)
    .default(4.0)
})

export const satScoreSchema = z.number()
  .int('SAT score must be a whole number')
  .min(400, 'SAT score must be at least 400')
  .max(1600, 'SAT score cannot exceed 1600')
  .nullable()
  .optional()

export const actScoreSchema = z.number()
  .int('ACT score must be a whole number')
  .min(1, 'ACT score must be at least 1')
  .max(36, 'ACT score cannot exceed 36')
  .nullable()
  .optional()

export const classRankSchema = z.object({
  classRank: z.number()
    .int('Class rank must be a whole number')
    .min(1, 'Class rank must be at least 1')
    .nullable()
    .optional(),
  classSize: z.number()
    .int('Class size must be a whole number')
    .min(1, 'Class size must be at least 1')
    .nullable()
    .optional()
}).refine(
  (data) => {
    // If both are provided, classRank must be <= classSize
    if (data.classRank !== null && data.classSize !== null &&
        data.classRank !== undefined && data.classSize !== undefined) {
      return data.classRank <= data.classSize
    }
    return true
  },
  {
    message: 'Class rank cannot exceed class size',
    path: ['classRank']
  }
)

export const graduationYearSchema = z.number()
  .int('Graduation year must be a whole number')
  .min(new Date().getFullYear(), `Graduation year must be ${new Date().getFullYear()} or later`)
  .max(new Date().getFullYear() + 6, `Graduation year cannot be more than 6 years in the future`)
  .nullable()
  .optional()

export const currentGradeSchema = z.enum(CURRENT_GRADE_OPTIONS)
  .nullable()
  .optional()

// ============================================================================
// Demographic Field Validations
// ============================================================================

export const genderSchema = z.string()
  .max(50, 'Gender must be 50 characters or less')
  .nullable()
  .optional()

export const ethnicitySchema = z.array(
  z.enum(ETHNICITY_OPTIONS)
).nullable()
  .optional()

export const stateSchema = z.enum(US_STATES, {
  errorMap: () => ({ message: 'Please select a valid US state or territory' })
}).nullable()
  .optional()

export const citySchema = z.string()
  .max(100, 'City name must be 100 characters or less')
  .nullable()
  .optional()

export const zipCodeSchema = z.string()
  .regex(
    /^\d{5}(-\d{4})?$/,
    'ZIP code must be in format XXXXX or XXXXX-XXXX'
  )
  .nullable()
  .optional()

export const citizenshipSchema = z.enum(CITIZENSHIP_OPTIONS, {
  errorMap: () => ({ message: 'Please select a valid citizenship status' })
}).nullable()
  .optional()

export const dateOfBirthSchema = z.date()
  .max(new Date(), 'Date of birth cannot be in the future')
  .min(
    new Date(new Date().getFullYear() - 100, 0, 1),
    'Date of birth must be within the last 100 years'
  )
  .nullable()
  .optional()

// ============================================================================
// Financial Need Field Validations
// ============================================================================

export const financialNeedSchema = z.nativeEnum(FinancialNeed, {
  errorMap: () => ({ message: 'Please select a valid financial need level' })
}).nullable()
  .optional()

export const pellGrantEligibleSchema = z.boolean().default(false)

export const efcRangeSchema = z.enum([
  '$0-$5,000',
  '$5,001-$10,000',
  '$10,001-$20,000',
  '$20,001-$30,000',
  '$30,000+'
], {
  errorMap: () => ({ message: 'Please select a valid EFC range' })
}).nullable()
  .optional()

// ============================================================================
// Complete Profile Schemas
// ============================================================================

export const academicProfileSchema = z.object({
  gpa: z.number()
    .min(0.0, 'GPA must be at least 0.0')
    .max(4.0, 'GPA cannot exceed 4.0 on standard scale')
    .nullable()
    .optional(),
  gpaScale: z.number()
    .min(1.0)
    .max(100)
    .default(4.0),
  satScore: satScoreSchema,
  actScore: actScoreSchema,
  classRank: z.number()
    .int('Class rank must be a whole number')
    .min(1, 'Class rank must be at least 1')
    .nullable()
    .optional(),
  classSize: z.number()
    .int('Class size must be a whole number')
    .min(1, 'Class size must be at least 1')
    .nullable()
    .optional(),
  graduationYear: graduationYearSchema,
  currentGrade: currentGradeSchema
}).refine(
  (data) => {
    if (data.classRank !== null && data.classSize !== null &&
        data.classRank !== undefined && data.classSize !== undefined) {
      return data.classRank <= data.classSize
    }
    return true
  },
  {
    message: 'Class rank cannot exceed class size',
    path: ['classRank']
  }
)

export const demographicProfileSchema = z.object({
  gender: genderSchema,
  ethnicity: ethnicitySchema,
  state: stateSchema,
  city: citySchema,
  zipCode: zipCodeSchema,
  citizenship: citizenshipSchema
})

export const financialProfileSchema = z.object({
  financialNeed: financialNeedSchema,
  pellGrantEligible: pellGrantEligibleSchema,
  efcRange: efcRangeSchema
})

export const completeProfileSchema = z.object({
  // Academic fields
  gpa: z.number()
    .min(0.0)
    .max(4.0)
    .nullable()
    .optional(),
  gpaScale: z.number()
    .min(1.0)
    .max(100)
    .default(4.0),
  satScore: satScoreSchema,
  actScore: actScoreSchema,
  classRank: z.number()
    .int()
    .min(1)
    .nullable()
    .optional(),
  classSize: z.number()
    .int()
    .min(1)
    .nullable()
    .optional(),
  graduationYear: graduationYearSchema,
  currentGrade: currentGradeSchema,

  // Demographic fields
  gender: genderSchema,
  ethnicity: ethnicitySchema,
  state: stateSchema,
  city: citySchema,
  zipCode: zipCodeSchema,
  citizenship: citizenshipSchema,

  // Financial fields
  financialNeed: financialNeedSchema,
  pellGrantEligible: pellGrantEligibleSchema,
  efcRange: efcRangeSchema
}).refine(
  (data) => {
    if (data.classRank !== null && data.classSize !== null &&
        data.classRank !== undefined && data.classSize !== undefined) {
      return data.classRank <= data.classSize
    }
    return true
  },
  {
    message: 'Class rank cannot exceed class size',
    path: ['classRank']
  }
)

// ============================================================================
// Profile Completeness Calculation
// ============================================================================

export interface ProfileCompletenessResult {
  completionPercentage: number
  requiredFieldsComplete: number
  requiredFieldsTotal: number
  optionalFieldsComplete: number
  optionalFieldsTotal: number
  missingRequired: string[]
  missingRecommended: string[]
}

/**
 * Calculate profile completeness percentage based on field completion
 * Required fields weighted at 70%, optional fields at 30%
 * @param profile - Profile data to analyze
 * @returns ProfileCompletenessResult with percentage and missing field lists
 */
export function calculateProfileCompleteness(
  profile: Partial<z.infer<typeof completeProfileSchema>>
): ProfileCompletenessResult {
  // Required fields (70% weight) - Critical for matching
  const requiredFields: (keyof typeof profile)[] = [
    'graduationYear',
    'citizenship',
    'state',
    'financialNeed'
  ]

  // Optional but recommended fields (30% weight) - Enhance matching
  const optionalFields: (keyof typeof profile)[] = [
    'gpa',
    'satScore',
    'actScore',
    'classRank',
    'classSize',
    'currentGrade',
    'gender',
    'ethnicity',
    'city',
    'zipCode',
    'pellGrantEligible',
    'efcRange'
  ]

  const missingRequired: string[] = []
  const missingRecommended: string[] = []

  // Count completed required fields
  let requiredComplete = 0
  for (const field of requiredFields) {
    const value = profile[field]
    if (value !== null && value !== undefined && value !== '') {
      requiredComplete++
    } else {
      missingRequired.push(fieldNameToLabel(field))
    }
  }

  // Count completed optional fields
  let optionalComplete = 0
  for (const field of optionalFields) {
    const value = profile[field]
    if (value !== null && value !== undefined && value !== '') {
      // For arrays (ethnicity), check if array has items
      if (Array.isArray(value)) {
        if (value.length > 0) {
          optionalComplete++
        } else {
          missingRecommended.push(fieldNameToLabel(field))
        }
      } else {
        optionalComplete++
      }
    } else {
      missingRecommended.push(fieldNameToLabel(field))
    }
  }

  // Calculate weighted percentage
  const requiredPercentage = (requiredComplete / requiredFields.length) * 70
  const optionalPercentage = (optionalComplete / optionalFields.length) * 30
  const completionPercentage = Math.round(requiredPercentage + optionalPercentage)

  return {
    completionPercentage,
    requiredFieldsComplete: requiredComplete,
    requiredFieldsTotal: requiredFields.length,
    optionalFieldsComplete: optionalComplete,
    optionalFieldsTotal: optionalFields.length,
    missingRequired,
    missingRecommended
  }
}

/**
 * Convert field name to human-readable label
 */
function fieldNameToLabel(fieldName: string): string {
  const labels: Record<string, string> = {
    gpa: 'GPA',
    gpaScale: 'GPA Scale',
    satScore: 'SAT Score',
    actScore: 'ACT Score',
    classRank: 'Class Rank',
    classSize: 'Class Size',
    graduationYear: 'Graduation Year',
    currentGrade: 'Current Grade',
    gender: 'Gender',
    ethnicity: 'Ethnicity',
    state: 'State',
    city: 'City',
    zipCode: 'ZIP Code',
    citizenship: 'Citizenship Status',
    financialNeed: 'Financial Need Level',
    pellGrantEligible: 'Pell Grant Eligibility',
    efcRange: 'Expected Family Contribution (EFC)'
  }

  return labels[fieldName] || fieldName
}

// ============================================================================
// Type Exports
// ============================================================================

export type AcademicProfile = z.infer<typeof academicProfileSchema>
export type DemographicProfile = z.infer<typeof demographicProfileSchema>
export type FinancialProfile = z.infer<typeof financialProfileSchema>
export type CompleteProfile = z.infer<typeof completeProfileSchema>
