/**
 * Unit Tests for QuinnHeader Component (Story 3.6 - AC#6)
 *
 * Tests Quinn persona with teal branding and organized personality
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuinnHeader } from '@/modules/quinn/components/QuinnHeader'

describe('QuinnHeader Component', () => {
  it('should display personalized greeting with student name', () => {
    render(<QuinnHeader firstName="Sarah" tasksThisWeek={5} totalHoursScheduled={12} />)

    expect(screen.getByText(/Hi Sarah!/)).toBeInTheDocument()
    expect(screen.getByText(/I'm Quinn, your timeline coordinator/)).toBeInTheDocument()
  })

  it('should display task count for the week', () => {
    render(<QuinnHeader firstName="John" tasksThisWeek={5} totalHoursScheduled={12} />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText(/tasks this week/)).toBeInTheDocument()
  })

  it('should display total hours scheduled', () => {
    render(<QuinnHeader firstName="Sarah" tasksThisWeek={5} totalHoursScheduled={12} />)

    expect(screen.getByText('12h')).toBeInTheDocument()
    expect(screen.getByText(/scheduled/)).toBeInTheDocument()
  })

  it('should use singular "task" for 1 task', () => {
    render(<QuinnHeader firstName="Sarah" tasksThisWeek={1} totalHoursScheduled={3} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText(/task this week/)).toBeInTheDocument()
  })

  it('should display "No tasks" when tasksThisWeek is 0', () => {
    render(<QuinnHeader firstName="Sarah" tasksThisWeek={0} totalHoursScheduled={0} />)

    expect(screen.getByText(/No tasks this week/)).toBeInTheDocument()
  })

  it('should display encouraging greeting when all caught up', () => {
    render(<QuinnHeader firstName="Sarah" tasksThisWeek={0} totalHoursScheduled={0} />)

    expect(screen.getByText(/You're all caught up!/)).toBeInTheDocument()
  })

  it('should display proactive greeting for light workload', () => {
    render(<QuinnHeader firstName="John" tasksThisWeek={3} totalHoursScheduled={8} />)

    expect(screen.getByText(/Let's keep you on track this week/)).toBeInTheDocument()
  })

  it('should display focused greeting for moderate workload', () => {
    render(<QuinnHeader firstName="John" tasksThisWeek={5} totalHoursScheduled={12} />)

    expect(screen.getByText(/You've got a solid week ahead/)).toBeInTheDocument()
  })

  it('should display priority greeting for heavy workload', () => {
    render(<QuinnHeader firstName="John" tasksThisWeek={8} totalHoursScheduled={18} />)

    expect(screen.getByText(/This is a heavy week/)).toBeInTheDocument()
    expect(screen.getByText(/let's prioritize together/)).toBeInTheDocument()
  })

  it('should display Quinn avatar with teal theme', () => {
    const { container } = render(<QuinnHeader firstName="Sarah" tasksThisWeek={5} totalHoursScheduled={12} />)

    // Check for Avatar component (may use img or fallback)
    const avatar = container.querySelector('img')
    if (avatar) {
      expect(avatar).toHaveAttribute('src', '/agents/quinn.svg')
      expect(avatar).toHaveAttribute('alt', 'Quinn - Your Timeline Coordinator')
    } else {
      // Fallback is shown
      expect(screen.getByText('Q')).toBeInTheDocument()
    }
  })

  it('should display fallback avatar text when image fails', () => {
    render(<QuinnHeader firstName="Sarah" tasksThisWeek={5} totalHoursScheduled={12} />)

    // Fallback text should be in DOM
    expect(screen.getByText('Q')).toBeInTheDocument()
  })

  it('should use teal/cyan color scheme (AC#6)', () => {
    const { container } = render(<QuinnHeader firstName="Sarah" tasksThisWeek={5} totalHoursScheduled={12} />)

    // Check for cyan/teal styling classes
    const card = container.querySelector('.from-cyan-50')
    expect(card).toBeInTheDocument()
  })

  it('should display organized personality through language', () => {
    render(<QuinnHeader firstName="Sarah" tasksThisWeek={5} totalHoursScheduled={12} />)

    // Quinn uses action-oriented language
    expect(screen.getByText(/Let's|solid|stay focused|prioritize/i)).toBeInTheDocument()
  })
})
