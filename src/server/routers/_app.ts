import { router } from '../trpc'
import { authRouter } from './auth'
import { profileRouter } from './profile'
import { dashboardRouter } from './dashboard'
import { matchingRouter } from './matching'
import { scholarshipRouter } from './scholarship'
import { applicationRouter } from './application'
import { notificationRouter } from './notification'
import { timelineRouter } from './timeline'
import { alertRouter } from './alert'

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  dashboard: dashboardRouter,
  matching: matchingRouter,
  scholarship: scholarshipRouter,
  application: applicationRouter,
  notification: notificationRouter,
  timeline: timelineRouter,
  alert: alertRouter, // Story 3.4: Deadline alerts
})

export type AppRouter = typeof appRouter
