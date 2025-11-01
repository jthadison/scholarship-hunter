/**
 * Recommendation Modal Component
 * Story 5.7 - Task 4: Build Recommendation Action UI
 *
 * Modal for counselors to recommend scholarships to students (single or bulk).
 *
 * Features:
 * - Single student or multi-student selection
 * - Counselor note input (500 char limit)
 * - Scholarship summary display
 * - Match score display (if student selected)
 * - Form validation
 * - Success confirmation
 *
 * @module components/counselor/RecommendationModal
 */

'use client'

import { useState } from 'react'
import { Send, Users, User, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { trpc } from '@/shared/lib/trpc'
import { toast } from 'sonner'

export interface RecommendationModalProps {
  /** Scholarship being recommended */
  scholarship: {
    id: string
    name: string
    provider: string
    awardAmount: number
    deadline: Date
    matchScore?: number
  }
  /** Available students to recommend to */
  students: Array<{
    id: string
    firstName: string
    lastName: string
    profileStrength?: number
    matchScore?: number
  }>
  /** Whether modal is open */
  open: boolean
  /** Callback to close modal */
  onClose: () => void
  /** Callback after successful recommendation */
  onSuccess?: () => void
}

/**
 * Modal for creating scholarship recommendations
 *
 * AC #2: Recommendation action: Select scholarship + student → "Recommend this scholarship to [Student Name]"
 * AC #4: Counselor can add note explaining why this scholarship is good fit
 * AC #7: Bulk recommendations: Recommend same scholarship to multiple students at once
 */
export function RecommendationModal({
  scholarship,
  students,
  open,
  onClose,
  onSuccess,
}: RecommendationModalProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [note, setNote] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const utils = trpc.useUtils()

  // Mutation for single recommendation
  const createRecommendation = trpc.scholarshipRecommendation.create.useMutation({
    onSuccess: () => {
      setShowSuccess(true)
      utils.scholarshipRecommendation.getByCounselor.invalidate()
      setTimeout(() => {
        handleClose()
        onSuccess?.()
      }, 2000)
    },
    onError: (error: { message: string }) => {
      toast.error(error.message)
    },
  })

  // Mutation for bulk recommendations
  const createBulkRecommendation = trpc.scholarshipRecommendation.createBulk.useMutation({
    onSuccess: (data: { created: number }) => {
      setShowSuccess(true)
      utils.scholarshipRecommendation.getByCounselor.invalidate()
      toast.success(`${data.created} recommendation(s) sent successfully`)
      setTimeout(() => {
        handleClose()
        onSuccess?.()
      }, 2000)
    },
    onError: (error: { message: string }) => {
      toast.error(error.message)
    },
  })

  const handleClose = () => {
    setMode('single')
    setSelectedStudentId('')
    setSelectedStudentIds(new Set())
    setNote('')
    setShowSuccess(false)
    onClose()
  }

  const handleToggleStudent = (studentId: string) => {
    const newSet = new Set(selectedStudentIds)
    if (newSet.has(studentId)) {
      newSet.delete(studentId)
    } else {
      newSet.add(studentId)
    }
    setSelectedStudentIds(newSet)
  }

  const handleSubmit = () => {
    if (mode === 'single') {
      if (!selectedStudentId) {
        toast.error('Please select a student')
        return
      }

      createRecommendation.mutate({
        studentId: selectedStudentId,
        scholarshipId: scholarship.id,
        note: note || undefined,
      })
    } else {
      if (selectedStudentIds.size === 0) {
        toast.error('Please select at least one student')
        return
      }

      createBulkRecommendation.mutate({
        studentIds: Array.from(selectedStudentIds),
        scholarshipId: scholarship.id,
        note: note || undefined,
      })
    }
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId)
  const isLoading = createRecommendation.isPending || createBulkRecommendation.isPending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {showSuccess ? (
          // Task 4.8: Success confirmation
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Send className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="mb-2">Recommendation Sent!</DialogTitle>
            <DialogDescription className="text-center">
              {mode === 'single'
                ? `Recommendation sent to ${selectedStudent?.firstName} ${selectedStudent?.lastName}. They will be notified via email and in-app.`
                : `Recommendations sent to ${selectedStudentIds.size} student(s). They will be notified via email and in-app.`}
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Recommend Scholarship</DialogTitle>
              <DialogDescription>
                Recommend this scholarship to your students. They will receive an email and
                in-app notification.
              </DialogDescription>
            </DialogHeader>

            {/* Task 4.5: Scholarship summary */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="font-semibold">{scholarship.name}</h4>
              <p className="text-sm text-muted-foreground">{scholarship.provider}</p>
              <div className="mt-2 flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Award: </span>
                  <span className="font-medium">
                    ${scholarship.awardAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Deadline: </span>
                  <span className="font-medium">
                    {new Date(scholarship.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Task 4.8: Single/Bulk mode toggle */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'single' | 'bulk')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Single Student
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Multiple Students
                </TabsTrigger>
              </TabsList>

              {/* Single student mode */}
              <TabsContent value="single" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-select">Select Student</Label>
                  <select
                    id="student-select"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">Choose a student...</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                        {student.matchScore
                          ? ` - Match: ${Math.round(student.matchScore)}%`
                          : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStudent?.matchScore && (
                  <div className="rounded-lg border bg-blue-50 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">
                        Match Score: {Math.round(selectedStudent.matchScore)}%
                      </Badge>
                      <span className="text-muted-foreground">
                        This scholarship is a{' '}
                        {selectedStudent.matchScore >= 80
                          ? 'strong'
                          : selectedStudent.matchScore >= 60
                            ? 'good'
                            : 'moderate'}{' '}
                        fit for {selectedStudent.firstName}
                      </span>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Bulk student mode */}
              <TabsContent value="bulk" className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Students ({selectedStudentIds.size} selected)</Label>
                  <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border p-4">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between space-x-2"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={selectedStudentIds.has(student.id)}
                            onCheckedChange={() => handleToggleStudent(student.id)}
                          />
                          <label
                            htmlFor={`student-${student.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {student.firstName} {student.lastName}
                          </label>
                        </div>
                        {student.matchScore && (
                          <Badge variant="outline" className="text-xs">
                            Match: {Math.round(student.matchScore)}%
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedStudentIds.size > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This scholarship will be recommended to {selectedStudentIds.size}{' '}
                      student(s). Each will receive an email and in-app notification.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>

            {/* Task 4.4: Counselor note textarea */}
            <div className="space-y-2">
              <Label htmlFor="note">
                Why is this scholarship a good fit? <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., This scholarship aligns perfectly with your interest in renewable energy and your strong GPA."
                maxLength={500}
                rows={4}
                className="resize-none"
              />
              <div className="text-right text-xs text-muted-foreground">
                {note.length}/500 characters
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {mode === 'single'
                      ? 'Send Recommendation'
                      : `Send to ${selectedStudentIds.size} Student(s)`}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
