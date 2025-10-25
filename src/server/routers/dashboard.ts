import { router, protectedProcedure } from '../trpc'
import { prisma } from '../db'

export const dashboardRouter = router({
  /**
   * Simple query to fetch student name for welcome message
   * Other data is fetched by individual components (ProfileCompletenessCard, ProfileStrengthCard)
   */
  getWelcomeData: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx

    const student = await prisma.student.findUnique({
      where: { userId: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!student) {
      throw new Error('Student not found')
    }

    return {
      firstName: student.firstName,
      lastName: student.lastName,
      // Placeholder data for future features
      scholarshipsMatched: 0,
      applicationsInProgress: 0,
    }
  }),
})
