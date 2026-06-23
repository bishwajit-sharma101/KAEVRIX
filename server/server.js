import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import { init as initGameService } from "./services/gameService.js";
import { init as initMatchmakingService } from "./services/matchmakingService.js";
import apiRouter from "./routes/apiRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import { requireAuth, requireAdmin } from "./middleware/authMiddleware.js";
import { registerSocketHandlers } from "./sockets/socketHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiReliabilityMiddleware } from "./middleware/apiReliabilityMiddleware.js";

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN || "", // Ensure you add SENTRY_DSN to .env
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

const PORT = process.env.PORT || 5000;
const app = express();

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

const io = new Server(httpServer, {
  cors: corsOptions
});

// Initialize services with io instance
initGameService(io);
initMatchmakingService(io);

// Mount API// Routes
app.use("/api/admin", requireAuth, requireAdmin, adminRouter);
app.use("/api", apiRouter);

// Global Error Handler MUST be last
app.use(errorHandler);

// Register Socket handlers
registerSocketHandlers(io);

// Connect to Database and Start Server
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`========================================`);
    console.log(` Kaevrix Backend Server Running on Port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`========================================`);
  });
});
