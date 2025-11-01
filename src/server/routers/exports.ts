/**
 * Exports Router (tRPC)
 *
 * Provides type-safe API endpoints for export operations:
 * - generateApplicationsCSV: Export applications list as CSV
 * - generateFundingSummaryPDF: Generate funding summary PDF report
 * - generateAnalyticsPDF: Generate comprehensive analytics PDF report
 * - getHistory: Get export history for student
 * - logExport: Log an export action
 *
 * Story: 5.9 - Export & Reporting
 * @module server/routers/exports
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { StudentData, FundingData, AnalyticsData } from "@/lib/exports/pdf-generator";
import { ExportType, ExportFormat } from "@prisma/client";

/**
 * Privacy settings schema
 */
const PrivacySettingsSchema = z.object({
  excludePersonalInfo: z.boolean().optional().default(false),
  excludeSensitiveDetails: z.boolean().optional().default(false),
});

/**
 * Date range schema
 */
const DateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
});

/**
 * Export router with procedures for generating exports
 */
export const exportsRouter = router({
  /**
   * Get applications data for CSV export
   *
   * Fetches all applications with scholarship and outcome data
   * Applies date range filtering if specified
   *
   * @param dateRange - Optional date range filter
   * @returns Applications with related data
   */
  getApplicationsForExport: protectedProcedure
    .input(
      z.object({
        dateRange: DateRangeSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const studentId = ctx.userId;

      // Build where clause with date filtering
      const where: any = {
        studentId,
      };

      if (input.dateRange) {
        where.dateAdded = {
          gte: input.dateRange.start,
          lte: input.dateRange.end,
        };
      }

      // Fetch applications with related data
      const applications = await ctx.prisma.application.findMany({
        where,
        include: {
          scholarship: {
            select: {
              name: true,
              provider: true,
              awardAmount: true,
              deadline: true,
            },
          },
          outcome: {
            select: {
              result: true,
              awardAmountReceived: true,
              decisionDate: true,
            },
          },
        },
        orderBy: {
          dateAdded: "desc",
        },
      });

      return applications;
    }),

  /**
   * Get funding data for PDF reports
   *
   * Aggregates funding metrics and awards list
   *
   * @param dateRange - Optional date range filter
   * @returns Funding summary data
   */
  getFundingData: protectedProcedure
    .input(
      z.object({
        dateRange: DateRangeSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const studentId = ctx.userId;

      // Get student data
      const student = await ctx.prisma.student.findUnique({
        where: { id: studentId },
        select: {
          firstName: true,
          lastName: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      // Build where clause
      const where: any = {
        studentId,
        result: "AWARDED",
      };

      if (input.dateRange) {
        where.decisionDate = {
          gte: input.dateRange.start,
          lte: input.dateRange.end,
        };
      }

      // Get all awarded outcomes
      const awardedOutcomes = await ctx.prisma.outcome.findMany({
        where,
        include: {
          application: {
            include: {
              scholarship: {
                select: {
                  name: true,
                  provider: true,
                },
              },
            },
          },
        },
      });

      // Calculate metrics
      const totalFunding = awardedOutcomes.reduce(
        (sum, outcome) => sum + (outcome.awardAmountReceived || 0),
        0
      );

      const awardsCount = awardedOutcomes.length;

      // Get total submitted for success rate
      const totalSubmitted = await ctx.prisma.application.count({
        where: {
          studentId,
          status: {
            in: ["SUBMITTED", "AWAITING_DECISION", "AWARDED", "DENIED", "WAITLISTED"],
          },
        },
      });

      const successRate = totalSubmitted > 0 ? awardsCount / totalSubmitted : 0;
      const averageAward = awardsCount > 0 ? totalFunding / awardsCount : 0;

      const awards = awardedOutcomes.map((outcome) => ({
        scholarshipName: outcome.application.scholarship.name,
        awardAmount: outcome.awardAmountReceived || 0,
        decisionDate: outcome.decisionDate,
        provider: outcome.application.scholarship.provider,
      }));

      const studentData: StudentData = {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.user.email,
      };

      const fundingData: FundingData = {
        totalFunding,
        awardsCount,
        successRate,
        averageAward,
        awards,
      };

      return {
        studentData,
        fundingData,
      };
    }),

  /**
   * Get analytics data for PDF reports
   *
   * Aggregates comprehensive analytics metrics
   *
   * @param dateRange - Optional date range filter
   * @returns Analytics data
   */
  getAnalyticsData: protectedProcedure
    .input(
      z.object({
        dateRange: DateRangeSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const studentId = ctx.userId;

      // Get student data
      const student = await ctx.prisma.student.findUnique({
        where: { id: studentId },
        select: {
          firstName: true,
          lastName: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      // Build date filter
      const dateFilter: any = {};
      let periodStart = new Date(2020, 0, 1);
      let periodEnd = new Date();

      if (input.dateRange) {
        dateFilter.dateAdded = {
          gte: input.dateRange.start,
          lte: input.dateRange.end,
        };
        periodStart = input.dateRange.start;
        periodEnd = input.dateRange.end;
      }

      // Get applications
      const applications = await ctx.prisma.application.findMany({
        where: {
          studentId,
          ...dateFilter,
        },
        include: {
          outcome: true,
        },
      });

      const totalApplications = applications.length;
      const totalSubmitted = applications.filter((app) =>
        ["SUBMITTED", "AWAITING_DECISION", "AWARDED", "DENIED", "WAITLISTED"].includes(app.status)
      ).length;

      const outcomes = applications
        .map((app) => app.outcome)
        .filter((outcome) => outcome !== null);

      const totalAwarded = outcomes.filter((o) => o?.result === "AWARDED").length;
      const totalDenied = outcomes.filter((o) => o?.result === "DENIED").length;

      const successRate = totalSubmitted > 0 ? totalAwarded / totalSubmitted : 0;

      const totalFunding = outcomes
        .filter((o) => o?.result === "AWARDED")
        .reduce((sum, o) => sum + (o?.awardAmountReceived || 0), 0);

      const averageAward = totalAwarded > 0 ? totalFunding / totalAwarded : 0;

      // Get tier breakdown
      const tierBreakdown = await ctx.prisma.application.groupBy({
        by: ["priorityTier"],
        where: {
          studentId,
          priorityTier: { not: null },
          ...dateFilter,
        },
        _count: {
          _all: true,
        },
      });

      const tierBreakdownData = await Promise.all(
        tierBreakdown.map(async (tier) => {
          if (!tier.priorityTier) return null;

          const tierApplications = await ctx.prisma.application.findMany({
            where: {
              studentId,
              priorityTier: tier.priorityTier,
              ...dateFilter,
            },
            include: {
              outcome: true,
            },
          });

          const tierSubmitted = tierApplications.filter((app) =>
            ["SUBMITTED", "AWAITING_DECISION", "AWARDED", "DENIED", "WAITLISTED"].includes(app.status)
          ).length;

          const tierAwarded = tierApplications.filter(
            (app) => app.outcome?.result === "AWARDED"
          ).length;

          const tierSuccessRate = tierSubmitted > 0 ? tierAwarded / tierSubmitted : 0;

          return {
            tier: tier.priorityTier,
            applications: tier._count._all,
            awarded: tierAwarded,
            successRate: tierSuccessRate,
          };
        })
      );

      const studentData: StudentData = {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.user.email,
      };

      const analyticsData: AnalyticsData = {
        totalApplications,
        totalSubmitted,
        totalAwarded,
        totalDenied,
        successRate,
        totalFunding,
        averageAward,
        periodStart,
        periodEnd,
        tierBreakdown: tierBreakdownData.filter((t) => t !== null) as any,
      };

      return {
        studentData,
        analyticsData,
      };
    }),

  /**
   * Log an export action to history
   *
   * Records export metadata for tracking and audit purposes
   *
   * @param exportType - Type of export (APPLICATIONS_LIST, FUNDING_SUMMARY, etc.)
   * @param format - File format (CSV, PDF)
   * @param dateRange - Optional date range used
   * @param privacySettings - Privacy settings applied
   * @param fileSize - Size of generated file in bytes
   */
  logExport: protectedProcedure
    .input(
      z.object({
        exportType: z.nativeEnum(ExportType),
        format: z.nativeEnum(ExportFormat),
        dateRange: DateRangeSchema.optional(),
        privacySettings: PrivacySettingsSchema.optional(),
        fileSize: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const studentId = ctx.userId;

      const exportLog = await ctx.prisma.exportHistory.create({
        data: {
          studentId,
          exportType: input.exportType,
          format: input.format,
          dateRangeStart: input.dateRange?.start,
          dateRangeEnd: input.dateRange?.end,
          privacySettings: input.privacySettings as any,
          fileSize: input.fileSize,
        },
      });

      return exportLog;
    }),

  /**
   * Get export history for authenticated student
   *
   * Returns last 20 export records ordered by most recent
   *
   * @returns Array of export history records
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.userId;

    const history = await ctx.prisma.exportHistory.findMany({
      where: { studentId },
      orderBy: { downloadedAt: "desc" },
      take: 20,
    });

    return history;
  }),

  /**
   * Delete an export from history
   *
   * Removes an export record from the database
   *
   * @param exportId - ID of export to delete
   */
  deleteExport: protectedProcedure
    .input(
      z.object({
        exportId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const studentId = ctx.userId;

      // Verify ownership before deleting
      const exportRecord = await ctx.prisma.exportHistory.findUnique({
        where: { id: input.exportId },
      });

      if (!exportRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Export record not found",
        });
      }

      if (exportRecord.studentId !== studentId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this export",
        });
      }

      await ctx.prisma.exportHistory.delete({
        where: { id: input.exportId },
      });

      return { success: true };
    }),
});
