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
import { essayRouter } from './essay'
import { morganRouter } from './morgan'
import { outcomeRouter } from './outcome'
import { analyticsRouter } from './analytics'
import { gapAnalysisRouter } from './gap-analysis'
import { goalsRouter } from './goals'
import { positioningRouter } from './positioning'
import { counselorRouter } from './counselor'
import { scholarshipRecommendationRouter } from './scholarship-recommendation'
import { parentsRouter } from './parents'
import { exportsRouter } from './exports'
import { searchRouter } from './search'
import { helpRouter } from './help'

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
  essay: essayRouter, // Story 4.6-4.10: Essay Prompt Analysis & Editor
  morgan: morganRouter, // Story 4.10: Morgan Agent - Essay Strategist Dashboard
  outcome: outcomeRouter, // Story 5.1: Outcome Tracking & Status Updates
  analytics: analyticsRouter, // Story 5.2: Analytics Dashboard - Success Metrics
  gapAnalysis: gapAnalysisRouter, // Story 5.3: Gap Analysis - Profile Improvement Recommendations
  goals: goalsRouter, // Story 5.4: Profile Improvement Tracker
  positioning: positioningRouter, // Story 5.5: Competitive Positioning Over Time
  counselor: counselorRouter, // Story 5.6: Counselor Portal - Student Monitoring
  scholarshipRecommendation: scholarshipRecommendationRouter, // Story 5.7: Counselor Recommendation Engine
  parents: parentsRouter, // Story 5.8: Parent/Guardian View - Progress Monitoring
  exports: exportsRouter, // Story 5.9: Export & Reporting
  search: searchRouter, // Story 5.10: Platform-Wide Search
  help: helpRouter, // Story 5.10: Help System
})

export type AppRouter = typeof appRouter
