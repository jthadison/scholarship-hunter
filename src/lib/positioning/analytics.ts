/**
 * Story 5.5: Competitive Positioning Over Time
 * Position Analytics Service - Core calculation functions
 */

import { prisma } from "@/server/db";
import type { PriorityTier } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

export interface CompetitivePosition {
  profileStrengthScore: number;
  percentileRanking: number;
  totalMatches: number;
  mustApplyCount: number;
  shouldApplyCount: number;
  ifTimePermitsCount: number;
  projectedFunding: number;
}

export interface PositionComparison {
  currentMonth: {
    matches: number;
    funding: number;
    profileStrength: number;
  };
  previousMonth: {
    matches: number;
    funding: number;
    profileStrength: number;
  };
  delta: {
    matches: number;
    funding: number;
    profileStrength: number;
  };
  improvementSources: {
    gpa: number;
    volunteer: number;
    test: number;
    leadership: number;
  };
}

export interface PeerBenchmark {
  peerGroupDefinition: string;
  fundingRange: {
    min: number;
    max: number;
  };
  averageFunding: number;
  successRateComparison: {
    peer: number;
    student: number;
  };
  studentCount: number;
}

export interface PositionSnapshot {
  snapshotDate: Date;
  profileStrengthScore: number;
  percentileRanking: number;
  totalMatches: number;
  projectedFunding: number;
  mustApplyCount: number;
  shouldApplyCount: number;
  ifTimePermitsCount: number;
}

// ============================================================================
// Core Analytics Functions
// ============================================================================

/**
 * Get current competitive position for a student
 */
export async function getCompetitivePosition(
  studentId: string
): Promise<CompetitivePosition | null> {
  const latestSnapshot = await prisma.profilePositionSnapshot.findFirst({
    where: { studentId },
    orderBy: { snapshotDate: "desc" },
  });

  if (!latestSnapshot) {
    return null;
  }

  return {
    profileStrengthScore: latestSnapshot.profileStrengthScore,
    percentileRanking: latestSnapshot.percentileRanking,
    totalMatches: latestSnapshot.totalMatches,
    mustApplyCount: latestSnapshot.mustApplyCount,
    shouldApplyCount: latestSnapshot.shouldApplyCount,
    ifTimePermitsCount: latestSnapshot.ifTimePermitsCount,
    projectedFunding: latestSnapshot.projectedFunding,
  };
}

/**
 * Get position history for a student within a time range
 */
export async function getPositionHistory(
  studentId: string,
  timeRange: "30d" | "90d" | "1y" | "all" = "90d"
): Promise<PositionSnapshot[]> {
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "1y":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      // Limit to 2 years for performance
      startDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
      break;
  }

  const snapshots = await prisma.profilePositionSnapshot.findMany({
    where: {
      studentId,
      snapshotDate: {
        gte: startDate,
      },
    },
    orderBy: { snapshotDate: "asc" },
  });

  return snapshots.map((s) => ({
    snapshotDate: s.snapshotDate,
    profileStrengthScore: s.profileStrengthScore,
    percentileRanking: s.percentileRanking,
    totalMatches: s.totalMatches,
    projectedFunding: s.projectedFunding,
    mustApplyCount: s.mustApplyCount,
    shouldApplyCount: s.shouldApplyCount,
    ifTimePermitsCount: s.ifTimePermitsCount,
  }));
}

/**
 * Compare current month position to previous month
 */
export async function comparePosition(
  studentId: string
): Promise<PositionComparison | null> {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get current snapshot (most recent)
  const currentSnapshot = await prisma.profilePositionSnapshot.findFirst({
    where: { studentId },
    orderBy: { snapshotDate: "desc" },
  });

  // Get previous month snapshot
  const previousSnapshot = await prisma.profilePositionSnapshot.findFirst({
    where: {
      studentId,
      snapshotDate: {
        lte: oneMonthAgo,
      },
    },
    orderBy: { snapshotDate: "desc" },
  });

  if (!currentSnapshot) {
    return null;
  }

  // Calculate deltas
  const currentMatches = currentSnapshot.totalMatches;
  const previousMatches = previousSnapshot?.totalMatches ?? 0;
  const currentFunding = currentSnapshot.projectedFunding;
  const previousFunding = previousSnapshot?.projectedFunding ?? 0;
  const currentStrength = currentSnapshot.profileStrengthScore;
  const previousStrength = previousSnapshot?.profileStrengthScore ?? 0;

  // Estimate improvement sources (simplified heuristic)
  const strengthDelta = currentStrength - previousStrength;
  const improvementSources = await estimateImprovementSources(
    studentId,
    oneMonthAgo
  );

  return {
    currentMonth: {
      matches: currentMatches,
      funding: currentFunding,
      profileStrength: currentStrength,
    },
    previousMonth: {
      matches: previousMatches,
      funding: previousFunding,
      profileStrength: previousStrength,
    },
    delta: {
      matches: currentMatches - previousMatches,
      funding: currentFunding - previousFunding,
      profileStrength: strengthDelta,
    },
    improvementSources,
  };
}

