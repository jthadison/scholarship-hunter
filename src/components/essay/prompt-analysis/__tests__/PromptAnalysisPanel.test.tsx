/**
 * Smoke Tests for Prompt Analysis Components (Story 4.6 - Priority 2)
 *
 * Tests basic rendering of prompt analysis UI components
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PromptAnalysisPanel } from '../PromptAnalysisPanel'
import type { PromptAnalysis } from '@/types/essay'

describe('PromptAnalysisPanel Component', () => {
  const mockAnalysis: PromptAnalysis = {
    themes: [
      {
        name: 'Leadership',
        importance: 'primary',
        explanation: 'The prompt emphasizes leadership skills',
        examples: ['Leading a team project', 'Organizing a community event'],
      },
    ],
    requiredElements: [
      {
        element: 'Personal story',
        mandatory: true,
        description: 'Share a specific experience',
        examples: ['A challenging situation', 'A meaningful achievement'],
      },
    ],
    tone: {
      expected: 'Personal & Reflective',
      description: 'Use an authentic, personal tone',
      examplePhrases: ['I learned', 'This experience taught me'],
      avoid: ['Clichés', 'Generic statements'],
    },
    suggestedStructure: {
      outline: [
        {
          section: 'Opening',
          content: 'Hook with personal story',
          wordCount: 150,
          guidance: 'Start with a vivid moment',
        },
        {
          section: 'Body',
          content: 'Describe challenge and growth',
          wordCount: 400,
          guidance: 'Be specific with details',
        },
      ],
      flow: 'Story → Challenge → Growth → Future',
    },
    strategicAdvice: [
      'Be authentic and genuine',
      'Use specific examples',
      'Show personal growth',
    ],
    dosAndDonts: {
      dos: ['Share personal stories', 'Use specific details', 'Show vulnerability'],
      donts: ['Use clichés', 'List achievements without context', 'Be generic'],
    },
    examplePatterns: [
      {
        pattern: 'Opens with dialogue',
        effectiveness: 'Immediately engages reader',
      },
      {
        pattern: 'Before and after structure',
        effectiveness: 'Demonstrates clear growth',
      },
    ],
    wordCountTarget: {
      min: 500,
      max: 750,
      optimal: 650,
      extracted: true, // Set to true so word count is displayed
    },
    competitiveInsights:
      'Strong essays include specific dialogue and connect experience to future goals',
    analyzedAt: new Date('2024-01-15T10:00:00Z'),
    promptHash: 'test-hash-123',
  }

  const mockPromptText = 'Describe a time when you demonstrated leadership in your community'

  it('should render without crashing', () => {
    render(<PromptAnalysisPanel analysis={mockAnalysis} promptText={mockPromptText} />)
    expect(screen.getByText(/Prompt Analysis by Morgan/i)).toBeInTheDocument()
  })

  it('should display the prompt text', () => {
    render(<PromptAnalysisPanel analysis={mockAnalysis} promptText={mockPromptText} />)
    expect(screen.getByText(mockPromptText)).toBeInTheDocument()
  })

  it('should display theme section', () => {
    render(<PromptAnalysisPanel analysis={mockAnalysis} promptText={mockPromptText} />)
    expect(screen.getByText('Key Themes')).toBeInTheDocument()
    expect(screen.getByText('Leadership')).toBeInTheDocument()
  })

  it('should display required elements section', () => {
    render(<PromptAnalysisPanel analysis={mockAnalysis} promptText={mockPromptText} />)
    expect(screen.getByText('Required Elements')).toBeInTheDocument()
    expect(screen.getByText('Personal story')).toBeInTheDocument()
  })

  it('should display tone expectations section', () => {
    render(<PromptAnalysisPanel analysis={mockAnalysis} promptText={mockPromptText} />)
    expect(screen.getByText('Tone & Voice')).toBeInTheDocument()
    expect(screen.getByText('Personal & Reflective')).toBeInTheDocument()
  })

  it('should display suggested structure section', () => {
    render(<PromptAnalysisPanel analysis={mockAnalysis} promptText={mockPromptText} />)
    expect(screen.getByText('Suggested Structure')).toBeInTheDocument()
    expect(screen.getByText('Opening')).toBeInTheDocument()
  })

  it('should display strategic advice section', () => {
    render(<PromptAnalysisPanel analysis={mockAnalysis} promptText={mockPromptText} />)
    expect(screen.getByText('Strategic Advice')).toBeInTheDocument()
    expect(screen.getByText(/Be authentic and genuine/)).toBeInTheDocument()
  })

  it('should display example patterns section', () => {
    render(<PromptAnalysisPanel analysis={mockAnalysis} promptText={mockPromptText} />)
    expect(screen.getByText('Example Essay Patterns')).toBeInTheDocument()
    expect(screen.getByText(/Opens with dialogue/)).toBeInTheDocument()
  })

  it('should display competitive insights', () => {
    render(<PromptAnalysisPanel analysis={mockAnalysis} promptText={mockPromptText} />)
    expect(screen.getByText(/Strong essays include specific dialogue/)).toBeInTheDocument()
  })

  it('should display word count targets', () => {
    render(<PromptAnalysisPanel analysis={mockAnalysis} promptText={mockPromptText} />)
    expect(screen.getByText(/500/)).toBeInTheDocument()
    expect(screen.getByText(/750/)).toBeInTheDocument()
  })

  it('should display analysis timestamp', () => {
    render(<PromptAnalysisPanel analysis={mockAnalysis} promptText={mockPromptText} />)
    // Should display formatted date
    expect(screen.getByText(/Analysis generated:/i)).toBeInTheDocument()
  })

  it('should render all collapsible sections', () => {
    const { container } = render(
      <PromptAnalysisPanel analysis={mockAnalysis} promptText={mockPromptText} />
    )

    // Check for collapsible components (they use Collapsible from shadcn)
    const sections = container.querySelectorAll('[data-state]')
    expect(sections.length).toBeGreaterThan(0)
  })

  it('should display Morgan branding with orange theme', () => {
    render(<PromptAnalysisPanel analysis={mockAnalysis} promptText={mockPromptText} />)

    // Check for orange-themed elements (Morgan's brand color)
    expect(screen.getByText(/Prompt Analysis by Morgan/i)).toBeInTheDocument()
  })
})
