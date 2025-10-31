/**
 * Positioning Dashboard Page
 *
 * Main dashboard for viewing competitive positioning over time.
 * Shows current position, historical trends, peer comparisons, and achievement badges.
 *
 * Story 5.5: Competitive Positioning Over Time
 * AC1: Positioning Dashboard with metrics
 *
 * @module app/dashboard/positioning/page
 */

'use client'

import React, { useState } from 'react'
import { trpc } from '@/shared/lib/trpc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, TrendingUp, Users, Award, Target } from 'lucide-react'
import { PositionOverviewCard } from '@/components/positioning/PositionOverviewCard'
import { PositionTrendChart } from '@/components/positioning/PositionTrendChart'
import { ScholarshipAccessCard } from '@/components/positioning/ScholarshipAccessCard'
import { FundingProjectionCard } from '@/components/positioning/FundingProjectionCard'
import { PeerBenchmarkCard } from '@/components/positioning/PeerBenchmarkCard'
import { AchievementBadgesGrid } from '@/components/positioning/AchievementBadgesGrid'
import { MotivationalInsightCard } from '@/components/positioning/MotivationalInsightCard'

export default function PositioningDashboardPage() {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y' | 'all'>('90d')

  // Fetch positioning data
  const { data: currentPosition, isLoading: positionLoading } =
    trpc.positioning.getCurrent.useQuery()
  const { data: history, isLoading: historyLoading } =
    trpc.positioning.getHistory.useQuery({ timeRange })
  const { data: comparison, isLoading: comparisonLoading } =
    trpc.positioning.getComparison.useQuery()
  const { data: peerBenchmark, isLoading: peerLoading } =
    trpc.positioning.getPeerBenchmark.useQuery()
  const { data: achievements, isLoading: achievementsLoading } =
    trpc.positioning.getAchievements.useQuery()
  const { data: projectedFunding, isLoading: fundingLoading } =
    trpc.positioning.getProjectedFunding.useQuery({ includeGoals: true })

  const isLoading =
    positionLoading ||
    historyLoading ||
    comparisonLoading ||
    peerLoading ||
    achievementsLoading ||
    fundingLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // No data state
  if (!currentPosition) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Competitive Positioning</CardTitle>
            <CardDescription>
              Track your competitive position over time and see how you compare to other students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Positioning Data Available</h3>
              <p className="text-muted-foreground">
                We're building your competitive profile. Check back tomorrow to see your position!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Competitive Positioning</h1>
        <p className="text-muted-foreground mt-2">
          Track your progress and see how your profile stacks up against other students
        </p>
      </div>

      {/* Motivational Insight */}
      {comparison && (
        <MotivationalInsightCard
          comparison={comparison}
          currentPosition={currentPosition}
        />
      )}

      {/* Overview Section */}
      <PositionOverviewCard position={currentPosition} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <Users className="h-4 w-4 mr-2" />
            Peer Comparison
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Award className="h-4 w-4 mr-2" />
            Achievements
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {/* Historical Trend Chart */}
          {history && history.length > 0 && (
            <PositionTrendChart
              history={history}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Scholarship Access Changes */}
            {comparison && (
              <ScholarshipAccessCard comparison={comparison} />
            )}

            {/* Funding Projections */}
            {projectedFunding && (
              <FundingProjectionCard projections={projectedFunding} />
            )}
          </div>
        </TabsContent>

        {/* Peer Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          {peerBenchmark ? (
            <PeerBenchmarkCard
              benchmark={peerBenchmark}
              currentPosition={currentPosition}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Peer Data Available</h3>
                <p className="text-muted-foreground">
                  We couldn't find enough students with similar profiles for comparison.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          {achievements && (
            <AchievementBadgesGrid
              unlocked={achievements.unlocked}
              locked={achievements.locked}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
