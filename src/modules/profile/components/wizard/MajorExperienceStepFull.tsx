/**
 * Story 1.8: Major & Experience Step - Full implementation with simplified content
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { WizardFormData } from '@/modules/profile/hooks/useWizardStore'

interface MajorExperienceStepProps {
  formData: WizardFormData
  onUpdate: (data: Partial<WizardFormData>) => void
}

export function MajorExperienceStepFull({ formData, onUpdate }: MajorExperienceStepProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Major & Experience</h2>
        </div>
        <p className="text-muted-foreground">
          Your academic interests and activities help match field-specific scholarships
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Academic Interests</CardTitle>
          <CardDescription>
            What do you plan to study in college?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="intendedMajor">
              Intended Major <span className="text-destructive">*</span>
            </Label>
            <Input
              id="intendedMajor"
              placeholder="e.g., Computer Science, Biology, Business Administration"
              value={formData.intendedMajor ?? ''}
              onChange={(e) => onUpdate({ intendedMajor: e.target.value || null })}
            />
            <p className="text-sm text-muted-foreground">
              Required - helps match you with field-specific scholarships
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="careerGoals">Career Goals (optional)</Label>
            <Input
              id="careerGoals"
              placeholder="e.g., Software Engineer, Doctor, Entrepreneur"
              value={formData.careerGoals ?? ''}
              onChange={(e) => onUpdate({ careerGoals: e.target.value || null })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          <strong>Tip:</strong> Specifying your intended major unlocks field-specific scholarships
          that may have less competition than general scholarships.
        </p>
      </div>
    </div>
  )
}