/**
 * Estimate which profile improvements contributed to gains
 * (Simplified heuristic based on profile history)
 */
async function estimateImprovementSources(
  studentId: string,
  since: Date
): Promise<{
  gpa: number;
  volunteer: number;
  test: number;
  leadership: number;
}> {
  // Get profile history entries since the date
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      profile: {
        include: {
          strengthHistory: {
            where: {
              recordedAt: {
                gte: since,
              },
            },
            orderBy: { recordedAt: "asc" },
          },
        },
      },
    },
  });

  if (!student?.profile?.strengthHistory || student.profile.strengthHistory.length < 2) {
    return { gpa: 0, volunteer: 0, test: 0, leadership: 0 };
  }

  const history = student.profile.strengthHistory;
  const oldest = history[0];
  const newest = history[history.length - 1];

  if (!oldest || !newest) {
    return { gpa: 0, volunteer: 0, test: 0, leadership: 0 };
  }

  // Calculate improvement by dimension
  const academicDelta = newest.academicScore - oldest.academicScore;
  const leadershipDelta = newest.leadershipScore - oldest.leadershipScore;
  const experienceDelta = newest.experienceScore - oldest.experienceScore;

  // Heuristic: Academic includes both GPA and test scores (split evenly)
  const gpaImpact = Math.max(0, academicDelta / 2);
  const testImpact = Math.max(0, academicDelta / 2);

  // Experience includes volunteer hours
  const volunteerImpact = Math.max(0, experienceDelta);

  // Leadership is direct
  const leadershipImpact = Math.max(0, leadershipDelta);

  return {
    gpa: Math.round(gpaImpact),
    volunteer: Math.round(volunteerImpact),
    test: Math.round(testImpact),
    leadership: Math.round(leadershipImpact),
  };
}

/**
 * Get peer benchmark comparison (anonymized)
 */
export async function getPeerBenchmark(
  studentId: string
): Promise<PeerBenchmark | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      profile: true,
    },
  });

  if (!student?.profile) {
    return null;
  }

  const profileStrength = student.profile.strengthScore;

  // Find peers with similar profile strength (±5 points)
  const peerRange = 5;
  const minStrength = profileStrength - peerRange;
  const maxStrength = profileStrength + peerRange;

  // Get peer snapshots (most recent for each student)
  const peerSnapshots = await prisma.profilePositionSnapshot.findMany({
    where: {
      studentId: {
        not: studentId, // Exclude current student
      },
      profileStrengthScore: {
        gte: minStrength,
        lte: maxStrength,
      },
    },
    orderBy: { snapshotDate: "desc" },
    distinct: ["studentId"],
    take: 100, // Limit for performance
  }) as Array<{ projectedFunding: number; totalMatches: number }>;

  if (peerSnapshots.length === 0) {
    return null;
  }

  // Calculate aggregate metrics
  const fundingValues = peerSnapshots.map((s: { projectedFunding: number }) => s.projectedFunding);
  const avgFunding =
    fundingValues.reduce((sum: number, f: number) => sum + f, 0) / fundingValues.length;
  const minFunding = Math.min(...fundingValues);
  const maxFunding = Math.max(...fundingValues);

  // Get student's current position
  const currentPosition = await getCompetitivePosition(studentId);

  // Define peer group
  const peerGroupDefinition = generatePeerGroupDescription(student.profile);

  // Calculate success rates (simplified - could be enhanced with actual outcomes data)
  const peerSuccessRate = calculatePeerSuccessRate(peerSnapshots);
  const studentSuccessRate = currentPosition
    ? estimateStudentSuccessRate(currentPosition)
    : 0;

  return {
    peerGroupDefinition,
    fundingRange: {
      min: Math.round(minFunding),
      max: Math.round(maxFunding),
    },
    averageFunding: Math.round(avgFunding),
    successRateComparison: {
      peer: Math.round(peerSuccessRate * 100) / 100,
      student: Math.round(studentSuccessRate * 100) / 100,
    },
    studentCount: peerSnapshots.length,
  };
}

