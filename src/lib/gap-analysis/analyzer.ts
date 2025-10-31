// ============================================================================
// Story 5.3: Gap Analysis Algorithm - Core Analysis Logic
// ============================================================================

import type { Profile, Scholarship } from '@prisma/client'
import type { Gap, GapCategory, ImpactSummary } from './types'
import { applyHardFilters, type StudentWithProfile } from '@/lib/matching/hard-filter'
import { assessAchievability } from './achievability'

/**
 * Minimum award amount to consider a scholarship "reach" (high-value opportunity)
 * Set to $5,000 per Story 5.3 requirements
 */
const MIN_REACH_SCHOLARSHIP_AMOUNT = 5000

/**
 * Maximum number of reach scholarships to analyze for performance
 * Limits analysis to top opportunities to keep response time <2 seconds
 */
const MAX_REACH_SCHOLARSHIPS = 200

/**
 * Find reach scholarships where student is partially qualified
 *
 * Returns scholarships with award ≥$5,000 where student fails some but not all
 * eligibility criteria. These represent opportunities where profile improvements
 * could unlock access.
 *
 * @param student - Student with profile data
 * @param allScholarships - Complete scholarship database
 * @returns High-value scholarships where student has gaps
 */
export function findReachScholarships(
  student: StudentWithProfile,
  allScholarships: Scholarship[]
): Scholarship[] {
  // Filter to high-value scholarships
  const highValueScholarships = allScholarships
    .filter((s) => s.awardAmount >= MIN_REACH_SCHOLARSHIP_AMOUNT)
    .sort((a, b) => b.awardAmount - a.awardAmount) // Sort by award amount descending
    .slice(0, MAX_REACH_SCHOLARSHIPS) // Limit for performance

  // Find scholarships where student has some but not complete eligibility
  const reachOpportunities = highValueScholarships.filter((scholarship) => {
    const filterResult = applyHardFilters(student, scholarship, { earlyExit: false })

    // Reach opportunity: fails some criteria but not all dimensions
    // (has failedCriteria but potentially fixable gaps)
    if (!filterResult.eligible && filterResult.failedCriteria.length > 0) {
      // Filter out scholarships with demographic gaps (usually not actionable)
      const actionableGaps = filterResult.failedCriteria.filter(
        (f) => f.dimension !== 'demographic'
      )
      return actionableGaps.length > 0
    }

    return false
  })

  return reachOpportunities
}

/**
 * Compare profile to scholarship requirements across all dimensions
 *
 * Identifies specific gaps by analyzing each eligibility dimension and
 * determining which requirements the student doesn't meet.
 *
 * @param profile - Student profile data
 * @param scholarship - Target scholarship
 * @param student - Full student record (for hard filter analysis)
 * @returns Array of identified gaps
 */
export function compareProfileToRequirements(
  profile: Profile,
  scholarship: Scholarship,
  student: StudentWithProfile
): Gap[] {
  const gaps: Gap[] = []

  // Run hard filter to get failed criteria
  const filterResult = applyHardFilters(student, scholarship, { earlyExit: false })

  if (filterResult.eligible) {
    return [] // No gaps
  }

  // Convert failed criteria to Gap objects
  filterResult.failedCriteria.forEach((failed) => {
    // Skip demographic gaps (usually not actionable)
    if (failed.dimension === 'demographic') {
      return
    }

    const gap = createGapFromFailedCriterion(failed, profile, scholarship)
    if (gap) {
      gaps.push(gap)
    }
  })

  return gaps
}

/**
 * Create a Gap object from a failed criterion
 * Maps hard filter failures to actionable gap recommendations
 */
