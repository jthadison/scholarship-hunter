import { prisma } from '@/server/db'

export interface StudentMetrics {
  id: string
  name: string
  profileStrength: number
  applicationsCount: number
  applicationsSubmitted: number
  fundingSecured: number
  successRate: number
  atRiskCount: number
  atRiskSeverity: 'HIGH' | 'MEDIUM' | 'LOW' | null
}

export interface CohortAnalytics {
  totalStudents: number
  totalFunding: number
  avgSuccessRate: number
  avgApplicationsPerStudent: number
  atRiskCount: number
}

export interface StudentDetailData {
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
    profile: any
  }
  applications: any[]
  outcomes: any[]
  metrics: {
    profileStrength: number
    totalApplications: number
    submitted: number
    awarded: number
    denied: number
    fundingSecured: number
    successRate: number
  }
  timeline: any[]
}

/**
 * Get all students who have granted permission to a counselor
 * with aggregated metrics for the roster view
 */
export async function getCounselorStudents(
  counselorId: string,
  options?: {
    sortBy?: 'funding' | 'successRate' | 'atRisk'
    filterBy?: 'atRisk' | 'inactive'
    limit?: number
    offset?: number
  }
) {
  const { sortBy = 'funding', filterBy, limit = 20, offset = 0 } = options || {}

  // Get all students with active permissions
  const permissions = await prisma.studentCounselorPermission.findMany({
    where: {
      counselorId,
      status: 'ACTIVE',
    },
    include: {
      student: {
        include: {
          profile: {
            select: {
              strengthScore: true,
            },
          },
          applications: {
            select: {
              id: true,
              status: true,
              progressPercentage: true,
              targetSubmitDate: true,
            },
          },
          outcomes: {
            select: {
              result: true,
              awardAmountReceived: true,
            },
          },
          atRiskEvents: {
            where: {
              resolvedAt: null,
            },
            select: {
              severity: true,
              daysUntilDeadline: true,
            },
            orderBy: {
              severity: 'desc',
            },
            take: 1,
          },
        },
      },
    },
  })

  // Calculate metrics for each student
  const studentsWithMetrics: StudentMetrics[] = permissions.map((perm) => {
    const student = perm.student
    const applications = student.applications
    const outcomes = student.outcomes

    const totalApplications = applications.length
    const submitted = applications.filter(
      (app: { status: string }) =>
        app.status === 'SUBMITTED' ||
        app.status === 'AWAITING_DECISION' ||
        app.status === 'AWARDED' ||
        app.status === 'DENIED'
    ).length

    const awarded = outcomes.filter((o: { result: string }) => o.result === 'AWARDED').length
    const fundingSecured = outcomes
      .filter((o: { result: string; awardAmountReceived: number | null }) => o.result === 'AWARDED' && o.awardAmountReceived)
      .reduce((sum: number, o: { awardAmountReceived: number | null }) => sum + (o.awardAmountReceived || 0), 0)

    const successRate = submitted > 0 ? (awarded / submitted) * 100 : 0

    // At-risk detection
    const atRiskApplications = applications.filter((app: { targetSubmitDate: Date | null; progressPercentage: number }) => {
      if (!app.targetSubmitDate) return false
      const daysUntilDeadline = Math.ceil(
        (app.targetSubmitDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      return (
        (daysUntilDeadline <= 7 && app.progressPercentage < 50) ||
        (daysUntilDeadline <= 3 && app.progressPercentage < 100)
      )
    })

    const atRiskCount = atRiskApplications.length
    let atRiskSeverity: 'HIGH' | 'MEDIUM' | 'LOW' | null = null

    if (student.atRiskEvents.length > 0) {
      const severity = student.atRiskEvents[0]!.severity
      atRiskSeverity =
        severity === 'CRITICAL' || severity === 'URGENT'
          ? 'HIGH'
          : severity === 'WARNING'
            ? 'MEDIUM'
            : 'LOW'
    } else if (atRiskCount > 0) {
      const minDays = Math.min(
        ...atRiskApplications.map((app: { targetSubmitDate: Date | null }) =>
          Math.ceil(
            (app.targetSubmitDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        )
      )
      atRiskSeverity = minDays <= 3 ? 'HIGH' : minDays <= 7 ? 'MEDIUM' : 'LOW'
    }

    return {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      profileStrength: student.profile?.strengthScore || 0,
      applicationsCount: totalApplications,
      applicationsSubmitted: submitted,
      fundingSecured,
      successRate,
      atRiskCount,
      atRiskSeverity,
    }
  })

  // Filter
  let filtered = studentsWithMetrics
  if (filterBy === 'atRisk') {
    filtered = filtered.filter((s) => s.atRiskCount > 0)
  } else if (filterBy === 'inactive') {
    filtered = filtered.filter((s) => s.applicationsCount === 0)
  }

  // Sort
  filtered.sort((a, b) => {
    if (sortBy === 'funding') {
      return b.fundingSecured - a.fundingSecured
    } else if (sortBy === 'successRate') {
      return b.successRate - a.successRate
    } else if (sortBy === 'atRisk') {
      // Sort by severity first, then count
      const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1, null: 0 }
      const severityDiff =
        (severityOrder[b.atRiskSeverity || 'null'] || 0) -
        (severityOrder[a.atRiskSeverity || 'null'] || 0)
      if (severityDiff !== 0) return severityDiff
      return b.atRiskCount - a.atRiskCount
    }
    return 0
  })

  // Paginate
  const total = filtered.length
  const students = filtered.slice(offset, offset + limit)

  return {
    students,
    total,
  }
}

/**
 * Get detailed student data for counselor view (with permission check already done)
 */
export async function getStudentDetailForCounselor(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: {
        select: {
          email: true,
        },
      },
      profile: true,
      applications: {
        include: {
          scholarship: {
            select: {
              name: true,
              provider: true,
              awardAmount: true,
              deadline: true,
            },
          },
          timeline: true,
          outcome: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      outcomes: {
        include: {
          application: {
            include: {
              scholarship: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          decisionDate: 'desc',
        },
      },
    },
  })

  if (!student) {
    return null
  }

  // Calculate metrics
  const applications = student.applications
  const outcomes = student.outcomes

  const totalApplications = applications.length
  const submitted = applications.filter(
    (app) =>
      app.status === 'SUBMITTED' ||
      app.status === 'AWAITING_DECISION' ||
      app.status === 'AWARDED' ||
      app.status === 'DENIED'
  ).length

  const awarded = outcomes.filter((o) => o.result === 'AWARDED').length
  const denied = outcomes.filter((o) => o.result === 'DENIED').length
  const fundingSecured = outcomes
    .filter((o) => o.result === 'AWARDED' && o.awardAmountReceived)
    .reduce((sum, o) => sum + (o.awardAmountReceived || 0), 0)

  const successRate = submitted > 0 ? (awarded / submitted) * 100 : 0

  // Build timeline of recent activity
  const timeline = [
    ...applications.map((app) => ({
      type: 'application',
      date: app.createdAt,
      description: `Added ${app.scholarship.name} to applications`,
      status: app.status,
    })),
    ...outcomes.map((outcome) => ({
      type: 'outcome',
      date: outcome.decisionDate || outcome.createdAt,
      description: `${outcome.result === 'AWARDED' ? 'Awarded' : 'Denied'} ${outcome.application.scholarship.name}`,
      result: outcome.result,
      amount: outcome.awardAmountReceived,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  const data: StudentDetailData = {
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.user.email,
      profile: student.profile,
    },
    applications: applications,
    outcomes: outcomes,
    metrics: {
      profileStrength: student.profile?.strengthScore || 0,
      totalApplications,
      submitted,
      awarded,
      denied,
      fundingSecured,
      successRate,
    },
    timeline: timeline.slice(0, 20), // Last 20 activities
  }

  return data
}

/**
 * Get cohort analytics for all students a counselor has access to
 */
export async function getCohortAnalytics(counselorId: string): Promise<CohortAnalytics> {
  // Get all students with active permissions
  const permissions = await prisma.studentCounselorPermission.findMany({
    where: {
      counselorId,
      status: 'ACTIVE',
    },
    include: {
      student: {
        include: {
          applications: {
            select: {
              id: true,
              status: true,
            },
          },
          outcomes: {
            select: {
              result: true,
              awardAmountReceived: true,
            },
          },
          atRiskEvents: {
            where: {
              resolvedAt: null,
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
  })

  const totalStudents = permissions.length

  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      totalFunding: 0,
      avgSuccessRate: 0,
      avgApplicationsPerStudent: 0,
      atRiskCount: 0,
    }
  }

  let totalFunding = 0
  let totalSubmitted = 0
  let totalAwarded = 0
  let totalApplications = 0
  let atRiskCount = 0

  permissions.forEach((perm) => {
    const student = perm.student

    // Count applications
    totalApplications += student.applications.length

    // Count submitted and awarded
    const submitted = student.applications.filter(
      (app: { status: string }) =>
        app.status === 'SUBMITTED' ||
        app.status === 'AWAITING_DECISION' ||
        app.status === 'AWARDED' ||
        app.status === 'DENIED'
    ).length
    totalSubmitted += submitted

    const awarded = student.outcomes.filter((o: { result: string }) => o.result === 'AWARDED').length
    totalAwarded += awarded

    // Sum funding
    const funding = student.outcomes
      .filter((o: { result: string; awardAmountReceived: number | null }) => o.result === 'AWARDED' && o.awardAmountReceived)
      .reduce((sum: number, o: { awardAmountReceived: number | null }) => sum + (o.awardAmountReceived || 0), 0)
    totalFunding += funding

    // Count at-risk students
    if (student.atRiskEvents.length > 0) {
      atRiskCount++
    }
  })

  const avgSuccessRate = totalSubmitted > 0 ? (totalAwarded / totalSubmitted) * 100 : 0
  const avgApplicationsPerStudent = totalApplications / totalStudents

  return {
    totalStudents,
    totalFunding,
    avgSuccessRate,
    avgApplicationsPerStudent,
    atRiskCount,
  }
}
