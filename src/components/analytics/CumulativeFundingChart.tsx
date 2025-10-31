/**
 * CumulativeFundingChart Component
 *
 * Line graph showing cumulative funding growth over time:
 * - Running total of funding on Y-axis
 * - Decision dates on X-axis
 * - Smooth line curve
 * - Tooltips showing total at each point
 * - Responsive design
 *
 * Story: 5.2 - Analytics Dashboard - Success Metrics (AC #5)
 * @module components/analytics/CumulativeFundingChart
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

export interface CumulativeFundingData {
  date: string
  total: number
}

export interface CumulativeFundingChartProps {
  data: CumulativeFundingData[]
}

export function CumulativeFundingChart({ data }: CumulativeFundingChartProps) {
  // Format dates for display
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: format(new Date(item.date), 'MMM d, yyyy'),
  }))

  const hasData = data.length > 1 || (data.length === 1 && (data[0]?.total ?? 0) > 0)
  const finalTotal = data.length > 0 ? (data[data.length - 1]?.total ?? 0) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Cumulative Funding Growth
          </div>
          {hasData && (
            <span className="text-base font-normal text-muted-foreground">
              Total: <span className="font-bold text-green-600">${finalTotal.toLocaleString()}</span>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="displayDate"
                angle={-45}
                textAnchor="end"
                height={80}
                className="text-xs"
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                className="text-xs"
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Funding']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-muted-foreground">
              No funding data yet - awards will appear here as you receive them
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
