'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'
import { trpc } from '@/shared/lib/trpc'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { useState } from 'react'

/**
 * Story 1.7: Strength History Chart Component
 * Visualizes profile strength progression over time with dimensional trends
 */
export function StrengthHistoryChart() {
  const { data: history, isLoading } = trpc.profile.getStrengthHistory.useQuery()
  const [showDimensions, setShowDimensions] = useState(false)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strength Progress</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Strength Progress
          </CardTitle>
          <CardDescription>Track your profile improvement over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No history yet. Update your profile to see progress over time.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transform data for recharts (reverse to show oldest first)
  const chartData = [...history]
    .reverse()
    .map((snapshot) => ({
      date: format(new Date(snapshot.recordedAt), 'MMM d'),
      overall: snapshot.overallScore,
      academic: snapshot.academicScore,
      experience: snapshot.experienceScore,
      leadership: snapshot.leadershipScore,
      demographics: snapshot.demographicsScore,
    }))

  // Calculate statistics
  const firstScore = history[history.length - 1]?.overallScore || 0
  const latestScore = history[0]?.overallScore || 0
  const scoreChange = latestScore - firstScore
  const percentChange = firstScore > 0 ? Math.round((scoreChange / firstScore) * 100) : 0

  // Find biggest improvement dimension
  const dimensionChanges = {
    academic: (history[0]?.academicScore || 0) - (history[history.length - 1]?.academicScore || 0),
    experience: (history[0]?.experienceScore || 0) - (history[history.length - 1]?.experienceScore || 0),
    leadership: (history[0]?.leadershipScore || 0) - (history[history.length - 1]?.leadershipScore || 0),
    demographics:
      (history[0]?.demographicsScore || 0) - (history[history.length - 1]?.demographicsScore || 0),
  }

  const biggestImprovement = Object.entries(dimensionChanges).reduce((max, [dim, change]) =>
    change > max.change ? { dimension: dim, change } : max,
    { dimension: '', change: -Infinity }
  )

  const getTrendIcon = () => {
    if (scoreChange > 5) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (scoreChange < -5) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-yellow-600" />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Strength Progress
            </CardTitle>
            <CardDescription>Your profile improvement over the last 30 days</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDimensions(!showDimensions)}
          >
            {showDimensions ? 'Hide' : 'Show'} Dimensions
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Score Change */}
          <div className="rounded-lg border p-4 space-y-1">
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className="text-sm font-medium">Score Change</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {scoreChange > 0 ? '+' : ''}
                {scoreChange}
              </span>
              <span className="text-sm text-muted-foreground">pts</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {percentChange > 0 ? '+' : ''}
              {percentChange}% change
            </p>
          </div>

          {/* Latest Score */}
          <div className="rounded-lg border p-4 space-y-1">
            <span className="text-sm font-medium">Current Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{latestScore}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <Badge variant={latestScore > 75 ? 'default' : latestScore > 50 ? 'secondary' : 'destructive'} className="text-xs">
              {latestScore > 75 ? 'Excellent' : latestScore > 50 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>

          {/* Biggest Improvement */}
          {biggestImprovement.change > 0 && (
            <div className="rounded-lg border p-4 space-y-1">
              <span className="text-sm font-medium">Biggest Improvement</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold capitalize">{biggestImprovement.dimension}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                +{Math.round(biggestImprovement.change)} points
              </p>
            </div>
          )}
        </div>

        {/* Line Chart */}
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                domain={[0, 100]}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />

              {/* Overall score line (always shown) */}
              <Line
                type="monotone"
                dataKey="overall"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                name="Overall"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />

              {/* Dimensional lines (optional) */}
              {showDimensions && (
                <>
                  <Line
                    type="monotone"
                    dataKey="academic"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Academic"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="experience"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Experience"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="leadership"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Leadership"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="demographics"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Demographics"
                    dot={{ r: 3 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Milestones (significant increases >10 points) */}
        {history.length > 1 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Recent Milestones</h4>
            <div className="space-y-2">
              {history.slice(0, 5).map((snapshot, idx) => {
                if (idx === history.length - 1) return null
                const prevSnapshot = history[idx + 1]
                const change = snapshot.overallScore - (prevSnapshot?.overallScore || 0)
                if (Math.abs(change) < 5) return null

                return (
                  <div
                    key={snapshot.id}
                    className="flex items-center justify-between text-sm border-l-2 border-green-600 pl-3 py-1"
                  >
                    <span className="text-muted-foreground">
                      {format(new Date(snapshot.recordedAt), 'MMM d, yyyy')}
                    </span>
                    <Badge variant="secondary">
                      {change > 0 ? '+' : ''}
                      {Math.round(change)} pts
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
