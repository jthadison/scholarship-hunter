/**
 * Essay Workflow List Component
 *
 * Displays list of in-progress essays with workflow guidance
 * Shows current phase, next steps, and quick actions
 *
 * @component
 * Story 4.10: AC3 - Essay workflow guidance
 */

'use client'

import { EssayWorkflowCard } from './EssayWorkflowCard'
import { EssayPhase } from '@prisma/client'
import { FileQuestion } from 'lucide-react'

interface Essay {
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

interface EssayWorkflowListProps {
  essays: Essay[]
}

export function EssayWorkflowList({ essays }: EssayWorkflowListProps) {
  if (essays.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <FileQuestion className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No essays in progress yet
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Start a new essay to see it here with personalized guidance!
        </p>
        <a
          href="/dashboard/essays/new"
          className="inline-flex items-center justify-center rounded-md bg-coral-600 px-4 py-2 text-sm font-medium text-white hover:bg-coral-700 transition-colors"
        >
          Start Writing
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {essays.map((essay) => (
        <EssayWorkflowCard
          key={essay.id}
          essay={essay}
        />
      ))}
    </div>
  )
}
