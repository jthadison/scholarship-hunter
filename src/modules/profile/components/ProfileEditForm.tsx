/**
 * Story 1.10: Profile Edit Form Component
 * Reuses ProfileWizard in edit mode for consistency
 */

'use client'

import { ProfileWizard } from './ProfileWizard'

export function ProfileEditForm() {
  return <ProfileWizard isEditMode={true} />
}
