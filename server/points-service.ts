import { db } from "./db";
import { users, pointTransactions, achievements, userAchievements, type User } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { trainingLogs } from "@shared/schema"; // Assuming this import is needed for trainingLogs table
import { userAchievementProgress } from "@shared/schema"; // Assuming this import is needed for userAchievementProgress table
enum AchievementCategory {
  TRAINING_CONSISTENCY = 'trainingConsistency',
  TECHNIQUE_MASTERY = 'techniqueMastery',
  SUBMISSION_MASTERY = 'submissionMastery',
  ESCAPE_MASTERY = 'escapeMastery',
  FOCUS_AREA = 'focusArea'
}

export class PointsService {
  // Point values for different actions
  static readonly POINT_VALUES = {
    TRAINING_SESSION: 100,
    STREAK_DAY: 50,
    TECHNIQUE_LOGGED: 25,
    SUBMISSION_SUCCESSFUL: 40,
    ESCAPE_SUCCESSFUL: 35,
    COMMENT_MADE: 10,
    RECEIVED_COMMENT: 5,
    FOLLOWER_GAINED: 20,
  };

  // Level thresholds with belt rank requirements
  private static readonly LEVEL_SYSTEM = {
    // White Belt Levels (1-10)
    WHITE_BELT: {
      thresholds: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000],
      titles: [
        "Novice White Belt",
        "Dedicated White Belt",
        "Advancing White Belt",
        "Experienced White Belt",
        "Skilled White Belt",
        "Technical White Belt",
        "Proficient White Belt",
        "Advanced White Belt",
        "Expert White Belt",
        "Elite White Belt"
      ]
    },
    // Blue Belt Levels (11-20)
    BLUE_BELT: {
      thresholds: [10000, 12000, 14000, 16000, 18000, 20000, 22000, 24000, 26000, 28000],
      titles: [
        "Novice Blue Belt",
        "Dedicated Blue Belt",
        "Advancing Blue Belt",
        "Experienced Blue Belt",
        "Skilled Blue Belt",
        "Technical Blue Belt",
        "Proficient Blue Belt",
        "Advanced Blue Belt",
        "Expert Blue Belt",
        "Elite Blue Belt"
      ]
    },
    // Purple Belt Levels (21-30)
    PURPLE_BELT: {
      thresholds: [30000, 33000, 36000, 39000, 42000, 45000, 48000, 51000, 54000, 57000],
      titles: [
        "Novice Purple Belt",
        "Dedicated Purple Belt",
        "Advancing Purple Belt",
        "Experienced Purple Belt",
        "Skilled Purple Belt",
        "Technical Purple Belt",
        "Proficient Purple Belt",
        "Advanced Purple Belt",
        "Expert Purple Belt",
        "Elite Purple Belt"
      ]
    },
    // Brown Belt Levels (31-40)
    BROWN_BELT: {
      thresholds: [60000, 64000, 68000, 72000, 76000, 80000, 84000, 88000, 92000, 96000],
      titles: [
        "Novice Brown Belt",
        "Dedicated Brown Belt",
        "Advancing Brown Belt",
        "Experienced Brown Belt",
        "Skilled Brown Belt",
        "Technical Brown Belt",
        "Proficient Brown Belt",
        "Advanced Brown Belt",
        "Expert Brown Belt",
        "Elite Brown Belt"
      ]
    },
    // Black Belt Levels (41-50)
    BLACK_BELT: {
      thresholds: [100000, 110000, 120000, 130000, 140000, 150000, 160000, 170000, 180000, 190000],
      titles: [
        "Novice Black Belt",
        "Dedicated Black Belt",
        "Advancing Black Belt",
        "Experienced Black Belt",
        "Skilled Black Belt",
        "Technical Black Belt",
        "Proficient Black Belt",
        "Advanced Black Belt",
        "Expert Black Belt",
        "Elite Black Belt"
      ]
    }
  };

  // Calculate streak bonus (exponential growth)
  private static calculateStreakBonus(streakDays: number): number {
    return Math.floor(this.POINT_VALUES.STREAK_DAY * Math.pow(1.1, streakDays));
  }

  // Award points for a training session
  async awardTrainingPoints(userId: number, duration: number, techniquesCount: number): Promise<void> {
    try {
      console.log(`Awarding points for userId: ${userId}, duration: ${duration}, techniques: ${techniquesCount}`);

      const basePoints = PointsService.POINT_VALUES.TRAINING_SESSION;
      const durationBonus = Math.floor(duration / 30) * 25; // Extra points for longer sessions
      const techniqueBonus = techniquesCount * PointsService.POINT_VALUES.TECHNIQUE_LOGGED;

      const totalPoints = basePoints + durationBonus + techniqueBonus;
      console.log(`Calculated points - base: ${basePoints}, duration bonus: ${durationBonus}, technique bonus: ${techniqueBonus}, total: ${totalPoints}`);

      await db.transaction(async (tx) => {
        // Create point transaction
        await tx.insert(pointTransactions).values({
          userId,
          amount: totalPoints,
          type: 'training',
          description: `Training session completed: ${duration} minutes, ${techniquesCount} techniques`
        });

        // Get current user points and belt rank
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (!user) {
          throw new Error(`User not found: ${userId}`);
        }

        const newTotal = (user.totalPoints || 0) + totalPoints;
        const { level, title } = this.calculateLevelAndTitle(newTotal, user.beltRank);

        console.log(`Updating user points - current: ${user.totalPoints}, new total: ${newTotal}, new level: ${level}, title: ${title}`);

        // Update user's total points and level
        await tx
          .update(users)
          .set({
            totalPoints: newTotal,
            level: level
          })
          .where(eq(users.id, userId));

        // Check for achievements after points update
        await this.checkAchievements(userId, tx);
      });

      console.log(`Successfully awarded ${totalPoints} points to user ${userId}`);
    } catch (error) {
      console.error('Error awarding training points:', error);
      throw error;
    }
  }

  // Calculate user's level and title based on total points and belt rank
  private calculateLevelAndTitle(points: number, beltRank: string): { level: number; title: string } {
    const beltSystem = this.getBeltSystem(beltRank);
    let level = 1;
    let title = beltSystem.titles[0];

    for (let i = 0; i < beltSystem.thresholds.length; i++) {
      if (points >= beltSystem.thresholds[i]) {
        level = i + 1;
        title = beltSystem.titles[i];
      } else {
        break;
      }
    }

    return { level, title };
  }

  private getBeltSystem(beltRank: string) {
    switch (beltRank.toLowerCase()) {
      case 'white':
        return PointsService.LEVEL_SYSTEM.WHITE_BELT;
      case 'blue':
        return PointsService.LEVEL_SYSTEM.BLUE_BELT;
      case 'purple':
        return PointsService.LEVEL_SYSTEM.PURPLE_BELT;
      case 'brown':
        return PointsService.LEVEL_SYSTEM.BROWN_BELT;
      case 'black':
        return PointsService.LEVEL_SYSTEM.BLACK_BELT;
      default:
        return PointsService.LEVEL_SYSTEM.WHITE_BELT;
    }
  }

  // Get next level threshold
  private getNextLevelThreshold(points: number, beltRank: string): number {
    const beltSystem = this.getBeltSystem(beltRank);
    for (const threshold of beltSystem.thresholds) {
      if (threshold > points) {
        return threshold;
      }
    }
    return beltSystem.thresholds[beltSystem.thresholds.length - 1];
  }

  // Award points for maintaining a streak
  async awardStreakPoints(userId: number, streakDays: number): Promise<void> {
    const points = PointsService.calculateStreakBonus(streakDays);
    await this.addPoints(userId, points, 'streak',
      `${streakDays} day training streak maintained`);
  }

  // Add points and update user's total
  async addPoints(
    userId: number,
    amount: number,
    type: string,
    description: string
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Create point transaction
      await tx.insert(pointTransactions).values({
        userId,
        amount,
        type,
        description
      });

      // Get current user data
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId));

      const newTotal = (user.totalPoints || 0) + amount;
      const { level, title } = this.calculateLevelAndTitle(newTotal, user.beltRank);

      await tx
        .update(users)
        .set({
          totalPoints: newTotal,
          level: level
        })
        .where(eq(users.id, userId));

      // Check for new achievements
      await this.checkAchievements(userId, tx);
    });
  }

  // Get user's points summary with enhanced level information
  async getPointsSummary(userId: number): Promise<{
    totalPoints: number;
    level: number;
    title: string;
    nextLevelPoints: number;
    pointsToNextLevel: number;
    recentTransactions: any[];
    achievements: any[];
  }> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    const recentTransactions = await db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))
      .orderBy(pointTransactions.createdAt);

    const userAchievementsList = await db
      .select({
        achievement: achievements,
        earnedAt: userAchievements.earnedAt
      })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .innerJoin(achievements, eq(achievements.id, userAchievements.achievementId));

    const { level, title } = this.calculateLevelAndTitle(user.totalPoints, user.beltRank);
    const nextLevelThreshold = this.getNextLevelThreshold(user.totalPoints, user.beltRank);
    const pointsToNextLevel = nextLevelThreshold - user.totalPoints;

    return {
      totalPoints: user.totalPoints,
      level,
      title,
      nextLevelPoints: nextLevelThreshold,
      pointsToNextLevel,
      recentTransactions: recentTransactions.slice(-10),
      achievements: userAchievementsList
    };
  }

  // Check and award achievements
  private async checkAchievements(userId: number, tx: any): Promise<void> {
    try {
      console.log(`Checking achievements for user ${userId}`);

      // Get user's current data
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        console.error('User not found when checking achievements');
        return;
      }

      // Get all training logs for progress calculation
      const trainingLogs = await tx
        .select()
        .from(trainingLogs)
        .where(eq(trainingLogs.userId, userId));

      // Get all achievements
      const allAchievements = await tx
        .select()
        .from(achievements);

      // Get user's current achievements
      const userAchievementIds = (await tx
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId)))
        .map((ua: any) => ua.achievementId);

      // Calculate current progress metrics
      const metrics = {
        totalTrainingSessions: trainingLogs.length,
        uniqueTechniques: new Set(trainingLogs.flatMap(log => log.techniquesPracticed || [])).size,
        successfulSubmissions: trainingLogs.reduce((acc, log) => acc + (log.submissionsSuccessful?.length || 0), 0),
        successfulEscapes: trainingLogs.reduce((acc, log) => acc + (log.escapesSuccessful?.length || 0), 0),
        focusAreas: new Set(trainingLogs.flatMap(log => log.focusAreas || [])).size
      };

      console.log('Current achievement metrics:', metrics);

      for (const achievement of allAchievements) {
        if (!userAchievementIds.includes(achievement.id)) {
          let currentProgress = 0;
          let progressMax = achievement.progressMax;
          let earned = false;

          switch (achievement.category) {
            case AchievementCategory.TRAINING_CONSISTENCY:
              currentProgress = metrics.totalTrainingSessions;
              earned = currentProgress >= progressMax;
              break;

            case AchievementCategory.TECHNIQUE_MASTERY:
              currentProgress = metrics.uniqueTechniques;
              earned = currentProgress >= progressMax;
              break;

            case AchievementCategory.SUBMISSION_MASTERY:
              currentProgress = metrics.successfulSubmissions;
              earned = currentProgress >= progressMax;
              break;

            case AchievementCategory.ESCAPE_MASTERY:
              currentProgress = metrics.successfulEscapes;
              earned = currentProgress >= progressMax;
              break;

            case AchievementCategory.FOCUS_AREA:
              currentProgress = metrics.focusAreas;
              earned = currentProgress >= progressMax;
              break;
          }

          // Update progress in database
          await tx
            .insert(userAchievementProgress)
            .values({
              userId,
              achievementId: achievement.id,
              currentProgress
            })
            .onConflictDoUpdate({
              target: [userAchievementProgress.userId, userAchievementProgress.achievementId],
              set: { currentProgress, updatedAt: new Date() }
            });

          if (earned) {
            console.log(`User ${userId} earned achievement: ${achievement.name}`);

            // Award the achievement
            await tx.insert(userAchievements).values({
              userId,
              achievementId: achievement.id
            });

            // Award bonus points
            await tx.insert(pointTransactions).values({
              userId,
              amount: achievement.pointValue,
              type: 'achievement',
              description: `Earned achievement: ${achievement.name}`
            });

            // Update user's total points
            await tx
              .update(users)
              .set({
                totalPoints: user.totalPoints + achievement.pointValue
              })
              .where(eq(users.id, userId));
          }
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
      throw error;
    }
  }

  // Calculate current streak
  private async calculateCurrentStreak(userId: number, tx: any): Promise<number> {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const recentLogs = await tx
      .select()
      .from(pointTransactions)
      .where(
        and(
          eq(pointTransactions.userId, userId),
          eq(pointTransactions.type, 'training'),
          gte(pointTransactions.createdAt, yesterday)
        )
      )
      .orderBy(pointTransactions.createdAt);

    if (recentLogs.length === 0) return 0;

    let streak = 1;
    let currentDate = new Date(recentLogs[0].createdAt);

    for (let i = 1; i < recentLogs.length; i++) {
      const logDate = new Date(recentLogs[i].createdAt);
      const dayDiff = Math.floor(
        (logDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        streak++;
        currentDate = logDate;
      } else if (dayDiff > 1) {
        break;
      }
    }

    return streak;
  }
}

export const pointsService = new PointsService();