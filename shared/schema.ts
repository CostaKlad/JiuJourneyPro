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

// Add achievement categories after the FocusArea enum
export const AchievementCategory = {
  TECHNIQUE_MASTERY: "technique_mastery",
  TRAINING_CONSISTENCY: "training_consistency", 
  SUBMISSION_MASTERY: "submission_mastery",
  ESCAPE_MASTERY: "escape_mastery",
  FOCUS_AREA: "focus_area"
} as const;

export const AchievementTier = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  DIAMOND: "diamond"
} as const;

// Update achievement requirements based on training activities
export const AchievementRequirements = {
  TECHNIQUE_MASTERY: {
    BRONZE: { count: 5, description: "Practice a technique 5 times" },
    SILVER: { count: 15, description: "Practice a technique 15 times" },
    GOLD: { count: 30, description: "Practice a technique 30 times" },
    DIAMOND: { count: 50, description: "Practice a technique 50 times" }
  },
  SUBMISSION_MASTERY: {
    BRONZE: { count: 3, description: "Successfully execute a submission 3 times" },
    SILVER: { count: 10, description: "Successfully execute a submission 10 times" },
    GOLD: { count: 20, description: "Successfully execute a submission 20 times" },
    DIAMOND: { count: 40, description: "Successfully execute a submission 40 times" }
  },
  ESCAPE_MASTERY: {
    BRONZE: { count: 3, description: "Successfully perform an escape 3 times" },
    SILVER: { count: 10, description: "Successfully perform an escape 10 times" },
    GOLD: { count: 20, description: "Successfully perform an escape 20 times" },
    DIAMOND: { count: 40, description: "Successfully perform an escape 40 times" }
  },
  TRAINING_CONSISTENCY: {
    BRONZE: { count: 5, description: "Log 5 training sessions" },
    SILVER: { count: 20, description: "Log 20 training sessions" },
    GOLD: { count: 50, description: "Log 50 training sessions" },
    DIAMOND: { count: 100, description: "Log 100 training sessions" }
  },
  FOCUS_AREA: {
    BRONZE: { count: 3, description: "Practice techniques from a focus area 3 times" },
    SILVER: { count: 10, description: "Practice techniques from a focus area 10 times" },
    GOLD: { count: 25, description: "Practice techniques from a focus area 25 times" },
    DIAMOND: { count: 50, description: "Practice techniques from a focus area 50 times" }
  }
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
  resetPasswordExpires: timestamp("reset_password_expires")
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
  techniques: json("techniques"),
  techniquesPracticed: json("techniques_practiced").default([]),
  rollingSummary: text("rolling_summary"),
  submissionsAttempted: json("submissions_attempted").default([]),
  submissionsSuccessful: json("submissions_successful").default([]),
  escapesAttempted: json("escapes_attempted").default([]),
  escapesSuccessful: json("escapes_successful").default([]),
  performanceRating: integer("performance_rating"),
  focusAreas: json("focus_areas").default([]),
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

// Update achievements table with new fields
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  tier: text("tier").notNull(),
  icon: text("icon").notNull(),
  pointValue: integer("point_value").notNull(),
  requirement: json("requirement").notNull(),
  progressMax: integer("progress_max").notNull(),
  howToEarn: text("how_to_earn").notNull() // Added field for clarity
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  earnedAt: timestamp("earned_at").notNull().defaultNow()
});

export const userAchievementProgress = pgTable("user_achievement_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  currentProgress: integer("current_progress").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
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

// Update the insert schema
export const insertAchievementSchema = createInsertSchema(achievements)
  .extend({
    category: z.enum([
      AchievementCategory.TECHNIQUE_MASTERY,
      AchievementCategory.TRAINING_CONSISTENCY,
      AchievementCategory.SUBMISSION_MASTERY,
      AchievementCategory.ESCAPE_MASTERY,
      AchievementCategory.FOCUS_AREA
    ]),
    tier: z.enum([
      AchievementTier.BRONZE,
      AchievementTier.SILVER,
      AchievementTier.GOLD,
      AchievementTier.DIAMOND
    ]),
    howToEarn: z.string()
  });
export const insertUserAchievementSchema = createInsertSchema(userAchievements).pick({
  userId: true,
  achievementId: true
});

export const insertAchievementProgressSchema = createInsertSchema(userAchievementProgress).pick({
  userId: true,
  achievementId: true,
  currentProgress: true
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
export type UserAchievementProgress = typeof userAchievementProgress.$inferSelect;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;