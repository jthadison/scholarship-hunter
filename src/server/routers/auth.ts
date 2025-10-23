import { router, publicProcedure } from '../trpc'
import { z } from 'zod'
import { prisma } from '../db'

export const authRouter = router({
  // Get current user session
  getSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      include: {
        student: {
          include: {
            profile: true,
          },
        },
      },
    })

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
