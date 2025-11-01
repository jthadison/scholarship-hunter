/**
 * Parent Dashboard Page
 *
 * Main landing page for parent portal showing student scholarship progress.
 * Story 5.8: Parent/Guardian View - Task 4 (Parent Portal Dashboard)
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ParentDashboard } from '@/components/parent/ParentDashboard'

export default async function ParentDashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Student Progress</h1>
        <p className="text-muted-foreground">
          Track your student's scholarship applications and funding secured
        </p>
      </div>

      <ParentDashboard />
    </div>
  )
}
