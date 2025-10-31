/**
 * Peer Benchmark Card Component
 *
 * Displays anonymized peer comparison data:
 * - Peer group definition
 * - Funding range comparison
 * - Success rate comparison
 *
 * Story 5.5: Competitive Positioning Over Time
 * AC5: Comparison to Similar Profiles
 *
 * @module components/positioning/PeerBenchmarkCard
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Shield } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface PeerBenchmark {
  peerGroupDefinition: string
  fundingRange: { min: number; max: number }
  averageFunding: number
  successRateComparison: { peer: number; student: number }
  studentCount: number
}

interface CompetitivePosition {
  projectedFunding: number
}

interface PeerBenchmarkCardProps {
  benchmark: PeerBenchmark
  currentPosition: CompetitivePosition
}

export function PeerBenchmarkCard({ benchmark, currentPosition }: PeerBenchmarkCardProps) {
  const {
    peerGroupDefinition,
    fundingRange,
    averageFunding,
    successRateComparison,
    studentCount,
  } = benchmark

  const studentFunding = currentPosition.projectedFunding
  const isAboveAverage = studentFunding > averageFunding
  const percentageVsAvg = averageFunding > 0
    ? ((studentFunding - averageFunding) / averageFunding) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Peer Comparison
        </CardTitle>
        <CardDescription>
          How you compare to students with similar profiles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Peer Group Definition */}
        <div>
          <p className="text-sm font-medium mb-2">Your Peer Group</p>
          <p className="text-sm text-muted-foreground">{peerGroupDefinition}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on {studentCount} similar students
          </p>
        </div>

        {/* Funding Comparison */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Funding Range</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Peer Average</span>
                <span className="font-bold">${(averageFunding / 1000).toFixed(1)}k</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Peer Range</span>
                <span className="font-medium">
                  ${(fundingRange.min / 1000).toFixed(1)}k - ${(fundingRange.max / 1000).toFixed(1)}k
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your Projection</span>
                <span className={`font-bold ${isAboveAverage ? 'text-green-600' : 'text-orange-600'}`}>
                  ${(studentFunding / 1000).toFixed(1)}k
                </span>
              </div>
            </div>
          </div>

          {/* Position vs Average */}
          <div className={`p-4 rounded-lg ${isAboveAverage ? 'bg-green-50 dark:bg-green-950' : 'bg-orange-50 dark:bg-orange-950'}`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`h-5 w-5 ${isAboveAverage ? 'text-green-600' : 'text-orange-600'}`} />
              <p className={`font-medium ${isAboveAverage ? 'text-green-900 dark:text-green-100' : 'text-orange-900 dark:text-orange-100'}`}>
                {isAboveAverage
                  ? `You're tracking ${Math.abs(percentageVsAvg).toFixed(0)}% above average`
                  : `You're tracking ${Math.abs(percentageVsAvg).toFixed(0)}% below average`}
              </p>
            </div>
            <p className={`text-sm ${isAboveAverage ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
              {isAboveAverage
                ? 'Great work! Your profile is more competitive than most similar students.'
                : 'Focus on your goals to improve your competitive position.'}
            </p>
          </div>
        </div>

        {/* Success Rate Comparison */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Predicted Success Rate</p>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Peer Average</span>
                <span className="font-medium">{successRateComparison.peer}%</span>
              </div>
              <Progress value={successRateComparison.peer} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Your Prediction</span>
                <span className="font-bold text-primary">{successRateComparison.student}%</span>
              </div>
              <Progress value={successRateComparison.student} className="h-2" />
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted">
          <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
            All peer data is anonymized and aggregated to protect student privacy
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
