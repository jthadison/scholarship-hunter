/**
 * Morgan Dashboard Page
 *
 * Main route for Morgan agent - Essay Strategist Dashboard
 * Displays essay writing guidance, workflow tracking, and quality insights
 *
 * Story 4.10: Morgan Agent - Essay Strategist Dashboard
 */

import { Suspense } from 'react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MorganDashboard } from '@/modules/morgan/components/MorganDashboard'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Morgan - Essay Strategist | Scholarship Hunter',
  description:
    'Craft winning essays with Morgan. Get personalized guidance, reusability suggestions, and quality insights.',
}

export default async function MorganPage() {
  // Require authentication
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  // Get user info
  const user = await currentUser()
  const firstName = user?.firstName ?? 'there'

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      }
    >
      <MorganDashboard firstName={firstName} />
    </Suspense>
  )
}
