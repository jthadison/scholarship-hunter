'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, TrendingUp, Award, Users, BookOpen, Briefcase, Edit, History } from 'lucide-react'
import { trpc } from '@/shared/lib/trpc'
import { useState } from 'react'

/**
 * Story 1.7: Profile Strength Display Component
 * Shows overall strength score with dimensional breakdown and methodology explanation
 */
export function ProfileStrengthCard() {
  const { data: breakdown, isLoading, error } = trpc.profile.getStrengthBreakdown.useQuery()
  const { data: profile } = trpc.profile.get.useQuery()
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Strength</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Strength</CardTitle>
          <CardDescription>Unable to load strength score. Please try again.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!breakdown) {
    return null
  }

  const { overallScore, academic, experience, leadership, demographics } = breakdown
  const completeness = profile?.completionPercentage || 0

  // Color coding: 0-50 red, 51-75 yellow, 76-100 green
  const getScoreColor = (score: number) => {
    if (score <= 50) return 'text-red-600'
    if (score <= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score <= 50) return 'bg-red-600'
    if (score <= 75) return 'bg-yellow-600'
    return 'bg-green-600'
  }

  const getScoreLabel = (score: number) => {
    if (score <= 50) return 'Needs Improvement'
    if (score <= 75) return 'Good'
    return 'Excellent'
  }

  // Calculate potential score at 100% completion
  const potentialScore = completeness > 0 && completeness < 100
    ? Math.round((overallScore / completeness) * 100)
    : overallScore

  const dimensionIcons = {
    academic: BookOpen,
    experience: Briefcase,
    leadership: Award,
    demographics: Users,
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Profile Strength Score
            </CardTitle>
            <CardDescription>
              Your competitive positioning for scholarships
            </CardDescription>
          </div>
          <Badge variant={overallScore > 75 ? 'default' : overallScore > 50 ? 'secondary' : 'destructive'}>
            {getScoreLabel(overallScore)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Score Display */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </span>
            <span className="text-2xl text-muted-foreground">/100</span>
          </div>
          <Progress
            value={overallScore}
            className="h-3"
            indicatorClassName={getScoreBgColor(overallScore)}
          />
          <p className="text-sm text-muted-foreground">
            Overall strength score
          </p>
        </div>

        {/* Completeness Impact */}
        {completeness < 100 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              Completion penalty: -{100 - overallScore} points ({Math.round(completeness)}% complete)
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Potential at 100% complete: <span className="font-semibold">{potentialScore}/100</span>
            </p>
          </div>
        )}

        {/* Dimensional Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Score Breakdown</h4>

          {/* Academic */}
          <DimensionScore
            label="Academic"
            score={academic}
            weight={35}
            icon={dimensionIcons.academic}
          />

          {/* Experience */}
          <DimensionScore
            label="Experience"
            score={experience}
            weight={25}
            icon={dimensionIcons.experience}
          />

          {/* Leadership */}
          <DimensionScore
            label="Leadership"
            score={leadership}
            weight={25}
            icon={dimensionIcons.leadership}
          />

          {/* Demographics */}
          <DimensionScore
            label="Demographics"
            score={demographics}
            weight={15}
            icon={dimensionIcons.demographics}
          />
        </div>

        {/* How is this calculated? */}
        <Collapsible open={isMethodologyOpen} onOpenChange={setIsMethodologyOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 text-sm font-medium hover:bg-accent">
            <span>How is this calculated?</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isMethodologyOpen ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
              <p className="font-medium">Scoring Methodology:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <span className="font-medium">Academic (35%):</span> GPA, test scores, class rank, awards</li>
                <li>• <span className="font-medium">Experience (25%):</span> Extracurriculars, volunteer hours, work history</li>
                <li>• <span className="font-medium">Leadership (25%):</span> Leadership roles in activities and organizations</li>
                <li>• <span className="font-medium">Demographics (15%):</span> First-generation, financial need, military, disabilities</li>
              </ul>
              <p className="text-muted-foreground pt-2">
                Your overall score is the weighted average of these dimensions, multiplied by your profile completeness percentage.
                This helps scholarships understand your competitive positioning.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="pt-4 space-y-2">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/profile/edit">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile to Improve Score
            </Link>
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/profile/history">
              <History className="h-4 w-4 mr-2" />
              View Profile History
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Individual dimension score display with progress bar
 */
interface DimensionScoreProps {
  label: string
  score: number
  weight: number
  icon: React.ComponentType<{ className?: string }>
}

function DimensionScore({ label, score, weight, icon: Icon }: DimensionScoreProps) {
  const getScoreColor = (score: number) => {
    if (score <= 50) return 'bg-red-600'
    if (score <= 75) return 'bg-yellow-600'
    return 'bg-green-600'
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">({weight}% weight)</span>
        </div>
        <span className="font-semibold">{score}/100</span>
      </div>
      <Progress
        value={score}
        className="h-2"
        indicatorClassName={getScoreColor(score)}
      />
    </div>
  )
}
