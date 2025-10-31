'use client'

import { useState } from 'react'
import { trpc } from '@/shared/lib/trpc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Bell, Mail, Save, Info, Users } from 'lucide-react'
import { toast } from 'sonner'
import { ParentNotificationFrequency } from '@prisma/client'

/**
 * Parent Notification Settings Component
 *
 * Allows parents to manage email notification preferences.
 * Story 5.8: Parent/Guardian View - Task 6 (Notification Preference System)
 */
export function ParentNotificationSettings() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')

  // Fetch accessible students
  const { data: accessibleStudents, isLoading: studentsLoading } =
    trpc.parents.getAccessibleStudents.useQuery()

  // Set initial student ID when data loads
  if (accessibleStudents && accessibleStudents.length > 0 && !selectedStudentId) {
    setSelectedStudentId(accessibleStudents[0].studentId)
  }

  // Fetch preferences for selected student
  const { data: preferences, isLoading: preferencesLoading } =
    trpc.parents.getNotificationPreferences.useQuery(
      { studentId: selectedStudentId },
      { enabled: !!selectedStudentId }
    )

  // Update preferences mutation
  const { mutate: updatePreferences, isPending } =
    trpc.parents.updateNotificationPreferences.useMutation({
      onSuccess: () => {
        toast.success('Notification preferences updated successfully')
      },
      onError: (error) => {
        toast.error(`Failed to update preferences: ${error.message}`)
      },
    })

  const handleSave = () => {
    if (!selectedStudentId || !preferences) {
      return
    }

    updatePreferences({
      studentId: selectedStudentId,
      notifyOnSubmit: preferences.notifyOnSubmit,
      notifyOnAward: preferences.notifyOnAward,
      notifyOnDeadline: preferences.notifyOnDeadline,
      emailFrequency: preferences.emailFrequency,
    })
  }

  if (studentsLoading) {
    return <SettingsSkeleton />
  }

  if (!accessibleStudents || accessibleStudents.length === 0) {
    return (
      <Alert>
        <Users className="h-4 w-4" />
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

      {preferencesLoading ? (
        <SettingsSkeleton />
      ) : preferences ? (
        <>
          {/* Email Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Choose which events you want to be notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-submit">Application Submitted</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your student submits a scholarship application
                  </p>
                </div>
                <Switch
                  id="notify-submit"
                  checked={preferences.notifyOnSubmit}
                  onCheckedChange={(checked) => {
                    preferences.notifyOnSubmit = checked
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-award">Award Received</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your student receives a scholarship award
                  </p>
                </div>
                <Switch
                  id="notify-award"
                  checked={preferences.notifyOnAward}
                  onCheckedChange={(checked) => {
                    preferences.notifyOnAward = checked
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-deadline">Upcoming Deadlines</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders about upcoming scholarship deadlines (7 days before)
                  </p>
                </div>
                <Switch
                  id="notify-deadline"
                  checked={preferences.notifyOnDeadline}
                  onCheckedChange={(checked) => {
                    preferences.notifyOnDeadline = checked
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Frequency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Frequency
              </CardTitle>
              <CardDescription>How often you want to receive email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Notification Frequency</Label>
                <Select
                  value={preferences.emailFrequency}
                  onValueChange={(value) => {
                    preferences.emailFrequency = value as ParentNotificationFrequency
                  }}
                >
                  <SelectTrigger id="frequency" className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ParentNotificationFrequency.REALTIME}>
                      <div className="flex flex-col">
                        <span>Real-time</span>
                        <span className="text-xs text-muted-foreground">
                          Immediate notification for each event
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value={ParentNotificationFrequency.DAILY_DIGEST}>
                      <div className="flex flex-col">
                        <span>Daily Digest</span>
                        <span className="text-xs text-muted-foreground">
                          One email per day with all updates
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value={ParentNotificationFrequency.WEEKLY_DIGEST}>
                      <div className="flex flex-col">
                        <span>Weekly Digest</span>
                        <span className="text-xs text-muted-foreground">
                          One email per week summarizing activity
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value={ParentNotificationFrequency.OFF}>
                      <div className="flex flex-col">
                        <span>Turn Off</span>
                        <span className="text-xs text-muted-foreground">
                          No email notifications
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  All emails include an unsubscribe link. You can also turn off notifications
                  anytime by setting frequency to "Turn Off".
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isPending}>
              <Save className="h-4 w-4 mr-2" />
              {isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>

          {/* Privacy Notice */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Email notifications are sent to the email address associated with your parent account.
              Your student can see your notification preferences in their settings.
            </AlertDescription>
          </Alert>
        </>
      ) : (
        <Alert>
          <AlertDescription>Unable to load notification preferences. Please try again later.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
