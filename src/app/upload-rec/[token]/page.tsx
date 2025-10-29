/**
 * Recommendation Letter Upload Page (Public)
 *
 * Public page where recommenders can upload their letter via unique token link.
 * No authentication required - access controlled by upload token.
 *
 * Story 4.4: Recommendation Letter Coordination
 * AC6: Recommender upload link → student sees "Received" status
 *
 * @module app/upload-rec/[token]/page
 */

import { Metadata } from 'next'
import { RecommendationUploadForm } from '@/components/recommendations/RecommendationUploadForm'

interface PageProps {
  params: { token: string }
}

export const metadata: Metadata = {
  title: 'Upload Recommendation Letter',
  description: 'Upload your recommendation letter for scholarship application',
}

export default function RecommendationUploadPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <RecommendationUploadForm token={params.token} />
      </div>
    </div>
  )
}
