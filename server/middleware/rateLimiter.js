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
    
    // Log to TelemetryEvent
    try {
      await TelemetryEvent.create({
        username,
        eventType: "RATE_LIMIT_EXCEEDED",
        ipAddress,
        pagePath: endpoint,
        metadata: { limiter: limiterName }
      });
    } catch (e) {
      console.error("Telemetry rate limit log failed:", e.message);
    }

    // Log to SecurityEvent
    try {
      await SecurityEvent.create({
        username,
        ipAddress,
        eventType: "RATE_LIMIT",
        endpoint,
        severity: "Warning",
        details: { limiter: limiterName }
      });
    } catch (e) {
      console.error("Security rate limit log failed:", e.message);
    }

    res.status(429).json({ error: `Too many requests on ${limiterName}. Please try again later.` });
  };
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("rl:global:"),
  handler: handleRateLimit("Global Ingress"),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 15, 
  store: createStore("rl:auth:"),
  handler: handleRateLimit("Auth Gate"),
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, 
  store: createStore("rl:ai:"),
  handler: handleRateLimit("AI Generator"),
});

export const telemetryLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 telemetry events per 5 mins
  store: createStore("rl:telemetry:"),
  handler: handleRateLimit("Telemetry Buffer"),
});
