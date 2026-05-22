import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

import { loadLeaderboard } from "./services/leaderboardService.js";
import { init as initGameService } from "./services/gameService.js";
import { init as initMatchmakingService } from "./services/matchmakingService.js";
import apiRouter from "./routes/apiRoutes.js";
import { registerSocketHandlers } from "./sockets/socketHandler.js";

const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
httpServer.timeout = 600000; // 10 minutes timeout for long-running AI requests
httpServer.keepAliveTimeout = 600000;
httpServer.headersTimeout = 605000;

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Load persistent data
loadLeaderboard();

// Initialize services with io instance
initGameService(io);
initMatchmakingService(io);

// Mount API routes
app.use("/api", apiRouter);

// Register Socket handlers
registerSocketHandlers(io);

// Start Server
httpServer.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` ytPlay Backend Server Running on Port ${PORT}`);
  console.log(`========================================`);
});
