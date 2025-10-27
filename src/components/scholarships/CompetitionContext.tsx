/**
 * CompetitionContext Component
 *
 * Displays scholarship competition information:
 * - Estimated applicant pool size
 * - Historical acceptance rate
 * - Competition level indicator
 * - Student's competitive position
 *
 * @component
 */

'use client'

import { Users, TrendingUp, Target, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface CompetitionContextProps {
  applicantPoolSize?: number | null
  acceptanceRate?: number | null
  numberOfAwards?: number
  overallMatchScore?: number
  successProbability?: number
}

const competitionLevelConfig = {
  LOW: {
    label: 'Low Competition',
    color: 'bg-green-100 text-green-800 border-green-300',
    description: 'Good chances for qualified applicants',
  },
  MODERATE: {
    label: 'Moderate Competition',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Competitive but achievable',
  },
  HIGH: {
    label: 'High Competition',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'Strong profile needed',
  },
  VERY_HIGH: {
    label: 'Very High Competition',
    color: 'bg-red-100 text-red-800 border-red-300',
    description: 'Exceptional profile required',
  },
}

export function CompetitionContext({
  applicantPoolSize,
  acceptanceRate,
  numberOfAwards = 1,
  overallMatchScore,
  successProbability,
}: CompetitionContextProps) {
  // Calculate competition level
  const getCompetitionLevel = () => {
    if (acceptanceRate !== null && acceptanceRate !== undefined) {
      if (acceptanceRate >= 0.2) return 'LOW'
      if (acceptanceRate >= 0.1) return 'MODERATE'
      if (acceptanceRate >= 0.05) return 'HIGH'
      return 'VERY_HIGH'
    }
    // Fallback to pool size
    if (applicantPoolSize) {
      const ratio = applicantPoolSize / numberOfAwards
      if (ratio <= 20) return 'LOW'
      if (ratio <= 50) return 'MODERATE'
      if (ratio <= 100) return 'HIGH'
      return 'VERY_HIGH'
    }
    return 'MODERATE' // Default
  }

  const competitionLevel = getCompetitionLevel()
  const levelConfig = competitionLevelConfig[competitionLevel]

  // Calculate student's competitive position
  const getCompetitivePosition = () => {
    if (overallMatchScore === undefined) return null

    if (overallMatchScore >= 85) return 'Excellent'
    if (overallMatchScore >= 70) return 'Strong'
    if (overallMatchScore >= 55) return 'Moderate'
    return 'Below Average'
  }

  const competitivePosition = getCompetitivePosition()

  const positionColor = competitivePosition
    ? {
        Excellent: 'text-green-600',
        Strong: 'text-blue-600',
        Moderate: 'text-orange-600',
        'Below Average': 'text-red-600',
      }[competitivePosition]
    : undefined

  // Format acceptance rate
  const formattedAcceptanceRate =
    acceptanceRate !== null && acceptanceRate !== undefined
      ? `${(acceptanceRate * 100).toFixed(1)}%`
      : 'Not available'

  // Calculate awards-to-applicants ratio
  const hasPoolData = applicantPoolSize && applicantPoolSize > 0
  const awardsRatio = hasPoolData
    ? `${numberOfAwards} award${numberOfAwards !== 1 ? 's' : ''} for ~${applicantPoolSize.toLocaleString()} applicants`
    : null

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Competition Context</h2>
            <Badge variant="outline" className={`${levelConfig.color} border px-3 py-1`}>
              {levelConfig.label}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{levelConfig.description}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Applicant Pool */}
          {hasPoolData && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Estimated Applicants</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {applicantPoolSize!.toLocaleString()}
              </p>
              {awardsRatio && <p className="text-xs text-gray-600 mt-1">{awardsRatio}</p>}
            </div>
          )}

          {/* Acceptance Rate */}
          {acceptanceRate !== null && acceptanceRate !== undefined && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Acceptance Rate</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formattedAcceptanceRate}</p>
              <div className="mt-2">
                <Progress value={acceptanceRate * 100} className="h-2" />
              </div>
            </div>
          )}
        </div>

        {/* Your Competitive Position */}
        {competitivePosition && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  Your Competitive Position
                </h4>
                <p className="text-sm text-blue-800">
                  Based on your match score of{' '}
                  <span className={`font-semibold ${positionColor}`}>
                    {Math.round(overallMatchScore!)}
                  </span>
                  , your competitive position is{' '}
                  <span className={`font-semibold ${positionColor}`}>{competitivePosition}</span>.
                  {successProbability !== undefined && (
                    <> You have a {Math.round(successProbability)}% estimated success probability.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contextual Explanation */}
        {hasPoolData && acceptanceRate !== null && acceptanceRate !== undefined && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">What this means</h4>
                <p className="text-sm text-gray-700">
                  With approximately {applicantPoolSize!.toLocaleString()} applicants competing for{' '}
                  {numberOfAwards} {numberOfAwards === 1 ? 'award' : 'awards'}, the acceptance rate
                  is around {formattedAcceptanceRate}. This means roughly{' '}
                  {Math.round(applicantPoolSize! * (acceptanceRate || 0))} applicants will receive
                  funding.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Data Available */}
        {!hasPoolData && (acceptanceRate === null || acceptanceRate === undefined) && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <Info className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Competition data not available. Check scholarship website for historical information.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
