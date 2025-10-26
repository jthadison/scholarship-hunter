/**
 * Scholarship Eligibility Criteria Type Definitions
 *
 * Defines the 6-dimension eligibility model for scholarship matching per PRD FR008.
 * These types provide compile-time safety for the eligibilityCriteria JSON field
 * in the Scholarship Prisma model.
 *
 * @module types/scholarship
 */

/**
 * Academic eligibility criteria
 * Covers GPA, standardized test scores, class rank, and academic weighting
 */
export interface AcademicCriteria {
  /**
   * Minimum GPA required (0.0-4.0 scale)
   * @example 3.5
   */
  minGPA?: number

  /**
   * Maximum GPA allowed (for need-based or special programs)
   * @example 3.8
   */
  maxGPA?: number

  /**
   * Minimum SAT score required (400-1600 range)
   * @example 1200
   */
  minSAT?: number

  /**
   * Maximum SAT score allowed (for need-based programs)
   * @example 1400
   */
  maxSAT?: number

  /**
   * Minimum ACT score required (1-36 range)
   * @example 28
   */
  minACT?: number

  /**
   * Maximum ACT score allowed (for need-based programs)
   * @example 32
   */
  maxACT?: number

  /**
   * Class rank percentile requirement (Top X%)
   * @example 10 // Top 10%
   */
  classRankPercentile?: number

  /**
   * Weight of GPA in matching algorithm (0.0-1.0)
   * Higher values prioritize GPA more heavily
   * @example 0.7
   */
  gpaWeight?: number

  [key: string]: unknown
}

/**
 * Demographic eligibility criteria
 * Covers gender, ethnicity, age, geographic, and residency requirements
 */
export interface DemographicCriteria {
  /**
   * Required gender identity for eligibility
   */
  requiredGender?: 'Male' | 'Female' | 'Non-binary' | 'Any'

  /**
   * Required ethnicity/race for eligibility
   * Empty array or undefined means any ethnicity eligible
   * @example ['Hispanic', 'African American']
   */
  requiredEthnicity?: string[]

  /**
   * Minimum age requirement
   * @example 16
   */
  ageMin?: number

  /**
   * Maximum age requirement
   * @example 25
   */
  ageMax?: number

  /**
   * Required US states for eligibility
   * @example ['CA', 'NY', 'TX']
   */
  requiredState?: string[]

  /**
   * Required cities for eligibility
   * @example ['San Francisco', 'New York']
   */
  requiredCity?: string[]

  /**
   * Residency requirement type
   */
  residencyRequired?: 'In-State' | 'Out-of-State' | 'Any'

  [key: string]: unknown
}

/**
 * Major and field of study eligibility criteria
 * Covers academic majors, fields of study, and career goals
 */
export interface MajorFieldCriteria {
  /**
   * Specific majors that are eligible
   * @example ['Biology', 'Chemistry', 'Physics']
   */
  eligibleMajors?: string[]

  /**
   * Specific majors that are explicitly excluded
   * @example ['Business Administration']
   */
  excludedMajors?: string[]

  /**
   * Required broad field of study categories
   * @example ['STEM', 'Engineering']
   */
  requiredFieldOfStudy?: string[]

  /**
   * Keywords related to career goals that indicate fit
   * @example ['healthcare', 'medical research', 'nursing']
   */
  careerGoalsKeywords?: string[]

  [key: string]: unknown
}

/**
 * Experience eligibility criteria
 * Covers extracurricular activities, volunteer work, leadership, and work experience
 */
export interface ExperienceCriteria {
  /**
   * Minimum volunteer hours required
   * @example 50
   */
  minVolunteerHours?: number

  /**
   * Specific extracurricular activities required
   * @example ['Debate Team', 'Student Government', 'Robotics Club']
   */
  requiredExtracurriculars?: string[]

  /**
   * Whether leadership experience is required
   */
  leadershipRequired?: boolean

  /**
   * Minimum work experience required (in months)
   * @example 12 // 1 year
   */
  minWorkExperience?: number

  /**
   * Whether awards or honors are required
   */
  awardsHonorsRequired?: boolean

