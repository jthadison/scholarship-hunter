/**
 * MetricCard Component
 *
 * Displays individual KPI metric in a card format:
 * - Icon and label
 * - Large numeric value
 * - Color coding by metric type
 * - Formatted values (currency, percentages)
 *
 * Story: 5.2 - Analytics Dashboard - Success Metrics (AC #1)
 * @module components/analytics/MetricCard
 */

import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export interface MetricCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  colorScheme?: 'green' | 'blue' | 'yellow' | 'purple' | 'orange' | 'red'
  format?: 'number' | 'currency' | 'percentage'
  suffix?: string
}

const colorClasses = {
  green: {
    border: 'border-green-200',
    bg: 'bg-green-50',
    icon: 'text-green-600',
    text: 'text-green-700',
  },
  blue: {
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    text: 'text-blue-700',
  },
  yellow: {
    border: 'border-yellow-200',
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    text: 'text-yellow-700',
  },
  purple: {
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    text: 'text-purple-700',
  },
  orange: {
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    text: 'text-orange-700',
  },
  red: {
    border: 'border-red-200',
    bg: 'bg-red-50',
    icon: 'text-red-600',
    text: 'text-red-700',
  },
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  colorScheme = 'blue',
  format = 'number',
  suffix,
}: MetricCardProps) {
  const colors = colorClasses[colorScheme]

  // Format value based on type
  const formatValue = (): string => {
    if (typeof value === 'string') {
      return value
    }

    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`
      case 'percentage':
        return `${Math.round(value)}%`
      case 'number':
      default:
        return value.toLocaleString()
    }
  }

  const formattedValue = formatValue()

  return (
    <Card className={`${colors.border} ${colors.bg}`}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${colors.icon}`} />
            <span className={`text-xs font-medium ${colors.text}`}>{label}</span>
          </div>
          <p className={`text-2xl font-bold ${colors.text}`}>
            {formattedValue}
            {suffix && <span className="text-base ml-1">{suffix}</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
