/**
 * Scholarship Search Bar Component
 *
 * Natural language search input with debouncing and keyboard shortcuts.
 * Supports queries like "scholarships for women in STEM with financial need".
 *
 * Features:
 * - 300ms debounce to reduce API calls
 * - Cmd/Ctrl+K keyboard shortcut to focus
 * - Mobile responsive
 * - Clear button when query present
 *
 * @module components/scholarships/ScholarshipSearchBar
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export interface ScholarshipSearchBarProps {
  /** Callback when search query changes (debounced) */
  onSearch: (query: string) => void
  /** Default search query */
  defaultValue?: string
  /** Placeholder text */
  placeholder?: string
}

/**
 * Search bar component with natural language input
 *
 * Debounces input by 300ms to avoid excessive API calls.
 * Provides keyboard shortcut (Cmd/Ctrl+K) for quick focus.
 */
export function ScholarshipSearchBar({
  onSearch,
  defaultValue = '',
  placeholder = 'Search scholarships... (e.g., "STEM scholarships for women")',
}: ScholarshipSearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const [isFocused, setIsFocused] = useState(false)

  // Debounce search query (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, onSearch])

  // Keyboard shortcut: Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('scholarship-search')?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Clear search query
  const handleClear = useCallback(() => {
    setQuery('')
  }, [])

  return (
    <div className="relative w-full">
      <div className="relative">
        {/* Search icon */}
        <Search
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />

        {/* Search input */}
        <Input
          id="scholarship-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="h-12 pl-10 pr-10 text-base"
          aria-label="Search scholarships"
        />

        {/* Clear button (only show when query is not empty) */}
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Keyboard shortcut hint (only show when not focused and empty) */}
      {!isFocused && !query && (
        <div className="absolute right-14 top-1/2 hidden -translate-y-1/2 md:block">
          <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      )}
    </div>
  )
}
