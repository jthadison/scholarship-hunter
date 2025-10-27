/**
 * Eligibility Comparison Utility
 *
 * Compares student profile against scholarship eligibility criteria
 * to determine met/not met/partially met status for each criterion.
 *
 * @module server/lib/matching/compare-eligibility
 */

export type EligibilityStatus = 'met' | 'not_met' | 'partially_met'

export interface EligibilityResult {
  category: 'Academic' | 'Demographic' | 'Major/Field' | 'Experience' | 'Financial' | 'Special'
  requirement: string
  studentValue: string
  status: EligibilityStatus
  partialPercentage?: number
}

export interface EligibilityCriteria {
  // Academic
  minGPA?: number
  gpaScale?: number
  minSAT?: number
  minACT?: number
  minClassRank?: number
  graduationYear?: number | number[]

  // Demographic
  gender?: string | string[]
  ethnicity?: string | string[]
  state?: string | string[]
  citizenship?: string | string[]

  // Major/Field
  intendedMajor?: string | string[]
  fieldOfStudy?: string | string[]

  // Experience
  minVolunteerHours?: number
  requiredExtracurriculars?: string[]
  leadershipRequired?: boolean

  // Financial
  financialNeed?: string | string[]
  pellGrantRequired?: boolean

  // Special
  firstGenerationRequired?: boolean
  militaryAffiliation?: string | string[]
  disabilities?: string | string[]
}

export interface StudentProfile {
  gpa?: number | null
  gpaScale?: number
  satScore?: number | null
  actScore?: number | null
  classRank?: number | null
  classSize?: number | null
  graduationYear?: number | null
  gender?: string | null
  ethnicity?: string[]
  state?: string | null
  citizenship?: string | null
  intendedMajor?: string | null
  fieldOfStudy?: string | null
  volunteerHours?: number
  extracurriculars?: unknown
  leadershipRoles?: unknown
  financialNeed?: string | null
  pellGrantEligible?: boolean
  firstGeneration?: boolean
  militaryAffiliation?: string | null
  disabilities?: string | null
}

/**
 * Compare student profile against eligibility criteria
 */
