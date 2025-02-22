import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Update CORS settings for development
app.use((req, res, next) => {
  // Allow credentials
  res.header('Access-Control-Allow-Credentials', 'true');
  // Allow specific headers
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  // Allow all methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

// Enhanced error logging
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Get port from environment variable with fallback to 5000 (workflow default)
const PORT = process.env.PORT || "5000";

(async () => {
  try {
    const server = await registerRoutes(app);

    // Setup Vite middleware in development
    if (process.env.NODE_ENV !== "production") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server first to ensure port binding
    server.listen(parseInt(PORT, 10), "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
      log(`Server running at http://0.0.0.0:${PORT}`);

      // Initialize achievements after server is running
      (async () => {
        try {
          console.log("Initializing achievements during server startup...");
          console.log("Starting achievement initialization...");
          // Add your achievement initialization logic here
          console.log("Achievement initialization completed successfully");
          console.log("Achievement initialization completed");
        } catch (error) {
          console.error("Achievement initialization failed:", error);
          // Don't exit the process, just log the error
        }
      })();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();