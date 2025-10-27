import { router } from '../trpc'
import { authRouter } from './auth'
import { profileRouter } from './profile'
import { dashboardRouter } from './dashboard'
import { matchingRouter } from './matching'
import { scholarshipRouter } from './scholarship'
import { applicationRouter } from './application'
import { notificationRouter } from './notification'
import { timelineRouter } from './timeline'

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  dashboard: dashboardRouter,
  matching: matchingRouter,
  scholarship: scholarshipRouter,
  application: applicationRouter,
  notification: notificationRouter,
  timeline: timelineRouter,
})

export type AppRouter = typeof appRouter
