/**
 * ProfileProjection Component
 *
 * Displays before/after comparison visual showing current vs projected
 * profile strength with dimensional breakdowns.
 *
 * Story: 5.3 - Gap Analysis (AC #7)
 * @module components/gap-analysis/ProfileProjection
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ProfileProjection as ProfileProjectionType } from '@/lib/gap-analysis/types'
import { TrendingUp, Award } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export interface ProfileProjectionProps {
  projection: ProfileProjectionType
}

export function ProfileProjection({ projection }: ProfileProjectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const dimensions = [
    {
      label: 'Academic',
      current: projection.currentBreakdown.academic,
      projected: projection.projectedBreakdown.academic,
    },
    {
      label: 'Experience',
      current: projection.currentBreakdown.experience,
      projected: projection.projectedBreakdown.experience,
    },
    {
      label: 'Leadership',
      current: projection.currentBreakdown.leadership,
      projected: projection.projectedBreakdown.leadership,
    },
    {
      label: 'Demographics',
      current: projection.currentBreakdown.demographics,
      projected: projection.projectedBreakdown.demographics,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Profile Strength Projection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score Comparison */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="text-center flex-1">
              <p className="text-sm text-gray-600 mb-1">Current</p>
              <p className="text-3xl font-bold text-gray-900">{projection.current}</p>
            </div>
            <div className="px-4">
              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-6 w-6" />
                <span className="text-xl font-bold">+{projection.increase}</span>
              </div>
            </div>
            <div className="text-center flex-1">
              <p className="text-sm text-gray-600 mb-1">Projected</p>
              <p className="text-3xl font-bold text-blue-600">{projection.projected}</p>
            </div>
          </div>
          <p className="text-xs text-center text-gray-600">
            Your profile strength will increase from {projection.current} to {projection.projected}{' '}
            with these improvements
          </p>
        </div>

        {/* Dimensional Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Score Breakdown by Dimension</h4>
          {dimensions.map((dim) => {
            const increase = dim.projected - dim.current
            const hasIncrease = increase > 0

            return (
              <div key={dim.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{dim.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{dim.current}</span>
                    {hasIncrease && (
                      <span className="text-xs text-green-600 font-medium">
                        +{increase}
                      </span>
                    )}
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold text-blue-600">{dim.projected}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={dim.current} className="flex-1 h-2" />
                  {hasIncrease && (
                    <>
                      <span className="text-gray-400">→</span>
                      <Progress value={dim.projected} className="flex-1 h-2 [&>div]:bg-blue-600" />
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Scholarship Access Change */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Award className="h-4 w-4 text-blue-600" />
            Scholarship Access Impact
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Matches */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Accessible Scholarships</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {projection.currentMatches}
                </span>
                <span className="text-gray-400">→</span>
                <span className="text-2xl font-bold text-blue-600">
                  {projection.projectedMatches}
                </span>
              </div>
              {projection.additionalMatches > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  +{projection.additionalMatches} new opportunities
                </p>
              )}
            </div>

            {/* Funding Potential */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Funding Potential</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(projection.currentFundingPotential)}
                </span>
                <span className="text-gray-400">→</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(projection.projectedFundingPotential)}
                </span>
              </div>
              {projection.additionalFunding > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  +{formatCurrency(projection.additionalFunding)} increase
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
