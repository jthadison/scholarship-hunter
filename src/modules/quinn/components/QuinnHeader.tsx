/**
 * Quinn Header Component (Story 3.6 - Task 1)
 *
 * Displays personalized greeting with Quinn avatar and task summary.
 * Features organized, proactive tone aligned with Quinn persona (Timeline Coordinator).
 *
 * Quinn Character Profile:
 * - Role: Timeline Coordinator
 * - Personality: Organized, encouraging, proactive, realistic
 * - Color: Teal/cyan (suggests organization and calm)
 * - Communication: Action-oriented ("Let's...", "Ready to...", "Time to...")
 *
 * @component
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Calendar, Clock } from 'lucide-react'

interface QuinnHeaderProps {
  firstName: string
  tasksThisWeek: number
  totalHoursScheduled: number
}

export function QuinnHeader({ firstName, tasksThisWeek, totalHoursScheduled }: QuinnHeaderProps) {
  // Generate contextual greeting based on workload
  const getGreeting = () => {
    if (tasksThisWeek === 0) {
      return "You're all caught up! Ready to start something new?"
    }
    if (totalHoursScheduled < 10) {
      return "Let's keep you on track this week."
    }
    if (totalHoursScheduled <= 15) {
      return "You've got a solid week ahead - let's stay focused."
    }
    return "This is a heavy week - let's prioritize together."
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-cyan-50 via-teal-50 to-cyan-50 border-cyan-200">
      <div className="flex items-start gap-4">
        {/* Quinn Avatar */}
        <Avatar className="h-16 w-16 border-2 border-cyan-300">
          <AvatarImage src="/agents/quinn.svg" alt="Quinn - Your Timeline Coordinator" />
          <AvatarFallback className="bg-cyan-500 text-white text-2xl font-bold">
            Q
          </AvatarFallback>
        </Avatar>

        {/* Greeting */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hi {firstName}! I'm Quinn, your timeline coordinator.
          </h1>

          <p className="text-lg text-gray-700 mb-3">{getGreeting()}</p>

          {/* Quick stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-cyan-600" />
              <span>
                {tasksThisWeek === 0 ? (
                  'No tasks this week'
                ) : (
                  <>
                    <span className="font-semibold text-cyan-700">{tasksThisWeek}</span>{' '}
                    {tasksThisWeek === 1 ? 'task' : 'tasks'} this week
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-cyan-600" />
              <span>
                <span className="font-semibold text-cyan-700">{totalHoursScheduled}h</span>{' '}
                scheduled
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
