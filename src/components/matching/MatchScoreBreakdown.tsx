/**
 * Match Score Breakdown Component
 *
 * Displays detailed dimensional scores with visual progress bars
 * Shows: Academic, Demographic, Major/Field, Experience, Financial, Special
 *
 * @module components/matching/MatchScoreBreakdown
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface MatchScore {
  overallMatchScore: number
  academicScore: number
  demographicScore: number
  majorFieldScore: number
  experienceScore: number
  financialScore: number
  specialCriteriaScore: number
  calculatedAt?: Date
}

interface MatchScoreBreakdownProps {
  /** Match score object with dimensional scores */
  matchScore: MatchScore
  /** Show detailed view with weights and descriptions */
  showDetails?: boolean
  /** Optional className for custom styling */
  className?: string
}

/**
 * Dimensional score configuration with labels and weights
 */
const DIMENSIONS = [
  {
    key: 'academicScore' as const,
    label: 'Academic',
    description: 'GPA, test scores, class rank',
    weight: 30,
    icon: '🎓',
  },
  {
    key: 'majorFieldScore' as const,
    label: 'Major/Field',
    description: 'Major alignment, field of study',
    weight: 20,
    icon: '📚',
  },
  {
    key: 'demographicScore' as const,
    label: 'Demographic',
    description: 'Gender, ethnicity, location',
    weight: 15,
    icon: '👥',
  },
  {
    key: 'experienceScore' as const,
    label: 'Experience',
    description: 'Extracurriculars, volunteer hours, leadership',
    weight: 15,
    icon: '⭐',
  },
  {
    key: 'financialScore' as const,
    label: 'Financial',
    description: 'Financial need alignment',
    weight: 10,
    icon: '💰',
  },
  {
    key: 'specialCriteriaScore' as const,
    label: 'Special Criteria',
    description: 'First-gen, military, disabilities',
    weight: 10,
    icon: '🏅',
  },
] as const

/**
 * Get color class based on score
 */
function getProgressColor(score: number): string {
  if (score >= 76) return 'bg-green-500'
  if (score >= 51) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * Match Score Breakdown Component
 *
 * @example
 * ```tsx
 * const matchScore = {
 *   overallMatchScore: 88,
 *   academicScore: 95,
 *   demographicScore: 100,
 *   majorFieldScore: 90,
 *   experienceScore: 70,
 *   financialScore: 80,
 *   specialCriteriaScore: 85,
 * }
 *
 * <MatchScoreBreakdown matchScore={matchScore} showDetails={true} />
 * ```
 */
export function MatchScoreBreakdown({
  matchScore,
  showDetails = false,
  className,
}: MatchScoreBreakdownProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Match Score Breakdown</span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-primary">
              {Math.round(matchScore.overallMatchScore)}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DIMENSIONS.map((dimension) => {
          const score = matchScore[dimension.key]
          return (
            <div key={dimension.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{dimension.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{dimension.label}</div>
                    {showDetails && (
                      <div className="text-xs text-muted-foreground">
                        {dimension.description} · {dimension.weight}% weight
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold">{Math.round(score)}</span>
              </div>
              <Progress
                value={score}
                className="h-2"
                indicatorClassName={getProgressColor(score)}
              />
            </div>
          )
        })}

        {matchScore.calculatedAt && (
          <div className="pt-2 text-xs text-muted-foreground border-t">
            Calculated on {new Date(matchScore.calculatedAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact Match Score Summary
 *
 * Shows only overall score and top 3 dimensional scores
 */
export function MatchScoreSummary({
  matchScore,
  className,
}: {
  matchScore: MatchScore
  className?: string
}) {
  // Get top 3 dimensional scores
  const topScores = DIMENSIONS.map((dim) => ({
    ...dim,
    score: matchScore[dim.key],
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">
          {Math.round(matchScore.overallMatchScore)}
        </span>
        <span className="text-sm text-muted-foreground">Overall Match</span>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Top Matches:</div>
        {topScores.map((dimension) => (
          <div key={dimension.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <span>{dimension.icon}</span>
              <span>{dimension.label}</span>
            </span>
            <span className="font-semibold">{Math.round(dimension.score)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
