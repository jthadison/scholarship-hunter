import { z } from "zod";

/**
 * Profile Validation Schemas
 * Validates student profile data including academic, demographic, financial, major/field, experience, and special circumstances
 */

// Academic Data Validation
const academicSchema = z.object({
  gpa: z.number().min(0.0).max(4.0).optional(),
  gpaScale: z.number().default(4.0),
  satScore: z.number().int().min(400).max(1600).optional(),
  actScore: z.number().int().min(1).max(36).optional(),
  classRank: z.number().int().positive().optional(),
  classSize: z.number().int().positive().optional(),
  graduationYear: z.number().int().min(2024).max(2030).optional(),
  currentGrade: z.string().optional(),
});

// Demographic Data Validation
const demographicSchema = z.object({
  gender: z.string().optional(),
  ethnicity: z.array(z.string()).default([]),
  state: z.string().length(2).optional(), // US state codes
  city: z.string().optional(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional(), // US ZIP code format
  citizenship: z.string().optional(),
});

// Financial Data Validation
const financialSchema = z.object({
  financialNeed: z.enum(["LOW", "MODERATE", "HIGH", "VERY_HIGH"]).optional(),
  pellGrantEligible: z.boolean().default(false),
  efcRange: z.string().optional(),
});

// Major & Field Data Validation
const majorFieldSchema = z.object({
  intendedMajor: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  careerGoals: z.string().optional(),
});

// Experience Data Validation
const experienceSchema = z.object({
  extracurriculars: z.any().optional(), // JSON - flexible structure
  volunteerHours: z.number().int().min(0).default(0),
  workExperience: z.any().optional(), // JSON - flexible structure
  leadershipRoles: z.any().optional(), // JSON - flexible structure
  awardsHonors: z.any().optional(), // JSON - flexible structure
});

// Special Circumstances Data Validation
const specialCircumstancesSchema = z.object({
  firstGeneration: z.boolean().default(false),
  militaryAffiliation: z.string().optional(),
  disabilities: z.string().optional(),
  additionalContext: z.string().optional(),
});

// Complete Profile Create Schema (all fields optional except studentId)
export const profileCreateSchema = z.object({
  studentId: z.string().cuid(),

  // Academic fields
  ...academicSchema.shape,

  // Demographic fields
  ...demographicSchema.shape,

  // Financial fields
  ...financialSchema.shape,

  // Major/Field fields
  ...majorFieldSchema.shape,

  // Experience fields
  ...experienceSchema.shape,

  // Special circumstances fields
  ...specialCircumstancesSchema.shape,

  // Metadata (read-only - calculated by system)
  // completionPercentage and strengthScore are not included in create schema
});

// Profile Update Schema (all fields optional)
export const profileUpdateSchema = profileCreateSchema.partial().omit({
  studentId: true, // Cannot update studentId
});

// Profile Query/Filter Schema
export const profileFilterSchema = z.object({
  graduationYear: z.number().int().min(2024).max(2030).optional(),
  intendedMajor: z.string().optional(),
  financialNeed: z.enum(["LOW", "MODERATE", "HIGH", "VERY_HIGH"]).optional(),
  state: z.string().length(2).optional(),
  minGpa: z.number().min(0.0).max(4.0).optional(),
  maxGpa: z.number().min(0.0).max(4.0).optional(),
});

// Type exports for TypeScript
export type ProfileCreateInput = z.infer<typeof profileCreateSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfileFilterInput = z.infer<typeof profileFilterSchema>;
