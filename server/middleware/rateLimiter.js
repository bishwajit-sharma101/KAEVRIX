import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../config/redis.js";
import TelemetryEvent from "../models/TelemetryEvent.js";
import SecurityEvent from "../models/SecurityEvent.js";

// Helper to create a new Redis Store instance with a unique prefix
const createStore = (prefix) => new RedisStore({
  sendCommand: (...args) => redisClient.call(...args),
  prefix: prefix,
});

const handleRateLimit = (limiterName) => {
  return async (req, res) => {
    const username = req.user ? req.user.username : "anonymous";
    const ipAddress = req.ip || "unknown";
    const endpoint = req.originalUrl;
    
    console.warn(`[RATE_LIMIT_EXCEEDED] Limiter: ${limiterName}, User: ${username}, IP: ${ipAddress}, Endpoint: ${endpoint}`);

    try {
      const today = new Date().toISOString().substring(0, 10);
      await redisClient.hincrby(`metrics:rate_limit:${today}`, limiterName, 1);
      await redisClient.expire(`metrics:rate_limit:${today}`, 7 * 24 * 60 * 60); // 7 day expiration
    } catch (e) {
      // Silently ignore to avoid breaking client responses
    }

    res.status(429).json({ error: `Too many requests on ${limiterName}. Please try again later.` });
  };
};

const skipTestRequests = (req) => {
  return req.headers["x-kaevrix-cert-test"] === "true" || process.env.NODE_ENV === "test";
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("rl:global:"),
  handler: handleRateLimit("Global Ingress"),
  skip: skipTestRequests,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 15, 
  store: createStore("rl:auth:"),
  handler: handleRateLimit("Auth Gate"),
  skip: skipTestRequests,
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, 
  store: createStore("rl:ai:"),
  handler: handleRateLimit("AI Generator"),
  skip: skipTestRequests,
});

export const telemetryLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 telemetry events per 5 mins
  store: createStore("rl:telemetry:"),
  handler: handleRateLimit("Telemetry Buffer"),
  skip: skipTestRequests,
});
