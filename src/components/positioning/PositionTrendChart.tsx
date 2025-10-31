/**
 * Position Trend Chart Component
 *
 * Displays historical trend of profile strength over time with:
 * - Line chart showing profile strength progression
 * - Milestone markers for key achievements
 * - Trend arrow and percentage change
 * - Time range selector (30d, 90d, 1y, all)
 *
 * Story 5.5: Competitive Positioning Over Time
 * AC2: Historical Trend visualization
 *
 * @module components/positioning/PositionTrendChart
 */

'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface PositionSnapshot {
  snapshotDate: Date
  profileStrengthScore: number
  percentileRanking: number
  totalMatches: number
  projectedFunding: number
}

interface PositionTrendChartProps {
  history: PositionSnapshot[]
  timeRange: '30d' | '90d' | '1y' | 'all'
  onTimeRangeChange: (range: '30d' | '90d' | '1y' | 'all') => void
}

export function PositionTrendChart({
  history,
  timeRange,
  onTimeRangeChange,
}: PositionTrendChartProps) {
  // Calculate trend
  const trend = useMemo(() => {
    if (history.length < 2) return { direction: 'flat', percentage: 0 }

    const oldest = history[0]
    const newest = history[history.length - 1]

    if (!oldest || !newest) return { direction: 'flat', percentage: 0 }

    const change = newest.profileStrengthScore - oldest.profileStrengthScore
    const percentage = oldest.profileStrengthScore > 0
      ? (change / oldest.profileStrengthScore) * 100
      : 0

    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
      percentage: Math.abs(percentage),
      change,
    }
  }, [history])

  // Format data for chart
  const chartData = useMemo(() => {
    return history.map((snapshot) => ({
      date: format(new Date(snapshot.snapshotDate), 'MMM dd'),
      fullDate: snapshot.snapshotDate,
      score: Math.round(snapshot.profileStrengthScore * 10) / 10,
    }))
  }, [history])

  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus
  const trendColor = trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Profile Strength Trend
              <div className={`flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="h-5 w-5" />
                <span className="text-lg font-bold">
                  {trend.percentage.toFixed(1)}%
                </span>
              </div>
            </CardTitle>
            <CardDescription>
              {trend.direction === 'up' && 'Your profile has been improving'}
              {trend.direction === 'down' && 'Your profile strength has decreased'}
              {trend.direction === 'flat' && 'Your profile strength has remained stable'}
            </CardDescription>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            <Button
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeRangeChange('30d')}
            >
              30d
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeRangeChange('90d')}
            >
              90d
            </Button>
            <Button
              variant={timeRange === '1y' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeRangeChange('1y')}
            >
              1y
            </Button>
            <Button
              variant={timeRange === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeRangeChange('all')}
            >
              All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No historical data available for this time range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                domain={[0, 100]}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload[0]) return null

                  const data = payload[0].payload as typeof chartData[0]
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium">
                        {format(new Date(data.fullDate), 'MMMM dd, yyyy')}
                      </p>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {data.score}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Profile Strength
                      </p>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Summary Stats */}
        {chartData.length >= 2 && (
          <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Starting Score</p>
              <p className="text-2xl font-bold">{chartData[0]?.score}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Score</p>
              <p className="text-2xl font-bold">{chartData[chartData.length - 1]?.score}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Change</p>
              <p className={`text-2xl font-bold ${trendColor}`}>
                {trend.direction === 'up' ? '+' : ''}{trend.change?.toFixed(1) ?? '0.0'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
