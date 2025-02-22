import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { getTrainingSuggestions, getPeerRecommendations } from "./openai";
import { insertTrainingLogSchema, insertCommentSchema } from "@shared/schema";
import { pointsService } from "./points-service";
import { achievementService } from "./achievement-service"; 

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Initialize achievements during server startup
  try {
    console.log("Initializing achievements during server startup...");
    await achievementService.initializeAchievements();
    console.log("Achievement initialization completed");
  } catch (error) {
    console.error("Error initializing achievements during startup:", error);
  }

  // Training logs
  app.post("/api/training-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      console.log("Training log request body:", req.body);
      const validatedData = insertTrainingLogSchema.parse(req.body);
      console.log("Validated training log data:", validatedData);

      const log = await storage.createTrainingLog({
        ...validatedData,
        userId: req.user.id,
        date: new Date(),
        techniquesPracticed: validatedData.techniquesPracticed || [],
        focusAreas: validatedData.focusAreas || [],
        submissionsAttempted: validatedData.submissionsAttempted || [],
        submissionsSuccessful: validatedData.submissionsSuccessful || [],
        escapesAttempted: validatedData.escapesAttempted || [],
        escapesSuccessful: validatedData.escapesSuccessful || [],
        performanceRating: validatedData.performanceRating || null,
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
        res.status(400).json({ 
          error: "Invalid training log data", 
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

  // Community Routes
  app.post("/api/follow/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const followingId = parseInt(req.params.userId);

    try {
      await storage.followUser(req.user.id, followingId);
      await pointsService.awardStreakPoints(followingId, 1); // Award points for gaining a follower
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
      await pointsService.awardTrainingPoints(req.user.id, 0, 1); // Small point reward for engagement

      // Award points to the training log owner for receiving a comment
      const logs = await storage.getTrainingLogs(req.user.id);
      const log = logs.find(l => l.id === logId);
      if (log && log.userId !== req.user.id) {
        await pointsService.awardTrainingPoints(log.userId, 0, 1); // Small point reward for receiving engagement
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

  // Achievement routes
  app.get("/api/achievements/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const progress = await achievementService.getAchievementProgress(req.user.id);
      res.json(progress);
    } catch (error) {
      console.error("Error getting achievement progress:", error);
      res.status(500).json({ error: "Failed to get achievement progress" });
    }
  });

  // Update achievement progress manually (if needed)
  app.post("/api/achievements/:id/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const achievementId = parseInt(req.params.id);
      const { progress } = req.body;

      await achievementService.updateProgress(
        req.user.id,
        achievementId,
        progress
      );

      res.sendStatus(200);
    } catch (error) {
      console.error("Error updating achievement progress:", error);
      res.status(500).json({ error: "Failed to update achievement progress" });
    }
  });

  // Add this endpoint after the existing community routes
  app.get("/api/peer-recommendations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Get user's profile and training data
      const user = await storage.getUser(req.user.id);
      const recentLogs = await storage.getTrainingLogs(req.user.id);
      const potentialPartners = await storage.getPotentialTrainingPartners(req.user.id);

      const userProfile = {
        beltRank: user.beltRank,
        techniques: recentLogs.flatMap(log => log.techniquesPracticed || []),
        goals: user.trainingGoals || [],
        trainingFrequency: recentLogs.length, // Simple estimate based on log count
        gym: user.gym
      };

      const recommendations = await getPeerRecommendations(
        req.user.id,
        userProfile,
        potentialPartners.map(partner => ({
          id: partner.id,
          beltRank: partner.beltRank,
          techniques: partner.techniques || [],
          goals: partner.goals || [],
          trainingFrequency: partner.trainingFrequency || 3,
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
        techniquesLearned,
        achievements: []
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

  const httpServer = createServer(app);
  return httpServer;
}