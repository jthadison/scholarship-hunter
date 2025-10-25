/**
 * Story 1.8: Major & Experience Step - Simplified
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'
import type { WizardFormData } from '@/modules/profile/hooks/useWizardStore'

interface MajorExperienceStepProps {
  formData: WizardFormData
  onUpdate: (data: Partial<WizardFormData>) => void
}

export function MajorExperienceStepSimple({ }: MajorExperienceStepProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Major & Experience</h2>
        </div>
        <p className="text-muted-foreground">
          Your academic interests and activities
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Academic Interests</CardTitle>
          <CardDescription>
            Major and field of study form will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Major/Experience form integration pending</p>
        </CardContent>
      </Card>
    </div>
  )
}
