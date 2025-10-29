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
import { quinnRouter } from './quinn'
import { documentRouter } from './document'
import { recommendationRouter } from './recommendation'
import { dexterRouter } from './dexter'

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
  quinn: quinnRouter, // Story 3.6: Quinn Timeline Coordinator
  document: documentRouter, // Story 4.1: Document Vault
  recommendation: recommendationRouter, // Story 4.4: Recommendation Letter Coordination
  dexter: dexterRouter, // Story 4.5: Dexter Agent - Document Manager Dashboard
})

export type AppRouter = typeof appRouter
