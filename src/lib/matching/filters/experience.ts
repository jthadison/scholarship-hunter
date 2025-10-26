/**
 * Experience Dimension Filter
 *
 * Filters scholarships based on experience criteria: volunteer hours, leadership,
 * extracurriculars, work experience, awards/honors.
 *
 * @module lib/matching/filters/experience
 */

import type { Profile } from '@prisma/client'
import type { ExperienceCriteria } from '@/types/scholarship'
import type { HardFilterResult, FailedCriterion } from '../hard-filter'
import { FilterDimension } from '../hard-filter'

/**
 * Calculate total work experience in months from work experience JSON array
 *
 * @param workExperience - JSON array of work experience objects
 * @returns Total months of work experience
 */
function calculateWorkExperienceMonths(workExperience: unknown): number {
  if (!workExperience || !Array.isArray(workExperience)) {
    return 0
  }

  return workExperience.reduce((total, exp) => {
    // Expect each experience to have startDate and endDate (or current)
    if (typeof exp === 'object' && exp !== null) {
      const experience = exp as { startDate?: string; endDate?: string; current?: boolean }

      if (experience.startDate) {
        const start = new Date(experience.startDate)
        const end = experience.endDate ? new Date(experience.endDate) : new Date()

        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
        return total + Math.max(0, months)
      }
    }
    return total
  }, 0)
}

/**
 * Count number of items in a JSON array
 *
 * @param jsonArray - JSON array
 * @returns Count of items
 */
function getArrayLength(jsonArray: unknown): number {
  if (!jsonArray || !Array.isArray(jsonArray)) {
    return 0
  }
  return jsonArray.length
}

/**
 * Apply experience dimension filter
 *
 * Checks student's experience profile against scholarship requirements:
 * - Minimum volunteer hours
 * - Required extracurriculars (must have at least one matching)
 * - Leadership requirement (must have at least one leadership role)
 * - Minimum work experience (in months)
 * - Awards/honors requirement (must have at least one)
 *
 * @param profile - Student profile with experience data
 * @param criteria - Experience eligibility criteria from scholarship
 * @returns HardFilterResult with pass/fail and failure details
 */
export function filterExperience(
  profile: Profile,
  criteria: ExperienceCriteria | undefined
): HardFilterResult {
  // If no criteria specified, pass by default
  if (!criteria) {
    return { eligible: true, failedCriteria: [] }
  }

  const failedCriteria: FailedCriterion[] = []

  // Check minimum volunteer hours
  if (criteria.minVolunteerHours !== undefined) {
    if (profile.volunteerHours < criteria.minVolunteerHours) {
      failedCriteria.push({
        dimension: FilterDimension.EXPERIENCE,
        criterion: 'minVolunteerHours',
        required: criteria.minVolunteerHours,
        actual: profile.volunteerHours,
      })
    }
  }

  // Check leadership requirement
  if (criteria.leadershipRequired === true) {
    const leadershipCount = getArrayLength(profile.leadershipRoles)

    if (leadershipCount === 0) {
      failedCriteria.push({
        dimension: FilterDimension.EXPERIENCE,
        criterion: 'leadershipRequired',
        required: true,
        actual: false,
      })
    }
  }

  // Check required extracurriculars (student must have at least one matching)
  if (criteria.requiredExtracurriculars && criteria.requiredExtracurriculars.length > 0) {
    const studentExtracurriculars = profile.extracurriculars as unknown

    if (!studentExtracurriculars || !Array.isArray(studentExtracurriculars)) {
      failedCriteria.push({
        dimension: FilterDimension.EXPERIENCE,
        criterion: 'requiredExtracurriculars',
        required: criteria.requiredExtracurriculars,
        actual: [],
      })
    } else {
      // Extract activity names from student extracurriculars
      const activityNames = studentExtracurriculars
        .map((activity) => {
          if (typeof activity === 'object' && activity !== null) {
            const act = activity as { name?: string; activity?: string }
            return act.name || act.activity || ''
          }
          return ''
        })
        .filter(Boolean)

      // Check if any required activity matches (case-insensitive)
      const hasMatch = criteria.requiredExtracurriculars.some((required) =>
        activityNames.some((studentActivity) => studentActivity.toLowerCase().includes(required.toLowerCase()))
      )

      if (!hasMatch) {
        failedCriteria.push({
          dimension: FilterDimension.EXPERIENCE,
          criterion: 'requiredExtracurriculars',
          required: criteria.requiredExtracurriculars,
          actual: activityNames,
        })
      }
    }
  }

  // Check minimum work experience
  if (criteria.minWorkExperience !== undefined) {
    const workExperienceMonths = calculateWorkExperienceMonths(profile.workExperience)

    if (workExperienceMonths < criteria.minWorkExperience) {
      failedCriteria.push({
        dimension: FilterDimension.EXPERIENCE,
        criterion: 'minWorkExperience',
        required: criteria.minWorkExperience,
        actual: workExperienceMonths,
      })
    }
  }

  // Check awards/honors requirement
  if (criteria.awardsHonorsRequired === true) {
    const awardsCount = getArrayLength(profile.awardsHonors)

    if (awardsCount === 0) {
      failedCriteria.push({
        dimension: FilterDimension.EXPERIENCE,
        criterion: 'awardsHonorsRequired',
        required: true,
        actual: false,
      })
    }
  }

  return {
    eligible: failedCriteria.length === 0,
    failedCriteria,
  }
}
