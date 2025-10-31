// ============================================================================
// Story 5.3: Improvement Roadmap Generator
// ============================================================================

import type { Profile } from '@prisma/client'
import type { Gap, Recommendation, Roadmap, ResourceLink } from './types'
import { getAchievabilityPriority } from './achievability'

/**
 * Generate improvement roadmap from gaps
 *
 * Creates actionable recommendations with specific steps, timelines,
 * and resources. Sequences recommendations for optimal execution
 * (EASY wins first for motivation, then MODERATE, then LONG_TERM).
 *
 * @param gaps - All identified gaps
 * @param profile - Student profile (for personalization)
 * @returns Complete roadmap with sequenced recommendations
 */
export function generateRoadmap(gaps: Gap[], profile: Profile): Roadmap {
  // Generate individual recommendations for each gap
  const recommendations = gaps.map((gap) => generateRecommendation(gap, profile))

  // Group by achievability
  const easy = recommendations.filter((r) => r.gap.achievability === 'EASY')
  const moderate = recommendations.filter((r) => r.gap.achievability === 'MODERATE')
  const longTerm = recommendations.filter((r) => r.gap.achievability === 'LONG_TERM')

  // Calculate total timeline (assumes parallel work on some items)
  const totalTimelineMonths = calculateTotalTimeline(recommendations)

  // Create recommended sequence (EASY first, then MODERATE, then LONG_TERM)
  const recommendedSequence = sequenceRecommendations(recommendations)

  // Validate feasibility
  validateRoadmapFeasibility(recommendations)

  return {
    easy,
    moderate,
    longTerm,
    totalTimelineMonths,
    recommendedSequence,
  }
}

/**
 * Generate a single recommendation from a gap
 */
function generateRecommendation(gap: Gap, profile: Profile): Recommendation {
  const { category, achievability, timelineMonths } = gap

  // Generate specific recommendation text
  const recommendation = generateRecommendationText(gap, profile)

  // Generate concrete action steps
  const actionSteps = generateActionSteps(gap, profile)

  // Calculate target completion date
  const targetDate = new Date()
  targetDate.setMonth(targetDate.getMonth() + timelineMonths)

  // Get timeline description
  const timeline = getTimelineDescription(achievability, timelineMonths)

  // Get relevant resources
  const resources = getResources(gap)

  // Identify dependencies
  const dependencies = identifyDependencies(gap, category)

  return {
    gap,
    recommendation,
    actionSteps,
    timeline,
    targetDate,
    resources,
    dependencies,
  }
}

/**
 * Generate specific recommendation text based on gap type
 */
function generateRecommendationText(gap: Gap, _profile: Profile): string {
  const { category, requirement } = gap

  if (category === 'academic') {
    if (requirement.includes('GPA')) {
      const target = gap.targetValue as number
      return `Focus on improving your GPA to ${target.toFixed(1)} through strategic course selection and academic support resources`
    } else if (requirement.includes('SAT')) {
      const target = gap.targetValue as number
      return `Prepare for SAT retake with goal of ${target}+ through structured test prep and practice exams`
    } else if (requirement.includes('ACT')) {
      const target = gap.targetValue as number
      return `Prepare for ACT retake with goal of ${target}+ through structured test prep and practice exams`
    }
  }

  if (category === 'experience') {
    if (requirement.includes('volunteer hours')) {
      const target = gap.targetValue as number
      const current = (gap.currentValue as number) || 0
      const needed = target - current
      return `Complete ${needed} additional volunteer hours by committing 4-6 hours per week to a cause you care about`
    } else if (requirement.includes('Leadership')) {
      return `Seek leadership position by running for officer role in 2 clubs you're already active in, or starting a new club`
    }
  }

  // Generic fallback
  return `Work toward achieving ${requirement} to unlock additional scholarship opportunities`
}

/**
 * Generate concrete action steps for a gap
 */
