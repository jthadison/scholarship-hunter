// ============================================================================
// Story 5.3: Profile Strength Projection
// ============================================================================

import type { Profile, Scholarship } from '@prisma/client'
import type { Gap, ProfileProjection, HypotheticalChanges } from './types'
import { calculateStrengthBreakdown } from '@/modules/profile/lib/strength-scoring'
import type { StudentWithProfile } from '@/lib/matching/hard-filter'

/**
 * Project profile strength with hypothetical improvements
 *
 * Applies gap improvements to profile data and recalculates strength score
 * using the same algorithm from Story 1.7. Shows before/after comparison
 * with dimensional breakdowns.
 *
 * @param currentProfile - Student's current profile
 * @param gaps - Gaps that would be closed
 * @param student - Full student record with profile
 * @param allScholarships - All scholarships for match count calculation
 * @returns Profile projection with current vs projected metrics
 */
export function projectProfileStrength(
  currentProfile: Profile,
  gaps: Gap[],
  student: StudentWithProfile,
  allScholarships: Scholarship[]
): ProfileProjection {
  // Calculate current profile strength
  const currentBreakdown = calculateStrengthBreakdown(currentProfile)

  // Create hypothetical profile with improvements applied
  const improvedProfile = applyGapImprovements(currentProfile, gaps)

  // Calculate projected profile strength
  const projectedBreakdown = calculateStrengthBreakdown(improvedProfile)

  // Calculate scholarship access change
  const { currentMatches, projectedMatches } = calculateScholarshipAccessChange(
    student,
    improvedProfile,
    allScholarships
  )

  // Calculate funding potential change
  const { currentFundingPotential, projectedFundingPotential } =
    calculateFundingPotentialChange(currentMatches, projectedMatches, allScholarships)

  return {
    current: currentBreakdown.overallScore,
    projected: projectedBreakdown.overallScore,
    increase: projectedBreakdown.overallScore - currentBreakdown.overallScore,

    currentBreakdown: {
      academic: currentBreakdown.academic,
      experience: currentBreakdown.experience,
      leadership: currentBreakdown.leadership,
      demographics: currentBreakdown.demographics,
    },

    projectedBreakdown: {
      academic: projectedBreakdown.academic,
      experience: projectedBreakdown.experience,
      leadership: projectedBreakdown.leadership,
      demographics: projectedBreakdown.demographics,
    },

    currentMatches: currentMatches.length,
    projectedMatches: projectedMatches.length,
    additionalMatches: projectedMatches.length - currentMatches.length,

    currentFundingPotential,
    projectedFundingPotential,
    additionalFunding: projectedFundingPotential - currentFundingPotential,
  }
}

/**
 * Apply gap improvements to profile data
 * Creates a new profile object with gap closures simulated
 */
function applyGapImprovements(profile: Profile, gaps: Gap[]): Profile {
  // Clone profile to avoid mutations
  const improved = { ...profile }

  gaps.forEach((gap) => {
    const { category, targetValue } = gap

    if (category === 'academic') {
      if (gap.requirement.includes('GPA')) {
        improved.gpa = targetValue as number
      } else if (gap.requirement.includes('SAT')) {
        improved.satScore = targetValue as number
      } else if (gap.requirement.includes('ACT')) {
        improved.actScore = targetValue as number
      }
    }

    if (category === 'experience') {
      if (gap.requirement.includes('volunteer hours')) {
        improved.volunteerHours = targetValue as number
      } else if (gap.requirement.includes('Leadership')) {
        // Add a mock leadership role
        const current = (improved.leadershipRoles as unknown as unknown[]) || []
        improved.leadershipRoles = [
          ...current,
          {
            title: 'Club Officer',
            organization: 'School Club',
            startDate: new Date().toISOString(),
            description: 'Leadership position (projected)',
          },
        ] as unknown as typeof profile.leadershipRoles
      }
    }
  })

  return improved
}

/**
 * Calculate scholarship access change
 * Compares number of accessible scholarships before and after improvements
 */
function calculateScholarshipAccessChange(
  student: StudentWithProfile,
  improvedProfile: Profile,
  allScholarships: Scholarship[]
): { currentMatches: Scholarship[]; projectedMatches: Scholarship[] } {
  // Import hard filter function
  const { filterScholarships } = require('@/lib/matching/hard-filter')

  // Filter with current profile
  const currentMatches = filterScholarships(student, allScholarships)

  // Create improved student object
  const improvedStudent: StudentWithProfile = {
    ...student,
    profile: improvedProfile,
  }

  // Filter with improved profile
  const projectedMatches = filterScholarships(improvedStudent, allScholarships)

  return { currentMatches, projectedMatches }
}

/**
 * Calculate funding potential change
 * Estimates total funding from accessible scholarships before and after
 */
function calculateFundingPotentialChange(
  currentMatches: Scholarship[],
  projectedMatches: Scholarship[],
  _allScholarships: Scholarship[]
): { currentFundingPotential: number; projectedFundingPotential: number } {
  // Sum award amounts (conservative estimate: use minimum award)
  const currentFundingPotential = currentMatches.reduce(
    (sum: number, s: Scholarship) => sum + s.awardAmount,
    0
  )

  const projectedFundingPotential = projectedMatches.reduce(
    (sum: number, s: Scholarship) => sum + s.awardAmount,
    0
  )

  return { currentFundingPotential, projectedFundingPotential }
}

