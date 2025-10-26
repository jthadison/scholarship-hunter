/**
 * Probability Explanation Component
 *
 * Displays detailed breakdown of success probability calculation showing:
 * - Match score contribution (base probability)
 * - Competition factor adjustment
 * - Profile strength adjustment
 * - Visual indicators (arrows) for factors increasing/decreasing probability
 *
 * Story 2.5: Success Probability Prediction (AC#6)
 *
 * @module components/matching/ProbabilityExplanation
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProbabilityExplanationProps {
  /** Overall match score (0-100) */
  matchScore: number
  /** Base probability from match score */
  baseProbability: number
  /** Probability after competition adjustment */
  afterCompetition: number
  /** Final probability after strength adjustment */
  finalProbability: number
  /** Competition factor (0.0-1.0) */
  competitionFactor: number
  /** Profile strength adjustment amount */
  strengthAdjustment: number
  /** Applicant pool size (if available) */
  applicantPoolSize?: number
  /** Acceptance rate percentage (if available) */
  acceptanceRate?: number
  /** Optional className */
  className?: string
}

/**
 * Factor display with arrow indicator
 */
function FactorRow({
  label,
  description,
  impact,
  icon,
}: {
  label: string
  description: string
  impact: 'increase' | 'decrease' | 'neutral'
  icon?: React.ReactNode
}) {
  const impactIcons = {
    increase: <ArrowUp className="h-4 w-4 text-green-600" />,
    decrease: <ArrowDown className="h-4 w-4 text-red-600" />,
    neutral: <div className="h-4 w-4" />,
  }

  const impactColors = {
    increase: 'text-green-700',
    decrease: 'text-red-700',
    neutral: 'text-gray-700',
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex-shrink-0 mt-0.5">{icon || impactIcons[impact]}</div>
      <div className="flex-1">
        <div className={cn('font-medium text-sm', impactColors[impact])}>{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </div>
  )
}

/**
 * Probability Explanation Component
 *
 * @example
 * ```tsx
 * <ProbabilityExplanation
 *   matchScore={88}
 *   baseProbability={88}
 *   afterCompetition={65}
 *   finalProbability={72}
 *   competitionFactor={0.74}
 *   strengthAdjustment={7}
 *   applicantPoolSize={500}
 *   acceptanceRate={20}
 * />
 * ```
 */
export function ProbabilityExplanation({
  matchScore,
  baseProbability,
  afterCompetition,
  finalProbability,
  competitionFactor,
  strengthAdjustment,
  applicantPoolSize,
  acceptanceRate,
  className,
}: ProbabilityExplanationProps) {
  // Calculate impacts
  const competitionImpact = afterCompetition - baseProbability
  const strengthImpact = strengthAdjustment

  // Format competition details
  const competitionDetails = applicantPoolSize
    ? `${applicantPoolSize.toLocaleString()} applicants${
        acceptanceRate ? `, ${acceptanceRate}% acceptance rate` : ''
      }`
    : acceptanceRate
      ? `${acceptanceRate}% acceptance rate`
      : 'Competition level estimated'

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-5 w-5" />
          How is this probability calculated?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Step 1: Base Probability */}
        <FactorRow
          label={`Your ${matchScore} match score gives ${baseProbability}% base probability`}
          description="Higher match scores indicate better alignment with scholarship criteria"
          impact="neutral"
        />

        {/* Step 2: Competition Adjustment */}
        <FactorRow
          label={`Competition level reduces to ${afterCompetition}%`}
          description={competitionDetails}
          impact={competitionImpact >= 0 ? 'increase' : 'decrease'}
        />

        {/* Step 3: Profile Strength Adjustment */}
        <FactorRow
          label={`Your profile strength ${strengthImpact >= 0 ? 'increases' : 'decreases'} to ${finalProbability}%`}
          description={
            strengthImpact > 0
              ? 'Your profile is stronger than average applicants'
              : strengthImpact < 0
                ? 'Your profile is below average applicant strength'
                : 'Your profile is average compared to typical applicants'
          }
          impact={strengthImpact > 0 ? 'increase' : strengthImpact < 0 ? 'decrease' : 'neutral'}
        />

        {/* Final Result */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Final Success Probability</span>
            <span className="text-2xl font-bold text-primary">{finalProbability}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact Probability Tooltip
 *
 * Simplified version for tooltips/popovers
 */
export function ProbabilityTooltip({
  matchScore,
  finalProbability,
  competitionFactor,
}: Pick<ProbabilityExplanationProps, 'matchScore' | 'finalProbability' | 'competitionFactor'>) {
  return (
    <div className="text-xs space-y-1">
      <div>
        <span className="font-medium">Match Score:</span> {matchScore}
      </div>
      <div>
        <span className="font-medium">Competition Factor:</span>{' '}
        {Math.round(competitionFactor * 100)}%
      </div>
      <div className="mt-2 pt-2 border-t">
        <span className="font-semibold">Success Probability:</span>{' '}
        <span className="text-base font-bold">{finalProbability}%</span>
      </div>
    </div>
  )
}
