/**
 * Match Score Badge Component
 *
 * Displays overall match score as a color-coded badge
 * - 0-50: Red (poor match)
 * - 51-75: Yellow (moderate match)
 * - 76-100: Green (strong match)
 *
 * @module components/matching/MatchScoreBadge
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MatchScoreBadgeProps {
  /** Match score from 0-100 */
  score: number
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Optional className for custom styling */
  className?: string
}

/**
 * Get color variant based on score range
 */
function getScoreVariant(score: number): 'destructive' | 'default' | 'secondary' {
  if (score >= 76) return 'secondary' // Green
  if (score >= 51) return 'default' // Yellow
  return 'destructive' // Red
}

/**
 * Get background color class based on score (for custom coloring)
 */
function getScoreColorClass(score: number): string {
  if (score >= 76) return 'bg-green-100 text-green-800 border-green-200'
  if (score >= 51) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

/**
 * Match Score Badge
 *
 * @example
 * ```tsx
 * <MatchScoreBadge score={88} size="md" />
 * // Renders: Green badge with "88"
 * ```
 */
export function MatchScoreBadge({
  score,
  size = 'md',
  className,
}: MatchScoreBadgeProps) {
  // Clamp score to 0-100 range
  const displayScore = Math.max(0, Math.min(100, Math.round(score)))

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  }

  return (
    <Badge
      variant={getScoreVariant(displayScore)}
      className={cn(
        'font-semibold border',
        getScoreColorClass(displayScore),
        sizeClasses[size],
        className
      )}
    >
      {displayScore}
    </Badge>
  )
}

/**
 * Match Score Badge with Label
 *
 * Displays score with descriptive label
 */
export function MatchScoreBadgeWithLabel({
  score,
  size = 'md',
  className,
}: MatchScoreBadgeProps) {
  const displayScore = Math.max(0, Math.min(100, Math.round(score)))

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent Match'
    if (score >= 76) return 'Strong Match'
    if (score >= 60) return 'Good Match'
    if (score >= 40) return 'Fair Match'
    return 'Weak Match'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <MatchScoreBadge score={displayScore} size={size} />
      <span className="text-sm text-muted-foreground">{getScoreLabel(displayScore)}</span>
    </div>
  )
}
