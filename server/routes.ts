import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { getTrainingSuggestions } from "./openai";
import { insertTrainingLogSchema } from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
