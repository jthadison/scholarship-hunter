// ============================================================================
// Story 5.3: Gap Analysis - Type Definitions
// ============================================================================

import type { Scholarship } from '@prisma/client'

/**
 * Achievability category for gap recommendations
 * Based on estimated effort and timeline to close the gap
 */
export type AchievabilityCategory = 'EASY' | 'MODERATE' | 'LONG_TERM'

/**
 * Gap category - which dimension of the profile needs improvement
 */
export type GapCategory =
  | 'academic'
  | 'demographic'
  | 'major'
  | 'experience'
  | 'financial'
  | 'special'

/**
 * Individual gap identified in student profile
 * Represents a specific qualification missing from student's profile
 */
export interface Gap {
  /** Which dimension this gap belongs to */
  category: GapCategory

  /** Name of the specific requirement */
  requirement: string

  /** Student's current value for this criterion */
  currentValue: string | number | boolean | null

  /** Target value required by scholarships */
  targetValue: string | number | boolean

  /** Numerical size of the gap (for quantitative gaps like GPA) */
  gapSize: number

  /** Human-readable impact description */
  impact: string

  /** Quantitative impact: scholarships this gap blocks */
  scholarshipsAffected: number

  /** Quantitative impact: total funding blocked in dollars */
  fundingBlocked: number

  /** How difficult/time-consuming to close this gap */
  achievability: AchievabilityCategory

  /** Timeline estimate in months */
  timelineMonths: number

  /** List of affected scholarship IDs (for reference) */
  affectedScholarshipIds: string[]
}

/**
 * Resource link for recommendations
 */
export interface ResourceLink {
  title: string
  url: string
  description?: string
}

/**
 * Individual recommendation with action steps
 */
export interface Recommendation {
  /** The gap this recommendation addresses */
  gap: Gap

  /** Specific actionable recommendation text */
  recommendation: string

  /** Concrete action steps to take */
  actionSteps: string[]

  /** Timeline estimate (e.g., "1-3 months") */
  timeline: string

  /** Target completion date (calculated from current date + timeline) */
  targetDate: Date

  /** Helpful resource links */
  resources: ResourceLink[]

  /** Dependencies (gaps that should be closed first) */
  dependencies?: string[]
}

/**
 * Improvement roadmap with sequenced recommendations
 */
export interface Roadmap {
  /** Recommendations grouped by achievability */
  easy: Recommendation[]
  moderate: Recommendation[]
  longTerm: Recommendation[]

  /** Overall timeline estimate in months */
  totalTimelineMonths: number

  /** Recommended order of execution */
  recommendedSequence: Recommendation[]
}

/**
 * Profile strength projection with hypothetical improvements
 */
export interface ProfileProjection {
  /** Current profile strength score */
  current: number

  /** Projected score with all improvements */
  projected: number

  /** Point increase */
  increase: number

  /** Dimensional breakdowns */
  currentBreakdown: {
    academic: number
    experience: number
    leadership: number
    demographics: number
  }

  projectedBreakdown: {
    academic: number
    experience: number
    leadership: number
    demographics: number
  }

  /** Scholarship access change */
  currentMatches: number
  projectedMatches: number
  additionalMatches: number

  /** Funding potential change */
  currentFundingPotential: number
  projectedFundingPotential: number
  additionalFunding: number
}

/**
 * Impact summary for all gaps
 */
export interface ImpactSummary {
  /** Total scholarships that would be unlocked */
  scholarshipsUnlockable: number

  /** Total potential funding increase in dollars */
  potentialFunding: number

  /** Average award amount of unlockable scholarships */
  averageAward: number

  /** Number of gaps identified */
  totalGaps: number

  /** Breakdown by achievability */
  gapsByAchievability: {
    easy: number
    moderate: number
    longTerm: number
  }
}

/**
 * Complete gap analysis result
 */
export interface GapAnalysisResult {
  /** All identified gaps */
  gaps: Gap[]

  /** Improvement roadmap */
  roadmap: Roadmap

  /** Profile strength projection */
  projection: ProfileProjection

  /** Impact summary */
  impactSummary: ImpactSummary

  /** Analysis timestamp */
  analyzedAt: Date
}

/**
 * Historical comparison result
 */
export interface ProgressComparison {
  /** Date of last analysis */
  lastAnalysisDate: Date

  /** Days since last analysis */
  daysSince: number

  /** Profile strength change */
  profileStrengthChange: number

  /** Number of gaps closed */
  gapsClosed: number

  /** Gaps that remain open */
  gapsRemaining: number

  /** New scholarships unlocked since last analysis */
  newScholarshipsUnlocked: number

  /** Closed gaps with details */
  closedGaps: Gap[]

  /** Emerging gaps (new high-value scholarships added) */
  emergingGaps: Gap[]
}

/**
 * Hypothetical profile changes for simulator
 */
export interface HypotheticalChanges {
  gpa?: number
  satScore?: number
  actScore?: number
  volunteerHours?: number
  hasLeadership?: boolean
  leadershipCount?: number
  extracurricularCount?: number
}

/**
 * Simulator result with projected impact
 */
export interface SimulatorResult {
  /** Projected profile strength with changes */
  projectedStrength: number

  /** Scholarships that would be unlocked */
  scholarshipsUnlocked: number

  /** Funding increase in dollars */
  fundingIncrease: number

  /** Specific scholarships that would become accessible */
  unlockedScholarships: Scholarship[]

  /** Dimensional score changes */
  dimensionalChanges: {
    academic: number
    experience: number
    leadership: number
    demographics: number
  }
}
