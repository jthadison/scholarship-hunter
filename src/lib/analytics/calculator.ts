/**
 * Analytics Calculation Engine
 *
 * Core business logic for analytics calculations including:
 * - Success metrics (applications, awards, success rate, funding)
 * - Tier breakdown analysis (success rates by priority tier)
 * - Funding trends (monthly aggregations)
 * - ROI analysis (time invested vs. funding secured)
 * - Outcome distribution (awarded/denied/pending percentages)
 *
 * Story: 5.2 - Analytics Dashboard - Success Metrics
 * @module lib/analytics/calculator
 */

import { PrismaClient, OutcomeResult, ApplicationStatus, PriorityTier } from '@prisma/client'
import { startOfMonth, endOfMonth, subMonths, format, eachMonthOfInterval } from 'date-fns'

/**
 * Success metrics for a given time period
 */
export interface SuccessMetrics {
  totalApplications: number
  totalSubmitted: number // Applications with outcomes
  totalAwarded: number
  totalDenied: number
  totalPending: number
  successRate: number // 0.0 to 1.0
  totalFundingSecured: number
  averageAwardAmount: number
}

/**
 * Tier breakdown showing success rates by priority tier
 */
export interface TierBreakdown {
  tier: PriorityTier
  applicationsCount: number
  awardsCount: number
  successRate: number // 0.0 to 1.0
  totalFunding: number
}

/**
 * Monthly funding data point
 */
export interface MonthlyFunding {
  month: string // Format: "YYYY-MM"
  amount: number
}

/**
 * Monthly application count
 */
export interface MonthlyApplications {
  month: string // Format: "YYYY-MM"
  count: number
}

/**
 * Cumulative funding data point
 */
export interface CumulativeFunding {
  date: string // Format: "YYYY-MM-DD"
  total: number
}

/**
 * ROI analysis data
 */
export interface ROIAnalysis {
  timeInvested: number // Total hours
  fundingSecured: number // Total dollars
  hourlyRate: number // Dollars per hour
  essaysWritten: number
  applicationsSubmitted: number
  documentsUploaded: number
}

/**
 * Outcome distribution percentages
 */
export interface OutcomeDistribution {
  awarded: number // Count
  denied: number
  waitlisted: number
  withdrawn: number
  pending: number
  awardedPercentage: number // 0-100
  deniedPercentage: number
  pendingPercentage: number
}

/**
 * Calculate success metrics for a student within a time period
 *
 * @param prisma - Prisma client instance
 * @param studentId - Student ID
 * @param periodStart - Start of time period (optional, defaults to all time)
 * @param periodEnd - End of time period (optional, defaults to now)
 * @returns Success metrics object
 */
export async function calculateSuccessMetrics(
  prisma: PrismaClient,
  studentId: string,
  periodStart?: Date,
  periodEnd?: Date
): Promise<SuccessMetrics> {
  // Build date filter
  const dateFilter = periodStart && periodEnd
    ? { gte: periodStart, lte: periodEnd }
    : undefined

  // Fetch all applications for student within period
  const applications = await prisma.application.findMany({
    where: {
      studentId,
      ...(dateFilter && { createdAt: dateFilter }),
    },
    include: {
      outcome: true,
    },
  })

  const totalApplications = applications.length

  // Calculate outcomes
  const applicationsWithOutcomes = applications.filter((app) => app.outcome !== null)
  const totalSubmitted = applicationsWithOutcomes.length

  const awarded = applications.filter(
    (app) => app.outcome?.result === OutcomeResult.AWARDED
  )
  const totalAwarded = awarded.length

  const totalDenied = applications.filter(
    (app) => app.outcome?.result === OutcomeResult.DENIED
  ).length

  const totalPending = applications.filter(
    (app) =>
      app.status !== ApplicationStatus.AWARDED &&
      app.status !== ApplicationStatus.DENIED &&
      app.status !== ApplicationStatus.WAITLISTED &&
      app.status !== ApplicationStatus.WITHDRAWN
  ).length

  const successRate = totalSubmitted > 0 ? totalAwarded / totalSubmitted : 0

  // Calculate funding
  const totalFundingSecured = awarded.reduce(
    (sum, app) => sum + (app.outcome?.awardAmountReceived ?? 0),
    0
  )

  const averageAwardAmount = totalAwarded > 0 ? totalFundingSecured / totalAwarded : 0

  return {
    totalApplications,
    totalSubmitted,
    totalAwarded,
    totalDenied,
    totalPending,
    successRate,
    totalFundingSecured,
    averageAwardAmount,
  }
}

/**
 * Calculate success rate breakdown by priority tier
 *
 * @param prisma - Prisma client instance
 * @param studentId - Student ID
 * @returns Array of tier breakdowns sorted by success rate descending
 */
