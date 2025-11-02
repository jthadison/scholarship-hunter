// ============================================================================
// Story 1.7: Profile Strength Scoring Algorithm
// ============================================================================

import type { Profile } from '@prisma/client'
import type {
  StrengthBreakdown,
  Recommendation,
  ExtracurricularActivity,
  WorkExperience,
  LeadershipRole,
  AwardHonor,
} from '../types'

// ============================================================================
// Constants
// ============================================================================

// Dimension weights for overall score calculation
const WEIGHTS = {
  academic: 0.35,
  experience: 0.25,
  leadership: 0.25,
  demographics: 0.15,
} as const

// Volunteer hours tiers
const VOLUNTEER_TIERS = {
  EXCELLENT: 200,
  GOOD: 100,
  FAIR: 50,
} as const

// ============================================================================
// Academic Scoring (0-100)
// ============================================================================

/**
 * Calculate Academic dimension score
 * Formula: GPA (40pts) + Test Scores (30pts) + Class Rank (20pts) + Awards (10pts)
 */
function calculateAcademicScore(profile: Profile): number {
  let score = 0

  // GPA component (0-40 points): Normalize GPA to 4.0 scale
  if (profile.gpa !== null && profile.gpaScale !== null && profile.gpaScale > 0) {
    const normalizedGPA = (profile.gpa / profile.gpaScale) * 4.0
    const gpaPoints = (normalizedGPA / 4.0) * 40
    if (Number.isFinite(gpaPoints)) {
      score += gpaPoints
    }
  }

  // Test scores component (0-30 points): SAT or ACT (whichever is higher when normalized)
  let testScore = 0
  if (profile.satScore !== null && profile.satScore >= 400 && profile.satScore <= 1600) {
    // SAT: 400-1600 range
    const satPoints = ((profile.satScore - 400) / (1600 - 400)) * 30
    if (Number.isFinite(satPoints)) {
      testScore = Math.max(testScore, satPoints)
    }
  }
  if (profile.actScore !== null && profile.actScore >= 1 && profile.actScore <= 36) {
    // ACT: 1-36 range
    const actPoints = ((profile.actScore - 1) / (36 - 1)) * 30
    if (Number.isFinite(actPoints)) {
      testScore = Math.max(testScore, actPoints)
    }
  }
  score += testScore

  // Class rank component (0-20 points): Percentile formula
  if (profile.classRank !== null && profile.classSize !== null && profile.classSize > 0) {
    const percentile = 1 - profile.classRank / profile.classSize
    const rankPoints = percentile * 20
    if (Number.isFinite(rankPoints)) {
      score += rankPoints
    }
  }

  // Awards/honors component (0-10 points): 2 points per award, max 10
  const awards = Array.isArray(profile.awardsHonors) ? (profile.awardsHonors as unknown as AwardHonor[]) : []
  const awardPoints = Math.min(awards.length * 2, 10)
  score += awardPoints

  // Cap at 100 and ensure finite result
  const finalScore = Math.min(Math.round(score), 100)
  return Number.isFinite(finalScore) ? finalScore : 0
}

// ============================================================================
// Experience Scoring (0-100)
// ============================================================================

/**
 * Calculate Experience dimension score
 * Formula: Extracurriculars (40pts) + Volunteer Hours (30pts) + Work Experience (30pts)
 */
