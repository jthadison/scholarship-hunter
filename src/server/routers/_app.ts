import { router } from '../trpc'
import { authRouter } from './auth'
import { profileRouter } from './profile'

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
})

export type AppRouter = typeof appRouter
