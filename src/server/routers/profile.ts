import { router, protectedProcedure } from '../trpc'
import { prisma } from '../db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import {
  academicProfileFormSchema,
  demographicProfileSchema,
  financialProfileSchema,
  calculateProfileCompleteness,
  // Story 1.5: Major & Field validation
  intendedMajorSchema,
  fieldOfStudySchema,
  careerGoalsSchema,
  // Story 1.5: Experience validation
  extracurricularActivitySchema,
  extracurricularsArraySchema,
  workExperienceSchema,
  workExperienceArraySchema,
  leadershipRoleSchema,
  leadershipRolesArraySchema,
  awardHonorSchema,
  awardsHonorsArraySchema,
  // Story 1.5: Special circumstances validation
  firstGenerationSchema,
  militaryAffiliationSchema,
  disabilitiesSchema,
  additionalContextSchema,
  // Story 1.5: Helper functions
  calculateVolunteerHours,
  getFieldOfStudyFromMajor,
  // Story 1.6: Validation & completeness functions
  getMissingFields,
} from '@/modules/profile/lib/profile-validation'
import type {
  ExtracurricularActivity,
  WorkExperience,
  LeadershipRole,
  AwardHonor,
} from '@/modules/profile/types'

// ============================================================================
// Input Schemas for Profile Operations
// ============================================================================

// Combine all profile schemas using object spread (avoids ZodEffects issues)
const createProfileInputSchema = z.object({
  ...academicProfileFormSchema.shape,
  ...demographicProfileSchema.shape,
  ...financialProfileSchema.shape,
  // Story 1.5: Major & Field of Study
  intendedMajor: intendedMajorSchema,
  fieldOfStudy: fieldOfStudySchema,
  careerGoals: careerGoalsSchema,
  // Story 1.5: Experience fields
  extracurriculars: extracurricularsArraySchema,
  workExperience: workExperienceArraySchema,
  leadershipRoles: leadershipRolesArraySchema,
  awardsHonors: awardsHonorsArraySchema,
  // Story 1.5: Special circumstances
  firstGeneration: firstGenerationSchema,
  militaryAffiliation: militaryAffiliationSchema,
  disabilities: disabilitiesSchema,
  additionalContext: additionalContextSchema,
}).partial()

const updateProfileInputSchema = z.object({
  ...academicProfileFormSchema.shape,
  ...demographicProfileSchema.shape,
  ...financialProfileSchema.shape,
  // Story 1.5: Major & Field of Study
  intendedMajor: intendedMajorSchema,
  fieldOfStudy: fieldOfStudySchema,
  careerGoals: careerGoalsSchema,
  // Story 1.5: Experience fields
  extracurriculars: extracurricularsArraySchema,
  workExperience: workExperienceArraySchema,
  leadershipRoles: leadershipRolesArraySchema,
  awardsHonors: awardsHonorsArraySchema,
  // Story 1.5: Special circumstances
  firstGeneration: firstGenerationSchema,
  militaryAffiliation: militaryAffiliationSchema,
  disabilities: disabilitiesSchema,
  additionalContext: additionalContextSchema,
}).partial()

// ============================================================================
// Profile Router
// ============================================================================

