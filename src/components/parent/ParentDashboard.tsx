'use client'

import { useState } from 'react'
import { trpc } from '@/shared/lib/trpc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, FileText, Clock, AlertTriangle, Users } from 'lucide-react'
import { EncouragementBanner } from './EncouragementBanner'
import { formatCurrency } from '@/lib/utils'

/**
 * Parent Dashboard Component
 *
 * Main dashboard showing student scholarship progress with parent-friendly language.
 * Story 5.8: Parent/Guardian View - Task 4 (Parent Portal Dashboard)
 */
export function ParentDashboard() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')

  // Fetch accessible students
  const { data: accessibleStudents, isLoading: studentsLoading } =
    trpc.parents.getAccessibleStudents.useQuery()

  // Set initial student ID when data loads
  if (accessibleStudents && accessibleStudents.length > 0 && !selectedStudentId) {
    setSelectedStudentId(accessibleStudents[0].studentId)
  }

  // Fetch student data for selected student
  const { data: studentData, isLoading: dataLoading } = trpc.parents.getStudentData.useQuery(
    { studentId: selectedStudentId },
    { enabled: !!selectedStudentId }
  )

  if (studentsLoading) {
    return <DashboardSkeleton />
  }

  if (!accessibleStudents || accessibleStudents.length === 0) {
    return (
      <Alert>
        <Users className="h-4 w-4" />
        <AlertTitle>No Students Accessible</AlertTitle>
        <AlertDescription>
          You don't have access to any student accounts yet. Ask your student to grant you access
          from their Settings page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Student Selector (if multiple children) */}
      {accessibleStudents.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Label className="text-sm font-medium mb-2">Select Student</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessibleStudents.map((access) => (
                      <SelectItem key={access.studentId} value={access.studentId}>
                        Student {access.studentId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {dataLoading ? (
        <DashboardSkeleton />
      ) : studentData ? (
        <>
          {/* Encouragement Banner */}
          <EncouragementBanner
            studentName={studentData.student.firstName}
            fundingSecured={studentData.fundingSummary.totalFundingSecured}
            awardsCount={studentData.fundingSummary.awardsCount}
          />

          {/* Funding Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Funding Secured</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(studentData.fundingSummary.totalFundingSecured)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {studentData.fundingSummary.awardsCount} scholarship
                  {studentData.fundingSummary.awardsCount !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Awards Received</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentData.fundingSummary.awardsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {studentData.fundingSummary.denialsCount} applications not selected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {studentData.applicationPipeline.inProgress}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {studentData.applicationPipeline.submitted} submitted and pending
                </p>
              </CardContent>
            </Card>
          </div>

          {/* At-Risk Applications Alert */}
          {studentData.atRiskApplications.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Attention Needed</AlertTitle>
              <AlertDescription>
                {studentData.atRiskApplications.length} application
                {studentData.atRiskApplications.length !== 1 ? 's' : ''} may need your student's
                attention with upcoming deadlines.
                <div className="mt-2 space-y-2">
                  {studentData.atRiskApplications.map((app) => (
                    <div key={app.applicationId} className="text-sm">
                      <span className="font-medium">{app.scholarshipName}</span> - Due in{' '}
                      {app.daysRemaining} day{app.daysRemaining !== 1 ? 's' : ''} (
                      {app.progressPercentage}% complete)
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Application Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle>Application Progress</CardTitle>
              <CardDescription>Current scholarship applications your student is working on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Total Applications</p>
                    <p className="text-xs text-muted-foreground">Overall scholarship opportunities</p>
                  </div>
                  <div className="text-2xl font-bold">{studentData.applicationPipeline.totalApplications}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <p className="text-sm text-muted-foreground">Working on</p>
                    <p className="text-xl font-semibold">{studentData.applicationPipeline.inProgress}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="text-xl font-semibold">{studentData.applicationPipeline.submitted}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-muted-foreground">Awarded</p>
                    <p className="text-xl font-semibold text-green-600">
                      {studentData.applicationPipeline.awarded}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-muted-foreground">Not selected</p>
                    <p className="text-xl font-semibold">{studentData.applicationPipeline.denied}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Next 5 scholarship deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              {studentData.upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming deadlines at this time
                </p>
              ) : (
                <div className="space-y-3">
                  {studentData.upcomingDeadlines.map((deadline) => (
                    <div
                      key={deadline.applicationId}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{deadline.scholarshipName}</p>
                        <p className="text-xs text-muted-foreground">
                          {getParentFriendlyStatus(deadline.status)} • {deadline.progressPercentage}% complete
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {deadline.deadline && new Date(deadline.deadline).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {deadline.deadline &&
                            `${Math.ceil(
                              (new Date(deadline.deadline).getTime() - new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            )} days away`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Read-Only Notice */}
          <Alert>
            <AlertDescription className="text-xs">
              This is a read-only view. Your student manages their applications independently. You
              can encourage and support them in their scholarship journey!
            </AlertDescription>
          </Alert>
        </>
      ) : (
        <Alert>
          <AlertDescription>Unable to load student data. Please try again later.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/**
 * Convert technical status to parent-friendly language
 */
function getParentFriendlyStatus(status: string): string {
  const statusMap: Record<string, string> = {
    NOT_STARTED: 'Not started yet',
    TODO: 'Planning to work on',
    IN_PROGRESS: 'Working on it',
    READY_FOR_REVIEW: 'Almost ready',
    SUBMITTED: 'Submitted',
    AWAITING_DECISION: 'Waiting for decision',
    AWARDED: 'Awarded',
    DENIED: 'Not selected',
    WAITLISTED: 'Waitlisted',
    WITHDRAWN: 'Withdrawn',
  }
  return statusMap[status] || status
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