function createGapFromFailedCriterion(
  failed: { dimension: string; criterion: string; required: unknown; actual: unknown },
  profile: Profile,
  scholarship: Scholarship
): Gap | null {
  const category = failed.dimension as GapCategory

  // Calculate gap metrics based on dimension
  let gapSize = 0
  let requirement = failed.criterion
  let currentValue: string | number | boolean | null = null
  let targetValue: string | number | boolean = ''

  // Academic gaps
  if (category === 'academic') {
    if (failed.criterion === 'minGpa') {
      const requiredGpa = Number(failed.required) || 0
      const currentGpa = profile.gpa || 0
      gapSize = Math.max(0, requiredGpa - currentGpa)
      currentValue = currentGpa
      targetValue = requiredGpa
      requirement = `GPA ${requiredGpa.toFixed(1)}+`
    } else if (failed.criterion === 'minSat') {
      const requiredSat = Number(failed.required) || 0
      const currentSat = profile.satScore || 0
      gapSize = Math.max(0, requiredSat - currentSat)
      currentValue = currentSat
      targetValue = requiredSat
      requirement = `SAT ${requiredSat}+`
    } else if (failed.criterion === 'minAct') {
      const requiredAct = Number(failed.required) || 0
      const currentAct = profile.actScore || 0
      gapSize = Math.max(0, requiredAct - currentAct)
      currentValue = currentAct
      targetValue = requiredAct
      requirement = `ACT ${requiredAct}+`
    }
  }

  // Experience gaps
  if (category === 'experience') {
    if (failed.criterion === 'minVolunteerHours') {
      const requiredHours = Number(failed.required) || 0
      const currentHours = profile.volunteerHours || 0
      gapSize = Math.max(0, requiredHours - currentHours)
      currentValue = currentHours
      targetValue = requiredHours
      requirement = `${requiredHours}+ volunteer hours`
    } else if (failed.criterion === 'leadershipRequired') {
      const leadershipRoles = (profile.leadershipRoles as unknown as unknown[]) || []
      gapSize = leadershipRoles.length === 0 ? 1 : 0
      currentValue = leadershipRoles.length
      targetValue = 1
      requirement = 'Leadership position'
    }
  }

  // Skip gaps we couldn't quantify
  if (gapSize === 0) {
    return null
  }

  // Assess achievability
  const achievabilityInfo = assessAchievability({ category, gapSize }, profile)

  return {
    category,
    requirement,
    currentValue,
    targetValue,
    gapSize,
    impact: '', // Will be calculated by calculateGapImpact
    scholarshipsAffected: 1, // Will be aggregated later
    fundingBlocked: scholarship.awardAmount,
    achievability: achievabilityInfo.category,
    timelineMonths: achievabilityInfo.timelineMonths,
    affectedScholarshipIds: [scholarship.id],
  }
}

/**
 * Calculate impact of closing a gap
 *
 * Determines how many scholarships would be unlocked and total funding potential
 * if this gap were closed. Uses re-filtering logic to simulate gap closure.
 *
 * @param gap - The gap to analyze
 * @param allGaps - All gaps from analysis (for context)
 * @param reachScholarships - All reach scholarships being analyzed
 * @returns Updated gap with impact metrics
 */
export function calculateGapImpact(
  gap: Gap,
  _allGaps: Gap[],
  reachScholarships: Scholarship[]
): Gap {
  // Count how many scholarships this specific gap blocks
  const scholarshipsBlocked = gap.affectedScholarshipIds.length

  // Calculate total funding blocked
  const fundingBlocked = reachScholarships
    .filter((s) => gap.affectedScholarshipIds.includes(s.id))
    .reduce((sum, s) => sum + s.awardAmount, 0)

  // Generate human-readable impact description
  const impactDescription = generateImpactDescription(
    scholarshipsBlocked,
    fundingBlocked,
    gap.requirement
  )

  return {
    ...gap,
    scholarshipsAffected: scholarshipsBlocked,
    fundingBlocked,
    impact: impactDescription,
  }
}

/**
 * Generate human-readable impact description
 */
