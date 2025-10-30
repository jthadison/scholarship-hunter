/**
 * Morgan Header Component
 *
 * Displays Morgan persona with encouraging, creative personality
 * Uses warm color palette (coral, amber, soft yellow)
 *
 * @component
 * Story 4.10: AC2, AC7 - Morgan persona with personalized greeting
 */

'use client'

import { Pencil, Sparkles } from 'lucide-react'

interface MorganHeaderProps {
  firstName: string
}

export function MorganHeader({ firstName }: MorganHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-coral-50 via-amber-50 to-yellow-50 border border-coral-200 p-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
        <Sparkles className="h-32 w-32 text-amber-600" />
      </div>

      <div className="relative flex items-start gap-4">
        {/* Morgan avatar */}
        <div className="flex-shrink-0">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-coral-400 to-amber-400 flex items-center justify-center shadow-lg">
            <Pencil className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Greeting and personality */}
        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Ready to craft your next winning essay, {firstName}?
          </h1>
          <p className="text-lg text-gray-700">
            I'm <span className="font-semibold text-coral-600">Morgan</span>, your Essay Strategist.
            Let's create something authentic and amazing together! ✨
          </p>
          <p className="text-sm text-gray-600 italic">
            "Every great essay starts with your unique story. I'm here to help you tell it beautifully."
          </p>
        </div>
      </div>

      {/* Morgan personality traits */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-coral-100 px-3 py-1 text-xs font-medium text-coral-700">
          <Sparkles className="h-3 w-3" />
          Encouraging
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          <Pencil className="h-3 w-3" />
          Creative
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
          ✓ Supportive
        </span>
      </div>
    </div>
  )
}
