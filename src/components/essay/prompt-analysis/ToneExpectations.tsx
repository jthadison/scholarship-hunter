/**
 * Tone Expectations Component (Story 4.6 - Task 7)
 *
 * Displays expected tone with example phrases and what to avoid
 * AC2: Show tone expectations (formal, personal, inspirational)
 *
 * @module components/essay/prompt-analysis/ToneExpectations
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, MessageCircle } from 'lucide-react'
import type { ToneExpectations as ToneExpectationsType } from '@/types/essay'

interface ToneExpectationsProps {
  tone: ToneExpectationsType
}

/**
 * Display expected tone, example phrases, and what to avoid
 * AC2: Show tone description with guidance
 */
export function ToneExpectations({ tone }: ToneExpectationsProps) {
  return (
    <div className="space-y-4">
      {/* Expected Tone */}
      <div className="flex items-center gap-3">
        <MessageCircle className="h-5 w-5 text-purple-600" />
        <div>
          <p className="text-sm font-medium text-gray-700">Expected Tone:</p>
          <Badge variant="outline" className="mt-1 bg-purple-50 border-purple-300 text-purple-800">
            {tone.expected}
          </Badge>
        </div>
      </div>

      {/* Description */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-900">
          <strong>What this means:</strong> {tone.description}
        </p>
      </div>

      {/* Example Phrases */}
      {tone.examplePhrases.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Example Phrases That Match This Tone:
          </h4>
          <div className="space-y-1.5">
            {tone.examplePhrases.map((phrase, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded bg-green-50 border border-green-200"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-900 italic">&ldquo;{phrase}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What to Avoid */}
      {tone.avoid.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            What to Avoid:
          </h4>
          <div className="space-y-1.5">
            {tone.avoid.map((item, i) => (
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
  )
}
