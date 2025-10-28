/**
 * Calendar Export Component (Story 3.6 - Task 6)
 *
 * Provides one-click .ics file generation for exporting all deadlines and milestones
 * to Google Calendar, Outlook, or Apple Calendar.
 *
 * Acceptance Criteria #5:
 * Calendar integration option: Export all deadlines and milestones to Google Calendar
 * or Outlook with one-click .ics file download
 *
 * @component
 */

'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Calendar, Download, CheckCircle, ChevronDown } from 'lucide-react'
import { createEvents, EventAttributes } from 'ics'
import { format as formatDate } from 'date-fns'

interface TimelineMilestone {
  applicationId: string
  scholarshipName: string
  awardAmount: number
  deadline: Date
  timeline: {
    startEssayDate: Date | null
    requestRecsDate: Date | null
    uploadDocsDate: Date | null
    finalReviewDate: Date | null
    submitDate: Date | null
    estimatedHours: number | null
  } | null
}

interface CalendarExportProps {
  applications: TimelineMilestone[]
  studentName?: string
}

// Calendar format types (for future enhancement - currently all export as .ics)
type CalendarFormat = 'google' | 'outlook' | 'apple'

/**
 * Convert Date to ICS date array format [year, month, day, hour, minute]
 */
function dateToICSArray(date: Date): [number, number, number, number, number] {
  return [
    date.getFullYear(),
    date.getMonth() + 1, // ICS months are 1-indexed
    date.getDate(),
    9, // Default to 9 AM
    0, // Minutes
  ]
}

/**
 * Generate ICS file content from applications
 */
function generateICSFile(applications: TimelineMilestone[]): string {
  const events: EventAttributes[] = []

  for (const app of applications) {
    if (!app.timeline) continue

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

    // Essay milestone
    if (app.timeline.startEssayDate) {
      events.push({
        title: `📝 Start Essay - ${app.scholarshipName}`,
        start: dateToICSArray(app.timeline.startEssayDate),
        duration: { hours: 3 },
        description: `Begin drafting essay for ${app.scholarshipName}\\nAward: $${app.awardAmount.toLocaleString()}\\n\\nManaged by Scholarship Hunter`,
        location: 'Work on essays',
        url: `${baseUrl}/applications/${app.applicationId}`,
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
        categories: ['Scholarship', 'Essay'],
        alarms: [
          { trigger: { days: 1, before: true }, description: 'Start essay tomorrow' },
          { trigger: { hours: 1, before: true }, description: 'Start essay in 1 hour' },
        ],
      })
    }

    // Recommendation request milestone
    if (app.timeline.requestRecsDate) {
      events.push({
        title: `📧 Request Recommendations - ${app.scholarshipName}`,
        start: dateToICSArray(app.timeline.requestRecsDate),
        duration: { minutes: 30 },
        description: `Request recommendation letters for ${app.scholarshipName}\\n\\nManaged by Scholarship Hunter`,
        location: 'Email teachers',
        url: `${baseUrl}/applications/${app.applicationId}`,
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
        categories: ['Scholarship', 'Recommendation'],
        alarms: [{ trigger: { days: 1, before: true }, description: 'Request recs tomorrow' }],
      })
    }

    // Document upload milestone
    if (app.timeline.uploadDocsDate) {
      events.push({
        title: `📄 Upload Documents - ${app.scholarshipName}`,
        start: dateToICSArray(app.timeline.uploadDocsDate),
        duration: { hours: 1 },
        description: `Scan and upload required documents for ${app.scholarshipName}\\n\\nManaged by Scholarship Hunter`,
        location: 'Document preparation',
        url: `${baseUrl}/applications/${app.applicationId}`,
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
        categories: ['Scholarship', 'Documents'],
        alarms: [{ trigger: { days: 1, before: true }, description: 'Upload docs tomorrow' }],
      })
    }

    // Final review milestone
    if (app.timeline.finalReviewDate) {
      events.push({
        title: `✅ Final Review - ${app.scholarshipName}`,
        start: dateToICSArray(app.timeline.finalReviewDate),
        duration: { hours: 1 },
        description: `Final review and proofread for ${app.scholarshipName}\\n\\nManaged by Scholarship Hunter`,
        location: 'Application review',
        url: `${baseUrl}/applications/${app.applicationId}`,
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
        categories: ['Scholarship', 'Review'],
        alarms: [{ trigger: { days: 1, before: true }, description: 'Review tomorrow' }],
      })
    }

    // Final deadline (URGENT priority)
    events.push({
      title: `⏰ DEADLINE - ${app.scholarshipName}`,
      start: dateToICSArray(app.deadline),
      duration: { hours: 0 }, // All-day event
      description: `Final deadline for ${app.scholarshipName}\\nAward: $${app.awardAmount.toLocaleString()}\\n\\n🚨 URGENT - Do not miss this deadline!\\n\\nManaged by Scholarship Hunter`,
      location: 'Scholarship submission',
      url: `${baseUrl}/applications/${app.applicationId}`,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      categories: ['Scholarship', 'Deadline'],
      classification: 'PUBLIC',
      alarms: [
        { trigger: { days: 3, before: true }, description: '3 days until deadline!' },
        { trigger: { days: 1, before: true }, description: 'Deadline tomorrow!' },
        { trigger: { hours: 2, before: true }, description: 'Deadline in 2 hours!' },
      ],
    })
  }

  const { error, value } = createEvents(events)

  if (error) {
    console.error('Error creating ICS file:', error)
    throw new Error('Failed to generate calendar file')
  }

  return value || ''
}

