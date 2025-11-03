import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useWizardStore } from '../useWizardStore'
import type { WizardStep, WizardFormData } from '../useWizardStore'

describe('useWizardStore - Wizard State Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    // Reset store to initial state
    const { result } = renderHook(() => useWizardStore())
    act(() => {
      result.current.resetWizard()
    })
  })

  // ============================================================================
  // Navigation Tests
  // ============================================================================

  describe('Navigation', () => {
    it('should start at step 0 (Welcome)', () => {
      // GIVEN: Fresh wizard
      const { result } = renderHook(() => useWizardStore())

      // THEN: Starts at step 0
      expect(result.current.currentStep).toBe(0)
    })

    it('should advance to next step', () => {
      // GIVEN: Wizard at step 1
      const { result } = renderHook(() => useWizardStore())
      act(() => {
        result.current.goToStep(1)
      })

      // WHEN: nextStep called
      act(() => {
        result.current.nextStep()
      })

      // THEN: currentStep increments to 2
      expect(result.current.currentStep).toBe(2)
    })

    it('should not advance beyond step 5 (Review)', () => {
      // GIVEN: Wizard at final step (5)
      const { result } = renderHook(() => useWizardStore())
      act(() => {
        result.current.goToStep(5)
      })

      // WHEN: nextStep called
      act(() => {
        result.current.nextStep()
      })

      // THEN: currentStep remains 5 (boundary check)
      expect(result.current.currentStep).toBe(5)
    })

    it('should go back to previous step', () => {
      // GIVEN: Wizard at step 3
      const { result } = renderHook(() => useWizardStore())
      act(() => {
        result.current.goToStep(3)
      })

      // WHEN: prevStep called
      act(() => {
        result.current.prevStep()
      })

      // THEN: currentStep decrements to 2
      expect(result.current.currentStep).toBe(2)
    })

    it('should not go back below step 0', () => {
      // GIVEN: Wizard at step 0
      const { result } = renderHook(() => useWizardStore())

      // WHEN: prevStep called
      act(() => {
        result.current.prevStep()
      })

      // THEN: currentStep remains 0 (boundary check)
      expect(result.current.currentStep).toBe(0)
    })

    it('should jump to specific step via goToStep', () => {
      // GIVEN: Wizard at step 1
      const { result } = renderHook(() => useWizardStore())
      act(() => {
        result.current.goToStep(1)
      })

      // WHEN: Jump to step 4
      act(() => {
        result.current.goToStep(4 as WizardStep)
      })

      // THEN: currentStep is 4
      expect(result.current.currentStep).toBe(4)
    })

    it('should allow jumping back to earlier step (edit mode)', () => {
      // GIVEN: Wizard at Review step (5)
      const { result } = renderHook(() => useWizardStore())
      act(() => {
        result.current.goToStep(5)
      })

      // WHEN: Jump back to Academic step (1) to edit
      act(() => {
        result.current.goToStep(1)
      })

      // THEN: currentStep is 1
      expect(result.current.currentStep).toBe(1)
    })
  })

  // ============================================================================
  // Form Data Management Tests
  // ============================================================================

  describe('Form Data Management', () => {
    it('should start with empty formData', () => {
      // GIVEN: Fresh wizard
      const { result } = renderHook(() => useWizardStore())

      // THEN: formData is empty object
      expect(result.current.formData).toEqual({})
    })

    it('should merge partial updates with existing formData', () => {
      // GIVEN: Existing formData with GPA
      const { result } = renderHook(() => useWizardStore())
      act(() => {
        result.current.updateFormData({ gpa: 3.5 })
      })

      // WHEN: Add SAT score
      act(() => {
        result.current.updateFormData({ satScore: 1450 })
      })

      // THEN: Both fields present
      expect(result.current.formData).toEqual({
        gpa: 3.5,
        satScore: 1450,
      })
    })

    it('should overwrite fields on update', () => {
      // GIVEN: formData with GPA=3.5
      const { result } = renderHook(() => useWizardStore())
      act(() => {
        result.current.updateFormData({ gpa: 3.5 })
      })

      // WHEN: Update GPA to 3.8
      act(() => {
        result.current.updateFormData({ gpa: 3.8 })
      })

      // THEN: GPA updated to new value
      expect(result.current.formData.gpa).toBe(3.8)
    })

    it('should handle null values in updates', () => {
      // GIVEN: formData with SAT score
      const { result } = renderHook(() => useWizardStore())
      act(() => {
        result.current.updateFormData({ satScore: 1450 })
      })

      // WHEN: Clear SAT score (set to null)
      act(() => {
        result.current.updateFormData({ satScore: null })
      })

      // THEN: satScore is null
      expect(result.current.formData.satScore).toBeNull()
    })

    it('should handle array fields (ethnicity, extracurriculars)', () => {
      // GIVEN: Empty formData
      const { result } = renderHook(() => useWizardStore())

      // WHEN: Add ethnicity array
      act(() => {
        result.current.updateFormData({
          ethnicity: ['Asian', 'White/Caucasian'],
        })
      })

      // THEN: Array stored correctly
      expect(result.current.formData.ethnicity).toEqual(['Asian', 'White/Caucasian'])
    })

    it('should handle complex nested objects (extracurriculars)', () => {
      // GIVEN: Empty formData
      const { result } = renderHook(() => useWizardStore())

      const extracurriculars = [
        {
          name: 'Debate Club',
          category: 'Academic Clubs',
          hoursPerWeek: 5,
          yearsInvolved: 2,
        },
      ]

      // WHEN: Add extracurriculars
      act(() => {
        result.current.updateFormData({ extracurriculars })
      })

      // THEN: Complex object stored correctly
      expect(result.current.formData.extracurriculars).toEqual(extracurriculars)
    })

    it('should handle multiple field updates in single call', () => {
      // GIVEN: Empty formData
      const { result } = renderHook(() => useWizardStore())

      // WHEN: Update multiple fields at once
      act(() => {
        result.current.updateFormData({
          gpa: 3.8,
          satScore: 1450,
          graduationYear: 2025,
          state: 'CA',
        })
      })

      // THEN: All fields updated
      expect(result.current.formData).toEqual({
        gpa: 3.8,
        satScore: 1450,
        graduationYear: 2025,
        state: 'CA',
      })
    })
  })

  // ============================================================================
  // Completed Steps Tracking Tests
  // ============================================================================

  describe('Completed Steps Tracking', () => {
    it('should start with no completed steps', () => {
      // GIVEN: Fresh wizard
      const { result } = renderHook(() => useWizardStore())

      // THEN: completedSteps is empty
      expect(result.current.completedSteps).toEqual([])
    })

    it('should mark step as completed', () => {
      // GIVEN: Empty completedSteps
      const { result } = renderHook(() => useWizardStore())

      // WHEN: Mark step 1 as completed
      act(() => {
        result.current.markStepCompleted(1)
      })

      // THEN: completedSteps contains 1
      expect(result.current.completedSteps).toEqual([1])
    })

    it('should not duplicate completed steps', () => {
      // GIVEN: Step 1 already completed
      const { result } = renderHook(() => useWizardStore())
      act(() => {
        result.current.markStepCompleted(1)
      })

      // WHEN: Mark step 1 as completed again
      act(() => {
        result.current.markStepCompleted(1)
      })

      // THEN: completedSteps still has only one entry
      expect(result.current.completedSteps).toEqual([1])
    })

    it('should sort completed steps in ascending order', () => {
      // GIVEN: Steps completed out of order
      const { result } = renderHook(() => useWizardStore())

      // WHEN: Complete steps 3, 1, 2
      act(() => {
        result.current.markStepCompleted(3)
        result.current.markStepCompleted(1)
        result.current.markStepCompleted(2)
      })

      // THEN: completedSteps sorted [1, 2, 3]
      expect(result.current.completedSteps).toEqual([1, 2, 3])
    })

    it('should allow marking step 0 (Welcome) as completed', () => {
      // GIVEN: Fresh wizard
      const { result } = renderHook(() => useWizardStore())

      // WHEN: Mark welcome step as completed
      act(() => {
        result.current.markStepCompleted(0)
      })

      // THEN: Step 0 in completedSteps
      expect(result.current.completedSteps).toContain(0)
    })

    it('should allow marking step 5 (Review) as completed', () => {
      // GIVEN: Wizard at review step
      const { result } = renderHook(() => useWizardStore())

      // WHEN: Mark review step as completed
      act(() => {
        result.current.markStepCompleted(5)
      })

      // THEN: Step 5 in completedSteps
      expect(result.current.completedSteps).toContain(5)
    })
  })

  // ============================================================================
  // Last Saved Timestamp Tests
  // ============================================================================

  describe('Last Saved Timestamp', () => {
    it('should start with lastSaved=null', () => {
      // GIVEN: Fresh wizard
      const { result } = renderHook(() => useWizardStore())

      // THEN: lastSaved is null
      expect(result.current.lastSaved).toBeNull()
    })

    it('should update lastSaved timestamp', () => {
      // GIVEN: Wizard store
      const { result } = renderHook(() => useWizardStore())

      const now = new Date()

      // WHEN: Set lastSaved
      act(() => {
        result.current.setLastSaved(now)
      })

      // THEN: lastSaved updated
      expect(result.current.lastSaved).toBe(now)
    })

    it('should allow updating lastSaved multiple times', () => {
      // GIVEN: Wizard with previous save timestamp
      const { result } = renderHook(() => useWizardStore())

      const time1 = new Date('2025-01-01T12:00:00Z')
      const time2 = new Date('2025-01-01T12:05:00Z')

      act(() => {
        result.current.setLastSaved(time1)
      })

      // WHEN: Update lastSaved again
      act(() => {
        result.current.setLastSaved(time2)
      })

      // THEN: lastSaved is newer timestamp
      expect(result.current.lastSaved).toBe(time2)
    })
  })

  // ============================================================================
  // Persistence Tests (localStorage)
  // ============================================================================

  describe('Persistence (localStorage)', () => {
    it('should persist state to localStorage', () => {
      // GIVEN: Wizard with state
      const { result } = renderHook(() => useWizardStore())

      act(() => {
        result.current.goToStep(2)
        result.current.updateFormData({ gpa: 3.8, graduationYear: 2025 })
        result.current.markStepCompleted(1)
      })

      // WHEN: Check localStorage
      const stored = localStorage.getItem('profile-wizard-storage')

      // THEN: State persisted with correct key
      expect(stored).toBeTruthy()

      const parsedState = JSON.parse(stored!)
      expect(parsedState.state.currentStep).toBe(2)
      expect(parsedState.state.formData.gpa).toBe(3.8)
      expect(parsedState.state.completedSteps).toContain(1)
    })

    it('should restore state from localStorage on mount', async () => {
      // GIVEN: First render to initialize store, then set data
      let { result, unmount } = renderHook(() => useWizardStore())

      act(() => {
        result.current.goToStep(3)
        result.current.updateFormData({ gpa: 3.9, satScore: 1500 })
        result.current.markStepCompleted(1)
        result.current.markStepCompleted(2)
      })

      // Unmount to simulate page close
      unmount()

      // WHEN: Remount (simulates page reload - should restore from localStorage)
      const { result: newResult } = renderHook(() => useWizardStore())

      // THEN: State restored from localStorage
      expect(newResult.current.currentStep).toBe(3)
      expect(newResult.current.formData.gpa).toBe(3.9)
      expect(newResult.current.formData.satScore).toBe(1500)
      expect(newResult.current.completedSteps).toEqual([1, 2])
    })

    it('should partialize state correctly (exclude actions)', () => {
      // GIVEN: Wizard with full state
      const { result } = renderHook(() => useWizardStore())

      act(() => {
        result.current.goToStep(1)
        result.current.updateFormData({ gpa: 3.7 })
      })

      // WHEN: Check localStorage
      const stored = localStorage.getItem('profile-wizard-storage')
      const parsedState = JSON.parse(stored!)

      // THEN: Only state persisted, NOT actions
      expect(parsedState.state).toHaveProperty('currentStep')
      expect(parsedState.state).toHaveProperty('formData')
      expect(parsedState.state).toHaveProperty('completedSteps')
      expect(parsedState.state).toHaveProperty('lastSaved')

      // Actions should NOT be in localStorage
      expect(parsedState.state).not.toHaveProperty('nextStep')
      expect(parsedState.state).not.toHaveProperty('prevStep')
      expect(parsedState.state).not.toHaveProperty('updateFormData')
    })

    it('should survive page refresh (persistence)', () => {
      // GIVEN: First render with data
      let { result, unmount } = renderHook(() => useWizardStore())

      act(() => {
        result.current.goToStep(4)
        result.current.updateFormData({ gpa: 4.0 })
        result.current.markStepCompleted(3)
      })

      // Unmount (simulates page close)
      unmount()

      // WHEN: Remount (simulates page reload)
      const { result: newResult } = renderHook(() => useWizardStore())

      // THEN: State restored from localStorage
      expect(newResult.current.currentStep).toBe(4)
      expect(newResult.current.formData.gpa).toBe(4.0)
      expect(newResult.current.completedSteps).toContain(3)
    })
  })

  // ============================================================================
  // Reset Tests
  // ============================================================================

  describe('Reset Wizard', () => {
    it('should reset wizard to initial state', () => {
      // GIVEN: Wizard with data at step 5
      const { result } = renderHook(() => useWizardStore())

      act(() => {
        result.current.goToStep(5)
        result.current.updateFormData({
          gpa: 3.8,
          satScore: 1450,
          graduationYear: 2025,
        })
        result.current.markStepCompleted(1)
        result.current.markStepCompleted(2)
        result.current.setLastSaved(new Date())
      })

      // WHEN: Reset wizard
      act(() => {
        result.current.resetWizard()
      })

      // THEN: All state reset to initial
      expect(result.current.currentStep).toBe(0)
      expect(result.current.formData).toEqual({})
      expect(result.current.completedSteps).toEqual([])
      expect(result.current.lastSaved).toBeNull()
    })

    it('should clear localStorage on reset', () => {
      // GIVEN: Wizard with persisted data
      const { result } = renderHook(() => useWizardStore())

      act(() => {
        result.current.updateFormData({ gpa: 3.8 })
      })

      expect(localStorage.getItem('profile-wizard-storage')).toBeTruthy()

      // WHEN: Reset wizard
      act(() => {
        result.current.resetWizard()
      })

      // THEN: localStorage cleared (or contains initial state)
      const stored = localStorage.getItem('profile-wizard-storage')
      if (stored) {
        const parsedState = JSON.parse(stored)
        expect(parsedState.state.currentStep).toBe(0)
        expect(parsedState.state.formData).toEqual({})
      }
    })

    it('should allow restarting wizard after reset', () => {
      // GIVEN: Reset wizard
      const { result } = renderHook(() => useWizardStore())

      act(() => {
        result.current.updateFormData({ gpa: 3.8 })
        result.current.resetWizard()
      })

      // WHEN: Start filling wizard again
      act(() => {
        result.current.goToStep(1)
        result.current.updateFormData({ gpa: 3.9 })
      })

      // THEN: Wizard works correctly
      expect(result.current.currentStep).toBe(1)
      expect(result.current.formData.gpa).toBe(3.9)
    })
  })

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle concurrent updates to formData', () => {
      // GIVEN: Wizard store
      const { result } = renderHook(() => useWizardStore())

      // WHEN: Multiple rapid updates
      act(() => {
        result.current.updateFormData({ gpa: 3.5 })
        result.current.updateFormData({ satScore: 1400 })
        result.current.updateFormData({ gpa: 3.8 }) // Update GPA again
        result.current.updateFormData({ actScore: 32 })
      })

      // THEN: All updates applied correctly
      expect(result.current.formData).toEqual({
        gpa: 3.8, // Last GPA update
        satScore: 1400,
        actScore: 32,
      })
    })

    it('should handle undefined values in formData', () => {
      // GIVEN: formData with undefined
      const { result } = renderHook(() => useWizardStore())

      // WHEN: Update with undefined
      act(() => {
        result.current.updateFormData({ gpa: undefined })
      })

      // THEN: Undefined stored (Zustand allows it)
      expect(result.current.formData.gpa).toBeUndefined()
    })

    it('should handle empty updates gracefully', () => {
      // GIVEN: Existing formData
      const { result } = renderHook(() => useWizardStore())

      act(() => {
        result.current.updateFormData({ gpa: 3.8 })
      })

      // WHEN: Update with empty object
      act(() => {
        result.current.updateFormData({})
      })

      // THEN: Existing data preserved
      expect(result.current.formData.gpa).toBe(3.8)
    })
  })
})
