/**
 * Writing Progress Stats Component
 *
 * Displays writing progress metrics:
 * - Essays drafted this week
 * - Total library size
 * - Average quality score
 *
 * @component
 * Story 4.10: AC6 - Writing progress tracking
 */

'use client'

import { FileText, Library, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface WritingProgressStatsProps {
  weeklyDrafts: number
  librarySize: number
  avgQualityScore: number
}

export function WritingProgressStats({
  weeklyDrafts,
  librarySize,
  avgQualityScore,
}: WritingProgressStatsProps) {
  // Motivational messaging based on progress
  const getMotivationalMessage = () => {
    if (weeklyDrafts >= 3) {
      return "🔥 You're on fire! Keep that momentum going!"
    }
    if (weeklyDrafts >= 1) {
      return "💪 Great progress this week! You've got this!"
    }
    if (librarySize >= 5) {
      return "📚 Impressive library! You're building a strong foundation."
    }
    if (avgQualityScore >= 80) {
      return "⭐ Outstanding quality! Your essays shine!"
    }
    return "🌟 Ready to start crafting? Let's write something amazing!"
  }

  // Quality score color
  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-orange-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Your Writing Journey</h2>
        <p className="text-sm text-coral-600 font-medium">{getMotivationalMessage()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Essays drafted this week */}
        <Card className="border-coral-200 hover:border-coral-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-coral-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-coral-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-3xl font-bold text-gray-900">{weeklyDrafts}</p>
                <p className="text-xs text-gray-500">essays drafted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total library size */}
        <Card className="border-amber-200 hover:border-amber-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Library className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Library</p>
                <p className="text-3xl font-bold text-gray-900">{librarySize}</p>
                <p className="text-xs text-gray-500">completed essays</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average quality score */}
        <Card className="border-yellow-200 hover:border-yellow-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Avg Quality</p>
                <p className={`text-3xl font-bold ${getQualityColor(avgQualityScore)}`}>
                  {avgQualityScore > 0 ? avgQualityScore : '--'}
                </p>
                <p className="text-xs text-gray-500">out of 100</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
