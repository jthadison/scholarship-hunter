import { router, protectedProcedure } from '../trpc'
import { prisma } from '../db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import {
  academicProfileFormSchema,
  demographicProfileSchema,
  financialProfileSchema,
  calculateProfileCompleteness,
} from '@/modules/profile/lib/profile-validation'

// ============================================================================
// Input Schemas for Profile Operations
// ============================================================================

// Combine all profile schemas using object spread (avoids ZodEffects issues)
const createProfileInputSchema = z.object({
  ...academicProfileFormSchema.shape,
  ...demographicProfileSchema.shape,
  ...financialProfileSchema.shape,
}).partial()

const updateProfileInputSchema = z.object({
  ...academicProfileFormSchema.shape,
  ...demographicProfileSchema.shape,
  ...financialProfileSchema.shape,
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
   * Recalculates completionPercentage automatically
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

      // Merge existing profile with updates for completeness calculation
      const mergedProfile = {
        ...student.profile,
        ...input,
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
})