  [key: string]: unknown
}

/**
 * Financial eligibility criteria
 * Covers financial need, EFC, and Pell Grant requirements
 */
export interface FinancialCriteria {
  /**
   * Whether financial need is required for eligibility
   */
  requiresFinancialNeed?: boolean

  /**
   * Maximum Expected Family Contribution (EFC) allowed
   * @example 5000 // $5,000 max EFC
   */
  maxEFC?: number

  /**
   * Whether Pell Grant eligibility is required
   */
  pellGrantRequired?: boolean

  /**
   * Required financial need level
   */
  financialNeedLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'

  [key: string]: unknown
}

/**
 * Special circumstances eligibility criteria
 * Covers first-generation status, military affiliation, disabilities, citizenship, etc.
 */
export interface SpecialCriteria {
  /**
   * Whether first-generation college student status is required
   */
  firstGenerationRequired?: boolean

  /**
   * Military affiliation requirement
   */
  militaryAffiliation?: 'None' | 'Veteran' | 'Dependent' | 'Active Duty' | 'Any'

  /**
   * Whether disability status is required
   */
  disabilityRequired?: boolean

  /**
   * Citizenship requirement
   */
  citizenshipRequired?: 'US Citizen' | 'Permanent Resident' | 'Any'

  /**
   * Other special requirements (free-form)
   * @example ['Must be pursuing teaching career', 'Must attend HBCU']
   */
  otherRequirements?: string[]

  [key: string]: unknown
}

/**
 * Complete eligibility criteria structure combining all 6 dimensions
 *
 * This is the top-level interface that maps to the eligibilityCriteria JSON field
 * in the Scholarship Prisma model. All fields are optional to allow scholarships
 * with varying levels of specificity.
 *
 * @example
 * ```typescript
 * const criteria: EligibilityCriteria = {
 *   academic: {
 *     minGPA: 3.5,
 *     minSAT: 1300
 *   },
 *   demographic: {
 *     requiredGender: 'Female'
 *   },
 *   majorField: {
 *     requiredFieldOfStudy: ['STEM']
 *   }
 * }
 * ```
 */
export interface EligibilityCriteria {
  /**
   * Academic eligibility requirements
   */
  academic?: AcademicCriteria

  /**
   * Demographic eligibility requirements
   */
  demographic?: DemographicCriteria

  /**
   * Major and field of study requirements
   */
  majorField?: MajorFieldCriteria

  /**
   * Experience and extracurricular requirements
   */
  experience?: ExperienceCriteria

  /**
   * Financial need requirements
   */
  financial?: FinancialCriteria

  /**
   * Special circumstances requirements
   */
  special?: SpecialCriteria

  [key: string]: unknown
}

/**
 * Essay prompt structure for scholarship applications
 */
export interface EssayPrompt {
  /**
   * The essay prompt text
   */
  prompt: string

  /**
   * Maximum word count allowed
   */
  wordLimit: number

  /**
   * Whether this essay is required (vs optional)
   */
  required: boolean

  [key: string]: unknown
}

/**
 * Type guard to check if an object is a valid EligibilityCriteria
 */
export function isEligibilityCriteria(obj: unknown): obj is EligibilityCriteria {
  if (typeof obj !== 'object' || obj === null) return false

  const criteria = obj as Record<string, unknown>

  // Check that if present, each dimension is an object
  const validDimensions = ['academic', 'demographic', 'majorField', 'experience', 'financial', 'special']

  for (const key of Object.keys(criteria)) {
    if (!validDimensions.includes(key)) return false
    if (typeof criteria[key] !== 'object' || criteria[key] === null) return false
  }

  return true
}

/**
 * Type guard to check if an object is a valid EssayPrompt
 */
export function isEssayPrompt(obj: unknown): obj is EssayPrompt {
  if (typeof obj !== 'object' || obj === null) return false

  const prompt = obj as Record<string, unknown>

  return (
    typeof prompt.prompt === 'string' &&
    typeof prompt.wordLimit === 'number' &&
    typeof prompt.required === 'boolean'
  )
}
