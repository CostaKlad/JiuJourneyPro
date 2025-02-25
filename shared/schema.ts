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

// Enhanced BJJ techniques structure
export const Positions = {
  MOUNT: "mount",
  GUARD: "guard",
  SIDE_CONTROL: "side-control",
  BACK: "back",
  HALF_GUARD: "half-guard",
  TURTLE: "turtle",
  KNEE_ON_BELLY: "knee-on-belly",
  STANDING: "standing"
} as const;

export const BeltRanks = {
  WHITE: "white",
  BLUE: "blue",
  PURPLE: "purple",
  BROWN: "brown",
  BLACK: "black"
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
    "Kneebar",
    "Ezekiel Choke",
    "Baseball Bat Choke",
    "Bow and Arrow Choke",
    "North-South Choke",
    "Wrist Lock",
    "Bicep Slicer",
    "Calf Slicer",
    "Gogoplata",
    "Paper Cutter Choke",
    "Clock Choke"
  ],
  SWEEPS: [
    "Scissor Sweep",
    "Hip Bump Sweep",
    "Flower Sweep",
    "Pendulum Sweep",
    "Butterfly Sweep",
    "X-Guard Sweep",
    "Single Leg X Sweep",
    "De La Riva Sweep",
    "Sickle Sweep",
    "Spider Guard Sweep",
    "Lasso Sweep",
    "Tripod Sweep",
    "Hook Sweep",
    "Push Sweep",
    "Overhead Sweep"
  ],
  POSITIONS_AND_CONTROLS: [
    "Half Guard Pass",
    "Closed Guard Pass",
    "De La Riva Guard Retention",
    "Butterfly Guard Control",
    "X-Guard Entry",
    "Spider Guard Control",
    "Lasso Guard Setup",
    "Knee Shield Position",
    "Deep Half Guard",
    "Single Leg X Position",
    "Reverse De La Riva",
    "Berimbolo Setup",
    "50/50 Position",
    "Quarter Guard",
    "Turtle Position"
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
    "Toe Hold Escape",
    "Kneebar Escape",
    "North-South Escape",
    "Knee on Belly Escape",
    "Front Headlock Escape",
    "Crucifix Escape",
    "Guard Pass Prevention"
  ],
  TAKEDOWNS: [
    "Double Leg Takedown",
    "Single Leg Takedown",
    "Hip Throw",
    "Ankle Pick",
    "Snap Down",
    "Duck Under",
    "Arm Drag",
    "Pull Guard",
    "Sacrifice Throw",
    "Foot Sweep",
    "Body Lock Takedown",
    "Double Ankle Pick",
    "High Crotch",
    "Lateral Drop",
    "Inside Trip"
  ],
  DRILLS: [
    "Forward Roll",
    "Backward Roll",
    "Shrimp Drill",
    "Bridge Drill",
    "Technical Stand Up",
    "Hip Switch",
    "Sprawl Drill",
    "Guard Retention Drill",
    "Break Fall",
    "Side Break Fall",
    "Back Break Fall",
    "Forward Break Fall",
    "Grip Fighting Drill",
    "Movement Flow Drill",
    "Balance Drill"
  ]
} as const;

// Update techniques table schema
export const techniques = pgTable("techniques", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position").notNull(),
  difficulty: text("difficulty").notNull(),
  description: text("description").notNull(),
  prerequisites: json("prerequisites").$type<number[]>().default([]),
  category: text("category").notNull(),
  isUnlocked: boolean("is_unlocked").default(false),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Create technique progress tracking table
export const techniqueProgress = pgTable("technique_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  techniqueId: integer("technique_id").notNull(),
  status: text("status").notNull().default("locked"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  rating: integer("rating"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

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


export const followers = pgTable("followers", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Add profile comments table
export const profileComments = pgTable("profile_comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // User whose profile is being commented on
  commenterId: integer("commenter_id").notNull(), // User who made the comment
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Add schema for profile comments
export const insertProfileCommentSchema = createInsertSchema(profileComments)
  .pick({
    content: true
  });

// Add type for profile comments
export type ProfileComment = typeof profileComments.$inferSelect;

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