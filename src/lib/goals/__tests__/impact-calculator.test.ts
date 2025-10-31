/**
 * Impact Calculator Tests
 *
 * Unit tests for goal impact calculation formulas and validation logic.
 *
 * Story 5.4: Profile Improvement Tracker (Task 9)
 * @module lib/goals/__tests__/impact-calculator.test
 */

import { describe, it, expect } from 'vitest'
import { GoalType } from '@prisma/client'
import {
  calculateGoalImpact,
  validateGoalValues,
  getSuggestedTimeline,
  getGoalTypeDisplayName,
  getGoalValueUnit,
  getImpactDescription,
} from '../impact-calculator'

describe('calculateGoalImpact', () => {
  describe('GPA_IMPROVEMENT', () => {
    it('should calculate impact for 0.1 GPA increase as 5 points', () => {
      const impact = calculateGoalImpact(GoalType.GPA_IMPROVEMENT, 3.5, 3.4)
      expect(impact).toBeCloseTo(5, 1) // 0.1 * 50 = 5 (handle floating point)
    })

    it('should calculate impact for 0.5 GPA increase as 25 points', () => {
      const impact = calculateGoalImpact(GoalType.GPA_IMPROVEMENT, 3.5, 3.0)
      expect(impact).toBe(25) // 0.5 * 50 = 25
    })

    it('should calculate impact from 0 when no current value provided', () => {
      const impact = calculateGoalImpact(GoalType.GPA_IMPROVEMENT, 3.5, 0)
      expect(impact).toBe(175) // 3.5 * 50 = 175
    })
  })

  describe('VOLUNTEER_HOURS', () => {
    it('should calculate impact for 100 hours as 5 points', () => {
      const impact = calculateGoalImpact(GoalType.VOLUNTEER_HOURS, 100, 0)
      expect(impact).toBe(5) // 100 / 20 = 5
    })

    it('should calculate impact for 50 additional hours', () => {
      const impact = calculateGoalImpact(GoalType.VOLUNTEER_HOURS, 150, 100)
      expect(impact).toBe(2.5) // 50 / 20 = 2.5
    })

    it('should calculate impact for 200 hours as 10 points', () => {
      const impact = calculateGoalImpact(GoalType.VOLUNTEER_HOURS, 200, 0)
      expect(impact).toBe(10) // 200 / 20 = 10
    })
  })

  describe('LEADERSHIP_POSITION', () => {
    it('should return fixed impact of 12 points per position', () => {
      const impact = calculateGoalImpact(GoalType.LEADERSHIP_POSITION, 1, 0)
      expect(impact).toBe(12) // 1 * 12 = 12
    })

    it('should calculate impact for multiple positions', () => {
      const impact = calculateGoalImpact(GoalType.LEADERSHIP_POSITION, 3, 1)
      expect(impact).toBe(24) // 2 * 12 = 24
    })
  })

  describe('TEST_SCORE', () => {
    it('should calculate impact for 100 point SAT increase as 5 points', () => {
      const impact = calculateGoalImpact(GoalType.TEST_SCORE, 1500, 1400)
      expect(impact).toBe(5) // 100 / 20 = 5
    })

    it('should calculate impact for 200 point increase as 10 points', () => {
      const impact = calculateGoalImpact(GoalType.TEST_SCORE, 1600, 1400)
      expect(impact).toBe(10) // 200 / 20 = 10
    })
  })

  describe('EXTRACURRICULAR', () => {
    it('should return fixed impact of 8 points per activity', () => {
      const impact = calculateGoalImpact(GoalType.EXTRACURRICULAR, 2, 0)
      expect(impact).toBe(16) // 2 * 8 = 16
    })

    it('should calculate impact for additional activities', () => {
      const impact = calculateGoalImpact(GoalType.EXTRACURRICULAR, 5, 3)
      expect(impact).toBe(16) // 2 * 8 = 16
    })
  })

  describe('CUSTOM', () => {
    it('should return 0 for custom goals', () => {
      const impact = calculateGoalImpact(GoalType.CUSTOM, 100, 0)
      expect(impact).toBe(0)
    })
  })
})

