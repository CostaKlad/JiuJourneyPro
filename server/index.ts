
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const PORT = process.env.PORT || "5000";

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration
const configureCors = (req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
};

// Request logging middleware
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
};

// Error handler middleware
const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
};

// Apply middleware
app.use(configureCors);
app.use(requestLogger);
app.use(errorHandler);

// Initialize server
(async () => {
  try {
    const server = await registerRoutes(app);

    if (process.env.NODE_ENV !== "production") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    server.listen(parseInt(PORT, 10), "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
      log(`Server running at http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
