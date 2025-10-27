/**
 * Composite Match Score Calculator
 *
 * Orchestrates all 6 dimensional scorers and combines them using weighted scoring
 * to produce an overall match score (0-100) for a student-scholarship pair.
 *
 * Weighted Formula (from tech-spec-epic-2.md):
 * overallMatchScore =
 *   (academicScore × 0.30) +
 *   (demographicScore × 0.15) +
 *   (majorFieldScore × 0.20) +
 *   (experienceScore × 0.15) +
 *   (financialScore × 0.10) +
 *   (specialCriteriaScore × 0.10)
 *
 * @module server/lib/matching/calculate-match-score
 */

import type { Student, Profile, Scholarship } from '@prisma/client'
import type { EligibilityCriteria } from '@/types/scholarship'
import type { MatchScore } from './types'
import { DEFAULT_SCORING_WEIGHTS } from './types'

// Import dimensional scorers
import { calculateAcademicMatch } from './scorers/academic-scorer'
import { calculateDemographicMatch } from './scorers/demographic-scorer'
import { calculateMajorMatch } from './scorers/major-scorer'
import { calculateExperienceMatch } from './scorers/experience-scorer'
import { calculateFinancialMatch } from './scorers/financial-scorer'
import { calculateSpecialCriteriaMatch } from './scorers/special-criteria-scorer'

// Story 2.5: Success probability calculation
import { calculateSuccessProbability } from './calculate-success-probability'
import { calculateCompetitionFactor } from './calculate-competition-factor'
import { classifySuccessTier } from './classify-success-tier'

// Story 2.6: Strategic value calculation
import { estimateEffortLevel } from './estimate-effort-level'
import { calculateStrategicValue } from './calculate-strategic-value'
import { classifyStrategicValue } from './classify-strategic-value'

/**
 * Calculate comprehensive match score for student-scholarship pair
 *
 * This is the main entry point for the match scoring algorithm. It:
 * 1. Extracts eligibility criteria from scholarship JSON
 * 2. Runs all 6 dimensional scorers in parallel
 * 3. Combines scores using weighted formula
 * 4. Returns structured MatchScore object
 *
 * @param student - Student record with profile relation
 * @param scholarship - Scholarship record with eligibility criteria
 * @returns MatchScore object with overall and dimensional scores
 *
 * @example
 * ```typescript
 * const student = await db.student.findUnique({
 *   where: { id: studentId },
 *   include: { profile: true }
 * })
 * const scholarship = await db.scholarship.findUnique({
 *   where: { id: scholarshipId }
 * })
 *
 * const matchScore = await calculateMatchScore(student, scholarship)
 * // Returns: { overallMatchScore: 88, academicScore: 95, ... }
 * ```
 */
export async function calculateMatchScore(
  student: Student & { profile: Profile | null },
  scholarship: Scholarship
): Promise<MatchScore> {
  // Validate inputs
  if (!student.profile) {
    throw new Error(`Student ${student.id} has no profile - cannot calculate match score`)
  }

  // Parse eligibility criteria from JSON
  const criteria = parseEligibilityCriteria(scholarship.eligibilityCriteria)

  // Calculate all dimensional scores
  const academicScore = calculateAcademicMatch(student.profile, criteria.academic)
  const demographicScore = calculateDemographicMatch(student.profile, criteria.demographic)
  const majorFieldScore = calculateMajorMatch(student.profile, criteria.majorField)
  const experienceScore = calculateExperienceMatch(student.profile, criteria.experience)
  const financialScore = calculateFinancialMatch(student.profile, criteria.financial)
  const specialCriteriaScore = calculateSpecialCriteriaMatch(student.profile, criteria.special)

  // Calculate weighted overall score
  const overallMatchScore = calculateWeightedScore({
    academicScore,
    demographicScore,
    majorFieldScore,
    experienceScore,
    financialScore,
    specialCriteriaScore,
  })

  // Story 2.5: Calculate success probability
  const successProbability = calculateSuccessProbability(
    overallMatchScore,
    student.profile,
    scholarship
  )

  // Story 2.5: Classify success tier
  const tierResult = classifySuccessTier(successProbability)

  // Story 2.5: Get competition factor for storage
  const competitionFactor = calculateCompetitionFactor(scholarship)

  // Story 2.6: Calculate application effort
  const effortEstimation = estimateEffortLevel(scholarship)

  // Story 2.6: Calculate strategic value ROI
  const strategicValueResult = calculateStrategicValue({
    matchScore: overallMatchScore,
    successProbability,
    awardAmount: scholarship.awardAmount,
    effortLevel: effortEstimation.level,
  })

  // Story 2.6: Classify strategic value tier
  const strategicValueClassification = classifyStrategicValue(strategicValueResult.strategicValue)

  // Return structured match score
  return {
    overallMatchScore,
    academicScore,
    demographicScore,
    majorFieldScore,
    experienceScore,
    financialScore,
    specialCriteriaScore,
    // Story 2.5: Include success probability fields
    successProbability,
    successTier: tierResult.tier,
    competitionFactor,
    // Story 2.6: Include strategic value fields
    strategicValue: strategicValueResult.strategicValue,
    applicationEffort: effortEstimation.level,
    effortBreakdown: effortEstimation.breakdown,
    strategicValueTier: strategicValueClassification.tier,
    calculatedAt: new Date(),
  }
}

