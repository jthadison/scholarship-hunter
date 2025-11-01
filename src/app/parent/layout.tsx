/**
 * Parent Portal Layout
 *
 * Layout for parent-specific pages with distinct navigation.
 * Story 5.8: Parent/Guardian View - Task 10 (Navigation & Access Control)
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/server/db'
import Link from 'next/link'
import { Home, BookOpen, Settings } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Verify user has PARENT role
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true, email: true },
  })

  if (user?.role !== 'PARENT') {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-xl font-bold text-primary">Parent Portal</h2>
        </div>

        <nav className="space-y-1 p-4">
          <Link
            href="/parent/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>

          <Link
            href="/parent/resources"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <BookOpen className="h-4 w-4" />
            Resources
          </Link>

          <Link
            href="/parent/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2">
              <UserButton />
              <div className="text-sm">
                <p className="font-medium">Parent Account</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
