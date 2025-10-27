/**
 * Strategic Value Badge Component
 *
 * Displays strategic value tier with color-coded badge and icon.
 * Shows compact visualization of ROI classification (Story 2.6).
 *
 * @module components/matching/StrategicValueBadge
 */

import React from 'react'
import { cn } from '@/lib/utils'

export type StrategicValueTier = 'BEST_BET' | 'HIGH_VALUE' | 'MEDIUM_VALUE' | 'LOW_VALUE'

interface StrategicValueBadgeProps {
  /** Strategic value tier */
  tier: StrategicValueTier
  /** Strategic value score (0-10) */
  value: number
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

/**
 * Get tier configuration for display
 */
function getTierConfig(tier: StrategicValueTier) {
  switch (tier) {
    case 'BEST_BET':
      return {
        label: 'Best Bet',
        icon: '⭐',
        bgClass: 'bg-yellow-100 dark:bg-yellow-900/20',
        textClass: 'text-yellow-800 dark:text-yellow-300',
        borderClass: 'border-yellow-300 dark:border-yellow-700',
      }
    case 'HIGH_VALUE':
      return {
        label: 'High Value',
        icon: '✓',
        bgClass: 'bg-green-100 dark:bg-green-900/20',
        textClass: 'text-green-800 dark:text-green-300',
        borderClass: 'border-green-300 dark:border-green-700',
      }
    case 'MEDIUM_VALUE':
      return {
        label: 'Medium Value',
        icon: '•',
        bgClass: 'bg-blue-100 dark:bg-blue-900/20',
        textClass: 'text-blue-800 dark:text-blue-300',
        borderClass: 'border-blue-300 dark:border-blue-700',
      }
    case 'LOW_VALUE':
      return {
        label: 'Low Value',
        icon: '○',
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        textClass: 'text-gray-600 dark:text-gray-400',
        borderClass: 'border-gray-300 dark:border-gray-600',
      }
  }
}

/**
 * Strategic Value Badge
 *
 * Color-coded badge showing strategic value tier and score.
 *
 * @example
 * ```tsx
 * <StrategicValueBadge tier="BEST_BET" value={6.2} />
 * ```
 */
export function StrategicValueBadge({
  tier,
  value,
  size = 'md',
  className,
}: StrategicValueBadgeProps) {
  const config = getTierConfig(tier)

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.bgClass,
        config.textClass,
        config.borderClass,
        sizeClasses[size],
        className
      )}
    >
      <span className="leading-none" aria-hidden="true">
        {config.icon}
      </span>
      <span className="leading-none">{config.label}</span>
      <span className="ml-0.5 font-semibold leading-none">{value.toFixed(1)}</span>
    </div>
  )
}

/**
 * Best Bet Indicator
 *
 * Prominent indicator for "Best Bet" scholarships (Task 7.4).
 */
export function BestBetIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 px-3 py-1.5 text-sm font-bold text-yellow-900 shadow-md',
        className
      )}
    >
      <span className="text-base leading-none">⭐</span>
      <span className="leading-none">BEST BET</span>
    </div>
  )
}
