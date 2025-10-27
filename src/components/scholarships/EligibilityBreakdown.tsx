/**
 * EligibilityBreakdown Component
 *
 * Displays student's eligibility status for each scholarship criterion.
 * Shows met (✓), not met (✗), and partially met (~) indicators with details.
 *
 * @component
 */

'use client'

import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export type EligibilityStatus = 'met' | 'not_met' | 'partially_met'

export interface EligibilityItem {
  category: string
  requirement: string
  studentValue: string
  status: EligibilityStatus
  partialPercentage?: number
}

interface EligibilityBreakdownProps {
  eligibilityResults: EligibilityItem[]
}

const statusConfig: Record<
  EligibilityStatus,
  { icon: typeof CheckCircle2; color: string; bgColor: string; label: string }
> = {
  met: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Met',
  },
  not_met: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Not Met',
  },
  partially_met: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    label: 'Partially Met',
  },
}

export function EligibilityBreakdown({ eligibilityResults }: EligibilityBreakdownProps) {
  // Group criteria by category
  const groupedCriteria = eligibilityResults.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category]!.push(item)
      return acc
    },
    {} as Record<string, EligibilityItem[]>
  )

  // Calculate summary statistics
  const totalCriteria = eligibilityResults.length
  const metCount = eligibilityResults.filter((r) => r.status === 'met').length
  const partialCount = eligibilityResults.filter((r) => r.status === 'partially_met').length
  const notMetCount = eligibilityResults.filter((r) => r.status === 'not_met').length

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Eligibility Breakdown</h2>
          <p className="text-sm text-gray-600">
            Compare your profile against scholarship requirements
          </p>
        </div>

        {/* Summary Stats */}
        <div className="flex gap-4 flex-wrap p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              {metCount} Met
            </span>
          </div>
          {partialCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-700">
                {partialCount} Partially Met
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-gray-700">
              {notMetCount} Not Met
            </span>
          </div>
          <div className="ml-auto text-sm text-gray-600">
            Total: {totalCriteria} criteria
          </div>
        </div>

        {/* Grouped Criteria */}
        <div className="space-y-4">
          {Object.entries(groupedCriteria).map(([category, items]) => (
            <CategorySection key={category} category={category} items={items} />
          ))}
        </div>

        {/* Missing Requirements Highlight */}
        {notMetCount > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-semibold text-red-900 mb-2">
              Missing Requirements ({notMetCount})
            </h4>
            <ul className="space-y-1">
              {eligibilityResults
                .filter((r) => r.status === 'not_met')
                .map((item, idx) => (
                  <li key={idx} className="text-sm text-red-800">
                    • {item.requirement}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  )
}

function CategorySection({ category, items }: { category: string; items: EligibilityItem[] }) {
  const [isOpen, setIsOpen] = useState(true)

  const categoryMetCount = items.filter((i) => i.status === 'met').length
  const categoryTotal = items.length

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-900">{category} Requirements</h3>
            <Badge variant="outline" className="text-xs">
              {categoryMetCount}/{categoryTotal} met
            </Badge>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 space-y-2 pl-3">
          {items.map((item, idx) => {
            const config = statusConfig[item.status]
            const Icon = config.icon

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border ${config.bgColor} border-${config.color.replace('text-', '')}-200`}
              >
                <Icon className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.requirement}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{item.studentValue}</p>
                  {item.status === 'partially_met' && item.partialPercentage !== undefined && (
                    <p className="text-xs text-yellow-700 mt-1">
                      {Math.round(item.partialPercentage)}% of requirement met
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`${config.color} border-current text-xs flex-shrink-0`}
                >
                  {config.label}
                </Badge>
              </div>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
