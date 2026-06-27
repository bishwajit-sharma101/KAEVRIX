import "./config/initEnv.js";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import fs from "fs";

import connectDB from "./config/db.js";
import { init as initGameService } from "./services/gameService.js";
import { init as initMatchmakingService } from "./services/matchmakingService.js";
import apiRouter from "./routes/apiRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import { requireAuth, requireAdmin } from "./middleware/authMiddleware.js";
import { registerSocketHandlers } from "./sockets/socketHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiReliabilityMiddleware } from "./middleware/apiReliabilityMiddleware.js";
import { createAdapter } from "@socket.io/redis-adapter";
import redisClient from "./config/redis.js";

// Custom config and service imports
import logger, { logContextStorage } from "./config/logger.js";
import { metrics, generatePrometheusMetrics } from "./config/metrics.js";
import { aiWorker } from "./config/queue.js";

// Initialize Sentry
const pkg = JSON.parse(fs.readFileSync(new URL("./package.json", import.meta.url)));
const release = pkg.version;

Sentry.init({
  dsn: process.env.SENTRY_DSN || "",
  environment: process.env.NODE_ENV || "development",
  release: `kaevrix@${release}`,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  beforeSend(event, hint) {
    const error = hint.originalException;
    if (error && (error.statusCode < 500 || error.status < 500 || error.name === "ZodError" || error.name === "ValidationError")) {
      return null;
    }
    return event;
  }
});

const PORT = process.env.PORT || 5000;
const app = express();

// Request ID and Context propagation middleware
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  const correlationId = req.headers["x-correlation-id"] || crypto.randomUUID();
  // We can enrich the logger child format automatically
  req.requestId = requestId;
  req.correlationId = correlationId;
  res.setHeader("X-Request-ID", requestId);
  
  logContextStorage.run({ requestId, correlationId }, () => {
    next();
  });
});

// HTTP Prometheus tracking middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on("finish", () => {
    let route = req.route ? req.route.path : req.originalUrl.split("?")[0];
    route = route.replace(/\/[a-f0-9]{24}(\/|$)/gi, "/:id$1");
    route = route.replace(/\/profile\/[a-zA-Z0-9_\-]+(\/|$)/gi, "/profile/:username$1");
    route = route.replace(/\/chat\/messages\/[a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+(\/|$)/gi, "/chat/messages/:user1/:user2$1");
    
    const duration = Date.now() - startTime;
    metrics.incrementHttpRequests(req.method, route, res.statusCode);
    metrics.recordHttpRequestDuration(req.method, route, duration);
  });
  next();
});

// Security Middlewares
app.use(helmet());
app.use(mongoSanitize());
app.use(cookieParser());

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? process.env.CLIENT_URL 
    : (process.env.CLIENT_URL || "http://localhost:5173"),
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(apiReliabilityMiddleware);

const httpServer = createServer(app);
httpServer.timeout = 600000; 
httpServer.keepAliveTimeout = 600000;
httpServer.headersTimeout = 605000;

const subClient = redisClient.duplicate();
const io = new Server(httpServer, {
  cors: corsOptions
});
io.adapter(createAdapter(redisClient, subClient));
metrics.setSocketIo(io);

// Initialize services with io instance
initGameService(io);
initMatchmakingService(io);

// Health & Readiness endpoints
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get("/readyz", async (req, res) => {
  try {
    const mongoOk = (await import("mongoose")).default.connection.readyState === 1;
    const redisOk = redisClient.status === "ready";
    if (mongoOk && redisOk) {
      res.json({ status: "ready", mongo: "connected", redis: "connected" });
    } else {
      res.status(503).json({ status: "not ready", mongo: mongoOk ? "connected" : "disconnected", redis: redisOk ? "connected" : "disconnected" });
    }
  } catch (err) {
    res.status(503).json({ status: "not ready", error: err.message });
  }
});

// Metrics endpoint (Prometheus format)
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    const metricsText = await generatePrometheusMetrics();
    res.send(metricsText);
  } catch (err) {
    logger.error("Failed to generate metrics", { error: err.message, stack: err.stack });
    res.status(500).send("Error generating metrics");
  }
});

// Mount API Routes
app.use("/api/admin", requireAuth, requireAdmin, adminRouter);
app.use("/api", apiRouter);

// Sentry Error Handler
Sentry.setupExpressErrorHandler(app);

// Global Error Handler MUST be last
app.use(errorHandler);

// Register Socket handlers
registerSocketHandlers(io);

// Connect to Database and Start Server
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    logger.info(`========================================`);
    logger.info(` Kaevrix Backend Server Running on Port ${PORT}`);
    logger.info(` Environment: ${process.env.NODE_ENV || "development"}`);
    logger.info(`========================================`);
  });
});

// Graceful Shutdown Logic
async function gracefulShutdown(signal) {
  logger.info({ signal }, "Shutdown signal received, draining connections and resources...");
  
  const timeoutId = setTimeout(() => {
    logger.error("Shutdown timed out, forcing exit.");
    process.exit(1);
  }, 10000);
  timeoutId.unref();

  try {
    // 1. Close HTTP server
    httpServer.close(() => {
      logger.info("HTTP server closed.");
    });
    
    // 2. Close socket.io connections
    io.close(() => {
      logger.info("Socket.io connections closed.");
    });
    
    // 3. Pause and close BullMQ worker
    if (aiWorker) {
      await aiWorker.close();
      logger.info("BullMQ AI worker closed.");
    }
    
    // 4. Close Redis connections
    await redisClient.quit();
    await subClient.quit();
    logger.info("Redis connections closed.");
    
    // 5. Close MongoDB
    const mongoose = (await import("mongoose")).default;
    await mongoose.disconnect();
    logger.info("MongoDB connection closed.");
    
    logger.info("Graceful shutdown complete.");
    clearTimeout(timeoutId);
    process.exit(0);
  } catch (err) {
    logger.error("Error during graceful shutdown:", { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Process level error handlers
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { reason: reason instanceof Error ? reason.message : reason, stack: reason instanceof Error ? reason.stack : "" });
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(reason);
  }
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", { error: error.message, stack: error.stack });
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
  setTimeout(() => process.exit(1), 1000);
});