function generateActionSteps(gap: Gap, _profile: Profile): string[] {
  const { category, requirement } = gap

  if (category === 'academic') {
    if (requirement.includes('GPA')) {
      return [
        'Meet with academic advisor to identify GPA improvement strategies',
        'Focus on core courses in your major for grade improvement',
        'Utilize tutoring services and study groups',
        'Consider retaking courses where you earned C or below (if school policy allows)',
        'Maintain consistent study schedule (15-20 hours/week)',
      ]
    } else if (requirement.includes('SAT') || requirement.includes('ACT')) {
      return [
        'Register for next test date (aim for 2-3 months out)',
        'Complete full-length diagnostic practice test to identify weak areas',
        'Create structured study plan (20-30 hours total over 8-10 weeks)',
        'Use Khan Academy (SAT) or ACT.org resources for free practice',
        'Take at least 3 full-length timed practice tests before test day',
        'Consider test prep course if score gap is significant',
      ]
    }
  }

  if (category === 'experience') {
    if (requirement.includes('volunteer hours')) {
      return [
        'Research volunteer opportunities on VolunteerMatch.org or local nonprofits',
        'Select 1-2 organizations aligned with your interests/career goals',
        'Contact organizations to schedule regular weekly commitment',
        'Track hours using volunteer tracking app or spreadsheet',
        'Request letter of verification from organization supervisor',
      ]
    } else if (requirement.includes('Leadership')) {
      return [
        'Identify 2 clubs/organizations you are already involved in',
        'Express interest in officer positions to current leadership',
        'Prepare brief platform/goals statement for election',
        'Run for officer position in next election cycle',
        'Alternative: Start new club aligned with your passion and serve as founding president',
      ]
    }
  }

  // Generic fallback
  return [
    `Research specific requirements for ${requirement}`,
    'Create action plan with milestones',
    'Seek guidance from school counselor or mentor',
    'Track progress weekly',
  ]
}

/**
 * Get timeline description
 */
function getTimelineDescription(
  achievability: Gap['achievability'],
  months: number
): string {
  if (achievability === 'EASY') {
    return `${months} month${months > 1 ? 's' : ''} (Easy win - tackle first!)`
  } else if (achievability === 'MODERATE') {
    return `${months} month${months > 1 ? 's' : ''} (Moderate effort required)`
  } else {
    return `${months}+ month${months > 1 ? 's' : ''} (Long-term commitment)`
  }
}

/**
 * Get relevant resources for a gap
 */
function getResources(gap: Gap): ResourceLink[] {
  const { category, requirement } = gap
  const resources: ResourceLink[] = []

  if (category === 'academic') {
    if (requirement.includes('GPA')) {
      resources.push(
        {
          title: 'Study Skills Resources',
          url: 'https://learningcenter.unc.edu/tips-and-tools/studying-101-study-smarter-not-harder/',
          description: 'Evidence-based study strategies from UNC Learning Center',
        },
        {
          title: 'Time Management for Students',
          url: 'https://www.oxfordlearning.com/time-management-strategies-for-students/',
          description: 'Time management strategies to balance coursework',
        }
      )
    } else if (requirement.includes('SAT')) {
      resources.push(
        {
          title: 'Khan Academy SAT Prep (Free)',
          url: 'https://www.khanacademy.org/sat',
          description: 'Official SAT practice in partnership with College Board',
        },
        {
          title: 'College Board Practice Tests',
          url: 'https://satsuite.collegeboard.org/sat/practice-preparation',
          description: 'Official full-length SAT practice tests',
        }
      )
    } else if (requirement.includes('ACT')) {
      resources.push(
        {
          title: 'ACT Test Prep (Free)',
          url: 'https://www.act.org/content/act/en/products-and-services/the-act/test-preparation.html',
          description: 'Official ACT practice materials and resources',
        }
      )
    }
  }

  if (category === 'experience') {
    if (requirement.includes('volunteer hours')) {
      resources.push(
        {
          title: 'VolunteerMatch',
          url: 'https://www.volunteermatch.org/',
          description: 'Find local volunteer opportunities matched to your interests',
        },
        {
          title: 'DoSomething.org',
          url: 'https://www.dosomething.org/',
          description: 'Youth-focused volunteer campaigns and service projects',
        },
        {
          title: 'Local Food Banks & Nonprofits',
          url: 'https://www.feedingamerica.org/find-your-local-foodbank',
          description: 'Search for local food banks and community organizations',
        }
      )
    } else if (requirement.includes('Leadership')) {
      resources.push(
        {
          title: 'Leadership Skills Development',
          url: 'https://www.mindtools.com/pages/article/newLDR_41.htm',
          description: 'Essential leadership skills and how to develop them',
        },
        {
          title: 'Starting a School Club',
          url: 'https://www.wikihow.com/Start-a-Club',
          description: 'Step-by-step guide to starting a new club or organization',
        }
      )
    }
  }

  return resources
}

