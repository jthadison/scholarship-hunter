/**
 * Scholarship Access Card Component
 *
 * Shows changes in scholarship match counts month-over-month with:
 * - Current vs previous period comparison
 * - Delta calculation by improvement source
 * - Visual indicators (arrows, colors)
 *
 * Story 5.5: Competitive Positioning Over Time
 * AC3: Scholarship Access Changes
 *
 * @module components/positioning/ScholarshipAccessCard
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Award } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PositionComparison {
  currentMonth: { matches: number; funding: number; profileStrength: number }
  previousMonth: { matches: number; funding: number; profileStrength: number }
  delta: { matches: number; funding: number; profileStrength: number }
  improvementSources: { gpa: number; volunteer: number; test: number; leadership: number }
}

interface ScholarshipAccessCardProps {
  comparison: PositionComparison
}

export function ScholarshipAccessCard({ comparison }: ScholarshipAccessCardProps) {
  const { currentMonth, previousMonth, delta, improvementSources } = comparison

  const deltaColor = delta.matches > 0 ? 'text-green-600' : delta.matches < 0 ? 'text-red-600' : 'text-gray-600'
  const DeltaIcon = delta.matches > 0 ? ArrowUp : ArrowDown

  // Filter out sources with no impact
  const significantSources = Object.entries(improvementSources)
    .filter(([_, value]) => value > 0)
    .sort(([_, a], [__, b]) => b - a)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Scholarship Access
        </CardTitle>
        <CardDescription>Changes in your scholarship matches</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Match Count Comparison */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-3xl font-bold">{currentMonth.matches}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last Month</p>
              <p className="text-3xl font-bold text-muted-foreground">{previousMonth.matches}</p>
            </div>
          </div>

          {/* Delta Display */}
          {delta.matches !== 0 && (
            <div className={`flex items-center gap-2 p-4 rounded-lg bg-muted ${deltaColor}`}>
              <DeltaIcon className="h-6 w-6" />
              <div>
                <p className="font-bold text-lg">
                  {delta.matches > 0 ? '+' : ''}{delta.matches} new matches
                </p>
                <p className="text-sm opacity-80">
                  {delta.matches > 0 ? 'Great progress!' : 'Keep improving your profile'}
                </p>
              </div>
            </div>
          )}

          {/* Improvement Sources Breakdown */}
          {significantSources.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Improvement Sources:</p>
              <div className="space-y-2">
                {significantSources.map(([source, matches]) => (
                  <div key={source} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {source === 'gpa' ? 'GPA' : source}
                    </span>
                    <Badge variant="secondary">+{matches} matches</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No change message */}
          {delta.matches === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No change in scholarship matches this month
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
