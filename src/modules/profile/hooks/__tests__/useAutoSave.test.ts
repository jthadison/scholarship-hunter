import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAutoSave } from '../useAutoSave'
import type { WizardFormData } from '../useWizardStore'

// Mock tRPC
const mockMutate = vi.fn()
const mockUseMutation = vi.fn(() => ({
  mutate: mockMutate,
  isError: false,
  error: null,
}))

vi.mock('@/shared/lib/trpc', () => ({
  trpc: {
    profile: {
      saveDraft: {
        useMutation: mockUseMutation,
      },
    },
  },
}))

describe('useAutoSave - Critical Auto-Save Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mockFormData: WizardFormData = {
    gpa: 3.8,
    graduationYear: 2025,
    state: 'CA',
    citizenship: 'US Citizen',
  }

  // ============================================================================
  // Debouncing Tests
  // ============================================================================

  describe('Debouncing (500ms delay)', () => {
    it('should debounce saves with 500ms delay', async () => {
      // GIVEN: useAutoSave with default debounce (500ms)
      const { rerender } = renderHook(
        ({ formData }) => useAutoSave(formData, { enabled: true }),
        { initialProps: { formData: mockFormData } }
      )

      expect(mockMutate).not.toHaveBeenCalled()

      // WHEN: Fast forward 400ms (before debounce completes)
      vi.advanceTimersByTime(400)

      // THEN: No save triggered yet
      expect(mockMutate).not.toHaveBeenCalled()

      // WHEN: Fast forward another 100ms (total 500ms)
      vi.advanceTimersByTime(100)

      // THEN: Save mutation triggered exactly once
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1)
        expect(mockMutate).toHaveBeenCalledWith(mockFormData)
      })
    })

    it('should cancel pending save if data changes during debounce window', async () => {
      // GIVEN: Initial render with formData
      const { rerender } = renderHook(
        ({ formData }) => useAutoSave(formData, { enabled: true }),
        { initialProps: { formData: mockFormData } }
      )

      // WHEN: Fast forward 400ms
      vi.advanceTimersByTime(400)

      // THEN: No save yet
      expect(mockMutate).not.toHaveBeenCalled()

      // WHEN: Update formData (triggers new debounce)
      const updatedFormData = { ...mockFormData, gpa: 3.9 }
      rerender({ formData: updatedFormData })

      // WHEN: Fast forward 400ms (total 800ms from start, but only 400ms from update)
      vi.advanceTimersByTime(400)

      // THEN: Still no save (new debounce not complete)
      expect(mockMutate).not.toHaveBeenCalled()

      // WHEN: Fast forward final 100ms (500ms from update)
      vi.advanceTimersByTime(100)

      // THEN: Save triggered with UPDATED data only (first save canceled)
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1)
        expect(mockMutate).toHaveBeenCalledWith(updatedFormData)
      })
    })

    it('should support custom debounce delay', async () => {
      // GIVEN: useAutoSave with custom 1000ms debounce
      renderHook(() => useAutoSave(mockFormData, { enabled: true, debounceMs: 1000 }))

      // WHEN: Fast forward 500ms
      vi.advanceTimersByTime(500)

      // THEN: No save (custom debounce is 1000ms)
      expect(mockMutate).not.toHaveBeenCalled()

      // WHEN: Fast forward another 500ms (total 1000ms)
      vi.advanceTimersByTime(500)

      // THEN: Save triggered
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1)
      })
    })

    it('should not trigger save if data unchanged', async () => {
      // GIVEN: Initial render
      const { rerender } = renderHook(
        ({ formData }) => useAutoSave(formData, { enabled: true }),
        { initialProps: { formData: mockFormData } }
      )

      // Complete first save
      vi.advanceTimersByTime(500)
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1))

      mockMutate.mockClear()

      // WHEN: Re-render with SAME data
      rerender({ formData: mockFormData })
      vi.advanceTimersByTime(500)

      // THEN: No additional save (data unchanged)
      expect(mockMutate).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Retry Logic Tests
  // ============================================================================

  describe('Retry Logic (3 attempts)', () => {
    it('should retry failed saves up to 3 times', async () => {
      // GIVEN: saveDraft mutation that fails
      const onErrorCallback = vi.fn()
      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isError: true,
        error: new Error('Network error'),
      })

      renderHook(() =>
        useAutoSave(mockFormData, {
          enabled: true,
          onSaveError: onErrorCallback,
        })
      )

      // Trigger initial save
      vi.advanceTimersByTime(500)
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1))

      // Simulate error callback from mutation
      const mutationOptions = mockUseMutation.mock.calls[0]?.[0]
      if (mutationOptions?.onError) {
        mutationOptions.onError(new Error('Network error'), mockFormData, undefined)
      }

      // WHEN: Wait for retry delays (1s between retries)
      vi.advanceTimersByTime(1000)
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(2)) // Retry 1

      if (mutationOptions?.onError) {
        mutationOptions.onError(new Error('Network error'), mockFormData, undefined)
      }

      vi.advanceTimersByTime(1000)
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(3)) // Retry 2

      if (mutationOptions?.onError) {
        mutationOptions.onError(new Error('Network error'), mockFormData, undefined)
      }

      vi.advanceTimersByTime(1000)
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(4)) // Retry 3

      // THEN: After 3 retries, onSaveError called
      if (mutationOptions?.onError) {
        mutationOptions.onError(new Error('Network error'), mockFormData, undefined)
      }

      await waitFor(() => {
        expect(onErrorCallback).toHaveBeenCalledWith(expect.any(Error))
      })
    })

    it('should reset retry count on successful save', async () => {
      // GIVEN: Mutation that fails once then succeeds
      let callCount = 0
      const mockMutateWithRetry = vi.fn(() => {
        callCount++
      })

      mockUseMutation.mockReturnValue({
        mutate: mockMutateWithRetry,
        isError: false,
        error: null,
      })

      renderHook(() => useAutoSave(mockFormData, { enabled: true }))

      // Trigger save
      vi.advanceTimersByTime(500)
      await waitFor(() => expect(mockMutateWithRetry).toHaveBeenCalledTimes(1))

      // Simulate first error
      const mutationOptions = mockUseMutation.mock.calls[0]?.[0]
      if (mutationOptions?.onError) {
        mutationOptions.onError(new Error('Temporary error'), mockFormData, undefined)
      }

      // Wait for retry
      vi.advanceTimersByTime(1000)
      await waitFor(() => expect(mockMutateWithRetry).toHaveBeenCalledTimes(2))

      // WHEN: Second attempt succeeds
      if (mutationOptions?.onSuccess) {
        mutationOptions.onSuccess(undefined, mockFormData, undefined)
      }

      // THEN: Retry count reset (next error will retry 3 times again, not 2)
      // Simulate another error
      if (mutationOptions?.onError) {
        mutationOptions.onError(new Error('Another error'), mockFormData, undefined)
      }

      vi.advanceTimersByTime(1000)
      // Should retry again (retry count was reset)
      await waitFor(() => expect(mockMutateWithRetry).toHaveBeenCalledTimes(3))
    })

    it('should call onSaveError after max retries exhausted', async () => {
      // GIVEN: Mutation that always fails
      const onErrorCallback = vi.fn()
      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isError: true,
        error: new Error('Persistent error'),
      })

      renderHook(() =>
        useAutoSave(mockFormData, {
          enabled: true,
          onSaveError: onErrorCallback,
        })
      )

      // Trigger save + 3 retries
      vi.advanceTimersByTime(500)
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1))

      const mutationOptions = mockUseMutation.mock.calls[0]?.[0]

      // Exhaust all retries
      for (let i = 0; i < 3; i++) {
        if (mutationOptions?.onError) {
          mutationOptions.onError(new Error('Persistent error'), mockFormData, undefined)
        }
        vi.advanceTimersByTime(1000)
        await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(i + 2))
      }

      // Final error (max retries exhausted)
      if (mutationOptions?.onError) {
        mutationOptions.onError(new Error('Persistent error'), mockFormData, undefined)
      }

      // THEN: onSaveError callback invoked
      await waitFor(() => {
        expect(onErrorCallback).toHaveBeenCalledWith(expect.any(Error))
      })
    })
  })

  // ============================================================================
  // State Management Tests
  // ============================================================================

  describe('State Management', () => {
    it('should set isSaving=true during save operation', async () => {
      // GIVEN: useAutoSave hook
      const { result } = renderHook(() => useAutoSave(mockFormData, { enabled: true }))

      // Initial state
      expect(result.current.isSaving).toBe(false)

      // WHEN: Trigger save
      vi.advanceTimersByTime(500)

      // THEN: isSaving set to true
      await waitFor(() => {
        expect(result.current.isSaving).toBe(true)
      })
    })

    it('should update lastSaved timestamp on success', async () => {
      // GIVEN: Successful save
      const onSuccessCallback = vi.fn()
      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isError: false,
        error: null,
      })

      const { result } = renderHook(() =>
        useAutoSave(mockFormData, {
          enabled: true,
          onSaveSuccess: onSuccessCallback,
        })
      )

      // Initial state
      expect(result.current.lastSaved).toBeNull()

      // WHEN: Save completes successfully
      vi.advanceTimersByTime(500)
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1))

      const mutationOptions = mockUseMutation.mock.calls[0]?.[0]
      if (mutationOptions?.onSuccess) {
        mutationOptions.onSuccess(undefined, mockFormData, undefined)
      }

      // THEN: lastSaved updated to current timestamp
      await waitFor(() => {
        expect(result.current.lastSaved).toBeInstanceOf(Date)
        expect(onSuccessCallback).toHaveBeenCalled()
      })
    })

    it('should set isSaving=false after save completes', async () => {
      // GIVEN: Save operation
      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isError: false,
        error: null,
      })

      const { result } = renderHook(() => useAutoSave(mockFormData, { enabled: true }))

      // Trigger save
      vi.advanceTimersByTime(500)
      await waitFor(() => expect(result.current.isSaving).toBe(true))

      // WHEN: Save completes
      const mutationOptions = mockUseMutation.mock.calls[0]?.[0]
      if (mutationOptions?.onSuccess) {
        mutationOptions.onSuccess(undefined, mockFormData, undefined)
      }

      // THEN: isSaving back to false
      await waitFor(() => {
        expect(result.current.isSaving).toBe(false)
      })
    })

    it('should expose error state when mutation fails', async () => {
      // GIVEN: Failed mutation
      const testError = new Error('Save failed')
      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isError: true,
        error: testError,
      })

      const { result } = renderHook(() => useAutoSave(mockFormData, { enabled: true }))

      // THEN: Error state exposed
      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBe(testError)
    })
  })

  // ============================================================================
  // Enable/Disable Tests
  // ============================================================================

  describe('Enable/Disable', () => {
    it('should not save when enabled=false', async () => {
      // GIVEN: useAutoSave with enabled=false
      renderHook(() => useAutoSave(mockFormData, { enabled: false }))

      // WHEN: Wait for debounce period
      vi.advanceTimersByTime(500)

      // THEN: No save mutation triggered
      expect(mockMutate).not.toHaveBeenCalled()
    })

    it('should start saving when enabled changes from false to true', async () => {
      // GIVEN: Initially disabled
      const { rerender } = renderHook(
        ({ enabled }) => useAutoSave(mockFormData, { enabled }),
        { initialProps: { enabled: false } }
      )

      vi.advanceTimersByTime(500)
      expect(mockMutate).not.toHaveBeenCalled()

      // WHEN: Enable auto-save
      rerender({ enabled: true })
      vi.advanceTimersByTime(500)

      // THEN: Save triggered
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1)
      })
    })

    it('should stop saving when enabled changes from true to false', async () => {
      // GIVEN: Initially enabled
      const { rerender } = renderHook(
        ({ enabled }) => useAutoSave(mockFormData, { enabled }),
        { initialProps: { enabled: true } }
      )

      // Trigger first save
      vi.advanceTimersByTime(500)
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1))

      mockMutate.mockClear()

      // WHEN: Disable auto-save
      rerender({ enabled: false })

      // Update data (should not trigger save)
      const updatedFormData = { ...mockFormData, gpa: 3.9 }
      rerender({ enabled: false })

      vi.advanceTimersByTime(500)

      // THEN: No additional save
      expect(mockMutate).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should cleanup timeout on unmount', async () => {
      // GIVEN: Mounted hook with pending save
      const { unmount } = renderHook(() => useAutoSave(mockFormData, { enabled: true }))

      // Advance 400ms (pending save not complete)
      vi.advanceTimersByTime(400)

      // WHEN: Unmount before debounce completes
      unmount()

      // Fast forward past debounce
      vi.advanceTimersByTime(200)

      // THEN: Save should NOT trigger (cleanup executed)
      expect(mockMutate).not.toHaveBeenCalled()
    })

    it('should handle rapid formData updates correctly', async () => {
      // GIVEN: Rapid updates to formData
      const { rerender } = renderHook(
        ({ formData }) => useAutoSave(formData, { enabled: true }),
        { initialProps: { formData: mockFormData } }
      )

      // Update 1
      rerender({ formData: { ...mockFormData, gpa: 3.9 } })
      vi.advanceTimersByTime(200)

      // Update 2
      rerender({ formData: { ...mockFormData, gpa: 4.0 } })
      vi.advanceTimersByTime(200)

      // Update 3
      rerender({ formData: { ...mockFormData, gpa: 3.7 } })
      vi.advanceTimersByTime(200)

      // WHEN: Complete debounce after final update
      vi.advanceTimersByTime(300) // Total 500ms from last update

      // THEN: Only ONE save with final data
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1)
        expect(mockMutate).toHaveBeenCalledWith({ ...mockFormData, gpa: 3.7 })
      })
    })

    it('should handle empty formData object', async () => {
      // GIVEN: Empty formData
      const emptyData = {}

      renderHook(() => useAutoSave(emptyData, { enabled: true }))

      // WHEN: Debounce completes
      vi.advanceTimersByTime(500)

      // THEN: Save still triggered (backend should handle empty updates)
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(emptyData)
      })
    })
  })
})
