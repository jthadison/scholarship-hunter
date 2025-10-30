/**
 * Example Patterns Component (Story 4.6 - Task 10)
 *
 * Displays example essay patterns showing what makes essays effective
 * AC6: Show patterns like "Effective essays on this theme typically include..."
 *
 * @module components/essay/prompt-analysis/ExamplePatterns
 */

'use client'

import { Award, Sparkles } from 'lucide-react'
import type { ExamplePattern } from '@/types/essay'

interface ExamplePatternsProps {
  patterns: ExamplePattern[]
}

/**
 * Display example essay patterns with effectiveness explanations
 * AC6: Show anonymized patterns that demonstrate effective approaches
 */
export function ExamplePatterns({ patterns }: ExamplePatternsProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Effective essays on this theme typically include these patterns:
      </p>

      {patterns.map((pattern, index) => (
        <div
          key={index}
          className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg"
        >
          {/* Pattern */}
          <div className="flex items-start gap-2 mb-2">
            <Award className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-gray-900">{pattern.pattern}</p>
          </div>

          {/* Effectiveness */}
          <div className="ml-7 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-900">
              <strong>Why it works:</strong> {pattern.effectiveness}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
