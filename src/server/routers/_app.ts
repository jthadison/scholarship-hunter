import { router } from '../trpc'
import { authRouter } from './auth'
import { profileRouter } from './profile'
import { dashboardRouter } from './dashboard'

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  dashboard: dashboardRouter,
})

export type AppRouter = typeof appRouter