export function compareEligibility(
  studentProfile: StudentProfile,
  eligibilityCriteria: EligibilityCriteria
): EligibilityResult[] {
  const results: EligibilityResult[] = []

  // Academic Comparisons
  if (eligibilityCriteria.minGPA !== undefined) {
    const scale = eligibilityCriteria.gpaScale || 4.0
    const scaledRequirement = eligibilityCriteria.minGPA
    const scaledStudentGPA = studentProfile.gpa
      ? (studentProfile.gpa / (studentProfile.gpaScale || 4.0)) * scale
      : null

    results.push({
      category: 'Academic',
      requirement: `GPA: ${eligibilityCriteria.minGPA}+ (${scale} scale)`,
      studentValue: scaledStudentGPA ? `You: ${scaledStudentGPA.toFixed(2)}` : 'Not provided',
      status: scaledStudentGPA
        ? scaledStudentGPA >= scaledRequirement
          ? 'met'
          : 'not_met'
        : 'not_met',
    })
  }

  if (eligibilityCriteria.minSAT !== undefined) {
    const met = studentProfile.satScore
      ? studentProfile.satScore >= eligibilityCriteria.minSAT
      : false
    results.push({
      category: 'Academic',
      requirement: `SAT: ${eligibilityCriteria.minSAT}+`,
      studentValue: studentProfile.satScore ? `You: ${studentProfile.satScore}` : 'Not provided',
      status: met ? 'met' : 'not_met',
    })
  }

  if (eligibilityCriteria.minACT !== undefined) {
    const met = studentProfile.actScore
      ? studentProfile.actScore >= eligibilityCriteria.minACT
      : false
    results.push({
      category: 'Academic',
      requirement: `ACT: ${eligibilityCriteria.minACT}+`,
      studentValue: studentProfile.actScore ? `You: ${studentProfile.actScore}` : 'Not provided',
      status: met ? 'met' : 'not_met',
    })
  }

  // Demographic Comparisons
  if (eligibilityCriteria.gender) {
    const allowedGenders = Array.isArray(eligibilityCriteria.gender)
      ? eligibilityCriteria.gender
      : [eligibilityCriteria.gender]
    const met = studentProfile.gender
      ? allowedGenders.some((g) => g.toLowerCase() === studentProfile.gender?.toLowerCase())
      : false
    results.push({
      category: 'Demographic',
      requirement: `Gender: ${allowedGenders.join(' or ')}`,
      studentValue: studentProfile.gender || 'Not provided',
      status: met ? 'met' : 'not_met',
    })
  }

  if (eligibilityCriteria.ethnicity) {
    const requiredEthnicities = Array.isArray(eligibilityCriteria.ethnicity)
      ? eligibilityCriteria.ethnicity
      : [eligibilityCriteria.ethnicity]
    const studentEthnicities = studentProfile.ethnicity || []
    const matchCount = requiredEthnicities.filter((req) =>
      studentEthnicities.some((s) => s.toLowerCase().includes(req.toLowerCase()))
    ).length

    results.push({
      category: 'Demographic',
      requirement: `Ethnicity: ${requiredEthnicities.join(' or ')}`,
      studentValue: studentEthnicities.length > 0 ? studentEthnicities.join(', ') : 'Not provided',
      status: matchCount > 0 ? 'met' : 'not_met',
    })
  }

  if (eligibilityCriteria.state) {
    const allowedStates = Array.isArray(eligibilityCriteria.state)
      ? eligibilityCriteria.state
      : [eligibilityCriteria.state]
    const met = studentProfile.state
      ? allowedStates.some((s) => s.toLowerCase() === studentProfile.state?.toLowerCase())
      : false
    results.push({
      category: 'Demographic',
      requirement: `State: ${allowedStates.join(', ')}`,
      studentValue: studentProfile.state || 'Not provided',
      status: met ? 'met' : 'not_met',
    })
  }

  // Major/Field Comparisons
  if (eligibilityCriteria.intendedMajor) {
    const allowedMajors = Array.isArray(eligibilityCriteria.intendedMajor)
      ? eligibilityCriteria.intendedMajor
      : [eligibilityCriteria.intendedMajor]
    const met = studentProfile.intendedMajor
      ? allowedMajors.some((m) =>
          studentProfile.intendedMajor?.toLowerCase().includes(m.toLowerCase())
        )
      : false
    results.push({
      category: 'Major/Field',
      requirement: `Major: ${allowedMajors.join(' or ')}`,
      studentValue: studentProfile.intendedMajor || 'Not provided',
      status: met ? 'met' : 'not_met',
    })
  }

  if (eligibilityCriteria.fieldOfStudy) {
    const allowedFields = Array.isArray(eligibilityCriteria.fieldOfStudy)
      ? eligibilityCriteria.fieldOfStudy
      : [eligibilityCriteria.fieldOfStudy]
    const met = studentProfile.fieldOfStudy
      ? allowedFields.some((f) =>
          studentProfile.fieldOfStudy?.toLowerCase().includes(f.toLowerCase())
        )
      : false
    results.push({
      category: 'Major/Field',
      requirement: `Field of Study: ${allowedFields.join(' or ')}`,
      studentValue: studentProfile.fieldOfStudy || 'Not provided',
      status: met ? 'met' : 'not_met',
    })
  }

  // Experience Comparisons
  if (eligibilityCriteria.minVolunteerHours !== undefined) {
    const studentHours = studentProfile.volunteerHours || 0
    const requiredHours = eligibilityCriteria.minVolunteerHours
    const percentage = (studentHours / requiredHours) * 100

    results.push({
      category: 'Experience',
      requirement: `Volunteer Hours: ${requiredHours}+`,
      studentValue: `You: ${studentHours} hours`,
      status:
        studentHours >= requiredHours
          ? 'met'
          : studentHours >= requiredHours * 0.7
            ? 'partially_met'
            : 'not_met',
      partialPercentage: percentage,
    })
  }

  if (eligibilityCriteria.leadershipRequired) {
    const hasLeadership = studentProfile.leadershipRoles
      ? Array.isArray(studentProfile.leadershipRoles)
        ? studentProfile.leadershipRoles.length > 0
        : Object.keys(studentProfile.leadershipRoles).length > 0
      : false

    results.push({
      category: 'Experience',
      requirement: 'Leadership experience required',
      studentValue: hasLeadership ? 'Yes' : 'None listed',
      status: hasLeadership ? 'met' : 'not_met',
    })
  }

  // Financial Comparisons
  if (eligibilityCriteria.financialNeed) {
    const allowedNeeds = Array.isArray(eligibilityCriteria.financialNeed)
      ? eligibilityCriteria.financialNeed
      : [eligibilityCriteria.financialNeed]
    const met = studentProfile.financialNeed
      ? allowedNeeds.some((n) => n.toLowerCase() === studentProfile.financialNeed?.toLowerCase())
      : false
    results.push({
      category: 'Financial',
      requirement: `Financial Need: ${allowedNeeds.join(' or ')}`,
      studentValue: studentProfile.financialNeed || 'Not provided',
      status: met ? 'met' : 'not_met',
    })
  }

  if (eligibilityCriteria.pellGrantRequired) {
    results.push({
      category: 'Financial',
      requirement: 'Pell Grant eligible',
      studentValue: studentProfile.pellGrantEligible ? 'Yes' : 'No',
      status: studentProfile.pellGrantEligible ? 'met' : 'not_met',
    })
  }

  // Special Circumstances
  if (eligibilityCriteria.firstGenerationRequired) {
    results.push({
      category: 'Special',
      requirement: 'First-generation college student',
      studentValue: studentProfile.firstGeneration ? 'Yes' : 'No',
      status: studentProfile.firstGeneration ? 'met' : 'not_met',
    })
  }

  if (eligibilityCriteria.militaryAffiliation) {
    const allowedAffiliations = Array.isArray(eligibilityCriteria.militaryAffiliation)
      ? eligibilityCriteria.militaryAffiliation
      : [eligibilityCriteria.militaryAffiliation]
    const met = studentProfile.militaryAffiliation
      ? allowedAffiliations.some(
          (a) => a.toLowerCase() === studentProfile.militaryAffiliation?.toLowerCase()
        )
      : false
    results.push({
      category: 'Special',
      requirement: `Military Affiliation: ${allowedAffiliations.join(' or ')}`,
      studentValue: studentProfile.militaryAffiliation || 'None',
      status: met ? 'met' : 'not_met',
    })
  }

  return results
}
