/**
 * Quinn Dashboard Page (Story 3.6)
 *
 * Route: /quinn
 *
 * Quinn is the Timeline Coordinator agent that helps students manage deadlines
 * and optimize workload distribution across multiple applications.
 *
 * @page
 */

import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { QuinnDashboard } from '@/modules/quinn/components/QuinnDashboard'
import { prisma } from '@/server/db'

export const metadata = {
  title: 'Quinn - Timeline Coordinator | Scholarship Hunter',
  description:
    "Manage your scholarship deadlines and optimize your workload with Quinn, your timeline coordinator.",
}

export default async function QuinnPage() {
  // Get authenticated user
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Get student profile for first name
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      firstName: true,
    },
  })

  if (!student) {
    redirect('/profile/wizard') // Redirect to profile wizard if no student profile
  }

  return <QuinnDashboard firstName={student.firstName} />
}
