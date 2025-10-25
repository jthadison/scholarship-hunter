/**
 * Story 1.8: Profile Wizard State Management
 * Zustand store for managing wizard navigation and form data
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5

export interface WizardFormData {
  // Academic fields
  gpa?: number | null
  gpaScale?: number | null
  satScore?: number | null
  actScore?: number | null
  classRank?: number | null
  classSize?: number | null
  currentGrade?: string | null
  graduationYear?: number | null

  // Demographics
  gender?: string | null
  ethnicity?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  citizenshipStatus?: string | null

  // Financial need
  financialNeedLevel?: string | null
  pellGrantEligible?: boolean | null
  efc?: number | null

  // Major & field of study
  intendedMajor?: string | null
  fieldOfStudy?: string | null
  careerGoals?: string | null

  // Experience
  extracurriculars?: any[]
  workExperience?: any[]
  leadershipRoles?: any[]
  awardsHonors?: any[]

  // Special circumstances
  firstGeneration?: boolean | null
  militaryAffiliation?: string | null
  disabilities?: string | null
  additionalContext?: string | null
}

interface WizardState {
  // Current step (0-5)
  currentStep: WizardStep

  // Form data for all steps
  formData: WizardFormData

  // Completed steps tracking
  completedSteps: WizardStep[]

  // Last save timestamp
  lastSaved: Date | null

  // Actions
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: WizardStep) => void
  updateFormData: (data: Partial<WizardFormData>) => void
  markStepCompleted: (step: WizardStep) => void
  setLastSaved: (timestamp: Date) => void
  resetWizard: () => void
}

const initialState = {
  currentStep: 0 as WizardStep,
  formData: {},
  completedSteps: [],
  lastSaved: null,
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      ...initialState,

      nextStep: () => {
        const { currentStep } = get()
        if (currentStep < 5) {
          set({ currentStep: (currentStep + 1) as WizardStep })
        }
      },

      prevStep: () => {
        const { currentStep } = get()
        if (currentStep > 0) {
          set({ currentStep: (currentStep - 1) as WizardStep })
        }
      },

      goToStep: (step: WizardStep) => {
        set({ currentStep: step })
      },

      updateFormData: (data: Partial<WizardFormData>) => {
        set((state) => ({
          formData: {
            ...state.formData,
            ...data,
          },
        }))
      },

      markStepCompleted: (step: WizardStep) => {
        set((state) => {
          if (!state.completedSteps.includes(step)) {
            return {
              completedSteps: [...state.completedSteps, step].sort(),
            }
          }
          return state
        })
      },

      setLastSaved: (timestamp: Date) => {
        set({ lastSaved: timestamp })
      },

      resetWizard: () => {
        set(initialState)
      },
    }),
    {
      name: 'profile-wizard-storage', // localStorage key
      partialize: (state) => ({
        currentStep: state.currentStep,
        formData: state.formData,
        completedSteps: state.completedSteps,
        lastSaved: state.lastSaved,
      }),
    }
  )
)
