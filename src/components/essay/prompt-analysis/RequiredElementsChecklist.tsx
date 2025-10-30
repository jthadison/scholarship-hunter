/**
 * Required Elements Checklist Component (Story 4.6 - Task 6)
 *
 * Displays required elements as a checklist with mandatory/optional indicators
 * AC2: Show required elements (personal story, specific examples, word count)
 *
 * @module components/essay/prompt-analysis/RequiredElementsChecklist
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle } from 'lucide-react'
import type { RequiredElement } from '@/types/essay'

interface RequiredElementsChecklistProps {
  elements: RequiredElement[]
}

/**
 * Display required elements as checklist items
 * AC2: List mandatory vs. optional elements with examples
 */
export function RequiredElementsChecklist({ elements }: RequiredElementsChecklistProps) {
  // Separate mandatory and optional elements
  const mandatoryElements = elements.filter((e) => e.mandatory)
  const optionalElements = elements.filter((e) => !e.mandatory)

  return (
    <div className="space-y-4">
      {/* Mandatory Elements */}
      {mandatoryElements.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-red-600" />
            Mandatory Elements
            <Badge variant="destructive" className="text-xs">
              Required
            </Badge>
          </h4>
          <div className="space-y-2">
            {mandatoryElements.map((element, index) => (
              <ElementItem key={index} element={element} mandatory />
            ))}
          </div>
        </div>
      )}

      {/* Optional Elements */}
      {optionalElements.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Circle className="h-4 w-4 text-blue-600" />
            Recommended Elements
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </h4>
          <div className="space-y-2">
            {optionalElements.map((element, index) => (
              <ElementItem key={index} element={element} mandatory={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Individual checklist item
 */
interface ElementItemProps {
  element: RequiredElement
  mandatory: boolean
}

function ElementItem({ element, mandatory }: ElementItemProps) {
  return (
    <div
      className={`p-3 rounded-lg border-l-4 ${
        mandatory
          ? 'bg-red-50 border-l-red-500'
          : 'bg-blue-50 border-l-blue-500'
      }`}
    >
      {/* Element Header */}
      <div className="flex items-start gap-2 mb-2">
        {mandatory ? (
          <CheckCircle2 className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        ) : (
          <Circle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="font-medium text-sm text-gray-900">{element.element}</p>
          <p className="text-sm text-gray-700 mt-1">{element.description}</p>
        </div>
      </div>

      {/* Examples */}
      {element.examples.length > 0 && (
        <div className="ml-7 mt-2 space-y-1">
          <p className="text-xs font-medium text-gray-600">Examples:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {element.examples.map((example, i) => (
              <li key={i} className="text-xs text-gray-600">
                {example}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
