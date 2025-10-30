/**
 * Essay Router
 * Story 4.6 - Essay Prompt Analysis
 * Story 4.7 - Essay Editor with 6-Phase Guidance
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { analyzePrompt, hashPrompt, type PromptAnalysisWithMeta } from "../services/promptAnalyzer";
import type { PromptAnalysis } from "../../types/essay";
import type { Prisma } from "@prisma/client";

export const essayRouter = router({
  /**
   * Analyze an essay prompt using AI
   * Supports caching - checks if identical prompt has been analyzed before
   */
  analyzePrompt: protectedProcedure
    .input(
      z.object({
        essayId: z.string().optional(),
        promptText: z.string().min(10, "Prompt must be at least 10 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { essayId, promptText } = input;

      // Check cache first - look for any essay with this exact prompt hash
      const promptHash = hashPrompt(promptText);
      const cachedEssay = await ctx.prisma.essay.findFirst({
        where: {
          promptHash,
          promptAnalysis: {
            not: undefined,
          },
        },
        select: { promptAnalysis: true },
      });

      let analysis: PromptAnalysisWithMeta;

      if (cachedEssay?.promptAnalysis) {
        // Return cached analysis
        analysis = cachedEssay.promptAnalysis as unknown as PromptAnalysisWithMeta;
      } else {
        // No cache hit - analyze the prompt
        analysis = await analyzePrompt(promptText);
      }

      // If essayId provided, save analysis to that essay
      if (essayId) {
        await ctx.prisma.essay.update({
          where: { id: essayId },
          data: {
            promptAnalysis: analysis as unknown as Prisma.InputJsonValue,
            promptHash,
          },
        });
      }

      return analysis;
    }),

  /**
   * Get saved prompt analysis for an essay
   */
  getPromptAnalysis: protectedProcedure
    .input(z.object({ essayId: z.string() }))
    .query(async ({ ctx, input }) => {
      const essay = await ctx.prisma.essay.findUnique({
        where: { id: input.essayId },
        select: { promptAnalysis: true, promptHash: true },
      });

      if (!essay?.promptAnalysis) {
        return null;
      }

      return essay.promptAnalysis as unknown as PromptAnalysis;
    }),

  /**
   * Create a new essay
   */
  create: protectedProcedure
    .input(
      z.object({
        studentId: z.string().cuid(),
        title: z.string().min(1, "Title is required"),
        prompt: z.string().min(10, "Prompt must be at least 10 characters"),
        applicationId: z.string().optional(),
        analyzePromptImmediately: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { studentId, title, prompt, applicationId, analyzePromptImmediately } = input;

      // Verify user owns this student profile
      const student = await ctx.prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this student profile");
      }

      // Create the essay
      const essay = await ctx.prisma.essay.create({
        data: {
          title,
          prompt,
          content: "",
          wordCount: 0,
          studentId,
          applicationId,
          phase: "DISCOVERY",
        },
      });

      // Optionally analyze prompt immediately
      if (analyzePromptImmediately) {
        const promptHash = hashPrompt(prompt);

        // Check cache
        const cachedEssay = await ctx.prisma.essay.findFirst({
          where: {
            promptHash,
            promptAnalysis: {
              not: undefined,
            },
          },
          select: { promptAnalysis: true },
        });

        const analysis = cachedEssay?.promptAnalysis
          ? (cachedEssay.promptAnalysis as unknown as PromptAnalysisWithMeta)
          : await analyzePrompt(prompt);

        // Save analysis
        await ctx.prisma.essay.update({
          where: { id: essay.id },
          data: {
            promptAnalysis: analysis as unknown as Prisma.InputJsonValue,
            promptHash,
          },
        });

        return { ...essay, promptAnalysis: analysis };
      }

      return essay;
    }),

  /**
   * Get essay by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const essay = await ctx.prisma.essay.findUnique({
        where: { id: input.id },
        include: {
          student: {
            select: {
              id: true,
              userId: true,
            },
          },
          application: {
            select: {
              id: true,
              scholarship: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!essay) {
        throw new Error("Essay not found");
      }

      // Verify ownership
      if (essay.student.userId !== ctx.userId) {
        throw new Error("Unauthorized");
      }

      return essay;
    }),

  /**
   * List all essays for the current student
   */
  list: protectedProcedure
    .input(
      z
        .object({
          studentId: z.string().cuid(),
          applicationId: z.string().optional(),
          phase: z.enum([
            "DISCOVERY",
            "STRUCTURE",
            "DRAFTING",
            "REVISION",
            "POLISH",
            "FINALIZATION",
          ]).optional(),
          isComplete: z.boolean().optional(),
        })
    )
    .query(async ({ ctx, input }) => {
      const { studentId, ...filters } = input;

      // Verify user owns this student profile
      const student = await ctx.prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this student profile");
      }

      const essays = await ctx.prisma.essay.findMany({
        where: {
          studentId,
          ...(filters.applicationId && { applicationId: filters.applicationId }),
          ...(filters.phase && { phase: filters.phase }),
          ...(filters.isComplete !== undefined && {
            isComplete: filters.isComplete,
          }),
        },
        include: {
          application: {
            select: {
              id: true,
              scholarship: {
                select: {
                  id: true,
                  name: true,
                  deadline: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      return essays;
    }),

  /**
   * Update essay content
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
        phase: z.enum([
          "DISCOVERY",
          "STRUCTURE",
          "DRAFTING",
          "REVISION",
          "POLISH",
          "FINALIZATION",
        ]).optional(),
        isComplete: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify ownership
      const essay = await ctx.prisma.essay.findUnique({
        where: { id },
        select: {
          studentId: true,
          content: true,
          student: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!essay) {
        throw new Error("Essay not found");
      }

      if (essay.student.userId !== ctx.userId) {
        throw new Error("Unauthorized");
      }

      // Calculate word count if content is being updated
      const wordCount =
        data.content !== undefined
          ? data.content.trim().split(/\s+/).filter(Boolean).length
          : undefined;

      return ctx.prisma.essay.update({
        where: { id },
        data: {
          ...data,
          ...(wordCount !== undefined && { wordCount }),
          updatedAt: new Date(),
        },
      });
    }),

  /**
   * Delete an essay
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const essay = await ctx.prisma.essay.findUnique({
        where: { id: input.id },
        select: {
          studentId: true,
          student: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!essay) {
        throw new Error("Essay not found");
      }

      if (essay.student.userId !== ctx.userId) {
        throw new Error("Unauthorized");
      }

      await ctx.prisma.essay.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