/**
 * Calculate weighted overall score from dimensional scores
 *
 * Uses default weights from tech spec:
 * - Academic: 30%
 * - Major/Field: 20%
 * - Demographic: 15%
 * - Experience: 15%
 * - Financial: 10%
 * - Special: 10%
 */
function calculateWeightedScore(scores: {
  academicScore: number
  demographicScore: number
  majorFieldScore: number
  experienceScore: number
  financialScore: number
  specialCriteriaScore: number
}): number {
  const {
    academicScore,
    demographicScore,
    majorFieldScore,
    experienceScore,
    financialScore,
    specialCriteriaScore,
  } = scores

  const weights = DEFAULT_SCORING_WEIGHTS

  const weightedScore =
    academicScore * weights.academic +
    demographicScore * weights.demographic +
    majorFieldScore * weights.majorField +
    experienceScore * weights.experience +
    financialScore * weights.financial +
    specialCriteriaScore * weights.special

  // Round to nearest integer (0-100)
  return Math.round(weightedScore)
}

/**
 * Parse and validate eligibility criteria from scholarship JSON
 *
 * Handles edge cases:
 * - Empty criteria object → all dimensions undefined
 * - Invalid JSON → throws error
 * - Missing dimensions → set to undefined (no requirement)
 */
function parseEligibilityCriteria(criteriaJson: unknown): EligibilityCriteria {
  // If criteria is already an object, use it
  if (typeof criteriaJson === 'object' && criteriaJson !== null) {
    const criteria = criteriaJson as EligibilityCriteria
    return {
      academic: criteria.academic,
      demographic: criteria.demographic,
      majorField: criteria.majorField,
      experience: criteria.experience,
      financial: criteria.financial,
      special: criteria.special,
    }
  }

  // If criteria is a string, try to parse it
  if (typeof criteriaJson === 'string') {
    try {
      const parsed = JSON.parse(criteriaJson) as EligibilityCriteria
      return {
        academic: parsed.academic,
        demographic: parsed.demographic,
        majorField: parsed.majorField,
        experience: parsed.experience,
        financial: parsed.financial,
        special: parsed.special,
      }
    } catch (error) {
      throw new Error(`Failed to parse eligibility criteria: ${error}`)
    }
  }

  // No criteria or invalid format → empty criteria (all dimensions score 100)
  return {}
}

/**
 * Batch calculate match scores for multiple scholarships
 *
 * Optimized for performance with parallel execution
 *
 * @param student - Student with profile
 * @param scholarships - Array of scholarships to score
 * @returns Array of match scores in same order as input scholarships
 */
export async function calculateMatchScoresBatch(
  student: Student & { profile: Profile | null },
  scholarships: Scholarship[]
): Promise<MatchScore[]> {
  // Use Promise.all for parallel execution (AC#6 performance requirement)
  return Promise.all(
    scholarships.map((scholarship) => calculateMatchScore(student, scholarship))
  )
}
