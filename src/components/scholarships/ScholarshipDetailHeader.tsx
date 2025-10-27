/**
 * ScholarshipDetailHeader Component
 *
 * Displays scholarship name, provider, award amount, deadline, and CTAs.
 * Includes priority tier badge and countdown to deadline.
 *
 * @component
 */

'use client'

import { format, differenceInDays } from 'date-fns'
import { ExternalLink, Plus, Building2, Calendar, DollarSign, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface ScholarshipDetailHeaderProps {
  scholarship: {
    name: string
    provider: string
    awardAmount: number
    awardAmountMax?: number | null
    numberOfAwards: number
    deadline: Date | string
    website?: string | null
    matches?: Array<{
      priorityTier: string
    }>
  }
  onAddToApplications: () => void
  onViewWebsite: () => void
  isAdded: boolean
  isLoading?: boolean
}

const priorityTierConfig: Record<
  string,
  { label: string; className: string; description: string }
> = {
  MUST_APPLY: {
    label: 'Must Apply',
    className: 'bg-green-100 text-green-800 border-green-300',
    description: 'High match, high value - apply immediately',
  },
  SHOULD_APPLY: {
    label: 'Should Apply',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Strong match, good value',
  },
  IF_TIME_PERMITS: {
    label: 'If Time Permits',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    description: 'Good match, apply if time allows',
  },
  HIGH_VALUE_REACH: {
    label: 'High Value Reach',
    className: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Stretch goal, high reward',
  },
}

export function ScholarshipDetailHeader({
  scholarship,
  onAddToApplications,
  onViewWebsite,
  isAdded,
  isLoading = false,
}: ScholarshipDetailHeaderProps) {
  const deadline =
    typeof scholarship.deadline === 'string'
      ? new Date(scholarship.deadline)
      : scholarship.deadline

  const daysUntilDeadline = differenceInDays(deadline, new Date())
  const isUrgent = daysUntilDeadline <= 14

  const priorityTier = scholarship.matches?.[0]?.priorityTier
  const tierConfig = priorityTier ? priorityTierConfig[priorityTier] : null

  const formatAwardAmount = () => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })

    if (scholarship.awardAmountMax && scholarship.awardAmountMax !== scholarship.awardAmount) {
      return `${formatter.format(scholarship.awardAmount)} - ${formatter.format(scholarship.awardAmountMax)}`
    }

    return formatter.format(scholarship.awardAmount)
  }

  return (
    <Card className="p-6 md:p-8">
      <div className="space-y-6">
        {/* Title and Provider */}
        <div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 break-words">
                {scholarship.name}
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <Building2 className="h-5 w-5 flex-shrink-0" />
                <span className="text-lg">{scholarship.provider}</span>
              </div>
            </div>

            {/* Priority Tier Badge */}
            {tierConfig && (
              <div className="flex-shrink-0">
                <Badge
                  variant="outline"
                  className={`${tierConfig.className} px-3 py-1 text-sm font-medium border`}
                  title={tierConfig.description}
                >
                  {tierConfig.label}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
          {/* Award Amount */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Award Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatAwardAmount()}</p>
            </div>
          </div>

          {/* Number of Awards */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Award className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Awards Available</p>
              <p className="text-2xl font-bold text-gray-900">
                {scholarship.numberOfAwards} {scholarship.numberOfAwards === 1 ? 'award' : 'awards'}
              </p>
            </div>
          </div>

          {/* Deadline */}
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isUrgent ? 'bg-red-50' : 'bg-orange-50'}`}>
              <Calendar className={`h-6 w-6 ${isUrgent ? 'text-red-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Application Deadline</p>
              <p className="text-lg font-semibold text-gray-900">{format(deadline, 'MMM d, yyyy')}</p>
              <p
                className={`text-sm font-medium ${isUrgent ? 'text-red-600' : 'text-orange-600'}`}
              >
                {daysUntilDeadline > 0
                  ? `Due in ${daysUntilDeadline} ${daysUntilDeadline === 1 ? 'day' : 'days'}`
                  : daysUntilDeadline === 0
                    ? 'Due today!'
                    : 'Deadline passed'}
              </p>
            </div>
          </div>
        </div>

        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            onClick={onAddToApplications}
            disabled={isAdded || isLoading || daysUntilDeadline < 0}
            size="lg"
            className="flex-1 sm:flex-none"
          >
            {isAdded ? (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Already in Applications
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Add to My Applications
              </>
            )}
          </Button>

          {scholarship.website && (
            <Button
              onClick={onViewWebsite}
              variant="outline"
              size="lg"
              className="flex-1 sm:flex-none"
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              View Provider Website
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
