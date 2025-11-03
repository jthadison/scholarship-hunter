/**
 * Story 1.8: Auto-Save Hook for Profile Wizard
 * Debounced auto-save with 500ms delay to prevent excessive database writes
 */

import { useEffect, useRef, useState, useCallback } from 'react'
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
  const [retryCount, setRetryCount] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousDataRef = useRef<string>('')
  const maxRetries = 3

  // Store callback props in refs so they don't cause useMutation to recreate
  const onSaveSuccessRef = useRef(onSaveSuccess)
  const onSaveErrorRef = useRef(onSaveError)
  const retryCountRef = useRef(retryCount)
  const formDataRef = useRef(formData)
  const saveMutateRef = useRef<any>(null)

  // Update refs when values change
  onSaveSuccessRef.current = onSaveSuccess
  onSaveErrorRef.current = onSaveError
  retryCountRef.current = retryCount
  formDataRef.current = formData

  // Create stable callbacks using refs
  const handleSuccess = useCallback(() => {
    setIsSaving(false)
    setRetryCount(0) // Reset retry count on success
    retryCountRef.current = 0
    const now = new Date()
    setLastSaved(now)
    onSaveSuccessRef.current?.()
  }, [])  // Empty deps - completely stable!

  const handleError = useCallback((error: unknown) => {
    // Retry logic
    if (retryCountRef.current < maxRetries) {
      console.log(`Auto-save failed, retrying... (${retryCountRef.current + 1}/${maxRetries})`)
      setRetryCount(prev => {
        const newCount = prev + 1
        retryCountRef.current = newCount
        return newCount
      })
      // Retry after 1 second
      setTimeout(() => {
        saveMutateRef.current?.(formDataRef.current as any)
      }, 1000)
    } else {
      setIsSaving(false)
      setRetryCount(0)
      retryCountRef.current = 0
      onSaveErrorRef.current?.(error as Error)
    }
  }, [maxRetries])  // Only maxRetries in deps (constant)

  const saveDraftMutation = trpc.profile.saveDraft.useMutation({
    onSuccess: handleSuccess,
    onError: handleError,
  })

  // Keep ref updated with latest mutate function
  saveMutateRef.current = saveDraftMutation.mutate

  useEffect(() => {
    console.log('[useAutoSave] Effect triggered', { enabled, hasFormData: !!formData })

    if (!enabled) {
      console.log('[useAutoSave] Auto-save disabled')
      return
    }

    // Serialize current form data for comparison
    const currentData = JSON.stringify(formData)

    // Skip if data hasn't changed
    if (currentData === previousDataRef.current) {
      console.log('[useAutoSave] Data unchanged, skipping save')
      return
    }

    console.log('[useAutoSave] Data changed, scheduling save in', debounceMs, 'ms')

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new debounced save
    timeoutRef.current = setTimeout(() => {
      console.log('[useAutoSave] Executing save mutation')
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
  }, [formData, enabled, debounceMs, saveDraftMutation])

  return {
    isSaving,
    lastSaved,
    isError: saveDraftMutation.isError,
    error: saveDraftMutation.error,
  }
}
