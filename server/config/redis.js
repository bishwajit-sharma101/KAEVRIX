import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redisClient.on("error", (err) => {
  console.error("[Redis Error]", err.message);
});

redisClient.on("connect", () => {
  console.log("[Redis] Connected to Redis caching server");
});

export default redisClient;
