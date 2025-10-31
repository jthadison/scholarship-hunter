/**
 * ApplicationsTrendChart Component
 *
 * Line graph showing applications submitted per month:
 * - Application count on Y-axis
 * - Months on X-axis
 * - Helps track application velocity
 * - Identifies productive periods
 *
 * Story: 5.2 - Analytics Dashboard - Success Metrics (AC #2, #5)
 * @module components/analytics/ApplicationsTrendChart
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
import { FileText } from 'lucide-react'

export interface ApplicationsTrendData {
  month: string
  count: number
}

export interface ApplicationsTrendChartProps {
  data: ApplicationsTrendData[]
}

export function ApplicationsTrendChart({ data }: ApplicationsTrendChartProps) {
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

  const hasData = data.some((item) => item.count > 0)
  const totalApplications = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Applications Trend
          </div>
          {hasData && (
            <span className="text-base font-normal text-muted-foreground">
              Total: <span className="font-bold text-blue-600">{totalApplications}</span>
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
                dataKey="displayMonth"
                angle={-45}
                textAnchor="end"
                height={80}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip
                formatter={(value: number) => [`${value}`, 'Applications']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-muted-foreground">
              No applications yet - start applying to see your activity trend
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
