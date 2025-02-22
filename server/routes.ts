import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { getTrainingSuggestions, getPeerRecommendations } from "./openai"; // Added import for getPeerRecommendations
import { insertTrainingLogSchema, insertCommentSchema, insertChallengeSchema, insertChallengeParticipationSchema } from "@shared/schema";
import { pointsService, PointsService } from "./points-service";
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
      const validatedData = insertTrainingLogSchema.parse(req.body);
      console.log("Creating training log with data:", validatedData);

      const log = await storage.createTrainingLog({
        ...validatedData,
        userId: req.user.id,
        date: new Date(),
        techniques: validatedData.techniquesPracticed || [],
        gym: validatedData.gym || null,
        rollingSummary: validatedData.rollingSummary || null,
        submissionsAttempted: validatedData.submissionsAttempted || [],
        submissionsSuccessful: validatedData.submissionsSuccessful || [],
        escapesAttempted: validatedData.escapesAttempted || [],
        escapesSuccessful: validatedData.escapesSuccessful || []
      });

      // Award points for training session
      const techniquesCount = validatedData.techniquesPracticed?.length || 0;

      console.log(`Awarding points for training session - userId: ${req.user.id}, duration: ${validatedData.duration}, techniques: ${techniquesCount}`);

      await pointsService.awardTrainingPoints(
        req.user.id,
        validatedData.duration,
        techniquesCount
      );

      res.json(log);
    } catch (error) {
      console.error("Error creating training log:", error instanceof Error ? error.message : 'Unknown error');
      res.status(400).json({ 
        error: "Invalid training log data", 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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

  // Add these routes before the final httpServer creation
  app.get("/api/challenges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const challenges = await storage.getChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Error getting challenges:", error);
      res.status(500).json({ error: "Failed to get challenges" });
    }
  });

  app.get("/api/challenges/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const challenge = await storage.getChallenge(parseInt(req.params.id));
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      res.json(challenge);
    } catch (error) {
      console.error("Error getting challenge:", error);
      res.status(500).json({ error: "Failed to get challenge" });
    }
  });

  app.get("/api/challenges/:id/leaderboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const leaderboard = await storage.getChallengeLeaderboard(parseInt(req.params.id));
      res.json(leaderboard);
    } catch (error) {
      console.error("Error getting challenge leaderboard:", error);
      res.status(500).json({ error: "Failed to get challenge leaderboard" });
    }
  });

  app.post("/api/challenges/:id/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const challengeId = parseInt(req.params.id);
      const participation = await storage.joinChallenge(req.user.id, challengeId);
      res.status(201).json(participation);
    } catch (error) {
      console.error("Error joining challenge:", error);
      res.status(500).json({ error: "Failed to join challenge" });
    }
  });

  app.post("/api/challenges/:id/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const challengeId = parseInt(req.params.id);
      const { progress } = req.body;

      const updatedParticipation = await storage.updateChallengeProgress(
        req.user.id,
        challengeId,
        progress
      );

      res.json(updatedParticipation);
    } catch (error) {
      console.error("Error updating challenge progress:", error);
      res.status(500).json({ error: "Failed to update challenge progress" });
    }
  });

  // Add for administrators or moderators
  app.post("/api/challenges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // TODO: Add admin check here

    try {
      const data = insertChallengeSchema.parse(req.body);
      const challenge = await storage.createChallenge(data);
      res.status(201).json(challenge);
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(400).json({ error: "Invalid challenge data" });
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

  const httpServer = createServer(app);
  return httpServer;
}