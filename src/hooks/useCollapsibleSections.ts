/**
 * useCollapsibleSections Hook
 *
 * Manages collapse/expand state for workspace sections with localStorage persistence.
 * State survives page refreshes and is specific to each user and application.
 *
 * Story 3.8 AC#7: Collapsible sections with state persistence
 *
 * @module hooks/useCollapsibleSections
 */

'use client'

import { useEffect, useState } from 'react'

export interface CollapsibleState {
  [sectionId: string]: boolean // true = expanded, false = collapsed
}

const DEFAULT_STATE: CollapsibleState = {
  summary: true,
  progress: true,
  timeline: true,
  essays: true,
  documents: true,
  recommendations: true,
  notes: false, // Notes collapsed by default to reduce initial cognitive load
}

/**
 * Hook for managing collapsible section state
 *
 * @param userId - User ID for scoping state
 * @param applicationId - Application ID for scoping state
 * @returns Collapse state and control functions
 */
export function useCollapsibleSections(userId: string, applicationId: string) {
  const storageKey = `workspace-collapsed-${userId}-${applicationId}`

  const [collapsed, setCollapsed] = useState<CollapsibleState>(() => {
    // Only access localStorage on client-side
    if (typeof window === 'undefined') {
      return DEFAULT_STATE
    }

    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : DEFAULT_STATE
    } catch (error) {
      console.error('Failed to load collapse state from localStorage:', error)
      return DEFAULT_STATE
    }
  })

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(storageKey, JSON.stringify(collapsed))
    } catch (error) {
      console.error('Failed to save collapse state to localStorage:', error)
    }
  }, [collapsed, storageKey])

  /**
   * Toggle a single section
   */
  const toggleSection = (sectionId: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  /**
   * Collapse all sections (focus mode)
   */
  const collapseAll = () => {
    setCollapsed(
      Object.fromEntries(Object.keys(collapsed).map((key) => [key, false]))
    )
  }

  /**
   * Expand all sections
   */
  const expandAll = () => {
    setCollapsed(
      Object.fromEntries(Object.keys(collapsed).map((key) => [key, true]))
    )
  }

  /**
   * Check if a section is expanded
   */
  const isExpanded = (sectionId: string): boolean => {
    return collapsed[sectionId] ?? true
  }

  return {
    collapsed,
    toggleSection,
    collapseAll,
    expandAll,
    isExpanded,
  }
}
