import { z } from "zod";

/**
 * Application Validation Schemas
 * Validates scholarship application data including status, progress, and timeline
 */

// Application Status Enum
const applicationStatusEnum = z.enum([
  "NOT_STARTED",
  "TODO",
  "IN_PROGRESS",
  "READY_FOR_REVIEW",
  "SUBMITTED",
  "AWAITING_DECISION",
  "AWARDED",
  "DENIED",
  "WITHDRAWN",
]);

// Priority Tier Enum
const priorityTierEnum = z.enum([
  "MUST_APPLY",
  "SHOULD_APPLY",
  "IF_TIME_PERMITS",
  "HIGH_VALUE_REACH",
]);

export const applicationCreateSchema = z.object({
  studentId: z.string().cuid(),
  scholarshipId: z.string().cuid(),

  // Status Tracking
  status: applicationStatusEnum.default("NOT_STARTED"),
  priorityTier: priorityTierEnum.optional(),

  // Progress Tracking
  essayCount: z.number().int().min(0).default(0),
  essayComplete: z.number().int().min(0).default(0),
  documentsRequired: z.number().int().min(0).default(0),
  documentsUploaded: z.number().int().min(0).default(0),
  recsRequired: z.number().int().min(0).max(5).default(0),
  recsReceived: z.number().int().min(0).max(5).default(0),
  progressPercentage: z.number().min(0).max(100).default(0),

  // Timeline Dates
  targetSubmitDate: z.coerce.date().optional(),
  actualSubmitDate: z.coerce.date().optional(),
  outcomeDate: z.coerce.date().optional(),
  awardAmount: z.number().positive().optional(),

  // Notes
  notes: z.string().optional(),
}).refine(
  (data) => {
    // Essays complete cannot exceed essays required
    return data.essayComplete <= data.essayCount;
  },
  {
    message: "Essays complete cannot exceed essays required",
    path: ["essayComplete"],
  }
).refine(
  (data) => {
    // Documents uploaded cannot exceed documents required
    return data.documentsUploaded <= data.documentsRequired;
  },
  {
    message: "Documents uploaded cannot exceed documents required",
    path: ["documentsUploaded"],
  }
).refine(
  (data) => {
    // Recommendations received cannot exceed recommendations required
    return data.recsReceived <= data.recsRequired;
  },
  {
    message: "Recommendations received cannot exceed recommendations required",
    path: ["recsReceived"],
  }
).refine(
  (data) => {
    // If actual submit date is provided, status should be SUBMITTED or later
    if (data.actualSubmitDate !== undefined) {
      return ["SUBMITTED", "AWAITING_DECISION", "AWARDED", "DENIED", "WITHDRAWN"].includes(data.status);
    }
    return true;
  },
  {
    message: "Status must be SUBMITTED or later if actual submit date is provided",
    path: ["status"],
  }
);

// Base schema without refinements for updates
const applicationBaseSchema = z.object({
  studentId: z.string().cuid(),
  scholarshipId: z.string().cuid(),

  // Status Tracking
  status: applicationStatusEnum.default("NOT_STARTED"),
  priorityTier: priorityTierEnum.optional(),

  // Progress Tracking
  essayCount: z.number().int().min(0).default(0),
  essayComplete: z.number().int().min(0).default(0),
  documentsRequired: z.number().int().min(0).default(0),
  documentsUploaded: z.number().int().min(0).default(0),
  recsRequired: z.number().int().min(0).max(5).default(0),
  recsReceived: z.number().int().min(0).max(5).default(0),
  progressPercentage: z.number().min(0).max(100).default(0),

  // Timeline Dates
  targetSubmitDate: z.coerce.date().optional(),
  actualSubmitDate: z.coerce.date().optional(),
  outcomeDate: z.coerce.date().optional(),
  awardAmount: z.number().positive().optional(),

  // Notes
  notes: z.string().optional(),
});

export const applicationUpdateSchema = applicationBaseSchema.partial().omit({
  studentId: true,
  scholarshipId: true,
});

// Status Transition Validation
export const applicationStatusTransitionSchema = z.object({
  currentStatus: applicationStatusEnum,
  newStatus: applicationStatusEnum,
}).refine(
  (data) => {
    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
      NOT_STARTED: ["TODO", "WITHDRAWN"],
      TODO: ["IN_PROGRESS", "NOT_STARTED", "WITHDRAWN"],
      IN_PROGRESS: ["READY_FOR_REVIEW", "TODO", "WITHDRAWN"],
      READY_FOR_REVIEW: ["SUBMITTED", "IN_PROGRESS", "WITHDRAWN"],
      SUBMITTED: ["AWAITING_DECISION", "WITHDRAWN"],
      AWAITING_DECISION: ["AWARDED", "DENIED", "WITHDRAWN"],
      AWARDED: [], // Terminal state
      DENIED: [], // Terminal state
      WITHDRAWN: [], // Terminal state
    };

    return validTransitions[data.currentStatus]?.includes(data.newStatus) ?? false;
  },
  {
    message: "Invalid status transition",
  }
);

// Application Filter Schema
export const applicationFilterSchema = z.object({
  studentId: z.string().cuid().optional(),
  scholarshipId: z.string().cuid().optional(),
  status: applicationStatusEnum.optional(),
  priorityTier: priorityTierEnum.optional(),
  targetSubmitBefore: z.coerce.date().optional(),
  targetSubmitAfter: z.coerce.date().optional(),
});

// Type exports
export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;
export type ApplicationFilterInput = z.infer<typeof applicationFilterSchema>;
export type ApplicationStatusTransition = z.infer<typeof applicationStatusTransitionSchema>;
