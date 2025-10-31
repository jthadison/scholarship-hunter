/**
 * GoalProgressCard Component
 *
 * Displays funding goal vs. secured amount with progress bar:
 * - Goal amount
 * - Secured amount
 * - Percentage of goal achieved
 * - Visual progress bar
 *
 * Story: 5.2 - Analytics Dashboard - Success Metrics (AC #6)
 * @module components/analytics/GoalProgressCard
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Target, TrendingUp } from 'lucide-react'

export interface GoalProgressCardProps {
  goal: number
  secured: number
  percentage: number
}

export function GoalProgressCard({ goal, secured, percentage }: GoalProgressCardProps) {
  const cappedPercentage = Math.min(percentage, 100)
  const isGoalMet = percentage >= 100

  return (
    <Card className={isGoalMet ? 'border-green-300 bg-green-50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className={`h-5 w-5 ${isGoalMet ? 'text-green-600' : 'text-blue-600'}`} />
          Funding Goal Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Goal Comparison */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Goal</p>
            <p className="text-2xl font-bold">${goal.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Secured</p>
            <p className={`text-2xl font-bold ${isGoalMet ? 'text-green-600' : 'text-blue-600'}`}>
              ${secured.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={cappedPercentage} className="h-3" />
          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${isGoalMet ? 'text-green-700' : 'text-blue-700'}`}>
              {cappedPercentage.toFixed(0)}% of goal
            </span>
            {isGoalMet && (
              <span className="flex items-center gap-1 text-green-700 font-medium">
                <TrendingUp className="h-4 w-4" />
                Goal achieved!
              </span>
            )}
          </div>
        </div>

        {/* Remaining Amount (if goal not met) */}
        {!isGoalMet && secured < goal && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-700">
              <span className="font-medium">${(goal - secured).toLocaleString()}</span> remaining to
              reach your goal
            </p>
          </div>
        )}

        {/* Exceeded Goal (if over 100%) */}
        {percentage > 100 && (
          <div className="rounded-md border border-green-300 bg-green-100 p-3">
            <p className="text-sm text-green-700">
              You exceeded your goal by{' '}
              <span className="font-medium">${(secured - goal).toLocaleString()}</span>!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
