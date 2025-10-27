import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ShelbyDashboard } from '@/modules/shelby/components/ShelbyDashboard'

/**
 * Shelby Agent - Opportunity Scout Dashboard Page
 *
 * Server component that handles authentication and loads the Shelby dashboard.
 * Provides personalized scholarship recommendations and quick stats.
 *
 * @route /shelby
 */
export default async function ShelbyPage() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId) {
    redirect('/sign-in')
  }

  const firstName = user?.firstName || 'Student'

  return <ShelbyDashboard firstName={firstName} />
}
