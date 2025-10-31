/**
 * PDF Export Module
 *
 * Generates analytics reports as PDF documents:
 * - Title page with student info
 * - Summary metrics
 * - Tier breakdown table
 * - Report generation date
 * - Professional formatting
 *
 * Story: 5.2 - Analytics Dashboard - Success Metrics (AC #7)
 * @module lib/analytics/pdf-export
 */

import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { PriorityTier } from '@prisma/client'

export interface AnalyticsReportData {
  studentName: string
  snapshot: {
    totalApplications: number
    totalSubmitted: number
    totalAwarded: number
    totalDenied: number
    totalPending: number
    successRate: number
    totalFundingSecured: number
    averageAwardAmount: number
  }
  tierBreakdown: Array<{
    tier: PriorityTier
    applicationsCount: number
    awardsCount: number
    successRate: number
    totalFunding: number
  }>
  goalProgress?: {
    goal: number
    secured: number
    percentage: number
  }
}

const TIER_LABELS: Record<PriorityTier, string> = {
  [PriorityTier.MUST_APPLY]: 'Must Apply',
  [PriorityTier.SHOULD_APPLY]: 'Should Apply',
  [PriorityTier.IF_TIME_PERMITS]: 'If Time Permits',
  [PriorityTier.HIGH_VALUE_REACH]: 'High Value Reach',
}

/**
 * Generate analytics report as PDF
 *
 * @param data - Analytics report data
 * @returns PDF blob for download
 */
export function generateAnalyticsReport(data: AnalyticsReportData): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  // Title Page
  doc.setFontSize(24)
  doc.text('Scholarship Analytics Report', pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  doc.setFontSize(12)
  doc.text(data.studentName, pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  doc.setFontSize(10)
  doc.text(
    `Generated: ${format(new Date(), 'MMMM d, yyyy')}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )
  yPos += 20

  // Summary Metrics Section
  doc.setFontSize(16)
  doc.text('Success Metrics', 20, yPos)
  yPos += 10

  doc.setFontSize(11)
  const metrics = [
    `Total Applications: ${data.snapshot.totalApplications}`,
    `Applications Submitted: ${data.snapshot.totalSubmitted}`,
    `Awards Received: ${data.snapshot.totalAwarded}`,
    `Denials: ${data.snapshot.totalDenied}`,
    `Pending Decisions: ${data.snapshot.totalPending}`,
    `Success Rate: ${(data.snapshot.successRate * 100).toFixed(1)}%`,
    `Total Funding Secured: $${data.snapshot.totalFundingSecured.toLocaleString()}`,
    `Average Award Amount: $${data.snapshot.averageAwardAmount.toLocaleString()}`,
  ]

  metrics.forEach((metric) => {
    doc.text(metric, 25, yPos)
    yPos += 7
  })

  yPos += 10

  // Goal Progress
  if (data.goalProgress) {
    doc.setFontSize(16)
    doc.text('Funding Goal Progress', 20, yPos)
    yPos += 10

    doc.setFontSize(11)
    doc.text(`Goal: $${data.goalProgress.goal.toLocaleString()}`, 25, yPos)
    yPos += 7
    doc.text(`Secured: $${data.goalProgress.secured.toLocaleString()}`, 25, yPos)
    yPos += 7
    doc.text(
      `Progress: ${data.goalProgress.percentage.toFixed(1)}% of goal`,
      25,
      yPos
    )
    yPos += 15
  }

  // Tier Breakdown Section
  if (yPos > pageHeight - 80) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(16)
  doc.text('Success by Priority Tier', 20, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.text('Tier', 25, yPos)
  doc.text('Apps', 85, yPos)
  doc.text('Awards', 115, yPos)
  doc.text('Success Rate', 145, yPos)
  doc.text('Funding', 175, yPos, { align: 'right' })
  yPos += 7

  // Draw horizontal line
  doc.line(20, yPos - 2, 190, yPos - 2)

  data.tierBreakdown.forEach((tier) => {
    if (yPos > pageHeight - 20) {
      doc.addPage()
      yPos = 20
    }

    doc.text(TIER_LABELS[tier.tier], 25, yPos)
    doc.text(tier.applicationsCount.toString(), 85, yPos)
    doc.text(tier.awardsCount.toString(), 115, yPos)
    doc.text(
      tier.applicationsCount > 0
        ? `${(tier.successRate * 100).toFixed(0)}%`
        : '—',
      145,
      yPos
    )
    doc.text(`$${tier.totalFunding.toLocaleString()}`, 175, yPos, { align: 'right' })
    yPos += 7
  })

  yPos += 15

  // Footer
  doc.setFontSize(8)
  doc.text(
    'Generated with Scholarship Hunter Analytics Dashboard',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  return doc.output('blob')
}

/**
 * Download PDF report
 *
 * @param data - Analytics report data
 * @param filename - Filename for download (optional)
 */
export function downloadAnalyticsReport(
  data: AnalyticsReportData,
  filename?: string
): void {
  const blob = generateAnalyticsReport(data)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download =
    filename ||
    `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
