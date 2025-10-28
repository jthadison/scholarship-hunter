/**
 * ProgressBar Component
 *
 * Displays application completion progress with color-coded visualization:
 * - Red (0-33%): Behind schedule
 * - Yellow (34-66%): On track
 * - Green (67-100%): Good progress
 *
 * Features:
 * - Animated transitions
 * - Milestone markers at 25%, 50%, 75%, 100%
 * - Mobile responsive
 * - WCAG 2.1 AA accessible
 *
 * @module components/ui/ProgressBar
 */

import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  /**
   * Progress percentage (0-100)
   */
  percentage: number

  /**
   * Show percentage label
   * @default true
   */
  showLabel?: boolean

  /**
   * Variant style
   * @default 'default'
   */
  variant?: 'default' | 'compact'

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Get color class based on percentage
 */
function getColorClass(percentage: number): string {
  if (percentage >= 67) return 'bg-gradient-to-r from-green-500 to-green-600'
  if (percentage >= 34) return 'bg-gradient-to-r from-yellow-500 to-yellow-600'
  return 'bg-gradient-to-r from-red-500 to-red-600'
}

/**
 * Get text color class based on percentage
 */
function getTextColorClass(percentage: number): string {
  if (percentage >= 67) return 'text-green-600'
  if (percentage >= 34) return 'text-yellow-600'
  return 'text-red-600'
}

export function ProgressBar({
  percentage,
  showLabel = true,
  variant = 'default',
  className,
}: ProgressBarProps) {
  // Clamp percentage to 0-100
  const clampedPercentage = Math.max(0, Math.min(100, percentage))

  const colorClass = getColorClass(clampedPercentage)
  const textColorClass = getTextColorClass(clampedPercentage)

  const isCompact = variant === 'compact'

  return (
    <div className={cn('w-full', className)}>
      {/* Label */}
      {showLabel && (
        <div className={cn('mb-2 flex items-center justify-between', isCompact && 'mb-1')}>
          <span className={cn('text-sm font-medium', textColorClass)}>
            {clampedPercentage}% complete
          </span>
        </div>
      )}

      {/* Progress bar container */}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
          isCompact ? 'h-2' : 'h-4'
        )}
        role="progressbar"
        aria-valuenow={clampedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Application completion: ${clampedPercentage} percent`}
      >
        {/* Progress fill */}
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            colorClass
          )}
          style={{ width: `${clampedPercentage}%` }}
        />

        {/* Milestone markers */}
        {!isCompact && (
          <>
            {[25, 50, 75, 100].map((milestone) => (
              <div
                key={milestone}
                className="absolute top-0 h-full w-px bg-white/30"
                style={{ left: `${milestone}%` }}
                aria-hidden="true"
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Circular progress indicator (for dashboard cards)
 */
interface CircularProgressProps {
  percentage: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CircularProgress({ percentage, size = 'md', className }: CircularProgressProps) {
  const clampedPercentage = Math.max(0, Math.min(100, percentage))
  const circumference = 2 * Math.PI * 45 // radius = 45
  const offset = circumference - (clampedPercentage / 100) * circumference

  const colorClass = getTextColorClass(clampedPercentage)

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <svg className="h-full w-full -rotate-90 transform">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all duration-500 ease-out', colorClass)}
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('font-semibold', textSizeClasses[size], colorClass)}>
          {clampedPercentage}%
        </span>
      </div>
    </div>
  )
}
