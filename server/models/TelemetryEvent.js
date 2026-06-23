import mongoose from "mongoose";

const telemetryEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  username: { type: String, required: false },
  
  // New Tracking identifiers
  correlationId: { type: String, required: false },
  journeyId: { type: String, required: false },
  schemaVersion: { type: Number, default: 2 },
  
  // Explicit root-level analytics fields
  sessionId: { type: String, required: false },
  deviceId: { type: String, required: false },
  userAgent: { type: String, required: false },
  ipAddress: { type: String, required: false },
  pagePath: { type: String, required: false },
  featureName: { type: String, required: false },
  topic: { type: String, required: false },
  roadmapId: { type: String, required: false },
  videoId: { type: String, required: false },
  quizId: { type: String, required: false },
  xpAwarded: { type: Number, default: 0 },
  durationMs: { type: Number, default: 0 },

  eventType: { 
    type: String, 
    enum: [
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
    ],
    required: true 
  },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now }
});

telemetryEventSchema.index({ eventType: 1, timestamp: -1 });
telemetryEventSchema.index({ username: 1, timestamp: -1 });
telemetryEventSchema.index({ sessionId: 1 });
telemetryEventSchema.index({ journeyId: 1 });
telemetryEventSchema.index({ correlationId: 1 });
telemetryEventSchema.index({ userId: 1, eventType: 1 });
telemetryEventSchema.index({ timestamp: -1 });

export default mongoose.model("TelemetryEvent", telemetryEventSchema);
