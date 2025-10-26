/**
 * Scholarship Factory Utilities
 *
 * Provides factory functions for creating scholarships with realistic defaults
 * and validation utilities for seed data.
 *
 * @module seed-utils/scholarship-factory
 */

import type { Prisma } from '@prisma/client'
import type { EligibilityCriteria } from '../../src/types/scholarship'

// Type helper to convert EligibilityCriteria to Prisma JSON
type JsonValue = Prisma.InputJsonValue

/**
 * Default eligibility criteria patterns for common scholarship types
 */
export const EligibilityPatterns = {
  /**
   * Academic merit-based pattern (high GPA/test scores required)
   */
  academicMerit: (): EligibilityCriteria => ({
    academic: {
      minGPA: 3.5,
      minSAT: 1200,
      gpaWeight: 0.8,
    },
  }),

  /**
   * Financial need-based pattern
   */
  needBased: (): EligibilityCriteria => ({
    financial: {
      requiresFinancialNeed: true,
      financialNeedLevel: 'HIGH',
      pellGrantRequired: false,
    },
  }),

  /**
   * STEM-focused pattern
   */
  stemFocus: (): EligibilityCriteria => ({
    academic: {
      minGPA: 3.0,
    },
    majorField: {
      requiredFieldOfStudy: ['STEM'],
      eligibleMajors: [
        'Computer Science',
        'Engineering',
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
      ],
    },
  }),

  /**
   * Women in STEM pattern
   */
  womenInStem: (): EligibilityCriteria => ({
    academic: {
      minGPA: 3.2,
    },
    demographic: {
      requiredGender: 'Female',
    },
    majorField: {
      requiredFieldOfStudy: ['STEM'],
    },
  }),

  /**
   * First-generation college student pattern
   */
  firstGeneration: (): EligibilityCriteria => ({
    special: {
      firstGenerationRequired: true,
    },
  }),

  /**
   * Community service focused pattern
   */
  communityService: (): EligibilityCriteria => ({
    academic: {
      minGPA: 2.5,
    },
    experience: {
      minVolunteerHours: 100,
    },
  }),

  /**
   * Leadership focused pattern
   */
  leadership: (): EligibilityCriteria => ({
    academic: {
      minGPA: 3.0,
    },
    experience: {
      leadershipRequired: true,
    },
  }),

  /**
   * Geographic-specific pattern
   */
  geographic: (states: string[]): EligibilityCriteria => ({
    demographic: {
      requiredState: states,
      residencyRequired: 'In-State',
    },
  }),

  /**
   * Minority/Underrepresented pattern
   */
  underrepresented: (ethnicities: string[]): EligibilityCriteria => ({
    demographic: {
      requiredEthnicity: ethnicities,
    },
  }),

  /**
   * Military affiliation pattern
   */
  military: (): EligibilityCriteria => ({
    special: {
      militaryAffiliation: 'Dependent',
    },
  }),
}

/**
 * Creates a scholarship with sensible defaults
 *
 * @param data Partial scholarship data to override defaults
 * @returns Scholarship creation data for Prisma
 */
export function createScholarship(
  data: Partial<Prisma.ScholarshipCreateInput>
): Prisma.ScholarshipCreateInput {
  const now = new Date()
  const futureDeadline = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days from now

  return {
    name: data.name ?? 'Unnamed Scholarship',
    provider: data.provider ?? 'Unknown Provider',
    description: data.description ?? 'No description provided.',
    website: data.website,
    contactEmail: data.contactEmail,
    awardAmount: data.awardAmount ?? 1000,
    awardAmountMax: data.awardAmountMax,
    numberOfAwards: data.numberOfAwards ?? 1,
    renewable: data.renewable ?? false,
    renewalYears: data.renewalYears,
    deadline: data.deadline ?? futureDeadline,
    announcementDate: data.announcementDate,
    eligibilityCriteria: (data.eligibilityCriteria ?? {}) as JsonValue,
    essayPrompts: data.essayPrompts,
    requiredDocuments: data.requiredDocuments ?? [],
    recommendationCount: data.recommendationCount ?? 0,
    applicantPoolSize: data.applicantPoolSize,
    acceptanceRate: data.acceptanceRate,
    sourceUrl: data.sourceUrl,
    verified: data.verified ?? false,
    tags: data.tags ?? [],
    category: data.category,
  }
}

/**
 * Builds eligibility criteria by combining multiple patterns
 *
 * @param patterns Array of criteria patterns to merge
 * @returns Combined eligibility criteria
 */
export function buildEligibilityCriteria(
  ...patterns: EligibilityCriteria[]
): EligibilityCriteria {
  return patterns.reduce(
    (acc, pattern) => ({
      academic: { ...acc.academic, ...pattern.academic },
      demographic: { ...acc.demographic, ...pattern.demographic },
      majorField: { ...acc.majorField, ...pattern.majorField },
      experience: { ...acc.experience, ...pattern.experience },
      financial: { ...acc.financial, ...pattern.financial },
      special: { ...acc.special, ...pattern.special },
    }),
    {} as EligibilityCriteria
  )
}

