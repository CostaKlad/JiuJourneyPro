import { db } from "./db";
import { users, pointTransactions, achievements, userAchievements, type User } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export class PointsService {
  // Point values for different actions
  static readonly POINT_VALUES = {
    TRAINING_SESSION: 100,
    STREAK_DAY: 50,
    TECHNIQUE_LOGGED: 25,
    COMMENT_MADE: 10,
    RECEIVED_COMMENT: 5,
    FOLLOWER_GAINED: 20,
  };

  // Level thresholds
  private static readonly LEVEL_THRESHOLDS = [
    0,      // Level 1
    1000,   // Level 2
    2500,   // Level 3
    5000,   // Level 4
    10000,  // Level 5
    20000,  // Level 6
    35000,  // Level 7
    50000,  // Level 8
    75000,  // Level 9
    100000  // Level 10
  ];

  // Calculate streak bonus (exponential growth)
  private static calculateStreakBonus(streakDays: number): number {
    return Math.floor(this.POINT_VALUES.STREAK_DAY * Math.pow(1.1, streakDays));
  }

  // Award points for a training session
  async awardTrainingPoints(userId: number, duration: number, techniquesCount: number): Promise<void> {
    const basePoints = PointsService.POINT_VALUES.TRAINING_SESSION;
    const durationBonus = Math.floor(duration / 30) * 25; // Extra points for longer sessions
    const techniqueBonus = techniquesCount * PointsService.POINT_VALUES.TECHNIQUE_LOGGED;

    const totalPoints = basePoints + durationBonus + techniqueBonus;

    await this.addPoints(userId, totalPoints, 'training', 
      `Training session completed: ${duration} minutes, ${techniquesCount} techniques`);
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

      // Update user's total points
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId));

      const newTotal = (user.totalPoints || 0) + amount;
      const newLevel = this.calculateLevel(newTotal);

      await tx
        .update(users)
        .set({ 
          totalPoints: newTotal,
          level: newLevel 
        })
        .where(eq(users.id, userId));

      // Check for new achievements
      await this.checkAchievements(userId, tx);
    });
  }

  // Calculate user's level based on total points
  private calculateLevel(points: number): number {
    let level = 1;
    for (let threshold of PointsService.LEVEL_THRESHOLDS) {
      if (points >= threshold) {
        level++;
      } else {
        break;
      }
    }
    return level;
  }

  // Get user's points summary
  async getPointsSummary(userId: number): Promise<{
    totalPoints: number;
    level: number;
    nextLevelPoints: number;
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

    const nextLevelThreshold = PointsService.LEVEL_THRESHOLDS[user.level] || Infinity;

    return {
      totalPoints: user.totalPoints,
      level: user.level,
      nextLevelPoints: nextLevelThreshold,
      recentTransactions: recentTransactions.slice(-10),
      achievements: userAchievementsList
    };
  }

  // Check and award achievements
  private async checkAchievements(userId: number, tx: any): Promise<void> {
    const [user] = await tx
      .select()
      .from(users)
      .where(eq(users.id, userId));

    const allAchievements = await tx
      .select()
      .from(achievements);

    const userAchievementIds = (await tx
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId)))
      .map((ua: any) => ua.achievementId);

    for (const achievement of allAchievements) {
      if (!userAchievementIds.includes(achievement.id)) {
        const requirement = achievement.requirement as any;
        let earned = false;

        switch (requirement.type) {
          case 'points':
            earned = user.totalPoints >= requirement.amount;
            break;
          case 'level':
            earned = user.level >= requirement.level;
            break;
          case 'streak':
            // Calculate current streak and compare
            const streak = await this.calculateCurrentStreak(userId, tx);
            earned = streak >= requirement.days;
            break;
        }

        if (earned) {
          await tx.insert(userAchievements).values({
            userId,
            achievementId: achievement.id
          });

          // Award bonus points for earning the achievement
          await tx.insert(pointTransactions).values({
            userId,
            amount: achievement.pointValue,
            type: 'achievement',
            description: `Earned achievement: ${achievement.name}`
          });

          // Update user's total points with achievement bonus
          await tx
            .update(users)
            .set({ 
              totalPoints: user.totalPoints + achievement.pointValue 
            })
            .where(eq(users.id, userId));
        }
      }
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