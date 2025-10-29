/**
 * Dexter Dashboard Page
 *
 * Main route for Dexter agent - Document Manager Dashboard
 * Displays document organization, compliance status, and proactive warnings
 *
 * Story 4.5: Dexter Agent - Document Manager Dashboard
 */

import { Suspense } from 'react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DexterDashboard } from '@/modules/dexter/components/DexterDashboard'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Dexter - Document Manager | Scholarship Hunter',
  description:
    'Organize your documents, track compliance, and manage recommendation letters with Dexter.',
}

export default async function DexterPage() {
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
      <DexterDashboard firstName={firstName} />
    </Suspense>
  )
}
