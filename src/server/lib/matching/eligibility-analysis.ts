/**
 * Eligibility Analysis Module (Story 2.12 - Alex Agent)
 *
 * Provides detailed 6-dimension eligibility analysis showing:
 * - Individual dimension scores with explanations
 * - Gap identification (which criteria met vs. missing)
 * - Improvement recommendations (actionable steps)
 * - Competitive positioning (percentile ranking)
 *
 * This extends the match scoring algorithm with narrative explanations
 * for the Alex agent persona to communicate results to students.
 *
 * @module server/lib/matching/eligibility-analysis
 */

import type { Student, Profile, Scholarship } from '@prisma/client'
import type { EligibilityCriteria } from '@/types/scholarship'

// Import dimensional scorers for numerical scores
import { calculateAcademicMatch } from './scorers/academic-scorer'
import { calculateDemographicMatch } from './scorers/demographic-scorer'
import { calculateMajorMatch } from './scorers/major-scorer'
import { calculateExperienceMatch } from './scorers/experience-scorer'
import { calculateFinancialMatch } from './scorers/financial-scorer'
import { calculateSpecialCriteriaMatch } from './scorers/special-criteria-scorer'

/**
 * Analysis for a single dimension with detailed explanation
 */
export interface DimensionAnalysis {
  /** Numerical score (0-100) for this dimension */
  score: number

  /** Human-readable explanation of the score */
  explanation: string

  /** List of criteria that the student meets */
  metCriteria: string[]

  /** List of criteria that the student is missing */
  missingCriteria: string[]

  /** Detailed comparison data for each sub-criterion */
  details: Record<string, any>
}

/**
 * Gap analysis showing met vs. missing criteria
 */
export interface GapAnalysis {
  /** Total number of criteria evaluated across all dimensions */
  totalCriteria: number

  /** Number of criteria met by the student */
  metCriteria: number

  /** Specific criteria that are missing (with dimension context) */
  missingCriteria: string[]
}

/**
 * Competitive positioning analysis
 */
export interface CompetitivePositioning {
  /** Percentile rank (0-100) where 100 = top 1% */
  percentile: number

  /** Human-readable positioning message */
  message: string

  /** Additional context about what this positioning means */
  context: string
}

/**
 * Complete eligibility analysis report (Alex Agent)
 *
 * This is the main data structure returned by the analysis engine
 * and consumed by the Alex UI components.
 */
export interface EligibilityAnalysis {
  /** Overall match score (0-100) combining all dimensions */
  overallScore: number

  /** Overall eligibility assessment category */
  overallAssessment: 'Highly Eligible' | 'Competitive' | 'Needs Improvement' | 'Not Eligible'

  /** Detailed analysis for each of the 6 dimensions */
  dimensions: {
    academic: DimensionAnalysis
    demographic: DimensionAnalysis
    majorField: DimensionAnalysis
    experience: DimensionAnalysis
    financial: DimensionAnalysis
    specialCriteria: DimensionAnalysis
  }

  /** Gap analysis showing met vs. missing criteria */
  gapAnalysis: GapAnalysis

  /** Actionable recommendations for improvement */
  recommendations: string[]

  /** Competitive positioning analysis */
  competitivePositioning: CompetitivePositioning
}

/**
 * Calculate comprehensive eligibility analysis for a student-scholarship pair
 *
 * This is the main entry point for the Alex agent eligibility analysis.
 * It generates detailed dimensional analysis, gap identification, and recommendations.
 *
 * @param student - Student record with profile relation
 * @param scholarship - Scholarship record with eligibility criteria
 * @returns Complete eligibility analysis with 6-dimension breakdown
 *
 * @example
 * ```typescript
 * const analysis = await calculateEligibilityAnalysis(student, scholarship)
 * console.log(analysis.overallAssessment) // "Competitive"
 * console.log(analysis.gapAnalysis.missingCriteria) // ["50+ volunteer hours", "Leadership position"]
 * ```
 */
