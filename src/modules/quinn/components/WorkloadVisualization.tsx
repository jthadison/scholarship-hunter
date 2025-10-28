/**
 * Workload Visualization Component (Story 3.6 - Task 3)
 *
 * Displays total estimated hours scheduled for current week with breakdown by application.
 * Uses horizontal bar chart and provides workload status indicators.
 *
 * Acceptance Criteria #2:
 * Workload visualization displays total estimated hours scheduled for current week with
 * breakdown by application: "12 hours of work scheduled this week: App A (4h), App B (5h), App C (3h)"
 *
 * Workload Thresholds:
 * - LIGHT (<10h): Green - "You have capacity"
 * - MODERATE (10-15h): Yellow - "Stay focused"
 * - HEAVY (15-20h): Orange - "Prioritize ruthlessly"
 * - OVERLOAD (>20h): Red - "Defer applications"
 *
 * @component
 */

'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type WorkloadStatus = 'LIGHT' | 'MODERATE' | 'HEAVY' | 'OVERLOAD'
type PriorityTier = 'MUST_APPLY' | 'SHOULD_APPLY' | 'IF_TIME_PERMITS' | 'HIGH_VALUE_REACH'

interface ApplicationBreakdown {
  applicationId: string
  scholarshipName: string
  hours: number
  priorityTier: PriorityTier | null
}

interface WorkloadVisualizationProps {
  totalHours: number
  breakdown: ApplicationBreakdown[]
  status: WorkloadStatus
  message: string
}

/**
 * Get status icon and color scheme
 */
function getStatusConfig(status: WorkloadStatus) {
  const configs = {
    LIGHT: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      barColor: '#10b981', // green-500
    },
    MODERATE: {
      icon: Clock,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      barColor: '#f59e0b', // yellow-500
    },
    HEAVY: {
      icon: AlertTriangle,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      barColor: '#f97316', // orange-500
    },
    OVERLOAD: {
      icon: XCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      barColor: '#ef4444', // red-500
    },
  }
  return configs[status]
}

/**
 * Get priority tier color for bar chart
 */
function getTierColor(tier: PriorityTier | null): string {
  const colors = {
    MUST_APPLY: '#10b981', // green-500
    SHOULD_APPLY: '#3b82f6', // blue-500
    IF_TIME_PERMITS: '#f59e0b', // yellow-500
    HIGH_VALUE_REACH: '#f97316', // orange-500
  }
  return tier ? colors[tier] : '#9ca3af' // gray-400 fallback
}

export function WorkloadVisualization({
  totalHours,
  breakdown,
  status,
  message,
}: WorkloadVisualizationProps) {
  const config = getStatusConfig(status)
  const Icon = config.icon

  // Prepare data for chart (truncate scholarship names)
  const chartData = breakdown.map((item) => ({
    name: item.scholarshipName.length > 20
      ? item.scholarshipName.substring(0, 20) + '...'
      : item.scholarshipName,
    hours: item.hours,
    fullName: item.scholarshipName,
    tier: item.priorityTier,
  }))

  // Show simplified view if only one application
  if (breakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-600" />
            Weekly Workload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              No work scheduled this week - you have full capacity!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyan-600" />
          Weekly Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Hours Display */}
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-gray-900 mb-1">{totalHours}h</div>
          <div className="text-sm text-gray-600">scheduled this week</div>
        </div>

        {/* Status Alert */}
        <Alert className={`${config.bgColor} ${config.borderColor}`}>
          <Icon className={`h-4 w-4 ${config.iconColor}`} />
          <AlertDescription className={config.textColor}>{message}</AlertDescription>
        </Alert>

        {/* Breakdown Chart */}
        {breakdown.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Breakdown by Application</h4>

            {/* Bar Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30 }}>
                  <XAxis type="number" unit="h" />
                  <YAxis type="category" dataKey="name" width={150} fontSize={12} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                            <p className="font-medium text-sm">{data.fullName}</p>
                            <p className="text-sm text-gray-600">
                              {data.hours} hours
                            </p>
                            {data.tier && (
                              <p className="text-xs text-gray-500 mt-1">
                                {data.tier.replace(/_/g, ' ')}
                              </p>
                            )}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getTierColor(entry.tier)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Textual Breakdown */}
            <div className="mt-4 space-y-2">
              {breakdown.map((app) => (
                <div key={app.applicationId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: getTierColor(app.priorityTier) }}
                    />
                    <span className="text-gray-700 truncate">{app.scholarshipName}</span>
                  </div>
                  <span className="font-medium text-gray-900">{app.hours}h</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="pt-3 border-t">
          <p className="text-xs text-gray-500 mb-2">Priority Tier Colors:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-gray-600">Must Apply</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-gray-600">Should Apply</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-gray-600">If Time Permits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-gray-600">High Value Reach</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
