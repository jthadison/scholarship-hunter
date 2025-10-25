/**
 * Story 1.8: Special Circumstances Step
 * Step 5: First-generation, military affiliation, disabilities, additional context
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SpecialCircumstancesForm } from '../SpecialCircumstancesForm'
import { Heart, Shield } from 'lucide-react'
import type { WizardFormData } from '@/modules/profile/hooks/useWizardStore'

interface SpecialCircumstancesStepProps {
  formData: WizardFormData
  onUpdate: (data: Partial<WizardFormData>) => void
}

export function SpecialCircumstancesStep({ formData, onUpdate }: SpecialCircumstancesStepProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Special Circumstances</h2>
        </div>
        <p className="text-muted-foreground">
          Many scholarships are specifically designed for students with unique backgrounds
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-amber-700 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-900">
            <strong>All fields are optional.</strong> Only share what you're comfortable with.
            Your information is kept strictly confidential and used solely to match you with relevant scholarships.
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Background & Circumstances</CardTitle>
          <CardDescription>
            Sharing these details can unlock specialized scholarship opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SpecialCircumstancesForm
            initialData={{
              firstGeneration: formData.firstGeneration ?? undefined,
              militaryAffiliation: formData.militaryAffiliation ?? undefined,
              disabilities: formData.disabilities ?? undefined,
              additionalContext: formData.additionalContext ?? undefined,
            }}
            onChange={(data) => onUpdate(data)}
          />
        </CardContent>
      </Card>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <p className="text-sm text-indigo-900">
          <strong>Unique Opportunities:</strong> First-generation students, military families, and students with
          disabilities often qualify for dedicated scholarship programs with higher award amounts and better odds.
        </p>
      </div>
    </div>
  )
}