export const profileRouter = router({
  /**
   * Get authenticated student's profile
   * Returns null if profile doesn't exist yet
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    // Get student record for authenticated user
    const student = await prisma.student.findUnique({
      where: {
        userId: ctx.userId,
      },
      include: {
        profile: true,
      },
    })

    if (!student) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student record not found. Please complete registration.',
      })
    }

    return student.profile
  }),

  /**
   * Create new profile for authenticated student
   * Calculates initial completionPercentage automatically
   */
  create: protectedProcedure
    .input(createProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify student exists and doesn't already have a profile
      const student = await prisma.student.findUnique({
        where: {
          userId: ctx.userId,
        },
        include: {
          profile: true,
        },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student record not found. Please complete registration.',
        })
      }

      if (student.profile) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Profile already exists. Use update endpoint instead.',
        })
      }

      // Calculate completeness percentage (with type assertion)
      const completenessResult = calculateProfileCompleteness(input as any)

      // Clean up null values for Prisma (convert null to undefined)
      const cleanInput = Object.fromEntries(
        Object.entries(input).map(([key, value]) => [key, value === null ? undefined : value])
      )

      // Create profile with calculated metadata
      const profile = await prisma.profile.create({
        data: {
          studentId: student.id,
          ...cleanInput,
          completionPercentage: completenessResult.completionPercentage,
        },
      })

      return profile
    }),

  /**
   * Update existing profile with partial data
   * Recalculates completionPercentage, volunteerHours, and fieldOfStudy automatically (Story 1.5)
   */
  update: protectedProcedure
    .input(updateProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Get student's existing profile
      const student = await prisma.student.findUnique({
        where: {
          userId: ctx.userId,
        },
        include: {
          profile: true,
        },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student record not found.',
        })
      }

      if (!student.profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found. Use create endpoint first.',
        })
      }

      // Story 1.5: Auto-calculate volunteer hours from extracurriculars
      let volunteerHours = student.profile.volunteerHours
      if (input.extracurriculars !== undefined) {
        volunteerHours = calculateVolunteerHours(input.extracurriculars as unknown as ExtracurricularActivity[])
      }

      // Story 1.5: Auto-populate field of study from major
      let fieldOfStudy = input.fieldOfStudy
      if (input.intendedMajor !== undefined && !input.fieldOfStudy) {
        const calculatedField = getFieldOfStudyFromMajor(input.intendedMajor)
        fieldOfStudy = calculatedField as typeof fieldOfStudy
      }

      // Merge existing profile with updates for completeness calculation
      const mergedProfile = {
        ...student.profile,
        ...input,
        volunteerHours,
        fieldOfStudy,
      }

      // Recalculate completeness percentage (with type assertion for Prisma fields)
      const completenessResult = calculateProfileCompleteness(mergedProfile as any)

      // Clean up null values for Prisma
      const cleanInput = Object.fromEntries(
        Object.entries(input).map(([key, value]) => [key, value === null ? undefined : value])
      )

      // Update profile with new data and recalculated metadata
      const updatedProfile = await prisma.profile.update({
        where: {
          id: student.profile.id,
        },
        data: {
          ...cleanInput,
          volunteerHours,
          fieldOfStudy,
          completionPercentage: completenessResult.completionPercentage,
        },
      })

      return updatedProfile
    }),

  /**
   * Get profile completeness details
   * Returns breakdown of required vs optional fields
   */
  getCompleteness: protectedProcedure.query(async ({ ctx }) => {
    const student = await prisma.student.findUnique({
      where: {
        userId: ctx.userId,
      },
      include: {
        profile: true,
      },
    })

    if (!student) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student record not found.',
      })
    }

    if (!student.profile) {
      return {
        completionPercentage: 0,
        requiredFieldsComplete: 0,
        requiredFieldsTotal: 4,
        optionalFieldsComplete: 0,
        optionalFieldsTotal: 12,
        missingRequired: [
          'Graduation Year',
          'Citizenship Status',
          'State',
          'Financial Need Level',
        ],
        missingRecommended: [
          'GPA',
          'SAT Score',
          'ACT Score',
          'Class Rank',
          'Class Size',
          'Current Grade',
          'Gender',
          'Ethnicity',
          'City',
          'ZIP Code',
          'Pell Grant Eligibility',
          'Expected Family Contribution (EFC)',
        ],
      }
    }

    return calculateProfileCompleteness(student.profile as any)
  }),

  // ============================================================================
  // Story 1.5: Helper Mutations for Array Operations
  // ============================================================================

  /**
   * Add single extracurricular activity to profile
   * Auto-calculates volunteer hours if Community Service category
   */
  addExtracurricular: protectedProcedure
    .input(extracurricularActivitySchema)
    .mutation(async ({ ctx, input }) => {
      const student = await prisma.student.findUnique({
        where: { userId: ctx.userId },
        include: { profile: true },
      })

      if (!student?.profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found.',
        })
      }

      // Get existing extracurriculars array
      const existingActivities = (student.profile.extracurriculars as unknown as ExtracurricularActivity[]) || []
      const updatedActivities: ExtracurricularActivity[] = [...existingActivities, input]

      // Auto-calculate volunteer hours
      const volunteerHours = calculateVolunteerHours(updatedActivities)

      // If leadership role, also add to leadershipRoles array
      let leadershipRoles = (student.profile.leadershipRoles as unknown as LeadershipRole[]) || []
      if (input.isLeadership && input.leadershipTitle) {
        // Calculate start date: assume activity started (yearsInvolved) years ago
        const yearsAgo = input.yearsInvolved || 0
        const startDate = new Date()
        startDate.setFullYear(startDate.getFullYear() - yearsAgo)

        leadershipRoles = [
          ...leadershipRoles,
          {
            title: input.leadershipTitle,
            organization: input.name,
            startDate: startDate.toISOString(),
            description: input.description,
          },
        ]
      }

      const updatedProfile = await prisma.profile.update({
        where: { id: student.profile.id },
        data: {
          extracurriculars: updatedActivities as any,
          leadershipRoles: leadershipRoles as any,
          volunteerHours,
        },
      })

      return updatedProfile
    }),

  /**
   * Add work experience entry to profile
   */
  addWorkExperience: protectedProcedure
    .input(workExperienceSchema)
    .mutation(async ({ ctx, input }) => {
      const student = await prisma.student.findUnique({
        where: { userId: ctx.userId },
        include: { profile: true },
      })

      if (!student?.profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found.',
        })
      }

      const existingWork = (student.profile.workExperience as unknown as WorkExperience[]) || []
      const updatedWork: WorkExperience[] = [...existingWork, input]

      const updatedProfile = await prisma.profile.update({
        where: { id: student.profile.id },
        data: {
          workExperience: updatedWork as any,
        },
      })

      return updatedProfile
    }),

  /**
   * Add leadership role entry to profile
   */
  addLeadership: protectedProcedure
    .input(leadershipRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const student = await prisma.student.findUnique({
        where: { userId: ctx.userId },
        include: { profile: true },
      })

      if (!student?.profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found.',
        })
      }

      const existingRoles = (student.profile.leadershipRoles as unknown as LeadershipRole[]) || []
      const updatedRoles: LeadershipRole[] = [...existingRoles, input]

      const updatedProfile = await prisma.profile.update({
        where: { id: student.profile.id },
        data: {
          leadershipRoles: updatedRoles as any,
        },
      })

      return updatedProfile
    }),

  /**
   * Add award/honor entry to profile
   */
  addAward: protectedProcedure
    .input(awardHonorSchema)
    .mutation(async ({ ctx, input }) => {
      const student = await prisma.student.findUnique({
        where: { userId: ctx.userId },
        include: { profile: true },
      })

      if (!student?.profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found.',
        })
      }

      const existingAwards = (student.profile.awardsHonors as unknown as AwardHonor[]) || []
      const updatedAwards: AwardHonor[] = [...existingAwards, input]

      const updatedProfile = await prisma.profile.update({
        where: { id: student.profile.id },
        data: {
          awardsHonors: updatedAwards as any,
        },
      })

      return updatedProfile
    }),

  // ============================================================================
  // Story 1.6: Validation & Completeness Endpoints
  // ============================================================================

  /**
   * Validate current profile and return errors/warnings
   * Runs all validation rules on the profile
   */
  validate: protectedProcedure.query(async ({ ctx }) => {
    const student = await prisma.student.findUnique({
      where: { userId: ctx.userId },
      include: { profile: true },
    })

    if (!student?.profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Profile not found.',
      })
    }

    const profile = student.profile
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = []
    const warnings: string[] = []

    // Validate GPA against scale
    if (profile.gpa !== null && profile.gpaScale !== null) {
      if (profile.gpa > profile.gpaScale) {
        errors.push({
          field: 'gpa',
          message: `GPA cannot exceed ${profile.gpaScale}`,
          severity: 'error',
        })
      }
    }

    // Validate SAT score range
    if (profile.satScore !== null) {
      if (profile.satScore < 400 || profile.satScore > 1600) {
        errors.push({
          field: 'satScore',
          message: 'SAT score must be between 400 and 1600',
          severity: 'error',
        })
      }
    }

    // Validate ACT score range
    if (profile.actScore !== null) {
      if (profile.actScore < 1 || profile.actScore > 36) {
        errors.push({
          field: 'actScore',
          message: 'ACT score must be between 1 and 36',
          severity: 'error',
        })
      }
    }

    // Validate class rank vs class size
    if (profile.classRank !== null && profile.classSize !== null) {
      if (profile.classRank > profile.classSize) {
        errors.push({
          field: 'classRank',
          message: 'Class rank cannot exceed class size',
          severity: 'error',
        })
      }
    }

    // Warning: Profile missing test scores
    if (profile.satScore === null && profile.actScore === null) {
      warnings.push('Profile missing test scores - reduces matching accuracy for merit-based scholarships')
    }

    // Warning: No extracurriculars
    const extracurriculars = profile.extracurriculars as any
    if (!extracurriculars || (Array.isArray(extracurriculars) && extracurriculars.length === 0)) {
      warnings.push('No extracurricular activities listed - limits scholarship opportunities')
    }

    // Warning: Low completeness
    const completeness = calculateProfileCompleteness(profile as any)
    if (completeness.completionPercentage < 60) {
      warnings.push(`Profile is only ${completeness.completionPercentage}% complete - complete your profile to unlock more opportunities`)
    }

    return {
      isValid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
      warnings,
    }
  }),

  /**
   * Check if profile is ready for scholarship matching
   * Returns readiness status and missing required fields
   */
  checkReadiness: protectedProcedure.query(async ({ ctx }) => {
    const student = await prisma.student.findUnique({
      where: { userId: ctx.userId },
      include: { profile: true },
    })

    if (!student?.profile) {
      return {
        isReady: false,
        completeness: 0,
        missingRequired: [
          'GPA',
          'Graduation Year',
          'Current Grade',
          'Gender',
          'Ethnicity',
          'State',
          'Citizenship Status',
          'Intended Major',
          'Field of Study',
          'Financial Need Level',
        ],
      }
    }

    const completeness = calculateProfileCompleteness(student.profile as any)
    const isReady = completeness.completionPercentage >= 60 && completeness.missingRequired.length === 0

    return {
      isReady,
      completeness: completeness.completionPercentage,
      missingRequired: completeness.missingRequired,
    }
  }),

  /**
   * Get missing fields with prompts and estimated impact
   * Returns prioritized list for UI prompts
   */
  getMissingFields: protectedProcedure.query(async ({ ctx }) => {
    const student = await prisma.student.findUnique({
      where: { userId: ctx.userId },
      include: { profile: true },
    })

    if (!student?.profile) {
      // Return all fields as missing if no profile
      return getMissingFields({})
    }

    return getMissingFields(student.profile as any)
  }),
})
