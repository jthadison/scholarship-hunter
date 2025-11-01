/**
 * Counselor Scholarship Search Component
 * Story 5.7 - Task 3: Scholarship Search with Student Profile Filtering
 *
 * Enables counselors to search scholarships filtered by student eligibility.
 * Uses matching algorithm from Epic 2 to show match scores for selected students.
 *
 * Features:
 * - Student profile filter dropdown
 * - Multi-student filtering
 * - Match score display per student
 * - Sort by match score, award amount, deadline
 * - Integration with recommendation action
 *
 * @module components/counselor/CounselorScholarshipSearch
 */

'use client'

import { useState } from 'react'
import { Search, Users, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc'

export interface CounselorScholarshipSearchProps {
  /** Callback when recommendation action is triggered */
  onRecommend?: (scholarshipId: string, studentId: string) => void
}

type SortOption = 'matchScore' | 'awardAmount' | 'deadline' | 'strategicValue'

/**
 * Counselor scholarship search with student eligibility filtering
 *
 * AC #1: Counselor can search scholarship database filtered by student profiles
 * AC #1: Filter by student eligibility dropdown
 * AC #1: Display scholarships with match scores and priority tiers
 */
export function CounselorScholarshipSearch({
  onRecommend,
}: CounselorScholarshipSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('matchScore')

  // Fetch counselor's students
  const { data: studentsData } = trpc.counselor.getStudents.useQuery()

  // Fetch scholarships with optional student filtering
  // TODO: Create tRPC endpoint for counselor scholarship search with student filtering
  // const { data: scholarshipsData, isLoading } = trpc.scholarshipRecommendation.searchForStudent.useQuery(
  //   {
  //     studentId: selectedStudentId || undefined,
  //     query: searchQuery,
  //     sortBy,
  //   },
  //   { enabled: !!selectedStudentId }
  // )

  const students = studentsData?.students || []

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId === 'all' ? null : studentId)
  }

  return (
    <div className="space-y-6">
      {/* Search header */}
      <Card>
        <CardHeader>
          <CardTitle>Scholarship Search for Students</CardTitle>
          <CardDescription>
            Search scholarships and filter by student profile to find the best matches for
            your students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Task 3.2: Student filter dropdown */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search scholarships..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={selectedStudentId || 'all'} onValueChange={handleStudentChange}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <SelectValue placeholder="Filter by student" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scholarships</SelectItem>
                {students.map((student: any) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                    {student.profileStrength && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Strength: {student.profileStrength}/100)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task 3.6: Sort controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sort by:</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matchScore">Match Score</SelectItem>
                  <SelectItem value="awardAmount">Award Amount</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="strategicValue">Strategic Value</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Task 3.7: Search performance indicator */}
            {selectedStudentId && (
              <Badge variant="secondary">
                Showing matches for{' '}
                {students.find((s: any) => s.id === selectedStudentId)?.firstName || 'Student'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results placeholder - will be implemented with actual search endpoint */}
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {!selectedStudentId
            ? 'Select a student to see scholarship matches'
            : 'Scholarship results will appear here'}
        </p>
      </div>
    </div>
  )
}
