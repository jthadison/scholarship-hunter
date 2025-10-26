/**
 * Demographic Match Scorer
 *
 * Calculates demographic dimension score (0-100) based on:
 * - Gender match
 * - Ethnicity/race match
 * - Geographic location (state, city)
 * - Age requirements
 * - Residency requirements
 *
 * @module server/lib/matching/scorers/demographic-scorer
 */

import type { Profile } from '@prisma/client'
import type { DemographicCriteria } from '@/types/scholarship'

/**
 * Calculate demographic match score between student profile and scholarship criteria
 *
 * @param profile - Student's demographic profile data
 * @param criteria - Scholarship's demographic eligibility criteria (optional)
 * @returns Score from 0-100
 *
 * @example
 * ```typescript
 * const profile = { gender: 'Female', ethnicity: ['Hispanic'], state: 'CA', ... }
 * const criteria = { requiredGender: 'Female', requiredEthnicity: ['Hispanic', 'African American'] }
 * const score = calculateDemographicMatch(profile, criteria)
 * // Returns: 100 (matches both gender and ethnicity)
 * ```
 */
export function calculateDemographicMatch(
  profile: Profile,
  criteria: DemographicCriteria | undefined
): number {
  // If no demographic criteria specified, student automatically qualifies
  if (!criteria) {
    return 100
  }

  const scores: number[] = []
  let criteriaCount = 0

  // Gender Scoring
  if (criteria.requiredGender && criteria.requiredGender !== 'Any') {
    criteriaCount++
    const genderScore = profile.gender === criteria.requiredGender ? 100 : 0
    scores.push(genderScore)
  }

  // Ethnicity Scoring
  if (criteria.requiredEthnicity && criteria.requiredEthnicity.length > 0) {
    criteriaCount++
    const ethnicityScore = calculateEthnicityScore(
      profile.ethnicity,
      criteria.requiredEthnicity
    )
    scores.push(ethnicityScore)
  }

  // State Scoring
  if (criteria.requiredState && criteria.requiredState.length > 0) {
    criteriaCount++
    const stateScore =
      profile.state && criteria.requiredState.includes(profile.state) ? 100 : 0
    scores.push(stateScore)
  }

  // City Scoring
  if (criteria.requiredCity && criteria.requiredCity.length > 0) {
    criteriaCount++
    const cityScore =
      profile.city && criteria.requiredCity.includes(profile.city) ? 100 : 0
    scores.push(cityScore)
  }

  // Age Scoring
  const ageScore = calculateAgeScore(profile.graduationYear, criteria)
  if (ageScore !== null) {
    criteriaCount++
    scores.push(ageScore)
  }

  // Residency Scoring
  if (criteria.residencyRequired && criteria.residencyRequired !== 'Any') {
    criteriaCount++
    // Note: This is a placeholder - actual residency status not in Profile model
    // Assuming all students are in-state for their state
    const residencyScore = 100 // Would need additional profile field
    scores.push(residencyScore)
  }

  // If no criteria specified, return 100
  if (criteriaCount === 0) {
    return 100
  }

  // Calculate average score across all criteria
  const totalScore = scores.reduce((sum, score) => sum + score, 0)
  return Math.round(totalScore / criteriaCount)
}

/**
 * Calculate ethnicity match score
 *
 * Supports multiple ethnicities - if student has ANY match with required ethnicities, full score
 */
function calculateEthnicityScore(
  studentEthnicity: string[],
  requiredEthnicity: string[]
): number {
  if (!studentEthnicity || studentEthnicity.length === 0) {
    return 0 // No ethnicity data = no match
  }

  // Check if any of student's ethnicities match required
  const hasMatch = studentEthnicity.some((ethnicity) =>
    requiredEthnicity.includes(ethnicity)
  )

  return hasMatch ? 100 : 0
}

/**
 * Calculate age score based on graduation year
 *
 * Uses graduation year as proxy for age since age field doesn't exist in Profile
 * Assumes: graduation year 2025 = approximately 18 years old in 2024
 */
function calculateAgeScore(
  graduationYear: number | null,
  criteria: DemographicCriteria
): number | null {
  const { ageMin, ageMax } = criteria

  // If no age criteria, skip this scoring
  if (ageMin === undefined && ageMax === undefined) {
    return null
  }

  if (graduationYear === null) {
    return 0 // Missing graduation year = can't determine age
  }

  // Estimate age: current year - (graduation year - 18)
  // Example: 2025 graduation year in 2024 = ~17-18 years old
  const currentYear = new Date().getFullYear()
  const estimatedAge = currentYear - (graduationYear - 18)

  // Check age range
  if (ageMin !== undefined && estimatedAge < ageMin) {
    // Too young - partial score based on how close
    const percentOfRequirement = (estimatedAge / ageMin) * 100
    return Math.round(Math.max(0, percentOfRequirement))
  }

  if (ageMax !== undefined && estimatedAge > ageMax) {
    // Too old - partial score based on how close
    const overage = estimatedAge - ageMax
    return Math.round(Math.max(0, 100 - overage * 10)) // Penalize 10 points per year over
  }

  return 100 // Within age range
}
