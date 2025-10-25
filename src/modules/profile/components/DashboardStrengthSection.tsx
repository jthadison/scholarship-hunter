'use client'

import { ProfileStrengthCard } from './ProfileStrengthCard'
import { StrengthRecommendations } from './StrengthRecommendations'
import { StrengthHistoryChart } from './StrengthHistoryChart'

/**
 * Story 1.7: Dashboard Strength Section
 * Combines all strength-related components for dashboard display
 */
export function DashboardStrengthSection() {
  return (
    <div className="space-y-6">
      {/* Main strength score card */}
      <ProfileStrengthCard />

      {/* Two-column layout for recommendations and history */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StrengthRecommendations />
        <StrengthHistoryChart />
      </div>
    </div>
  )
}
