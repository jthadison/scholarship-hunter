'use client'

import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'

interface DashboardWelcomeProps {
  firstName?: string
  profileCompleteness: number
  profileStrength: number
  scholarshipsMatched?: number
  applicationsInProgress?: number
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) {
    return 'Good morning'
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon'
  } else {
    return 'Good evening'
  }
}

function getMotivationalMessage(completeness: number): string {
  if (completeness === 100) {
    return "Your profile is looking strong! Ready to find scholarships!"
  } else if (completeness >= 75) {
    return "You're making great progress! Keep going!"
  } else if (completeness >= 25) {
    return "You're making great progress!"
  } else {
    return "Let's get started building your profile!"
  }
}

export function DashboardWelcome({
  firstName = 'Student',
  profileCompleteness,
  profileStrength,
  scholarshipsMatched = 0,
  applicationsInProgress = 0,
}: DashboardWelcomeProps) {
  const greeting = getTimeBasedGreeting()
  const motivationalMessage = getMotivationalMessage(profileCompleteness)

  return (
    <div className="space-y-4">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-2">{motivationalMessage}</p>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Profile Completeness
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{profileCompleteness}%</span>
                {profileCompleteness === 100 ? (
                  <Badge variant="default" className="bg-green-500">
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="outline">In Progress</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Profile Strength
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{profileStrength}</span>
                {profileStrength >= 80 ? (
                  <Badge variant="default" className="bg-green-500">
                    Strong
                  </Badge>
                ) : profileStrength >= 60 ? (
                  <Badge variant="default" className="bg-yellow-500">
                    Good
                  </Badge>
                ) : (
                  <Badge variant="outline">Building</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Scholarships Matched
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{scholarshipsMatched}</span>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Applications
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{applicationsInProgress}</span>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
