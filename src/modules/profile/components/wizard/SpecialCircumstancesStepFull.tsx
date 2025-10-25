/**
 * Story 1.8: Special Circumstances Step - Full implementation
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Shield } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import type { WizardFormData } from '@/modules/profile/hooks/useWizardStore'

interface SpecialCircumstancesStepProps {
  formData: WizardFormData
  onUpdate: (data: Partial<WizardFormData>) => void
}

export function SpecialCircumstancesStepFull({ formData, onUpdate }: SpecialCircumstancesStepProps) {
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
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="firstGeneration"
              checked={formData.firstGeneration ?? false}
              onCheckedChange={(checked) => onUpdate({ firstGeneration: checked === true })}
            />
            <Label htmlFor="firstGeneration" className="cursor-pointer">
              I am a first-generation college student (neither parent completed a 4-year degree)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalContext">
              Additional Context (optional)
            </Label>
            <Textarea
              id="additionalContext"
              placeholder="Share any other relevant information about your background, challenges overcome, or unique circumstances..."
              value={formData.additionalContext ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate({ additionalContext: e.target.value || null })}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              This helps scholarship committees understand your unique story
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <p className="text-sm text-indigo-900">
          <strong>Unique Opportunities:</strong> First-generation students and students with
          unique circumstances often qualify for dedicated scholarship programs with higher award amounts.
        </p>
      </div>
    </div>
  )
}
