/**
 * Funding Projection Card Component
 *
 * Displays projected funding in two scenarios:
 * - Current profile funding potential
 * - Improved profile funding potential (after goals)
 *
 * Story 5.5: Competitive Positioning Over Time
 * AC4: Projected Funding Potential
 *
 * @module components/positioning/FundingProjectionCard
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface FundingProjectionCardProps {
  projections: {
    current: number
    afterImprovements?: number
  }
}

export function FundingProjectionCard({ projections }: FundingProjectionCardProps) {
  const { current, afterImprovements } = projections
  const hasImprovements = afterImprovements !== undefined && afterImprovements > current
  const potentialGain = hasImprovements ? afterImprovements - current : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Funding Projections
        </CardTitle>
        <CardDescription>
          Expected funding based on your scholarship matches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Scenario */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                With Current Profile
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-green-600">
                ${(current / 1000).toFixed(1)}k
              </span>
              <span className="text-sm text-muted-foreground">expected funding</span>
            </div>
          </div>

          {/* After Improvements Scenario */}
          {hasImprovements && afterImprovements && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    After Completing Goals
                  </span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">
                    ${(afterImprovements / 1000).toFixed(1)}k
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    (+${(potentialGain / 1000).toFixed(1)}k)
                  </span>
                </div>
                <Progress
                  value={(current / afterImprovements) * 100}
                  className="h-2"
                />
              </div>

              {/* Motivation */}
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Unlock ${(potentialGain / 1000).toFixed(1)}k More Funding
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                  Complete your active goals to increase your funding potential
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/goals">
                    View Goals →
                  </Link>
                </Button>
              </div>
            </>
          )}

          {/* Methodology Note */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Calculated based on match scores and success probabilities for your top 20 scholarships
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
