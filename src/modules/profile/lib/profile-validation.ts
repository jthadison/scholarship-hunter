import { z } from 'zod'
import { FinancialNeed } from '@prisma/client'
import majorsData from '../../../data/majors.json'
import type { MissingField } from '../types'

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
// Major & Field of Study Validations (Story 1.5)
// ============================================================================

// Extract major list from JSON for validation
const validMajors = Object.keys((majorsData as any).majorToFieldMap)

export const intendedMajorSchema = z.string()
  .refine(
    (major) => validMajors.includes(major) || major === 'Other',
    'Please select a valid major from the list'
  )
  .nullable()
  .optional()

export const fieldOfStudySchema = z.enum([
  'STEM',
  'Business',
  'Humanities',
  'Social Sciences',
  'Health Sciences',
  'Arts',
  'Communications',
  'Education',
  'Agriculture',
  'Law',
  'Other'
]).nullable()
  .optional()

export const careerGoalsSchema = z.string()
  .max(500, 'Career goals must be 500 characters or less')
  .nullable()
  .optional()

// ============================================================================
// Experience Field Validations (Story 1.5)
// ============================================================================

export const extracurricularActivitySchema = z.object({
  name: z.string()
    .min(1, 'Activity name is required')
    .max(100, 'Activity name must be 100 characters or less'),
  category: z.enum([
    'Sports',
    'Academic Clubs',
    'Arts/Music',
    'Community Service',
    'Other'
  ]),
  hoursPerWeek: z.number()
    .min(0, 'Hours per week must be at least 0')
    .max(40, 'Hours per week cannot exceed 40')
    .int('Hours per week must be a whole number'),
  yearsInvolved: z.number()
    .min(0, 'Years involved must be at least 0')
    .max(6, 'Years involved cannot exceed 6')
    .int('Years involved must be a whole number'),
  description: z.string()
    .max(200, 'Description must be 200 characters or less')
    .optional(),
  isLeadership: z.boolean().optional(),
  leadershipTitle: z.string()
    .max(100, 'Leadership title must be 100 characters or less')
    .optional()
})

export const extracurricularsArraySchema = z.array(extracurricularActivitySchema)
  .nullable()
  .optional()

export const workExperienceSchema = z.object({
  jobTitle: z.string()
    .min(1, 'Job title is required')
    .max(100, 'Job title must be 100 characters or less'),
  employer: z.string()
    .min(1, 'Employer is required')
    .max(100, 'Employer name must be 100 characters or less'),
  startDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Start date must be a valid date'),
  endDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'End date must be a valid date')
    .optional(),
  hoursPerWeek: z.number()
    .min(0, 'Hours per week must be at least 0')
    .max(80, 'Hours per week cannot exceed 80')
    .int('Hours per week must be a whole number'),
  description: z.string()
    .max(300, 'Description must be 300 characters or less')
    .optional()
}).refine(
  (data) => {
    // If both dates provided, endDate must be after startDate
    if (data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate)
    }
    return true
  },
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
)

export const workExperienceArraySchema = z.array(workExperienceSchema)
  .nullable()
  .optional()

export const leadershipRoleSchema = z.object({
  title: z.string()
    .min(1, 'Leadership title is required')
    .max(100, 'Title must be 100 characters or less'),
  organization: z.string()
    .min(1, 'Organization is required')
    .max(100, 'Organization name must be 100 characters or less'),
  startDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Start date must be a valid date'),
  endDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'End date must be a valid date')
    .optional(),
  description: z.string()
    .max(200, 'Description must be 200 characters or less')
    .optional()
}).refine(
  (data) => {
    if (data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate)
    }
    return true
  },
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
)

export const leadershipRolesArraySchema = z.array(leadershipRoleSchema)
  .nullable()
  .optional()

export const awardHonorSchema = z.object({
  name: z.string()
    .min(1, 'Award name is required')
    .max(150, 'Award name must be 150 characters or less'),
  issuer: z.string()
    .min(1, 'Issuing organization is required')
    .max(100, 'Issuer name must be 100 characters or less'),
  date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Date must be a valid date'),
  level: z.enum(['School', 'Local', 'State', 'National', 'International']),
  description: z.string()
    .max(200, 'Description must be 200 characters or less')
    .optional()
})

export const awardsHonorsArraySchema = z.array(awardHonorSchema)
  .nullable()
  .optional()

export const volunteerHoursSchema = z.number()
  .int('Volunteer hours must be a whole number')
  .min(0, 'Volunteer hours cannot be negative')
  .default(0)

// ============================================================================
// Special Circumstances Validations (Story 1.5)
// ============================================================================