export async function calculateEligibilityAnalysis(
  student: Student & { profile: Profile | null },
  scholarship: Scholarship
): Promise<EligibilityAnalysis> {
  // Validate inputs
  if (!student.profile) {
    throw new Error(`Student ${student.id} has no profile - cannot calculate eligibility analysis`)
  }

  // Parse eligibility criteria from JSON
  const criteria = parseEligibilityCriteria(scholarship.eligibilityCriteria)

  // Calculate all 6 dimensional analyses
  const academicAnalysis = await analyzeAcademicDimension(student.profile, criteria.academic)
  const demographicAnalysis = await analyzeDemographicDimension(student.profile, criteria.demographic)
  const majorFieldAnalysis = await analyzeMajorFieldDimension(student.profile, criteria.majorField)
  const experienceAnalysis = await analyzeExperienceDimension(student.profile, criteria.experience)
  const financialAnalysis = await analyzeFinancialDimension(student.profile, criteria.financial)
  const specialCriteriaAnalysis = await analyzeSpecialCriteriaDimension(
    student.profile,
    criteria.special
  )

  // Calculate overall score (weighted average matching match-score algorithm)
  const overallScore = calculateWeightedOverallScore({
    academic: academicAnalysis.score,
    demographic: demographicAnalysis.score,
    majorField: majorFieldAnalysis.score,
    experience: experienceAnalysis.score,
    financial: financialAnalysis.score,
    specialCriteria: specialCriteriaAnalysis.score,
  })

  // Generate gap analysis
  const gapAnalysis = generateGapAnalysis({
    academic: academicAnalysis,
    demographic: demographicAnalysis,
    majorField: majorFieldAnalysis,
    experience: experienceAnalysis,
    financial: financialAnalysis,
    specialCriteria: specialCriteriaAnalysis,
  })

  // Generate improvement recommendations
  const recommendations = generateRecommendations(
    gapAnalysis,
    {
      academic: academicAnalysis,
      demographic: demographicAnalysis,
      majorField: majorFieldAnalysis,
      experience: experienceAnalysis,
      financial: financialAnalysis,
      specialCriteria: specialCriteriaAnalysis,
    },
    student.profile,
    criteria
  )

  // Calculate competitive positioning
  const competitivePositioning = calculateCompetitivePositioning(
    overallScore,
    student.profile,
    scholarship
  )

  // Determine overall assessment category
  const overallAssessment = determineOverallAssessment(overallScore, gapAnalysis)

  return {
    overallScore,
    overallAssessment,
    dimensions: {
      academic: academicAnalysis,
      demographic: demographicAnalysis,
      majorField: majorFieldAnalysis,
      experience: experienceAnalysis,
      financial: financialAnalysis,
      specialCriteria: specialCriteriaAnalysis,
    },
    gapAnalysis,
    recommendations,
    competitivePositioning,
  }
}

/**
 * Analyze academic dimension with detailed explanations
 */
