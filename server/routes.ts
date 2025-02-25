import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from 'multer';
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { getTrainingSuggestions, getPeerRecommendations } from "./openai";
import { insertTrainingLogSchema, insertCommentSchema, insertProfileCommentSchema } from "@shared/schema";
import { pointsService } from "./points-service";
import { StorageError } from "./storage";

// Temporarily store files in memory
const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Training logs
  app.post("/api/training-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      console.log("Training log request body:", req.body);

      const validationResult = insertTrainingLogSchema.safeParse(req.body);

      if (!validationResult.success) {
        console.error("Validation errors:", validationResult.error.format());
        return res.status(400).json({
          error: "Invalid training log data",
          details: validationResult.error.format()
        });
      }

      const validatedData = validationResult.data;
      console.log("Validated training log data:", validatedData);

      const log = await storage.createTrainingLog({
        userId: req.user.id,
        date: new Date(),
        type: validatedData.type,
        gym: validatedData.gym || null,
        techniques: validatedData.techniquesPracticed || [], // Add techniques field
        techniquesPracticed: validatedData.techniquesPracticed || [],
        rollingSummary: validatedData.rollingSummary || null,
        submissionsAttempted: validatedData.submissionsAttempted || [],
        submissionsSuccessful: validatedData.submissionsSuccessful || [],
        escapesAttempted: validatedData.escapesAttempted || [],
        escapesSuccessful: validatedData.escapesSuccessful || [],
        performanceRating: validatedData.performanceRating || null,
        focusAreas: validatedData.focusAreas || [],
        energyLevel: validatedData.energyLevel || null,
        notes: validatedData.notes || null,
        coachFeedback: validatedData.coachFeedback || null,
        duration: validatedData.duration
      });

      console.log("Created training log:", log);

      // Award points for training session
      const techniquesCount = validatedData.techniquesPracticed?.length || 0;
      await pointsService.awardTrainingPoints(
        req.user.id,
        validatedData.duration,
        techniquesCount
      );

      res.json(log);
    } catch (error) {
      console.error("Error creating training log:", error);
      if (error instanceof Error) {
        res.status(500).json({
          error: "Failed to create training log",
          details: error.message
        });
      } else {
        res.status(500).json({
          error: "Failed to create training log",
          details: "Unknown error occurred"
        });
      }
    }
  });

  app.get("/api/training-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const logs = await storage.getTrainingLogs(req.user.id);
    res.json(logs);
  });

  // Techniques
  app.get("/api/techniques", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const techniques = await storage.getTechniques();
    res.json(techniques);
  });

  app.get("/api/techniques/:category", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const techniques = await storage.getTechniquesByCategory(req.params.category);
    res.json(techniques);
  });

  // AI Training Suggestions
  app.get("/api/suggestions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const recentLogs = await storage.getTrainingLogs(req.user.id);
      const suggestions = await getTrainingSuggestions(
        recentLogs,
        req.user.beltRank
      );
      res.json(suggestions);
    } catch (error) {
      console.error("OpenAI API error:", error instanceof Error ? error.message : 'Unknown error');
      res.json({
        focusAreas: ["Focus on fundamentals"],
        suggestedTechniques: ["Basic guard passes", "Submissions from mount"],
        trainingTips: ["Train consistently", "Stay hydrated"]
      });
    }
  });

  // Add these new routes before the existing community routes
  app.get("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if the current user is following this user
      const isFollowing = await storage.isFollowing(req.user.id, userId);

      // Remove sensitive information before sending
      const { password, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;

      res.json({
        ...safeUser,
        isFollowing
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id/activity", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = parseInt(req.params.id);
      const logs = await storage.getTrainingLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ error: "Failed to fetch user activity" });
    }
  });

  app.get("/api/users/:id/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = parseInt(req.params.id);
      const trainingLogs = await storage.getTrainingLogs(userId);

      const totalSessions = trainingLogs.length;
      const totalHours = trainingLogs.reduce((acc, log) => acc + (log.duration / 60), 0);
      const techniquesLearned = new Set(
        trainingLogs.flatMap(log => log.techniquesPracticed || [])
      ).size;

      res.json({
        totalSessions,
        totalHours,
        techniquesLearned
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  // Add profile comments routes
  app.post("/api/users/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = parseInt(req.params.id);

    try {
      const { content } = insertProfileCommentSchema.parse(req.body);
      const comment = await storage.createProfileComment(userId, req.user.id, content);

      // Award points for social interaction
      await pointsService.awardTrainingPoints(req.user.id, 0, 1);

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating profile comment:", error);
      res.status(400).json({ error: "Invalid comment data" });
    }
  });

  app.get("/api/users/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = parseInt(req.params.id);

    try {
      const comments = await storage.getProfileComments(userId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching profile comments:", error);
      res.status(500).json({ error: "Failed to fetch profile comments" });
    }
  });


  // Community Routes
  app.post("/api/follow/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const followingId = parseInt(req.params.userId);

    try {
      await storage.followUser(req.user.id, followingId);
      await pointsService.awardStreakPoints(followingId, 1);
      res.sendStatus(200);
    } catch (error) {
      res.status(400).json({ error: "Failed to follow user" });
    }
  });

  app.post("/api/unfollow/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const followingId = parseInt(req.params.userId);

    try {
      await storage.unfollowUser(req.user.id, followingId);
      res.sendStatus(200);
    } catch (error) {
      res.status(400).json({ error: "Failed to unfollow user" });
    }
  });

  app.get("/api/followers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const followers = await storage.getFollowers(req.user.id);
    res.json(followers);
  });

  app.get("/api/following", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const following = await storage.getFollowing(req.user.id);
    res.json(following);
  });

  app.get("/api/is-following/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const followingId = parseInt(req.params.userId);
    const isFollowing = await storage.isFollowing(req.user.id, followingId);
    res.json({ isFollowing });
  });

  app.post("/api/training-logs/:logId/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const logId = parseInt(req.params.logId);

    try {
      const { content } = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(req.user.id, logId, content);

      // Award points for making a comment
      await pointsService.awardTrainingPoints(req.user.id, 0, 1);

      // Award points to the training log owner for receiving a comment
      const logs = await storage.getTrainingLogs(req.user.id);
      const log = logs.find(l => l.id === logId);
      if (log && log.userId !== req.user.id) {
        await pointsService.awardTrainingPoints(log.userId, 0, 1);
      }

      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ error: "Invalid comment data" });
    }
  });

  // Points system routes
  app.get("/api/points/summary", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const summary = await pointsService.getPointsSummary(req.user.id);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to get points summary" });
    }
  });

  // Training Wizard Routes
  app.post("/api/wizard/recommendations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { trainingFrequency, focusAreas, goals } = req.body;
      const recentLogs = await storage.getTrainingLogs(req.user.id);
      const recommendations = await getTrainingSuggestions(
        recentLogs,
        req.user.beltRank,
        {
          trainingFrequency,
          focusAreas,
          goals
        }
      );
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting recommendations:", error instanceof Error ? error.message : 'Unknown error');
      res.status(500).json({
        error: "Failed to get recommendations",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add this endpoint after the existing community routes
  app.get("/api/peer-recommendations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Get user's profile and training data
      const user = await storage.getUser(req.user.id);
      const recentLogs = await storage.getTrainingLogs(req.user.id);
      const potentialPartners = await storage.getAllUsers();

      const userProfile = {
        beltRank: user?.beltRank || 'white',
        techniques: recentLogs.flatMap(log => log.techniquesPracticed || []),
        goals: user?.goals?.split(',') || [],
        trainingFrequency: recentLogs.length,
        gym: user?.gym || undefined // Change null to undefined
      };

      const recommendations = await getPeerRecommendations(
        req.user.id,
        userProfile,
        potentialPartners
          .filter(p => p.id !== req.user.id)
          .map(partner => ({
            id: partner.id,
            beltRank: partner.beltRank,
            techniques: [],
            goals: partner.goals?.split(',') || [],
            trainingFrequency: 3,
            gym: partner.gym
          })),
        recentLogs
      );

      res.json(recommendations);
    } catch (error) {
      console.error("Error getting peer recommendations:", error);
      res.status(500).json({
        error: "Failed to get peer recommendations",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add these routes to handle community and user stats
  app.get("/api/user/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const trainingLogs = await storage.getTrainingLogs(req.user.id);
      const totalSessions = trainingLogs.length;
      const totalHours = trainingLogs.reduce((acc, log) => acc + (log.duration / 60), 0);
      const techniquesLearned = new Set(trainingLogs.flatMap(log => log.techniquesPracticed || [])).size;

      res.json({
        totalSessions,
        totalHours,
        techniquesLearned
      });
    } catch (error) {
      console.error("Error getting user stats:", error);
      res.status(500).json({ error: "Failed to get user stats" });
    }
  });

  app.get("/api/community/feed", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const following = await storage.getFollowing(req.user.id);
      const followingIds = following.map(f => f.id);
      const userIds = [req.user.id, ...followingIds];

      const allLogs = await Promise.all(
        userIds.map(userId => storage.getTrainingLogs(userId))
      );

      const feedLogs = allLogs
        .flat()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20);

      res.json(feedLogs);
    } catch (error) {
      console.error("Error getting community feed:", error);
      res.status(500).json({ error: "Failed to get community feed" });
    }
  });

  app.get("/api/community/suggestions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Get all users except the current user and those they already follow
      const following = await storage.getFollowing(req.user.id);
      const followingIds = following.map(f => f.id);

      const allUsers = await storage.getAllUsers();
      const suggestions = allUsers
        .filter(u => u.id !== req.user.id && !followingIds.includes(u.id))
        .slice(0, 5);

      res.json(suggestions);
    } catch (error) {
      console.error("Error getting suggestions:", error);
      res.status(500).json({ error: "Failed to get suggestions" });
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  app.patch("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { gym } = req.body;
      const updatedUser = await storage.updateUser(req.user.id, { gym });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Update avatar routes with proper implementation
  app.post("/api/user/avatar", upload.single('avatar'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG and GIF images are allowed.' });
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }

      // Convert file to base64 for storage
      const base64Image = req.file.buffer.toString('base64');
      const avatarUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      // Update user's avatar URL in database
      const updatedUser = await storage.updateUser(req.user.id, { avatarUrl });

      res.json({ 
        url: updatedUser.avatarUrl,
        message: 'Avatar updated successfully' 
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ error: 'Failed to upload avatar. Please try again.' });
    }
  });

  app.get("/api/user/avatar/:userId", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.userId));
      if (!user || !user.avatarUrl) {
        return res.json({ url: '/default-avatar.png' });
      }
      res.json({ url: user.avatarUrl });
    } catch (error) {
      console.error('Error fetching avatar:', error);
      res.status(500).json({ error: 'Failed to fetch avatar' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}