export async function calculateTierBreakdown(
  prisma: PrismaClient,
  studentId: string
): Promise<TierBreakdown[]> {
  // Fetch all applications with outcomes
  const applications = await prisma.application.findMany({
    where: { studentId },
    include: {
      outcome: true,
    },
  })

  // Group by tier
  const tierMap = new Map<PriorityTier, {
    applications: number
    awards: number
    funding: number
  }>()

  // Initialize all tiers
  const allTiers: PriorityTier[] = [
    PriorityTier.MUST_APPLY,
    PriorityTier.SHOULD_APPLY,
    PriorityTier.IF_TIME_PERMITS,
    PriorityTier.HIGH_VALUE_REACH,
  ]

  allTiers.forEach((tier) => {
    tierMap.set(tier, { applications: 0, awards: 0, funding: 0 })
  })

  // Aggregate data
  applications.forEach((app) => {
    if (app.priorityTier) {
      const tier = app.priorityTier
      const data = tierMap.get(tier)!
      data.applications++

      if (app.outcome?.result === OutcomeResult.AWARDED) {
        data.awards++
        data.funding += app.outcome.awardAmountReceived ?? 0
      }
    }
  })

  // Convert to breakdown array
  const breakdowns: TierBreakdown[] = Array.from(tierMap.entries()).map(
    ([tier, data]) => ({
      tier,
      applicationsCount: data.applications,
      awardsCount: data.awards,
      successRate: data.applications > 0 ? data.awards / data.applications : 0,
      totalFunding: data.funding,
    })
  )

  // Sort by success rate descending
  return breakdowns.sort((a, b) => b.successRate - a.successRate)
}

/**
 * Calculate funding trend over time (monthly aggregations)
 *
 * @param prisma - Prisma client instance
 * @param studentId - Student ID
 * @param months - Number of months to include (defaults to 12)
 * @returns Array of monthly funding amounts
 */