async function analyzeAcademicDimension(
  profile: Profile,
  criteria: EligibilityCriteria['academic']
): Promise<DimensionAnalysis> {
  // Calculate numerical score
  const score = calculateAcademicMatch(profile, criteria)

  const metCriteria: string[] = []
  const missingCriteria: string[] = []
  const details: Record<string, any> = {}

  // If no criteria specified, student automatically qualifies
  if (!criteria) {
    return {
      score: 100,
      explanation: 'No specific academic requirements for this scholarship.',
      metCriteria: ['No minimum academic requirements'],
      missingCriteria: [],
      details: {},
    }
  }

  // GPA Analysis
  if (criteria.minGPA !== undefined) {
    details.gpa = {
      student: profile.gpa,
      required: criteria.minGPA,
      met: profile.gpa ? profile.gpa >= criteria.minGPA : false,
    }

    if (profile.gpa && profile.gpa >= criteria.minGPA) {
      metCriteria.push(`GPA ${profile.gpa.toFixed(2)} meets minimum ${criteria.minGPA.toFixed(2)}`)
    } else if (profile.gpa) {
      missingCriteria.push(
        `GPA ${profile.gpa.toFixed(2)} below minimum ${criteria.minGPA.toFixed(2)} (need ${(criteria.minGPA - profile.gpa).toFixed(2)} more)`
      )
    } else {
      missingCriteria.push(`GPA not provided (minimum ${criteria.minGPA.toFixed(2)} required)`)
    }
  }

  // SAT Analysis
  if (criteria.minSAT !== undefined) {
    details.sat = {
      student: profile.satScore,
      required: criteria.minSAT,
      met: profile.satScore ? profile.satScore >= criteria.minSAT : false,
    }

    if (profile.satScore && profile.satScore >= criteria.minSAT) {
      metCriteria.push(`SAT ${profile.satScore} meets minimum ${criteria.minSAT}`)
    } else if (profile.satScore) {
      missingCriteria.push(
        `SAT ${profile.satScore} below minimum ${criteria.minSAT} (need ${criteria.minSAT - profile.satScore} more points)`
      )
    } else {
      missingCriteria.push(`SAT score not provided (minimum ${criteria.minSAT} required)`)
    }
  }

  // ACT Analysis
  if (criteria.minACT !== undefined) {
    details.act = {
      student: profile.actScore,
      required: criteria.minACT,
      met: profile.actScore ? profile.actScore >= criteria.minACT : false,
    }

    if (profile.actScore && profile.actScore >= criteria.minACT) {
      metCriteria.push(`ACT ${profile.actScore} meets minimum ${criteria.minACT}`)
    } else if (profile.actScore) {
      missingCriteria.push(
        `ACT ${profile.actScore} below minimum ${criteria.minACT} (need ${criteria.minACT - profile.actScore} more points)`
      )
    } else {
      missingCriteria.push(`ACT score not provided (minimum ${criteria.minACT} required)`)
    }
  }

  // Class Rank Analysis
  if (criteria.classRankPercentile !== undefined) {
    const studentPercentile =
      profile.classRank && profile.classSize
        ? (profile.classRank / profile.classSize) * 100
        : null

    details.classRank = {
      student: studentPercentile,
      required: criteria.classRankPercentile,
      met: studentPercentile ? studentPercentile <= criteria.classRankPercentile : false,
    }

    if (studentPercentile && studentPercentile <= criteria.classRankPercentile) {
      metCriteria.push(
        `Class rank top ${studentPercentile.toFixed(1)}% meets requirement (top ${criteria.classRankPercentile}%)`
      )
    } else if (studentPercentile) {
      missingCriteria.push(
        `Class rank top ${studentPercentile.toFixed(1)}% does not meet requirement (need top ${criteria.classRankPercentile}%)`
      )
    } else {
      missingCriteria.push(
        `Class rank not provided (top ${criteria.classRankPercentile}% required)`
      )
    }
  }

  // Generate explanation
  const explanation = generateAcademicExplanation(score, metCriteria, missingCriteria)

  return {
    score,
    explanation,
    metCriteria,
    missingCriteria,
    details,
  }
}

/**
 * Analyze demographic dimension with detailed explanations
 */
async function analyzeDemographicDimension(
  profile: Profile,
  criteria: EligibilityCriteria['demographic']
): Promise<DimensionAnalysis> {
  const score = calculateDemographicMatch(profile, criteria)

  const metCriteria: string[] = []
  const missingCriteria: string[] = []
  const details: Record<string, any> = {}

  if (!criteria) {
    return {
      score: 100,
      explanation: 'No specific demographic requirements for this scholarship.',
      metCriteria: ['Open to all demographics'],
      missingCriteria: [],
      details: {},
    }
  }

  // Gender Analysis
  if (criteria.requiredGender && criteria.requiredGender !== 'Any') {
    details.gender = {
      student: profile.gender,
      required: criteria.requiredGender,
      met: profile.gender === criteria.requiredGender,
    }

    if (profile.gender === criteria.requiredGender) {
      metCriteria.push(`Gender matches requirement (${criteria.requiredGender})`)
    } else {
      missingCriteria.push(`Gender requirement: ${criteria.requiredGender}`)
    }
  }

  // Ethnicity Analysis
  if (criteria.requiredEthnicity && criteria.requiredEthnicity.length > 0) {
    const hasMatchingEthnicity = profile.ethnicity.some((e) =>
      criteria.requiredEthnicity!.includes(e)
    )

    details.ethnicity = {
      student: profile.ethnicity,
      required: criteria.requiredEthnicity,
      met: hasMatchingEthnicity,
    }

    if (hasMatchingEthnicity) {
      metCriteria.push(`Ethnicity matches requirements`)
    } else {
      missingCriteria.push(`Required ethnicity: ${criteria.requiredEthnicity.join(' or ')}`)
    }
  }

  // State Analysis
  if (criteria.requiredState && criteria.requiredState.length > 0) {
    const stateMatches = profile.state && criteria.requiredState.includes(profile.state)

    details.state = {
      student: profile.state,
      required: criteria.requiredState,
      met: stateMatches,
    }

    if (stateMatches) {
      metCriteria.push(`State residency matches (${profile.state})`)
    } else {
      missingCriteria.push(`Required state: ${criteria.requiredState.join(', ')}`)
    }
  }

  // Age Analysis
  if (criteria.ageMin !== undefined || criteria.ageMax !== undefined) {
    // Calculate age from graduation year (approximate)
    const currentYear = new Date().getFullYear()
    const estimatedAge = profile.graduationYear
      ? currentYear - profile.graduationYear + 18
      : null

    const ageInRange =
      estimatedAge !== null &&
      (criteria.ageMin === undefined || estimatedAge >= criteria.ageMin) &&
      (criteria.ageMax === undefined || estimatedAge <= criteria.ageMax)

    details.age = {
      student: estimatedAge,
      minRequired: criteria.ageMin,
      maxRequired: criteria.ageMax,
      met: ageInRange,
    }

    if (ageInRange) {
      metCriteria.push(`Age meets requirements`)
    } else {
      const ageReq =
        criteria.ageMin && criteria.ageMax
          ? `${criteria.ageMin}-${criteria.ageMax} years old`
          : criteria.ageMin
            ? `${criteria.ageMin}+ years old`
            : `under ${criteria.ageMax} years old`
      missingCriteria.push(`Age requirement: ${ageReq}`)
    }
  }

  const explanation = generateDemographicExplanation(score, metCriteria, missingCriteria)

  return {
    score,
    explanation,
    metCriteria,
    missingCriteria,
    details,
  }
}