/**
 * Project strength for simulator with custom hypothetical changes
 *
 * Allows interactive exploration of "what-if" scenarios with specific
 * profile value changes (e.g., "What if I raise my GPA to 3.6?")
 *
 * @param profile - Current profile
 * @param changes - Hypothetical changes to apply
 * @param student - Full student record
 * @param allScholarships - All scholarships for impact calculation
 * @returns Projection result with impact metrics
 */
export function projectWithHypotheticalChanges(
  profile: Profile,
  changes: HypotheticalChanges,
  student: StudentWithProfile,
  allScholarships: Scholarship[]
): {
  projectedStrength: number
  scholarshipsUnlocked: number
  fundingIncrease: number
  dimensionalChanges: {
    academic: number
    experience: number
    leadership: number
    demographics: number
  }
} {
  // Calculate current strength
  const currentBreakdown = calculateStrengthBreakdown(profile)

  // Apply hypothetical changes
  const hypotheticalProfile = applyHypotheticalChanges(profile, changes)

  // Calculate projected strength
  const projectedBreakdown = calculateStrengthBreakdown(hypotheticalProfile)

  // Calculate scholarship access change
  const { filterScholarships } = require('@/lib/matching/hard-filter')
  const currentMatches = filterScholarships(student, allScholarships)

  const hypotheticalStudent: StudentWithProfile = {
    ...student,
    profile: hypotheticalProfile,
  }
  const projectedMatches = filterScholarships(hypotheticalStudent, allScholarships)

  // Calculate funding change
  const currentFunding = currentMatches.reduce((sum: number, s: Scholarship) => sum + s.awardAmount, 0)
  const projectedFunding = projectedMatches.reduce((sum: number, s: Scholarship) => sum + s.awardAmount, 0)

  return {
    projectedStrength: projectedBreakdown.overallScore,
    scholarshipsUnlocked: projectedMatches.length - currentMatches.length,
    fundingIncrease: projectedFunding - currentFunding,
    dimensionalChanges: {
      academic: projectedBreakdown.academic - currentBreakdown.academic,
      experience: projectedBreakdown.experience - currentBreakdown.experience,
      leadership: projectedBreakdown.leadership - currentBreakdown.leadership,
      demographics: projectedBreakdown.demographics - currentBreakdown.demographics,
    },
  }
}

/**
 * Apply hypothetical changes to profile
 */
function applyHypotheticalChanges(
  profile: Profile,
  changes: HypotheticalChanges
): Profile {
  const hypothetical = { ...profile }

  // Apply each specified change
  if (changes.gpa !== undefined) {
    hypothetical.gpa = changes.gpa
  }

  if (changes.satScore !== undefined) {
    hypothetical.satScore = changes.satScore
  }

  if (changes.actScore !== undefined) {
    hypothetical.actScore = changes.actScore
  }

  if (changes.volunteerHours !== undefined) {
    hypothetical.volunteerHours = changes.volunteerHours
  }

  if (changes.hasLeadership !== undefined || changes.leadershipCount !== undefined) {
    const targetCount = changes.leadershipCount ?? (changes.hasLeadership ? 1 : 0)
    const current = (hypothetical.leadershipRoles as unknown as unknown[]) || []

    if (targetCount > current.length) {
      // Add mock leadership roles
      const toAdd = targetCount - current.length
      const mockRoles = Array.from({ length: toAdd }, (_, i) => ({
        title: `Leadership Role ${i + 1}`,
        organization: 'Organization',
        startDate: new Date().toISOString(),
        description: 'Hypothetical leadership position',
      }))

      hypothetical.leadershipRoles = [
        ...current,
        ...mockRoles,
      ] as unknown as typeof profile.leadershipRoles
    } else if (targetCount < current.length) {
      // Remove leadership roles
      hypothetical.leadershipRoles = current.slice(
        0,
        targetCount
      ) as unknown as typeof profile.leadershipRoles
    }
  }

  if (changes.extracurricularCount !== undefined) {
    const current = (hypothetical.extracurriculars as unknown as unknown[]) || []
    const targetCount = changes.extracurricularCount

    if (targetCount > current.length) {
      // Add mock extracurriculars
      const toAdd = targetCount - current.length
      const mockActivities = Array.from({ length: toAdd }, (_, i) => ({
        name: `Activity ${i + 1}`,
        role: 'Member',
        description: 'Hypothetical extracurricular',
        startDate: new Date().toISOString(),
      }))

      hypothetical.extracurriculars = [
        ...current,
        ...mockActivities,
      ] as unknown as typeof profile.extracurriculars
    } else if (targetCount < current.length) {
      hypothetical.extracurriculars = current.slice(
        0,
        targetCount
      ) as unknown as typeof profile.extracurriculars
    }
  }

  return hypothetical
}
