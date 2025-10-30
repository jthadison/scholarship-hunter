/**
 * Themes Display Component (Story 4.6 - Task 5)
 *
 * Displays identified essay themes with importance indicators
 * AC2: Show themes as badges with explanations and importance levels
 *
 * @module components/essay/prompt-analysis/ThemesDisplay
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import type { PromptTheme } from '@/types/essay'

interface ThemesDisplayProps {
  themes: PromptTheme[]
}

/**
 * Display key themes with importance indicators (★★★)
 * AC2: Identify themes (leadership, overcoming challenges, future goals)
 */
export function ThemesDisplay({ themes }: ThemesDisplayProps) {
  // Separate primary and secondary themes
  const primaryThemes = themes.filter((t) => t.importance === 'primary')
  const secondaryThemes = themes.filter((t) => t.importance === 'secondary')

  return (
    <div className="space-y-4">
      {/* Primary Themes */}
      {primaryThemes.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
            Primary Themes
          </h4>
          <div className="space-y-3">
            {primaryThemes.map((theme, index) => (
              <ThemeCard key={index} theme={theme} isPrimary />
            ))}
          </div>
        </div>
      )}

      {/* Secondary Themes */}
      {secondaryThemes.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Star className="h-4 w-4 text-gray-400" />
            Secondary Themes
          </h4>
          <div className="space-y-3">
            {secondaryThemes.map((theme, index) => (
              <ThemeCard key={index} theme={theme} isPrimary={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Individual theme card with importance stars
 */
interface ThemeCardProps {
  theme: PromptTheme
  isPrimary: boolean
}

function ThemeCard({ theme, isPrimary }: ThemeCardProps) {
  const starCount = isPrimary ? 3 : 2

  return (
    <div
      className={`p-4 rounded-lg border ${
        isPrimary
          ? 'bg-orange-50 border-orange-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      {/* Theme Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Badge
            variant={isPrimary ? 'default' : 'secondary'}
            className={
              isPrimary ? 'bg-orange-600 hover:bg-orange-700' : ''
            }
          >
            {theme.name}
          </Badge>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: starCount }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                isPrimary
                  ? 'text-orange-500 fill-orange-500'
                  : 'text-gray-400 fill-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Explanation */}
      <p className="text-sm text-gray-700 mb-3">{theme.explanation}</p>

      {/* Examples */}
      {theme.examples.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600">Examples:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {theme.examples.map((example, i) => (
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