/**
 * Analyze major/field dimension with detailed explanations
 */
async function analyzeMajorFieldDimension(
  profile: Profile,
  criteria: EligibilityCriteria['majorField']
): Promise<DimensionAnalysis> {
  const score = calculateMajorMatch(profile, criteria)

  const metCriteria: string[] = []
  const missingCriteria: string[] = []
  const details: Record<string, any> = {}

  if (!criteria) {
    return {
      score: 100,
      explanation: 'No specific major or field of study requirements.',
      metCriteria: ['Open to all majors'],
      missingCriteria: [],
      details: {},
    }
  }

  // Eligible Majors Analysis
  if (criteria.eligibleMajors && criteria.eligibleMajors.length > 0) {
    const majorMatches =
      profile.intendedMajor && criteria.eligibleMajors.includes(profile.intendedMajor)

    details.major = {
      student: profile.intendedMajor,
      eligible: criteria.eligibleMajors,
      met: majorMatches,
    }

    if (majorMatches) {
      metCriteria.push(`Major ${profile.intendedMajor} is eligible`)
    } else {
      missingCriteria.push(`Required major: ${criteria.eligibleMajors.join(', ')}`)
    }
  }

  // Field of Study Analysis
  if (criteria.requiredFieldOfStudy && criteria.requiredFieldOfStudy.length > 0) {
    const fieldMatches =
      profile.fieldOfStudy &&
      criteria.requiredFieldOfStudy.some((f) =>
        profile.fieldOfStudy!.toLowerCase().includes(f.toLowerCase())
      )

    details.fieldOfStudy = {
      student: profile.fieldOfStudy,
      required: criteria.requiredFieldOfStudy,
      met: fieldMatches,
    }

    if (fieldMatches) {
      metCriteria.push(`Field of study matches requirements`)
    } else {
      missingCriteria.push(`Required field: ${criteria.requiredFieldOfStudy.join(' or ')}`)
    }
  }

  const explanation = generateMajorFieldExplanation(score, metCriteria, missingCriteria)

  return {
    score,
    explanation,
    metCriteria,
    missingCriteria,
    details,
  }
}

/**
 * Analyze experience dimension with detailed explanations
 */
