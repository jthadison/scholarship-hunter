/**
 * Demographic Dimension Filter
 *
 * Filters scholarships based on demographic criteria: gender, ethnicity, age, location.
 * Handles boolean criteria (gender), list-based criteria (ethnicity, state), and
 * range-based criteria (age).
 *
 * @module lib/matching/filters/demographic
 */

import type { Profile } from '@prisma/client'
import type { DemographicCriteria } from '@/types/scholarship'
import type { HardFilterResult, FailedCriterion } from '../hard-filter'
import { FilterDimension } from '../hard-filter'

/**
 * Calculate age from date of birth
 *
 * @param dateOfBirth - Date of birth
 * @returns Age in years
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

/**
 * Apply demographic dimension filter
 *
 * Checks student's demographic profile against scholarship requirements:
 * - Gender (exact match or "Any")
 * - Ethnicity (array intersection - student must match at least one)
 * - Age (min/max range)
 * - State (must be in required list)
 * - City (must be in required list)
 *
 * "Any" values in criteria mean no restriction.
 * List-based criteria use "any match" logic.
 *
 * @param profile - Student profile with demographic data
 * @param criteria - Demographic eligibility criteria from scholarship
 * @param dateOfBirth - Student's date of birth (from Student model, not Profile)
 * @returns HardFilterResult with pass/fail and failure details
 */
export function filterDemographic(
  profile: Profile,
  criteria: DemographicCriteria | undefined,
  dateOfBirth?: Date | null
): HardFilterResult {
  // If no criteria specified, pass by default
  if (!criteria) {
    return { eligible: true, failedCriteria: [] }
  }

  const failedCriteria: FailedCriterion[] = []

  // Check gender requirement
  if (criteria.requiredGender && criteria.requiredGender !== 'Any') {
    if (!profile.gender) {
      failedCriteria.push({
        dimension: FilterDimension.DEMOGRAPHIC,
        criterion: 'requiredGender',
        required: criteria.requiredGender,
        actual: null,
      })
    } else if (profile.gender !== criteria.requiredGender) {
      failedCriteria.push({
        dimension: FilterDimension.DEMOGRAPHIC,
        criterion: 'requiredGender',
        required: criteria.requiredGender,
        actual: profile.gender,
      })
    }
  }

  // Check ethnicity requirement (any match = pass)
  if (criteria.requiredEthnicity && criteria.requiredEthnicity.length > 0) {
    if (!profile.ethnicity || profile.ethnicity.length === 0) {
      failedCriteria.push({
        dimension: FilterDimension.DEMOGRAPHIC,
        criterion: 'requiredEthnicity',
        required: criteria.requiredEthnicity,
        actual: [],
      })
    } else {
      // Check if any student ethnicity matches required ethnicity
      const hasMatch = profile.ethnicity.some((e) => criteria.requiredEthnicity!.includes(e))

      if (!hasMatch) {
        failedCriteria.push({
          dimension: FilterDimension.DEMOGRAPHIC,
          criterion: 'requiredEthnicity',
          required: criteria.requiredEthnicity,
          actual: profile.ethnicity,
        })
      }
    }
  }

  // Check age range
  if (criteria.ageMin !== undefined || criteria.ageMax !== undefined) {
    if (!dateOfBirth) {
      failedCriteria.push({
        dimension: FilterDimension.DEMOGRAPHIC,
        criterion: 'age',
        required: `${criteria.ageMin ?? 'any'}-${criteria.ageMax ?? 'any'}`,
        actual: null,
      })
    } else {
      const age = calculateAge(dateOfBirth)

      // Check minimum age
      if (criteria.ageMin !== undefined && age < criteria.ageMin) {
        failedCriteria.push({
          dimension: FilterDimension.DEMOGRAPHIC,
          criterion: 'ageMin',
          required: criteria.ageMin,
          actual: age,
        })
      }

      // Check maximum age
      if (criteria.ageMax !== undefined && age > criteria.ageMax) {
        failedCriteria.push({
          dimension: FilterDimension.DEMOGRAPHIC,
          criterion: 'ageMax',
          required: criteria.ageMax,
          actual: age,
        })
      }
    }
  }

  // Check state requirement
  if (criteria.requiredState && criteria.requiredState.length > 0) {
    if (!profile.state) {
      failedCriteria.push({
        dimension: FilterDimension.DEMOGRAPHIC,
        criterion: 'requiredState',
        required: criteria.requiredState,
        actual: null,
      })
    } else if (!criteria.requiredState.includes(profile.state)) {
      failedCriteria.push({
        dimension: FilterDimension.DEMOGRAPHIC,
        criterion: 'requiredState',
        required: criteria.requiredState,
        actual: profile.state,
      })
    }
  }

  // Check city requirement
  if (criteria.requiredCity && criteria.requiredCity.length > 0) {
    if (!profile.city) {
      failedCriteria.push({
        dimension: FilterDimension.DEMOGRAPHIC,
        criterion: 'requiredCity',
        required: criteria.requiredCity,
        actual: null,
      })
    } else if (!criteria.requiredCity.includes(profile.city)) {
      failedCriteria.push({
        dimension: FilterDimension.DEMOGRAPHIC,
        criterion: 'requiredCity',
        required: criteria.requiredCity,
        actual: profile.city,
      })
    }
  }

  return {
    eligible: failedCriteria.length === 0,
    failedCriteria,
  }
}
