/**
 * OutcomesPieChart Component
 *
 * Pie chart showing distribution of outcomes:
 * - Awarded (green)
 * - Denied (red)
 * - Pending (yellow)
 * - Waitlisted/Withdrawn (gray)
 * - Percentages displayed
 * - Color-blind friendly palette
 *
 * Story: 5.2 - Analytics Dashboard - Success Metrics (AC #5)
 * @module components/analytics/OutcomesPieChart
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { PieChartIcon } from 'lucide-react'

export interface OutcomeDistribution {
  awarded: number
  denied: number
  waitlisted: number
  withdrawn: number
  pending: number
}

export interface OutcomesPieChartProps {
  data: OutcomeDistribution
}

const COLORS = {
  awarded: '#22c55e', // green
  denied: '#ef4444', // red
  pending: '#eab308', // yellow
  waitlisted: '#f97316', // orange
  withdrawn: '#6b7280', // gray
}

export function OutcomesPieChart({ data }: OutcomesPieChartProps) {
  // Prepare data for pie chart (filter out zeros)
  const chartData = [
    { name: 'Awarded', value: data.awarded, color: COLORS.awarded },
    { name: 'Denied', value: data.denied, color: COLORS.denied },
    { name: 'Pending', value: data.pending, color: COLORS.pending },
    { name: 'Waitlisted', value: data.waitlisted, color: COLORS.waitlisted },
    { name: 'Withdrawn', value: data.withdrawn, color: COLORS.withdrawn },
  ].filter((item) => item.value > 0)

  const hasData = chartData.length > 0
  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-blue-600" />
          Outcome Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const value = Number(props.value || 0)
                    const percentage = ((value / total) * 100).toFixed(0)
                    return `${String(props.name || '')} (${percentage}%)`
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} (${((value / total) * 100).toFixed(1)}%)`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => {
                    const item = chartData.find((d) => d.name === value)
                    if (!item) return value
                    const percentage = ((item.value / total) * 100).toFixed(0)
                    return `${value}: ${item.value} (${percentage}%)`
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Summary Stats */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-md border border-green-200 bg-green-50 p-3">
                <p className="font-medium text-green-700">Success Rate</p>
                <p className="text-2xl font-bold text-green-700">
                  {total > 0
                    ? ((data.awarded / (data.awarded + data.denied)) * 100).toFixed(0)
                    : 0}
                  %
                </p>
              </div>
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                <p className="font-medium text-blue-700">Total Outcomes</p>
                <p className="text-2xl font-bold text-blue-700">{total}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-muted-foreground">
              No outcome data yet - submit applications to see distribution
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
