import { db } from "./db";
import { achievements, userAchievements, userAchievementProgress } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { pointsService } from "./points-service"; // Add this import

export class AchievementService {
  // Achievement categories
  static readonly CATEGORIES = {
    TRAINING: "training",
    COMMUNITY: "community",
    COMPETITION: "competition",
    TECHNIQUE: "technique",
    STREAK: "streak"
  };

  // Achievement tiers
  static readonly TIERS = {
    BRONZE: "bronze",
    SILVER: "silver",
    GOLD: "gold",
    DIAMOND: "diamond"
  };

  // Pre-defined achievements
  static readonly ACHIEVEMENTS = [
    {
      name: "Training Warrior",
      description: "Complete your first 10 training sessions",
      category: AchievementService.CATEGORIES.TRAINING,
      tier: AchievementService.TIERS.BRONZE,
      icon: "🥋",
      pointValue: 100,
      requirement: { type: "training_count", count: 10 },
      progressMax: 10
    },
    {
      name: "Technique Explorer",
      description: "Log practice of 20 different techniques",
      category: AchievementService.CATEGORIES.TECHNIQUE,
      tier: AchievementService.TIERS.SILVER,
      icon: "📚",
      pointValue: 200,
      requirement: { type: "unique_techniques", count: 20 },
      progressMax: 20
    },
    {
      name: "Community Mentor",
      description: "Help others by making 50 comments",
      category: AchievementService.CATEGORIES.COMMUNITY,
      tier: AchievementService.TIERS.GOLD,
      icon: "💬",
      pointValue: 300,
      requirement: { type: "comment_count", count: 50 },
      progressMax: 50
    },
    {
      name: "Dedication Master",
      description: "Maintain a 30-day training streak",
      category: AchievementService.CATEGORIES.STREAK,
      tier: AchievementService.TIERS.DIAMOND,
      icon: "🔥",
      pointValue: 500,
      requirement: { type: "streak_days", days: 30 },
      progressMax: 30
    }
  ];

  // Initialize achievements in database
  async initializeAchievements() {
    try {
      for (const achievement of AchievementService.ACHIEVEMENTS) {
        const existing = await db.select()
          .from(achievements)
          .where(eq(achievements.name, achievement.name));

        if (existing.length === 0) {
          await db.insert(achievements).values(achievement);
        }
      }
      return true;
    } catch (error) {
      console.error("Error initializing achievements:", error);
      throw error;
    }
  }

  // Update achievement progress
  async updateProgress(userId: number, achievementId: number, progress: number) {
    try {
      const [existingProgress] = await db.select()
        .from(userAchievementProgress)
        .where(
          and(
            eq(userAchievementProgress.userId, userId),
            eq(userAchievementProgress.achievementId, achievementId)
          )
        );

      if (existingProgress) {
        await db.update(userAchievementProgress)
          .set({ currentProgress: progress, updatedAt: new Date() })
          .where(eq(userAchievementProgress.id, existingProgress.id));
      } else {
        await db.insert(userAchievementProgress).values({
          userId,
          achievementId,
          currentProgress: progress
        });
      }

      // Check if achievement should be unlocked
      const [achievement] = await db.select()
        .from(achievements)
        .where(eq(achievements.id, achievementId));

      if (achievement && this.shouldUnlockAchievement(achievement, progress)) {
        await this.unlockAchievement(userId, achievementId);
      }
    } catch (error) {
      console.error("Error updating achievement progress:", error);
      throw error;
    }
  }

  private shouldUnlockAchievement(achievement: any, progress: number): boolean {
    const requirement = achievement.requirement;
    switch (requirement.type) {
      case 'training_count':
        return progress >= requirement.count;
      case 'unique_techniques':
        return progress >= requirement.count;
      case 'comment_count':
        return progress >= requirement.count;
      case 'streak_days':
        return progress >= requirement.days;
      default:
        return false;
    }
  }

  // Unlock achievement
  private async unlockAchievement(userId: number, achievementId: number) {
    try {
      const existingUnlock = await db.select()
        .from(userAchievements)
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementId, achievementId)
          )
        );

      if (existingUnlock.length === 0) {
        await db.insert(userAchievements).values({
          userId,
          achievementId,
          earnedAt: new Date()
        });

        // Award points for the achievement
        const [achievement] = await db.select()
          .from(achievements)
          .where(eq(achievements.id, achievementId));

        if (achievement) {
          await pointsService.addPoints(
            userId,
            achievement.pointValue,
            'achievement',
            `Earned achievement: ${achievement.name}`
          );
        }
      }
    } catch (error) {
      console.error("Error unlocking achievement:", error);
      throw error;
    }
  }

  // Get achievement progress for a user
  async getAchievementProgress(userId: number) {
    try {
      const allAchievements = await db.select().from(achievements);
      const userProgress = await db.select()
        .from(userAchievementProgress)
        .where(eq(userAchievementProgress.userId, userId));

      const unlockedAchievements = await db.select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));

      return allAchievements.map(achievement => {
        const progress = userProgress.find(p => p.achievementId === achievement.id);
        const unlocked = unlockedAchievements.some(ua => ua.achievementId === achievement.id);

        return {
          ...achievement,
          currentProgress: progress?.currentProgress || 0,
          progressPercentage: progress ? 
            Math.min(100, (progress.currentProgress / achievement.progressMax) * 100) : 0,
          unlocked,
          unlockedAt: unlocked ? 
            unlockedAchievements.find(ua => ua.achievementId === achievement.id)?.earnedAt : 
            null
        };
      });
    } catch (error) {
      console.error("Error getting achievement progress:", error);
      throw error;
    }
  }
}

export const achievementService = new AchievementService();