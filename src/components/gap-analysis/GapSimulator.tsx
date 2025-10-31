/**
 * GapSimulator Component
 *
 * Interactive "what-if" simulator with sliders for GPA, volunteer hours, leadership.
 * Shows real-time profile strength calculation and impact preview.
 *
 * Story: 5.3 - Gap Analysis (AC #3, #7)
 * @module components/gap-analysis/GapSimulator
 */

'use client'

import { useState } from 'react'
import { trpc } from '@/shared/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Sparkles,
  TrendingUp,
  Award,
  DollarSign,
  Loader2,
  RotateCcw,
} from 'lucide-react'

export interface GapSimulatorProps {
  currentGpa?: number
  currentSatScore?: number
  currentActScore?: number
  currentVolunteerHours?: number
  currentLeadershipCount?: number
}

export function GapSimulator({
  currentGpa = 3.0,
  currentSatScore = 1200,
  currentActScore = 25,
  currentVolunteerHours = 0,
  currentLeadershipCount = 0,
}: GapSimulatorProps) {
  const [gpa, setGpa] = useState(currentGpa)
  const [satScore, setSatScore] = useState(currentSatScore)
  const [actScore, setActScore] = useState(currentActScore)
  const [volunteerHours, setVolunteerHours] = useState(currentVolunteerHours)
  const [leadershipCount, setLeadershipCount] = useState(currentLeadershipCount)

  const { data: impact, isLoading } = trpc.gapAnalysis.getImpact.useQuery(
    {
      hypotheticalChanges: {
        gpa,
        satScore,
        actScore,
        volunteerHours,
        leadershipCount,
      },
    },
    {
      // Debounce: only refetch after user stops adjusting for 500ms
      refetchOnWindowFocus: false,
      staleTime: 500,
    }
  )

  const handleReset = () => {
    setGpa(currentGpa)
    setSatScore(currentSatScore)
    setActScore(currentActScore)
    setVolunteerHours(currentVolunteerHours)
    setLeadershipCount(currentLeadershipCount)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const hasChanges =
    gpa !== currentGpa ||
    satScore !== currentSatScore ||
    actScore !== currentActScore ||
    volunteerHours !== currentVolunteerHours ||
    leadershipCount !== currentLeadershipCount

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Interactive Gap Simulator
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Explore how profile improvements would impact your scholarship opportunities
            </p>
          </div>
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Sliders */}
        <div className="space-y-4">
          {/* GPA Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="gpa-slider">GPA</Label>
              <span className="text-sm font-semibold text-gray-900">{gpa.toFixed(2)}</span>
            </div>
            <input
              id="gpa-slider"
              type="range"
              min="0"
              max="4"
              step="0.1"
              value={gpa}
              onChange={(e) => setGpa(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* SAT Score Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sat-slider">SAT Score</Label>
              <span className="text-sm font-semibold text-gray-900">{satScore}</span>
            </div>
            <input
              id="sat-slider"
              type="range"
              min="400"
              max="1600"
              step="10"
              value={satScore}
              onChange={(e) => setSatScore(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* ACT Score Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="act-slider">ACT Score</Label>
              <span className="text-sm font-semibold text-gray-900">{actScore}</span>
            </div>
            <input
              id="act-slider"
              type="range"
              min="1"
              max="36"
              step="1"
              value={actScore}
              onChange={(e) => setActScore(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Volunteer Hours Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="volunteer-slider">Volunteer Hours</Label>
              <span className="text-sm font-semibold text-gray-900">{volunteerHours}</span>
            </div>
            <input
              id="volunteer-slider"
              type="range"
              min="0"
              max="500"
              step="10"
              value={volunteerHours}
              onChange={(e) => setVolunteerHours(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Leadership Count Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="leadership-slider">Leadership Positions</Label>
              <span className="text-sm font-semibold text-gray-900">{leadershipCount}</span>
            </div>
            <input
              id="leadership-slider"
              type="range"
              min="0"
              max="5"
              step="1"
              value={leadershipCount}
              onChange={(e) => setLeadershipCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* Impact Preview */}
        {isLoading && (
          <div className="flex items-center justify-center py-4 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Calculating impact...
          </div>
        )}

        {!isLoading && impact && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Projected Impact
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Profile Strength */}
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Profile Strength</p>
                <p className="text-2xl font-bold text-purple-600">
                  {impact.projectedStrength}
                </p>
                {impact.dimensionalChanges && (
                  <p className="text-xs text-gray-500 mt-1">
                    {impact.dimensionalChanges.academic > 0 && '+Academic '}
                    {impact.dimensionalChanges.experience > 0 && '+Experience '}
                    {impact.dimensionalChanges.leadership > 0 && '+Leadership '}
                  </p>
                )}
              </div>

              {/* Scholarships Unlocked */}
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Scholarships Unlocked</p>
                <div className="flex items-baseline gap-1">
                  <Award className="h-5 w-5 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">
                    {impact.scholarshipsUnlocked > 0 ? '+' : ''}
                    {impact.scholarshipsUnlocked}
                  </p>
                </div>
              </div>

              {/* Funding Increase */}
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Funding Increase</p>
                <div className="flex items-baseline gap-1">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <p className="text-lg font-bold text-green-600">
                    {impact.fundingIncrease > 0 ? '+' : ''}
                    {formatCurrency(impact.fundingIncrease)}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {impact.scholarshipsUnlocked > 0 && (
              <p className="text-sm text-gray-700">
                If you achieve these values, you would unlock{' '}
                <strong>{impact.scholarshipsUnlocked}</strong> additional scholarship
                {impact.scholarshipsUnlocked !== 1 ? 's' : ''} worth{' '}
                <strong>{formatCurrency(impact.fundingIncrease)}</strong>.
              </p>
            )}

            {impact.scholarshipsUnlocked === 0 && hasChanges && (
              <p className="text-sm text-gray-600">
                These changes don't unlock additional scholarships yet. Try adjusting other values
                or aim for higher targets.
              </p>
            )}
          </div>
        )}

        {/* Help Text */}
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            Adjust the sliders to explore different scenarios. The impact updates in real-time to
            show how changes to your profile would affect your scholarship opportunities.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
