import { users, trainingLogs, techniques, followers, comments, type User, type TrainingLog, type Technique, type InsertUser, type Comment, type Follower } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Training logs
  createTrainingLog(log: Omit<TrainingLog, "id">): Promise<TrainingLog>;
  getTrainingLogs(userId: number): Promise<TrainingLog[]>;

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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      beltRank: insertUser.beltRank || 'white',
      gym: insertUser.gym || null,
      goals: insertUser.goals || null
    }).returning();
    return user;
  }

  async createTrainingLog(log: Omit<TrainingLog, "id">): Promise<TrainingLog> {
    const [trainingLog] = await db.insert(trainingLogs).values({
      ...log,
      notes: log.notes || null
    }).returning();
    return trainingLog;
  }

  async getTrainingLogs(userId: number): Promise<TrainingLog[]> {
    return await db.select().from(trainingLogs).where(eq(trainingLogs.userId, userId));
  }

  async getTechniques(): Promise<Technique[]> {
    return await db.select().from(techniques);
  }

  async getTechniquesByCategory(category: string): Promise<Technique[]> {
    return await db.select().from(techniques).where(eq(techniques.category, category));
  }

  // New community methods
  async followUser(followerId: number, followingId: number): Promise<void> {
    await db.insert(followers).values({
      followerId,
      followingId
    });
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
    const followersResult = await db.select({
      follower: users
    })
    .from(followers)
    .where(eq(followers.followingId, userId))
    .innerJoin(users, eq(users.id, followers.followerId));

    return followersResult.map(r => r.follower);
  }

  async getFollowing(userId: number): Promise<User[]> {
    const followingResult = await db.select({
      following: users
    })
    .from(followers)
    .where(eq(followers.followerId, userId))
    .innerJoin(users, eq(users.id, followers.followingId));

    return followingResult.map(r => r.following);
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
}

export const storage = new DatabaseStorage();