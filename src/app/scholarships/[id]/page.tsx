/**
 * Scholarship Detail Page
 *
 * Displays comprehensive scholarship information including:
 * - Header with name, provider, award, deadline, CTAs
 * - Match score breakdown (authenticated users)
 * - Eligibility breakdown
 * - Application requirements
 * - Competition context
 *
 * @page /scholarships/[id]
 */

'use client'

import { useParams, useRouter } from 'next/navigation'
import { trpc } from '@/shared/lib/trpc'
import { Loader2, Home, ArrowLeft, Share2 } from 'lucide-react'
import { ScholarshipDetailHeader } from '@/components/scholarships/ScholarshipDetailHeader'
import { MatchScoreSection } from '@/components/scholarships/MatchScoreSection'
import { EligibilityBreakdown } from '@/components/scholarships/EligibilityBreakdown'
import { ApplicationRequirements } from '@/components/scholarships/ApplicationRequirements'
import { CompetitionContext } from '@/components/scholarships/CompetitionContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useState } from 'react'
import { compareEligibility } from '@/server/lib/matching/compare-eligibility'

export default function ScholarshipDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoaded: isUserLoaded } = useUser()
  const [isAddingApplication, setIsAddingApplication] = useState(false)

  const scholarshipId = params?.id as string

  // Fetch scholarship data
  const {
    data: scholarship,
    isLoading,
    error,
    refetch,
  } = trpc.scholarship.getById.useQuery({ id: scholarshipId })

  // Fetch student profile for eligibility comparison
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  })

  // Fetch existing applications to check if already added
  const { data: existingApplications } = trpc.application.list.useQuery(undefined, {
    enabled: !!user,
  })

  // Create application mutation
  const createApplicationMutation = trpc.application.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Scholarship added to your applications',
      })
      refetch() // Refetch to update UI
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleAddToApplications = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add scholarships to your applications',
        variant: 'destructive',
      })
      router.push('/sign-in')
      return
    }

    setIsAddingApplication(true)
    try {
      await createApplicationMutation.mutateAsync({ scholarshipId })
    } finally {
      setIsAddingApplication(false)
    }
  }

  const handleViewWebsite = () => {
    if (scholarship?.website) {
      window.open(scholarship.website, '_blank', 'noopener,noreferrer')
    } else {
      toast({
        title: 'Website not available',
        description: 'This scholarship does not have a website URL',
        variant: 'destructive',
      })
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: scholarship?.name || 'Scholarship',
          text: `Check out this scholarship: ${scholarship?.name}`,
          url,
        })
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url)
      toast({
        title: 'Link copied!',
        description: 'Scholarship link copied to clipboard',
      })
    }
  }

  // Loading state
  if (isLoading || !isUserLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  // Error state
  if (error || !scholarship) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Scholarship Not Found</h1>
          <p className="text-gray-600 mb-6">
            The scholarship you're looking for doesn't exist or is no longer available.
          </p>
          <Button onClick={() => router.push('/scholarships/search')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </div>
      </div>
    )
  }

  // Check if already added to applications
  const isAlreadyAdded = existingApplications?.some(
    (app) => app.scholarshipId === scholarshipId
  )

  // Get match data
  const match = scholarship.matches?.[0]

  // Calculate eligibility results if profile available
  const eligibilityResults =
    profile && scholarship.eligibilityCriteria
      ? compareEligibility(
          profile,
          scholarship.eligibilityCriteria as Parameters<typeof compareEligibility>[1]
        )
      : []

  // Parse essay prompts
  const essayPrompts =
    scholarship.essayPrompts && Array.isArray(scholarship.essayPrompts)
      ? (scholarship.essayPrompts as Array<{ prompt: string; wordCount?: number }>)
      : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/dashboard" className="hover:text-blue-600 flex items-center gap-1">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <span>›</span>
            <Link href="/scholarships/search" className="hover:text-blue-600">
              Scholarships
            </Link>
            <span>›</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">
              {scholarship.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Actions */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Header Section - Full Width */}
        <div className="mb-8">
          <ScholarshipDetailHeader
            scholarship={scholarship}
            onAddToApplications={handleAddToApplications}
            onViewWebsite={handleViewWebsite}
            isAdded={!!isAlreadyAdded}
            isLoading={isAddingApplication}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Match Score (if authenticated) */}
          {match && (
            <div className="lg:col-span-1 space-y-6">
              <MatchScoreSection
                match={{
                  overallMatchScore: match.overallMatchScore,
                  academicScore: match.academicScore,
                  demographicScore: match.demographicScore,
                  majorFieldScore: match.majorFieldScore,
                  experienceScore: match.experienceScore,
                  financialScore: match.financialScore,
                  specialCriteriaScore: match.specialCriteriaScore,
                  successProbability: match.successProbability,
                  successTier: match.successTier,
                }}
                onRecalculate={() => {
                  // TODO: Implement recalculate match functionality (Story 2.13)
                  toast({
                    title: 'Coming soon',
                    description: 'Match recalculation will be available soon',
                  })
                }}
              />
            </div>
          )}

          {/* Right Column - Details */}
          <div className={`${match ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
            {/* Eligibility Breakdown */}
            {eligibilityResults.length > 0 && (
              <EligibilityBreakdown eligibilityResults={eligibilityResults} />
            )}

            {/* Application Requirements */}
            <ApplicationRequirements
              essayPrompts={essayPrompts}
              requiredDocuments={scholarship.requiredDocuments}
              recommendationCount={scholarship.recommendationCount}
              effortLevel={match?.applicationEffort}
            />

            {/* Competition Context */}
            <CompetitionContext
              applicantPoolSize={scholarship.applicantPoolSize}
              acceptanceRate={scholarship.acceptanceRate}
              numberOfAwards={scholarship.numberOfAwards}
              overallMatchScore={match?.overallMatchScore}
              successProbability={match?.successProbability}
            />
          </div>
        </div>

        {/* Sticky Bottom CTA (Mobile) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
          <Button
            onClick={handleAddToApplications}
            disabled={!!isAlreadyAdded || isAddingApplication}
            size="lg"
            className="w-full"
          >
            {isAlreadyAdded ? 'Already in Applications' : 'Add to My Applications'}
          </Button>
        </div>
      </div>
    </div>
  )
}
