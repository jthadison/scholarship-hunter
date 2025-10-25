/**
 * Story 1.10: Profile Version History Client Component
 * Wrapper for ProfileVersionHistory with navigation
 */

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ProfileVersionHistory } from './ProfileVersionHistory'

export function ProfileVersionHistoryClient() {
  return (
    <div className="container max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Profile Version History</h1>
        <p className="text-muted-foreground mt-2">
          Track your profile changes and see how you've grown over time
        </p>
        <p className="text-sm text-muted-foreground">
          Dashboard &gt; Profile &gt; History
        </p>
      </div>

      {/* Version History Component */}
      <ProfileVersionHistory />
    </div>
  )
}
