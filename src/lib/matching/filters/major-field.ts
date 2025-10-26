/**
 * Major/Field Dimension Filter
 *
 * Filters scholarships based on academic major and field of study criteria.
 * Handles list-based criteria for eligible majors, excluded majors, and fields of study.
 *
 * @module lib/matching/filters/major-field
 */

import type { Profile } from '@prisma/client'
import type { MajorFieldCriteria } from '@/types/scholarship'
import type { HardFilterResult, FailedCriterion } from '../hard-filter'
import { FilterDimension } from '../hard-filter'

/**
 * Apply major/field dimension filter
 *
 * Checks student's intended major and field of study against scholarship requirements:
 * - Eligible majors (student must be in the list)
 * - Excluded majors (student must NOT be in the list)
 * - Required field of study (student must be in one of the fields)
 *
 * List-based criteria use "any match" logic for eligible lists.
 *
 * @param profile - Student profile with major/field data
 * @param criteria - Major/field eligibility criteria from scholarship
 * @returns HardFilterResult with pass/fail and failure details
 */
export function filterMajorField(
  profile: Profile,
  criteria: MajorFieldCriteria | undefined
): HardFilterResult {
  // If no criteria specified, pass by default
  if (!criteria) {
    return { eligible: true, failedCriteria: [] }
  }

  const failedCriteria: FailedCriterion[] = []

  // Check eligible majors requirement
  if (criteria.eligibleMajors && criteria.eligibleMajors.length > 0) {
    if (!profile.intendedMajor) {
      failedCriteria.push({
        dimension: FilterDimension.MAJOR_FIELD,
        criterion: 'eligibleMajors',
        required: criteria.eligibleMajors,
        actual: null,
      })
    } else if (!criteria.eligibleMajors.includes(profile.intendedMajor)) {
      failedCriteria.push({
        dimension: FilterDimension.MAJOR_FIELD,
        criterion: 'eligibleMajors',
        required: criteria.eligibleMajors,
        actual: profile.intendedMajor,
      })
    }
  }

  // Check excluded majors (student's major must NOT be in this list)
  if (criteria.excludedMajors && criteria.excludedMajors.length > 0) {
    if (profile.intendedMajor && criteria.excludedMajors.includes(profile.intendedMajor)) {
      failedCriteria.push({
        dimension: FilterDimension.MAJOR_FIELD,
        criterion: 'excludedMajors',
        required: `Not in: ${criteria.excludedMajors.join(', ')}`,
        actual: profile.intendedMajor,
      })
    }
  }

  // Check required field of study
  if (criteria.requiredFieldOfStudy && criteria.requiredFieldOfStudy.length > 0) {
    if (!profile.fieldOfStudy) {
      failedCriteria.push({
        dimension: FilterDimension.MAJOR_FIELD,
        criterion: 'requiredFieldOfStudy',
        required: criteria.requiredFieldOfStudy,
        actual: null,
      })
    } else if (!criteria.requiredFieldOfStudy.includes(profile.fieldOfStudy)) {
      failedCriteria.push({
        dimension: FilterDimension.MAJOR_FIELD,
        criterion: 'requiredFieldOfStudy',
        required: criteria.requiredFieldOfStudy,
        actual: profile.fieldOfStudy,
      })
    }
  }

  // Check career goals keywords (if present in criteria)
  // This is a soft match - we check if any keyword appears in student's career goals
  if (criteria.careerGoalsKeywords && criteria.careerGoalsKeywords.length > 0) {
    if (!profile.careerGoals) {
      failedCriteria.push({
        dimension: FilterDimension.MAJOR_FIELD,
        criterion: 'careerGoalsKeywords',
        required: criteria.careerGoalsKeywords,
        actual: null,
      })
    } else {
      // Check if any keyword matches (case-insensitive)
      const careerGoalsLower = profile.careerGoals.toLowerCase()
      const hasMatch = criteria.careerGoalsKeywords.some((keyword) =>
        careerGoalsLower.includes(keyword.toLowerCase())
      )

      if (!hasMatch) {
        failedCriteria.push({
          dimension: FilterDimension.MAJOR_FIELD,
          criterion: 'careerGoalsKeywords',
          required: criteria.careerGoalsKeywords,
          actual: profile.careerGoals,
        })
      }
    }
  }

  return {
    eligible: failedCriteria.length === 0,
    failedCriteria,
  }
}
