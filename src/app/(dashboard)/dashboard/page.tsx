import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="flex min-h-screen flex-col p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName || 'Student'}!
        </h1>
        <p className="text-muted-foreground">
          Your scholarship journey starts here
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-2">Profile</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Complete your student profile to unlock scholarship matches
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Complete Profile →
          </Link>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-2">Scholarships</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Browse and discover scholarships that match your profile
          </p>
          <Link
            href="/scholarships"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Explore Scholarships →
          </Link>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-2">Settings</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your account security and preferences
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Account Settings →
          </Link>
        </div>
      </div>
    </div>
  )
}
