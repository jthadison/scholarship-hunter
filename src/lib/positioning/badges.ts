/**
 * Story 5.5: Achievement Badges System
 * Badge unlock criteria and awarding logic
 */

import { prisma } from "@/server/db";
import type { BadgeType } from "@prisma/client";

// ============================================================================
// Badge Definitions
// ============================================================================

export interface BadgeDefinition {
  type: BadgeType;
  title: string;
  description: string;
  iconName: string;
  checkCriteria: (
    student: StudentWithRelations
  ) => Promise<boolean> | boolean;
}

interface StudentWithRelations {
  id: string;
  profile: {
    strengthScore: number;
    volunteerHours: number;
    leadershipRoles: unknown;
  } | null;
  profileGoals: Array<{ status: string }>;
  profilePositionSnapshots: Array<{
    profileStrengthScore: number;
    snapshotDate: Date;
  }>;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    type: "TOP_25_ACADEMIC",
    title: "Top 25% Academic Profile",
    description:
      "Your academic profile ranks in the top 25% of all students on the platform",
    iconName: "trophy",
    checkCriteria: (student) => {
      return (student.profile?.strengthScore ?? 0) >= 75;
    },
  },
  {
    type: "TOP_10_ACADEMIC",
    title: "Top 10% Academic Profile",
    description:
      "Elite achievement: Your academic profile ranks in the top 10% of all students",
    iconName: "star",
    checkCriteria: (student) => {
      return (student.profile?.strengthScore ?? 0) >= 85;
    },
  },
  {
    type: "LEADERSHIP_CHAMPION",
    title: "Leadership Champion",
    description:
      "Demonstrated exceptional leadership through multiple roles and responsibilities",
    iconName: "users",
    checkCriteria: (student) => {
      // Leadership score >= 80 (this would need to be calculated from profile)
      const leadershipRoles = student.profile?.leadershipRoles as Array<unknown> | null;
      return (leadershipRoles?.length ?? 0) >= 3;
    },
  },
  {
    type: "COMMUNITY_IMPACT",
    title: "Community Impact",
    description:
      "Made significant contributions to your community through volunteer work",
    iconName: "heart",
    checkCriteria: (student) => {
      return (student.profile?.volunteerHours ?? 0) >= 200;
    },
  },
  {
    type: "QUICK_IMPROVER",
    title: "Quick Improver",
    description:
      "Rapidly improved your profile strength by 20+ points in just 30 days",
    iconName: "trending-up",
    checkCriteria: async (student) => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const snapshots = student.profilePositionSnapshots
        .filter((s) => s.snapshotDate >= thirtyDaysAgo)
        .sort((a, b) => a.snapshotDate.getTime() - b.snapshotDate.getTime());

      if (snapshots.length < 2) return false;

      const oldest = snapshots[0];
      const newest = snapshots[snapshots.length - 1];

      if (!oldest || !newest) return false;

      const improvement =
        newest.profileStrengthScore - oldest.profileStrengthScore;
      return improvement >= 20;
    },
  },
  {
    type: "GOAL_ACHIEVER",
    title: "Goal Achiever",
    description:
      "Successfully completed 5 or more profile improvement goals",
    iconName: "target",
    checkCriteria: (student) => {
      const completedGoals = student.profileGoals.filter(
        (g) => g.status === "COMPLETED"
      );
      return completedGoals.length >= 5;
    },
  },
];

// ============================================================================
// Badge Management Functions
// ============================================================================

/**
 * Check and award all eligible badges for a student
 * Returns newly unlocked badges
 */
