/**
 * FundingTrendChart Component
 *
 * Bar chart showing funding by month with:
 * - Monthly funding amounts on Y-axis
 * - Months on X-axis
 * - Tooltips on hover
 * - Responsive sizing
 * - Brand color palette
 *
 * Story: 5.2 - Analytics Dashboard - Success Metrics (AC #2, #5)
 * @module components/analytics/FundingTrendChart
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

export interface FundingTrendData {
  month: string
  amount: number
}

export interface FundingTrendChartProps {
  data: FundingTrendData[]
}

export function FundingTrendChart({ data }: FundingTrendChartProps) {
  // Format month for display (YYYY-MM -> Mon YYYY)
  const formattedData = data.map((item) => {
    const parts = item.month.split('-')
    const year = parts[0] || ''
    const month = parts[1] || '01'
    const date = new Date(parseInt(year) || 2024, parseInt(month) - 1)
    const monthName = date.toLocaleString('en-US', { month: 'short' })
    return {
      ...item,
      displayMonth: `${monthName} ${year}`,
    }
  })

  // Check if there's any data
  const hasData = data.some((item) => item.amount > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Funding Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="displayMonth"
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
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Funding']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-muted-foreground">
              No funding data yet - submit applications to see trends
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
