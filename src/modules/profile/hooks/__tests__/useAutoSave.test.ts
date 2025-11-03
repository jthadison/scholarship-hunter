import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAutoSave } from '../useAutoSave'
import type { WizardFormData } from '../useWizardStore'

// Mock tRPC - Must define mocks inside factory to avoid hoisting issues
vi.mock('@/shared/lib/trpc', () => {
  // Create mock functions inside the factory
  const mockMutateFn = vi.fn()

  // Store the latest mutation callbacks so tests can invoke them
  let mutationCallbacks: any = {}

  // Store whether to auto-trigger callbacks (default: true for simple tests)
  let autoTriggerCallbacks = true

  // Create a single stable mutation object that won't change between renders
  const stableMutationObject = {
    mutate: (...args: any[]) => {
      mockMutateFn(...args)

      // Auto-trigger onSuccess callback after mutate is called
      // This simulates the behavior of tRPC mutations in tests
      if (autoTriggerCallbacks && mutationCallbacks.onSuccess) {
        // Call success callback synchronously for simplicity in tests
        // Real tRPC would call this after the async operation completes
        mutationCallbacks.onSuccess(undefined, args[0], undefined)
      }
    },
    isError: false,
    error: null,
  }

  const mockUseMutationFn = vi.fn((options: any) => {
    // Capture the callbacks passed to useMutation
    mutationCallbacks = options || {}
    return stableMutationObject
  })

  return {
    trpc: {
      profile: {
        saveDraft: {
          useMutation: mockUseMutationFn,
        },
      },
    },
    // Export mocks so tests can access them
    __mockMutateFn: mockMutateFn,
    __mockUseMutationFn: mockUseMutationFn,
    __getMutationCallbacks: () => mutationCallbacks,
    __setAutoTriggerCallbacks: (value: boolean) => { autoTriggerCallbacks = value },
  }
})

// Import the mocks from the mocked module
const { __mockMutateFn, __mockUseMutationFn, __getMutationCallbacks, __setAutoTriggerCallbacks } = await import('@/shared/lib/trpc') as any
// Create aliases for easier use in tests
const mockMutateFn = __mockMutateFn
const mockUseMutationFn = __mockUseMutationFn
const getMutationCallbacks = __getMutationCallbacks
const setAutoTriggerCallbacks = __setAutoTriggerCallbacks

