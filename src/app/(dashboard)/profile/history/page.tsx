/**
 * Story 1.10: Profile Version History Page
 * /profile/history - View profile version history
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ProfileVersionHistoryClient } from '@/modules/profile/components/ProfileVersionHistoryClient'

export default async function ProfileHistoryPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return <ProfileVersionHistoryClient />
}
