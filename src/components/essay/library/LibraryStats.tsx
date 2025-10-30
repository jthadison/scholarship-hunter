/**
 * LibraryStats Component (Story 4.8 - Task 13)
 *
 * Displays library statistics dashboard
 * AC10: Shows total essays, words written, top themes, avg quality, reuse rate, time saved
 *
 * @module components/essay/library/LibraryStats
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Type, Tag, Star, RefreshCw, Clock, TrendingUp } from 'lucide-react'

interface LibraryStatsProps {
  stats: {
    totalEssays: number
    totalWords: number
    topThemes: Array<{ theme: string; count: number }>
    avgQualityScore: number | null
    reuseRate: number
    timeSavedHours: number
    themeCount: Record<string, number>
  }
}

/**
 * LibraryStats Component
 * Summary statistics at top of library page
 */
export function LibraryStats({ stats }: LibraryStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Library Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* Total Essays */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <FileText className="h-4 w-4" />
              <span>Essays</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalEssays}</div>
          </div>

          {/* Total Words */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Type className="h-4 w-4" />
              <span>Total Words</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</div>
          </div>

          {/* Top Theme */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Tag className="h-4 w-4" />
              <span>Top Theme</span>
            </div>
            <div className="text-sm font-semibold">
              {stats.topThemes[0]
                ? `${stats.topThemes[0].theme} (${stats.topThemes[0].count})`
                : 'N/A'}
            </div>
          </div>

          {/* Average Quality */}
          {stats.avgQualityScore !== null && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Star className="h-4 w-4" />
                <span>Avg Quality</span>
              </div>
              <div className="text-2xl font-bold">{Math.round(stats.avgQualityScore)}/100</div>
            </div>
          )}

          {/* Reuse Rate */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <RefreshCw className="h-4 w-4" />
              <span>Reuse Rate</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(stats.reuseRate)}%</div>
          </div>

          {/* Time Saved */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              <span>Time Saved</span>
            </div>
            <div className="text-2xl font-bold">~{stats.timeSavedHours}h</div>
          </div>

          {/* Progress Indicator */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Progress</span>
            </div>
            <div className="text-sm font-semibold text-green-600 dark:text-green-400">
              Building Library
            </div>
          </div>
        </div>

        {/* Theme Coverage Analysis */}
        {stats.topThemes.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Theme Coverage:</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              {stats.topThemes.map(({ theme, count }) => (
                <Badge key={theme} variant="secondary" className="text-xs">
                  {theme.replace(/-/g, ' ')}: {count}
                  {count >= 3 ? ' ✓' : ''}
                </Badge>
              ))}
            </div>
            {stats.topThemes.some(t => t.count >= 3) && (
              <p className="text-xs text-muted-foreground mt-2">
                ✓ Strong coverage (3+ essays)
              </p>
            )}
          </div>
        )}

        {/* Motivational Message */}
        {stats.totalEssays > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {stats.totalEssays < 5
                ? "You're building a valuable essay library! Keep going!"
                : stats.totalEssays < 10
                ? "Great progress! Your essay library is growing."
                : "Excellent work! You have a strong essay library for strategic reuse."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
