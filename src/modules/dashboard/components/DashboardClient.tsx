'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { ArrowRight, GraduationCap, FileText, Calendar } from 'lucide-react'
import { trpc } from '@/shared/lib/trpc'
import { DashboardWelcome } from './DashboardWelcome'
import { PlaceholderSection } from './PlaceholderSection'
import { OnboardingChecklist } from './OnboardingChecklist'
import { ProfileCompletenessCard } from '@/modules/profile/components/ProfileCompletenessCard'
import { ProfileStrengthCard } from '@/modules/profile/components/ProfileStrengthCard'

interface DashboardClientProps {
  firstName: string
}

export function DashboardClient({ firstName }: DashboardClientProps) {
  // Fetch completeness and strength data for the welcome section
  const { data: completeness } = trpc.profile.getCompleteness.useQuery()
  const { data: strengthBreakdown } = trpc.profile.getStrengthBreakdown.useQuery()
  const { data: missingFields } = trpc.profile.getMissingFields.useQuery()

  const completenessPercentage = completeness?.completionPercentage ?? 0
  const strengthScore = strengthBreakdown?.overallScore ?? 0
  const profileIncomplete = completenessPercentage < 100

  return (
    <div className="flex min-h-screen flex-col p-4 md:p-6 lg:p-8 space-y-8">
      {/* Welcome Section */}
      <DashboardWelcome
        firstName={firstName}
        profileCompleteness={completenessPercentage}
        profileStrength={strengthScore}
        scholarshipsMatched={0}
        applicationsInProgress={0}
      />

      {/* Complete Your Profile CTA (shown only if incomplete) */}
      {profileIncomplete && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Complete Your Profile</h3>
              <p className="text-sm text-muted-foreground">
                {missingFields && missingFields.length > 0
                  ? `Add ${missingFields.slice(0, 2).join(', ')}${
                      missingFields.length > 2 ? ' and more' : ''
                    } to unlock scholarship matches`
                  : 'Finish your profile to find the best scholarships for you'}
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/profile/wizard">
                Complete Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Onboarding Checklist for New Users */}
      {profileIncomplete && (
        <OnboardingChecklist
          profileCompleted={completenessPercentage === 100}
          strengthReviewed={strengthScore > 0}
        />
      )}

      {/* Profile Status Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <ProfileCompletenessCard />
        <ProfileStrengthCard />
      </div>

      {/* Edit Profile Link for Completed Profiles */}
      {!profileIncomplete && (
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/profile/edit">Edit Profile</Link>
          </Button>
        </div>
      )}

      {/* Placeholder Sections for Future Features */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Coming Soon</h2>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Scholarships Matched Placeholder */}
          <PlaceholderSection
            title="Scholarships Matched"
            description={
              completenessPercentage === 100
                ? 'Scholarship matching will be available soon. We\'ll analyze your profile and find the best opportunities for you.'
                : 'Complete your profile to see personalized scholarship matches.'
            }
            icon={GraduationCap}
            epicLabel="Coming in Epic 2"
            illustration={
              <GraduationCap className="h-16 w-16 text-muted-foreground/30" />
            }
          />

          {/* Applications in Progress Placeholder */}
          <PlaceholderSection
            title="Applications in Progress"
            description="Track your scholarship applications, manage deadlines, and monitor your progress all in one place."
            icon={FileText}
            epicLabel="Coming in Epic 3"
            illustration={
              <FileText className="h-16 w-16 text-muted-foreground/30" />
            }
          />
        </div>

        {/* Upcoming Deadlines Placeholder */}
        <PlaceholderSection
          title="Upcoming Deadlines"
          description="Never miss a deadline! We'll send you timely reminders for all your scholarship applications."
          icon={Calendar}
          epicLabel="Coming in Epic 3"
          illustration={
            <Calendar className="h-16 w-16 text-muted-foreground/30" />
          }
        />
      </div>
    </div>
  )
}
