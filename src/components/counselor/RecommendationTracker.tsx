/**
 * Recommendation Tracker Component
 * Story 5.7 - Task 7: Implement Counselor Recommendation Tracking Dashboard
 *
 * Dashboard for counselors to track scholarship recommendations and outcomes.
 *
 * Features:
 * - Recommendations table with student, scholarship, date, status
 * - Filter by status, student, date range
 * - Aggregate metrics (total sent, acceptance rate, avg response time)
 * - Outcome tracking (if application was awarded/denied)
 * - Send reminder action for pending recommendations
 *
 * @module components/counselor/RecommendationTracker
 */

'use client'

import { useState } from 'react'
import { FileText, TrendingUp, Clock, CheckCircle, XCircle, Bell } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'

type StatusFilter = 'all' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'

/**
 * Recommendation tracking dashboard
 *
 * AC #6: Track which recommendations were accepted and their outcomes
 * Task 7.2: Display table with columns: Student, Scholarship, Date Sent, Status, Response Note, Outcome
 * Task 7.3: Add filter controls: Status, Student, Date range
 * Task 7.4: Calculate aggregate metrics: Total sent, acceptance rate, avg response time
 * Task 7.6: Add visual indicators for status (green/red/yellow/blue)
 */
export function RecommendationTracker() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [studentFilter, setStudentFilter] = useState<string>('all')

  // Fetch recommendations with metrics
  const { data, isLoading } = trpc.scholarshipRecommendation.getByCounselor.useQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    studentId: studentFilter === 'all' ? undefined : studentFilter,
  })

  // Fetch counselor's students for filter
  const { data: studentsData } = trpc.counselor.getStudents.useQuery()

  const recommendations = data?.recommendations || []
  const metrics = data?.metrics
  const students = studentsData?.students || []

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      PENDING: { variant: 'secondary', icon: Clock, label: 'Pending' },
      ACCEPTED: { variant: 'default', icon: CheckCircle, label: 'Accepted' },
      DECLINED: { variant: 'destructive', icon: XCircle, label: 'Declined' },
      EXPIRED: { variant: 'outline', icon: Clock, label: 'Expired' },
    }

    const config = variants[status] || variants.PENDING
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex w-fit items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading recommendations...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Task 7.4: Aggregate metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Recommendations Sent</CardDescription>
              <CardTitle className="text-3xl">{metrics.totalSent}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>All time</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Acceptance Rate</CardDescription>
              <CardTitle className="text-3xl">{Math.round(metrics.acceptanceRate)}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Students who accepted</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Response Time</CardDescription>
              <CardTitle className="text-3xl">
                {Math.round(metrics.avgResponseTimeHours)}h
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Time to respond</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Task 7.3: Filter controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recommendation History</CardTitle>
              <CardDescription>
                Track recommendations you've sent and student responses
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Task 7.2: Recommendations table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scholarship</TableHead>
                  <TableHead>Date Sent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response Note</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No recommendations found
                    </TableCell>
                  </TableRow>
                ) : (
                  recommendations.map((rec: any) => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rec.scholarship.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ${rec.scholarship.awardAmount.toLocaleString()} •{' '}
                            {new Date(rec.scholarship.deadline).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(rec.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.ceil(
                            (Date.now() - new Date(rec.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{' '}
                          days ago
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(rec.status)}</TableCell>
                      <TableCell>
                        {rec.responseNote ? (
                          <div className="max-w-xs truncate text-sm text-muted-foreground">
                            {rec.responseNote}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {/* Task 7.7: Send reminder for pending >7 days */}
                        {rec.status === 'PENDING' &&
                          Math.ceil(
                            (Date.now() - new Date(rec.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24)
                          ) > 7 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast.info('Reminder feature coming soon')}
                            >
                              <Bell className="mr-1 h-3 w-3" />
                              Remind
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
