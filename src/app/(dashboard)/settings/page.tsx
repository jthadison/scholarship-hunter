import { UserProfile } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/server/db'

export default async function SettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Get user account creation date
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      createdAt: true,
      email: true,
    },
  })

  return (
    <div className="flex min-h-screen flex-col p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account security and preferences
        </p>
      </div>

      {user && (
        <div className="mb-6 rounded-lg border p-4 bg-card">
          <h2 className="text-lg font-semibold mb-2">Account Information</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Email:</span>{' '}
              <span className="font-medium">{user.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Member since:</span>{' '}
              <span className="font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      <UserProfile
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'shadow-none border',
          },
        }}
      />
    </div>
  )
}