export async function calculateFundingTrend(
  prisma: PrismaClient,
  studentId: string,
  months = 12
): Promise<MonthlyFunding[]> {
  const endDate = new Date()
  const startDate = subMonths(endDate, months - 1)

  // Generate all months in the range
  const monthsRange = eachMonthOfInterval({ start: startDate, end: endDate })

  // Fetch all awarded outcomes within date range
  const outcomes = await prisma.outcome.findMany({
    where: {
      studentId,
      result: OutcomeResult.AWARDED,
      decisionDate: {
        gte: startOfMonth(startDate),
        lte: endOfMonth(endDate),
      },
    },
    select: {
      decisionDate: true,
      awardAmountReceived: true,
    },
  })

  // Group by month
  const monthMap = new Map<string, number>()

  // Initialize all months with 0
  monthsRange.forEach((month) => {
    const key = format(month, 'yyyy-MM')
    monthMap.set(key, 0)
  })

  // Aggregate funding by month
  outcomes.forEach((outcome) => {
    if (outcome.decisionDate) {
      const monthKey = format(outcome.decisionDate, 'yyyy-MM')
      const currentAmount = monthMap.get(monthKey) ?? 0
      monthMap.set(monthKey, currentAmount + (outcome.awardAmountReceived ?? 0))
    }
  })

  // Convert to array and sort by month
  return Array.from(monthMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Calculate applications submitted per month
 *
 * @param prisma - Prisma client instance
 * @param studentId - Student ID
 * @param months - Number of months to include (defaults to 12)
 * @returns Array of monthly application counts
 */
export async function calculateApplicationsTrend(
  prisma: PrismaClient,
  studentId: string,
  months = 12
): Promise<MonthlyApplications[]> {
  const endDate = new Date()
  const startDate = subMonths(endDate, months - 1)

  // Generate all months in the range
  const monthsRange = eachMonthOfInterval({ start: startDate, end: endDate })

  // Fetch all applications within date range
  const applications = await prisma.application.findMany({
    where: {
      studentId,
      createdAt: {
        gte: startOfMonth(startDate),
        lte: endOfMonth(endDate),
      },
    },
    select: {
      createdAt: true,
    },
  })

  // Group by month
  const monthMap = new Map<string, number>()

  // Initialize all months with 0
  monthsRange.forEach((month) => {
    const key = format(month, 'yyyy-MM')
    monthMap.set(key, 0)
  })

  // Count applications by month
  applications.forEach((app) => {
    const monthKey = format(app.createdAt, 'yyyy-MM')
    const currentCount = monthMap.get(monthKey) ?? 0
    monthMap.set(monthKey, currentCount + 1)
  })

  // Convert to array and sort by month
  return Array.from(monthMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Calculate cumulative funding over time
 *
 * @param prisma - Prisma client instance
 * @param studentId - Student ID
 * @returns Array of cumulative funding data points
 */
export async function calculateCumulativeFunding(
  prisma: PrismaClient,
  studentId: string
): Promise<CumulativeFunding[]> {
  // Fetch all awarded outcomes ordered by decision date
  const outcomes = await prisma.outcome.findMany({
    where: {
      studentId,
      result: OutcomeResult.AWARDED,
    },
    select: {
      decisionDate: true,
      awardAmountReceived: true,
    },
    orderBy: {
      decisionDate: 'asc',
    },
  })

  // Calculate cumulative total
  const cumulativeData: CumulativeFunding[] = []
  let runningTotal = 0

  outcomes.forEach((outcome) => {
    runningTotal += outcome.awardAmountReceived ?? 0
    if (outcome.decisionDate) {
      cumulativeData.push({
        date: format(outcome.decisionDate, 'yyyy-MM-dd'),
        total: runningTotal,
      })
    }
  })

  // If no data, return empty starting point
  if (cumulativeData.length === 0) {
    return [{ date: format(new Date(), 'yyyy-MM-dd'), total: 0 }]
  }

  return cumulativeData
}

/**
 * Calculate ROI (Return on Investment) analysis
 *
 * Estimates time invested based on:
 * - Essays written × 3 hours per essay
 * - Applications submitted × 1 hour per application
 * - Documents uploaded × 0.5 hours per document
 *
 * @param prisma - Prisma client instance
 * @param studentId - Student ID
 * @returns ROI analysis data
 */
export async function calculateROI(
  prisma: PrismaClient,
  studentId: string
): Promise<ROIAnalysis> {
  // Count essays written
  const essaysWritten = await prisma.essay.count({
    where: { studentId },
  })

  // Count applications submitted
  const applicationsSubmitted = await prisma.application.count({
    where: { studentId },
  })

  // Count documents uploaded
  const documentsUploaded = await prisma.document.count({
    where: { studentId },
  })

  // Calculate total funding secured
  const outcomes = await prisma.outcome.findMany({
    where: {
      studentId,
      result: OutcomeResult.AWARDED,
    },
    select: {
      awardAmountReceived: true,
    },
  })

  const fundingSecured = outcomes.reduce(
    (sum, o) => sum + (o.awardAmountReceived ?? 0),
    0
  )

  // Estimate time invested (hours)
  const timeInvested =
    essaysWritten * 3 + applicationsSubmitted * 1 + documentsUploaded * 0.5

  // Calculate hourly rate (avoid division by zero)
  const hourlyRate = timeInvested > 0 ? fundingSecured / timeInvested : 0

  return {
    timeInvested,
    fundingSecured,
    hourlyRate,
    essaysWritten,
    applicationsSubmitted,
    documentsUploaded,
  }
}

/**
 * Calculate outcome distribution (awarded/denied/pending counts and percentages)
 *
 * @param prisma - Prisma client instance
 * @param studentId - Student ID
 * @returns Outcome distribution data
 */
export async function calculateOutcomeDistribution(
  prisma: PrismaClient,
  studentId: string
): Promise<OutcomeDistribution> {
  // Fetch all applications with outcomes
  const applications = await prisma.application.findMany({
    where: { studentId },
    include: {
      outcome: true,
    },
  })

  const totalApplications = applications.length

  // Count each outcome type
  const awarded = applications.filter(
    (app) => app.outcome?.result === OutcomeResult.AWARDED
  ).length

  const denied = applications.filter(
    (app) => app.outcome?.result === OutcomeResult.DENIED
  ).length

  const waitlisted = applications.filter(
    (app) => app.outcome?.result === OutcomeResult.WAITLISTED
  ).length

  const withdrawn = applications.filter(
    (app) => app.outcome?.result === OutcomeResult.WITHDRAWN
  ).length

  const pending = applications.filter(
    (app) =>
      app.status !== ApplicationStatus.AWARDED &&
      app.status !== ApplicationStatus.DENIED &&
      app.status !== ApplicationStatus.WAITLISTED &&
      app.status !== ApplicationStatus.WITHDRAWN
  ).length

  // Calculate percentages (avoid division by zero)
  const awardedPercentage = totalApplications > 0 ? (awarded / totalApplications) * 100 : 0
  const deniedPercentage = totalApplications > 0 ? (denied / totalApplications) * 100 : 0
  const pendingPercentage = totalApplications > 0 ? (pending / totalApplications) * 100 : 0

  return {
    awarded,
    denied,
    waitlisted,
    withdrawn,
    pending,
    awardedPercentage,
    deniedPercentage,
    pendingPercentage,
  }
}
