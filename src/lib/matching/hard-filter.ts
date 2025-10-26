/**
 * Hard Filter Module - Stage 1 of 4-Stage Matching Algorithm
 *
 * Implements binary pass/fail filtering across 6 eligibility dimensions to eliminate
 * scholarships where students fail must-have requirements. Performance-critical module
 * designed to handle 10,000+ scholarships in <100ms.
 *
 * @module lib/matching/hard-filter
 * @see docs/tech-spec-epic-2.md:226-248 - Stage 1 Hard Filtering specification
 */

import type { Student, Profile, Scholarship } from '@prisma/client'
import type { EligibilityCriteria } from '@/types/scholarship'
import { filterAcademic } from './filters/academic'
import { filterDemographic } from './filters/demographic'
import { filterMajorField } from './filters/major-field'
import { filterExperience } from './filters/experience'
import { filterFinancial } from './filters/financial'
import { filterSpecial } from './filters/special'

/**
 * Filter dimension enumeration
 * Represents the 6 core eligibility analysis dimensions per PRD FR008
 */
export enum FilterDimension {
  ACADEMIC = 'academic',
  DEMOGRAPHIC = 'demographic',
  MAJOR_FIELD = 'majorField',
  EXPERIENCE = 'experience',
  FINANCIAL = 'financial',
  SPECIAL = 'special',
}

/**
 * Failed criterion detail
 * Captures specific information about why a student failed a criterion
 */
export interface FailedCriterion {
  /** Which dimension this criterion belongs to */
  dimension: FilterDimension

  /** Name of the specific criterion that failed */
  criterion: string

  /** The required value per scholarship criteria */
  required: unknown

  /** The actual value from student profile */
  actual: unknown
}

/**
 * Hard filter result
 * Contains eligibility decision and detailed failure reasons
 */
export interface HardFilterResult {
  /** True if student passes all criteria, false if any criterion fails */
  eligible: boolean

  /** Array of all failed criteria with details for debugging/analysis */
  failedCriteria: FailedCriterion[]
}

/**
 * Hard filter configuration
 * Allows selective enabling/disabling of filter dimensions for testing
 */
export interface HardFilterConfig {
  /** Enable/disable individual dimension filters */
  enabledDimensions?: {
    academic?: boolean
    demographic?: boolean
    majorField?: boolean
    experience?: boolean
    financial?: boolean
    special?: boolean
  }

  /** Enable early-exit optimization (stop on first failure) */
  earlyExit?: boolean
}

/**
 * Student with profile type
 * Convenience type for student data with required profile relationship
 */
export type StudentWithProfile = Student & { profile: Profile }

/**
 * Filter statistics for performance monitoring
 */
export interface FilterStatistics {
  /** Total scholarships evaluated */
  totalScholarships: number

  /** Number of eligible scholarships */
  eligibleCount: number

  /** Number of rejected scholarships */
  rejectedCount: number

  /** Filter execution time in milliseconds */
  executionTimeMs: number

  /** Breakdown of rejections by dimension */
  rejectionsByDimension: Record<FilterDimension, number>
}

/**
 * Applies hard filters to a single student-scholarship pair
 *
 * Evaluates all 6 eligibility dimensions and returns a binary pass/fail result.
 * All dimensions must pass for the scholarship to be eligible. Any failure results
 * in immediate rejection (unless earlyExit is disabled for debugging).
 *
 * @param student - Student with profile data
 * @param scholarship - Scholarship with eligibilityCriteria
 * @param config - Optional configuration for selective filtering
 * @returns HardFilterResult with eligibility decision and failure details
 *
 * @example
 * ```typescript
 * const result = applyHardFilters(student, scholarship)
 * if (result.eligible) {
 *   // Proceed to match scoring (Story 2.4)
 * } else {
 *   // Log rejection reasons from result.failedCriteria
 * }
 * ```
 */
