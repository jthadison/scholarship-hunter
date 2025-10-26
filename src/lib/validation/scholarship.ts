/**
 * Scholarship Import Validation Schemas
 *
 * Zod schemas for validating scholarship import data matching the TypeScript
 * EligibilityCriteria interfaces from src/types/scholarship.ts.
 *
 * These schemas enforce runtime validation during CSV/JSON import to ensure
 * data quality and type safety.
 *
 * @module lib/validation/scholarship
 */

import { z } from 'zod'

/**
 * Academic criteria validation schema
 * Matches AcademicCriteria interface
 */
export const academicCriteriaSchema = z
  .object({
    minGPA: z.number().min(0).max(4.0).optional(),
    maxGPA: z.number().min(0).max(4.0).optional(),
    minSAT: z.number().min(400).max(1600).optional(),
    maxSAT: z.number().min(400).max(1600).optional(),
    minACT: z.number().min(1).max(36).optional(),
    maxACT: z.number().min(1).max(36).optional(),
    classRankPercentile: z.number().min(0).max(100).optional(),
    gpaWeight: z.number().min(0).max(1).optional(),
  })
  .passthrough()
  .optional()

/**
 * Demographic criteria validation schema
 * Matches DemographicCriteria interface
 */
export const demographicCriteriaSchema = z
  .object({
    requiredGender: z.enum(['Male', 'Female', 'Non-binary', 'Any']).optional(),
    requiredEthnicity: z.array(z.string()).optional(),
    ageMin: z.number().int().positive().optional(),
    ageMax: z.number().int().positive().optional(),
    requiredState: z.array(z.string()).optional(),
    requiredCity: z.array(z.string()).optional(),
    residencyRequired: z.enum(['In-State', 'Out-of-State', 'Any']).optional(),
  })
  .passthrough()
  .optional()

/**
 * Major/field of study criteria validation schema
 * Matches MajorFieldCriteria interface
 */
export const majorFieldCriteriaSchema = z
  .object({
    eligibleMajors: z.array(z.string()).optional(),
    excludedMajors: z.array(z.string()).optional(),
    requiredFieldOfStudy: z.array(z.string()).optional(),
    careerGoalsKeywords: z.array(z.string()).optional(),
  })
  .passthrough()
  .optional()

/**
 * Experience criteria validation schema
 * Matches ExperienceCriteria interface
 */
export const experienceCriteriaSchema = z
  .object({
    minVolunteerHours: z.number().int().nonnegative().optional(),
    requiredExtracurriculars: z.array(z.string()).optional(),
    leadershipRequired: z.boolean().optional(),
    minWorkExperience: z.number().int().nonnegative().optional(),
    awardsHonorsRequired: z.boolean().optional(),
  })
  .passthrough()
  .optional()

/**
 * Financial criteria validation schema
 * Matches FinancialCriteria interface
 */
export const financialCriteriaSchema = z
  .object({
    requiresFinancialNeed: z.boolean().optional(),
    maxEFC: z.number().int().nonnegative().optional(),
    pellGrantRequired: z.boolean().optional(),
    financialNeedLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']).optional(),
  })
  .passthrough()
  .optional()

/**
 * Special circumstances criteria validation schema
 * Matches SpecialCriteria interface
 */
export const specialCriteriaSchema = z
  .object({
    firstGenerationRequired: z.boolean().optional(),
    militaryAffiliation: z.enum(['None', 'Veteran', 'Dependent', 'Active Duty', 'Any']).optional(),
    disabilityRequired: z.boolean().optional(),
    citizenshipRequired: z.enum(['US Citizen', 'Permanent Resident', 'Any']).optional(),
    otherRequirements: z.array(z.string()).optional(),
  })
  .passthrough()
  .optional()

/**
 * Complete eligibility criteria validation schema
 * Matches EligibilityCriteria interface
 */
export const eligibilityCriteriaSchema = z
  .object({
    academic: academicCriteriaSchema,
    demographic: demographicCriteriaSchema,
    majorField: majorFieldCriteriaSchema,
    experience: experienceCriteriaSchema,
    financial: financialCriteriaSchema,
    special: specialCriteriaSchema,
  })
  .passthrough()

/**
 * Essay prompt validation schema
 * Matches EssayPrompt interface
 */
export const essayPromptSchema = z.object({
  prompt: z.string().min(1),
  wordLimit: z.number().int().positive(),
  required: z.boolean(),
})

/**
 * Main scholarship import validation schema
 *
 * Used by import scripts to validate incoming scholarship data from CSV/JSON files.
 * All validations match the Prisma Scholarship model requirements.
 */
export const scholarshipImportSchema = z.object({
  // Basic Info - Required
  name: z.string().min(1, 'Scholarship name is required'),
  provider: z.string().min(1, 'Provider is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  website: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  contactEmail: z.string().email().optional().or(z.literal('')).transform(v => v || undefined),

  // Award Details - Required
  awardAmount: z.number().int().positive('Award amount must be a positive integer'),
  awardAmountMax: z.number().int().positive().optional(),
  numberOfAwards: z.number().int().positive().default(1),
  renewable: z.boolean().default(false),
  renewalYears: z.number().int().positive().optional(),

  // Deadlines - Required
  deadline: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => {
      if (typeof val === 'string') {
        return new Date(val)
      }
      return val
    }),
  announcementDate: z
    .string()
    .datetime()
    .or(z.date())
    .optional()
    .transform((val) => {
      if (!val) return undefined
      if (typeof val === 'string') {
        return new Date(val)
      }
      return val
    }),

  // Eligibility Criteria - Required
  eligibilityCriteria: eligibilityCriteriaSchema,

  // Application Requirements
  essayPrompts: z.array(essayPromptSchema).optional(),
  requiredDocuments: z.array(z.string()).default([]),
  recommendationCount: z.number().int().min(0).default(0),

  // Competition Metadata
  applicantPoolSize: z.number().int().positive().optional(),
  acceptanceRate: z.number().min(0).max(1).optional(),

  // Source Verification
  sourceUrl: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  lastVerified: z
    .string()
    .datetime()
    .or(z.date())
    .optional()
    .transform((val) => {
      if (!val) return new Date()
      if (typeof val === 'string') {
        return new Date(val)
      }
      return val
    }),
  verified: z.boolean().default(false),

  // Search/Discovery
  tags: z.array(z.string()).default([]),
  category: z.enum(['Merit-based', 'Need-based', 'Identity-based', 'Mixed']).optional(),
})

/**
 * Type inference for validated scholarship import data
 */
export type ScholarshipImportData = z.infer<typeof scholarshipImportSchema>
