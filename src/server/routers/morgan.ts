import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { calculateAdaptabilityScore } from "../services/essayAdaptability";
import { EssayPhase } from "@prisma/client";

/**
 * Morgan Router
 * Handles Morgan dashboard data aggregation and essay writing guidance
 * Story 4.10: Morgan Agent - Essay Strategist Dashboard
 */

export const morganRouter = router({
  /**
   * Get essay summary for dashboard overview
   * AC1, AC6: In-progress essays, completed essays, library overview, writing progress stats
   */
  getEssaySummary: protectedProcedure
    .input(z.object({ studentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns this student profile
      const student = await ctx.prisma.student.findUnique({
        where: { id: input.studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this student profile");
      }

      // Get in-progress essays (not complete)
      const inProgress = await ctx.prisma.essay.findMany({
        where: {
          studentId: input.studentId,
          isComplete: false,
        },
        include: {
          application: {
            include: {
              scholarship: {
                select: {
                  name: true,
                  deadline: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      // Get completed essays (library)
      const library = await ctx.prisma.essay.findMany({
        where: {
          studentId: input.studentId,
          isComplete: true,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          themes: true,
          qualityScore: true,
          wordCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Calculate writing progress stats (AC6)
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Essays drafted this week
      const weeklyDrafts = await ctx.prisma.essay.count({
        where: {
          studentId: input.studentId,
          createdAt: { gte: oneWeekAgo },
        },
      });

      // Average quality score (only completed essays with scores)
      const libraryWithScores = library.filter((e) => e.qualityScore !== null);
      const avgQualityScore =
        libraryWithScores.length > 0
          ? libraryWithScores.reduce((sum, e) => sum + (e.qualityScore ?? 0), 0) /
            libraryWithScores.length
          : 0;

      return {
        inProgress: inProgress.map((essay) => ({
          id: essay.id,
          title: essay.title,
          phase: essay.phase,
          wordCount: essay.wordCount,
          qualityScore: essay.qualityScore,
          updatedAt: essay.updatedAt,
          applicationId: essay.applicationId,
          scholarshipName: essay.application?.scholarship.name,
          deadline: essay.application?.scholarship.deadline,
        })),
        completed: library,
        stats: {
          weeklyDrafts,
          librarySize: library.length,
          avgQualityScore: Math.round(avgQualityScore),
        },
      };
    }),

  /**
   * Get reusability suggestions
   * AC4: Compare library essays to active applications, show adaptability scores
   */
  getReusabilitySuggestions: protectedProcedure
    .input(z.object({ studentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns this student profile
      const student = await ctx.prisma.student.findUnique({
        where: { id: input.studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this student profile");
      }

      // Get library essays (completed)
      const libraryEssays = await ctx.prisma.essay.findMany({
        where: {
          studentId: input.studentId,
          isComplete: true,
        },
        select: {
          id: true,
          title: true,
          content: true,
          prompt: true,
          themes: true,
          wordCount: true,
          adaptabilityScores: true,
        },
      });

      // Get active applications needing essays
      const activeApplications = await ctx.prisma.application.findMany({
        where: {
          studentId: input.studentId,
          status: { in: ["TODO", "IN_PROGRESS"] },
        },
        include: {
          scholarship: {
            select: {
              id: true,
              name: true,
              deadline: true,
              essayPrompts: true,
            },
          },
          essays: {
            select: {
              id: true,
              prompt: true,
            },
          },
        },
      });

      interface Suggestion {
        essay: {
          id: string;
          title: string;
          themes: string[];
          wordCount: number;
        };
        adaptabilityScore: number;
        targetScholarship: {
          id: string;
          name: string;
          deadline: Date;
        };
        targetPrompt: string;
        matchingThemes: string[];
        adaptableSections: string[];
      }

      const suggestions: Suggestion[] = [];

      // Compare each library essay to each active application's prompts
      for (const app of activeApplications) {
        const prompts = (app.scholarship.essayPrompts as Array<{
          question: string;
          wordLimit?: number;
        }>) ?? [];

        // Only check prompts that don't already have essays
        const existingPrompts = new Set(app.essays.map((e) => e.prompt));

        for (const promptObj of prompts) {
          if (existingPrompts.has(promptObj.question)) continue;

          // Compare with each library essay
          for (const essay of libraryEssays) {
            try {
              // Calculate adaptability score
              const adaptability = await calculateAdaptabilityScore(
                essay.content,
                essay.prompt,
                promptObj.question,
                {
                  currentThemes: essay.themes,
                  sourceWordCount: essay.wordCount,
                  targetWordLimit: promptObj.wordLimit,
                }
              );

              // Only suggest if adaptability >= 70%
              if (adaptability.score >= 70) {
                suggestions.push({
                  essay: {
                    id: essay.id,
                    title: essay.title,
                    themes: essay.themes,
                    wordCount: essay.wordCount,
                  },
                  adaptabilityScore: adaptability.score,
                  targetScholarship: {
                    id: app.scholarship.id,
                    name: app.scholarship.name,
                    deadline: app.scholarship.deadline,
                  },
                  targetPrompt: promptObj.question,
                  matchingThemes: adaptability.matchingThemes,
                  adaptableSections: ["Introduction", "Body", "Conclusion"], // Simplified
                });
              }
            } catch (error) {
              console.error(`Error calculating adaptability for essay ${essay.id}:`, error);
              // Continue to next essay
            }
          }
        }
      }

      // Sort by adaptability score (highest first) and take top 3
      suggestions.sort((a, b) => b.adaptabilityScore - a.adaptabilityScore);

      return suggestions.slice(0, 3);
    }),

  /**
   * Get quality alerts for low-scoring essays
   * AC5: Flag essays with qualityScore < 60, show improvement recommendations
   */
  getQualityAlerts: protectedProcedure
    .input(z.object({ studentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns this student profile
      const student = await ctx.prisma.student.findUnique({
        where: { id: input.studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this student profile");
      }

      // Get essays with quality scores below threshold (60)
      const lowQualityEssays = await ctx.prisma.essay.findMany({
        where: {
          studentId: input.studentId,
          isComplete: false, // Only alert for in-progress essays
          qualityScore: { lt: 60 },
        },
        include: {
          application: {
            select: {
              id: true,
              scholarship: {
                select: {
                  name: true,
                  deadline: true,
                },
              },
            },
          },
        },
        orderBy: { qualityScore: "asc" }, // Lowest scores first
      });

      interface Alert {
        essay: {
          id: string;
          title: string;
          phase: EssayPhase;
          wordCount: number;
        };
        qualityScore: number;
        scholarshipName: string | null;
        deadline: Date | null;
        applicationId: string | null;
        criticalIssues: string[];
        topSuggestions: Array<{
          priority: string;
          issue: string;
          recommendation: string;
        }>;
      }

      const alerts: Alert[] = lowQualityEssays.map((essay) => {
        // Parse quality assessment for critical issues and suggestions
        const assessment = essay.qualityAssessment as {
          dimensions?: {
            memorability?: { score: number; explanation: string };
            emotionalImpact?: { score: number; explanation: string };
            authenticity?: { score: number; explanation: string };
            promptAlignment?: { score: number; explanation: string };
            technicalQuality?: { score: number; explanation: string };
          };
          topSuggestions?: Array<{
            priority: string;
            issue: string;
            recommendation: string;
          }>;
        } | null;

        const criticalIssues: string[] = [];
        if (assessment?.dimensions) {
          const dims = assessment.dimensions;
          if (dims.memorability && dims.memorability.score < 50) {
            criticalIssues.push("Low memorability - essay doesn't stand out");
          }
          if (dims.authenticity && dims.authenticity.score < 50) {
            criticalIssues.push("Lacks authenticity - needs more personal voice");
          }
          if (dims.promptAlignment && dims.promptAlignment.score < 50) {
            criticalIssues.push("Poor prompt alignment - doesn't fully answer question");
          }
        }

        // Default critical issues if none found
        if (criticalIssues.length === 0) {
          criticalIssues.push("Overall quality needs improvement");
        }

        return {
          essay: {
            id: essay.id,
            title: essay.title,
            phase: essay.phase,
            wordCount: essay.wordCount,
          },
          qualityScore: essay.qualityScore ?? 0,
          scholarshipName: essay.application?.scholarship.name ?? null,
          deadline: essay.application?.scholarship.deadline ?? null,
          applicationId: essay.applicationId,
          criticalIssues,
          topSuggestions: assessment?.topSuggestions?.slice(0, 3) ?? [],
        };
      });

      return alerts;
    }),
});