export function applyHardFilters(
  student: StudentWithProfile,
  scholarship: Scholarship,
  config?: HardFilterConfig
): HardFilterResult {
  const criteria = scholarship.eligibilityCriteria as EligibilityCriteria
  const failedCriteria: FailedCriterion[] = []

  // Default config: all dimensions enabled, early exit enabled
  const enabledDimensions = config?.enabledDimensions ?? {
    academic: true,
    demographic: true,
    majorField: true,
    experience: true,
    financial: true,
    special: true,
  }

  const earlyExit = config?.earlyExit ?? true

  // Apply each dimension filter in sequence
  // Order optimized for performance: academic first (most common filter)

  if (enabledDimensions.academic !== false) {
    const academicResult = filterAcademic(student.profile, criteria.academic)
    if (!academicResult.eligible) {
      failedCriteria.push(...academicResult.failedCriteria)
      if (earlyExit) {
        return { eligible: false, failedCriteria }
      }
    }
  }

  if (enabledDimensions.demographic !== false) {
    const demographicResult = filterDemographic(student.profile, criteria.demographic, student.dateOfBirth)
    if (!demographicResult.eligible) {
      failedCriteria.push(...demographicResult.failedCriteria)
      if (earlyExit) {
        return { eligible: false, failedCriteria }
      }
    }
  }

  if (enabledDimensions.majorField !== false) {
    const majorFieldResult = filterMajorField(student.profile, criteria.majorField)
    if (!majorFieldResult.eligible) {
      failedCriteria.push(...majorFieldResult.failedCriteria)
      if (earlyExit) {
        return { eligible: false, failedCriteria }
      }
    }
  }

  if (enabledDimensions.experience !== false) {
    const experienceResult = filterExperience(student.profile, criteria.experience)
    if (!experienceResult.eligible) {
      failedCriteria.push(...experienceResult.failedCriteria)
      if (earlyExit) {
        return { eligible: false, failedCriteria }
      }
    }
  }

  if (enabledDimensions.financial !== false) {
    const financialResult = filterFinancial(student.profile, criteria.financial)
    if (!financialResult.eligible) {
      failedCriteria.push(...financialResult.failedCriteria)
      if (earlyExit) {
        return { eligible: false, failedCriteria }
      }
    }
  }

  if (enabledDimensions.special !== false) {
    const specialResult = filterSpecial(student.profile, criteria.special)
    if (!specialResult.eligible) {
      failedCriteria.push(...specialResult.failedCriteria)
      if (earlyExit) {
        return { eligible: false, failedCriteria }
      }
    }
  }

  return {
    eligible: failedCriteria.length === 0,
    failedCriteria,
  }
}

/**
 * Batch filtering for multiple scholarships
 *
 * Performance-optimized function to filter an array of scholarships against a
 * student profile. Uses in-memory filtering with early-exit optimization.
 * Target: <100ms for 10,000 scholarships.
 *
 * @param student - Student with profile data
 * @param scholarships - Array of scholarships to filter
 * @param config - Optional configuration for selective filtering
 * @param includeStatistics - Whether to return detailed statistics (default: true)
 * @returns Filtered array of eligible scholarships
 *
 * @example
 * ```typescript
 * const eligibleScholarships = filterScholarships(student, allScholarships)
 * console.log(`Found ${eligibleScholarships.length} eligible scholarships`)
 * ```
 */
export function filterScholarships(
  student: StudentWithProfile,
  scholarships: Scholarship[],
  config?: HardFilterConfig,
  includeStatistics = false
): Scholarship[] {
  const startTime = includeStatistics ? performance.now() : 0
  const rejectionsByDimension: Record<FilterDimension, number> = {
    [FilterDimension.ACADEMIC]: 0,
    [FilterDimension.DEMOGRAPHIC]: 0,
    [FilterDimension.MAJOR_FIELD]: 0,
    [FilterDimension.EXPERIENCE]: 0,
    [FilterDimension.FINANCIAL]: 0,
    [FilterDimension.SPECIAL]: 0,
  }

  const eligible = scholarships.filter((scholarship) => {
    const result = applyHardFilters(student, scholarship, config)

    // Track rejection reasons
    if (!result.eligible && includeStatistics) {
      result.failedCriteria.forEach((failed) => {
        rejectionsByDimension[failed.dimension]++
      })
    }

    return result.eligible
  })

  const duration = performance.now() - startTime

  if (includeStatistics) {
    console.log(`[Hard Filter] Filtered ${scholarships.length} scholarships in ${duration.toFixed(2)}ms`)
    console.log(`[Hard Filter] Eligible: ${eligible.length}, Rejected: ${scholarships.length - eligible.length}`)
    console.log(`[Hard Filter] Rejections by dimension:`, rejectionsByDimension)
  }

  return eligible
}

/**
 * Get detailed filter statistics for a batch operation
 *
 * Runs filter analysis without actually filtering, useful for debugging
 * and understanding rejection patterns.
 *
 * @param student - Student with profile data
 * @param scholarships - Array of scholarships to analyze
 * @param config - Optional configuration for selective filtering
 * @returns Detailed statistics about filtering results
 */
export function getFilterStatistics(
  student: StudentWithProfile,
  scholarships: Scholarship[],
  config?: HardFilterConfig
): FilterStatistics {
  const startTime = performance.now()
  const rejectionsByDimension: Record<FilterDimension, number> = {
    [FilterDimension.ACADEMIC]: 0,
    [FilterDimension.DEMOGRAPHIC]: 0,
    [FilterDimension.MAJOR_FIELD]: 0,
    [FilterDimension.EXPERIENCE]: 0,
    [FilterDimension.FINANCIAL]: 0,
    [FilterDimension.SPECIAL]: 0,
  }

  let eligibleCount = 0

  scholarships.forEach((scholarship) => {
    const result = applyHardFilters(student, scholarship, config)

    if (result.eligible) {
      eligibleCount++
    } else {
      result.failedCriteria.forEach((failed) => {
        rejectionsByDimension[failed.dimension]++
      })
    }
  })

  const duration = performance.now() - startTime

  return {
    totalScholarships: scholarships.length,
    eligibleCount,
    rejectedCount: scholarships.length - eligibleCount,
    executionTimeMs: duration,
    rejectionsByDimension,
  }
}
