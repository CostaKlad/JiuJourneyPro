import { pgTable, text, serial, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  beltRank: text("belt_rank").notNull().default("white"),
  gym: text("gym"),
  goals: text("goals"),
  totalPoints: integer("total_points").notNull().default(0),
  level: integer("level").notNull().default(1)
});

export const trainingLogs = pgTable("training_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  type: text("type").notNull(),
  techniques: json("techniques").notNull(),
  notes: text("notes"),
  duration: integer("duration").notNull()
});

export const techniques = pgTable("techniques", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url"),
  difficulty: text("difficulty").notNull()
});

export const followers = pgTable("followers", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  trainingLogId: integer("training_log_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), 
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), 
  pointValue: integer("point_value").notNull(),
  requirement: json("requirement").notNull() 
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  earnedAt: timestamp("earned_at").notNull().defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  beltRank: true,
  gym: true,
  goals: true,
  totalPoints: true,
  level: true
});

export const insertTrainingLogSchema = createInsertSchema(trainingLogs)
  .pick({
    type: true,
    techniques: true,
    notes: true,
    duration: true
  })
  .extend({
    duration: z.coerce
      .number()
      .min(1, "Duration must be at least 1 minute")
      .max(480, "Duration cannot exceed 8 hours")
  });

export const insertTechniqueSchema = createInsertSchema(techniques);

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true
});

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).pick({
  userId: true,
  amount: true,
  type: true,
  description: true
});

export const insertAchievementSchema = createInsertSchema(achievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements).pick({
  userId: true,
  achievementId: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type TrainingLog = typeof trainingLogs.$inferSelect;
export type Technique = typeof techniques.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Follower = typeof followers.$inferSelect;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;