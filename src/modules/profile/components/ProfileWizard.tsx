/**
 * Story 1.8: Profile Wizard Main Component
 * Orchestrates 6-step wizard flow with navigation, auto-save, and progress tracking
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { trpc } from '@/shared/lib/trpc'
import { useWizardStore } from '../hooks/useWizardStore'
import { useAutoSave } from '../hooks/useAutoSave'
import type { WizardStep } from '../hooks/useWizardStore'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Code splitting: Lazy load wizard steps to reduce initial bundle size
const WelcomeStep = dynamic(() => import('./wizard/WelcomeStep').then(mod => ({ default: mod.WelcomeStep })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
})
const AcademicStep = dynamic(() => import('./wizard/AcademicStep').then(mod => ({ default: mod.AcademicStep })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
})
const DemographicsStepFull = dynamic(() => import('./wizard/DemographicsStepFull').then(mod => ({ default: mod.DemographicsStepFull })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
})
const MajorExperienceStepSimple = dynamic(() => import('./wizard/MajorExperienceStepSimple').then(mod => ({ default: mod.MajorExperienceStepSimple })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
})
const SpecialCircumstancesStepSimple = dynamic(() => import('./wizard/SpecialCircumstancesStepSimple').then(mod => ({ default: mod.SpecialCircumstancesStepSimple })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
})
const ReviewStep = dynamic(() => import('./wizard/ReviewStep').then(mod => ({ default: mod.ReviewStep })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
})
import { formatDistanceToNow } from 'date-fns'
import { toast } from '@/hooks/use-toast'

const STEP_NAMES = [
  'Welcome',
  'Academic',
  'Demographics',
  'Major & Experience',
  'Special Circumstances',
  'Review'
]

interface ProfileWizardProps {
  isEditMode?: boolean
}

export function ProfileWizard({ isEditMode = false }: ProfileWizardProps) {
  const router = useRouter()
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    currentStep,
    formData,
    nextStep,
    prevStep,
    goToStep,
    updateFormData,
    markStepCompleted,
    setLastSaved,
    resetWizard
  } = useWizardStore()

  // Keyboard navigation: Enter = Next, Escape = Save & Exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input/textarea
      const target = e.target as HTMLElement
      const isFormElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'

      if (isFormElement) return

      if (e.key === 'Enter' && currentStep > 0 && currentStep < 5) {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'Escape' && currentStep > 0 && currentStep < 5) {
        e.preventDefault()
        handleSaveAndExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, formData]) // Re-attach when step or data changes

  // Fetch existing profile if in edit mode
  const { data: existingProfile, isLoading: isLoadingProfile } = trpc.profile.get.useQuery(undefined, {
    enabled: isEditMode,
  })

  // Load existing profile data into wizard
  useEffect(() => {
    if (isEditMode && existingProfile) {
      updateFormData({
        gpa: existingProfile.gpa,
        gpaScale: existingProfile.gpaScale,
        satScore: existingProfile.satScore,
        actScore: existingProfile.actScore,
        classRank: existingProfile.classRank,
        classSize: existingProfile.classSize,
        currentGrade: existingProfile.currentGrade,
        graduationYear: existingProfile.graduationYear,
        gender: existingProfile.gender,
        ethnicity: existingProfile.ethnicity,
        city: existingProfile.city,
        state: existingProfile.state,
        zipCode: existingProfile.zipCode,
        citizenship: existingProfile.citizenship,
        financialNeed: existingProfile.financialNeed,
        pellGrantEligible: existingProfile.pellGrantEligible,
        efcRange: existingProfile.efcRange,
        intendedMajor: existingProfile.intendedMajor,
        fieldOfStudy: existingProfile.fieldOfStudy,
        careerGoals: existingProfile.careerGoals,
        extracurriculars: existingProfile.extracurriculars as any,
        workExperience: existingProfile.workExperience as any,
        leadershipRoles: existingProfile.leadershipRoles as any,
        awardsHonors: existingProfile.awardsHonors as any,
        firstGeneration: existingProfile.firstGeneration,
        militaryAffiliation: existingProfile.militaryAffiliation,
        disabilities: existingProfile.disabilities,
        additionalContext: existingProfile.additionalContext,
      })
    }
  }, [isEditMode, existingProfile, updateFormData])

  // Auto-save functionality
  const { isSaving, lastSaved } = useAutoSave(formData, {
    enabled: currentStep > 0 && currentStep < 5, // Don't auto-save on Welcome or Review
    onSaveSuccess: () => {
      const now = new Date()
      setLastSaved(now)
    },
    onSaveError: () => {
      toast({
        title: 'Auto-save failed',
        description: 'Your changes were not saved. Please try again.',
        variant: 'destructive',
      })
    },
  })

  // Get completeness data for Review step
  const { data: completenessData } = trpc.profile.getCompleteness.useQuery(undefined, {
    enabled: currentStep === 5,
  })

  // Get strength score for Review step
  const { data: strengthData } = trpc.profile.getStrengthBreakdown.useQuery(undefined, {
    enabled: currentStep === 5,
  })

  // Create/update mutation
  const createMutation = trpc.profile.create.useMutation()
  const updateMutation = trpc.profile.update.useMutation()

  // Validation for each step
  const validateStep = (step: WizardStep): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    switch (step) {
      case 1: // Academic
        // Required: graduationYear
        if (!formData.graduationYear) {
          errors.push('Graduation year is required')
        }
        break
      case 2: // Demographics
        // Required: citizenship, state
        if (!formData.citizenship) {
          errors.push('Citizenship status is required')
        }
        if (!formData.state) {
          errors.push('State is required')
        }
        break
      case 3: // Major & Experience
        // Required: intendedMajor
        if (!formData.intendedMajor) {
          errors.push('Intended major is required')
        }
        break
      case 4: // Special Circumstances
        // All optional - no validation needed
        break
      default:
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  const handleNext = () => {
    // Validate current step before advancing (steps 1-4)
    if (currentStep > 0 && currentStep < 5) {
      const validation = validateStep(currentStep as WizardStep)

      if (!validation.isValid) {
        // Show validation errors
        validation.errors.forEach(error => {
          toast({
            title: 'Validation Error',
            description: error,
            variant: 'destructive',
          })
        })
        return // Don't advance if validation fails
      }

      markStepCompleted(currentStep as any)
    }
    nextStep()
  }

  const handleBack = () => {
    prevStep()
  }

  const handleSaveAndExit = async () => {
    toast({
      title: 'Progress saved',
      description: 'You can continue your profile anytime from the dashboard.',
    })
    router.push('/dashboard')
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      if (isEditMode) {
        // Cast to any to bypass type mismatch - WizardFormData is superset of profile schema
        await updateMutation.mutateAsync(formData as any)
        toast({
          title: 'Profile updated!',
          description: 'Your profile has been successfully updated.',
        })
      } else {
        // Cast to any to bypass type mismatch - WizardFormData is superset of profile schema
        await createMutation.mutateAsync(formData as any)
        toast({
          title: 'Profile created!',
          description: 'Your profile has been successfully created. Let\'s find you some scholarships!',
        })
      }

      // Clear wizard state
      resetWizard()

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'There was an error submitting your profile. Please try again.',
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const progressPercentage = ((currentStep + 1) / 6) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Header */}
      {currentStep > 0 && (
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="container max-w-4xl mx-auto py-4 px-4">
            <div className="space-y-3">
              {/* Step indicator */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Step {currentStep} of 5: {STEP_NAMES[currentStep]}
                </span>
                {lastSaved && (
                  <span className="text-muted-foreground flex items-center gap-2">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <Progress value={progressPercentage} className="h-2" />

              {/* Step dots */}
              <div className="flex justify-between">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`flex flex-col items-center gap-1 ${
                      step === currentStep ? 'text-primary' : step < currentStep ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                        step === currentStep
                          ? 'bg-primary text-primary-foreground border-primary'
                          : step < currentStep
                          ? 'bg-primary/20 border-primary'
                          : 'bg-background border-muted'
                      }`}
                    >
                      {step < currentStep ? '✓' : step}
                    </div>
                    <span className="text-xs hidden md:block">{STEP_NAMES[step]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {currentStep === 0 && (
          <WelcomeStep
            studentName={user?.firstName ?? undefined}
            onGetStarted={handleNext}
          />
        )}

        {currentStep === 1 && (
          <AcademicStep
            formData={formData}
            onUpdate={updateFormData}
          />
        )}

        {currentStep === 2 && (
          <DemographicsStepFull
            formData={formData}
            onUpdate={updateFormData}
          />
        )}

        {currentStep === 3 && (
          <MajorExperienceStepSimple
            formData={formData}
            onUpdate={updateFormData}
          />
        )}

        {currentStep === 4 && (
          <SpecialCircumstancesStepSimple
            formData={formData}
            onUpdate={updateFormData}
          />
        )}

        {currentStep === 5 && (
          <ReviewStep
            formData={formData}
            completenessPercentage={completenessData?.completionPercentage}
            strengthScore={strengthData?.overallScore}
            missingRequired={completenessData?.missingRequired}
            onEditStep={(step: number) => goToStep(step as WizardStep)}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Navigation Footer */}
      {currentStep > 0 && currentStep < 5 && (
        <div className="sticky bottom-0 bg-background border-t">
          <div className="container max-w-4xl mx-auto py-4 px-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <Button
                variant="ghost"
                onClick={handleSaveAndExit}
              >
                <Save className="h-4 w-4 mr-2" />
                Save & Continue Later
              </Button>

              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
