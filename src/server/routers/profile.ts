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
} from '@/modules/profile/lib/profile-validation'

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
        volunteerHours = calculateVolunteerHours(input.extracurriculars as any)
      }

      // Story 1.5: Auto-populate field of study from major
      let fieldOfStudy = input.fieldOfStudy
      if (input.intendedMajor !== undefined && !input.fieldOfStudy) {
        fieldOfStudy = getFieldOfStudyFromMajor(input.intendedMajor) as any
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
      const existingActivities = (student.profile.extracurriculars as any[]) || []
      const updatedActivities = [...existingActivities, input]

      // Auto-calculate volunteer hours
      const volunteerHours = calculateVolunteerHours(updatedActivities)

      // If leadership role, also add to leadershipRoles array
      let leadershipRoles = (student.profile.leadershipRoles as any[]) || []
      if (input.isLeadership && input.leadershipTitle) {
        leadershipRoles = [
          ...leadershipRoles,
          {
            title: input.leadershipTitle,
            organization: input.name,
            startDate: new Date().toISOString(),
            description: input.description,
          },
        ]
      }

      const updatedProfile = await prisma.profile.update({
        where: { id: student.profile.id },
        data: {
          extracurriculars: updatedActivities,
          leadershipRoles,
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

      const existingWork = (student.profile.workExperience as any[]) || []
      const updatedWork = [...existingWork, input]

      const updatedProfile = await prisma.profile.update({
        where: { id: student.profile.id },
        data: {
          workExperience: updatedWork,
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

      const existingRoles = (student.profile.leadershipRoles as any[]) || []
      const updatedRoles = [...existingRoles, input]

      const updatedProfile = await prisma.profile.update({
        where: { id: student.profile.id },
        data: {
          leadershipRoles: updatedRoles,
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

      const existingAwards = (student.profile.awardsHonors as any[]) || []
      const updatedAwards = [...existingAwards, input]

      const updatedProfile = await prisma.profile.update({
        where: { id: student.profile.id },
        data: {
          awardsHonors: updatedAwards,
        },
      })

      return updatedProfile
    }),
})
