import redisClient from "../config/redis.js";
import { curatedVideos } from "../quizData.js";
import logger from "../config/logger.js";
import { createHumanMatch, createBotMatch } from "./gameService.js";
import TelemetryEvent from "../models/TelemetryEvent.js";

export const localBotTimers = new Map();
let io = null;

export function init(socketIo) {
  io = socketIo;
}

// Subscribe to cancel bot timer signal globally (across nodes)
const matchmakingSubClient = redisClient.duplicate();
matchmakingSubClient.subscribe("game-signals");
matchmakingSubClient.on("message", (channel, message) => {
  if (channel === "game-signals") {
    try {
      const signal = JSON.parse(message);
      if (signal.type === "cancel-bot-timer") {
        const timer = localBotTimers.get(signal.socketId);
        if (timer) {
          clearTimeout(timer);
          localBotTimers.delete(signal.socketId);
          logger.info(`[Queue Signals] Cancelled bot timer globally for socket: ${signal.socketId}`, { socketId: signal.socketId });
        }
      }
    } catch (err) {
      logger.error("[Queue Signals] Failed to parse matchmaking queue signal message", { error: err.message, stack: err.stack });
    }
  }
});

export async function joinQueue(socket, { username, avatar, selectedClass, videoId, videoTitle, videoChannel, videoDuration, videoThumbnail, vsBot }) {
  logger.info(`[Queue] Player "${username}" requested match`, { socketId: socket.id, username, videoId: videoId || "QuickMatch", vsBot });
  
  TelemetryEvent.create({
    username,
    eventType: "SANCTUM_MATCHMAKING_STARTED",
    metadata: { videoId: videoId || "QuickMatch", vsBot }
  }).catch(err => logger.error("Telemetry failed in queue joining", { error: err.message }));

  // Store profile metadata on local socket instance
  socket.username = username;
  socket.avatar = avatar;
  socket.selectedClass = selectedClass || "doomscroller";
  
  if (videoId) {
    socket.queuedVideoTitle = videoTitle;
    socket.queuedVideoChannel = videoChannel;
    socket.queuedVideoDuration = Number(videoDuration) || 300;
    socket.queuedVideoThumbnail = videoThumbnail;
    socket.queuedVideoId = videoId;
  } else {
    socket.queuedVideoId = null;
  }
  
  socket.vsBot = vsBot;

  // Construct metadata payload to serialize in Redis
  const meta = {
    username,
    avatar,
    selectedClass: selectedClass || "doomscroller",
    queuedVideoTitle: videoTitle,
    queuedVideoChannel: videoChannel,
    queuedVideoDuration: Number(videoDuration) || 300,
    queuedVideoThumbnail: videoThumbnail,
    vsBot
  };

  // Write profile to Redis so any matched node can read details
  await redisClient.set(`socket:meta:${socket.id}`, JSON.stringify(meta), "EX", 600); // 10 minute retention

  const queueKey = videoId ? `queue:video:${videoId}` : `queue:quick`;

  // Remove any previous duplicate socket entries in queue
  await redisClient.lrem(queueKey, 0, socket.id);

  let opponentId = null;

  // Find a valid connected opponent in queue
  while (true) {
    opponentId = await redisClient.lpop(queueKey);
    if (!opponentId) break;

    // Check if opponent popped is still connected to the cluster
    const sockets = await io.in(opponentId).fetchSockets();
    if (sockets.length > 0) {
      break; // Found valid connected opponent!
    } else {
      // Discard disconnected socket metadata
      await redisClient.del(`socket:meta:${opponentId}`);
    }
  }

  if (opponentId) {
    // Match found! Cancel pending bot timers globally
    await Promise.all([
      redisClient.publish("game-signals", JSON.stringify({ type: "cancel-bot-timer", socketId: socket.id })),
      redisClient.publish("game-signals", JSON.stringify({ type: "cancel-bot-timer", socketId: opponentId }))
    ]);

    // Retrieve metadata for matching players
    const opponentMetaRaw = await redisClient.get(`socket:meta:${opponentId}`);
    const opponentMeta = opponentMetaRaw ? JSON.parse(opponentMetaRaw) : {};

    // Remove metadata entries from Redis
    await Promise.all([
      redisClient.del(`socket:meta:${socket.id}`),
      redisClient.del(`socket:meta:${opponentId}`)
    ]);

    if (videoId) {
      await createHumanMatch(socket.id, meta, opponentId, opponentMeta, videoId);
    } else {
      const randomVideo = curatedVideos[Math.floor(Math.random() * curatedVideos.length)];
      await createHumanMatch(socket.id, meta, opponentId, opponentMeta, randomVideo.id, randomVideo);
    }
  } else {
    // Add socket to queue list in Redis
    await redisClient.rpush(queueKey, socket.id);
    logger.info(`[Queue] Socket joined matchmaking queue`, { socketId: socket.id, queueKey });

    if (vsBot) {
      const timer = setTimeout(async () => {
        localBotTimers.delete(socket.id);
        const removed = await redisClient.lrem(queueKey, 1, socket.id);
        if (removed > 0) {
          await redisClient.del(`socket:meta:${socket.id}`);
          logger.info(`[Queue] 60s timeout reached, starting Bot Match`, { socketId: socket.id });
          if (videoId) {
            await createBotMatch(socket.id, meta, videoId, {
              title: videoTitle,
              channel: videoChannel,
              duration: Number(videoDuration) || 300,
              thumbnail: videoThumbnail
            });
          } else {
            await createBotMatch(socket.id, meta, null);
          }
        }
      }, 60000);
      localBotTimers.set(socket.id, timer);
    }
  }
}

export function leaveQueue(socket) {
  if (socket.username) {
    TelemetryEvent.create({
      username: socket.username,
      eventType: "SANCTUM_ABANDONED",
      metadata: { reason: "left_queue", videoId: socket.queuedVideoId || "QuickMatch" }
    }).catch(err => logger.error("Telemetry failed in queue leaving", { error: err.message }));
  }
  cleanUpQueue(socket);
}

export async function cleanUpQueue(socket) {
  const timer = localBotTimers.get(socket.id);
  if (timer) {
    clearTimeout(timer);
    localBotTimers.delete(socket.id);
  }
  await redisClient.publish("game-signals", JSON.stringify({ type: "cancel-bot-timer", socketId: socket.id }));

  await redisClient.del(`socket:meta:${socket.id}`);

  await redisClient.lrem(`queue:quick`, 0, socket.id);
  if (socket.queuedVideoId) {
    await redisClient.lrem(`queue:video:${socket.queuedVideoId}`, 0, socket.id);
  }
}
