/**
 * Application Workspace Page
 *
 * Unified interface for single scholarship application showing all tasks and requirements.
 * Students can view scholarship details, progress, timeline, and take quick actions
 * without navigating between multiple pages.
 *
 * Story 3.8: Application Workspace - Unified Interface
 *
 * @module app/applications/[id]/page
 */

import { Metadata } from 'next'
import { ApplicationWorkspace } from '@/components/workspace/ApplicationWorkspace'

interface PageProps {
  params: { id: string }
}

export const metadata: Metadata = {
  title: 'Application Workspace',
  description: 'Manage your scholarship application',
}

export default function ApplicationWorkspacePage({ params }: PageProps) {
  return <ApplicationWorkspace applicationId={params.id} />
}
