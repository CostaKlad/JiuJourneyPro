import { users, trainingLogs, techniques, followers, comments, challenges, challengeParticipations, type User, type TrainingLog, type Technique, type InsertUser, type Comment, type Follower, type Challenge, type InsertChallenge, type ChallengeParticipation, type InsertChallengeParticipation } from "@shared/schema";
import { db } from "./db";
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

  sessionStore: session.Store;

  // New challenge-related methods
  getChallenges(): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  joinChallenge(userId: number, challengeId: number): Promise<ChallengeParticipation>;
  updateChallengeProgress(userId: number, challengeId: number, progress: Record<string, number>): Promise<ChallengeParticipation>;
  getChallengeLeaderboard(challengeId: number): Promise<(ChallengeParticipation & { user: User })[]>;
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
    const [trainingLog] = await db.insert(trainingLogs).values({
      ...log,
      notes: log.notes || null
    }).returning();
    return trainingLog;
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

  async getChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges).orderBy(desc(challenges.createdAt));
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [newChallenge] = await db.insert(challenges).values(challenge).returning();
    return newChallenge;
  }

  async joinChallenge(userId: number, challengeId: number): Promise<ChallengeParticipation> {
    // Check if already joined
    const [existing] = await db.select()
      .from(challengeParticipations)
      .where(
        and(
          eq(challengeParticipations.userId, userId),
          eq(challengeParticipations.challengeId, challengeId)
        )
      );

    if (existing) {
      return existing;
    }

    // Create new participation
    const [participation] = await db.insert(challengeParticipations)
      .values({
        userId,
        challengeId,
        score: 0,
        progress: {},
      })
      .returning();

    return participation;
  }

  async updateChallengeProgress(
    userId: number,
    challengeId: number,
    progress: Record<string, number>
  ): Promise<ChallengeParticipation> {
    // Calculate total score from progress values
    const score = Object.values(progress).reduce((sum, value) => sum + value, 0);

    const [participation] = await db.update(challengeParticipations)
      .set({
        progress,
        score,
        lastUpdated: new Date(),
        // Update rank based on new score
        rank: sql`(
          SELECT count(*) + 1 
          FROM ${challengeParticipations} cp2 
          WHERE cp2.challenge_id = ${challengeId} 
          AND cp2.score > ${score}
        )`
      })
      .where(
        and(
          eq(challengeParticipations.userId, userId),
          eq(challengeParticipations.challengeId, challengeId)
        )
      )
      .returning();

    return participation;
  }

  async getChallengeLeaderboard(challengeId: number): Promise<(ChallengeParticipation & { user: User })[]> {
    const results = await db.select({
      participation: challengeParticipations,
      user: users
    })
      .from(challengeParticipations)
      .where(eq(challengeParticipations.challengeId, challengeId))
      .innerJoin(users, eq(users.id, challengeParticipations.userId))
      .orderBy(desc(challengeParticipations.score));

    return results.map(r => ({
      ...r.participation,
      user: r.user
    }));
  }
}

export const storage = new DatabaseStorage();