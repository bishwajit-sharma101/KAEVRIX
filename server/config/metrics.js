import mongoose from "mongoose";
import redisClient from "./redis.js";

// In-memory metrics storage
const httpRequestsTotal = new Map();
const httpRequestDurationSum = new Map();
const httpRequestDurationCount = new Map();

let cacheHitsTotal = 0;
let cacheMissesTotal = 0;
let queueCompletedTotal = 0;
let queueFailedTotal = 0;

let socketIoInstance = null;

export const metrics = {
  setSocketIo(io) {
    socketIoInstance = io;
  },
  
  incrementHttpRequests(method, route, status) {
    const key = `${method}:${route}:${status}`;
    httpRequestsTotal.set(key, (httpRequestsTotal.get(key) || 0) + 1);
  },
  
  recordHttpRequestDuration(method, route, durationMs) {
    const key = `${method}:${route}`;
    httpRequestDurationSum.set(key, (httpRequestDurationSum.get(key) || 0) + durationMs);
    httpRequestDurationCount.set(key, (httpRequestDurationCount.get(key) || 0) + 1);
  },
  
  incrementCacheHits() {
    cacheHitsTotal++;
  },
  
  incrementCacheMisses() {
    cacheMissesTotal++;
  },
  
  incrementQueueCompleted() {
    queueCompletedTotal++;
  },
  
  incrementQueueFailed() {
    queueFailedTotal++;
  }
};

// Periodic database latencies and queue depth polling
let mongoLatency = 0;
let redisLatency = 0;
let queueDepth = 0;

// Poll latency and queue depth every 10 seconds
setInterval(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      mongoLatency = Date.now() - start;
    } else {
      mongoLatency = -1;
    }
  } catch (err) {
    mongoLatency = -1;
  }

  try {
    const start = Date.now();
    await redisClient.ping();
    redisLatency = Date.now() - start;
  } catch (err) {
    redisLatency = -1;
  }

  try {
    const { aiQueue } = await import("./queue.js");
    if (aiQueue) {
      const counts = await aiQueue.getJobCounts("waiting", "active", "delayed");
      queueDepth = (counts.waiting || 0) + (counts.active || 0) + (counts.delayed || 0);
    }
  } catch (err) {
    queueDepth = -1;
  }
}, 10000).unref();

export async function generatePrometheusMetrics() {
  const lines = [];
  
  // 1. HTTP Requests Total
  lines.push("# HELP kaevrix_http_requests_total Total number of HTTP requests");
  lines.push("# TYPE kaevrix_http_requests_total counter");
  for (const [key, value] of httpRequestsTotal.entries()) {
    const [method, route, status] = key.split(":");
    lines.push(`kaevrix_http_requests_total{method="${method}",route="${route}",status="${status}"} ${value}`);
  }
  if (httpRequestsTotal.size === 0) {
    lines.push('kaevrix_http_requests_total{method="GET",route="/health",status="200"} 0');
  }

  // 2. HTTP Request Duration Sum/Count
  lines.push("# HELP kaevrix_http_request_duration_ms_sum Total duration of HTTP requests in milliseconds");
  lines.push("# TYPE kaevrix_http_request_duration_ms_sum counter");
  for (const [key, value] of httpRequestDurationSum.entries()) {
    const [method, route] = key.split(":");
    lines.push(`kaevrix_http_request_duration_ms_sum{method="${method}",route="${route}"} ${value}`);
  }
  
  lines.push("# HELP kaevrix_http_request_duration_ms_count Count of HTTP requests tracked for duration");
  lines.push("# TYPE kaevrix_http_request_duration_ms_count counter");
  for (const [key, value] of httpRequestDurationCount.entries()) {
    const [method, route] = key.split(":");
    lines.push(`kaevrix_http_request_duration_ms_count{method="${method}",route="${route}"} ${value}`);
  }

  // 3. Socket connections
  lines.push("# HELP kaevrix_active_socket_connections Current number of active WebSocket connections");
  lines.push("# TYPE kaevrix_active_socket_connections gauge");
  let socketCount = 0;
  if (socketIoInstance && socketIoInstance.engine) {
    socketCount = socketIoInstance.engine.clientsCount;
  }
  lines.push(`kaevrix_active_socket_connections ${socketCount}`);

  // 4. Queue metrics
  lines.push("# HELP kaevrix_queue_depth Current number of waiting/active/delayed jobs in the AI queue");
  lines.push("# TYPE kaevrix_queue_depth gauge");
  lines.push(`kaevrix_queue_depth ${queueDepth}`);

  lines.push("# HELP kaevrix_queue_completed_total Total number of completed AI queue jobs");
  lines.push("# TYPE kaevrix_queue_completed_total counter");
  lines.push(`kaevrix_queue_completed_total ${queueCompletedTotal}`);

  lines.push("# HELP kaevrix_queue_failed_total Total number of failed AI queue jobs");
  lines.push("# TYPE kaevrix_queue_failed_total counter");
  lines.push(`kaevrix_queue_failed_total ${queueFailedTotal}`);

  // 5. Database Latencies
  lines.push("# HELP kaevrix_redis_latency_ms Last measured latency to Redis server in milliseconds");
  lines.push("# TYPE kaevrix_redis_latency_ms gauge");
  lines.push(`kaevrix_redis_latency_ms ${redisLatency}`);

  lines.push("# HELP kaevrix_mongo_latency_ms Last measured latency to MongoDB server in milliseconds");
  lines.push("# TYPE kaevrix_mongo_latency_ms gauge");
  lines.push(`kaevrix_mongo_latency_ms ${mongoLatency}`);

  // 6. Memory Heap Used
  lines.push("# HELP kaevrix_memory_heap_used_bytes V8 heap memory usage in bytes");
  lines.push("# TYPE kaevrix_memory_heap_used_bytes gauge");
  const memoryUsage = process.memoryUsage();
  lines.push(`kaevrix_memory_heap_used_bytes ${memoryUsage.heapUsed}`);

  // 7. Cache hits/misses
  lines.push("# HELP kaevrix_cache_hits_total Total number of Redis cache hits");
  lines.push("# TYPE kaevrix_cache_hits_total counter");
  lines.push(`kaevrix_cache_hits_total ${cacheHitsTotal}`);

  lines.push("# HELP kaevrix_cache_misses_total Total number of Redis cache misses");
  lines.push("# TYPE kaevrix_cache_misses_total counter");
  lines.push(`kaevrix_cache_misses_total ${cacheMissesTotal}`);

  return lines.join("\n") + "\n";
}
