/**
 * Integration Tests for Quinn Dashboard (Story 3.6)
 *
 * Tests complete Quinn dashboard functionality including:
 * - Weekly tasks display (AC#1)
 * - Workload visualization (AC#2)
 * - Conflict warnings (AC#3)
 * - Capacity suggestions (AC#4)
 * - Calendar export (AC#5)
 * - Quinn persona (AC#6)
 * - Mobile responsiveness (AC#7)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QuinnDashboard } from '@/modules/quinn/components/QuinnDashboard'
import { addDays } from 'date-fns'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock tRPC
const mockTasks = [
  {
    id: 'task-1',
    type: 'ESSAY' as const,
    applicationId: 'app-1',
    scholarshipName: 'Women in STEM',
    title: 'Draft 500-word essay',
    description: 'Essay required',
    dueDate: addDays(new Date(), 2),
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
    dueDate: addDays(new Date(), 5),
    daysUntil: 5,
    urgency: 'UPCOMING' as const,
    estimatedHours: 1,
    status: 'NOT_STARTED' as const,
  },
]

const mockWorkloadData = {
  totalHours: 12,
  breakdown: [
    {
      applicationId: 'app-1',
      scholarshipName: 'Women in STEM',
      hours: 10,
      priorityTier: 'MUST_APPLY' as const,
    },
    {
      applicationId: 'app-2',
      scholarshipName: 'Tech Leaders',
      hours: 2,
      priorityTier: 'SHOULD_APPLY' as const,
    },
  ],
  status: 'MODERATE' as const,
  message: '⚡ Moderate workload - stay focused',
  weekStart: new Date(),
  weekEnd: addDays(new Date(), 7),
}

const mockConflictsData = {
  hasConflicts: false,
  conflictedWeeks: [],
  totalConflictedApplications: 0,
}

const mockCapacityData = {
  hasCapacity: false,
  currentWeeklyHours: 12,
  suggestedApplication: null,
}

const mockCalendarData = [
  {
    applicationId: 'app-1',
    scholarshipName: 'Women in STEM',
    awardAmount: 5000,
    deadline: addDays(new Date(), 30),
    priorityTier: 'MUST_APPLY' as const,
    status: 'TODO' as const,
    timeline: {
      startEssayDate: addDays(new Date(), 2),
      requestRecsDate: addDays(new Date(), 5),
      uploadDocsDate: addDays(new Date(), 10),
      finalReviewDate: addDays(new Date(), 12),
      submitDate: addDays(new Date(), 14),
      estimatedHours: 10,
      hasConflicts: false,
    },
  },
]

vi.mock('@/shared/lib/trpc', () => ({
  trpc: {
    auth: {
      getSession: {
        useQuery: () => ({
          data: { student: { id: 'student-123' } },
          isLoading: false,
        }),
      },
    },
    quinn: {
      getWeeklyTasks: {
        useQuery: () => ({
          data: mockTasks,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        }),
      },
      getWorkloadSummary: {
        useQuery: () => ({
          data: mockWorkloadData,
          isLoading: false,
        }),
      },
      getCapacitySuggestion: {
        useQuery: () => ({
          data: mockCapacityData,
          isLoading: false,
        }),
      },
      markTaskComplete: {
        useMutation: () => ({
          mutate: vi.fn(),
        }),
      },
    },
    timeline: {
      detectConflicts: {
        useQuery: () => ({
          data: mockConflictsData,
          isLoading: false,
        }),
      },
      getCalendarView: {
        useQuery: () => ({
          data: mockCalendarData,
          isLoading: false,
        }),
      },
    },
    application: {
      updateStatus: {
        useMutation: () => ({
          mutate: vi.fn(),
        }),
      },
    },
  },
}))

// Mock toast
vi.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('Quinn Dashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC#1: Weekly Tasks Display', () => {
    it('should display this week\'s tasks section', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        expect(screen.getByText(/This Week's Tasks/)).toBeInTheDocument()
      })
    })

    it('should display tasks with scholarship names and details', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        expect(screen.getByText('Draft 500-word essay')).toBeInTheDocument()
        expect(screen.getByText('Women in STEM')).toBeInTheDocument()
        expect(screen.getByText('Request 2 recommendations')).toBeInTheDocument()
        expect(screen.getByText('Tech Leaders')).toBeInTheDocument()
      })
    })

    it('should organize tasks by urgency', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        expect(screen.getByText(/Critical/i)).toBeInTheDocument()
        expect(screen.getByText(/Upcoming/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC#2: Workload Visualization', () => {
    it('should display total hours scheduled', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        expect(screen.getByText('12h')).toBeInTheDocument()
        expect(screen.getByText(/scheduled this week/)).toBeInTheDocument()
      })
    })

    it('should display breakdown by application', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        expect(screen.getByText('Women in STEM')).toBeInTheDocument()
        expect(screen.getByText('10h')).toBeInTheDocument()
        expect(screen.getByText('Tech Leaders')).toBeInTheDocument()
        expect(screen.getByText('2h')).toBeInTheDocument()
      })
    })

    it('should display workload status message', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        expect(screen.getByText(/Moderate workload - stay focused/)).toBeInTheDocument()
      })
    })
  })

  describe('AC#3: Conflict Warnings', () => {
    it('should not display conflicts when none exist', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        expect(screen.queryByText(/Warning:/)).not.toBeInTheDocument()
      })
    })
  })

  describe('AC#4: Capacity Suggestions', () => {
    it('should not display suggestions when no capacity', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        expect(screen.queryByText(/You Have Capacity/)).not.toBeInTheDocument()
      })
    })
  })

  describe('AC#5: Calendar Export', () => {
    it('should display calendar export section', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        expect(screen.getByText('Calendar Export')).toBeInTheDocument()
      })
    })

    it('should display export button', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        expect(screen.getByText(/Export to Calendar/)).toBeInTheDocument()
      })
    })
  })

  describe('AC#6: Quinn Persona', () => {
    it('should display Quinn greeting with teal theme', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        expect(screen.getByText(/Hi Sarah!/)).toBeInTheDocument()
        expect(screen.getByText(/I'm Quinn, your timeline coordinator/)).toBeInTheDocument()
      })
    })

    it('should display Quinn avatar', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        // Check for avatar fallback
        expect(screen.getByText('Q')).toBeInTheDocument()
      })
    })

    it('should use organized, proactive language', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        // Quinn uses action-oriented language
        const text = screen.getByText(/solid week|stay focused|prioritize/i)
        expect(text).toBeInTheDocument()
      })
    })
  })

  describe('AC#7: Mobile Responsiveness', () => {
    it('should render dashboard layout', async () => {
      const { container } = render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        // Check for responsive grid layout
        const grid = container.querySelector('.grid')
        expect(grid).toBeInTheDocument()
      })
    })

    it('should display quick action buttons', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        const markCompleteButtons = screen.getAllByText('Mark Complete')
        expect(markCompleteButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Complete Dashboard Flow', () => {
    it('should display all major sections', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        // Header
        expect(screen.getByText(/Hi Sarah!/)).toBeInTheDocument()

        // Tasks
        expect(screen.getByText(/This Week's Tasks/)).toBeInTheDocument()

        // Workload
        expect(screen.getByText('Weekly Workload')).toBeInTheDocument()

        // Calendar Export
        expect(screen.getByText('Calendar Export')).toBeInTheDocument()
      })
    })

    it('should display task and hour counts in header', async () => {
      render(<QuinnDashboard firstName="Sarah" />)

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument() // 2 tasks
        expect(screen.getByText('12h')).toBeInTheDocument() // 12 hours
      })
    })
  })

  describe('Loading States', () => {
    it('should display loading skeleton initially', () => {
      // Override mocks to show loading state
      vi.mock('@/shared/lib/trpc', () => ({
        trpc: {
          auth: {
            getSession: {
              useQuery: () => ({
                data: null,
                isLoading: true,
              }),
            },
          },
          quinn: {
            getWeeklyTasks: {
              useQuery: () => ({
                data: null,
                isLoading: true,
                error: null,
                refetch: vi.fn(),
              }),
            },
          },
        },
      }))

      const { container } = render(<QuinnDashboard firstName="Sarah" />)

      // Should show loading skeletons
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })
})
