/**
 * Story 1.8: Review Step - Final review before submission
 * Step 6: Summary of all entered data, completeness %, strength score preview
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Edit,
  GraduationCap,
  Users,
  BookOpen,
  Heart,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'
import type { WizardFormData } from '@/modules/profile/hooks/useWizardStore'

interface ReviewStepProps {
  formData: WizardFormData
  completenessPercentage?: number
  strengthScore?: number
  missingRequired?: string[]
  onEditStep: (step: number) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function ReviewStep({
  formData,
  completenessPercentage = 0,
  strengthScore = 0,
  missingRequired = [],
  onEditStep,
  onSubmit,
  isSubmitting
}: ReviewStepProps) {
  const hasRequiredFields = missingRequired.length === 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Review Your Profile</h2>
        <p className="text-muted-foreground">
          Double-check your information before submitting
        </p>
      </div>

      {/* Profile Strength & Completeness */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Profile Completeness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{completenessPercentage}%</span>
                <Badge variant={completenessPercentage >= 80 ? 'default' : 'secondary'}>
                  {completenessPercentage >= 80 ? 'Excellent' : completenessPercentage >= 60 ? 'Good' : 'Getting Started'}
                </Badge>
              </div>
              <Progress value={completenessPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Profile Strength Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{strengthScore}</span>
                <Badge variant={strengthScore >= 70 ? 'default' : strengthScore >= 50 ? 'secondary' : 'outline'}>
                  {strengthScore >= 70 ? 'Strong' : strengthScore >= 50 ? 'Moderate' : 'Developing'}
                </Badge>
              </div>
              <Progress value={strengthScore} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missing Required Fields Warning */}
      {!hasRequiredFields && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Missing Required Fields</h3>
                <p className="text-sm text-amber-800 mt-1">
                  Please complete the following required fields to submit your profile:
                </p>
                <ul className="text-sm text-amber-800 mt-2 space-y-1">
                  {missingRequired.map((field) => (
                    <li key={field}>• {field}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Academic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle>Academic Information</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(1)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {formData.gpa && <div><strong>GPA:</strong> {formData.gpa} / {formData.gpaScale ?? 4.0}</div>}
          {formData.satScore && <div><strong>SAT:</strong> {formData.satScore}</div>}
          {formData.actScore && <div><strong>ACT:</strong> {formData.actScore}</div>}
          {formData.graduationYear && <div><strong>Graduation Year:</strong> {formData.graduationYear}</div>}
          {formData.currentGrade && <div><strong>Current Grade:</strong> {formData.currentGrade}</div>}
          {formData.classRank && formData.classSize && (
            <div><strong>Class Rank:</strong> {formData.classRank} of {formData.classSize}</div>
          )}
          {!formData.gpa && !formData.satScore && !formData.actScore && (
            <p className="text-muted-foreground italic">No academic information provided yet</p>
          )}
        </CardContent>
      </Card>

      {/* Demographics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Demographics & Location</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(2)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {formData.gender && <div><strong>Gender:</strong> {formData.gender}</div>}
          {formData.ethnicity && <div><strong>Ethnicity:</strong> {formData.ethnicity}</div>}
          {formData.state && <div><strong>State:</strong> {formData.state}</div>}
          {formData.city && <div><strong>City:</strong> {formData.city}</div>}
          {formData.citizenshipStatus && <div><strong>Citizenship:</strong> {formData.citizenshipStatus}</div>}
          {formData.financialNeedLevel && <div><strong>Financial Need:</strong> {formData.financialNeedLevel}</div>}
          {!formData.gender && !formData.state && (
            <p className="text-muted-foreground italic">No demographic information provided yet</p>
          )}
        </CardContent>
      </Card>

      {/* Major & Experience */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>Major & Activities</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(3)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {formData.intendedMajor && <div><strong>Intended Major:</strong> {formData.intendedMajor}</div>}
          {formData.fieldOfStudy && <div><strong>Field of Study:</strong> {formData.fieldOfStudy}</div>}
          {formData.careerGoals && <div><strong>Career Goals:</strong> {formData.careerGoals}</div>}
          {(formData.extracurriculars?.length ?? 0) > 0 && (
            <div><strong>Extracurriculars:</strong> {formData.extracurriculars?.length} activities</div>
          )}
          {!formData.intendedMajor && (
            <p className="text-muted-foreground italic">No major or field information provided yet</p>
          )}
        </CardContent>
      </Card>

      {/* Special Circumstances */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <CardTitle>Special Circumstances</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(4)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {formData.firstGeneration !== null && formData.firstGeneration !== undefined && (
            <div><strong>First-Generation College Student:</strong> {formData.firstGeneration ? 'Yes' : 'No'}</div>
          )}
          {formData.militaryAffiliation && <div><strong>Military Affiliation:</strong> {formData.militaryAffiliation}</div>}
          {formData.disabilities && <div><strong>Disabilities:</strong> Disclosed</div>}
          {formData.additionalContext && <div><strong>Additional Context:</strong> Provided</div>}
          {formData.firstGeneration === null && !formData.militaryAffiliation && !formData.disabilities && (
            <p className="text-muted-foreground italic">No special circumstances provided (all optional)</p>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={!hasRequiredFields || isSubmitting}
          className="px-8"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Profile'}
        </Button>
      </div>

      {!hasRequiredFields && (
        <p className="text-center text-sm text-muted-foreground">
          Complete all required fields to submit your profile
        </p>
      )}
    </div>
  )
}
