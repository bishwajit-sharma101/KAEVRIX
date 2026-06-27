import { z } from "zod";

// Only alphanumeric, underscores, and hyphens — blocks XSS/HTML injection in usernames
const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-zA-Z0-9_\-]+$/, "Username can only contain letters, numbers, underscores, and hyphens");

export const registerSchema = z.object({
  body: z.object({
    username: usernameSchema,
    password: z.string().min(8).max(100),
    avatar: z.string().url().optional(),
    selectedClass: z.string().max(50).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1).max(30),
    password: z.string().min(8).max(100)
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
}); // Note: login allows looser username for legacy compat; blocked at lockout+sanitize layer

export const soloXpSchema = z.object({
  body: z.object({
    xpEarned: z.number().int().min(0).max(100000),
    videoTitle: z.string().max(500).optional(),
    isRoadmapNode: z.boolean().optional(),
    roadmapTopic: z.string().max(200).optional(),
    milestoneId: z.string().max(100).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const cosmeticsSchema = z.object({
  body: z.object({
    banner: z.string().max(1000).optional(),
    avatarFrame: z.string().max(1000).optional(),
    profileEffect: z.string().max(1000).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const pathfinderGenerateSchema = z.object({
  body: z.object({
    answers: z.array(z.any()), // Assuming dynamic answers from frontend
    pathfinderMode: z.string().max(100).optional(),
    isEngineer: z.boolean().optional(),
    devGoal: z.string().max(100).optional(),
    devLanguage: z.string().max(100).optional(),
    difficulty: z.string().max(50).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const quizGenerateSchema = z.object({
  body: z.object({
    videoId: z.string().max(100),
    title: z.string().max(500),
    duration: z.number().optional(),
    topic: z.string().max(200).optional(),
    why: z.string().max(500).optional(),
    isDeveloper: z.boolean().optional(),
    completedMilestones: z.array(z.any()).optional(),
    difficulty: z.string().max(50).optional(),
    devGoal: z.string().max(100).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const telemetrySchema = z.object({
  body: z.object({
    eventType: z.enum([
      // Auth/Sessions/Views
      "SIGNUP", "USER_REGISTERED", "USER_VERIFIED_EMAIL", "USER_LOGIN", "USER_LOGOUT",
      "SESSION_STARTED", "SESSION_ENDED", "MFA_CHALLENGE", "MFA_SUCCESS", "MFA_FAILURE",
      "PASSWORD_RESET_REQUESTED", "PASSWORD_RESET_COMPLETED", "USER_DISABLED", "USER_REENABLED",
      "COMMAND_CENTER_ACCESSED", "COMMAND_CENTER_ACCESS_DENIED", "PROFILE_UPDATED", "WAITLIST_JOINED",
      "PAGE_VIEW", "PAGE_EXIT", "FEATURE_OPENED", "FEATURE_CLOSED",

      // Errors & Health
      "CLIENT_ERROR", "API_ERROR", "SOCKET_ERROR", "MONGO_CONNECTION_FAILED", 
      "GEMINI_API_FAILED", "GEMINI_API_TIMEOUT",

      // System/AI
      "AI_REQUEST_EXECUTED", "AI_REQUEST_FAILED", "FEATURE_FLAG_CHANGED", "RATE_LIMIT_EXCEEDED",

      // Pathfinders/Roadmaps
      "GENERATE_ROADMAP", "PATHFINDER_GENERATED", "PATHFINDER_REGENERATED", "NOTES_GENERATED",
      "ROADMAP_STARTED", "ROADMAP_COMPLETED", "ROADMAP_ABANDONED", "ROADMAP_VIEWED", "ROADMAP_GENERATED",
      "ROADMAP_NODE_OPENED", "ROADMAP_NODE_STARTED", "ROADMAP_NODE_COMPLETED", "ROADMAP_NODE_FAILED",
      "ROADMAP_GENERATION_FAILED", "PATHFINDER_GENERATION_FAILED", "NOTES_GENERATION_FAILED",

      // Video
      "WATCH_VIDEO", "VIDEO_OPENED", "VIDEO_COMPLETED", "VIDEO_PLAYING", "VIDEO_PAUSED", "VIDEO_RESUMED", 
      "VIDEO_SEEK", "VIDEO_SKIPPED", "VIDEO_ABANDONED", "SEARCH_PERFORMED", "SEARCH_RESULT_CLICKED", "VIDEO_LOAD_FAILED",

      // Quiz
      "GENERATE_QUIZ", "QUIZ_GENERATED", "QUIZ_STARTED", "TAKE_QUIZ", "QUIZ_QUESTION_ANSWERED",
      "QUIZ_FAILED", "QUIZ_RETRY", "QUIZ_PASSED", "QUIZ_COMPLETED", "QUIZ_ABANDONED", "QUIZ_GENERATION_FAILED",
      
      // Economy & Progression
      "EARN_XP", "XP_AWARDED", "LEVEL_UP", "SKILL_TIER_UPGRADED",

      // Sanctum
      "SANCTUM_MATCHMAKING_STARTED", "SANCTUM_MATCH_FOUND", "SANCTUM_JOINED", 
      "SANCTUM_QUESTION_ANSWERED", "SANCTUM_WON", "SANCTUM_LOST",
      "SANCTUM_STARTED", "SANCTUM_COMPLETED", "SANCTUM_ABANDONED"
    ]),
    topic: z.string().max(200).optional(),
    roadmapId: z.string().max(100).optional(),
    videoId: z.string().max(100).optional(),
    quizId: z.string().max(100).optional(),
    pagePath: z.string().max(500).optional(),
    featureName: z.string().max(200).optional(),
    journeyId: z.string().max(200).optional(),
    correlationId: z.string().max(200).optional(),
    sessionId: z.string().max(200).optional(),
    deviceId: z.string().max(200).optional(),
    durationMs: z.number().min(0).max(86400000).optional(), // Max 24 hours
    metadata: z.record(z.any()).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});
