'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { trpc } from '@/shared/lib/trpc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react'

/**
 * Counselor Dashboard Page
 *
 * Main dashboard for counselors to monitor their students' scholarship progress.
 * Displays cohort analytics, student roster, and at-risk alerts.
 *
 * Story 5.6: Counselor Portal - Student Monitoring
 */
export default function CounselorDashboardPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()

  // Fetch cohort analytics
  const { data: analytics, isLoading: analyticsLoading } = trpc.counselor.getCohortAnalytics.useQuery()

  // Fetch student roster (first page)
  const { data: studentsData, isLoading: studentsLoading } = trpc.counselor.getStudents.useQuery({
    sortBy: 'atRisk',
    limit: 10,
    offset: 0,
  })

  useEffect(() => {
    // Redirect non-counselors
    if (isLoaded && user) {
      const userRole = user.publicMetadata?.role as string
      if (userRole !== 'COUNSELOR') {
        router.push('/dashboard')
      }
    }
  }, [isLoaded, user, router])

  if (!isLoaded || analyticsLoading || studentsLoading) {
    return <DashboardSkeleton />
  }

  const students = studentsData?.students || []
  const total = studentsData?.total || 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Counselor Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor student scholarship progress and provide targeted support
        </p>
      </div>

      {/* Cohort Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Students who granted you access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funding Secured</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((analytics?.totalFunding || 0) / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">
              Across all your students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.avgSuccessRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.avgApplicationsPerStudent.toFixed(1)} apps per student
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.atRiskCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Need intervention support
            </p>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Alert Banner */}
      {analytics && analytics.atRiskCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{analytics.atRiskCount}</strong> student(s) have at-risk applications this week.
            Review the student roster below for intervention recommendations.
          </AlertDescription>
        </Alert>
      )}

      {/* Student Roster Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Roster</CardTitle>
          <CardDescription>
            Showing {students.length} of {total} students (sorted by at-risk status)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No students yet</p>
              <p className="text-sm">
                Students will appear here once they grant you access to their data
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => router.push(`/counselor/students/${student.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{student.name}</h3>
                      {student.atRiskSeverity && (
                        <Badge
                          variant={
                            student.atRiskSeverity === 'HIGH'
                              ? 'destructive'
                              : student.atRiskSeverity === 'MEDIUM'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {student.atRiskCount} At Risk
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Profile Strength: {student.profileStrength.toFixed(0)}%</span>
                      <span>
                        Applications: {student.applicationsSubmitted}/{student.applicationsCount}
                      </span>
                      <span>Funding: ${student.fundingSecured.toLocaleString()}</span>
                      <span>Success: {student.successRate.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {student.atRiskSeverity === 'HIGH' ? (
                      <XCircle className="h-5 w-5 text-destructive" />
                    ) : student.atRiskSeverity ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note about permissions */}
      <Alert>
        <AlertDescription>
          You can only view students who have explicitly granted you access to their data.
          Students can revoke access at any time from their settings.
        </AlertDescription>
      </Alert>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