function calculateExperienceScore(profile: Profile): number {
  let score = 0

  // Extracurriculars component (0-40 points): 8 points per activity, max 40
  const extracurriculars = Array.isArray(profile.extracurriculars)
    ? (profile.extracurriculars as unknown as ExtracurricularActivity[])
    : []
  const extracurricularPoints = Math.min(extracurriculars.length * 8, 40)
  score += extracurricularPoints

  // Volunteer hours component (0-30 points): Tiered scoring
  const volunteerHours = typeof profile.volunteerHours === 'number' ? profile.volunteerHours : 0
  let volunteerPoints = 0
  if (volunteerHours >= VOLUNTEER_TIERS.EXCELLENT) {
    volunteerPoints = 30
  } else if (volunteerHours >= VOLUNTEER_TIERS.GOOD) {
    volunteerPoints = 20
  } else if (volunteerHours >= VOLUNTEER_TIERS.FAIR) {
    volunteerPoints = 10
  } else if (volunteerHours > 0) {
    // Proportional for <50 hours
    volunteerPoints = (volunteerHours / VOLUNTEER_TIERS.FAIR) * 10
  }
  if (Number.isFinite(volunteerPoints)) {
    score += volunteerPoints
  }

  // Work experience component (0-30 points): 15 points per job, max 30
  const workExperience = Array.isArray(profile.workExperience)
    ? (profile.workExperience as unknown as WorkExperience[])
    : []
  const workPoints = Math.min(workExperience.length * 15, 30)
  score += workPoints

  // Cap at 100 and ensure finite result
  const finalScore = Math.min(Math.round(score), 100)
  return Number.isFinite(finalScore) ? finalScore : 0
}

// ============================================================================
// Leadership Scoring (0-100)
// ============================================================================

/**
 * Calculate Leadership dimension score
 * Formula: 0 roles=0pts, 1 role=50pts, 2 roles=75pts, 3+ roles=100pts
 */
function calculateLeadershipScore(profile: Profile): number {
  const leadershipRoles = Array.isArray(profile.leadershipRoles)
    ? (profile.leadershipRoles as unknown as LeadershipRole[])
    : []
  const roleCount = leadershipRoles.length

  if (roleCount === 0) return 0
  if (roleCount === 1) return 50
  if (roleCount === 2) return 75
  return 100 // 3+ roles
}

// ============================================================================
// Demographics Scoring (0-100)
// ============================================================================

/**
 * Calculate Demographics dimension score
 * Formula: First-gen (+40pts) + Financial Need (0-30pts) + Military (+15pts) + Disabilities (+15pts)
 */
function calculateDemographicsScore(profile: Profile): number {
  let score = 0

  // First generation college student (+40 points)
  if (profile.firstGeneration) {
    score += 40
  }

  // Financial need (0-30 points based on level)
  if (profile.financialNeed) {
    const needPoints: Record<string, number> = {
      VERY_HIGH: 30,
      HIGH: 20,
      MODERATE: 10,
      LOW: 0,
    }
    score += needPoints[profile.financialNeed] || 0
  }

  // Military affiliation (+15 points for active/veteran/dependent)
  const militaryAffiliation = profile.militaryAffiliation
  if (
    militaryAffiliation &&
    militaryAffiliation !== 'None' &&
    ['Active Duty', 'Veteran', 'Reserves/National Guard', 'Military Dependent', 'Gold Star Family'].includes(
      militaryAffiliation
    )
  ) {
    score += 15
  }

  // Disabilities (+15 points)
  if (profile.disabilities) {
    score += 15
  }

  // Cap at 100
  return Math.min(score, 100)
}

// ============================================================================
// Recommendation Generation
// ============================================================================

/**
 * Generate improvement recommendations based on profile and score breakdown
 * Returns prioritized array of recommendations with impact estimates
 */
