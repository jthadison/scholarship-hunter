/**
 * Alex Analysis Report Component (Story 2.12)
 *
 * Main container for Alex agent's eligibility analysis report.
 * Displays 6-dimension analysis, gap identification, recommendations,
 * and competitive positioning in a clean, professional layout.
 *
 * @module components/alex/AlexAnalysisReport
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Lightbulb,
  Award
} from 'lucide-react'
import type { EligibilityAnalysis } from '@/server/lib/matching/eligibility-analysis'

interface AlexAnalysisReportProps {
  analysis: EligibilityAnalysis
  scholarshipName: string
}

/**
 * Main Alex eligibility analysis report component
 */
export function AlexAnalysisReport({ analysis, scholarshipName }: AlexAnalysisReportProps) {
  return (
    <div className="space-y-6">
      {/* Alex Header */}
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-2xl font-bold">
          A
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Alex's Eligibility Analysis</h2>
          <p className="text-gray-600 mt-1">
            I've analyzed your profile against the requirements for <span className="font-semibold">{scholarshipName}</span>.
            Here's my detailed assessment.
          </p>
        </div>
      </div>

      {/* Overall Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Assessment</span>
            <AssessmentBadge assessment={analysis.overallAssessment} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Match Score</span>
                <span className="text-2xl font-bold text-blue-600">{analysis.overallScore}/100</span>
              </div>
              <Progress value={analysis.overallScore} className="h-3" />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Summary:</strong> You meet {analysis.gapAnalysis.metCriteria} of{' '}
                {analysis.gapAnalysis.totalCriteria} criteria for this scholarship.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Six Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensional Analysis</CardTitle>
          <CardDescription>
            Here's how you match across all 6 eligibility dimensions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <DimensionCard
            name="Academic"
            icon="📚"
            analysis={analysis.dimensions.academic}
          />
          <DimensionCard
            name="Demographic"
            icon="👥"
            analysis={analysis.dimensions.demographic}
          />
          <DimensionCard
            name="Major/Field"
            icon="🎓"
            analysis={analysis.dimensions.majorField}
          />
          <DimensionCard
            name="Experience"
            icon="⭐"
            analysis={analysis.dimensions.experience}
          />
          <DimensionCard
            name="Financial"
            icon="💰"
            analysis={analysis.dimensions.financial}
          />
          <DimensionCard
            name="Special Criteria"
            icon="✨"
            analysis={analysis.dimensions.specialCriteria}
          />
        </CardContent>
      </Card>

      {/* Gap Analysis */}
      {analysis.gapAnalysis.missingCriteria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Gap Identification
            </CardTitle>
            <CardDescription>
              Criteria you're currently missing for this scholarship
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.gapAnalysis.missingCriteria.map((criterion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{criterion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Improvement Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Improvement Recommendations
            </CardTitle>
            <CardDescription>
              Actionable steps to strengthen your eligibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="h-6 w-6 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-800 font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-sm text-gray-800">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Competitive Positioning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Competitive Positioning
          </CardTitle>
          <CardDescription>
            How you compare to typical applicants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Percentile Rank</span>
              <span className="text-xl font-bold text-green-600">
                Top {100 - analysis.competitivePositioning.percentile}%
              </span>
            </div>
            <Progress value={analysis.competitivePositioning.percentile} className="h-2" />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-green-900">
              {analysis.competitivePositioning.message}
            </p>
            <p className="text-sm text-green-800">
              {analysis.competitivePositioning.context}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alex Sign-off */}
      <div className="text-center text-sm text-gray-600 pt-4 border-t">
        <p>
          Analysis generated by Alex, your eligibility analyst.
          <br />
          Questions about this analysis? Review your profile data for accuracy.
        </p>
      </div>
    </div>
  )
}

/**
 * Individual dimension card component
 */
function DimensionCard({
  name,
  icon,
  analysis,
}: {
  name: string
  icon: string
  analysis: EligibilityAnalysis['dimensions']['academic']
}) {
  const scoreColor =
    analysis.score >= 90
      ? 'text-green-600'
      : analysis.score >= 70
        ? 'text-blue-600'
        : analysis.score >= 50
          ? 'text-amber-600'
          : 'text-red-600'

  const bgColor =
    analysis.score >= 90
      ? 'bg-green-50 border-green-200'
      : analysis.score >= 70
        ? 'bg-blue-50 border-blue-200'
        : analysis.score >= 50
          ? 'bg-amber-50 border-amber-200'
          : 'bg-red-50 border-red-200'

  return (
    <div className={`border rounded-lg p-4 ${bgColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <h4 className="font-semibold text-gray-900">{name}</h4>
            <p className="text-xs text-gray-600 mt-0.5">{analysis.explanation}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${scoreColor}`}>{analysis.score}</span>
          <span className="text-sm text-gray-500">/100</span>
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {/* Met Criteria */}
        {analysis.metCriteria.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">✓ Met Criteria:</p>
            <ul className="space-y-1">
              {analysis.metCriteria.map((criterion, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-gray-700">
                  <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Criteria */}
        {analysis.missingCriteria.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">✗ Missing Criteria:</p>
            <ul className="space-y-1">
              {analysis.missingCriteria.map((criterion, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-gray-700">
                  <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Assessment badge component
 */
function AssessmentBadge({
  assessment,
}: {
  assessment: EligibilityAnalysis['overallAssessment']
}) {
  const variants: Record<
    EligibilityAnalysis['overallAssessment'],
    { color: string; icon: React.ReactNode }
  > = {
    'Highly Eligible': {
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: <Award className="h-4 w-4" />,
    },
    Competitive: {
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    'Needs Improvement': {
      color: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: <AlertCircle className="h-4 w-4" />,
    },
    'Not Eligible': {
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: <XCircle className="h-4 w-4" />,
    },
  }

  const variant = variants[assessment]

  return (
    <Badge className={`${variant.color} border flex items-center gap-1.5`} variant="outline">
      {variant.icon}
      {assessment}
    </Badge>
  )
}
