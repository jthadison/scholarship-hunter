/**
 * ROICard Component
 *
 * Displays Return on Investment (ROI) analysis:
 * - Time invested (hours) based on:
 *   - Essays written × 3 hours
 *   - Applications submitted × 1 hour
 *   - Documents uploaded × 0.5 hours
 * - Funding secured (total dollars)
 * - Hourly rate calculation (dollars per hour)
 * - Visual comparison bar chart
 * - Disclaimer about estimates
 *
 * Story: 5.2 - Analytics Dashboard - Success Metrics (AC #4)
 * @module components/analytics/ROICard
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Clock, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'

export interface ROIData {
  timeInvested: number // hours
  fundingSecured: number // dollars
  hourlyRate: number // dollars per hour
  essaysWritten: number
  applicationsSubmitted: number
  documentsUploaded: number
}

export interface ROICardProps {
  data: ROIData
}

export function ROICard({ data }: ROICardProps) {
  const { timeInvested, fundingSecured, hourlyRate, essaysWritten, applicationsSubmitted } = data

  const hasData = fundingSecured > 0 && timeInvested > 0

  // Prepare comparison data for bar chart
  const chartData = [
    {
      name: 'Time Invested',
      value: timeInvested,
      label: `${timeInvested.toFixed(1)} hrs`,
      color: '#3b82f6', // blue
    },
    {
      name: 'Hourly Rate',
      value: hourlyRate,
      label: `$${hourlyRate.toFixed(0)}/hr`,
      color: '#22c55e', // green
    },
  ]

  // Calculate comparison to minimum wage ($15/hr as baseline)
  const minimumWage = 15
  const rateMultiplier = hourlyRate > 0 ? hourlyRate / minimumWage : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Return on Investment (ROI)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              {/* Time Invested */}
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-700">Time Invested</p>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {timeInvested.toFixed(1)} hrs
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {essaysWritten} essays + {applicationsSubmitted} apps
                </p>
              </div>

              {/* Funding Secured */}
              <div className="rounded-md border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-700">Funding Secured</p>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  ${fundingSecured.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">Total awards received</p>
              </div>
            </div>

            {/* Hourly Rate Highlight */}
            <div className="rounded-lg border-2 border-green-300 bg-green-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Effective Hourly Rate</p>
                  <p className="text-3xl font-bold text-green-700">
                    ${hourlyRate.toFixed(0)}/hour
                  </p>
                  {rateMultiplier >= 1 && (
                    <p className="text-sm text-green-600 mt-1">
                      {rateMultiplier.toFixed(1)}x minimum wage ($15/hr)
                    </p>
                  )}
                </div>
                <TrendingUp className="h-10 w-10 text-green-600" />
              </div>
            </div>

            {/* Visual Comparison */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Time vs. Rate Comparison</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                  <Bar dataKey="value" radius={4}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Breakdown */}
            <div className="rounded-md border border-muted bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Time Estimate Breakdown:
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• {essaysWritten} essays × 3 hrs = {essaysWritten * 3} hrs</p>
                <p>
                  • {applicationsSubmitted} applications × 1 hr ={' '}
                  {applicationsSubmitted * 1} hrs
                </p>
                <p>
                  • {data.documentsUploaded} documents × 0.5 hrs ={' '}
                  {data.documentsUploaded * 0.5} hrs
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-xs text-yellow-700">
                <span className="font-medium">Note:</span> Estimates based on average times;
                actual time may vary. This analysis measures financial efficiency, not the full
                value of education and opportunity.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              ROI data will appear once you receive scholarship awards
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
