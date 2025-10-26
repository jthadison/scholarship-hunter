/**
 * Special Criteria Match Scorer
 *
 * Calculates special criteria dimension score (0-100) based on:
 * - First-generation college student status
 * - Military affiliation
 * - Disability status
 * - Citizenship requirements
 * - Other special requirements
 *
 * @module server/lib/matching/scorers/special-criteria-scorer
 */

import type { Profile } from '@prisma/client'
import type { SpecialCriteria } from '@/types/scholarship'

/**
 * Calculate special criteria match score between student profile and scholarship criteria
 *
 * @param profile - Student's profile with special circumstances data
 * @param criteria - Scholarship's special criteria requirements (optional)
 * @returns Score from 0-100
 *
 * @example
 * ```typescript
 * const profile = { firstGeneration: true, militaryAffiliation: 'Veteran', disabilities: 'Visual impairment' }
 * const criteria = { firstGenerationRequired: true, militaryAffiliation: 'Any' }
 * const score = calculateSpecialCriteriaMatch(profile, criteria)
 * // Returns: 100 (matches first-gen and military requirements)
 * ```
 */
export function calculateSpecialCriteriaMatch(
  profile: Profile,
  criteria: SpecialCriteria | undefined
): number {
  // If no special criteria specified, student automatically qualifies
  if (!criteria) {
    return 100
  }

  const scores: number[] = []
  let criteriaCount = 0

  // First-Generation Status (weight: 30% of dimension)
  if (criteria.firstGenerationRequired !== undefined) {
    criteriaCount++
    const firstGenScore =
      profile.firstGeneration === criteria.firstGenerationRequired ? 100 : 0
    scores.push(firstGenScore)
  }

  // Military Affiliation (weight: 30% of dimension)
  if (criteria.militaryAffiliation && criteria.militaryAffiliation !== 'Any') {
    criteriaCount++
    const militaryScore = calculateMilitaryScore(
      profile.militaryAffiliation,
      criteria.militaryAffiliation
    )
    scores.push(militaryScore)
  }

  // Disability Status (weight: 20% of dimension)
  if (criteria.disabilityRequired !== undefined) {
    criteriaCount++
    const disabilityScore = calculateDisabilityScore(
      profile.disabilities,
      criteria.disabilityRequired
    )
    scores.push(disabilityScore)
  }

  // Citizenship Requirements (weight: 20% of dimension)
  if (
    criteria.citizenshipRequired &&
    criteria.citizenshipRequired !== 'Any'
  ) {
    criteriaCount++
    const citizenshipScore = calculateCitizenshipScore(
      profile.citizenship,
      criteria.citizenshipRequired
    )
    scores.push(citizenshipScore)
  }

  // Other Requirements (contextual, not scored automatically)
  // Would need to be evaluated based on additionalContext field

  // If no criteria specified, return 100
  if (criteriaCount === 0) {
    return 100
  }

  // Calculate average score across all special criteria
  const totalScore = scores.reduce((sum, score) => sum + score, 0)
  return Math.round(totalScore / criteriaCount)
}

/**
 * Calculate military affiliation score
 */
function calculateMilitaryScore(
  studentAffiliation: string | null,
  requiredAffiliation: 'None' | 'Veteran' | 'Dependent' | 'Active Duty' | 'Any'
): number {
  if (!studentAffiliation) {
    // No affiliation data
    if (requiredAffiliation === 'None') {
      return 100 // No affiliation required and student has none
    }
    return 0 // Affiliation required but student has none
  }

  // Exact match
  if (studentAffiliation === requiredAffiliation) {
    return 100
  }

  // 'Any' military affiliation - student has some affiliation
  if (requiredAffiliation === 'Any' && studentAffiliation !== 'None') {
    return 100
  }

  // Partial match for related affiliations
  // Example: Veteran scholarship may partially accept Active Duty
  const affiliationRelations: Record<string, string[]> = {
    Veteran: ['Active Duty'], // Active duty may transition to veteran
    Dependent: ['Veteran', 'Active Duty'], // Dependent related to veteran/active
  }

  const relatedAffiliations = affiliationRelations[requiredAffiliation] || []
  if (relatedAffiliations.includes(studentAffiliation)) {
    return 75 // Related affiliation = 75% score
  }

  return 0 // No match
}

/**
 * Calculate disability score
 */
function calculateDisabilityScore(
  studentDisabilities: string | null,
  required: boolean
): number {
  const hasDisability = !!studentDisabilities && studentDisabilities.trim() !== ''

  if (required) {
    return hasDisability ? 100 : 0
  }

  // If not required, everyone qualifies
  return 100
}

/**
 * Calculate citizenship score
 */
function calculateCitizenshipScore(
  studentCitizenship: string | null,
  requiredCitizenship: 'US Citizen' | 'Permanent Resident' | 'Any'
): number {
  if (!studentCitizenship) {
    return 0 // No citizenship data = no match
  }

  // Exact match
  if (studentCitizenship === requiredCitizenship) {
    return 100
  }

  // Citizenship hierarchy: US Citizen > Permanent Resident > Other
  // US Citizens also qualify for Permanent Resident scholarships
  if (
    requiredCitizenship === 'Permanent Resident' &&
    studentCitizenship === 'US Citizen'
  ) {
    return 100 // US Citizens are also permanent residents
  }

  // Permanent residents may partially match some US Citizen scholarships
  if (
    requiredCitizenship === 'US Citizen' &&
    studentCitizenship === 'Permanent Resident'
  ) {
    return 50 // Partial match - some scholarships may accept both
  }

  return 0 // No match
}
