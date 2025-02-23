import { pgTable, text, serial, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const TrainingType = {
  GI: "gi",
  NOGI: "nogi",
  OPEN_MAT: "open_mat"
} as const;

export const AuthProvider = {
  LOCAL: "local",
  GOOGLE: "google",
  FACEBOOK: "facebook"
} as const;

export const FocusArea = {
  GUARD: "guard",
  PASSING: "passing",
  ESCAPES: "escapes",
  SUBMISSIONS: "submissions",
  TAKEDOWNS: "takedowns",
  POSITION_CONTROL: "position_control"
} as const;

// Add predefined BJJ techniques
export const BJJTechniques = {
  SUBMISSIONS: [
    "Armbar",
    "Triangle Choke",
    "Kimura",
    "Omoplata",
    "Guillotine Choke",
    "Rear Naked Choke",
    "Americana",
    "Cross Collar Choke",
    "Loop Choke",
    "D'Arce Choke",
    "Anaconda Choke",
    "Heel Hook",
    "Straight Ankle Lock",
    "Toe Hold",
    "Kneebar"
  ],
  POSITIONS_AND_SWEEPS: [
    "Half Guard Pass",
    "Closed Guard Pass",
    "De La Riva Guard Retention",
    "Butterfly Guard Sweeps",
    "X-Guard Sweeps"
  ],
  ESCAPES: [
    "Side Control Escape",
    "Mount Escape",
    "Back Escape",
    "Triangle Escape",
    "Armbar Escape",
    "Kimura Escape",
    "Guillotine Escape",
    "Heel Hook Escape",
    "Toe Hold Escape"
  ]
} as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  beltRank: text("belt_rank").notNull().default("white"),
  gym: text("gym"),
  goals: text("goals"),
  totalPoints: integer("total_points").notNull().default(0),
  level: integer("level").notNull().default(1),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  avatarUrl: text("avatar_url")
});

// Strong password validation schema
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Update the insert schema with new validation
export const insertUserSchema = createInsertSchema(users)
  .extend({
    password: passwordSchema,
    email: z.string().email("Invalid email address"),
  });

// Create reset password schema
export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: passwordSchema
});

// Create forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address")
});

// Updated training logs schema
export const trainingLogs = pgTable("training_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  type: text("type").notNull(),
  gym: text("gym"),
  techniques: json("techniques").$type<string[]>().default([]),
  techniquesPracticed: json("techniques_practiced").$type<string[]>().default([]),
  rollingSummary: text("rolling_summary"),
  submissionsAttempted: json("submissions_attempted").$type<string[]>().default([]),
  submissionsSuccessful: json("submissions_successful").$type<string[]>().default([]),
  escapesAttempted: json("escapes_attempted").$type<string[]>().default([]),
  escapesSuccessful: json("escapes_successful").$type<string[]>().default([]),
  performanceRating: integer("performance_rating"),
  focusAreas: json("focus_areas").$type<string[]>().default([]),
  energyLevel: integer("energy_level"),
  notes: text("notes"),
  coachFeedback: text("coach_feedback"),
  duration: integer("duration").notNull()
});

export const insertTrainingLogSchema = createInsertSchema(trainingLogs)
  .pick({
    type: true,
    gym: true,
    techniquesPracticed: true,
    rollingSummary: true,
    submissionsAttempted: true,
    submissionsSuccessful: true,
    escapesAttempted: true,
    escapesSuccessful: true,
    performanceRating: true,
    focusAreas: true,
    energyLevel: true,
    notes: true,
    coachFeedback: true,
    duration: true
  })
  .extend({
    type: z.enum([TrainingType.GI, TrainingType.NOGI, TrainingType.OPEN_MAT]),
    duration: z.coerce
      .number()
      .min(1, "Duration must be at least 1 minute")
      .max(480, "Duration cannot exceed 8 hours"),
    performanceRating: z.coerce
      .number()
      .min(1, "Rating must be between 1 and 5")
      .max(5)
      .optional(),
    energyLevel: z.coerce
      .number()
      .min(1, "Energy level must be between 1 and 5")
      .max(5)
      .optional(),
    focusAreas: z.array(z.enum([
      FocusArea.GUARD,
      FocusArea.PASSING,
      FocusArea.ESCAPES,
      FocusArea.SUBMISSIONS,
      FocusArea.TAKEDOWNS,
      FocusArea.POSITION_CONTROL
    ])).default([]),
    techniquesPracticed: z.array(z.string()).default([]),
    submissionsAttempted: z.array(z.string()).default([]),
    submissionsSuccessful: z.array(z.string()).default([]),
    escapesAttempted: z.array(z.string()).default([]),
    escapesSuccessful: z.array(z.string()).default([]),
    gym: z.string().optional().nullable(),
    rollingSummary: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    coachFeedback: z.string().optional().nullable()
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

export const insertTechniqueSchema = createInsertSchema(techniques);
export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type TrainingLog = typeof trainingLogs.$inferSelect;
export type Technique = typeof techniques.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Follower = typeof followers.$inferSelect;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;