export async function checkAndAwardBadges(
  studentId: string
): Promise<BadgeType[]> {
  // Get student with all necessary relations
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      profile: true,
      profileGoals: {
        where: { status: "COMPLETED" },
      },
      profilePositionSnapshots: {
        orderBy: { snapshotDate: "desc" },
        take: 90, // Last 90 snapshots (3 months)
      },
      achievements: {
        include: {
          badge: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  // Get already unlocked badge types
  const unlockedBadgeTypes = student.achievements.map((a) => a.badge.badgeType);

  // Check each badge definition
  const newlyUnlocked: BadgeType[] = [];

  for (const badgeDef of BADGE_DEFINITIONS) {
    // Skip if already unlocked
    if (unlockedBadgeTypes.includes(badgeDef.type)) {
      continue;
    }

    // Check if criteria is met
    const isEligible = await badgeDef.checkCriteria(student);

    if (isEligible) {
      // Find or create badge
      let badge = await prisma.achievementBadge.findUnique({
        where: { badgeType: badgeDef.type },
      });

      if (!badge) {
        badge = await prisma.achievementBadge.create({
          data: {
            badgeType: badgeDef.type,
            title: badgeDef.title,
            description: badgeDef.description,
            iconName: badgeDef.iconName,
          },
        });
      }

      // Award badge to student
      await prisma.studentAchievement.create({
        data: {
          studentId,
          badgeId: badge.id,
        },
      });

      newlyUnlocked.push(badgeDef.type);
    }
  }

  return newlyUnlocked;
}

/**
 * Get all badges for a student (unlocked and locked)
 */
export async function getBadgesForStudent(studentId: string): Promise<{
  unlocked: Array<{
    type: BadgeType;
    title: string;
    description: string;
    iconName: string;
    unlockedAt: Date;
  }>;
  locked: Array<{
    type: BadgeType;
    title: string;
    description: string;
    iconName: string;
    criteria: string;
  }>;
}> {
  // Get student achievements
  const achievements = await prisma.studentAchievement.findMany({
    where: { studentId },
    include: {
      badge: true,
    },
  });

  const unlockedBadgeTypes = achievements.map((a: typeof achievements[0]) => a.badge.badgeType);

  // Map unlocked badges
  const unlocked = achievements.map((a: typeof achievements[0]) => ({
    type: a.badge.badgeType,
    title: a.badge.title,
    description: a.badge.description,
    iconName: a.badge.iconName,
    unlockedAt: a.unlockedAt,
  }));

  // Map locked badges
  const locked = BADGE_DEFINITIONS.filter(
    (def: typeof BADGE_DEFINITIONS[0]) => !unlockedBadgeTypes.includes(def.type)
  ).map((def: typeof BADGE_DEFINITIONS[0]) => ({
    type: def.type,
    title: def.title,
    description: def.description,
    iconName: def.iconName,
    criteria: getUnlockCriteria(def.type),
  }));

  return { unlocked, locked };
}

/**
 * Get human-readable unlock criteria for a badge
 */
export function getUnlockCriteria(badgeType: BadgeType): string {
  switch (badgeType) {
    case "TOP_25_ACADEMIC":
      return "Reach a profile strength score of 75 or higher";
    case "TOP_10_ACADEMIC":
      return "Reach a profile strength score of 85 or higher";
    case "LEADERSHIP_CHAMPION":
      return "Add 3 or more leadership roles to your profile";
    case "COMMUNITY_IMPACT":
      return "Complete 200 or more volunteer hours";
    case "QUICK_IMPROVER":
      return "Improve your profile strength by 20+ points in 30 days";
    case "GOAL_ACHIEVER":
      return "Complete 5 profile improvement goals";
    default:
      return "Complete the required criteria";
  }
}

/**
 * Initialize all badge definitions in the database
 * (Run once during deployment/migration)
 */
export async function initializeBadges(): Promise<void> {
  for (const def of BADGE_DEFINITIONS) {
    await prisma.achievementBadge.upsert({
      where: { badgeType: def.type },
      create: {
        badgeType: def.type,
        title: def.title,
        description: def.description,
        iconName: def.iconName,
      },
      update: {
        title: def.title,
        description: def.description,
        iconName: def.iconName,
      },
    });
  }
}
