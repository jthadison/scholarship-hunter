/**
 * Unit tests for eligibility comparison logic
 *
 * Tests met/not met/partially met status determination
 * for various eligibility criteria types.
 */

import { describe, it, expect } from 'vitest'
import {
  compareEligibility,
  type EligibilityCriteria,
  type StudentProfile,
} from '@/server/lib/matching/compare-eligibility'

describe('compareEligibility', () => {
  const baseProfile: StudentProfile = {
    gpa: 3.7,
    gpaScale: 4.0,
    satScore: 1350,
    actScore: 30,
    classRank: 15,
    classSize: 200,
    graduationYear: 2025,
    gender: 'Female',
    ethnicity: ['Hispanic'],
    state: 'CA',
    citizenship: 'US Citizen',
    intendedMajor: 'Computer Science',
    fieldOfStudy: 'STEM',
    volunteerHours: 120,
    extracurriculars: [],
    leadershipRoles: [{ title: 'Club President', organization: 'Coding Club' }],
    financialNeed: 'HIGH',
    pellGrantEligible: true,
    firstGeneration: true,
    militaryAffiliation: null,
    disabilities: null,
  }

  describe('Academic Criteria', () => {
    it('should mark GPA as met when student exceeds requirement', () => {
      const criteria: EligibilityCriteria = {
        minGPA: 3.5,
        gpaScale: 4.0,
      }

      const results = compareEligibility(baseProfile, criteria)
      const gpaResult = results.find((r) => r.requirement.startsWith('GPA'))

      expect(gpaResult).toBeDefined()
      expect(gpaResult?.status).toBe('met')
      expect(gpaResult?.studentValue).toContain('3.7')
    })

    it('should mark GPA as not met when student below requirement', () => {
      const criteria: EligibilityCriteria = {
        minGPA: 3.9,
        gpaScale: 4.0,
      }

      const results = compareEligibility(baseProfile, criteria)
      const gpaResult = results.find((r) => r.requirement.startsWith('GPA'))

      expect(gpaResult?.status).toBe('not_met')
    })

    it('should mark SAT as met when student score meets requirement', () => {
      const criteria: EligibilityCriteria = {
        minSAT: 1300,
      }

      const results = compareEligibility(baseProfile, criteria)
      const satResult = results.find((r) => r.requirement.startsWith('SAT'))

      expect(satResult?.status).toBe('met')
      expect(satResult?.studentValue).toContain('1350')
    })

    it('should mark ACT as not met when student score below requirement', () => {
      const criteria: EligibilityCriteria = {
        minACT: 32,
      }

      const results = compareEligibility(baseProfile, criteria)
      const actResult = results.find((r) => r.requirement.startsWith('ACT'))

      expect(actResult?.status).toBe('not_met')
    })
  })

  describe('Demographic Criteria', () => {
    it('should mark gender as met when matches requirement', () => {
      const criteria: EligibilityCriteria = {
        gender: 'Female',
      }

      const results = compareEligibility(baseProfile, criteria)
      const genderResult = results.find((r) => r.requirement.startsWith('Gender'))

      expect(genderResult?.status).toBe('met')
    })

    it('should mark gender as not met when does not match', () => {
      const criteria: EligibilityCriteria = {
        gender: 'Male',
      }

      const results = compareEligibility(baseProfile, criteria)
      const genderResult = results.find((r) => r.requirement.startsWith('Gender'))

      expect(genderResult?.status).toBe('not_met')
    })

    it('should mark ethnicity as met when student matches any required ethnicity', () => {
      const criteria: EligibilityCriteria = {
        ethnicity: ['Hispanic', 'Latino'],
      }

      const results = compareEligibility(baseProfile, criteria)
      const ethnicityResult = results.find((r) => r.requirement.startsWith('Ethnicity'))

      expect(ethnicityResult?.status).toBe('met')
    })

    it('should mark state as met when student in allowed state', () => {
      const criteria: EligibilityCriteria = {
        state: ['CA', 'TX', 'NY'],
      }

      const results = compareEligibility(baseProfile, criteria)
      const stateResult = results.find((r) => r.requirement.startsWith('State'))

      expect(stateResult?.status).toBe('met')
    })
  })

  describe('Major/Field Criteria', () => {
    it('should mark major as met when student major matches', () => {
      const criteria: EligibilityCriteria = {
        intendedMajor: ['Computer Science', 'Software Engineering'],
      }

      const results = compareEligibility(baseProfile, criteria)
      const majorResult = results.find((r) => r.requirement.startsWith('Major'))

      expect(majorResult?.status).toBe('met')
    })

    it('should mark field of study as met when matches STEM', () => {
      const criteria: EligibilityCriteria = {
        fieldOfStudy: 'STEM',
      }

      const results = compareEligibility(baseProfile, criteria)
      const fieldResult = results.find((r) => r.requirement.startsWith('Field'))

      expect(fieldResult?.status).toBe('met')
    })
  })

  describe('Experience Criteria', () => {
    it('should mark volunteer hours as met when student exceeds requirement', () => {
      const criteria: EligibilityCriteria = {
        minVolunteerHours: 100,
      }

      const results = compareEligibility(baseProfile, criteria)
      const volunteerResult = results.find((r) => r.requirement.includes('Volunteer'))

      expect(volunteerResult?.status).toBe('met')
      expect(volunteerResult?.studentValue).toContain('120')
    })

    it('should mark volunteer hours as partially met when 70-99% of requirement', () => {
      const criteria: EligibilityCriteria = {
        minVolunteerHours: 150,
      }

      const results = compareEligibility(baseProfile, criteria)
      const volunteerResult = results.find((r) => r.requirement.includes('Volunteer'))

      expect(volunteerResult?.status).toBe('partially_met')
      expect(volunteerResult?.partialPercentage).toBeCloseTo(80, 0)
    })

    it('should mark volunteer hours as not met when below 70% of requirement', () => {
      const criteria: EligibilityCriteria = {
        minVolunteerHours: 200,
      }

      const results = compareEligibility(baseProfile, criteria)
      const volunteerResult = results.find((r) => r.requirement.includes('Volunteer'))

      expect(volunteerResult?.status).toBe('not_met')
    })

    it('should mark leadership as met when student has leadership roles', () => {
      const criteria: EligibilityCriteria = {
        leadershipRequired: true,
      }

      const results = compareEligibility(baseProfile, criteria)
      const leadershipResult = results.find((r) => r.requirement.includes('Leadership'))

      expect(leadershipResult?.status).toBe('met')
    })
  })

  describe('Financial Criteria', () => {
    it('should mark financial need as met when matches requirement', () => {
      const criteria: EligibilityCriteria = {
        financialNeed: ['HIGH', 'VERY_HIGH'],
      }

      const results = compareEligibility(baseProfile, criteria)
      const needResult = results.find((r) => r.requirement.includes('Financial Need'))

      expect(needResult?.status).toBe('met')
    })

    it('should mark Pell Grant as met when student is eligible', () => {
      const criteria: EligibilityCriteria = {
        pellGrantRequired: true,
      }

      const results = compareEligibility(baseProfile, criteria)
      const pellResult = results.find((r) => r.requirement.includes('Pell Grant'))

      expect(pellResult?.status).toBe('met')
    })
  })

  describe('Special Criteria', () => {
    it('should mark first generation as met when student is first gen', () => {
      const criteria: EligibilityCriteria = {
        firstGenerationRequired: true,
      }

      const results = compareEligibility(baseProfile, criteria)
      const firstGenResult = results.find((r) => r.requirement.includes('First-generation'))

      expect(firstGenResult?.status).toBe('met')
    })

    it('should mark military affiliation as not met when student has no affiliation', () => {
      const criteria: EligibilityCriteria = {
        militaryAffiliation: ['Veteran', 'Active Duty'],
      }

      const results = compareEligibility(baseProfile, criteria)
      const militaryResult = results.find((r) => r.requirement.includes('Military'))

      expect(militaryResult?.status).toBe('not_met')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing student data as not met', () => {
      const incompleteProfile: StudentProfile = {
        gpa: null,
        satScore: null,
        volunteerHours: 0,
      }

      const criteria: EligibilityCriteria = {
        minGPA: 3.5,
        minSAT: 1300,
        minVolunteerHours: 50,
      }

      const results = compareEligibility(incompleteProfile, criteria)

      expect(results.every((r) => r.status === 'not_met')).toBe(true)
    })

    it('should handle empty criteria gracefully', () => {
      const criteria: EligibilityCriteria = {}

      const results = compareEligibility(baseProfile, criteria)

      expect(results).toHaveLength(0)
    })

    it('should return multiple criteria results', () => {
      const criteria: EligibilityCriteria = {
        minGPA: 3.5,
        minSAT: 1300,
        gender: 'Female',
        intendedMajor: 'Computer Science',
        firstGenerationRequired: true,
      }

      const results = compareEligibility(baseProfile, criteria)

      expect(results.length).toBe(5)
      expect(results.every((r) => r.status === 'met')).toBe(true)
    })
  })
})
