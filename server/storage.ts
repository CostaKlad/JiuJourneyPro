import { users, trainingLogs, techniques, type User, type TrainingLog, type Technique, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();