/**
 * Parent Resources Page
 *
 * Financial aid and college planning resources for parents.
 * Story 5.8: Parent/Guardian View - Task 9 (Financial Aid Resources)
 */

import { ResourceCenter } from '@/components/parent/ResourceCenter'

export default function ParentResourcesPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Resources & Support</h1>
        <p className="text-muted-foreground">
          Financial aid information and college planning resources to support your student
        </p>
      </div>

      <ResourceCenter />
    </div>
  )
}
