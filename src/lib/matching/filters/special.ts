/**
 * Special Criteria Dimension Filter
 *
 * Filters scholarships based on special circumstances: first-generation status,
 * military affiliation, disabilities, citizenship.
 *
 * @module lib/matching/filters/special
 */

import type { Profile } from '@prisma/client'
import type { SpecialCriteria } from '@/types/scholarship'
import type { HardFilterResult, FailedCriterion } from '../hard-filter'
import { FilterDimension } from '../hard-filter'

/**
 * Apply special criteria dimension filter
 *
 * Checks student's special circumstances against scholarship requirements:
 * - First-generation college student status
 * - Military affiliation
 * - Disability status
 * - Citizenship requirement
 * - Other special requirements (logged but not auto-rejected)
 *
 * @param profile - Student profile with special circumstances data
 * @param criteria - Special eligibility criteria from scholarship
 * @returns HardFilterResult with pass/fail and failure details
 */
export function filterSpecial(
  profile: Profile,
  criteria: SpecialCriteria | undefined
): HardFilterResult {
  // If no criteria specified, pass by default
  if (!criteria) {
    return { eligible: true, failedCriteria: [] }
  }

  const failedCriteria: FailedCriterion[] = []

  // Check first-generation requirement
  if (criteria.firstGenerationRequired === true) {
    if (!profile.firstGeneration) {
      failedCriteria.push({
        dimension: FilterDimension.SPECIAL,
        criterion: 'firstGenerationRequired',
        required: true,
        actual: false,
      })
    }
  }

  // Check military affiliation requirement
  if (criteria.militaryAffiliation && criteria.militaryAffiliation !== 'Any') {
    if (!profile.militaryAffiliation) {
      failedCriteria.push({
        dimension: FilterDimension.SPECIAL,
        criterion: 'militaryAffiliation',
        required: criteria.militaryAffiliation,
        actual: null,
      })
    } else if (profile.militaryAffiliation !== criteria.militaryAffiliation) {
      // Must match exactly (we already checked for 'Any' above)
      failedCriteria.push({
        dimension: FilterDimension.SPECIAL,
        criterion: 'militaryAffiliation',
        required: criteria.militaryAffiliation,
        actual: profile.militaryAffiliation,
      })
    }
  }

  // Check citizenship requirement
  if (criteria.citizenshipRequired && criteria.citizenshipRequired !== 'Any') {
    if (!profile.citizenship) {
      failedCriteria.push({
        dimension: FilterDimension.SPECIAL,
        criterion: 'citizenshipRequired',
        required: criteria.citizenshipRequired,
        actual: null,
      })
    } else if (profile.citizenship !== criteria.citizenshipRequired) {
      failedCriteria.push({
        dimension: FilterDimension.SPECIAL,
        criterion: 'citizenshipRequired',
        required: criteria.citizenshipRequired,
        actual: profile.citizenship,
      })
    }
  }

  // Check disability requirement
  if (criteria.disabilityRequired === true) {
    // Consider having any disability info as meeting the requirement
    if (!profile.disabilities || profile.disabilities.trim() === '') {
      failedCriteria.push({
        dimension: FilterDimension.SPECIAL,
        criterion: 'disabilityRequired',
        required: true,
        actual: false,
      })
    }
  }

  // Other requirements: Log for manual review but don't auto-reject
  // These are free-text requirements that need human interpretation
  if (criteria.otherRequirements && criteria.otherRequirements.length > 0) {
    // Don't fail automatically - these need Alex agent analysis (Story 2.12)
    console.log(
      `[Hard Filter] Scholarship has other requirements that need manual review:`,
      criteria.otherRequirements
    )
  }

  return {
    eligible: failedCriteria.length === 0,
    failedCriteria,
  }
}
