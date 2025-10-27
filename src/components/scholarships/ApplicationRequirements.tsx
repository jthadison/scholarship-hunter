/**
 * ApplicationRequirements Component
 *
 * Displays scholarship application requirements:
 * - Essay prompts with word counts
 * - Required documents
 * - Recommendation letters
 * - Estimated effort level and time
 *
 * @component
 */

'use client'

import {
  FileText,
  FileCheck,
  Mail,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useState } from 'react'

interface EssayPrompt {
  prompt: string
  wordCount?: number
  minWords?: number
  maxWords?: number
}

interface ApplicationRequirementsProps {
  essayPrompts?: EssayPrompt[] | null
  requiredDocuments?: string[] | null
  recommendationCount?: number
  effortLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  estimatedHours?: number
}

const effortLevelConfig = {
  LOW: {
    label: 'Low Effort',
    color: 'bg-green-100 text-green-800 border-green-300',
    description: '0-2 hours estimated',
  },
  MEDIUM: {
    label: 'Medium Effort',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    description: '2-6 hours estimated',
  },
  HIGH: {
    label: 'High Effort',
    color: 'bg-red-100 text-red-800 border-red-300',
    description: '6+ hours estimated',
  },
}

export function ApplicationRequirements({
  essayPrompts,
  requiredDocuments,
  recommendationCount = 0,
  effortLevel,
  estimatedHours,
}: ApplicationRequirementsProps) {
  const essays = essayPrompts && Array.isArray(essayPrompts) ? essayPrompts : []
  const documents = requiredDocuments || []

  // Calculate effort if not provided
  const calculatedEffort =
    effortLevel ||
    (essays.length === 0 && documents.length <= 2 && recommendationCount === 0
      ? 'LOW'
      : essays.length >= 3 || documents.length >= 5 || recommendationCount >= 2
        ? 'HIGH'
        : 'MEDIUM')

  const calculatedHours =
    estimatedHours ||
    essays.length * 2 + documents.length * 0.5 + recommendationCount * 1

  const effortConfig = effortLevelConfig[calculatedEffort]

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Application Requirements</h2>
            <Badge variant="outline" className={`${effortConfig.color} border px-3 py-1`}>
              {effortConfig.label}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">Complete these items to apply</p>
        </div>

        {/* Effort Summary */}
        <div className="flex items-center gap-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">Estimated Time</p>
              <p className="text-lg font-semibold text-blue-700">
                {Math.round(calculatedHours)} {calculatedHours === 1 ? 'hour' : 'hours'}
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-sm text-blue-800">
            <span>{essays.length} essay{essays.length !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{recommendationCount} rec{recommendationCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Essay Requirements */}
        {essays.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Essay Requirements ({essays.length})
              </h3>
            </div>
            <div className="space-y-3">
              {essays.map((essay, idx) => (
                <EssayPromptCard key={idx} essay={essay} index={idx + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Document Requirements */}
        {documents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Required Documents ({documents.length})
              </h3>
            </div>
            <ul className="space-y-2">
              {documents.map((doc, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900">{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendation Requirements */}
        {recommendationCount > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Recommendation Letters ({recommendationCount})
              </h3>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                This scholarship requires{' '}
                <span className="font-semibold">{recommendationCount}</span> recommendation{' '}
                {recommendationCount === 1 ? 'letter' : 'letters'}. Allow 2-3 weeks for recommenders
                to submit.
              </p>
            </div>
          </div>
        )}

        {/* No Requirements */}
        {essays.length === 0 && documents.length === 0 && recommendationCount === 0 && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              No specific application requirements listed. Check scholarship website for details.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

function EssayPromptCard({ essay, index }: { essay: EssayPrompt; index: number }) {
  const [isExpanded, setIsExpanded] = useState(index === 1) // First essay expanded by default

  const wordCountText = essay.wordCount
    ? `${essay.wordCount} words`
    : essay.minWords && essay.maxWords
      ? `${essay.minWords}-${essay.maxWords} words`
      : essay.maxWords
        ? `Max ${essay.maxWords} words`
        : ''

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3 text-left">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                {index}
              </span>
              <span className="text-sm font-medium text-gray-900">Essay {index}</span>
              {wordCountText && (
                <Badge variant="outline" className="text-xs">
                  {wordCountText}
                </Badge>
              )}
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 bg-white">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {essay.prompt}
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
