/**
 * Story 1.8: Auto-Save Hook for Profile Wizard
 * Debounced auto-save with 500ms delay to prevent excessive database writes
 */

import { useEffect, useRef, useState } from 'react'
import { trpc } from '@/shared/lib/trpc'
import type { WizardFormData } from './useWizardStore'

interface UseAutoSaveOptions {
  debounceMs?: number
  enabled?: boolean
  onSaveSuccess?: () => void
  onSaveError?: (error: Error) => void
}

export function useAutoSave(
  formData: WizardFormData,
  options: UseAutoSaveOptions = {}
) {
  const {
    debounceMs = 500,
    enabled = true,
    onSaveSuccess,
    onSaveError,
  } = options

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousDataRef = useRef<string>('')

  const saveDraftMutation = trpc.profile.saveDraft.useMutation({
    onSuccess: () => {
      setIsSaving(false)
      const now = new Date()
      setLastSaved(now)
      onSaveSuccess?.()
    },
    onError: (error: unknown) => {
      setIsSaving(false)
      onSaveError?.(error as Error)
    },
  })

  useEffect(() => {
    if (!enabled) return

    // Serialize current form data for comparison
    const currentData = JSON.stringify(formData)

    // Skip if data hasn't changed
    if (currentData === previousDataRef.current) {
      return
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new debounced save
    timeoutRef.current = setTimeout(() => {
      setIsSaving(true)
      previousDataRef.current = currentData
      // Cast to any to bypass type mismatch - formData is superset of profile schema
      saveDraftMutation.mutate(formData as any)
    }, debounceMs)

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [formData, enabled, debounceMs])

  return {
    isSaving,
    lastSaved,
    isError: saveDraftMutation.isError,
    error: saveDraftMutation.error,
  }
}
