/**
 * Shelby Header Component
 *
 * Displays personalized greeting with Shelby avatar and match count.
 * Features warm, encouraging tone aligned with Shelby persona.
 *
 * @component
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'

interface ShelbyHeaderProps {
  firstName: string
  totalMatches: number
}

export function ShelbyHeader({ firstName, totalMatches }: ShelbyHeaderProps) {
  return (
    <Card className="p-6 bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-50 border-orange-200">
      <div className="flex items-start gap-4">
        {/* Shelby Avatar */}
        <Avatar className="h-16 w-16 border-2 border-orange-300">
          <AvatarImage src="/agents/shelby.svg" alt="Shelby - Your Opportunity Scout" />
          <AvatarFallback className="bg-orange-500 text-white text-2xl font-bold">
            S
          </AvatarFallback>
        </Avatar>

        {/* Greeting */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hi {firstName}! I'm Shelby, your scholarship scout.
          </h1>

          {totalMatches === 0 ? (
            <p className="text-lg text-gray-700">
              Let's find your scholarships! Complete your profile to see matched opportunities.
            </p>
          ) : (
            <p className="text-lg text-gray-700">
              I found <span className="font-bold text-orange-600">{totalMatches}</span>{' '}
              {totalMatches === 1 ? 'scholarship' : 'scholarships'} matched to your profile. You've
              got this!
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