async function analyzeExperienceDimension(
  profile: Profile,
  criteria: EligibilityCriteria['experience']
): Promise<DimensionAnalysis> {
  const score = calculateExperienceMatch(profile, criteria)

  const metCriteria: string[] = []
  const missingCriteria: string[] = []
  const details: Record<string, any> = {}

  if (!criteria) {
    return {
      score: 100,
      explanation: 'No specific experience or extracurricular requirements.',
      metCriteria: ['No experience requirements'],
      missingCriteria: [],
      details: {},
    }
  }

  // Volunteer Hours Analysis
  if (criteria.minVolunteerHours !== undefined) {
    const meetsVolunteerHours = profile.volunteerHours >= criteria.minVolunteerHours

    details.volunteerHours = {
      student: profile.volunteerHours,
      required: criteria.minVolunteerHours,
      met: meetsVolunteerHours,
    }

    if (meetsVolunteerHours) {
      metCriteria.push(
        `${profile.volunteerHours} volunteer hours meets minimum ${criteria.minVolunteerHours}`
      )
    } else {
      const hoursNeeded = criteria.minVolunteerHours - profile.volunteerHours
      missingCriteria.push(
        `Need ${hoursNeeded} more volunteer hours (have ${profile.volunteerHours}, need ${criteria.minVolunteerHours})`
      )
    }
  }

  // Leadership Analysis
  if (criteria.leadershipRequired) {
    const hasLeadership =
      profile.leadershipRoles &&
      typeof profile.leadershipRoles === 'object' &&
      Array.isArray(profile.leadershipRoles) &&
      profile.leadershipRoles.length > 0

    details.leadership = {
      student: profile.leadershipRoles,
      required: true,
      met: hasLeadership,
    }

    if (hasLeadership) {
      metCriteria.push('Has leadership experience')
    } else {
      missingCriteria.push('Leadership position required')
    }
  }

  // Extracurriculars Analysis
  if (criteria.requiredExtracurriculars && criteria.requiredExtracurriculars.length > 0) {
    // Check if student has any matching extracurriculars
    const hasMatchingActivity = false // TODO: Implement extracurricular matching logic

    details.extracurriculars = {
      student: profile.extracurriculars,
      required: criteria.requiredExtracurriculars,
      met: hasMatchingActivity,
    }

    if (hasMatchingActivity) {
      metCriteria.push('Has required extracurricular activities')
    } else {
      missingCriteria.push(
        `Required activities: ${criteria.requiredExtracurriculars.join(', ')}`
      )
    }
  }

  const explanation = generateExperienceExplanation(score, metCriteria, missingCriteria)

  return {
    score,
    explanation,
    metCriteria,
    missingCriteria,
    details,
  }
}

/**
 * Analyze financial dimension with detailed explanations
 */
async function analyzeFinancialDimension(
  profile: Profile,
  criteria: EligibilityCriteria['financial']
): Promise<DimensionAnalysis> {
  const score = calculateFinancialMatch(profile, criteria)

  const metCriteria: string[] = []
  const missingCriteria: string[] = []
  const details: Record<string, any> = {}

  if (!criteria) {
    return {
      score: 100,
      explanation: 'No specific financial need requirements.',
      metCriteria: ['No financial need requirements'],
      missingCriteria: [],
      details: {},
    }
  }

  // Financial Need Analysis
  if (criteria.requiresFinancialNeed) {
    const hasFinancialNeed = profile.financialNeed !== null

    details.financialNeed = {
      student: profile.financialNeed,
      required: true,
      met: hasFinancialNeed,
    }

    if (hasFinancialNeed) {
      metCriteria.push('Demonstrates financial need')
    } else {
      missingCriteria.push('Financial need required')
    }
  }

  // Pell Grant Analysis
  if (criteria.pellGrantRequired) {
    details.pellGrant = {
      student: profile.pellGrantEligible,
      required: true,
      met: profile.pellGrantEligible,
    }

    if (profile.pellGrantEligible) {
      metCriteria.push('Pell Grant eligible')
    } else {
      missingCriteria.push('Pell Grant eligibility required')
    }
  }

  const explanation = generateFinancialExplanation(score, metCriteria, missingCriteria)

  return {
    score,
    explanation,
    metCriteria,
    missingCriteria,
    details,
  }
}

/**
 * Analyze special criteria dimension with detailed explanations
 */
