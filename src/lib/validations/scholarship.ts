import { z } from "zod";

/**
 * Scholarship Validation Schemas
 * Validates scholarship data including award details, deadlines, eligibility, and requirements
 */

export const scholarshipCreateSchema = z.object({
  // Basic Info
  name: z.string().min(1, "Scholarship name is required"),
  provider: z.string().min(1, "Provider name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),

  // Award Details
  awardAmount: z.number().int().positive("Award amount must be positive"),
  awardAmountMax: z.number().int().positive().optional(),
  numberOfAwards: z.number().int().positive().default(1),
  renewable: z.boolean().default(false),

  // Deadlines
  deadline: z.coerce.date().refine(
    (date) => date > new Date(),
    "Deadline must be in the future"
  ),
  announcementDate: z.coerce.date().optional(),

  // Eligibility Criteria (JSON - flexible structure)
  eligibilityCriteria: z.any().optional(),

  // Application Requirements
  essayPrompts: z.any().optional(), // JSON array of essay prompts
  requiredDocuments: z.array(z.string()).default([]),
  recommendationCount: z.number().int().min(0).max(5).default(0),

  // Competition Metadata
  applicantPoolSize: z.number().int().positive().optional(),
  acceptanceRate: z.number().min(0.0).max(1.0).optional(),

  // Source Verification
  sourceUrl: z.string().url().optional(),
  lastVerified: z.coerce.date().optional(),
  verified: z.boolean().default(false),

  // Search/Discovery
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
}).refine(
  (data) => {
    // If awardAmountMax is provided, it must be >= awardAmount
    if (data.awardAmountMax !== undefined) {
      return data.awardAmountMax >= data.awardAmount;
    }
    return true;
  },
  {
    message: "Maximum award amount must be greater than or equal to minimum award amount",
    path: ["awardAmountMax"],
  }
).refine(
  (data) => {
    // If announcementDate is provided, it must be after deadline
    if (data.announcementDate !== undefined && data.deadline !== undefined) {
      return data.announcementDate >= data.deadline;
    }
    return true;
  },
  {
    message: "Announcement date must be on or after the deadline",
    path: ["announcementDate"],
  }
);

// For update, use base schema without refinements, then make partial
const scholarshipBaseSchema = z.object({
  // Basic Info
  name: z.string().min(1, "Scholarship name is required"),
  provider: z.string().min(1, "Provider name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),

  // Award Details
  awardAmount: z.number().int().positive("Award amount must be positive"),
  awardAmountMax: z.number().int().positive().optional(),
  numberOfAwards: z.number().int().positive().default(1),
  renewable: z.boolean().default(false),

  // Deadlines
  deadline: z.coerce.date().refine(
    (date) => date > new Date(),
    "Deadline must be in the future"
  ),
  announcementDate: z.coerce.date().optional(),

  // Eligibility Criteria (JSON - flexible structure)
  eligibilityCriteria: z.any().optional(),

  // Application Requirements
  essayPrompts: z.any().optional(), // JSON array of essay prompts
  requiredDocuments: z.array(z.string()).default([]),
  recommendationCount: z.number().int().min(0).max(5).default(0),

  // Competition Metadata
  applicantPoolSize: z.number().int().positive().optional(),
  acceptanceRate: z.number().min(0.0).max(1.0).optional(),

  // Source Verification
  sourceUrl: z.string().url().optional(),
  lastVerified: z.coerce.date().optional(),
  verified: z.boolean().default(false),

  // Search/Discovery
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
});

export const scholarshipUpdateSchema = scholarshipBaseSchema.partial();

// Scholarship Filter/Search Schema
export const scholarshipFilterSchema = z.object({
  provider: z.string().optional(),
  category: z.string().optional(),
  verified: z.boolean().optional(),
  minAwardAmount: z.number().int().positive().optional(),
  maxAwardAmount: z.number().int().positive().optional(),
  deadlineAfter: z.coerce.date().optional(),
  deadlineBefore: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
  renewable: z.boolean().optional(),
});

// Type exports
export type ScholarshipCreateInput = z.infer<typeof scholarshipCreateSchema>;
export type ScholarshipUpdateInput = z.infer<typeof scholarshipUpdateSchema>;
export type ScholarshipFilterInput = z.infer<typeof scholarshipFilterSchema>;