describe('useAutoSave - Critical Auto-Save Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    setAutoTriggerCallbacks(true) // Enable auto-trigger by default
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
    it('should debounce saves with 500ms delay', () => {
      // GIVEN: useAutoSave with default debounce (500ms)
      const { rerender } = renderHook(
        ({ formData }) => useAutoSave(formData, { enabled: true }),
        { initialProps: { formData: mockFormData } }
      )

      expect(mockMutateFn).not.toHaveBeenCalled()

      // WHEN: Fast forward 400ms (before debounce completes)
      act(() => {
        vi.advanceTimersByTime(400)
      })

      // THEN: No save triggered yet
      expect(mockMutateFn).not.toHaveBeenCalled()

      // WHEN: Fast forward another 100ms (total 500ms)
      // This will trigger the mutation which will auto-call onSuccess
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // THEN: Save mutation triggered exactly once
      expect(mockMutateFn).toHaveBeenCalledTimes(1)
      expect(mockMutateFn).toHaveBeenCalledWith(mockFormData)
    })

    it('should cancel pending save if data changes during debounce window', async () => {
      // GIVEN: Initial render with formData
      const { rerender } = renderHook(
        ({ formData }) => useAutoSave(formData, { enabled: true }),
        { initialProps: { formData: mockFormData } }
      )

      // WHEN: Fast forward 400ms
      act(() => {
        vi.advanceTimersByTime(400)
      })

      // THEN: No save yet
      expect(mockMutateFn).not.toHaveBeenCalled()

      // WHEN: Update formData (triggers new debounce)
      const updatedFormData = { ...mockFormData, gpa: 3.9 }
      rerender({ formData: updatedFormData })

      // WHEN: Fast forward 400ms (total 800ms from start, but only 400ms from update)
      act(() => {
        vi.advanceTimersByTime(400)
      })

      // THEN: Still no save (new debounce not complete)
      expect(mockMutateFn).not.toHaveBeenCalled()

      // WHEN: Fast forward final 100ms (500ms from update)
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // THEN: Save triggered with UPDATED data only (first save canceled)
      expect(mockMutateFn).toHaveBeenCalledTimes(1)
      expect(mockMutateFn).toHaveBeenCalledWith(updatedFormData)
    })

    it('should support custom debounce delay', async () => {
      // GIVEN: useAutoSave with custom 1000ms debounce
      renderHook(() => useAutoSave(mockFormData, { enabled: true, debounceMs: 1000 }))

      // WHEN: Fast forward 500ms
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // THEN: No save (custom debounce is 1000ms)
      expect(mockMutateFn).not.toHaveBeenCalled()

      // WHEN: Fast forward another 500ms (total 1000ms)
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // THEN: Save triggered
      expect(mockMutateFn).toHaveBeenCalledTimes(1)
    })

    it('should not trigger save if data unchanged', async () => {
      // GIVEN: Initial render
      const { rerender } = renderHook(
        ({ formData }) => useAutoSave(formData, { enabled: true }),
        { initialProps: { formData: mockFormData } }
      )

      // Complete first save
      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(mockMutateFn).toHaveBeenCalledTimes(1)

      mockMutateFn.mockClear()

      // WHEN: Re-render with SAME data
      rerender({ formData: mockFormData })
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // THEN: No additional save (data unchanged)
      expect(mockMutateFn).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Retry Logic Tests
  // ============================================================================

  describe('Retry Logic (3 attempts)', () => {
    it('should retry failed saves up to 3 times', () => {
      // Disable auto-trigger for this test - we'll manually trigger error callbacks
      setAutoTriggerCallbacks(false)

      // GIVEN: saveDraft mutation that fails
      const onErrorCallback = vi.fn()

      const { rerender } = renderHook(() =>
        useAutoSave(mockFormData, {
          enabled: true,
          onSaveError: onErrorCallback,
        })
      )

      const callbacks = getMutationCallbacks()

      // Trigger initial save
      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(mockMutateFn).toHaveBeenCalledTimes(1)

      // Simulate error callback from mutation
      act(() => {
        callbacks?.onError(new Error('Network error'), mockFormData, undefined)
      })

      // WHEN: Wait for retry delays (1s between retries)
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(mockMutateFn).toHaveBeenCalledTimes(2) // Retry 1

      act(() => {
        callbacks?.onError(new Error('Network error'), mockFormData, undefined)
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(mockMutateFn).toHaveBeenCalledTimes(3) // Retry 2

      act(() => {
        callbacks?.onError(new Error('Network error'), mockFormData, undefined)
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(mockMutateFn).toHaveBeenCalledTimes(4) // Retry 3

      // THEN: After 3 retries, onSaveError called
      act(() => {
        callbacks?.onError(new Error('Network error'), mockFormData, undefined)
      })

      expect(onErrorCallback).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should reset retry count on successful save', () => {
      // Disable auto-trigger for this test - we'll manually trigger callbacks
      setAutoTriggerCallbacks(false)

      // GIVEN: Mutation that fails once then succeeds
      const { rerender } = renderHook(() => useAutoSave(mockFormData, { enabled: true }))

      const callbacks = getMutationCallbacks()

      // Trigger save
      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(mockMutateFn).toHaveBeenCalledTimes(1)

      // Simulate first error
      act(() => {
        callbacks?.onError(new Error('Temporary error'), mockFormData, undefined)
      })

      // Wait for retry
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(mockMutateFn).toHaveBeenCalledTimes(2)

      // WHEN: Second attempt succeeds
      act(() => {
        callbacks?.onSuccess(undefined, mockFormData, undefined)
      })

      // THEN: Retry count reset (next error will retry 3 times again, not 2)
      // Simulate another error
      act(() => {
        callbacks?.onError(new Error('Another error'), mockFormData, undefined)
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })
      // Should retry again (retry count was reset)
      expect(mockMutateFn).toHaveBeenCalledTimes(3)
    })

    it('should call onSaveError after max retries exhausted', () => {
      // Disable auto-trigger for this test - we'll manually trigger error callbacks
      setAutoTriggerCallbacks(false)

      // GIVEN: Mutation that always fails
      const onErrorCallback = vi.fn()

      const { rerender } = renderHook(() =>
        useAutoSave(mockFormData, {
          enabled: true,
          onSaveError: onErrorCallback,
        })
      )

      const callbacks = getMutationCallbacks()

      // Trigger save + 3 retries
      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(mockMutateFn).toHaveBeenCalledTimes(1)

      // Exhaust all retries
      for (let i = 0; i < 3; i++) {
        act(() => {
          callbacks?.onError(new Error('Persistent error'), mockFormData, undefined)
        })
        act(() => {
          vi.advanceTimersByTime(1000)
        })
        expect(mockMutateFn).toHaveBeenCalledTimes(i + 2)
      }

      // Final error (max retries exhausted)
      act(() => {
        callbacks?.onError(new Error('Persistent error'), mockFormData, undefined)
      })

      // THEN: onSaveError callback invoked
      expect(onErrorCallback).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  // ============================================================================
  // State Management Tests
  // ============================================================================

  describe('State Management', () => {
    it('should set isSaving=true during save operation', () => {
      // Disable auto-trigger so we can check isSaving during the save operation
      setAutoTriggerCallbacks(false)

      // GIVEN: useAutoSave hook
      const { result } = renderHook(() => useAutoSave(mockFormData, { enabled: true }))

      // Initial state
      expect(result.current.isSaving).toBe(false)

      // WHEN: Trigger save (without auto-trigger, callback won't be called)
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // THEN: isSaving set to true (and stays true since callback not called yet)
      expect(result.current.isSaving).toBe(true)
    })

    it('should update lastSaved timestamp on success', () => {
      // This test just verifies that auto-trigger updates lastSaved timestamp
      const onSuccessCallback = vi.fn()

      const { result } = renderHook(() =>
        useAutoSave(mockFormData, {
          enabled: true,
          onSaveSuccess: onSuccessCallback,
        })
      )

      // Initial state
      expect(result.current.lastSaved).toBeNull()

      // WHEN: Save completes successfully (auto-trigger will call onSuccess)
      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(mockMutateFn).toHaveBeenCalledTimes(1)

      // THEN: lastSaved updated to current timestamp (by auto-triggered onSuccess)
      expect(result.current.lastSaved).toBeInstanceOf(Date)
      expect(onSuccessCallback).toHaveBeenCalled()
    })

    it('should set isSaving=false after save completes', () => {
      // GIVEN: Save operation
      const { result } = renderHook(() => useAutoSave(mockFormData, { enabled: true }))

      // Trigger save (auto-trigger will immediately call onSuccess)
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // THEN: isSaving back to false (auto-triggered onSuccess already called)
      expect(result.current.isSaving).toBe(false)
    })

    it('should expose error state when mutation fails', async () => {
      // GIVEN: Failed mutation
      const testError = new Error('Save failed')
      mockUseMutationFn.mockReturnValue({
        mutate: mockMutateFn,
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
      expect(mockMutateFn).not.toHaveBeenCalled()
    })

    it('should start saving when enabled changes from false to true', async () => {
      // GIVEN: Initially disabled
      const { rerender } = renderHook(
        ({ enabled }) => useAutoSave(mockFormData, { enabled }),
        { initialProps: { enabled: false } }
      )

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(mockMutateFn).not.toHaveBeenCalled()

      // WHEN: Enable auto-save
      rerender({ enabled: true })
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // THEN: Save triggered
      expect(mockMutateFn).toHaveBeenCalledTimes(1)
    })

    it('should stop saving when enabled changes from true to false', async () => {
      // GIVEN: Initially enabled
      const { rerender } = renderHook(
        ({ enabled }) => useAutoSave(mockFormData, { enabled }),
        { initialProps: { enabled: true } }
      )

      // Trigger first save
      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(mockMutateFn).toHaveBeenCalledTimes(1)

      mockMutateFn.mockClear()

      // WHEN: Disable auto-save
      rerender({ enabled: false })

      // Update data (should not trigger save)
      const updatedFormData = { ...mockFormData, gpa: 3.9 }
      rerender({ enabled: false })

      act(() => {
        vi.advanceTimersByTime(500)
      })

      // THEN: No additional save
      expect(mockMutateFn).not.toHaveBeenCalled()
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
      expect(mockMutateFn).not.toHaveBeenCalled()
    })

    it('should handle rapid formData updates correctly', async () => {
      // GIVEN: Rapid updates to formData
      const { rerender } = renderHook(
        ({ formData }) => useAutoSave(formData, { enabled: true }),
        { initialProps: { formData: mockFormData } }
      )

      // Update 1
      rerender({ formData: { ...mockFormData, gpa: 3.9 } })
      act(() => {
        vi.advanceTimersByTime(200)
      })

      // Update 2
      rerender({ formData: { ...mockFormData, gpa: 4.0 } })
      act(() => {
        vi.advanceTimersByTime(200)
      })

      // Update 3
      rerender({ formData: { ...mockFormData, gpa: 3.7 } })
      act(() => {
        vi.advanceTimersByTime(200)
      })

      // WHEN: Complete debounce after final update
      act(() => {
        vi.advanceTimersByTime(300) // Total 500ms from last update
      })

      // THEN: Only ONE save with final data
      expect(mockMutateFn).toHaveBeenCalledTimes(1)
      expect(mockMutateFn).toHaveBeenCalledWith({ ...mockFormData, gpa: 3.7 })
    })

    it('should handle empty formData object', async () => {
      // GIVEN: Empty formData
      const emptyData = {}

      renderHook(() => useAutoSave(emptyData, { enabled: true }))

      // WHEN: Debounce completes
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // THEN: Save still triggered (backend should handle empty updates)
      expect(mockMutateFn).toHaveBeenCalledWith(emptyData)
    })
  })
})