function generateImpactDescription(
  scholarships: number,
  funding: number,
  requirement: string
): string {
  const fundingFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(funding)

  if (scholarships === 1) {
    return `Achieving ${requirement} would unlock 1 scholarship worth ${fundingFormatted}`
  }

  return `Achieving ${requirement} would unlock ${scholarships} scholarships worth ${fundingFormatted}`
}

/**
 * Aggregate similar gaps across multiple scholarships
 *
 * Combines gaps with same requirement into single recommendation with
 * combined impact metrics.
 *
 * @param gaps - All gaps identified across all reach scholarships
 * @returns Aggregated gaps with combined metrics
 */
export function aggregateGaps(gaps: Gap[]): Gap[] {
  const gapMap = new Map<string, Gap>()

  gaps.forEach((gap) => {
    // Create unique key for this type of gap
    const key = `${gap.category}:${gap.requirement}:${gap.targetValue}`

    if (gapMap.has(key)) {
      // Merge with existing gap
      const existing = gapMap.get(key)!
      existing.scholarshipsAffected += gap.scholarshipsAffected
      existing.fundingBlocked += gap.fundingBlocked
      existing.affectedScholarshipIds.push(...gap.affectedScholarshipIds)

      // Update impact description
      existing.impact = generateImpactDescription(
        existing.scholarshipsAffected,
        existing.fundingBlocked,
        existing.requirement
      )
    } else {
      // Add new gap
      gapMap.set(key, { ...gap })
    }
  })

  return Array.from(gapMap.values())
}

/**
 * Prioritize gaps by impact
 *
 * Sorts gaps by (scholarships unlocked × average award amount) to identify
 * highest-ROI improvements.
 *
 * @param gaps - Gaps to prioritize
 * @returns Sorted gaps (highest impact first)
 */
export function prioritizeGapsByImpact(gaps: Gap[]): Gap[] {
  return gaps.sort((a, b) => {
    // Primary sort: total funding blocked (descending)
    if (a.fundingBlocked !== b.fundingBlocked) {
      return b.fundingBlocked - a.fundingBlocked
    }

    // Secondary sort: number of scholarships (descending)
    if (a.scholarshipsAffected !== b.scholarshipsAffected) {
      return b.scholarshipsAffected - a.scholarshipsAffected
    }

    // Tertiary sort: achievability (EASY before MODERATE before LONG_TERM)
    const achievabilityOrder = { EASY: 1, MODERATE: 2, LONG_TERM: 3 }
    return achievabilityOrder[a.achievability] - achievabilityOrder[b.achievability]
  })
}

/**
 * Calculate impact summary for all gaps
 *
 * Aggregates metrics across all identified gaps to provide overall
 * improvement potential.
 *
 * @param gaps - All identified gaps
 * @returns Summary of total impact
 */
export function calculateImpactSummary(gaps: Gap[]): ImpactSummary {
  // Calculate unique scholarships (since gaps may overlap)
  const uniqueScholarshipIds = new Set<string>()
  gaps.forEach((gap) => {
    gap.affectedScholarshipIds.forEach((id) => uniqueScholarshipIds.add(id))
  })

  const scholarshipsUnlockable = uniqueScholarshipIds.size

  // Calculate total potential funding (deduplicated)
  const potentialFunding = gaps.reduce((sum, gap) => sum + gap.fundingBlocked, 0)

  const averageAward = scholarshipsUnlockable > 0
    ? Math.round(potentialFunding / scholarshipsUnlockable)
    : 0

  // Count gaps by achievability
  const gapsByAchievability = {
    easy: gaps.filter((g) => g.achievability === 'EASY').length,
    moderate: gaps.filter((g) => g.achievability === 'MODERATE').length,
    longTerm: gaps.filter((g) => g.achievability === 'LONG_TERM').length,
  }

  return {
    scholarshipsUnlockable,
    potentialFunding,
    averageAward,
    totalGaps: gaps.length,
    gapsByAchievability,
  }
}