async function analyzeSpecialCriteriaDimension(
  profile: Profile,
  criteria: EligibilityCriteria['special']
): Promise<DimensionAnalysis> {
  const score = calculateSpecialCriteriaMatch(profile, criteria)

  const metCriteria: string[] = []
  const missingCriteria: string[] = []
  const details: Record<string, any> = {}

  if (!criteria) {
    return {
      score: 100,
      explanation: 'No special criteria requirements.',
      metCriteria: ['No special requirements'],
      missingCriteria: [],
      details: {},
    }
  }

  // First Generation Analysis
  if (criteria.firstGenerationRequired) {
    details.firstGeneration = {
      student: profile.firstGeneration,
      required: true,
      met: profile.firstGeneration,
    }

    if (profile.firstGeneration) {
      metCriteria.push('First-generation college student')
    } else {
      missingCriteria.push('Must be first-generation college student')
    }
  }

  // Military Affiliation Analysis
  if (criteria.militaryAffiliation && criteria.militaryAffiliation !== 'None') {
    const hasMilitary = profile.militaryAffiliation !== null

    details.military = {
      student: profile.militaryAffiliation,
      required: criteria.militaryAffiliation,
      met: hasMilitary,
    }

    if (hasMilitary) {
      metCriteria.push(`Military affiliation: ${profile.militaryAffiliation}`)
    } else {
      missingCriteria.push(`Military affiliation required: ${criteria.militaryAffiliation}`)
    }
  }

  // Disability Analysis
  if (criteria.disabilityRequired) {
    const hasDisability = profile.disabilities !== null

    details.disability = {
      student: profile.disabilities,
      required: true,
      met: hasDisability,
    }

    if (hasDisability) {
      metCriteria.push('Has documented disability')
    } else {
      missingCriteria.push('Disability status required')
    }
  }

  // Citizenship Analysis
  if (criteria.citizenshipRequired && criteria.citizenshipRequired !== 'Any') {
    const meetsCitizenship = profile.citizenship === criteria.citizenshipRequired

    details.citizenship = {
      student: profile.citizenship,
      required: criteria.citizenshipRequired,
      met: meetsCitizenship,
    }

    if (meetsCitizenship) {
      metCriteria.push(`Citizenship: ${profile.citizenship}`)
    } else {
      missingCriteria.push(`Citizenship required: ${criteria.citizenshipRequired}`)
    }
  }

  const explanation = generateSpecialCriteriaExplanation(score, metCriteria, missingCriteria)

  return {
    score,
    explanation,
    metCriteria,
    missingCriteria,
    details,
  }
}

/**
 * Calculate weighted overall score (same formula as match scoring)
 */
function calculateWeightedOverallScore(scores: {
  academic: number
  demographic: number
  majorField: number
  experience: number
  financial: number
  specialCriteria: number
}): number {
  // Use same weights as match scoring algorithm
  const weights = {
    academic: 0.30,
    demographic: 0.15,
    majorField: 0.20,
    experience: 0.15,
    financial: 0.10,
    specialCriteria: 0.10,
  }

  const weightedScore =
    scores.academic * weights.academic +
    scores.demographic * weights.demographic +
    scores.majorField * weights.majorField +
    scores.experience * weights.experience +
    scores.financial * weights.financial +
    scores.specialCriteria * weights.specialCriteria

  return Math.round(weightedScore)
}

/**
 * Generate gap analysis from dimensional analyses
 */
function generateGapAnalysis(dimensions: {
  academic: DimensionAnalysis
  demographic: DimensionAnalysis
  majorField: DimensionAnalysis
  experience: DimensionAnalysis
  financial: DimensionAnalysis
  specialCriteria: DimensionAnalysis
}): GapAnalysis {
  let totalCriteria = 0
  let metCriteriaCount = 0
  const allMissingCriteria: string[] = []

  // Count criteria across all dimensions
  for (const [dimensionName, analysis] of Object.entries(dimensions)) {
    const dimensionTotal = analysis.metCriteria.length + analysis.missingCriteria.length
    totalCriteria += dimensionTotal
    metCriteriaCount += analysis.metCriteria.length

    // Add dimension prefix to missing criteria for context
    const prefixedMissing = analysis.missingCriteria.map(
      (criterion) => `${formatDimensionName(dimensionName)}: ${criterion}`
    )
    allMissingCriteria.push(...prefixedMissing)
  }

  return {
    totalCriteria,
    metCriteria: metCriteriaCount,
    missingCriteria: allMissingCriteria,
  }
}

/**
 * Generate improvement recommendations based on gap analysis
 */
