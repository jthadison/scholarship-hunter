/**
 * Strategic Value Breakdown Component
 *
 * Displays detailed ROI calculation breakdown showing how strategic value
 * was computed from award amount, success probability, and effort level.
 *
 * @module components/matching/StrategicValueBreakdown
 */

import React from 'react'
import type { StrategicValueTier } from './StrategicValueBadge'
import { cn } from '@/lib/utils'

export type EffortLevel = 'LOW' | 'MEDIUM' | 'HIGH'

interface StrategicValueBreakdownProps {
  /** Strategic value score (0-10) */
  strategicValue: number
  /** Strategic value tier */
  tier: StrategicValueTier
  /** Scholarship award amount in dollars */
  awardAmount: number
  /** Success probability percentage (0-100) */
  successProbability: number
  /** Application effort level */
  effortLevel: EffortLevel
  /** Expected value in dollars (award × probability) */
  expectedValue: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Get effort multiplier and time estimate
 */
function getEffortInfo(level: EffortLevel) {
  switch (level) {
    case 'LOW':
      return { multiplier: 1.0, timeRange: '2-3 hours', color: 'text-green-600 dark:text-green-400' }
    case 'MEDIUM':
      return {
        multiplier: 0.7,
        timeRange: '4-6 hours',
        color: 'text-yellow-600 dark:text-yellow-400',
      }
    case 'HIGH':
      return { multiplier: 0.4, timeRange: '8+ hours', color: 'text-red-600 dark:text-red-400' }
  }
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Strategic Value Breakdown
 *
 * Shows detailed ROI calculation with all factors and formula (AC #4).
 *
 * @example
 * ```tsx
 * <StrategicValueBreakdown
 *   strategicValue={6.2}
 *   tier="BEST_BET"
 *   awardAmount={5000}
 *   successProbability={72}
 *   effortLevel="LOW"
 *   expectedValue={3600}
 * />
 * ```
 */
export function StrategicValueBreakdown({
  strategicValue,
  tier,
  awardAmount,
  successProbability,
  effortLevel,
  expectedValue,
  className,
}: StrategicValueBreakdownProps) {
  const effortInfo = getEffortInfo(effortLevel)

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900', className)}>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Strategic Value: {strategicValue.toFixed(1)} ({tier.replace('_', ' ')})
      </h3>

      <div className="space-y-3">
        {/* ROI Calculation Formula */}
        <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
          <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            ROI Calculation:
          </h4>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span>Award Amount:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(awardAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>× Success Probability:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {successProbability}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>× Effort Multiplier:</span>
              <span className={cn('font-semibold', effortInfo.color)}>
                {effortInfo.multiplier.toFixed(1)}× ({effortLevel} effort)
              </span>
            </div>
            <div className="border-t border-gray-200 pt-1 dark:border-gray-700">
              <div className="flex items-center justify-between font-medium">
                <span>= Expected Value:</span>
                <span className="text-base text-gray-900 dark:text-gray-100">
                  {formatCurrency(expectedValue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Time Investment */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Estimated time investment:</span>
          <span className={cn('font-medium', effortInfo.color)}>{effortInfo.timeRange}</span>
        </div>

        {/* Tier Explanation */}
        <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
          <h4 className="mb-1 text-sm font-medium text-blue-900 dark:text-blue-300">
            Why this is a {tier.replace('_', ' ')}:
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-400">
            {getTierExplanation(tier, strategicValue, successProbability, effortLevel)}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Get explanation for why scholarship is in this tier
 */
function getTierExplanation(
  tier: StrategicValueTier,
  value: number,
  probability: number,
  effort: EffortLevel
): string {
  switch (tier) {
    case 'BEST_BET':
      return `With a strategic value of ${value.toFixed(1)}, this scholarship offers exceptional return on investment. ${probability >= 70 ? 'High success probability' : 'Good success chances'} combined with ${effort === 'LOW' ? 'minimal effort required' : 'reasonable effort'} makes this a top priority application.`
    case 'HIGH_VALUE':
      return `This scholarship represents a strong opportunity with strategic value of ${value.toFixed(1)}. While not a "best bet," it's definitely worth pursuing after your top priorities.`
    case 'MEDIUM_VALUE':
      return `With strategic value of ${value.toFixed(1)}, this scholarship is worth considering if you have time after higher-priority applications. ${effort === 'HIGH' ? 'Higher effort required reduces ROI.' : 'Reasonable effort required.'}`
    case 'LOW_VALUE':
      return `Strategic value of ${value.toFixed(1)} suggests limited ROI. ${effort === 'HIGH' ? 'High effort required' : probability < 30 ? 'Low success probability' : 'Various factors'} make this a lower priority. Consider only if special circumstances apply.`
  }
}
