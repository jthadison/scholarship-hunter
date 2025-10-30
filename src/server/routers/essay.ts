/**
 * Essay Router
 * Story 4.6 - Essay Prompt Analysis
 * Story 4.7 - Essay Editor with 6-Phase Guidance
 * Story 4.8 - Essay Library & Adaptability Scoring
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { analyzePrompt, hashPrompt, type PromptAnalysisWithMeta } from "../services/promptAnalyzer";
import type { PromptAnalysis } from "../../types/essay";
import type { Prisma } from "@prisma/client";
import { extractThemes } from "../services/essayThemeExtractor";
import {
  calculateAdaptabilityBatch,
  generateAdaptationGuidance,
} from "../services/essayAdaptability";

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
   * Update essay content (Story 4.7 - with phase metadata support)
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
        discoveryNotes: z.any().optional(), // JSON field
        outline: z.any().optional(), // JSON field
        revisionFeedback: z.any().optional(), // JSON field
        createVersion: z.boolean().default(false), // Whether to create version snapshot
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, createVersion, ...data } = input;

      // Verify ownership
      const essay = await ctx.prisma.essay.findUnique({
        where: { id },
        select: {
          studentId: true,
          content: true,
          wordCount: true,
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
      const newWordCount =
        data.content !== undefined
          ? data.content.trim().split(/\s+/).filter(Boolean).length
          : undefined;

      // Auto-create version if content changed significantly (>50 words difference)
      const shouldCreateVersion =
        createVersion ||
        (data.content &&
          essay.content &&
          Math.abs((newWordCount ?? 0) - essay.wordCount) > 50);

      // If creating version, first create a snapshot of current state
      if (shouldCreateVersion && essay.content) {
        await ctx.prisma.essay.create({
          data: {
            studentId: essay.studentId,
            applicationId: null, // Versions don't link to application
            title: `Version of ${id}`,
            prompt: "", // Not needed for versions
            content: essay.content,
            wordCount: essay.wordCount,
            phase: "DISCOVERY", // Placeholder
            previousVersionId: id,
          },
        });
      }

      return ctx.prisma.essay.update({
        where: { id },
        data: {
          ...data,
          ...(newWordCount !== undefined && { wordCount: newWordCount }),
          updatedAt: new Date(),
        },
      });
    }),

  /**
   * Get version history for an essay (Story 4.7)
   */
  getVersionHistory: protectedProcedure
    .input(z.object({ essayId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership of main essay
      const mainEssay = await ctx.prisma.essay.findUnique({
        where: { id: input.essayId },
        select: {
          student: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!mainEssay) {
        throw new Error("Essay not found");
      }

      if (mainEssay.student.userId !== ctx.userId) {
        throw new Error("Unauthorized");
      }

      // Get all versions (versions have previousVersionId pointing to this essay)
      const versions = await ctx.prisma.essay.findMany({
        where: {
          previousVersionId: input.essayId,
        },
        select: {
          id: true,
          content: true,
          wordCount: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50, // Limit to last 50 versions
      });

      return versions;
    }),

  /**
   * Restore a previous version (Story 4.7)
   */
  restoreVersion: protectedProcedure
    .input(
      z.object({
        essayId: z.string(),
        versionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const essay = await ctx.prisma.essay.findUnique({
        where: { id: input.essayId },
        select: {
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

      // Get the version to restore
      const version = await ctx.prisma.essay.findUnique({
        where: { id: input.versionId },
        select: {
          content: true,
          wordCount: true,
        },
      });

      if (!version) {
        throw new Error("Version not found");
      }

      // Update main essay with version content
      return ctx.prisma.essay.update({
        where: { id: input.essayId },
        data: {
          content: version.content,
          wordCount: version.wordCount,
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

  /**
   * Generate discovery ideas (Story 4.7 - Discovery Phase)
   */
  generateDiscoveryIdeas: protectedProcedure
    .input(
      z.object({
        essayId: z.string(),
        prompt: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { essayId, prompt } = input;

      // Get essay and verify ownership
      const essay = await ctx.prisma.essay.findUnique({
        where: { id: essayId },
        include: {
          student: {
            select: {
              id: true,
              userId: true,
              profile: true,
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

      // Import AI service
      const { generateDiscoveryIdeas } = await import("../services/aiEssayAssistant");

      const ideas = await generateDiscoveryIdeas(
        prompt,
        essay.student.profile || {},
        essay.student.id
      );

      return ideas;
    }),

  /**
   * Get contextual feedback on paragraph (Story 4.7 - Drafting Phase)
   */
  getContextualFeedback: protectedProcedure
    .input(
      z.object({
        essayId: z.string(),
        paragraphText: z.string().min(10),
        prompt: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const essay = await ctx.prisma.essay.findUnique({
        where: { id: input.essayId },
        select: {
          student: {
            select: {
              id: true,
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

      const { getContextualFeedback } = await import("../services/aiEssayAssistant");

      const suggestions = await getContextualFeedback(
        input.paragraphText,
        input.prompt,
        essay.student.id
      );

      return suggestions;
    }),

  /**
   * Analyze essay for revision (Story 4.7 - Revision Phase)
   */
  analyzeForRevision: protectedProcedure
    .input(
      z.object({
        essayId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get essay and verify ownership
      const essay = await ctx.prisma.essay.findUnique({
        where: { id: input.essayId },
        select: {
          content: true,
          prompt: true,
          student: {
            select: {
              id: true,
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

      const { analyzeForRevision } = await import("../services/aiEssayAssistant");

      const feedback = await analyzeForRevision(
        essay.content,
        essay.prompt,
        essay.student.id
      );

      return feedback;
    }),

  /**
   * Check grammar and style (Story 4.7 - Polish Phase)
   */
  checkGrammarAndStyle: protectedProcedure
    .input(
      z.object({
        essayId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get essay and verify ownership
      const essay = await ctx.prisma.essay.findUnique({
        where: { id: input.essayId },
        select: {
          content: true,
          student: {
            select: {
              id: true,
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

      const { checkGrammarAndStyle } = await import("../services/aiEssayAssistant");

      const analysis = await checkGrammarAndStyle(essay.content, essay.student.id);

      return analysis;
    }),

  /**
   * Validate authenticity (Story 4.7 - Finalization Phase)
   */
  validateAuthenticity: protectedProcedure
    .input(
      z.object({
        essayId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get essay and verify ownership
      const essay = await ctx.prisma.essay.findUnique({
        where: { id: input.essayId },
        select: {
          content: true,
          student: {
            select: {
              id: true,
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

      const { validateAuthenticity } = await import("../services/aiEssayAssistant");

      const score = await validateAuthenticity(essay.content, essay.student.id);

      return score;
    }),

  /**
   * Generate sentence starters for writer's block (Story 4.7 - Drafting Phase)
   */
  generateSentenceStarters: protectedProcedure
    .input(
      z.object({
        essayId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get essay and verify ownership
      const essay = await ctx.prisma.essay.findUnique({
        where: { id: input.essayId },
        select: {
          content: true,
          prompt: true,
          student: {
            select: {
              id: true,
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

      const { generateSentenceStarters } = await import("../services/aiEssayAssistant");

      const help = await generateSentenceStarters(
        essay.content,
        essay.prompt,
        essay.student.id
      );

      return help;
    }),

  // ==================================================================================
  // STORY 4.8: Essay Library & Adaptability Scoring
  // ==================================================================================

  /**
   * Get essay library (all completed essays) - Story 4.8
   */
  getLibrary: protectedProcedure
    .input(
      z.object({
        studentId: z.string().cuid(),
        sortBy: z.enum(['recent', 'quality', 'adaptable', 'alphabetical']).optional().default('recent'),
        filterThemes: z.array(z.string()).optional(),
        wordCountMin: z.number().optional(),
        wordCountMax: z.number().optional(),
        searchTerm: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { studentId, sortBy, filterThemes, wordCountMin, wordCountMax, searchTerm } = input;

      // Verify user owns this student profile
      const student = await ctx.prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this student profile");
      }

      // Build where clause
      const where: Prisma.EssayWhereInput = {
        studentId,
        isComplete: true, // Only completed essays in library
        ...(filterThemes && filterThemes.length > 0 && {
          themes: {
            hasSome: filterThemes,
          },
        }),
        ...(wordCountMin !== undefined && {
          wordCount: { gte: wordCountMin },
        }),
        ...(wordCountMax !== undefined && {
          wordCount: { lte: wordCountMax },
        }),
        ...(searchTerm && {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' as const } },
            { content: { contains: searchTerm, mode: 'insensitive' as const } },
          ],
        }),
      };

      // Build orderBy
      let orderBy: Prisma.EssayOrderByWithRelationInput | Prisma.EssayOrderByWithRelationInput[] = { updatedAt: 'desc' };
      if (sortBy === 'quality') {
        orderBy = { qualityScore: 'desc' };
      } else if (sortBy === 'alphabetical') {
        orderBy = { title: 'asc' };
      }

      const essays = await ctx.prisma.essay.findMany({
        where,
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
        orderBy,
      });

      return essays;
    }),

  /**
   * Search essay library - Story 4.8
   */
  searchLibrary: protectedProcedure
    .input(
      z.object({
        studentId: z.string().cuid(),
        searchTerm: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const { studentId, searchTerm } = input;

      // Verify ownership
      const student = await ctx.prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized");
      }

      const essays = await ctx.prisma.essay.findMany({
        where: {
          studentId,
          isComplete: true,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' as const } },
            { content: { contains: searchTerm, mode: 'insensitive' as const } },
            { themes: { hasSome: [searchTerm.toLowerCase()] } },
          ],
        },
        include: {
          application: {
            select: {
              scholarship: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      });

      return essays;
    }),

  /**
   * Update essay themes - Story 4.8
   */
  updateThemes: protectedProcedure
    .input(
      z.object({
        essayId: z.string(),
        themes: z.array(z.string()).max(8, "Maximum 8 themes allowed"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const essay = await ctx.prisma.essay.findUnique({
        where: { id: input.essayId },
        select: {
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

      return ctx.prisma.essay.update({
        where: { id: input.essayId },
        data: {
          themes: input.themes,
        },
      });
    }),

  /**
   * Extract themes from essay content using AI - Story 4.8
   */
  extractThemes: protectedProcedure
    .input(
      z.object({
        essayId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get essay and verify ownership
      const essay = await ctx.prisma.essay.findUnique({
        where: { id: input.essayId },
        select: {
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

      // Extract themes using AI
      const themes = await extractThemes(essay.content);

      // Update essay with extracted themes
      await ctx.prisma.essay.update({
        where: { id: input.essayId },
        data: {
          themes,
        },
      });

      return { themes };
    }),

  /**
   * Calculate adaptability scores for library essays against new prompt - Story 4.8
   */
  getAdaptabilityScores: protectedProcedure
    .input(
      z.object({
        studentId: z.string().cuid(),
        newPrompt: z.string().min(10),
        newPromptThemes: z.array(z.string()),
        newPromptWordLimit: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { studentId, newPrompt, newPromptThemes, newPromptWordLimit } = input;

      // Verify ownership
      const student = await ctx.prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized");
      }

      // Get all completed essays from library
      const libraryEssays = await ctx.prisma.essay.findMany({
        where: {
          studentId,
          isComplete: true,
        },
        select: {
          id: true,
          content: true,
          prompt: true,
          wordCount: true,
          themes: true,
          outline: true,
        },
      });

      if (libraryEssays.length === 0) {
        return [];
      }

      // Calculate adaptability scores in parallel
      const scores = await calculateAdaptabilityBatch(
        libraryEssays.map(e => ({
          id: e.id,
          content: e.content,
          prompt: e.prompt,
          wordCount: e.wordCount,
          themes: e.themes,
          outline: e.outline,
        })),
        newPrompt,
        newPromptThemes,
        newPromptWordLimit
      );

      return scores;
    }),

  /**
   * Get adaptation guidance for specific essay - Story 4.8
   */
  getAdaptationGuidance: protectedProcedure
    .input(
      z.object({
        essayId: z.string(),
        newPrompt: z.string().min(10),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get essay and verify ownership
      const essay = await ctx.prisma.essay.findUnique({
        where: { id: input.essayId },
        select: {
          content: true,
          prompt: true,
          wordCount: true,
          themes: true,
          outline: true,
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

      // Generate adaptation guidance
      const guidance = await generateAdaptationGuidance(
        {
          id: input.essayId,
          content: essay.content,
          prompt: essay.prompt,
          wordCount: essay.wordCount,
          themes: essay.themes,
          outline: essay.outline,
        },
        input.newPrompt
      );

      return guidance;
    }),

  /**
   * Clone an essay for adaptation - Story 4.8
   */
  cloneEssay: protectedProcedure
    .input(
      z.object({
        essayId: z.string(),
        newApplicationId: z.string().optional(),
        newPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { essayId, newApplicationId, newPrompt } = input;

      // Get original essay and verify ownership
      const originalEssay = await ctx.prisma.essay.findUnique({
        where: { id: essayId },
        include: {
          student: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      });

      if (!originalEssay) {
        throw new Error("Essay not found");
      }

      if (originalEssay.student.userId !== ctx.userId) {
        throw new Error("Unauthorized");
      }

      // Create cloned essay
      const clonedEssay = await ctx.prisma.essay.create({
        data: {
          studentId: originalEssay.studentId,
          applicationId: newApplicationId,
          title: `${originalEssay.title} (Adapted)`,
          prompt: newPrompt || originalEssay.prompt,
          content: originalEssay.content, // Copy content
          wordCount: originalEssay.wordCount,
          themes: originalEssay.themes,
          phase: "REVISION", // Start in REVISION phase (skip Discovery/Structure/Drafting)
          aiGenerated: false,
          personalized: false,
          clonedFrom: essayId, // Link to original
          isComplete: false, // Not complete until student finalizes
        },
      });

      return clonedEssay;
    }),

  /**
   * Get library statistics - Story 4.8
   */
  getLibraryStats: protectedProcedure
    .input(
      z.object({
        studentId: z.string().cuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const student = await ctx.prisma.student.findUnique({
        where: { id: input.studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized");
      }

      // Get all completed essays
      const essays = await ctx.prisma.essay.findMany({
        where: {
          studentId: input.studentId,
          isComplete: true,
        },
        select: {
          id: true,
          wordCount: true,
          themes: true,
          qualityScore: true,
          clonedFrom: true,
          createdAt: true,
        },
      });

      // Calculate statistics
      const totalEssays = essays.length;
      const totalWords = essays.reduce((sum, essay) => sum + essay.wordCount, 0);

      // Most common themes
      const themeCount: Record<string, number> = {};
      essays.forEach(essay => {
        essay.themes.forEach(theme => {
          themeCount[theme] = (themeCount[theme] || 0) + 1;
        });
      });
      const topThemes = Object.entries(themeCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([theme, count]) => ({ theme, count }));

      // Average quality score
      const scoresWithValues = essays.filter(e => e.qualityScore !== null);
      const avgQualityScore = scoresWithValues.length > 0
        ? scoresWithValues.reduce((sum, essay) => sum + (essay.qualityScore || 0), 0) / scoresWithValues.length
        : null;

      // Reuse rate
      const clonedEssaysCount = essays.filter(e => e.clonedFrom !== null).length;
      const reuseRate = totalEssays > 0 ? (clonedEssaysCount / totalEssays) * 100 : 0;

      // Time saved estimate (assume 45 min per original essay, 15 min per adapted)
      const timeSavedMinutes = clonedEssaysCount * (45 - 15);
      const timeSavedHours = Math.round(timeSavedMinutes / 60);

      // Essays per month (last 12 months)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const essaysOverTime = essays.filter(e => e.createdAt >= oneYearAgo);
      const monthlyData: Record<string, number> = {};
      essaysOverTime.forEach(essay => {
        const monthKey = essay.createdAt.toISOString().substring(0, 7); // YYYY-MM
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      });

      return {
        totalEssays,
        totalWords,
        topThemes,
        avgQualityScore,
        reuseRate,
        timeSavedHours,
        essaysPerMonth: Object.entries(monthlyData).map(([month, count]) => ({
          month,
          count,
        })),
        themeCount,
      };
    }),
});