/**
 * Generate a human-readable peer group description
 */
function generatePeerGroupDescription(profile: {
  gpa: number | null;
  intendedMajor: string | null;
  financialNeed: string | null;
}): string {
  const parts: string[] = ["Students with similar profiles"];

  if (profile.gpa) {
    const gpaRange = 0.2;
    const minGpa = Math.max(0, profile.gpa - gpaRange);
    const maxGpa = Math.min(4.0, profile.gpa + gpaRange);
    parts.push(`${minGpa.toFixed(1)}-${maxGpa.toFixed(1)} GPA`);
  }

  if (profile.intendedMajor) {
    parts.push(profile.intendedMajor);
  }

  if (profile.financialNeed) {
    parts.push(`${profile.financialNeed.toLowerCase()} financial need`);
  }

  return parts.join(", ");
}

/**
 * Calculate average success rate for peer group
 */
function calculatePeerSuccessRate(
  snapshots: Array<{ projectedFunding: number; totalMatches: number }>
): number {
  if (snapshots.length === 0) return 0;

  // Heuristic: Success rate based on match count and funding potential
  const rates = snapshots.map((s) => {
    const baseRate = Math.min(1.0, s.totalMatches / 50); // More matches = higher chance
    const fundingBoost = Math.min(0.3, s.projectedFunding / 100000); // Higher funding = slight boost
    return Math.min(1.0, baseRate + fundingBoost);
  });

  const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
  return Math.round(avgRate * 100); // Return as percentage
}

/**
 * Estimate student's success rate based on current position
 */
function estimateStudentSuccessRate(position: CompetitivePosition): number {
  // Heuristic: Percentile ranking is strong indicator of success
  const percentileBonus = position.percentileRanking / 100;
  const matchBonus = Math.min(0.3, position.mustApplyCount / 20);
  const fundingBonus = Math.min(0.2, position.projectedFunding / 50000);

  const successRate = Math.min(
    1.0,
    0.2 + percentileBonus * 0.5 + matchBonus + fundingBonus
  );

  return Math.round(successRate * 100); // Return as percentage
}

/**
 * Calculate projected funding for a student
 * Formula: Sum (match_score × award_amount × success_probability) for top 20 matches
 */
export async function calculateProjectedFunding(
  studentId: string,
  includeGoalImprovements: boolean = false
): Promise<{
  current: number;
  afterImprovements?: number;
}> {
  // Get top 20 matches by overall score
  const matches = await prisma.match.findMany({
    where: { studentId },
    include: {
      scholarship: true,
    },
    orderBy: { overallMatchScore: "desc" },
    take: 20,
  });

  // Calculate current projected funding
  const currentFunding = matches.reduce((sum: number, match: typeof matches[0]) => {
    const matchScore = match.overallMatchScore / 100; // Normalize to 0-1
    const successProb = match.successProbability / 100; // Normalize to 0-1
    const awardAmount = match.scholarship.awardAmount;

    return sum + matchScore * awardAmount * successProb;
  }, 0);

  if (!includeGoalImprovements) {
    return { current: Math.round(currentFunding) };
  }

  // Calculate potential funding after completing active goals
  const activeGoals = await prisma.profileGoal.findMany({
    where: {
      studentId,
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
    },
  });

  // Estimate impact: Each goal typically improves match scores by its impact estimate
  const totalImpactEstimate = activeGoals.reduce(
    (sum: number, goal: typeof activeGoals[0]) => sum + goal.impactEstimate,
    0
  );

  // Conservative estimate: 10% funding increase per 10 profile strength points
  const improvementMultiplier = 1 + totalImpactEstimate / 100;
  const afterImprovements = currentFunding * improvementMultiplier;

  return {
    current: Math.round(currentFunding),
    afterImprovements: Math.round(afterImprovements),
  };
}

/**
 * Count matches by priority tier
 */
export async function countMatchesByTier(studentId: string): Promise<{
  MUST_APPLY: number;
  SHOULD_APPLY: number;
  IF_TIME_PERMITS: number;
  HIGH_VALUE_REACH: number;
}> {
  const matches = await prisma.match.groupBy({
    by: ["priorityTier"],
    where: { studentId },
    _count: true,
  });

  const counts = {
    MUST_APPLY: 0,
    SHOULD_APPLY: 0,
    IF_TIME_PERMITS: 0,
    HIGH_VALUE_REACH: 0,
  };

  matches.forEach((m: typeof matches[0]) => {
    counts[m.priorityTier as PriorityTier] = m._count;
  });

  return counts;
}
