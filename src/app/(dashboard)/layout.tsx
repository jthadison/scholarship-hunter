import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/modules/navigation/components/Sidebar'
import { TopNav } from '@/modules/navigation/components/TopNav'
import { BottomNav } from '@/modules/navigation/components/BottomNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId) {
    redirect('/sign-in')
  }

  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : undefined
  const userEmail = user?.emailAddresses[0]?.emailAddress

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Top Navigation */}
        <TopNav userName={userName} userEmail={userEmail} />

        {/* Page Content */}
        <main className="pb-20 lg:pb-8">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
