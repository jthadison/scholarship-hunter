/**
 * ImpactSummary Component
 *
 * Displays aggregate impact widget showing total scholarships unlockable
 * and potential funding with visual emphasis.
 *
 * Story: 5.3 - Gap Analysis (AC #3)
 * @module components/gap-analysis/ImpactSummary
 */

import { Card, CardContent } from '@/components/ui/card'
import type { ImpactSummary as ImpactSummaryType } from '@/lib/gap-analysis/types'
import { TrendingUp, Award, Target } from 'lucide-react'

export interface ImpactSummaryProps {
  impactSummary: ImpactSummaryType
}

export function ImpactSummary({ impactSummary }: ImpactSummaryProps) {
  const {
    scholarshipsUnlockable,
    potentialFunding,
    averageAward,
    totalGaps,
    gapsByAchievability,
  } = impactSummary

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Main Impact Statement */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Your Improvement Potential
              </h2>
              <p className="text-2xl font-bold text-blue-600">
                {scholarshipsUnlockable} scholarship{scholarshipsUnlockable !== 1 ? 's' : ''} worth{' '}
                {formatCurrency(potentialFunding)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                By completing the recommended improvements below, you could unlock access to these
                additional opportunities.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-blue-200">
            {/* Average Award */}
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Average Award</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(averageAward)}
                </p>
              </div>
            </div>

            {/* Total Gaps */}
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Areas to Improve</p>
                <p className="text-lg font-semibold text-gray-900">{totalGaps} gap{totalGaps !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Quick Wins */}
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Quick Wins</p>
                <p className="text-lg font-semibold text-green-600">
                  {gapsByAchievability.easy} easy gap{gapsByAchievability.easy !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Achievability Breakdown */}
          {totalGaps > 0 && (
            <div className="pt-3 border-t border-blue-200">
              <p className="text-xs text-gray-600 mb-2">Gap Breakdown by Difficulty:</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-600">
                    {gapsByAchievability.easy} Easy
                  </span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-gray-600">
                    {gapsByAchievability.moderate} Moderate
                  </span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <span className="text-xs text-gray-600">
                    {gapsByAchievability.longTerm} Long-term
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
