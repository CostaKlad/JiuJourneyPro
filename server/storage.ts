import session from "express-session";
import createMemoryStore from "memorystore";
import { User, TrainingLog, Technique, InsertUser } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private trainingLogs: Map<number, TrainingLog>;
  private techniques: Map<number, Technique>;
  sessionStore: session.Store;
  private currentUserId: number;
  private currentLogId: number;
  private currentTechniqueId: number;

  constructor() {
    this.users = new Map();
    this.trainingLogs = new Map();
    this.techniques = new Map();
    this.currentUserId = 1;
    this.currentLogId = 1;
    this.currentTechniqueId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
    
    // Seed some techniques
    this.seedTechniques();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createTrainingLog(log: Omit<TrainingLog, "id">): Promise<TrainingLog> {
    const id = this.currentLogId++;
    const trainingLog = { ...log, id };
    this.trainingLogs.set(id, trainingLog);
    return trainingLog;
  }

  async getTrainingLogs(userId: number): Promise<TrainingLog[]> {
    return Array.from(this.trainingLogs.values()).filter(
      (log) => log.userId === userId
    );
  }

  async getTechniques(): Promise<Technique[]> {
    return Array.from(this.techniques.values());
  }

  async getTechniquesByCategory(category: string): Promise<Technique[]> {
    return Array.from(this.techniques.values()).filter(
      (technique) => technique.category === category
    );
  }

  private seedTechniques() {
    const basicTechniques: Omit<Technique, "id">[] = [
      {
        name: "Armbar from Guard",
        category: "submissions",
        description: "Basic armbar submission from closed guard position",
        videoUrl: "https://www.youtube.com/embed/example1",
        difficulty: "beginner"
      },
      {
        name: "Triangle Choke",
        category: "submissions",
        description: "Triangle choke submission from guard",
        videoUrl: "https://www.youtube.com/embed/example2",
        difficulty: "beginner"
      }
    ];

    basicTechniques.forEach((technique) => {
      const id = this.currentTechniqueId++;
      this.techniques.set(id, { ...technique, id });
    });
  }
}

export const storage = new MemStorage();
