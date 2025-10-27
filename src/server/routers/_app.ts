import { router } from '../trpc'
import { authRouter } from './auth'
import { profileRouter } from './profile'
import { dashboardRouter } from './dashboard'
import { matchingRouter } from './matching'
import { scholarshipRouter } from './scholarship'
import { applicationRouter } from './application'
import { notificationRouter } from './notification'

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  dashboard: dashboardRouter,
  matching: matchingRouter,
  scholarship: scholarshipRouter,
  application: applicationRouter,
  notification: notificationRouter,
})

export type AppRouter = typeof appRouter
