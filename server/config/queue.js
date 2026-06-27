import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import * as Sentry from "@sentry/node";
import redisClient from "./redis.js";
import logger from "./logger.js";
import { metrics } from "./metrics.js";
import { 
  generateRoadmapFromAnswers, 
  generateLevelMilestones, 
  generateStudyNotes, 
  generateQuizForVideo, 
  generateBossQuestions 
} from "../geminiService.js";

const connection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  }
});

// Initialize the main AI queue
export const aiQueue = new Queue("ai-jobs", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000 // 5s initial delay
    },
    timeout: 300000, // 5 minutes max per job execution
    removeOnComplete: {
      age: 3600, // Retain completed jobs for 1 hour
      count: 500 // Limit completed jobs stored in Redis
    },
    removeOnFail: {
      age: 86400, // Retain failed jobs for 24 hours
      count: 1000 // Limit failed jobs stored in Redis
    }
  }
});

// Setup the Worker
export const aiWorker = new Worker("ai-jobs", async (job) => {
  const { type, data, userId } = job.data;
  logger.info(`[Queue Worker] Processing job ${job.id} of type: ${type}`, { jobId: job.id, type, userId });
  
  let result;
  switch (type) {
    case "generate-roadmap":
      result = await generateRoadmapFromAnswers(data.answers, data.pathfinderMode, data.options, userId);
      break;
    case "generate-level":
      result = await generateLevelMilestones(data.topic, data.level, data.previousContext, userId);
      break;
    case "generate-notes":
      result = await generateStudyNotes(data.topic, data.milestone, data.answers, data.noteStyle, userId);
      break;
    case "generate-quiz":
      result = await generateQuizForVideo(
        data.videoId, 
        data.title, 
        data.duration, 
        data.topic, 
        data.why, 
        data.isDeveloper, 
        data.completedMilestones, 
        data.difficulty, 
        data.devGoal, 
        userId
      );
      break;
    case "generate-boss":
      result = await generateBossQuestions(data.topic, data.milestone, userId);
      break;
    default:
      throw new Error(`Unknown job type: ${type}`);
  }
  
  // Store the job result in Redis so the polling endpoint can retrieve it
  await redisClient.set(`job-result:${job.id}`, JSON.stringify(result), "EX", 3600); // 1 hour TTL
  // Store job ownership for IDOR protection on cached results
  if (userId) {
    await redisClient.set(`job-owner:${job.id}`, userId, "EX", 3600);
  }
  return result;
}, {
  connection,
  concurrency: 4 // Run up to 4 parallel workers in this process
});

aiWorker.on("completed", (job) => {
  logger.info(`[Queue Worker] Job ${job.id} completed.`, { jobId: job.id, type: job.data?.type });
  metrics.incrementQueueCompleted();
});

aiWorker.on("failed", (job, err) => {
  logger.error(`[Queue Worker] Job ${job.id} failed`, { jobId: job?.id, type: job?.data?.type, error: err.message, stack: err.stack });
  metrics.incrementQueueFailed();
  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setTag("jobId", job?.id);
      scope.setTag("jobType", job?.data?.type);
      if (job?.data?.userId) {
        scope.setUser({ id: job.data.userId });
      }
      scope.setExtra("jobData", job?.data);
      Sentry.captureException(err);
    });
  }
});
