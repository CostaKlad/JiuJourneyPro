import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { getTrainingSuggestions } from "./openai";
import { insertTrainingLogSchema, insertCommentSchema } from "@shared/schema";
import { pointsService } from "./points-service";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Training logs
  app.post("/api/training-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertTrainingLogSchema.parse(req.body);
      const log = await storage.createTrainingLog({
        ...validatedData,
        userId: req.user.id,
        date: new Date()
      });

      // Award points for training session
      await pointsService.awardTrainingPoints(
        req.user.id,
        validatedData.duration,
        (validatedData.techniques as any[]).length
      );

      res.json(log);
    } catch (error) {
      res.status(400).json({ error: "Invalid training log data" });
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
      res.status(500).json({ error: "Failed to get training suggestions" });
    }
  });

  // New Community Routes
  app.post("/api/follow/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const followingId = parseInt(req.params.userId);

    try {
      await storage.followUser(req.user.id, followingId);
      // Award points for gaining a follower
      await pointsService.addPoints(
        followingId,
        pointsService.POINT_VALUES.FOLLOWER_GAINED,
        'social',
        'Gained a new follower'
      );
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
      await pointsService.addPoints(
        req.user.id,
        pointsService.POINT_VALUES.COMMENT_MADE,
        'social',
        'Made a comment on a training log'
      );

      // Award points to the training log owner for receiving a comment
      const log = await storage.getTrainingLog(logId);
      if (log && log.userId !== req.user.id) {
        await pointsService.addPoints(
          log.userId,
          pointsService.POINT_VALUES.RECEIVED_COMMENT,
          'social',
          'Received a comment on training log'
        );
      }

      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ error: "Invalid comment data" });
    }
  });

  // New points system routes
  app.get("/api/points/summary", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const summary = await pointsService.getPointsSummary(req.user.id);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to get points summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}