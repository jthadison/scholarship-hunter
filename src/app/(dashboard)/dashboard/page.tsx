import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from '@/modules/dashboard/components/DashboardClient'

export default async function DashboardPage() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId) {
    redirect('/sign-in')
  }

  const firstName = user?.firstName || 'Student'

  return <DashboardClient firstName={firstName} />
}
