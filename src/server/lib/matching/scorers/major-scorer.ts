/**
 * Major/Field Match Scorer
 *
 * Calculates major/field dimension score (0-100) based on:
 * - Intended major alignment with eligible majors
 * - Field of study alignment
 * - Career goals alignment
 * - Excluded majors check
 *
 * Supports partial matching for related fields
 *
 * @module server/lib/matching/scorers/major-scorer
 */

import type { Profile } from '@prisma/client'
import type { MajorFieldCriteria } from '@/types/scholarship'

/**
 * Calculate major/field match score between student profile and scholarship criteria
 *
 * @param profile - Student's academic profile with major/field data
 * @param criteria - Scholarship's major/field eligibility criteria (optional)
 * @returns Score from 0-100
 *
 * @example
 * ```typescript
 * const profile = { intendedMajor: 'Biology', fieldOfStudy: 'STEM', careerGoals: 'Medical research' }
 * const criteria = { eligibleMajors: ['Biology', 'Chemistry'], requiredFieldOfStudy: ['STEM'] }
 * const score = calculateMajorMatch(profile, criteria)
 * // Returns: 100 (exact major match and field match)
 * ```
 */
export function calculateMajorMatch(
  profile: Profile,
  criteria: MajorFieldCriteria | undefined
): number {
  // If no major/field criteria specified, student automatically qualifies
  if (!criteria) {
    return 100
  }

  // Check excluded majors first (hard filter within soft scoring)
  if (
    criteria.excludedMajors &&
    criteria.excludedMajors.length > 0 &&
    profile.intendedMajor
  ) {
    const isExcluded = criteria.excludedMajors.some(
      (excluded) =>
        excluded.toLowerCase() === profile.intendedMajor?.toLowerCase()
    )
    if (isExcluded) {
      return 0 // Explicitly excluded major = no match
    }
  }

  const scores: number[] = []
  let criteriaCount = 0

  // Eligible Majors Scoring (weight: 50% of dimension)
  if (criteria.eligibleMajors && criteria.eligibleMajors.length > 0) {
    criteriaCount++
    const majorScore = calculateEligibleMajorScore(
      profile.intendedMajor,
      criteria.eligibleMajors
    )
    scores.push(majorScore * 0.5)
  }

  // Field of Study Scoring (weight: 30% of dimension)
  if (
    criteria.requiredFieldOfStudy &&
    criteria.requiredFieldOfStudy.length > 0
  ) {
    criteriaCount++
    const fieldScore = calculateFieldOfStudyScore(
      profile.fieldOfStudy,
      criteria.requiredFieldOfStudy
    )
    scores.push(fieldScore * 0.3)
  }

  // Career Goals Scoring (weight: 20% of dimension)
  if (
    criteria.careerGoalsKeywords &&
    criteria.careerGoalsKeywords.length > 0
  ) {
    criteriaCount++
    const careerScore = calculateCareerGoalsScore(
      profile.careerGoals,
      criteria.careerGoalsKeywords
    )
    scores.push(careerScore * 0.2)
  }

  // If no criteria specified (and not excluded), return 100
  if (criteriaCount === 0) {
    return 100
  }

  // Calculate weighted average (already weighted above)
  const totalScore = scores.reduce((sum, score) => sum + score, 0)
  const normalizedWeight = criteriaCount === 3 ? 1.0 : criteriaCount === 2 ? 0.8 : 0.5

  return Math.round((totalScore / normalizedWeight))
}

/**
 * Calculate eligible major score with exact and partial matching
 */
function calculateEligibleMajorScore(
  studentMajor: string | null,
  eligibleMajors: string[]
): number {
  if (!studentMajor) {
    return 0 // No major specified = no match
  }

  const studentMajorLower = studentMajor.toLowerCase()

  // Check for exact match
  const exactMatch = eligibleMajors.some(
    (major) => major.toLowerCase() === studentMajorLower
  )
  if (exactMatch) {
    return 100
  }

  // Check for partial match (e.g., "Computer Engineering" contains "Engineering")
  const partialMatch = eligibleMajors.some(
    (major) =>
      studentMajorLower.includes(major.toLowerCase()) ||
      major.toLowerCase().includes(studentMajorLower)
  )
  if (partialMatch) {
    return 75 // Partial match = 75% score
  }

  // Check for related major keywords
  const relatedMatch = checkRelatedMajors(studentMajorLower, eligibleMajors)
  if (relatedMatch) {
    return 50 // Related field = 50% score
  }

  return 0 // No match
}

/**
 * Calculate field of study score
 */
function calculateFieldOfStudyScore(
  studentField: string | null,
  requiredFields: string[]
): number {
  if (!studentField) {
    return 0 // No field specified = no match
  }

  const studentFieldLower = studentField.toLowerCase()

  // Check for exact match
  const exactMatch = requiredFields.some(
    (field) => field.toLowerCase() === studentFieldLower
  )
  if (exactMatch) {
    return 100
  }

  // Check for partial match
  const partialMatch = requiredFields.some(
    (field) =>
      studentFieldLower.includes(field.toLowerCase()) ||
      field.toLowerCase().includes(studentFieldLower)
  )
  if (partialMatch) {
    return 80 // Partial match = 80% score
  }

  return 0 // No match
}

/**
 * Calculate career goals score based on keyword matching
 */
function calculateCareerGoalsScore(
  careerGoals: string | null,
  keywords: string[]
): number {
  if (!careerGoals) {
    return 0 // No career goals specified = no match
  }

  const careerGoalsLower = careerGoals.toLowerCase()

  // Count how many keywords match
  const matchCount = keywords.filter((keyword) =>
    careerGoalsLower.includes(keyword.toLowerCase())
  ).length

  if (matchCount === 0) {
    return 0
  }

  // Proportional score based on keyword matches
  // 1+ keywords = some match, all keywords = perfect match
  const matchPercentage = (matchCount / keywords.length) * 100
  return Math.round(Math.min(100, matchPercentage * 1.2)) // Slight boost, max 100
}

/**
 * Check for related majors using common field groupings
 *
 * This is a simplified version - in production, would use a proper taxonomy
 */
function checkRelatedMajors(
  studentMajor: string,
  eligibleMajors: string[]
): boolean {
  // Define major families
  const majorFamilies: Record<string, string[]> = {
    stem: [
      'biology',
      'chemistry',
      'physics',
      'mathematics',
      'engineering',
      'computer science',
      'science',
    ],
    engineering: [
      'mechanical',
      'electrical',
      'civil',
      'chemical',
      'computer',
      'aerospace',
      'biomedical',
    ],
    business: [
      'business',
      'finance',
      'accounting',
      'economics',
      'marketing',
      'management',
    ],
    health: [
      'nursing',
      'medicine',
      'pharmacy',
      'public health',
      'healthcare',
      'medical',
    ],
    arts: [
      'art',
      'music',
      'theater',
      'dance',
      'design',
      'fine arts',
      'performing arts',
    ],
    humanities: [
      'english',
      'history',
      'philosophy',
      'literature',
      'languages',
      'liberal arts',
    ],
  }

  // Find which family the student's major belongs to
  const studentFamily = Object.entries(majorFamilies).find(([_, majors]) =>
    majors.some((major) => studentMajor.includes(major))
  )

  if (!studentFamily) {
    return false
  }

  // Check if any eligible major is in the same family
  const [_, familyMajors] = studentFamily
  return eligibleMajors.some((eligibleMajor) =>
    familyMajors.some((familyMajor) =>
      eligibleMajor.toLowerCase().includes(familyMajor)
    )
  )
}
