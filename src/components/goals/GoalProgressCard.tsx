/**
 * Goal Progress Card
 *
 * Displays individual goal with progress bar, current/target values,
 * trend indicator, and update button.
 *
 * Story 5.4: Profile Improvement Tracker
 * AC3: Progress tracking
 * AC4: Timeline visualization
 * AC6: Impact updates
 *
 * @module components/goals/GoalProgressCard
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Edit,
  Target,
  AlertCircle,
} from 'lucide-react'
import { GoalStatus, ProfileGoal } from '@prisma/client'
import { getGoalTypeDisplayName, getGoalValueUnit } from '@/lib/goals/impact-calculator'
import { differenceInDays, format, isPast } from 'date-fns'
import { cn } from '@/shared/lib/utils'

interface GoalProgressCardProps {
  goal: ProfileGoal
  onUpdate: (goalId: string) => void
}

export function GoalProgressCard({ goal, onUpdate }: GoalProgressCardProps) {
  const progressPercentage = (goal.currentValue / goal.targetValue) * 100
  const daysRemaining = differenceInDays(new Date(goal.targetDate), new Date())
  const isOverdue = isPast(new Date(goal.targetDate)) && goal.status !== GoalStatus.COMPLETED

  // Determine trend
  const getTrend = () => {
    if (goal.status === GoalStatus.COMPLETED) return 'completed'
    if (isOverdue) return 'overdue'

    // Simple heuristic: compare progress to time elapsed
    const totalDays = differenceInDays(
      new Date(goal.targetDate),
      new Date(goal.startDate)
    )
    const daysElapsed = totalDays - daysRemaining
    const timeProgress = daysElapsed / totalDays
    const goalProgress = progressPercentage / 100

    if (goalProgress >= timeProgress * 1.1) return 'ahead'
    if (goalProgress <= timeProgress * 0.9) return 'behind'
    return 'on-track'
  }

  const trend = getTrend()

  // Progress bar color
  const getProgressColor = () => {
    if (progressPercentage >= 67) return 'bg-green-500'
    if (progressPercentage >= 34) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Trend badge
  const getTrendBadge = () => {
    switch (trend) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-600">
            <Target className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case 'ahead':
        return (
          <Badge variant="default" className="bg-blue-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            Ahead of Schedule
          </Badge>
        )
      case 'on-track':
        return (
          <Badge variant="default" className="bg-green-600">
            <Minus className="h-3 w-3 mr-1" />
            On Track
          </Badge>
        )
      case 'behind':
        return (
          <Badge variant="default" className="bg-orange-600">
            <TrendingDown className="h-3 w-3 mr-1" />
            Behind Schedule
          </Badge>
        )
      case 'overdue':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        )
    }
  }

  return (
    <Card className={cn(isOverdue && 'border-red-500')}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                {getGoalTypeDisplayName(goal.goalType)}
              </CardTitle>
              {getTrendBadge()}
            </div>
            {goal.notes && (
              <p className="text-sm text-muted-foreground">{goal.notes}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="relative">
            <Progress value={progressPercentage} className="h-3" />
            <div
              className={cn(
                'absolute top-0 left-0 h-3 rounded-full transition-all',
                getProgressColor()
              )}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Current / Target Values */}
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-lg font-semibold">
              {goal.currentValue.toLocaleString()} {getGoalValueUnit(goal.goalType)}
            </p>
          </div>
          <div className="text-muted-foreground">/</div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="text-lg font-semibold">
              {goal.targetValue.toLocaleString()} {getGoalValueUnit(goal.goalType)}
            </p>
          </div>
        </div>

        {/* Days Remaining */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Target Date</span>
          </div>
          <div className="text-right">
            <p className="font-medium">{format(new Date(goal.targetDate), 'MMM d, yyyy')}</p>
            {!isOverdue && daysRemaining >= 0 && (
              <p className="text-xs text-muted-foreground">
                {daysRemaining} day{daysRemaining !== 1 && 's'} remaining
              </p>
            )}
            {isOverdue && (
              <p className="text-xs text-red-500">
                Overdue by {Math.abs(daysRemaining)} day{Math.abs(daysRemaining) !== 1 && 's'}
              </p>
            )}
          </div>
        </div>

        {/* Impact Estimate */}
        {goal.impactEstimate > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                <strong>+{Math.round(goal.impactEstimate)} points</strong> profile strength on
                completion
              </span>
            </div>
          </div>
        )}

        {/* Update Button */}
        {goal.status !== GoalStatus.COMPLETED && (
          <Button
            onClick={() => onUpdate(goal.id)}
            className="w-full"
            variant="outline"
          >
            <Edit className="h-4 w-4 mr-2" />
            Update Progress
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