export function generateRecommendations(profile: Profile, breakdown: StrengthBreakdown): Recommendation[] {
  const recommendations: Recommendation[] = []

  // ============================================================================
  // Academic Recommendations
  // ============================================================================

  if (breakdown.academic < 60) {
    recommendations.push({
      category: 'Academic',
      message: 'Focus on improving GPA and test scores to increase academic competitiveness',
      impact: Math.round((100 - breakdown.academic) * WEIGHTS.academic),
      priority: 1,
    })
  }

  // No test scores recommendation
  if (profile.satScore === null && profile.actScore === null) {
    recommendations.push({
      category: 'Academic',
      message: 'Add SAT or ACT score to boost Academic score by up to 30 points',
      impact: Math.round(30 * WEIGHTS.academic),
      priority: 1,
      actionLink: '/profile/academic',
    })
  }

  // No class rank recommendation
  if (profile.classRank === null || profile.classSize === null) {
    recommendations.push({
      category: 'Academic',
      message: 'Add class rank to gain up to 20 additional points',
      impact: Math.round(20 * WEIGHTS.academic),
      priority: 2,
      actionLink: '/profile/academic',
    })
  }

  // ============================================================================
  // Experience Recommendations
  // ============================================================================

  if (breakdown.experience < 60) {
    recommendations.push({
      category: 'Experience',
      message: 'Add more extracurricular activities and increase volunteer hours to 100+',
      impact: Math.round((100 - breakdown.experience) * WEIGHTS.experience),
      priority: 1,
      actionLink: '/profile/experience',
    })
  }

  // Volunteer hours recommendations
  const volunteerHours = profile.volunteerHours || 0
  if (volunteerHours < VOLUNTEER_TIERS.FAIR) {
    const potentialGain = ((VOLUNTEER_TIERS.GOOD - volunteerHours) / VOLUNTEER_TIERS.GOOD) * 20
    recommendations.push({
      category: 'Experience',
      message: `Reach 100 volunteer hours to gain ${Math.round(potentialGain * WEIGHTS.experience)} additional points`,
      impact: Math.round(potentialGain * WEIGHTS.experience),
      priority: 2,
      actionLink: '/profile/experience',
    })
  } else if (volunteerHours < VOLUNTEER_TIERS.GOOD) {
    const potentialGain = 10 // From 20 to 30 points
    recommendations.push({
      category: 'Experience',
      message: `Reach 100 volunteer hours to gain ${Math.round(potentialGain * WEIGHTS.experience)} additional points`,
      impact: Math.round(potentialGain * WEIGHTS.experience),
      priority: 2,
      actionLink: '/profile/experience',
    })
  }

  // No work experience recommendation
  const workExperience = (profile.workExperience as unknown as WorkExperience[]) || []
  if (workExperience.length === 0) {
    recommendations.push({
      category: 'Experience',
      message: 'Adding work experience can boost score by up to 30 points',
      impact: Math.round(30 * WEIGHTS.experience),
      priority: 2,
      actionLink: '/profile/experience',
    })
  }

  // ============================================================================
  // Leadership Recommendations
  // ============================================================================

  const leadershipRoles = (profile.leadershipRoles as unknown as LeadershipRole[]) || []
  const roleCount = leadershipRoles.length

  if (breakdown.leadership < 50) {
    recommendations.push({
      category: 'Leadership',
      message: 'Seek leadership positions in clubs, sports, or community organizations',
      impact: Math.round((100 - breakdown.leadership) * WEIGHTS.leadership),
      priority: 1,
      actionLink: '/profile/experience',
    })
  }

  if (roleCount === 0) {
    recommendations.push({
      category: 'Leadership',
      message: 'Leadership roles can add up to 100 points to your strength score',
      impact: Math.round(100 * WEIGHTS.leadership),
      priority: 1,
      actionLink: '/profile/experience',
    })
  } else if (roleCount === 1) {
    recommendations.push({
      category: 'Leadership',
      message: 'Adding 1 more leadership role increases score by 25 points',
      impact: Math.round(25 * WEIGHTS.leadership),
      priority: 2,
      actionLink: '/profile/experience',
    })
  } else if (roleCount === 2) {
    recommendations.push({
      category: 'Leadership',
      message: 'Adding 1 more leadership role increases score to maximum (25 additional points)',
      impact: Math.round(25 * WEIGHTS.leadership),
      priority: 3,
      actionLink: '/profile/experience',
    })
  }

  // ============================================================================
  // Demographics Recommendations (informational only, not actionable)
  // ============================================================================

  // Demographics are inherent characteristics, so we only provide informational recommendations
  if (!profile.firstGeneration && !profile.militaryAffiliation && !profile.disabilities) {
    recommendations.push({
      category: 'Demographics',
      message:
        'Many scholarships target first-generation students, military families, and students with disabilities. Make sure your profile accurately reflects your background.',
      impact: 0,
      priority: 3,
    })
  }

  // ============================================================================
  // Prioritization and Sorting
  // ============================================================================

  // Sort by priority (1 = highest) then by impact (descending)
  recommendations.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return b.impact - a.impact
  })

  // Return top 5 recommendations to avoid overwhelming the user
  return recommendations.slice(0, 5)
}

