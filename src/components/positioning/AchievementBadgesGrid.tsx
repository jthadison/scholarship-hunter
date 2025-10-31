/**
 * Achievement Badges Grid Component
 *
 * Displays unlocked and locked achievement badges:
 * - Unlocked badges with unlock dates
 * - Locked badges with unlock criteria
 * - Badge details modal
 *
 * Story 5.5: Competitive Positioning Over Time
 * AC6: Visual Progress Indicators (Badges)
 *
 * @module components/positioning/AchievementBadgesGrid
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Lock, Trophy, Star, Users as UsersIcon, Heart, TrendingUp, Target } from 'lucide-react'
import { format } from 'date-fns'
import type { BadgeType } from '@prisma/client'

interface BadgeData {
  type: BadgeType
  title: string
  description: string
  iconName: string
}

interface UnlockedBadge extends BadgeData {
  unlockedAt: Date
}

interface LockedBadge extends BadgeData {
  criteria: string
}

interface AchievementBadgesGridProps {
  unlocked: UnlockedBadge[]
  locked: LockedBadge[]
}

const ICON_MAP: Record<string, typeof Award> = {
  trophy: Trophy,
  star: Star,
  users: UsersIcon,
  heart: Heart,
  'trending-up': TrendingUp,
  target: Target,
  award: Award,
}

function getBadgeIcon(iconName: string) {
  const Icon = ICON_MAP[iconName] || Award
  return Icon
}

export function AchievementBadgesGrid({ unlocked, locked }: AchievementBadgesGridProps) {
  return (
    <div className="space-y-6">
      {/* Unlocked Badges */}
      {unlocked.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Unlocked Achievements ({unlocked.length})
            </CardTitle>
            <CardDescription>Badges you've earned through your progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {unlocked.map((badge) => {
                const Icon = getBadgeIcon(badge.iconName)
                return (
                  <div
                    key={badge.type}
                    className="p-4 rounded-lg border bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
                        <Icon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{badge.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {badge.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Unlocked {format(new Date(badge.unlockedAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Badges */}
      {locked.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Locked Achievements ({locked.length})
            </CardTitle>
            <CardDescription>Complete these criteria to unlock more badges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {locked.map((badge) => {
                const Icon = getBadgeIcon(badge.iconName)
                return (
                  <div
                    key={badge.type}
                    className="p-4 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-muted-foreground">
                            {badge.title}
                          </h4>
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {badge.description}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {badge.criteria}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Badges State */}
      {unlocked.length === 0 && locked.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Achievements Yet</h3>
            <p className="text-muted-foreground">
              Keep improving your profile to unlock achievement badges!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
