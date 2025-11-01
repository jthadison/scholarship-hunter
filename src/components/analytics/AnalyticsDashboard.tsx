/**
 * AnalyticsDashboard Component
 *
 * Main analytics dashboard displaying comprehensive success metrics:
 * - KPI metric cards (applications, awards, success rate, funding)
 * - Funding goal progress
 * - Data visualization charts (to be added in Task 5)
 * - Tier breakdown analysis (to be added in Task 6)
 * - ROI analysis (to be added in Task 7)
 *
 * Story: 5.2 - Analytics Dashboard - Success Metrics
 * @module components/analytics/AnalyticsDashboard
 */

'use client'

import { trpc } from '@/shared/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Trophy,
  FileText,
  Award,
  TrendingUp,
  DollarSign,
  BarChart3,
} from 'lucide-react'
import { MetricCard } from './MetricCard'
import { GoalProgressCard } from './GoalProgressCard'
import { FundingTrendChart } from './FundingTrendChart'
import { OutcomesPieChart } from './OutcomesPieChart'
import { CumulativeFundingChart } from './CumulativeFundingChart'
import { ApplicationsTrendChart } from './ApplicationsTrendChart'
import { TierSuccessTable } from './TierSuccessTable'
import { ROICard } from './ROICard'
import { ExportButton } from '@/components/exports'

export function AnalyticsDashboard() {

  // Fetch analytics data
  const { data: snapshot, isLoading: snapshotLoading } =
    trpc.analytics.getSnapshot.useQuery()
  const { data: goalProgress, isLoading: goalLoading } =
    trpc.analytics.getGoalProgress.useQuery()
  const { data: trends, isLoading: trendsLoading } = trpc.analytics.getTrends.useQuery({
    timeframe: '90d',
  })
  const { data: outcomeDistribution, isLoading: distributionLoading } =
    trpc.analytics.getOutcomeDistribution.useQuery()
  const { data: tierBreakdown, isLoading: tierLoading } =
    trpc.analytics.getTierBreakdown.useQuery()
  const { data: roiData, isLoading: roiLoading } = trpc.analytics.getROI.useQuery()

  const isLoading =
    snapshotLoading ||
    goalLoading ||
    trendsLoading ||
    distributionLoading ||
    tierLoading ||
    roiLoading

  if (isLoading) {
    return <AnalyticsDashboardSkeleton />
  }

  if (!snapshot) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Unable to load analytics data. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your scholarship success and identify improvement opportunities
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ExportButton />
          <BarChart3 className="h-10 w-10 text-blue-600" />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Applications"
          value={snapshot.totalApplications}
          icon={FileText}
          colorScheme="blue"
          format="number"
        />
        <MetricCard
          label="Awards Received"
          value={snapshot.totalAwarded}
          icon={Trophy}
          colorScheme="green"
          format="number"
        />
        <MetricCard
          label="Success Rate"
          value={snapshot.successRate * 100}
          icon={TrendingUp}
          colorScheme="purple"
          format="percentage"
        />
        <MetricCard
          label="Total Funding Secured"
          value={snapshot.totalFundingSecured}
          icon={DollarSign}
          colorScheme="green"
          format="currency"
        />
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Applications Submitted"
          value={snapshot.totalSubmitted}
          icon={FileText}
          colorScheme="blue"
          format="number"
        />
        <MetricCard
          label="Average Award Amount"
          value={snapshot.averageAwardAmount}
          icon={Award}
          colorScheme="orange"
          format="currency"
        />
        <MetricCard
          label="Pending Decisions"
          value={snapshot.totalPending}
          icon={TrendingUp}
          colorScheme="yellow"
          format="number"
        />
      </div>

      {/* Goal Progress */}
      {goalProgress && (
        <GoalProgressCard
          goal={goalProgress.goal}
          secured={goalProgress.secured}
          percentage={goalProgress.percentage}
        />
      )}

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {trends && <FundingTrendChart data={trends.fundingByMonth} />}
        {outcomeDistribution && <OutcomesPieChart data={outcomeDistribution} />}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {trends && <CumulativeFundingChart data={trends.cumulativeFunding} />}
        {trends && <ApplicationsTrendChart data={trends.applicationsByMonth} />}
      </div>

      {/* Tier Breakdown */}
      {tierBreakdown && <TierSuccessTable data={tierBreakdown} />}

      {/* ROI Analysis */}
      {roiData && <ROICard data={roiData} />}
    </div>
  )
}

function AnalyticsDashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={`metric-${i}`} className="h-24" />
        ))}
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={`secondary-${i}`} className="h-24" />
        ))}
      </div>

      {/* Goal Progress */}
      <Skeleton className="h-48" />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>

      {/* Tables */}
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  )
}
