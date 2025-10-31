/**
 * Motivational Insight Card Component
 *
 * Displays encouraging messages based on recent improvements:
 * - Profile improvement highlights
 * - Specific achievement celebrations
 * - Goal progress encouragement
 *
 * Story 5.5: Competitive Positioning Over Time
 * AC7: Motivational Insights
 *
 * @module components/positioning/MotivationalInsightCard
 */

'use client'

import React, { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, TrendingUp, Award, Target } from 'lucide-react'

interface PositionComparison {
  currentMonth: { matches: number; funding: number; profileStrength: number }
  previousMonth: { matches: number; funding: number; profileStrength: number }
  delta: { matches: number; funding: number; profileStrength: number }
  improvementSources: { gpa: number; volunteer: number; test: number; leadership: number }
}

interface CompetitivePosition {
  profileStrengthScore: number
  percentileRanking: number
  totalMatches: number
  projectedFunding: number
}

interface MotivationalInsightCardProps {
  comparison: PositionComparison
  currentPosition: CompetitivePosition
}

export function MotivationalInsightCard({
  comparison,
  currentPosition,
}: MotivationalInsightCardProps) {
  const insight = useMemo(() => {
    const { delta, improvementSources, previousMonth } = comparison
    const { profileStrengthScore, percentileRanking } = currentPosition

    // Calculate improvement percentage
    const improvementPercentage =
      previousMonth.profileStrength > 0
        ? ((delta.profileStrength / previousMonth.profileStrength) * 100).toFixed(0)
        : '0'

    // Find top improvement source
    const topSource = Object.entries(improvementSources)
      .filter(([_, value]) => value > 0)
      .sort(([_, a], [__, b]) => b - a)[0]

    // Generate insight based on data
    if (delta.profileStrength > 10) {
      return {
        icon: TrendingUp,
        message: `Your profile has improved ${improvementPercentage}% - amazing progress!`,
        highlight: `You've gained ${Math.round(delta.profileStrength)} profile strength points`,
        color: 'from-green-500 to-emerald-600',
      }
    }

    if (topSource && topSource[1] > 5) {
      const sourceName = topSource[0] === 'gpa' ? 'GPA' : topSource[0]
      return {
        icon: Award,
        message: `Your ${sourceName} improvements are paying off!`,
        highlight: `${topSource[1]} new scholarship matches from ${sourceName} gains`,
        color: 'from-blue-500 to-indigo-600',
      }
    }

    if (percentileRanking >= 75) {
      const topPercentage = Math.round(100 - percentileRanking)
      return {
        icon: Sparkles,
        message: `You're in the top ${topPercentage}% of students - outstanding!`,
        highlight: "You're more competitive than most students on the platform",
        color: 'from-purple-500 to-pink-600',
      }
    }

    if (delta.matches > 0) {
      return {
        icon: Target,
        message: `You unlocked ${delta.matches} new scholarship opportunities!`,
        highlight: 'Keep building your profile to unlock even more',
        color: 'from-orange-500 to-red-600',
      }
    }

    // Default encouraging message
    return {
      icon: Sparkles,
      message: 'Keep up the great work on your profile!',
      highlight: `Current strength: ${Math.round(profileStrengthScore)}/100`,
      color: 'from-blue-500 to-cyan-600',
    }
  }, [comparison, currentPosition])

  const Icon = insight.icon

  return (
    <Card className={`bg-gradient-to-r ${insight.color} text-white border-none`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">{insight.message}</h3>
            <p className="text-white/90">{insight.highlight}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
