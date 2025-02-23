import { users, trainingLogs, techniques, followers, comments, type User, type TrainingLog, type Technique, type InsertUser, type Comment, type Follower } from "@shared/schema";
import { db } from "./db";

import { ReplitObjectStorage } from '@replit/object-storage';

const objectStorage = new ReplitObjectStorage();

import { eq, and, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;

  // Training logs
  createTrainingLog(log: Omit<TrainingLog, "id">): Promise<TrainingLog>;
  getTrainingLogs(userId: number): Promise<(TrainingLog & { comments: (Comment & { user: User })[] })[]>;

  // Techniques
  getTechniques(): Promise<Technique[]>;
  getTechniquesByCategory(category: string): Promise<Technique[]>;

  // Community features
  followUser(followerId: number, followingId: number): Promise<void>;
  unfollowUser(followerId: number, followingId: number): Promise<void>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;

  // Comments
  createComment(userId: number, trainingLogId: number, content: string): Promise<Comment>;
  getComments(trainingLogId: number): Promise<(Comment & { user: User })[]>;
  getAllUsers(): Promise<User[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetPasswordToken, token));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      beltRank: insertUser.beltRank || 'white',
      gym: insertUser.gym || null,
      goals: insertUser.goals || null
    }).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createTrainingLog(log: Omit<TrainingLog, "id">): Promise<TrainingLog> {
    try {
      console.log("Storage: Creating training log with data:", log);
      const [trainingLog] = await db.insert(trainingLogs).values({
        userId: log.userId,
        date: log.date,
        type: log.type,
        gym: log.gym || null,
        // Remove duplicate field, use only techniquesPracticed
        techniquesPracticed: log.techniquesPracticed || [],
        rollingSummary: log.rollingSummary || null,
        submissionsAttempted: log.submissionsAttempted || [],
        submissionsSuccessful: log.submissionsSuccessful || [],
        escapesAttempted: log.escapesAttempted || [],
        escapesSuccessful: log.escapesSuccessful || [],
        performanceRating: log.performanceRating || null,
        focusAreas: log.focusAreas || [],
        energyLevel: log.energyLevel || null,
        notes: log.notes || null,
        coachFeedback: log.coachFeedback || null,
        duration: log.duration
      }).returning();

      console.log("Storage: Successfully created training log:", trainingLog);
      return trainingLog;
    } catch (error) {
      console.error("Storage: Error creating training log:", error);
      throw error;
    }
  }

  async getTrainingLogs(userId: number): Promise<(TrainingLog & { comments: (Comment & { user: User })[] })[]> {
    const logs = await db.select().from(trainingLogs).where(eq(trainingLogs.userId, userId));

    // Fetch comments for each log
    const logsWithComments = await Promise.all(
      logs.map(async (log) => {
        const comments = await this.getComments(log.id);
        return {
          ...log,
          comments
        };
      })
    );

    return logsWithComments;
  }

  async getTechniques(): Promise<Technique[]> {
    return await db.select().from(techniques);
  }

  async getTechniquesByCategory(category: string): Promise<Technique[]> {
    return await db.select().from(techniques).where(eq(techniques.category, category));
  }

  async followUser(followerId: number, followingId: number): Promise<void> {
    try {
      await db.insert(followers).values({
        followerId,
        followingId,
        createdAt: new Date()
      });
    } catch (error) {
      // If error is about unique constraint violation, ignore it
      if (!(error instanceof Error) || !error.message.includes('followers_unique_relationship')) {
        throw error;
      }
    }
  }

  async unfollowUser(followerId: number, followingId: number): Promise<void> {
    await db.delete(followers).where(
      and(
        eq(followers.followerId, followerId),
        eq(followers.followingId, followingId)
      )
    );
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [follow] = await db.select()
      .from(followers)
      .where(
        and(
          eq(followers.followerId, followerId),
          eq(followers.followingId, followingId)
        )
      );
    return !!follow;
  }

  async getFollowers(userId: number): Promise<User[]> {
    // Get users who follow the specified userId
    const followersResult = await db
      .select()
      .from(users)
      .innerJoin(followers, eq(users.id, followers.followerId))
      .where(eq(followers.followingId, userId));

    return followersResult.map(row => ({
      id: row.users.id,
      username: row.users.username,
      email: row.users.email,
      password: row.users.password,
      beltRank: row.users.beltRank,
      gym: row.users.gym,
      goals: row.users.goals,
      totalPoints: row.users.totalPoints,
      level: row.users.level,
      resetPasswordToken: row.users.resetPasswordToken,
      resetPasswordExpires: row.users.resetPasswordExpires
    }));
  }

  async getFollowing(userId: number): Promise<User[]> {
    // Get users who are followed by the specified userId
    const followingResult = await db
      .select()
      .from(users)
      .innerJoin(followers, eq(users.id, followers.followingId))
      .where(eq(followers.followerId, userId));

    return followingResult.map(row => ({
      id: row.users.id,
      username: row.users.username,
      email: row.users.email,
      password: row.users.password,
      beltRank: row.users.beltRank,
      gym: row.users.gym,
      goals: row.users.goals,
      totalPoints: row.users.totalPoints,
      level: row.users.level,
      resetPasswordToken: row.users.resetPasswordToken,
      resetPasswordExpires: row.users.resetPasswordExpires
    }));
  }

  async createComment(userId: number, trainingLogId: number, content: string): Promise<Comment> {
    const [comment] = await db.insert(comments)
      .values({
        userId,
        trainingLogId,
        content
      })
      .returning();
    return comment;
  }

  async getComments(trainingLogId: number): Promise<(Comment & { user: User })[]> {
    const results = await db.select({
      comment: comments,
      user: users
    })
      .from(comments)
      .where(eq(comments.trainingLogId, trainingLogId))
      .innerJoin(users, eq(users.id, comments.userId));

    return results.map(r => ({
      ...r.comment,
      user: r.user
    }));
  }
  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result;
  }
}

export const storage = new DatabaseStorage();