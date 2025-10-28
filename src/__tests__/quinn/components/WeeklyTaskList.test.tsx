/**
 * Unit Tests for WeeklyTaskList Component (Story 3.6 - AC#1)
 *
 * Tests task display organized by urgency
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WeeklyTaskList } from '@/modules/quinn/components/WeeklyTaskList'

describe('WeeklyTaskList Component', () => {
  const mockTasks = [
    {
      id: 'task-1',
      type: 'ESSAY' as const,
      applicationId: 'app-1',
      scholarshipName: 'Women in STEM',
      title: 'Draft 500-word essay',
      description: 'Essay required',
      dueDate: new Date('2025-11-17'),
      daysUntil: 2,
      urgency: 'CRITICAL' as const,
      estimatedHours: 5,
      status: 'NOT_STARTED' as const,
    },
    {
      id: 'task-2',
      type: 'REC' as const,
      applicationId: 'app-2',
      scholarshipName: 'Tech Leaders',
      title: 'Request 2 recommendations',
      description: 'Contact teachers',
      dueDate: new Date('2025-11-19'),
      daysUntil: 4,
      urgency: 'URGENT' as const,
      estimatedHours: 1,
      status: 'IN_PROGRESS' as const,
    },
    {
      id: 'task-3',
      type: 'DOC' as const,
      applicationId: 'app-3',
      scholarshipName: 'Community Service',
      title: 'Upload 3 documents',
      description: 'Scan and upload required documents',
      dueDate: new Date('2025-11-21'),
      daysUntil: 6,
      urgency: 'UPCOMING' as const,
      estimatedHours: 2,
      status: 'NOT_STARTED' as const,
    },
  ]

  it('should display all tasks', () => {
    render(<WeeklyTaskList tasks={mockTasks} />)

    expect(screen.getByText('Draft 500-word essay')).toBeInTheDocument()
    expect(screen.getByText('Request 2 recommendations')).toBeInTheDocument()
    expect(screen.getByText('Upload 3 documents')).toBeInTheDocument()
  })

  it('should display scholarship names', () => {
    render(<WeeklyTaskList tasks={mockTasks} />)

    expect(screen.getByText('Women in STEM')).toBeInTheDocument()
    expect(screen.getByText('Tech Leaders')).toBeInTheDocument()
    expect(screen.getByText('Community Service')).toBeInTheDocument()
  })

  it('should group tasks by urgency level', () => {
    render(<WeeklyTaskList tasks={mockTasks} />)

    expect(screen.getByText(/Critical \(Next 1-2 Days\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Urgent \(Next 3-4 Days\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Upcoming \(Next 5-7 Days\)/i)).toBeInTheDocument()
  })

  it('should display urgency badges', () => {
    render(<WeeklyTaskList tasks={mockTasks} />)

    expect(screen.getByText('URGENT')).toBeInTheDocument()
    expect(screen.getByText('Soon')).toBeInTheDocument()
    expect(screen.getByText('This Week')).toBeInTheDocument()
  })

  it('should display days until due', () => {
    render(<WeeklyTaskList tasks={mockTasks} />)

    expect(screen.getByText(/Due in 2 days/)).toBeInTheDocument()
    expect(screen.getByText(/Due in 4 days/)).toBeInTheDocument()
    expect(screen.getByText(/Due in 6 days/)).toBeInTheDocument()
  })

  it('should display estimated hours', () => {
    render(<WeeklyTaskList tasks={mockTasks} />)

    expect(screen.getByText(/5h estimated/)).toBeInTheDocument()
    expect(screen.getByText(/1h estimated/)).toBeInTheDocument()
    expect(screen.getByText(/2h estimated/)).toBeInTheDocument()
  })

  it('should display task status indicators', () => {
    render(<WeeklyTaskList tasks={mockTasks} />)

    expect(screen.getAllByText('Not Started').length).toBeGreaterThan(0)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('should display empty state when no tasks', () => {
    render(<WeeklyTaskList tasks={[]} />)

    expect(screen.getByText(/You have no tasks this week!/)).toBeInTheDocument()
    expect(screen.getByText(/Ready to add more applications?/)).toBeInTheDocument()
  })

  it('should call onTaskClick when task is clicked', () => {
    const mockOnTaskClick = vi.fn()
    render(<WeeklyTaskList tasks={mockTasks} onTaskClick={mockOnTaskClick} />)

    const taskCard = screen.getByText('Draft 500-word essay').closest('div')
    if (taskCard) {
      fireEvent.click(taskCard.parentElement!)
      expect(mockOnTaskClick).toHaveBeenCalledWith(mockTasks[0])
    }
  })

  it('should call onMarkComplete when Mark Complete button clicked', () => {
    const mockOnMarkComplete = vi.fn()
    render(<WeeklyTaskList tasks={mockTasks} onMarkComplete={mockOnMarkComplete} />)

    const markCompleteButtons = screen.getAllByText('Mark Complete')
    fireEvent.click(markCompleteButtons[0])

    expect(mockOnMarkComplete).toHaveBeenCalledWith('task-1', 'ESSAY')
  })

  it('should not show Mark Complete button for completed tasks', () => {
    const completedTask = [
      {
        ...mockTasks[0],
        status: 'COMPLETE' as const,
      },
    ]

    render(<WeeklyTaskList tasks={completedTask} onMarkComplete={vi.fn()} />)

    expect(screen.queryByText('Mark Complete')).not.toBeInTheDocument()
  })

  it('should display task type icons', () => {
    const { container } = render(<WeeklyTaskList tasks={mockTasks} />)

    // Check for lucide icons (FileText, Mail, Upload)
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('should display total task count in header', () => {
    render(<WeeklyTaskList tasks={mockTasks} />)

    expect(screen.getByText(/This Week's Tasks \(3\)/)).toBeInTheDocument()
  })

  it('should use singular "day" for 1 day until due', () => {
    const taskDueTomorrow = [
      {
        ...mockTasks[0],
        daysUntil: 1,
      },
    ]

    render(<WeeklyTaskList tasks={taskDueTomorrow} />)

    expect(screen.getByText(/Due in 1 day/)).toBeInTheDocument()
  })
})
