/**
 * Weekly Task List Component (Story 3.6 - Task 2)
 *
 * Displays prioritized tasks for the next 7 days, organized by deadline urgency.
 * Shows essays, recommendations, documents, and reviews with status indicators.
 *
 * Acceptance Criteria #1:
 * Quinn dashboard displays "This Week's Tasks" section showing prioritized tasks:
 * Essays to draft (with scholarship name and word count), recommendations to request
 * (with teacher names), documents to upload (with document types), organized by
 * deadline urgency
 *
 * @component
 */

'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, FileText, Mail, Upload, CheckCircle2, Send, Circle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

type TaskUrgency = 'CRITICAL' | 'URGENT' | 'UPCOMING'
type TaskType = 'ESSAY' | 'REC' | 'DOC' | 'REVIEW' | 'SUBMIT'
type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE'

interface Task {
  id: string
  type: TaskType
  applicationId: string
  scholarshipName: string
  title: string
  description: string
  dueDate: Date
  daysUntil: number
  urgency: TaskUrgency
  estimatedHours: number
  status: TaskStatus
}

interface WeeklyTaskListProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onMarkComplete?: (taskId: string, taskType: TaskType) => void
}

/**
 * Get urgency badge color and label
 */
function getUrgencyBadge(urgency: TaskUrgency) {
  const variants = {
    CRITICAL: {
      variant: 'destructive' as const,
      label: 'URGENT',
      className: 'bg-red-100 text-red-800 border-red-300',
    },
    URGENT: {
      variant: 'default' as const,
      label: 'Soon',
      className: 'bg-orange-100 text-orange-800 border-orange-300',
    },
    UPCOMING: {
      variant: 'secondary' as const,
      label: 'This Week',
      className: 'bg-blue-100 text-blue-800 border-blue-300',
    },
  }
  return variants[urgency]
}

/**
 * Get task type icon
 */
function getTaskIcon(type: TaskType) {
  const icons = {
    ESSAY: FileText,
    REC: Mail,
    DOC: Upload,
    REVIEW: CheckCircle2,
    SUBMIT: Send,
  }
  const Icon = icons[type]
  return <Icon className="h-5 w-5" />
}

/**
 * Get status indicator
 */
function getStatusIndicator(status: TaskStatus) {
  switch (status) {
    case 'COMPLETE':
      return (
        <div className="flex items-center gap-1.5 text-green-600">
          <CheckCircle2 className="h-4 w-4 fill-green-600" />
          <span className="text-sm font-medium">Complete</span>
        </div>
      )
    case 'IN_PROGRESS':
      return (
        <div className="flex items-center gap-1.5 text-orange-600">
          <Circle className="h-4 w-4 fill-orange-300 stroke-orange-600" />
          <span className="text-sm font-medium">In Progress</span>
        </div>
      )
    case 'NOT_STARTED':
      return (
        <div className="flex items-center gap-1.5 text-gray-400">
          <Circle className="h-4 w-4" />
          <span className="text-sm font-medium">Not Started</span>
        </div>
      )
  }
}

export function WeeklyTaskList({ tasks, onTaskClick, onMarkComplete }: WeeklyTaskListProps) {
  // Group tasks by urgency
  const criticalTasks = tasks.filter((t) => t.urgency === 'CRITICAL')
  const urgentTasks = tasks.filter((t) => t.urgency === 'URGENT')
  const upcomingTasks = tasks.filter((t) => t.urgency === 'UPCOMING')

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            This Week's Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-700 mb-1">
              🎉 You have no tasks this week!
            </p>
            <p className="text-sm text-gray-500">Ready to add more applications?</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-cyan-600" />
          This Week's Tasks ({tasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Critical Tasks (1-2 days) */}
        {criticalTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-2 uppercase tracking-wide">
              Critical (Next 1-2 Days)
            </h3>
            <div className="space-y-2">
              {criticalTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTaskClick={onTaskClick}
                  onMarkComplete={onMarkComplete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Urgent Tasks (3-4 days) */}
        {urgentTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-orange-700 mb-2 uppercase tracking-wide">
              Urgent (Next 3-4 Days)
            </h3>
            <div className="space-y-2">
              {urgentTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTaskClick={onTaskClick}
                  onMarkComplete={onMarkComplete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Tasks (5-7 days) */}
        {upcomingTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">
              Upcoming (Next 5-7 Days)
            </h3>
            <div className="space-y-2">
              {upcomingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTaskClick={onTaskClick}
                  onMarkComplete={onMarkComplete}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Individual Task Card
 */
function TaskCard({
  task,
  onTaskClick,
  onMarkComplete,
}: {
  task: Task
  onTaskClick?: (task: Task) => void
  onMarkComplete?: (taskId: string, taskType: TaskType) => void
}) {
  const urgencyBadge = getUrgencyBadge(task.urgency)

  return (
    <div
      className="border rounded-lg p-4 hover:border-cyan-300 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => onTaskClick?.(task)}
    >
      <div className="flex items-start gap-3">
        {/* Task Icon */}
        <div className="mt-0.5 text-cyan-600">{getTaskIcon(task.type)}</div>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-0.5">{task.title}</h4>
              <p className="text-sm text-gray-600">{task.scholarshipName}</p>
            </div>
            <Badge className={urgencyBadge.className}>{urgencyBadge.label}</Badge>
          </div>

          <p className="text-sm text-gray-500 mb-2 line-clamp-1">{task.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Due in {task.daysUntil} {task.daysUntil === 1 ? 'day' : 'days'}</span>
              <span>{task.estimatedHours}h estimated</span>
            </div>

            {/* Status Indicator */}
            {getStatusIndicator(task.status)}
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      {task.status !== 'COMPLETE' && onMarkComplete && (
        <div className="mt-3 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={(e) => {
              e.stopPropagation()
              onMarkComplete(task.id, task.type)
            }}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark Complete
          </Button>
        </div>
      )}
    </div>
  )
}
