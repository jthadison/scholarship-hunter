/**
 * Story 1.8: Academic Step - Academic Information Collection
 * Step 2: GPA, test scores, class rank (reuses AcademicProfileForm)
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AcademicStepContent } from './AcademicStepContent'
import { GraduationCap } from 'lucide-react'
import type { WizardFormData } from '@/modules/profile/hooks/useWizardStore'

interface AcademicStepProps {
  formData: WizardFormData
  onUpdate: (data: Partial<WizardFormData>) => void
}

export function AcademicStep({ formData, onUpdate }: AcademicStepProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Academic Information</h2>
        </div>
        <p className="text-muted-foreground">
          Share your academic achievements to match with merit-based scholarships
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Academic Profile</CardTitle>
          <CardDescription>
            Don't worry if you don't have test scores yet - you can add them later
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcademicStepContent
            defaultValues={{
              gpa: formData.gpa ?? undefined,
              gpaScale: formData.gpaScale ?? undefined,
              satScore: formData.satScore ?? undefined,
              actScore: formData.actScore ?? undefined,
              classRank: formData.classRank ?? undefined,
              classSize: formData.classSize ?? undefined,
              currentGrade: (formData.currentGrade ?? undefined) as any,
              graduationYear: formData.graduationYear ?? undefined,
            }}
            onChange={(data) => onUpdate(data)}
          />
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Students with complete academic profiles receive 2x more scholarship matches.
          Even if your GPA isn't perfect, many scholarships focus on other factors like leadership or community service.
        </p>
      </div>
    </div>
  )
}