describe('validateGoalValues', () => {
  describe('General validation', () => {
    it('should reject target equal to current value', () => {
      const result = validateGoalValues(GoalType.VOLUNTEER_HOURS, 100, 100)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('greater than current')
    })

    it('should reject target less than current value', () => {
      const result = validateGoalValues(GoalType.VOLUNTEER_HOURS, 50, 100)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('greater than current')
    })

    it('should accept target greater than current value', () => {
      const result = validateGoalValues(GoalType.VOLUNTEER_HOURS, 150, 100)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('GPA_IMPROVEMENT validation', () => {
    it('should reject GPA > 4.0', () => {
      const result = validateGoalValues(GoalType.GPA_IMPROVEMENT, 4.5, 3.0)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('4.0')
    })

    it('should reject negative GPA', () => {
      const result = validateGoalValues(GoalType.GPA_IMPROVEMENT, 3.5, -1)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('negative')
    })

    it('should accept valid GPA range', () => {
      const result = validateGoalValues(GoalType.GPA_IMPROVEMENT, 3.8, 3.2)
      expect(result.isValid).toBe(true)
    })
  })

  describe('VOLUNTEER_HOURS validation', () => {
    it('should reject negative hours', () => {
      const result = validateGoalValues(GoalType.VOLUNTEER_HOURS, 100, -10)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('negative')
    })

    it('should reject unrealistic hours (>10,000)', () => {
      const result = validateGoalValues(GoalType.VOLUNTEER_HOURS, 15000, 0)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('unrealistic')
    })

    it('should accept valid hour range', () => {
      const result = validateGoalValues(GoalType.VOLUNTEER_HOURS, 150, 50)
      expect(result.isValid).toBe(true)
    })
  })

  describe('TEST_SCORE validation', () => {
    it('should reject score > 1600 (SAT max)', () => {
      const result = validateGoalValues(GoalType.TEST_SCORE, 1700, 1400)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('1600')
    })

    it('should reject negative scores', () => {
      const result = validateGoalValues(GoalType.TEST_SCORE, 1500, -100)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('negative')
    })

    it('should accept valid SAT range', () => {
      const result = validateGoalValues(GoalType.TEST_SCORE, 1500, 1200)
      expect(result.isValid).toBe(true)
    })
  })

  describe('LEADERSHIP_POSITION and EXTRACURRICULAR validation', () => {
    it('should reject negative counts', () => {
      const result = validateGoalValues(GoalType.LEADERSHIP_POSITION, 3, -1)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('negative')
    })

    it('should reject unrealistic counts (>20)', () => {
      const result = validateGoalValues(GoalType.EXTRACURRICULAR, 25, 5)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('unrealistic')
    })

    it('should accept valid counts', () => {
      const result = validateGoalValues(GoalType.LEADERSHIP_POSITION, 3, 1)
      expect(result.isValid).toBe(true)
    })
  })
})

describe('getSuggestedTimeline', () => {
  it('should suggest 4+ months for 0.1 GPA improvement', () => {
    const months = getSuggestedTimeline(GoalType.GPA_IMPROVEMENT, 3.5, 3.4)
    expect(months).toBeGreaterThanOrEqual(4)
  })

  it('should suggest appropriate timeline for volunteer hours', () => {
    const months = getSuggestedTimeline(GoalType.VOLUNTEER_HOURS, 100, 0)
    expect(months).toBeGreaterThanOrEqual(2)
  })

  it('should suggest 5 months per leadership position', () => {
    const months = getSuggestedTimeline(GoalType.LEADERSHIP_POSITION, 2, 1)
    expect(months).toBe(5) // 1 position * 5 months
  })

  it('should suggest appropriate timeline for test score improvements', () => {
    const months = getSuggestedTimeline(GoalType.TEST_SCORE, 1500, 1400)
    expect(months).toBeGreaterThanOrEqual(2)
    expect(months).toBeLessThanOrEqual(6)
  })

  it('should suggest 6 months for custom goals', () => {
    const months = getSuggestedTimeline(GoalType.CUSTOM, 100, 0)
    expect(months).toBe(6)
  })
})

describe('getGoalTypeDisplayName', () => {
  it('should return correct display names', () => {
    expect(getGoalTypeDisplayName(GoalType.GPA_IMPROVEMENT)).toBe('GPA Improvement')
    expect(getGoalTypeDisplayName(GoalType.VOLUNTEER_HOURS)).toBe('Volunteer Hours')
    expect(getGoalTypeDisplayName(GoalType.LEADERSHIP_POSITION)).toBe('Leadership Position')
    expect(getGoalTypeDisplayName(GoalType.TEST_SCORE)).toBe('Test Score')
    expect(getGoalTypeDisplayName(GoalType.EXTRACURRICULAR)).toBe('Extracurricular Activity')
    expect(getGoalTypeDisplayName(GoalType.CUSTOM)).toBe('Custom Goal')
  })
})

describe('getGoalValueUnit', () => {
  it('should return correct units', () => {
    expect(getGoalValueUnit(GoalType.GPA_IMPROVEMENT)).toBe('GPA')
    expect(getGoalValueUnit(GoalType.VOLUNTEER_HOURS)).toBe('hours')
    expect(getGoalValueUnit(GoalType.LEADERSHIP_POSITION)).toBe('positions')
    expect(getGoalValueUnit(GoalType.TEST_SCORE)).toBe('points')
    expect(getGoalValueUnit(GoalType.EXTRACURRICULAR)).toBe('activities')
    expect(getGoalValueUnit(GoalType.CUSTOM)).toBe('units')
  })
})

describe('getImpactDescription', () => {
  it('should return description for positive impact', () => {
    const description = getImpactDescription(GoalType.GPA_IMPROVEMENT, 10)
    expect(description).toContain('10 points')
    expect(description).toContain('GPA')
  })

  it('should handle singular point', () => {
    const description = getImpactDescription(GoalType.VOLUNTEER_HOURS, 1)
    expect(description).toContain('1 point')
  })

  it('should return custom message for zero impact', () => {
    const description = getImpactDescription(GoalType.CUSTOM, 0)
    expect(description).toContain('varies')
  })

  it('should round impact values', () => {
    const description = getImpactDescription(GoalType.VOLUNTEER_HOURS, 7.8)
    expect(description).toContain('8 points')
  })
})
