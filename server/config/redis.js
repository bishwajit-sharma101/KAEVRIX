import Redis from "ioredis";
import logger from "./logger.js";

const redisClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redisClient.on("error", (err) => {
  logger.error("[Redis Error]", { error: err.message, stack: err.stack });
});

redisClient.on("connect", () => {
  logger.info("[Redis] Connected to Redis caching server");
});

export default redisClient;
