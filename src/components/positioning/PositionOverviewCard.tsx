/**
 * Position Overview Card Component
 *
 * Displays current competitive position summary with key metrics:
 * - Profile strength score with visual gauge
 * - Percentile ranking (top X%)
 * - Scholarship tier access breakdown
 *
 * Story 5.5: Competitive Positioning Over Time
 * AC1: Positioning Dashboard
 *
 * @module components/positioning/PositionOverviewCard
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Award, Target } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface CompetitivePosition {
  profileStrengthScore: number
  percentileRanking: number
  totalMatches: number
  mustApplyCount: number
  shouldApplyCount: number
  ifTimePermitsCount: number
  projectedFunding: number
}

interface PositionOverviewCardProps {
  position: CompetitivePosition
}

export function PositionOverviewCard({ position }: PositionOverviewCardProps) {
  const {
    profileStrengthScore,
    percentileRanking,
    totalMatches,
    mustApplyCount,
    shouldApplyCount,
    ifTimePermitsCount,
    projectedFunding,
  } = position

  // Determine color zone for profile strength
  const getStrengthColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getStrengthLabel = (score: number) => {
    if (score >= 85) return 'Elite'
    if (score >= 70) return 'Strong'
    if (score >= 50) return 'Good'
    return 'Developing'
  }

  // Calculate percentile description
  const topPercentage = Math.round(100 - percentileRanking)
  const percentileDescription = topPercentage === 0 ? 'Top 1%' : `Top ${topPercentage}%`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Your Competitive Position
        </CardTitle>
        <CardDescription>
          Current profile strength and scholarship access overview
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Strength */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Profile Strength
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="ml-2">
                      {getStrengthLabel(profileStrengthScore)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your profile's overall competitiveness score</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getStrengthColor(profileStrengthScore)}`}>
                {Math.round(profileStrengthScore)}
              </span>
              <span className="text-xl text-muted-foreground">/ 100</span>
            </div>
            <Progress value={profileStrengthScore} className="h-2" />
          </div>

          {/* Percentile Ranking */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Your Ranking
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You rank higher than {Math.round(percentileRanking)}% of students</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">
                {percentileDescription}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              of platform users
            </p>
          </div>

          {/* Projected Funding */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Projected Funding
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Expected funding based on your top 20 matches</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-green-600">
                ${(projectedFunding / 1000).toFixed(1)}k
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              from {totalMatches} matches
            </p>
          </div>
        </div>

        {/* Scholarship Tier Breakdown */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold mb-4">Scholarship Access by Tier</h4>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950">
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-400">
                  MUST APPLY
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {mustApplyCount}
                </p>
              </div>
              <Award className="h-8 w-8 text-red-600 dark:text-red-400 opacity-50" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                  SHOULD APPLY
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {shouldApplyCount}
                </p>
              </div>
              <Award className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-50" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-400">
                  IF TIME PERMITS
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {ifTimePermitsCount}
                </p>
              </div>
              <Award className="h-8 w-8 text-gray-600 dark:text-gray-400 opacity-50" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