function generateRecommendations(
  gapAnalysis: GapAnalysis,
  dimensions: {
    academic: DimensionAnalysis
    demographic: DimensionAnalysis
    majorField: DimensionAnalysis
    experience: DimensionAnalysis
    financial: DimensionAnalysis
    specialCriteria: DimensionAnalysis
  },
  profile: Profile,
  criteria: EligibilityCriteria
): string[] {
  const recommendations: string[] = []

  // Academic recommendations
  if (criteria.academic?.minGPA && profile.gpa && profile.gpa < criteria.academic.minGPA) {
    const gapAmount = criteria.academic.minGPA - profile.gpa
    recommendations.push(
      `Raise your GPA by ${gapAmount.toFixed(2)} points to ${criteria.academic.minGPA.toFixed(2)} to meet the academic requirement.`
    )
  }

  if (criteria.academic?.minSAT && profile.satScore && profile.satScore < criteria.academic.minSAT) {
    const gapAmount = criteria.academic.minSAT - profile.satScore
    recommendations.push(
      `Improve your SAT score by ${gapAmount} points to ${criteria.academic.minSAT} through test prep and retaking the exam.`
    )
  }

  // Experience recommendations
  if (
    criteria.experience?.minVolunteerHours &&
    profile.volunteerHours < criteria.experience.minVolunteerHours
  ) {
    const hoursNeeded = criteria.experience.minVolunteerHours - profile.volunteerHours
    recommendations.push(
      `Gain ${hoursNeeded} more volunteer hours to reach the ${criteria.experience.minVolunteerHours}-hour requirement.`
    )
  }

  if (criteria.experience?.leadershipRequired) {
    const hasLeadership =
      profile.leadershipRoles &&
      typeof profile.leadershipRoles === 'object' &&
      Array.isArray(profile.leadershipRoles) &&
      profile.leadershipRoles.length > 0

    if (!hasLeadership) {
      recommendations.push(
        'Consider joining a student organization and taking on a leadership position, such as club president or team captain.'
      )
    }
  }

  // Demographic recommendations (non-addressable)
  if (dimensions.demographic.missingCriteria.length > 0) {
    recommendations.push(
      'Note: Some demographic criteria (gender, ethnicity, location) are fixed factors and cannot be changed.'
    )
  }

  // If no specific recommendations, provide general encouragement
  if (recommendations.length === 0 && gapAnalysis.missingCriteria.length > 0) {
    recommendations.push(
      'Focus on strengthening your overall profile by maintaining high grades and staying active in extracurriculars.'
    )
  }

  // If student exceeds all requirements
  if (gapAnalysis.missingCriteria.length === 0) {
    recommendations.push(
      'Excellent! You meet all requirements. Focus on crafting a compelling application essay.'
    )
  }

  return recommendations
}

/**
 * Calculate competitive positioning
 */
function calculateCompetitivePositioning(
  overallScore: number,
  _profile: Profile,
  _scholarship: Scholarship
): CompetitivePositioning {
  // Simplified percentile calculation based on overall score
  // In production, this would compare against historical applicant data
  const percentile = Math.round(overallScore * 0.9) // Approximation: 90% of score

  let message: string
  let context: string

  if (percentile >= 90) {
    message = 'Your profile ranks in the top 10% of typical applicants for this scholarship.'
    context =
      'Excellent competitive advantage - your strong credentials exceed typical requirements significantly.'
  } else if (percentile >= 75) {
    message = 'Your profile ranks in the top 25% of typical applicants for this scholarship.'
    context =
      'Strong competitive position - you have a good chance of success with this scholarship.'
  } else if (percentile >= 50) {
    message = 'Your profile ranks in the top 50% of typical applicants for this scholarship.'
    context =
      'Competitive position - you meet most requirements and have a reasonable chance of success.'
  } else if (percentile >= 25) {
    message = 'Your profile ranks in the bottom 50% of typical applicants for this scholarship.'
    context =
      'This scholarship is a reach - consider strengthening your profile or focusing on better-matched opportunities.'
  } else {
    message = 'Your profile ranks below typical applicants for this scholarship.'
    context =
      'Significant reach - focus on improving gaps before applying or consider better-matched scholarships.'
  }

  return {
    percentile,
    message,
    context,
  }
}

/**
 * Determine overall assessment category
 */
function determineOverallAssessment(
  overallScore: number,
  gapAnalysis: GapAnalysis
): 'Highly Eligible' | 'Competitive' | 'Needs Improvement' | 'Not Eligible' {
  if (overallScore >= 90 && gapAnalysis.missingCriteria.length === 0) {
    return 'Highly Eligible'
  } else if (overallScore >= 70) {
    return 'Competitive'
  } else if (overallScore >= 50) {
    return 'Needs Improvement'
  } else {
    return 'Not Eligible'
  }
}

/**
 * Parse eligibility criteria from JSON (same as match scoring)
 */
