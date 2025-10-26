/**
 * Academic Dimension Filter
 *
 * Filters scholarships based on academic criteria: GPA, SAT/ACT scores, class rank.
 * Handles range-based criteria (min/max GPA, test scores) and missing student data.
 *
 * @module lib/matching/filters/academic
 */

import type { Profile } from '@prisma/client'
import type { AcademicCriteria } from '@/types/scholarship'
import type { HardFilterResult, FailedCriterion } from '../hard-filter'
import { FilterDimension } from '../hard-filter'

/**
 * Apply academic dimension filter
 *
 * Checks student's academic profile against scholarship requirements:
 * - GPA (min/max range)
 * - SAT score (min/max range)
 * - ACT score (min/max range)
 * - Class rank percentile
 *
 * Missing student data treated as failure if criterion is required.
 *
 * @param profile - Student profile with academic data
 * @param criteria - Academic eligibility criteria from scholarship
 * @returns HardFilterResult with pass/fail and failure details
 */
export function filterAcademic(
  profile: Profile,
  criteria: AcademicCriteria | undefined
): HardFilterResult {
  // If no criteria specified, pass by default
  if (!criteria) {
    return { eligible: true, failedCriteria: [] }
  }

  const failedCriteria: FailedCriterion[] = []

  // Check minimum GPA requirement
  if (criteria.minGPA !== undefined) {
    if (profile.gpa === null || profile.gpa === undefined) {
      failedCriteria.push({
        dimension: FilterDimension.ACADEMIC,
        criterion: 'minGPA',
        required: criteria.minGPA,
        actual: null,
      })
    } else if (profile.gpa < criteria.minGPA) {
      failedCriteria.push({
        dimension: FilterDimension.ACADEMIC,
        criterion: 'minGPA',
        required: criteria.minGPA,
        actual: profile.gpa,
      })
    }
  }

  // Check maximum GPA requirement (for need-based scholarships)
  if (criteria.maxGPA !== undefined) {
    if (profile.gpa !== null && profile.gpa !== undefined && profile.gpa > criteria.maxGPA) {
      failedCriteria.push({
        dimension: FilterDimension.ACADEMIC,
        criterion: 'maxGPA',
        required: criteria.maxGPA,
        actual: profile.gpa,
      })
    }
  }

  // Check minimum SAT score requirement
  if (criteria.minSAT !== undefined) {
    if (profile.satScore === null || profile.satScore === undefined) {
      failedCriteria.push({
        dimension: FilterDimension.ACADEMIC,
        criterion: 'minSAT',
        required: criteria.minSAT,
        actual: null,
      })
    } else if (profile.satScore < criteria.minSAT) {
      failedCriteria.push({
        dimension: FilterDimension.ACADEMIC,
        criterion: 'minSAT',
        required: criteria.minSAT,
        actual: profile.satScore,
      })
    }
  }

  // Check maximum SAT score requirement (for need-based scholarships)
  if (criteria.maxSAT !== undefined) {
    if (profile.satScore !== null && profile.satScore !== undefined && profile.satScore > criteria.maxSAT) {
      failedCriteria.push({
        dimension: FilterDimension.ACADEMIC,
        criterion: 'maxSAT',
        required: criteria.maxSAT,
        actual: profile.satScore,
      })
    }
  }

  // Check minimum ACT score requirement
  if (criteria.minACT !== undefined) {
    if (profile.actScore === null || profile.actScore === undefined) {
      failedCriteria.push({
        dimension: FilterDimension.ACADEMIC,
        criterion: 'minACT',
        required: criteria.minACT,
        actual: null,
      })
    } else if (profile.actScore < criteria.minACT) {
      failedCriteria.push({
        dimension: FilterDimension.ACADEMIC,
        criterion: 'minACT',
        required: criteria.minACT,
        actual: profile.actScore,
      })
    }
  }

  // Check maximum ACT score requirement (for need-based scholarships)
  if (criteria.maxACT !== undefined) {
    if (profile.actScore !== null && profile.actScore !== undefined && profile.actScore > criteria.maxACT) {
      failedCriteria.push({
        dimension: FilterDimension.ACADEMIC,
        criterion: 'maxACT',
        required: criteria.maxACT,
        actual: profile.actScore,
      })
    }
  }

  // Check class rank percentile requirement
  if (criteria.classRankPercentile !== undefined) {
    if (profile.classRank && profile.classSize && profile.classSize > 0) {
      // Calculate percentile: (rank / size) * 100
      // Lower rank is better (rank 1 = top student)
      const percentile = (profile.classRank / profile.classSize) * 100

      // Requirement is top X% (e.g., top 10% means percentile must be <= 10)
      if (percentile > criteria.classRankPercentile) {
        failedCriteria.push({
          dimension: FilterDimension.ACADEMIC,
          criterion: 'classRankPercentile',
          required: criteria.classRankPercentile,
          actual: percentile,
        })
      }
    } else {
      // Missing class rank data when required
      failedCriteria.push({
        dimension: FilterDimension.ACADEMIC,
        criterion: 'classRankPercentile',
        required: criteria.classRankPercentile,
        actual: null,
      })
    }
  }

  return {
    eligible: failedCriteria.length === 0,
    failedCriteria,
  }
}
