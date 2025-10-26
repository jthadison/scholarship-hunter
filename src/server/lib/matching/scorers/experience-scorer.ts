/**
 * Experience Match Scorer
 *
 * Calculates experience dimension score (0-100) based on:
 * - Volunteer hours vs minimum requirements
 * - Extracurricular activities
 * - Leadership experience
 * - Work experience
 * - Awards and honors
 *
 * Supports partial matching with proportional scoring
 *
 * @module server/lib/matching/scorers/experience-scorer
 */

import type { Profile } from '@prisma/client'
import type { ExperienceCriteria } from '@/types/scholarship'

/**
 * Calculate experience match score between student profile and scholarship criteria
 *
 * @param profile - Student's experience profile data
 * @param criteria - Scholarship's experience eligibility criteria (optional)
 * @returns Score from 0-100
 *
 * @example
 * ```typescript
 * const profile = { volunteerHours: 120, leadershipRoles: {...}, extracurriculars: {...} }
 * const criteria = { minVolunteerHours: 100, leadershipRequired: true }
 * const score = calculateExperienceMatch(profile, criteria)
 * // Returns: 100 (exceeds volunteer hours and has leadership)
 * ```
 */
export function calculateExperienceMatch(
  profile: Profile,
  criteria: ExperienceCriteria | undefined
): number {
  // If no experience criteria specified, student automatically qualifies
  if (!criteria) {
    return 100
  }

  const scores: number[] = []
  const weights: number[] = []

  // Volunteer Hours Scoring (weight: 35% of dimension)
  if (criteria.minVolunteerHours !== undefined) {
    const volunteerScore = calculateVolunteerScore(
      profile.volunteerHours,
      criteria.minVolunteerHours
    )
    scores.push(volunteerScore)
    weights.push(0.35)
  }

  // Leadership Scoring (weight: 25% of dimension)
  if (criteria.leadershipRequired !== undefined) {
    const leadershipScore = calculateLeadershipScore(
      profile.leadershipRoles,
      criteria.leadershipRequired
    )
    scores.push(leadershipScore)
    weights.push(0.25)
  }

  // Extracurricular Activities Scoring (weight: 20% of dimension)
  if (
    criteria.requiredExtracurriculars &&
    criteria.requiredExtracurriculars.length > 0
  ) {
    const extracurricularScore = calculateExtracurricularScore(
      profile.extracurriculars,
      criteria.requiredExtracurriculars
    )
    scores.push(extracurricularScore)
    weights.push(0.2)
  }

  // Work Experience Scoring (weight: 15% of dimension)
  if (criteria.minWorkExperience !== undefined) {
    const workScore = calculateWorkExperienceScore(
      profile.workExperience,
      criteria.minWorkExperience
    )
    scores.push(workScore)
    weights.push(0.15)
  }

  // Awards/Honors Scoring (weight: 5% of dimension)
  if (criteria.awardsHonorsRequired !== undefined) {
    const awardsScore = calculateAwardsScore(
      profile.awardsHonors,
      criteria.awardsHonorsRequired
    )
    scores.push(awardsScore)
    weights.push(0.05)
  }

  // If no criteria specified, return 100
  if (scores.length === 0) {
    return 100
  }

  // Calculate weighted average
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  const weightedScore = scores.reduce(
    (sum, score, i) => sum + score * weights[i]!,
    0
  )

  return Math.round((weightedScore / totalWeight))
}

/**
 * Calculate volunteer hours score with partial match support
 */
function calculateVolunteerScore(
  studentHours: number,
  minRequired: number
): number {
  if (studentHours >= minRequired) {
    return 100 // Meets or exceeds requirement
  }

  // Partial match: proportional score
  // Example: 80 hours when 100 required = (80 / 100) * 100 = 80
  const percentOfRequirement = (studentHours / minRequired) * 100
  return Math.round(Math.max(0, percentOfRequirement))
}

/**
 * Calculate leadership score based on leadership roles JSON data
 */
function calculateLeadershipScore(
  leadershipRoles: unknown,
  required: boolean
): number {
  if (!required) {
    return 100 // Not required
  }

  if (!leadershipRoles) {
    return 0 // Required but not present
  }

  // Check if leadershipRoles has any entries
  if (typeof leadershipRoles === 'object' && leadershipRoles !== null) {
    const roles = leadershipRoles as Record<string, unknown>
    const hasRoles = Object.keys(roles).length > 0

    // Could also check for array format
    if (Array.isArray(leadershipRoles)) {
      return leadershipRoles.length > 0 ? 100 : 0
    }

    return hasRoles ? 100 : 0
  }

  return 0
}

/**
 * Calculate extracurricular activities score
 */
function calculateExtracurricularScore(
  studentActivities: unknown,
  requiredActivities: string[]
): number {
  if (!studentActivities) {
    return 0 // No activities = no match
  }

  // Parse student activities from JSON
  let activityNames: string[] = []

  if (Array.isArray(studentActivities)) {
    activityNames = studentActivities.map((activity) => {
      if (typeof activity === 'string') return activity
      if (typeof activity === 'object' && activity !== null) {
        return (activity as { name?: string }).name || ''
      }
      return ''
    })
  } else if (typeof studentActivities === 'object') {
    // Handle object format: { "Debate Team": {...}, "Robotics": {...} }
    activityNames = Object.keys(studentActivities as Record<string, unknown>)
  }

  // Check how many required activities match
  const matchCount = requiredActivities.filter((required) =>
    activityNames.some(
      (activity) =>
        activity.toLowerCase().includes(required.toLowerCase()) ||
        required.toLowerCase().includes(activity.toLowerCase())
    )
  ).length

  if (matchCount === 0) {
    return 0
  }

  // Proportional score: percentage of required activities matched
  const matchPercentage = (matchCount / requiredActivities.length) * 100
  return Math.round(Math.min(100, matchPercentage))
}

/**
 * Calculate work experience score
 *
 * @param workExperience - JSON field containing work history
 * @param minMonthsRequired - Minimum months of work experience required
 */
function calculateWorkExperienceScore(
  workExperience: unknown,
  minMonthsRequired: number
): number {
  if (!workExperience) {
    return 0 // No work experience = no match
  }

  // Calculate total months from work experience JSON
  let totalMonths = 0

  if (Array.isArray(workExperience)) {
    totalMonths = workExperience.reduce((sum, job) => {
      if (typeof job === 'object' && job !== null) {
        const months = (job as { months?: number }).months || 0
        return sum + months
      }
      return sum
    }, 0)
  }

  if (totalMonths >= minMonthsRequired) {
    return 100 // Meets or exceeds requirement
  }

  // Partial match: proportional score
  const percentOfRequirement = (totalMonths / minMonthsRequired) * 100
  return Math.round(Math.max(0, percentOfRequirement))
}

/**
 * Calculate awards/honors score
 */
function calculateAwardsScore(
  awards: unknown,
  required: boolean
): number {
  if (!required) {
    return 100 // Not required
  }

  if (!awards) {
    return 0 // Required but not present
  }

  // Check if awards has any entries
  if (Array.isArray(awards)) {
    return awards.length > 0 ? 100 : 0
  }

  if (typeof awards === 'object' && awards !== null) {
    const awardsList = awards as Record<string, unknown>
    return Object.keys(awardsList).length > 0 ? 100 : 0
  }

  return 0
}
