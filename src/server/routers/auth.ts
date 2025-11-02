import { router, publicProcedure } from '../trpc'
import { z } from 'zod'
import { prisma } from '../db'

export const authRouter = router({
  // Get current user session
  getSession: publicProcedure.query(async ({ ctx }) => {
    // Use clerkId instead of userId (userId is the DB user ID which will be null if no User record exists)
    if (!ctx.clerkId) {
      return null
    }

    // Debug logging
    console.log('[getSession] Clerk User ID:', ctx.clerkId)

    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.clerkId },
      include: {
        student: {
          include: {
            profile: true,
          },
        },
      },
    })

    console.log('[getSession] User found in DB:', !!user)
    if (!user) {
      console.log('[getSession] ⚠️  User not found in database! Clerk ID:', ctx.clerkId)
    }

    return user
  }),

  // Register new user (called after Clerk sign-up)
  register: publicProcedure
    .input(
      z.object({
        clerkId: z.string(),
        email: z.string().email(),
        firstName: z.string(),
        lastName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.create({
        data: {
          clerkId: input.clerkId,
          email: input.email,
          role: 'STUDENT',
          emailVerified: true,
          student: {
            create: {
              firstName: input.firstName,
              lastName: input.lastName,
            },
          },
        },
        include: { student: true },
      })
      return user
    }),
})
