/**
 * MatchScoreSection Component
 *
 * Displays overall match score with dimensional breakdown and success probability.
 * Shows circular progress indicator and horizontal bars for each dimension.
 *
 * @component
 */

'use client'

import { RefreshCw, TrendingUp, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface MatchScoreSectionProps {
  match: {
    overallMatchScore: number
    academicScore: number
    demographicScore: number
    majorFieldScore: number
    experienceScore: number
    financialScore: number
    specialCriteriaScore: number
    successProbability: number
    successTier?: string | null
    calculatedAt?: Date | string
  }
  onRecalculate?: () => void
  isRecalculating?: boolean
}

const dimensionLabels: Record<string, { label: string; color: string }> = {
  academic: { label: 'Academic', color: 'bg-blue-500' },
  demographic: { label: 'Demographic', color: 'bg-green-500' },
  majorField: { label: 'Major/Field', color: 'bg-purple-500' },
  experience: { label: 'Experience', color: 'bg-orange-500' },
  financial: { label: 'Financial', color: 'bg-yellow-500' },
  specialCriteria: { label: 'Special Criteria', color: 'bg-pink-500' },
}

const successTierConfig: Record<
  string,
  { label: string; className: string; description: string }
> = {
  STRONG_MATCH: {
    label: 'Strong Match',
    className: 'bg-green-100 text-green-800 border-green-300',
    description: '70-100% success probability',
  },
  COMPETITIVE_MATCH: {
    label: 'Competitive Match',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
    description: '40-69% success probability',
  },
  REACH: {
    label: 'Reach',
    className: 'bg-orange-100 text-orange-800 border-orange-300',
    description: '10-39% success probability',
  },
  LONG_SHOT: {
    label: 'Long Shot',
    className: 'bg-red-100 text-red-800 border-red-300',
    description: '<10% success probability',
  },
}

export function MatchScoreSection({
  match,
  onRecalculate,
  isRecalculating = false,
}: MatchScoreSectionProps) {
  const dimensions = [
    { key: 'academic', score: match.academicScore },
    { key: 'demographic', score: match.demographicScore },
    { key: 'majorField', score: match.majorFieldScore },
    { key: 'experience', score: match.experienceScore },
    { key: 'financial', score: match.financialScore },
    { key: 'specialCriteria', score: match.specialCriteriaScore },
  ]

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const tierConfig = match.successTier ? successTierConfig[match.successTier] : null

  const calculatedAt =
    match.calculatedAt &&
    (typeof match.calculatedAt === 'string' ? new Date(match.calculatedAt) : match.calculatedAt)

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Match Score</h2>
          {onRecalculate && (
            <Button
              onClick={onRecalculate}
              disabled={isRecalculating}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
              Recalculate
            </Button>
          )}
        </div>

        {/* Overall Score Circle */}
        <div className="flex items-center justify-center py-6">
          <div className="relative">
            <svg className="transform -rotate-90" width="200" height="200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={`${(match.overallMatchScore / 100) * 534} 534`}
                strokeLinecap="round"
                className={getProgressColor(match.overallMatchScore).replace('bg-', 'text-')}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${getScoreColor(match.overallMatchScore)}`}>
                {Math.round(match.overallMatchScore)}
              </span>
              <span className="text-sm text-gray-600 mt-1">Overall Score</span>
            </div>
          </div>
        </div>

        {/* Success Probability and Tier */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">
              {Math.round(match.successProbability)}% Success Probability
            </span>
          </div>
          {tierConfig && (
            <Badge
              variant="outline"
              className={`${tierConfig.className} px-3 py-1 border`}
              title={tierConfig.description}
            >
              {tierConfig.label}
            </Badge>
          )}
        </div>

        {/* Dimensional Breakdown */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Dimensional Breakdown
          </h3>
          <div className="space-y-3">
            {dimensions.map(({ key, score }) => {
              const config = dimensionLabels[key]
              if (!config) return null
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{config.label}</span>
                    <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                      {Math.round(score)}
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 ${getProgressColor(score)} rounded-full transition-all duration-300`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Why This Match Explanation */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Why this match?</h4>
              <p className="text-sm text-blue-800">
                This scholarship aligns with your profile across{' '}
                {dimensions.filter((d) => d.score >= 70).length} key dimensions. Your strongest
                areas are{' '}
                {dimensions
                  .filter((d) => d.score >= 80)
                  .map((d) => dimensionLabels[d.key]?.label)
                  .filter(Boolean)
                  .join(', ') || 'multiple categories'}
                .
              </p>
            </div>
          </div>
        </div>

        {/* Calculation Timestamp */}
        {calculatedAt && (
          <p className="text-xs text-gray-500 text-center">
            Calculated {format(calculatedAt, 'MMM d, yyyy \'at\' h:mm a')}
          </p>
        )}
      </div>
    </Card>
  )
}