/**
 * Validates scholarship data for common issues
 *
 * @param data Scholarship creation data
 * @throws Error if validation fails
 */
export function validateScholarshipData(
  data: Prisma.ScholarshipCreateInput
): void {
  // Required fields
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Scholarship name is required')
  }

  if (!data.provider || data.provider.trim().length === 0) {
    throw new Error('Provider name is required')
  }

  if (!data.description || data.description.trim().length < 10) {
    throw new Error('Description must be at least 10 characters')
  }

  if (!data.awardAmount || data.awardAmount <= 0) {
    throw new Error('Award amount must be positive')
  }

  if (!data.deadline) {
    throw new Error('Deadline is required')
  }

  // Logical validations
  if (data.awardAmountMax && data.awardAmountMax < data.awardAmount) {
    throw new Error('Maximum award amount must be >= minimum award amount')
  }

  if (data.numberOfAwards && data.numberOfAwards <= 0) {
    throw new Error('Number of awards must be positive')
  }

  if (data.acceptanceRate && (data.acceptanceRate < 0 || data.acceptanceRate > 1)) {
    throw new Error('Acceptance rate must be between 0.0 and 1.0')
  }

  if (data.recommendationCount && data.recommendationCount < 0) {
    throw new Error('Recommendation count cannot be negative')
  }

  if (data.renewalYears && !data.renewable) {
    throw new Error('renewalYears should only be set if renewable is true')
  }

  // Eligibility criteria must exist and be an object
  if (!data.eligibilityCriteria || typeof data.eligibilityCriteria !== 'object') {
    throw new Error('eligibilityCriteria must be a valid object')
  }
}

/**
 * Sample scholarship templates for common types
 */
export const ScholarshipTemplates = {
  /**
   * High-value merit scholarship
   */
  highMerit: (): Prisma.ScholarshipCreateInput =>
    createScholarship({
      name: 'Excellence in Achievement Award',
      provider: 'National Merit Foundation',
      description:
        'Recognizing outstanding academic achievement and leadership potential among high school seniors pursuing higher education.',
      awardAmount: 10000,
      awardAmountMax: 20000,
      numberOfAwards: 50,
      renewable: true,
      renewalYears: 4,
      deadline: new Date('2025-12-15'),
      eligibilityCriteria: buildEligibilityCriteria(
        EligibilityPatterns.academicMerit(),
        EligibilityPatterns.leadership()
      ) as JsonValue,
      essayPrompts: [
        {
          prompt: 'Describe your greatest academic achievement and its impact on your goals.',
          wordLimit: 750,
          required: true,
        },
      ],
      requiredDocuments: ['Transcript', 'Resume'],
      recommendationCount: 2,
      applicantPoolSize: 10000,
      acceptanceRate: 0.05,
      tags: ['Merit-based', 'High Value', 'Leadership'],
      category: 'Merit-based',
      verified: true,
    }),

  /**
   * Need-based scholarship
   */
  needBased: (): Prisma.ScholarshipCreateInput =>
    createScholarship({
      name: 'Financial Access Scholarship',
      provider: 'Community Foundation',
      description:
        'Supporting students with demonstrated financial need in pursuing their educational dreams.',
      awardAmount: 2500,
      numberOfAwards: 100,
      deadline: new Date('2025-11-30'),
      eligibilityCriteria: EligibilityPatterns.needBased() as JsonValue,
      requiredDocuments: ['FAFSA', 'Financial Statement'],
      recommendationCount: 1,
      tags: ['Need-based', 'Financial Aid'],
      category: 'Need-based',
      verified: true,
    }),

  /**
   * STEM-focused scholarship
   */
  stemScholarship: (): Prisma.ScholarshipCreateInput =>
    createScholarship({
      name: 'Future Innovators in STEM',
      provider: 'Tech Industry Association',
      description:
        'Empowering the next generation of scientists, engineers, and technologists to shape our future.',
      awardAmount: 5000,
      numberOfAwards: 25,
      renewable: true,
      renewalYears: 4,
      deadline: new Date('2026-01-15'),
      eligibilityCriteria: EligibilityPatterns.stemFocus() as JsonValue,
      essayPrompts: [
        {
          prompt: 'Describe a technical problem you solved and what you learned from the experience.',
          wordLimit: 500,
          required: true,
        },
      ],
      requiredDocuments: ['Transcript', 'Project Portfolio'],
      recommendationCount: 1,
      applicantPoolSize: 5000,
      acceptanceRate: 0.25,
      tags: ['STEM', 'Innovation', 'Technology'],
      category: 'Merit-based',
      verified: true,
    }),
}
