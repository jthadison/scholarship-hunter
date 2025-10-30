/**
 * Essay Workflow Card Component
 *
 * Displays individual essay progress with:
 * - Current phase visualization
 * - Phase-specific next steps
 * - Progress indicators
 * - Quick action buttons
 * - Visual phase timeline
 *
 * @component
 * Story 4.10: AC3 - Essay workflow guidance
 */

'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Lightbulb,
  FileText,
  PenTool,
  RefreshCw,
  Sparkles,
  Check,
  ArrowRight,
  Calendar,
} from 'lucide-react'
import { EssayPhase } from '@prisma/client'
import Link from 'next/link'

interface EssayWorkflowCardProps {
  essay: {
    id: string
    title: string
    phase: EssayPhase
    wordCount: number
    qualityScore: number | null
    updatedAt: Date
    applicationId: string | null
    scholarshipName: string | null | undefined
    deadline: Date | null | undefined
  }
}

// Phase configuration
const PHASE_CONFIG: Record<
  EssayPhase,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    bgColor: string
    nextSteps: string
    order: number
  }
> = {
  [EssayPhase.DISCOVERY]: {
    label: 'Discovery',
    icon: Lightbulb,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    nextSteps: 'Brainstorm ideas and explore your story angles',
    order: 1,
  },
  [EssayPhase.STRUCTURE]: {
    label: 'Structure',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    nextSteps: 'Outline your essay structure and key points',
    order: 2,
  },
  [EssayPhase.DRAFTING]: {
    label: 'Drafting',
    icon: PenTool,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    nextSteps: 'Write your first draft - focus on getting ideas down',
    order: 3,
  },
  [EssayPhase.REVISION]: {
    label: 'Revision',
    icon: RefreshCw,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    nextSteps: 'Refine content, strengthen arguments, add details',
    order: 4,
  },
  [EssayPhase.POLISH]: {
    label: 'Polish',
    icon: Sparkles,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    nextSteps: 'Perfect grammar, flow, and word choice',
    order: 5,
  },
  [EssayPhase.FINALIZATION]: {
    label: 'Finalization',
    icon: Check,
    color: 'text-green-700',
    bgColor: 'bg-green-200',
    nextSteps: 'Final review and submit!',
    order: 6,
  },
}

const ALL_PHASES = [
  EssayPhase.DISCOVERY,
  EssayPhase.STRUCTURE,
  EssayPhase.DRAFTING,
  EssayPhase.REVISION,
  EssayPhase.POLISH,
  EssayPhase.FINALIZATION,
]

export function EssayWorkflowCard({ essay }: EssayWorkflowCardProps) {
  const currentPhaseConfig = PHASE_CONFIG[essay.phase]
  const currentPhaseOrder = currentPhaseConfig.order
  const progressPercentage = Math.round((currentPhaseOrder / 6) * 100)

  // Calculate days until deadline
  const daysUntilDeadline = essay.deadline
    ? Math.ceil((essay.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Card className="border-coral-200 hover:border-coral-300 transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{essay.title}</h3>
            {essay.scholarshipName && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <span className="font-medium">{essay.scholarshipName}</span>
                {essay.deadline && daysUntilDeadline !== null && (
                  <Badge
                    variant={daysUntilDeadline <= 7 ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {daysUntilDeadline} days
                  </Badge>
                )}
              </p>
            )}
          </div>

          {/* Quality score badge */}
          {essay.qualityScore !== null && (
            <Badge
              variant={essay.qualityScore >= 80 ? 'default' : essay.qualityScore >= 60 ? 'secondary' : 'outline'}
              className="text-sm"
            >
              Quality: {essay.qualityScore}/100
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current phase indicator */}
        <div className="flex items-center gap-3">
          <div className={`${currentPhaseConfig.bgColor} p-2 rounded-lg`}>
            <currentPhaseConfig.icon className={`h-5 w-5 ${currentPhaseConfig.color}`} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Current Phase</p>
            <p className={`text-sm font-semibold ${currentPhaseConfig.color}`}>
              {currentPhaseConfig.label}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {progressPercentage}% Complete
          </Badge>
        </div>

        {/* Visual phase timeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            {ALL_PHASES.map((phase, index) => {
              const phaseConfig = PHASE_CONFIG[phase]
              const isCompleted = phaseConfig.order < currentPhaseOrder
              const isCurrent = phase === essay.phase
              const PhaseIcon = phaseConfig.icon

              return (
                <div key={phase} className="flex items-center">
                  <div
                    className={`flex flex-col items-center ${
                      isCompleted || isCurrent ? '' : 'opacity-40'
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                            ? `${phaseConfig.bgColor} ${phaseConfig.color}`
                            : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <PhaseIcon className="h-4 w-4" />
                      )}
                    </div>
                    <p className="text-xs mt-1 text-gray-600 hidden sm:block">
                      {phaseConfig.label}
                    </p>
                  </div>
                  {index < ALL_PHASES.length - 1 && (
                    <div
                      className={`h-0.5 w-8 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Next steps */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-900 mb-1 flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            Next Step:
          </p>
          <p className="text-sm text-amber-800">{currentPhaseConfig.nextSteps}</p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <Button
            asChild
            className="flex-1 bg-coral-600 hover:bg-coral-700 text-white"
          >
            <Link href={`/dashboard/essays/${essay.id}`}>
              Continue Essay
            </Link>
          </Button>
          {essay.qualityScore !== null && essay.qualityScore < 80 && (
            <Button
              asChild
              variant="outline"
              className="flex-1 border-coral-300 text-coral-700 hover:bg-coral-50"
            >
              <Link href={`/dashboard/essays/${essay.id}`}>
                Improve Quality
              </Link>
            </Button>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{essay.wordCount} words</span>
          <span>Updated {new Date(essay.updatedAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
