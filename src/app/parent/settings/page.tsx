/**
 * Parent Settings Page
 *
 * Parent notification preferences and settings.
 * Story 5.8: Parent/Guardian View - Task 6 (Notification Preferences)
 */

import { ParentNotificationSettings } from '@/components/parent/ParentNotificationSettings'

export default function ParentSettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your notification preferences and account settings
        </p>
      </div>

      <ParentNotificationSettings />
    </div>
  )
}
