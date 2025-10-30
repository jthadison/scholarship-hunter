/**
 * Prompt Analysis Panel Component (Story 4.6)
 *
 * Main container for Morgan's AI-powered essay prompt analysis.
 * Displays themes, requirements, tone, structure, and strategic advice
 * in a warm, encouraging Morgan persona style.
 *
 * @module components/essay/prompt-analysis/PromptAnalysisPanel
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Lightbulb,
  Target,
  MessageSquare,
  ListChecks,
  ChevronDown,
  Sparkles,
  BookOpen,
  Award,
} from 'lucide-react'
import { useState } from 'react'
import type { PromptAnalysis } from '@/types/essay'
import { ThemesDisplay } from './ThemesDisplay'
import { RequiredElementsChecklist } from './RequiredElementsChecklist'
import { ToneExpectations } from './ToneExpectations'
import { SuggestedStructure } from './SuggestedStructure'
import { StrategicAdvice } from './StrategicAdvice'
import { ExamplePatterns } from './ExamplePatterns'

interface PromptAnalysisPanelProps {
  analysis: PromptAnalysis
  promptText: string
  compact?: boolean
}

/**
 * Main Morgan prompt analysis panel
 * AC5: "Prompt Analysis by Morgan" with clear breakdown
 */
export function PromptAnalysisPanel({
  analysis,
  promptText,
  compact = false,
}: PromptAnalysisPanelProps) {
  const [sectionsOpen, setSectionsOpen] = useState({
    themes: true,
    elements: true,
    tone: true,
    structure: true,
    advice: true,
    examples: true,
  })

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="space-y-6">
      {/* Morgan Header */}
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          M
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-orange-500" />
            Prompt Analysis by Morgan
          </h2>
          <p className="text-gray-600 mt-1">
            I've analyzed your essay prompt to help you understand what the scholarship is looking for
            and how to craft a winning response!
          </p>
        </div>
      </div>

      {/* Prompt Display */}
      {!compact && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-600" />
              Essay Prompt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 italic whitespace-pre-wrap">{promptText}</p>
            {analysis.wordCountTarget.extracted && (
              <div className="mt-3 pt-3 border-t border-orange-200">
                <Badge variant="outline" className="bg-white">
                  Target: {analysis.wordCountTarget.min}-{analysis.wordCountTarget.max} words
                  {analysis.wordCountTarget.optimal && ` (Optimal: ${analysis.wordCountTarget.optimal})`}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Themes (AC2) */}
      <CollapsibleSection
        title="Key Themes"
        icon={Target}
        isOpen={sectionsOpen.themes}
        onToggle={() => toggleSection('themes')}
        count={analysis.themes.length}
      >
        <ThemesDisplay themes={analysis.themes} />
      </CollapsibleSection>

      {/* Required Elements (AC2) */}
      <CollapsibleSection
        title="Required Elements"
        icon={ListChecks}
        isOpen={sectionsOpen.elements}
        onToggle={() => toggleSection('elements')}
        count={analysis.requiredElements.length}
      >
        <RequiredElementsChecklist elements={analysis.requiredElements} />
      </CollapsibleSection>

      {/* Tone & Voice (AC2) */}
      <CollapsibleSection
        title="Tone & Voice"
        icon={MessageSquare}
        isOpen={sectionsOpen.tone}
        onToggle={() => toggleSection('tone')}
      >
        <ToneExpectations tone={analysis.tone} />
      </CollapsibleSection>

      {/* Suggested Structure (AC4) */}
      <CollapsibleSection
        title="Suggested Structure"
        icon={BookOpen}
        isOpen={sectionsOpen.structure}
        onToggle={() => toggleSection('structure')}
        count={analysis.suggestedStructure.outline.length}
      >
        <SuggestedStructure structure={analysis.suggestedStructure} />
      </CollapsibleSection>

      {/* Strategic Advice (AC3) */}
      <CollapsibleSection
        title="Strategic Advice"
        icon={Lightbulb}
        isOpen={sectionsOpen.advice}
        onToggle={() => toggleSection('advice')}
        count={analysis.strategicAdvice.length}
      >
        <StrategicAdvice
          advice={analysis.strategicAdvice}
          dosAndDonts={analysis.dosAndDonts}
          competitiveInsights={analysis.competitiveInsights}
        />
      </CollapsibleSection>

      {/* Example Patterns (AC6) */}
      {analysis.examplePatterns.length > 0 && (
        <CollapsibleSection
          title="Example Essay Patterns"
          icon={Award}
          isOpen={sectionsOpen.examples}
          onToggle={() => toggleSection('examples')}
          count={analysis.examplePatterns.length}
        >
          <ExamplePatterns patterns={analysis.examplePatterns} />
        </CollapsibleSection>
      )}

      {/* Timestamp */}
      <div className="text-xs text-gray-500 text-center">
        Analysis generated: {new Date(analysis.analyzedAt).toLocaleString()}
      </div>
    </div>
  )
}

/**
 * Reusable collapsible section component
 */
interface CollapsibleSectionProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  count?: number
}

function CollapsibleSection({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  count,
}: CollapsibleSectionProps) {
  return (
    <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-orange-600" />
                {title}
                {count !== undefined && (
                  <Badge variant="secondary" className="ml-2">
                    {count}
                  </Badge>
                )}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
