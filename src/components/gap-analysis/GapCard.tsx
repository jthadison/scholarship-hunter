/**
 * GapCard Component
 *
 * Displays individual gap with icon, description, impact, and achievability badge.
 * Shows current vs target value and provides visual feedback for gap severity.
 *
 * Story: 5.3 - Gap Analysis (AC #2, #3, #6)
 * @module components/gap-analysis/GapCard
 */

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Gap } from '@/lib/gap-analysis/types'
import {
  TrendingUp,
  Users,
  BookOpen,
  Briefcase,
  DollarSign,
  Star,
} from 'lucide-react'

export interface GapCardProps {
  gap: Gap
}

const categoryIcons = {
  academic: TrendingUp,
  demographic: Users,
  major: BookOpen,
  experience: Briefcase,
  financial: DollarSign,
  special: Star,
}

const achievabilityColors = {
  EASY: {
    badge: 'bg-green-100 text-green-700 border-green-300',
    label: 'Easy',
    description: '1-3 months',
  },
  MODERATE: {
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    label: 'Moderate',
    description: '3-6 months',
  },
  LONG_TERM: {
    badge: 'bg-orange-100 text-orange-700 border-orange-300',
    label: 'Long-term',
    description: '6-12+ months',
  },
}

export function GapCard({ gap }: GapCardProps) {
  const Icon = categoryIcons[gap.category] || Star
  const achievability = achievabilityColors[gap.achievability]

  const formatValue = (value: string | number | boolean | null) => {
    if (value === null) return 'None'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    return String(value)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Header: Icon, Requirement, Achievability */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <h3 className="font-semibold text-gray-900">{gap.requirement}</h3>
            </div>
            <Badge
              variant="outline"
              className={achievability.badge}
              aria-label={`${achievability.label} to achieve (${achievability.description})`}
            >
              {achievability.label}
            </Badge>
          </div>

          {/* Current vs Target */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Current:</span>
            <span className="font-medium text-gray-900">
              {formatValue(gap.currentValue)}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-gray-600">Target:</span>
            <span className="font-medium text-blue-600">
              {formatValue(gap.targetValue)}
            </span>
          </div>

          {/* Impact */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-700">{gap.impact}</p>
            <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
              <span>{gap.scholarshipsAffected} scholarship{gap.scholarshipsAffected !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{gap.timelineMonths} month{gap.timelineMonths !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
