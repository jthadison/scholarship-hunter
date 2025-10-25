/**
 * Story 1.8: Welcome Step - Wizard Introduction
 * First step: Welcome message, benefits, estimated completion time
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Trophy, Target, Clock } from 'lucide-react'

interface WelcomeStepProps {
  studentName?: string
  onGetStarted: () => void
}

export function WelcomeStep({ studentName, onGetStarted }: WelcomeStepProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">
          Welcome to Scholarship Hunter{studentName ? `, ${studentName}` : ''}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Let's build your profile to unlock personalized scholarship opportunities
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Why Complete Your Profile?
          </CardTitle>
          <CardDescription>
            A complete profile is your key to finding the perfect scholarships
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">4x Better Matches</h3>
              <p className="text-sm text-muted-foreground">
                Students with complete profiles are 4x more likely to receive high-quality scholarship matches
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Personalized Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                Our algorithm matches you with scholarships based on your unique background, achievements, and goals
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Quick & Easy</h3>
              <p className="text-sm text-muted-foreground">
                Most students complete their profile in 10-15 minutes. You can save and return anytime!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">What You'll Share</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Academic info • Demographics • Major & activities • Special circumstances
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">6 Steps</div>
              <p className="text-xs text-muted-foreground">~10-15 min</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onGetStarted} className="px-8">
          Get Started
        </Button>
      </div>
    </div>
  )
}
