/**
 * Matching Algorithm Orchestration Module
 *
 * Coordinates the 4-stage matching algorithm:
 * 1. Hard Filtering (Story 2.3) - Implemented
 * 2. Match Scoring (Story 2.4) - TODO
 * 3. Strategic Value Scoring (Story 2.6) - TODO
 * 4. Priority Tiering (Story 2.7) - TODO
 *
 * @module lib/matching
 * @see docs/tech-spec-epic-2.md:222-363 - Complete matching algorithm specification
 */

import type { Student, Profile, Scholarship } from '@prisma/client'
import type { StudentWithProfile } from './hard-filter'
import { applyHardFilters, filterScholarships, getFilterStatistics } from './hard-filter'
import type { FilterStatistics } from './hard-filter'

/**
 * Matching result for a single student-scholarship pair
 */
export interface MatchingResult {
  /** Whether the scholarship is eligible (passed hard filters) */
  eligible: boolean

  /** Scholarship ID */
  scholarshipId: string

  /** Overall match score (0-100) - TODO: Implement in Story 2.4 */
  matchScore?: number

  /** Strategic value score - TODO: Implement in Story 2.6 */
  strategicValue?: number

  /** Priority tier - TODO: Implement in Story 2.7 */
  priorityTier?: string

  /** Detailed failure reasons if not eligible */
  failureReasons?: string[]
}

/**
 * Match a student against all scholarships
 *
 * Stage 1: Hard filtering to eliminate ineligible scholarships
 * Stages 2-4: TODO in future stories (2.4, 2.6, 2.7)
 *
 * @param student - Student with profile data
 * @param scholarships - Array of all scholarships to evaluate
 * @returns Array of matching results with eligibility and future scores
 *
 * @example
 * ```typescript
 * const results = await matchStudent(student, allScholarships)
 * const eligibleScholarships = results.filter(r => r.eligible)
 * console.log(`Found ${eligibleScholarships.length} eligible scholarships`)
 * ```
 */
export async function matchStudent(
  student: StudentWithProfile,
  scholarships: Scholarship[]
): Promise<MatchingResult[]> {
  console.log(`[Matching] Starting match for student ${student.id} against ${scholarships.length} scholarships`)

  // Stage 1: Hard Filtering
  const results: MatchingResult[] = scholarships.map((scholarship) => {
    const filterResult = applyHardFilters(student, scholarship)

    return {
      eligible: filterResult.eligible,
      scholarshipId: scholarship.id,
      failureReasons: filterResult.failedCriteria.map(
        (f) => `${f.dimension}.${f.criterion}: required ${f.required}, actual ${f.actual}`
      ),
    }
  })

  const eligibleCount = results.filter((r) => r.eligible).length

  console.log(`[Matching] Stage 1 complete: ${eligibleCount}/${scholarships.length} scholarships eligible`)
  console.log(`[Matching] Rejection rate: ${(((scholarships.length - eligibleCount) / scholarships.length) * 100).toFixed(1)}%`)

  // TODO Story 2.4: Apply match scoring to eligible scholarships
  // TODO Story 2.6: Calculate strategic value for high-scoring matches
  // TODO Story 2.7: Assign priority tiers based on scores and strategic value

  return results
}

/**
 * Get only eligible scholarships for a student (filtered)
 *
 * Convenience function that returns only scholarships that passed hard filters.
 * Use this when you need the actual scholarship objects, not just match results.
 *
 * @param student - Student with profile data
 * @param scholarships - Array of all scholarships to evaluate
 * @returns Array of eligible scholarships
 */
export function getEligibleScholarships(
  student: StudentWithProfile,
  scholarships: Scholarship[]
): Scholarship[] {
  return filterScholarships(student, scholarships)
}

/**
 * Get detailed matching statistics for debugging and analytics
 *
 * @param student - Student with profile data
 * @param scholarships - Array of all scholarships to evaluate
 * @returns Detailed statistics about filtering results
 */
export function getMatchingStatistics(
  student: StudentWithProfile,
  scholarships: Scholarship[]
): FilterStatistics {
  return getFilterStatistics(student, scholarships)
}

// Re-export key types and functions for convenience
export type { StudentWithProfile, HardFilterResult, FailedCriterion, FilterStatistics } from './hard-filter'
export { FilterDimension } from './hard-filter'
export { applyHardFilters, filterScholarships } from './hard-filter'
