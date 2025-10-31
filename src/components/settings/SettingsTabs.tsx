'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CounselorAccessSettings } from './CounselorAccessSettings'
import { ParentAccessSettings } from './ParentAccessSettings'
import { Users, UserCircle } from 'lucide-react'

/**
 * Settings Tabs Component
 *
 * Provides tabbed interface for student access management settings.
 * Includes tabs for Parent Access and Counselor Access.
 *
 * Story 5.8: Parent/Guardian View - Task 3 (Student Permission Management UI)
 */
export function SettingsTabs() {
  return (
    <Tabs defaultValue="parent" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="parent" className="flex items-center gap-2">
          <UserCircle className="h-4 w-4" />
          Parent Access
        </TabsTrigger>
        <TabsTrigger value="counselor" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Counselor Access
        </TabsTrigger>
      </TabsList>

      <TabsContent value="parent" className="mt-6">
        <ParentAccessSettings />
      </TabsContent>

      <TabsContent value="counselor" className="mt-6">
        <CounselorAccessSettings />
      </TabsContent>
    </Tabs>
  )
}
