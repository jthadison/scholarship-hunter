/**
 * Suggested Structure Component (Story 4.6 - Task 8)
 *
 * Displays suggested essay outline with sections and word counts
 * AC4: Show structure like "Personal story → Challenge → Growth → Future impact"
 *
 * @module components/essay/prompt-analysis/SuggestedStructure
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { ArrowRight, FileText } from 'lucide-react'
import type { SuggestedStructure as SuggestedStructureType } from '@/types/essay'

interface SuggestedStructureProps {
  structure: SuggestedStructureType
}

/**
 * Display suggested essay structure with visual timeline
 * AC4: Show outline with sections, word counts, and guidance
 */
export function SuggestedStructure({ structure }: SuggestedStructureProps) {
  return (
    <div className="space-y-4">
      {/* Flow Overview */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">Recommended Flow:</p>
        <p className="text-base font-semibold text-blue-900">{structure.flow}</p>
      </div>

      {/* Outline Sections */}
      <div className="space-y-3">
        {structure.outline.map((section, index) => (
          <div key={index}>
            <StructureSection
              section={section}
              sectionNumber={index + 1}
              isLast={index === structure.outline.length - 1}
            />
            {index < structure.outline.length - 1 && (
              <div className="flex justify-center my-2">
                <ArrowRight className="h-5 w-5 text-blue-400" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total Word Count */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <span className="text-sm font-medium text-gray-700">Total Word Count:</span>
        <Badge variant="secondary" className="text-base">
          {structure.outline.reduce((sum, s) => sum + s.wordCount, 0)} words
        </Badge>
      </div>
    </div>
  )
}

/**
 * Individual structure section with guidance
 */
interface StructureSectionProps {
  section: {
    section: string
    content: string
    wordCount: number
    guidance: string
  }
  sectionNumber: number
  isLast: boolean
}

function StructureSection({ section, sectionNumber }: StructureSectionProps) {
  return (
    <div className="p-4 border-l-4 border-l-blue-500 bg-blue-50 rounded-lg">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {sectionNumber}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{section.section}</h4>
            <p className="text-sm text-gray-600">{section.content}</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-white flex-shrink-0">
          ~{section.wordCount} words
        </Badge>
      </div>

      {/* Guidance */}
      <div className="ml-10 mt-2 p-2 bg-white rounded border border-blue-200">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            <strong>Guidance:</strong> {section.guidance}
          </p>
        </div>
      </div>
    </div>
  )
}