function parseEligibilityCriteria(criteriaJson: unknown): EligibilityCriteria {
  if (typeof criteriaJson === 'object' && criteriaJson !== null) {
    return criteriaJson as EligibilityCriteria
  }

  if (typeof criteriaJson === 'string') {
    try {
      return JSON.parse(criteriaJson) as EligibilityCriteria
    } catch (error) {
      throw new Error(`Failed to parse eligibility criteria: ${error}`)
    }
  }

  return {}
}

/**
 * Helper functions for generating dimension explanations
 */

function generateAcademicExplanation(
  score: number,
  metCriteria: string[],
  missingCriteria: string[]
): string {
  if (score === 100 && metCriteria.length === 0) {
    return 'No specific academic requirements for this scholarship.'
  }

  if (score >= 90) {
    return `Excellent academic match! ${metCriteria.length > 0 ? metCriteria[0] : 'You exceed requirements.'}`
  } else if (score >= 70) {
    return `Good academic match. ${metCriteria.length > 0 ? `You meet ${metCriteria.length} of ${metCriteria.length + missingCriteria.length} academic criteria.` : ''}`
  } else if (score >= 50) {
    return `Partial academic match. ${missingCriteria.length > 0 ? `You're missing ${missingCriteria.length} academic criteria.` : ''}`
  } else {
    return `Academic requirements need improvement. ${missingCriteria.length > 0 ? `Focus on: ${missingCriteria[0]}` : ''}`
  }
}

function generateDemographicExplanation(
  score: number,
  metCriteria: string[],
  missingCriteria: string[]
): string {
  if (score === 100 && metCriteria.length === 0) {
    return 'No specific demographic requirements for this scholarship.'
  }

  if (score >= 90) {
    return `Strong demographic match. ${metCriteria.join(', ')}`
  } else if (score >= 50) {
    return `Partial demographic match. ${metCriteria.length > 0 ? `You meet ${metCriteria.length} criteria.` : ''}`
  } else {
    return `Demographic requirements not fully met. ${missingCriteria.length > 0 ? missingCriteria[0] : ''}`
  }
}

function generateMajorFieldExplanation(
  score: number,
  metCriteria: string[],
  missingCriteria: string[]
): string {
  if (score === 100 && metCriteria.length === 0) {
    return 'No specific major or field requirements for this scholarship.'
  }

  if (score >= 90) {
    return `Perfect major match! ${metCriteria[0] || 'Your intended field aligns with scholarship goals.'}`
  } else if (score >= 50) {
    return `Partial major alignment. ${metCriteria.length > 0 ? metCriteria[0] : ''}`
  } else {
    return `Major/field requirements not met. ${missingCriteria[0] || ''}`
  }
}

function generateExperienceExplanation(
  score: number,
  metCriteria: string[],
  missingCriteria: string[]
): string {
  if (score === 100 && metCriteria.length === 0) {
    return 'No specific experience requirements for this scholarship.'
  }

  if (score >= 90) {
    return `Excellent experience profile! ${metCriteria.join('. ')}`
  } else if (score >= 70) {
    return `Good experience match. ${metCriteria.length > 0 ? `You meet ${metCriteria.length} experience criteria.` : ''}`
  } else {
    return `Experience requirements need attention. ${missingCriteria.length > 0 ? missingCriteria[0] : ''}`
  }
}

function generateFinancialExplanation(
  score: number,
  metCriteria: string[],
  missingCriteria: string[]
): string {
  if (score === 100 && metCriteria.length === 0) {
    return 'No specific financial need requirements for this scholarship.'
  }

  if (score >= 90) {
    return `Financial profile matches requirements. ${metCriteria[0] || ''}`
  } else {
    return `Financial requirements not met. ${missingCriteria[0] || ''}`
  }
}

function generateSpecialCriteriaExplanation(
  score: number,
  metCriteria: string[],
  missingCriteria: string[]
): string {
  if (score === 100 && metCriteria.length === 0) {
    return 'No special criteria requirements for this scholarship.'
  }

  if (score >= 90) {
    return `Special criteria met. ${metCriteria.join(', ')}`
  } else {
    return `Special criteria not fully met. ${missingCriteria[0] || ''}`
  }
}

function formatDimensionName(dimensionKey: string): string {
  const names: Record<string, string> = {
    academic: 'Academic',
    demographic: 'Demographic',
    majorField: 'Major/Field',
    experience: 'Experience',
    financial: 'Financial',
    specialCriteria: 'Special Criteria',
  }
  return names[dimensionKey] || dimensionKey
}