export const firstGenerationSchema = z.boolean().default(false)

export const militaryAffiliationSchema = z.enum([
  'None',
  'Active Duty',
  'Veteran',
  'Reserves/National Guard',
  'Military Dependent',
  'Gold Star Family'
]).nullable()
  .optional()

export const disabilitiesSchema = z.string()
  .max(200, 'Disabilities field must be 200 characters or less')
  .nullable()
  .optional()

export const additionalContextSchema = z.string()
  .max(2000, 'Additional context must be 2000 characters or less')
  .nullable()
  .optional()

// ============================================================================
// Complete Profile Schemas
// ============================================================================

// Base schema without refinement (for forms and merging)
const academicProfileBaseSchema = z.object({
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
})

// Schema with refinement for API validation
export const academicProfileSchema = academicProfileBaseSchema.refine(
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

// Export base schema for forms (no refinement, can be used with react-hook-form)
export const academicProfileFormSchema = academicProfileBaseSchema

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
  pellGrantEligible: z.boolean().optional(),
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
// Helper Functions (Story 1.5)
// ============================================================================

/**
 * Calculate total volunteer hours from extracurricular activities
 * Formula: sum(hoursPerWeek * 52 * yearsInvolved) for Community Service activities
 * @param extracurriculars - Array of extracurricular activities
 * @returns Total estimated volunteer hours
 */
export function calculateVolunteerHours(
  extracurriculars: Array<{ category: string; hoursPerWeek: number; yearsInvolved: number }> | null | undefined
): number {
  if (!extracurriculars || !Array.isArray(extracurriculars)) {
    return 0
  }

  return extracurriculars
    .filter(activity => activity.category === 'Community Service')
    .reduce((total, activity) => {
      const hoursPerYear = activity.hoursPerWeek * 52
      const totalHours = hoursPerYear * activity.yearsInvolved
      return total + totalHours
    }, 0)
}

/**
 * Get field of study from major using majors.json mapping
 * @param major - Selected major
 * @returns Field of study category
 */
export function getFieldOfStudyFromMajor(major: string | null | undefined): string | null {
  if (!major) return null
  const mapping = (majorsData as any).majorToFieldMap
  return mapping[major] || null
}

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
 * Required fields weighted at 70%, optional fields at 30% (Story 1.6)
 * @param profile - Profile data to analyze (extended with experience & special circumstances)
 * @returns ProfileCompletenessResult with percentage and missing field lists
 */
export function calculateProfileCompleteness(
  profile: Partial<z.infer<typeof completeProfileSchema> & {
    intendedMajor?: string | null
    fieldOfStudy?: string | null
    careerGoals?: string | null
    extracurriculars?: any[] | null
    workExperience?: any[] | null
    leadershipRoles?: any[] | null
    awardsHonors?: any[] | null
    volunteerHours?: number | null
    firstGeneration?: boolean
    militaryAffiliation?: string | null
    disabilities?: string | null
    additionalContext?: string | null
  }>
): ProfileCompletenessResult {
  // Required fields (70% weight) - Story 1.6: 10 critical fields for matching
  const requiredFields: (keyof typeof profile)[] = [
    'gpa',
    'graduationYear',
    'currentGrade',
    'gender',
    'ethnicity',
    'state',
    'citizenship',
    'intendedMajor',
    'fieldOfStudy',
    'financialNeed'
  ]

  // Optional but recommended fields (30% weight) - Story 1.6: 12 fields enhance matching
  const optionalFields: (keyof typeof profile)[] = [
    'satScore',
    'actScore',
    'classRank',
    'extracurriculars',
    'volunteerHours',
    'workExperience',
    'leadershipRoles',
    'awardsHonors',
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
      // For arrays (ethnicity), check if array has items
      if (Array.isArray(value)) {
        if (value.length > 0) {
          requiredComplete++
        } else {
          missingRequired.push(fieldNameToLabel(field))
        }
      } else {
        requiredComplete++
      }
    } else {
      missingRequired.push(fieldNameToLabel(field))
    }
  }

  // Count completed optional fields
  let optionalComplete = 0
  for (const field of optionalFields) {
    const value = profile[field]

    // Handle special cases
    if (field === 'satScore' || field === 'actScore') {
      // Count as complete if either SAT or ACT is provided (not both required)
      const satScore = profile.satScore
      const actScore = profile.actScore
      if ((satScore !== null && satScore !== undefined) || (actScore !== null && actScore !== undefined)) {
        // Only count once for test scores (combine SAT/ACT into single optional item)
        if (field === 'satScore') {
          optionalComplete++
        }
        continue
      } else {
        if (field === 'satScore') {
          missingRecommended.push('SAT or ACT Score')
        }
        continue
      }
    }

    if (field === 'volunteerHours') {
      // Count as complete if > 0
      if (value && typeof value === 'number' && value > 0) {
        optionalComplete++
      } else {
        missingRecommended.push(fieldNameToLabel(field))
      }
      continue
    }

    if (value !== null && value !== undefined && value !== '') {
      // For arrays, check if array has items
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

  // Calculate weighted percentage (70% required, 30% optional - Story 1.6)
  const requiredPercentage = (requiredComplete / requiredFields.length) * 0.7
  const optionalPercentage = (optionalComplete / (optionalFields.length - 1)) * 0.3 // -1 because SAT/ACT counted together
  const completionPercentage = Math.round((requiredPercentage + optionalPercentage) * 100)

  return {
    completionPercentage,
    requiredFieldsComplete: requiredComplete,
    requiredFieldsTotal: requiredFields.length,
    optionalFieldsComplete: optionalComplete,
    optionalFieldsTotal: optionalFields.length - 1, // -1 because SAT/ACT counted together
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
    efcRange: 'Expected Family Contribution (EFC)',
    // Story 1.5: Major & field of study
    intendedMajor: 'Intended Major',
    fieldOfStudy: 'Field of Study',
    careerGoals: 'Career Goals',
    // Story 1.5: Experience fields
    extracurriculars: 'Extracurricular Activities',
    workExperience: 'Work Experience',
    leadershipRoles: 'Leadership Roles',
    awardsHonors: 'Awards & Honors',
    volunteerHours: 'Volunteer Hours',
    // Story 1.5: Special circumstances
    firstGeneration: 'First-Generation Student',
    militaryAffiliation: 'Military Affiliation',
    disabilities: 'Disabilities',
    additionalContext: 'Additional Context'
  }

  return labels[fieldName] || fieldName
}

// ============================================================================
// Story 1.6: Missing Fields Detection and Prompts
// ============================================================================

/**
 * Get missing fields with user-friendly prompts and estimated impact
 * @param profile - Profile data to analyze
 * @returns Array of missing fields with metadata
 */
export function getMissingFields(
  profile: Parameters<typeof calculateProfileCompleteness>[0]
): MissingField[] {
  const completenessResult = calculateProfileCompleteness(profile)
  const missingFields: MissingField[] = []

  // Map of field names to categories
  const fieldCategories: Record<string, string> = {
    gpa: 'Academic',
    graduationYear: 'Academic',
    currentGrade: 'Academic',
    satScore: 'Academic',
    actScore: 'Academic',
    classRank: 'Academic',
    gender: 'Demographics',
    ethnicity: 'Demographics',
    state: 'Demographics',
    city: 'Demographics',
    zipCode: 'Demographics',
    citizenship: 'Demographics',
    intendedMajor: 'Major & Career',
    fieldOfStudy: 'Major & Career',
    careerGoals: 'Major & Career',
    financialNeed: 'Financial',
    pellGrantEligible: 'Financial',
    efcRange: 'Financial',
    extracurriculars: 'Experience',
    volunteerHours: 'Experience',
    workExperience: 'Experience',
    leadershipRoles: 'Experience',
    awardsHonors: 'Experience'
  }

  // Generate prompts for missing required fields
  for (const fieldLabel of completenessResult.missingRequired) {
    const fieldName = labelToFieldName(fieldLabel)
    const prompt = generatePrompt(fieldName, true)
    const impact = calculateImpactIncrease(profile, fieldName, true)

    missingFields.push({
      field: fieldName,
      label: fieldLabel,
      isRequired: true,
      category: fieldCategories[fieldName] || 'Other',
      prompt,
      estimatedImpact: `+${impact}%`
    })
  }

  // Generate prompts for missing optional fields
  for (const fieldLabel of completenessResult.missingRecommended) {
    const fieldName = labelToFieldName(fieldLabel)
    const prompt = generatePrompt(fieldName, false)
    const impact = calculateImpactIncrease(profile, fieldName, false)

    missingFields.push({
      field: fieldName,
      label: fieldLabel,
      isRequired: false,
      category: fieldCategories[fieldName] || 'Other',
      prompt,
      estimatedImpact: `+${impact}%`
    })
  }

  // Sort: required first, then by impact
  return missingFields.sort((a, b) => {
    if (a.isRequired && !b.isRequired) return -1
    if (!a.isRequired && b.isRequired) return 1
    // Both same required status - sort by impact
    const impactA = parseInt(a.estimatedImpact.replace('+', '').replace('%', ''))
    const impactB = parseInt(b.estimatedImpact.replace('+', '').replace('%', ''))
    return impactB - impactA
  })
}

/**
 * Generate user-friendly prompt for a missing field
 */
function generatePrompt(fieldName: string, isRequired: boolean): string {
  const prompts: Record<string, string> = {
    gpa: 'Add your GPA to improve matching accuracy',
    graduationYear: 'Add your expected graduation year to find timely scholarships',
    currentGrade: 'Add your current grade level to match age-appropriate opportunities',
    satScore: 'Add test scores (SAT or ACT) to unlock merit-based scholarships',
    actScore: 'Add test scores (SAT or ACT) to unlock merit-based scholarships',
    classRank: 'Add your class rank to qualify for top-performer scholarships',
    gender: 'Add your gender to access gender-specific scholarships',
    ethnicity: 'Add your ethnicity to discover diversity scholarships',
    state: 'Add your state to find local and regional opportunities',
    city: 'Add your city for more precise local scholarship matches',
    zipCode: 'Add your ZIP code for hyper-local scholarship opportunities',
    citizenship: 'Add your citizenship status to filter eligible scholarships',
    intendedMajor: 'Add your intended major to find field-specific scholarships',
    fieldOfStudy: 'Add your field of study to unlock career-focused funding',
    careerGoals: 'Add your career goals to personalize scholarship recommendations',
    financialNeed: 'Add your financial need level to prioritize need-based aid',
    pellGrantEligible: 'Add Pell Grant eligibility to access low-income scholarships',
    efcRange: 'Add your EFC range to refine financial need matching',
    extracurriculars: 'Add extracurricular activities to showcase your involvement',
    volunteerHours: 'Add volunteer hours to qualify for community service awards',
    workExperience: 'Add work experience to demonstrate responsibility',
    leadershipRoles: 'Add leadership roles to qualify for leadership scholarships',
    awardsHonors: 'Add awards and honors to highlight your achievements'
  }

  return prompts[fieldName] || `Add ${fieldNameToLabel(fieldName)} to complete your profile`
}

/**
 * Calculate estimated completion percentage increase if field is added
 */
function calculateImpactIncrease(
  profile: Parameters<typeof calculateProfileCompleteness>[0],
  fieldName: string,
  isRequired: boolean
): number {
  const currentCompleteness = calculateProfileCompleteness(profile).completionPercentage

  // Simulate adding this field
  const simulatedProfile = { ...profile, [fieldName]: 'dummy_value' }
  const newCompleteness = calculateProfileCompleteness(simulatedProfile).completionPercentage

  return Math.max(0, newCompleteness - currentCompleteness)
}

/**
 * Convert human-readable label back to field name
 */
function labelToFieldName(label: string): string {
  const labelMap: Record<string, string> = {
    'GPA': 'gpa',
    'GPA Scale': 'gpaScale',
    'SAT Score': 'satScore',
    'ACT Score': 'actScore',
    'SAT or ACT Score': 'satScore',
    'Class Rank': 'classRank',
    'Class Size': 'classSize',
    'Graduation Year': 'graduationYear',
    'Current Grade': 'currentGrade',
    'Gender': 'gender',
    'Ethnicity': 'ethnicity',
    'State': 'state',
    'City': 'city',
    'ZIP Code': 'zipCode',
    'Citizenship Status': 'citizenship',
    'Financial Need Level': 'financialNeed',
    'Pell Grant Eligibility': 'pellGrantEligible',
    'Expected Family Contribution (EFC)': 'efcRange',
    'Intended Major': 'intendedMajor',
    'Field of Study': 'fieldOfStudy',
    'Career Goals': 'careerGoals',
    'Extracurricular Activities': 'extracurriculars',
    'Work Experience': 'workExperience',
    'Leadership Roles': 'leadershipRoles',
    'Awards & Honors': 'awardsHonors',
    'Volunteer Hours': 'volunteerHours',
    'First-Generation Student': 'firstGeneration',
    'Military Affiliation': 'militaryAffiliation',
    'Disabilities': 'disabilities',
    'Additional Context': 'additionalContext'
  }

  return labelMap[label] || label.toLowerCase().replace(/ /g, '')
}

// ============================================================================
// Type Exports
// ============================================================================

export type AcademicProfile = z.infer<typeof academicProfileSchema>
export type DemographicProfile = z.infer<typeof demographicProfileSchema>
export type FinancialProfile = z.infer<typeof financialProfileSchema>
export type CompleteProfile = z.infer<typeof completeProfileSchema>
