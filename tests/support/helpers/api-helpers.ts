/**
 * API Helpers
 *
 * Utilities for making tRPC API calls in tests.
 * Provides direct access to backend procedures without going through UI.
 *
 * Usage:
 *   const scholarship = await apiHelper.scholarships.getById(scholarshipId)
 *   const matches = await apiHelper.matches.findForStudent(studentId)
 *
 * Features:
 *   - Direct tRPC procedure calls
 *   - Bypasses UI for faster test setup
 *   - Type-safe API interactions
 *   - Authentication context handling
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class ApiHelper {
  /**
   * Scholarship API helpers
   */
  scholarships = {
    /**
     * Get scholarship by ID
     */
    async getById(id: string) {
      return prisma.scholarship.findUnique({
        where: { id },
        include: {
          matches: true,
          applications: true,
        },
      })
    },

    /**
     * Search scholarships with filters
     */
    async search(filters: {
      minAmount?: number
      maxAmount?: number
      category?: string
      tags?: string[]
      deadlineBefore?: Date
      deadlineAfter?: Date
    }) {
      return prisma.scholarship.findMany({
        where: {
          awardAmount: {
            gte: filters.minAmount,
            lte: filters.maxAmount,
          },
          category: filters.category,
          tags: filters.tags ? { hasSome: filters.tags } : undefined,
          deadline: {
            gte: filters.deadlineAfter,
            lte: filters.deadlineBefore,
          },
          verified: true,
        },
        orderBy: {
          deadline: 'asc',
        },
      })
    },

    /**
     * Get upcoming deadlines
     */
    async getUpcomingDeadlines(days = 30) {
      const now = new Date()
      const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

      return prisma.scholarship.findMany({
        where: {
          deadline: {
            gte: now,
            lte: future,
          },
          verified: true,
        },
        orderBy: {
          deadline: 'asc',
        },
      })
    },
  }

  /**
   * Student/Profile API helpers
   */
  students = {
    /**
     * Get student by user ID
     */
    async getByUserId(userId: string) {
      return prisma.student.findUnique({
        where: { userId },
        include: {
          profile: true,
          user: true,
        },
      })
    },

    /**
     * Update profile
     */
    async updateProfile(studentId: string, data: any) {
      return prisma.profile.update({
        where: { studentId },
        data,
      })
    },

    /**
     * Calculate profile strength
     */
    async calculateStrength(studentId: string) {
      const profile = await prisma.profile.findUnique({
        where: { studentId },
      })

      if (!profile) return 0

      // Simple strength calculation
      let score = 0
      if (profile.gpa) score += 20
      if (profile.satScore || profile.actScore) score += 15
      if (profile.intendedMajor) score += 10
      if (profile.volunteerHours && profile.volunteerHours > 0) score += 15
      if (profile.extracurriculars) score += 15
      if (profile.careerGoals) score += 10
      if (profile.state) score += 5
      if (profile.graduationYear) score += 10

      return Math.min(score, 100)
    },
  }

  /**
   * Match API helpers
   */
  matches = {
    /**
     * Find matches for student
     */
    async findForStudent(studentId: string, filters?: { minScore?: number; priorityTier?: string }) {
      return prisma.match.findMany({
        where: {
          studentId,
          overallMatchScore: {
            gte: filters?.minScore || 0,
          },
          priorityTier: filters?.priorityTier as any,
        },
        include: {
          scholarship: true,
        },
        orderBy: {
          overallMatchScore: 'desc',
        },
      })
    },

    /**
     * Create a match
     */
    async createMatch(studentId: string, scholarshipId: string, scores?: any) {
      return prisma.match.create({
        data: {
          studentId,
          scholarshipId,
          overallMatchScore: scores?.overall || 75,
          academicScore: scores?.academic || 70,
          demographicScore: scores?.demographic || 80,
          majorFieldScore: scores?.majorField || 75,
          experienceScore: scores?.experience || 70,
          financialScore: scores?.financial || 65,
          successProbability: scores?.successProbability || 0.6,
          priorityTier: scores?.priorityTier || 'SHOULD_APPLY',
          strategicValue: scores?.strategicValue || 80,
          applicationEffort: scores?.applicationEffort || 'MEDIUM',
        },
        include: {
          scholarship: true,
          student: true,
        },
      })
    },

    /**
     * Get top matches for student
     */
    async getTopMatches(studentId: string, limit = 10) {
      return prisma.match.findMany({
        where: { studentId },
        include: {
          scholarship: true,
        },
        orderBy: {
          overallMatchScore: 'desc',
        },
        take: limit,
      })
    },
  }

  /**
   * Application API helpers
   */
  applications = {
    /**
     * Get applications for student
     */
    async getForStudent(studentId: string, status?: string) {
      return prisma.application.findMany({
        where: {
          studentId,
          status: status as any,
        },
        include: {
          scholarship: true,
          essays: true,
          documents: true,
          outcome: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    },

    /**
     * Update application status
     */
    async updateStatus(applicationId: string, status: string, progressPercentage?: number) {
      return prisma.application.update({
        where: { id: applicationId },
        data: {
          status: status as any,
          progressPercentage: progressPercentage ?? undefined,
        },
      })
    },

    /**
     * Get application statistics for student
     */
    async getStats(studentId: string) {
      const applications = await prisma.application.findMany({
        where: { studentId },
        include: { outcome: true },
      })

      return {
        total: applications.length,
        notStarted: applications.filter((a) => a.status === 'NOT_STARTED').length,
        inProgress: applications.filter((a) => a.status === 'IN_PROGRESS').length,
        submitted: applications.filter((a) => a.status === 'SUBMITTED').length,
        awarded: applications.filter((a) => a.status === 'AWARDED').length,
        denied: applications.filter((a) => a.status === 'DENIED').length,
        totalAwarded: applications
          .filter((a) => a.outcome?.result === 'AWARDED')
          .reduce((sum, a) => sum + (a.outcome?.awardAmountReceived || 0), 0),
        successRate: applications.filter((a) => a.status === 'SUBMITTED').length
          ? applications.filter((a) => a.status === 'AWARDED').length / applications.filter((a) => a.status === 'SUBMITTED').length
          : 0,
      }
    },
  }

  /**
   * Database cleanup helpers
   */
  cleanup = {
    /**
     * Delete all test data for a student
     */
    async deleteStudentData(studentId: string) {
      await prisma.application.deleteMany({ where: { studentId } })
      await prisma.match.deleteMany({ where: { studentId } })
      await prisma.essay.deleteMany({ where: { studentId } })
      await prisma.document.deleteMany({ where: { studentId } })
      await prisma.outcome.deleteMany({ where: { studentId } })
    },

    /**
     * Delete all test scholarships
     */
    async deleteScholarships(scholarshipIds: string[]) {
      await prisma.scholarship.deleteMany({
        where: { id: { in: scholarshipIds } },
      })
    },

    /**
     * Reset database to clean state (use with caution!)
     */
    async resetTestData() {
      // Only run in test environment
      if (process.env.NODE_ENV !== 'test') {
        throw new Error('resetTestData can only be run in test environment')
      }

      // Delete in correct order to avoid foreign key constraints
      await prisma.outcome.deleteMany()
      await prisma.recommendation.deleteMany()
      await prisma.essay.deleteMany()
      await prisma.document.deleteMany()
      await prisma.timeline.deleteMany()
      await prisma.application.deleteMany()
      await prisma.match.deleteMany()
      await prisma.scholarship.deleteMany()
      await prisma.profileHistory.deleteMany()
      await prisma.profileVersion.deleteMany()
      await prisma.profile.deleteMany()
      await prisma.student.deleteMany()
      await prisma.user.deleteMany()
    },
  }

  /**
   * Direct Prisma access for custom queries
   */
  get prisma() {
    return prisma
  }
}