/**
 * Trigger download of ICS file
 */
function downloadICSFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function CalendarExport({ applications }: CalendarExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const handleExport = async (_format: CalendarFormat) => {
    try {
      setIsExporting(true)
      setExportSuccess(false)

      // Generate ICS file
      const icsContent = generateICSFile(applications)
      const timestamp = formatDate(new Date(), 'yyyy-MM-dd')
      const filename = `scholarship-timeline-${timestamp}.ics`

      // Download file
      downloadICSFile(icsContent, filename)

      // Show success feedback
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export calendar. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  if (applications.length === 0) {
    return null
  }

  const totalEvents = applications.reduce((count, app) => {
    let eventCount = 1 // Deadline
    if (app.timeline) {
      if (app.timeline.startEssayDate) eventCount++
      if (app.timeline.requestRecsDate) eventCount++
      if (app.timeline.uploadDocsDate) eventCount++
      if (app.timeline.finalReviewDate) eventCount++
    }
    return count + eventCount
  }, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-600" />
          Calendar Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-700">
          <p className="mb-2">
            Export all your deadlines and milestones to your favorite calendar app.
          </p>
          <p className="text-xs text-gray-500">
            {totalEvents} event{totalEvents !== 1 ? 's' : ''} across {applications.length}{' '}
            application{applications.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Export Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="w-full"
              disabled={isExporting}
            >
              {isExporting ? (
                <>Generating Calendar File...</>
              ) : exportSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Calendar Exported!
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export to Calendar
                  <ChevronDown className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={() => handleExport('google')}>
              <Calendar className="h-4 w-4 mr-2" />
              Google Calendar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('outlook')}>
              <Calendar className="h-4 w-4 mr-2" />
              Outlook Calendar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('apple')}>
              <Calendar className="h-4 w-4 mr-2" />
              Apple Calendar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Instructions */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded p-3">
          <p className="font-semibold mb-1">How to import:</p>
          <ul className="space-y-0.5 ml-4 list-disc">
            <li><strong>Google Calendar:</strong> Open Google Calendar → Settings → Import & Export → Import</li>
            <li><strong>Outlook:</strong> File will download automatically - open to import</li>
            <li><strong>Apple Calendar:</strong> File will download - double-click to import</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
