import { z } from "zod";

/**
 * Essay Validation Schemas
 * Validates essay data including content, phase tracking, AI metadata, and quality assessment
 */

// Essay Phase Enum
const essayPhaseEnum = z.enum([
  "DISCOVERY",
  "STRUCTURE",
  "DRAFTING",
  "REVISION",
  "POLISH",
  "FINALIZATION",
]);

export const essayCreateSchema = z.object({
  studentId: z.string().cuid(),
  applicationId: z.string().cuid().optional(),

  // Content
  title: z.string().min(1, "Title is required"),
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
  content: z.string().default(""),
  wordCount: z.number().int().min(0).default(0),

  // Phase Tracking
  phase: essayPhaseEnum.default("DISCOVERY"),
  isComplete: z.boolean().default(false),

  // AI Metadata
  aiGenerated: z.boolean().default(false),
  aiPromptUsed: z.string().optional(),
  aiModel: z.string().optional(),
  personalized: z.boolean().default(false),

  // Quality Assessment
  qualityScore: z.number().min(0).max(100).optional(),
  qualityBreakdown: z.any().optional(), // JSON object with detailed scores
  improvementSuggestions: z.string().optional(),

  // Version Control
  version: z.number().int().positive().default(1),
  previousVersionId: z.string().cuid().optional(),

  // Reusability
  themes: z.array(z.string()).default([]),
  adaptabilityScores: z.any().optional(), // JSON object mapping prompts to scores
}).refine(
  (data) => {
    // If AI generated, aiModel should be provided
    if (data.aiGenerated && !data.aiModel) {
      return false;
    }
    return true;
  },
  {
    message: "AI model must be specified if essay is AI-generated",
    path: ["aiModel"],
  }
).refine(
  (data) => {
    // Word count should match content approximately (allow for some discrepancy)
    if (data.content && data.wordCount > 0) {
      const actualWordCount = data.content.trim().split(/\s+/).length;
      const discrepancy = Math.abs(actualWordCount - data.wordCount);
      return discrepancy <= 10; // Allow up to 10 word difference
    }
    return true;
  },
  {
    message: "Word count does not match content",
    path: ["wordCount"],
  }
);

// Base schema without refinements for updates
const essayBaseSchema = z.object({
  studentId: z.string().cuid(),
  applicationId: z.string().cuid().optional(),

  // Content
  title: z.string().min(1, "Title is required"),
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
  content: z.string().default(""),
  wordCount: z.number().int().min(0).default(0),

  // Phase Tracking
  phase: essayPhaseEnum.default("DISCOVERY"),
  isComplete: z.boolean().default(false),

  // AI Metadata
  aiGenerated: z.boolean().default(false),
  aiPromptUsed: z.string().optional(),
  aiModel: z.string().optional(),
  personalized: z.boolean().default(false),

  // Quality Assessment
  qualityScore: z.number().min(0).max(100).optional(),
  qualityBreakdown: z.any().optional(), // JSON object with detailed scores
  improvementSuggestions: z.string().optional(),

  // Version Control
  version: z.number().int().positive().default(1),
  previousVersionId: z.string().cuid().optional(),

  // Reusability
  themes: z.array(z.string()).default([]),
  adaptabilityScores: z.any().optional(), // JSON object mapping prompts to scores
});

export const essayUpdateSchema = essayBaseSchema.partial().omit({
  studentId: true,
});

// Essay Phase Transition Validation
export const essayPhaseTransitionSchema = z.object({
  currentPhase: essayPhaseEnum,
  newPhase: essayPhaseEnum,
}).refine(
  (data) => {
    // Define valid phase transitions (generally sequential, but can skip ahead or go back)
    const phaseOrder = ["DISCOVERY", "STRUCTURE", "DRAFTING", "REVISION", "POLISH", "FINALIZATION"];
    const currentIndex = phaseOrder.indexOf(data.currentPhase);
    const newIndex = phaseOrder.indexOf(data.newPhase);

    // Can only move forward or stay in same phase (no moving backward)
    return newIndex >= currentIndex;
  },
  {
    message: "Cannot move backward in essay phases",
  }
);

// Essay Filter Schema
export const essayFilterSchema = z.object({
  studentId: z.string().cuid().optional(),
  applicationId: z.string().cuid().optional(),
  phase: essayPhaseEnum.optional(),
  isComplete: z.boolean().optional(),
  aiGenerated: z.boolean().optional(),
  minQualityScore: z.number().min(0).max(100).optional(),
  themes: z.array(z.string()).optional(),
});

// Type exports
export type EssayCreateInput = z.infer<typeof essayCreateSchema>;
export type EssayUpdateInput = z.infer<typeof essayUpdateSchema>;
export type EssayFilterInput = z.infer<typeof essayFilterSchema>;
export type EssayPhaseTransition = z.infer<typeof essayPhaseTransitionSchema>;