/**
 * Identify dependencies between gaps
 * Some gaps should be addressed before others
 */
function identifyDependencies(gap: Gap, category: string): string[] | undefined {
  const dependencies: string[] = []

  // Leadership positions often require existing club participation
  if (category === 'experience' && gap.requirement.includes('Leadership')) {
    dependencies.push('Join clubs/organizations first before running for officer positions')
  }

  // Very high volunteer hours may require establishing relationships first
  if (category === 'experience' && gap.requirement.includes('volunteer') && gap.gapSize > 100) {
    dependencies.push('Start with smaller volunteer commitment to find right fit')
  }

  return dependencies.length > 0 ? dependencies : undefined
}

/**
 * Sequence recommendations for optimal execution
 * Strategy: EASY wins first (motivation), then MODERATE, then LONG_TERM
 * Within each category, sort by impact (funding blocked)
 */
function sequenceRecommendations(recommendations: Recommendation[]): Recommendation[] {
  return recommendations.sort((a, b) => {
    // Primary sort: achievability (EASY before MODERATE before LONG_TERM)
    const priorityA = getAchievabilityPriority(a.gap.achievability)
    const priorityB = getAchievabilityPriority(b.gap.achievability)

    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }

    // Secondary sort: funding impact (descending)
    return b.gap.fundingBlocked - a.gap.fundingBlocked
  })
}

/**
 * Calculate total timeline assuming parallel work on some items
 * Not all recommendations need to be done sequentially
 */
function calculateTotalTimeline(recommendations: Recommendation[]): number {
  if (recommendations.length === 0) return 0

  // Assume students can work on multiple EASY and MODERATE items in parallel
  // but LONG_TERM items require sustained focus

  const easy = recommendations.filter((r) => r.gap.achievability === 'EASY')
  const moderate = recommendations.filter((r) => r.gap.achievability === 'MODERATE')
  const longTerm = recommendations.filter((r) => r.gap.achievability === 'LONG_TERM')

  const maxEasyTimeline = easy.length > 0
    ? Math.max(...easy.map((r) => r.gap.timelineMonths))
    : 0

  const maxModerateTimeline = moderate.length > 0
    ? Math.max(...moderate.map((r) => r.gap.timelineMonths))
    : 0

  const maxLongTermTimeline = longTerm.length > 0
    ? Math.max(...longTerm.map((r) => r.gap.timelineMonths))
    : 0

  // Assume EASY and MODERATE can overlap, but LONG_TERM is additive
  const parallelTimeline = Math.max(maxEasyTimeline, maxModerateTimeline)
  return parallelTimeline + maxLongTermTimeline
}

/**
 * Validate roadmap feasibility
 * Warn if student is trying to tackle too many long-term goals simultaneously
 */
function validateRoadmapFeasibility(recommendations: Recommendation[]): void {
  const longTermCount = recommendations.filter(
    (r) => r.gap.achievability === 'LONG_TERM'
  ).length

  if (longTermCount > 3) {
    console.warn(
      `[Roadmap] Student has ${longTermCount} long-term goals. Consider prioritizing top 2-3 for focus.`
    )
  }

  const totalCount = recommendations.length
  if (totalCount > 10) {
    console.warn(
      `[Roadmap] Student has ${totalCount} gaps to address. Consider focusing on highest-impact items first.`
    )
  }
}
