'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Lightbulb,
  TrendingUp,
  ChevronDown,
  BookOpen,
  Briefcase,
  Award,
  Users,
  ArrowRight,
} from 'lucide-react'
import { trpc } from '@/shared/lib/trpc'
import { useState } from 'react'
import type { Recommendation } from '@/modules/profile/types'
import Link from 'next/link'

/**
 * Story 1.7: Improvement Recommendations Component
 * Shows prioritized recommendations with impact estimates and quick action links
 */
export function StrengthRecommendations() {
  const { data: breakdown, isLoading, error } = trpc.profile.getStrengthBreakdown.useQuery()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Improvement Recommendations</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Improvement Recommendations</CardTitle>
          <CardDescription>Unable to load recommendations. Please try again.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!breakdown || breakdown.recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Improvement Recommendations
          </CardTitle>
          <CardDescription>
            Your profile is looking great! No major improvements needed right now.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { recommendations, overallScore } = breakdown

  // Group by priority
  const highImpact = recommendations.filter((r) => r.priority === 1)
  const mediumImpact = recommendations.filter((r) => r.priority === 2)
  const lowImpact = recommendations.filter((r) => r.priority === 3)

  // Calculate potential score if all high-impact recommendations are followed
  const totalPotentialGain = recommendations.reduce((sum, r) => sum + r.impact, 0)
  const potentialScore = Math.min(overallScore + totalPotentialGain, 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Improvement Recommendations
        </CardTitle>
        <CardDescription>
          Actionable steps to boost your profile strength score
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Impact Visualization */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Your potential score:
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Follow these recommendations to improve
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {overallScore}
              </span>
              <ArrowRight className="h-5 w-5 text-blue-700 dark:text-blue-300" />
              <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {potentialScore}
              </span>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                (+{totalPotentialGain} pts)
              </span>
            </div>
          </div>
        </div>

        {/* High Impact Recommendations */}
        {highImpact.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-600" />
              <h4 className="text-sm font-semibold">High Impact</h4>
              <Badge variant="destructive" className="text-xs">
                {highImpact.length} action{highImpact.length > 1 ? 's' : ''}
              </Badge>
            </div>
            {highImpact.map((rec, idx) => (
              <RecommendationCard key={idx} recommendation={rec} />
            ))}
          </div>
        )}

        {/* Medium Impact Recommendations */}
        {mediumImpact.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-yellow-600" />
              <h4 className="text-sm font-semibold">Medium Impact</h4>
              <Badge variant="secondary" className="text-xs">
                {mediumImpact.length} action{mediumImpact.length > 1 ? 's' : ''}
              </Badge>
            </div>
            {mediumImpact.map((rec, idx) => (
              <RecommendationCard key={idx} recommendation={rec} />
            ))}
          </div>
        )}

        {/* Low Impact Recommendations */}
        {lowImpact.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h4 className="text-sm font-semibold">Low Impact</h4>
              <Badge variant="outline" className="text-xs">
                {lowImpact.length} action{lowImpact.length > 1 ? 's' : ''}
              </Badge>
            </div>
            {lowImpact.map((rec, idx) => (
              <RecommendationCard key={idx} recommendation={rec} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Individual recommendation card with expandable details
 */
interface RecommendationCardProps {
  recommendation: Recommendation
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { category, message, impact, actionLink } = recommendation

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Academic':
        return BookOpen
      case 'Experience':
        return Briefcase
      case 'Leadership':
        return Award
      case 'Demographics':
        return Users
      default:
        return Lightbulb
    }
  }

  const Icon = getCategoryIcon(category)

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'text-red-600 dark:text-red-400'
      case 2:
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-green-600 dark:text-green-400'
    }
  }

  const getDetailedGuidance = (category: string) => {
    switch (category) {
      case 'Academic':
        return 'Focus on maintaining a strong GPA, preparing for standardized tests, and seeking academic recognition opportunities. Consider joining academic clubs or competitions in your field of interest.'
      case 'Experience':
        return 'Look for volunteer opportunities in your community, join extracurricular activities that align with your interests, or seek part-time work experience. Quality matters more than quantity - focus on meaningful involvement.'
      case 'Leadership':
        return 'Seek officer positions in clubs you\'re already part of, start a new club or initiative, or take on leadership roles in community projects. Leadership can be demonstrated in many ways - from team captain to club president to project coordinator.'
      case 'Demographics':
        return 'Ensure your profile accurately reflects your background and circumstances. Many scholarships specifically target students from underrepresented groups or those facing financial challenges.'
      default:
        return 'Complete all sections of your profile for the best matching results.'
    }
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Icon className={`h-5 w-5 mt-0.5 ${getPriorityColor(recommendation.priority)}`} />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {category}
                </Badge>
                {impact > 0 && (
                  <span className="text-xs font-medium text-muted-foreground">
                    +{impact} pts
                  </span>
                )}
              </div>
              <p className="text-sm font-medium">{message}</p>
            </div>
          </div>
          {actionLink && (
            <Button size="sm" variant="outline" asChild>
              <Link href={actionLink}>
                Update
              </Link>
            </Button>
          )}
        </div>

        {/* Collapsible detailed guidance */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-3">
          <CollapsibleTrigger className="flex w-full items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ChevronDown
              className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
            <span>Show details</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <p className="text-xs text-muted-foreground">
              {getDetailedGuidance(category)}
            </p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
