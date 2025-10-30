/**
 * Strategic Advice Component (Story 4.6 - Task 9)
 *
 * Displays strategic recommendations with dos/don'ts and competitive insights
 * AC3: Show advice like "This prompt values authenticity - focus on genuine experience"
 *
 * @module components/essay/prompt-analysis/StrategicAdvice
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Lightbulb, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'
import type { DosAndDonts } from '@/types/essay'

interface StrategicAdviceProps {
  advice: string[]
  dosAndDonts: DosAndDonts
  competitiveInsights: string
}

/**
 * Display strategic advice, dos/don'ts, and competitive insights
 * AC3: Show strategic recommendations that are specific and actionable
 */
export function StrategicAdvice({ advice, dosAndDonts, competitiveInsights }: StrategicAdviceProps) {
  return (
    <div className="space-y-4">
      {/* Top Strategic Insights */}
      {advice.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
            Morgan's Strategic Insights
          </h4>
          {advice.map((insight, i) => (
            <div
              key={i}
              className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg"
            >
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="bg-white flex-shrink-0 mt-0.5">
                  {i + 1}
                </Badge>
                <p className="text-sm text-gray-800">{insight}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dos and Don'ts */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {/* Dos */}
        {dosAndDonts.dos.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              ✅ DO:
            </h4>
            <div className="space-y-2">
              {dosAndDonts.dos.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded bg-green-50 border border-green-200"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-900">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Don'ts */}
        {dosAndDonts.donts.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              ❌ DON'T:
            </h4>
            <div className="space-y-2">
              {dosAndDonts.donts.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded bg-red-50 border border-red-200"
                >
                  <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-900">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Competitive Insights */}
      {competitiveInsights && (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            What Makes Essays Stand Out:
          </h4>
          <p className="text-sm text-gray-800">{competitiveInsights}</p>
        </div>
      )}
    </div>
  )
}