// ============================================================================
// Main Strength Calculation
// ============================================================================

/**
 * Calculate overall profile strength breakdown across all dimensions
 * Returns scores for each dimension, weighted overall score, and recommendations
 */
export function calculateStrengthBreakdown(profile: Profile): StrengthBreakdown {
  // Calculate dimensional scores with NaN guards
  const academic = calculateAcademicScore(profile)
  const experience = calculateExperienceScore(profile)
  const leadership = calculateLeadershipScore(profile)
  const demographics = calculateDemographicsScore(profile)

  console.log('[calculateStrengthBreakdown] Raw scores:', {
    academic,
    experience,
    leadership,
    demographics,
    completionPercentage: profile.completionPercentage
  })

  // Guard against NaN in dimensional scores
  const safeAcademic = Number.isFinite(academic) ? academic : 0
  const safeExperience = Number.isFinite(experience) ? experience : 0
  const safeLeadership = Number.isFinite(leadership) ? leadership : 0
  const safeDemographics = Number.isFinite(demographics) ? demographics : 0

  // Calculate weighted average (before completeness multiplier)
  const weightedScore =
    safeAcademic * WEIGHTS.academic +
    safeExperience * WEIGHTS.experience +
    safeLeadership * WEIGHTS.leadership +
    safeDemographics * WEIGHTS.demographics

  // Apply completeness multiplier with NaN guard
  const completeness = profile.completionPercentage || 0
  const rawOverallScore = (weightedScore * completeness) / 100
  const overallScore = Number.isFinite(rawOverallScore) ? Math.round(rawOverallScore) : 0

  console.log('[calculateStrengthBreakdown] Final scores:', {
    safeAcademic,
    safeExperience,
    safeLeadership,
    safeDemographics,
    weightedScore,
    completeness,
    rawOverallScore,
    overallScore
  })

  // Generate recommendations based on current scores
  const recommendations = generateRecommendations(profile, {
    overallScore,
    academic: safeAcademic,
    experience: safeExperience,
    leadership: safeLeadership,
    demographics: safeDemographics,
    recommendations: [], // Will be populated
  })

  return {
    overallScore,
    academic: safeAcademic,
    experience: safeExperience,
    leadership: safeLeadership,
    demographics: safeDemographics,
    recommendations,
  }
}

/**
 * Helper: Get score color code based on value
 * 0-50: red, 51-75: yellow, 76-100: green
 */
export function getScoreColorCode(score: number): 'red' | 'yellow' | 'green' {
  if (score <= 50) return 'red'
  if (score <= 75) return 'yellow'
  return 'green'
}

/**
 * Helper: Get score label based on value
 * For accessibility: color + text
 */
export function getScoreLabel(score: number): string {
  if (score <= 50) return 'Needs Improvement'
  if (score <= 75) return 'Good'
  return 'Excellent'
}

/**
 * Helper: Calculate potential score if profile were 100% complete
 * Used to show "Your score could be X at 100% completion"
 */
export function calculatePotentialScore(profile: Profile): number {
  const breakdown = calculateStrengthBreakdown(profile)

  // Calculate weighted score without completeness multiplier
  const weightedScore =
    breakdown.academic * WEIGHTS.academic +
    breakdown.experience * WEIGHTS.experience +
    breakdown.leadership * WEIGHTS.leadership +
    breakdown.demographics * WEIGHTS.demographics

  return Math.round(weightedScore)
}
