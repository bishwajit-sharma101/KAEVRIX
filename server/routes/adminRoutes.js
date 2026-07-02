import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Session from "../models/Session.js";
import SecurityEvent from "../models/SecurityEvent.js";
import AITracking from "../models/AITracking.js";
import TelemetryEvent from "../models/TelemetryEvent.js";
import AuditLog from "../models/AuditLog.js";
import SystemConfig from "../models/SystemConfig.js";
import redisClient from "../config/redis.js";
import { getApiReliabilityStats } from "../middleware/apiReliabilityMiddleware.js";

const router = express.Router();

async function logAudit(adminUsername, action, target, changes, ipAddress) {
  await AuditLog.create({ adminUsername, action, target, changes, ipAddress });
}

// Helper to get days in month and elapsed days
function getMonthDaysInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const elapsedDays = Math.max(1, now.getDate());
  return { totalDays, elapsedDays };
}

// Helper to seed feature flags if missing
async function seedDefaultFlags(adminUsername) {
  const defaultFlags = [
    { key: "REGISTRATION_DISABLED", value: false },
    { key: "PATHFINDER_DISABLED", value: false },
    { key: "QUIZ_DISABLED", value: false },
    { key: "AI_KILL_SWITCH", value: false },
    { key: "SANCTUM_DISABLED", value: false },
    { key: "TELEMETRY_DISABLED", value: false },
    { key: "WAITLIST_ENABLED", value: false },
    { key: "COMMAND_CENTER_DISABLED", value: false },
    { key: "COMMUNITY_DISABLED", value: false },
    { key: "CHRONOS_DISABLED", value: false },
    { key: "HISTORY_DISABLED", value: false },
    { key: "RANKINGS_DISABLED", value: false },
    { key: "PROFILE_DISABLED", value: false },
    { key: "CLASH_DISABLED", value: false },
    { key: "ROADMAP_GEN_DISABLED", value: false },
    { key: "FRIENDS_DISABLED", value: false },
    { key: "CHAT_DISABLED", value: false },
    { key: "PUBLIC_PROFILES_DISABLED", value: false },
    { key: "NOTES_GEN_DISABLED", value: false }
  ];

  for (const flag of defaultFlags) {
    const exists = await SystemConfig.findOne({ key: flag.key });
    if (!exists) {
      await SystemConfig.create({
        key: flag.key,
        value: flag.value,
        updatedBy: adminUsername || "system"
      });
    }
  }
}

// ----------------------------------------------------------------------------
// Overview & Platform Health
// ----------------------------------------------------------------------------
router.get("/overview", async (req, res, next) => {
  try {
    // Seed flags on access
    await seedDefaultFlags(req.user?.username);

    const totalUsers = await User.countDocuments();
    const activeSessions = await Session.countDocuments();
    const now = new Date();
    
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const newRegsToday = await User.countDocuments({ createdAt: { $gte: startOfDay } });
    
    const globalXpResult = await User.aggregate([
      { $group: { _id: null, totalXp: { $sum: "$xp" }, totalVideos: { $sum: "$totalVideosWatched" } } }
    ]);
    const totalXP = globalXpResult[0] ? globalXpResult[0].totalXp : 0;
    const totalVideos = globalXpResult[0] ? globalXpResult[0].totalVideos : 0;

    // log Command Center Access
    await TelemetryEvent.create({
      userId: req.user?.userId,
      username: req.user?.username || "anonymous",
      eventType: "COMMAND_CENTER_ACCESSED",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    // In-memory stats
    const reliability = getApiReliabilityStats();
    
    // Telemetry count
    const totalEventsCount = await TelemetryEvent.countDocuments();
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentEventsCount = await TelemetryEvent.countDocuments({ timestamp: { $gte: fifteenMinsAgo } });
    const writesPerMinute = parseFloat((recentEventsCount / 15).toFixed(1));

    // Caught error metrics
    const clientErrorsCount = await TelemetryEvent.countDocuments({ eventType: "CLIENT_ERROR" });
    const apiErrorsCount = await TelemetryEvent.countDocuments({ eventType: "API_ERROR" });
    
    // AI latency
    const aiLatencyResult = await TelemetryEvent.aggregate([
      { $match: { eventType: "AI_REQUEST_EXECUTED", "metadata.latencyMs": { $exists: true } } },
      { $group: { _id: null, avgLatency: { $avg: "$metadata.latencyMs" } } }
    ]);
    const averageAiLatencyMs = aiLatencyResult[0] ? Math.round(aiLatencyResult[0].avgLatency) : 0;

    res.json({
      totalUsers,
      activeSessions,
      newRegsToday,
      totalXP,
      totalVideos,
      totalEventsCount,
      writesPerMinute,
      clientErrorsCount,
      apiErrorsCount,
      averageAiLatencyMs,
      successRate: reliability.successRate
    });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------------------------
// 1. API Reliability Monitoring (Real-time in-memory + recent failures)
// ----------------------------------------------------------------------------
router.get("/api-reliability", async (req, res, next) => {
  try {
    const stats = getApiReliabilityStats();
    res.json(stats);
  } catch (err) { next(err); }
});

// ----------------------------------------------------------------------------
// User Behavior & Onboarding Funnel
// ----------------------------------------------------------------------------
router.get("/behavior", async (req, res, next) => {
  try {
    // 1. Leaderboard (Users by XP)
    const topUsers = await User.find({ role: { $ne: "admin" } })
      .sort({ xp: -1 })
      .limit(10)
      .select("username level xp totalWatchTime")
      .lean();

    // 2. Funnel conversion stats
    const signups = await User.countDocuments();
    const roadmapsGenerated = await TelemetryEvent.countDocuments({ eventType: "PATHFINDER_GENERATED" });
    const nodesOpened = await TelemetryEvent.countDocuments({ eventType: "VIDEO_OPENED" });
    const nodesCompleted = await TelemetryEvent.countDocuments({ eventType: "ROADMAP_NODE_COMPLETED" });

    // 3. Rate Limit Offenders aggregates (for security screen fallback)
    const topIPs = await SecurityEvent.aggregate([
      { $match: { eventType: "RATE_LIMIT" } },
      { $group: { _id: "$ipAddress", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    const topOffenders = await SecurityEvent.aggregate([
      { $match: { eventType: "RATE_LIMIT" } },
      { $group: { _id: "$username", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    const topEndpoints = await SecurityEvent.aggregate([
      { $match: { eventType: "RATE_LIMIT" } },
      { $group: { _id: "$endpoint", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    res.json({
      funnel: {
        signups,
        roadmapsGenerated,
        nodesOpened,
        nodesCompleted
      },
      topUsers,
      topIPs,
      topOffenders,
      topEndpoints
    });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------------------------
// Health Status Endpoint
// ----------------------------------------------------------------------------
router.get("/health", async (req, res, next) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      mongodb: mongoStatus,
      api: "Healthy",
      redis: "Connected", // Mocked as required
      uptime,
      memoryUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      memoryTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      version: "1.0.0"
    });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------------------------
// Timeline & Journey Reconstructor
// ----------------------------------------------------------------------------
router.get("/journey/reconstruct", async (req, res, next) => {
  const { query, type } = req.query;
  if (!query) return res.status(400).json({ error: "Query parameter required" });

  try {
    let filter = {};
    const cleanQuery = query.trim();
    if (type === "username") {
      filter = { username: cleanQuery.toLowerCase() };
    } else if (type === "journeyId") {
      filter = { journeyId: cleanQuery };
    } else if (type === "sessionId") {
      filter = { sessionId: cleanQuery };
    } else if (type === "eventType") {
      filter = { eventType: cleanQuery };
    } else {
      filter = {
        $or: [
          { username: cleanQuery.toLowerCase() },
          { journeyId: cleanQuery },
          { sessionId: cleanQuery },
          { eventType: cleanQuery }
        ]
      };
    }

    const events = await TelemetryEvent.find(filter)
      .sort({ timestamp: 1 })
      .limit(200)
      .lean();

    res.json(events);
  } catch (err) { next(err); }
});

// ----------------------------------------------------------------------------
// Emergency AI Kill-Switch Route
// ----------------------------------------------------------------------------
router.post("/ai-costs/kill-switch", async (req, res, next) => {
  const { enable } = req.body;
  try {
    const config = await SystemConfig.findOneAndUpdate(
      { key: "AI_KILL_SWITCH" },
      { value: !!enable, updatedBy: req.user.username },
      { upsert: true, new: true }
    );
    const currentMonth = new Date().toISOString().substring(0, 7);
    await Promise.all([
      redisClient.del("config:feature:AI_KILL_SWITCH"),
      redisClient.del(`ai:monthly_cost:${currentMonth}`)
    ]);
    await logAudit(req.user.username, "UPDATE_FEATURE_FLAG", "AI_KILL_SWITCH", { value: !!enable }, req.ip);
    
    // Log to Telemetry
    await TelemetryEvent.create({
      userId: req.user.userId,
      username: req.user.username,
      eventType: "FEATURE_FLAG_CHANGED",
      metadata: { key: "AI_KILL_SWITCH", value: !!enable },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    
    res.json({ success: true, killSwitchEngaged: !!enable });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------------------------
// 2. AI Failure Intelligence (Granular timeouts, slowest models, comparing providers)
// ----------------------------------------------------------------------------
router.get("/ai-failure-intelligence", async (req, res, next) => {
  try {
    const totalExecuted = await TelemetryEvent.countDocuments({ eventType: "AI_REQUEST_EXECUTED" });
    const totalFailed = await TelemetryEvent.countDocuments({ eventType: "AI_REQUEST_FAILED" });
    const totalAI = totalExecuted + totalFailed;
    const failureRate = totalAI > 0 ? parseFloat(((totalFailed / totalAI) * 100).toFixed(2)) : 0;

    // Timeout analysis: failed requests where message or type indicates timeouts
    const timeoutsCount = await TelemetryEvent.countDocuments({
      $or: [
        { eventType: "GEMINI_API_TIMEOUT" },
        { eventType: "AI_REQUEST_FAILED", "metadata.errorMessage": /timeout|exceeded/i }
      ]
    });

    // Slowest model: group by provider and model and compute average latency
    const slowestModelStats = await TelemetryEvent.aggregate([
      { $match: { eventType: "AI_REQUEST_EXECUTED", "metadata.model": { $exists: true }, "metadata.latencyMs": { $exists: true } } },
      { $group: { _id: "$metadata.model", avgLatency: { $avg: "$metadata.latencyMs" } } },
      { $sort: { avgLatency: -1 } },
      { $limit: 1 }
    ]);
    const slowestModel = slowestModelStats[0] ? { name: slowestModelStats[0]._id, latency: Math.round(slowestModelStats[0].avgLatency) } : null;

    // Most expensive endpoint: sum up by endpoint
    const currentMonth = new Date().toISOString().substring(0, 7);
    const expensiveEndpointStats = await AITracking.aggregate([
      { $match: { date: currentMonth, userId: null, endpoint: { $ne: "GLOBAL_MONTHLY" } } },
      { $group: { _id: "$endpoint", totalCost: { $sum: "$estimatedCostUSD" } } },
      { $sort: { totalCost: -1 } },
      { $limit: 1 }
    ]);
    const mostExpensiveEndpoint = expensiveEndpointStats[0] ? { route: expensiveEndpointStats[0]._id, cost: parseFloat(expensiveEndpointStats[0].totalCost.toFixed(4)) } : null;

    // AI latency and count grouping by provider
    const providerStats = await TelemetryEvent.aggregate([
      { $match: { eventType: "AI_REQUEST_EXECUTED", "metadata.provider": { $exists: true } } },
      { $group: { _id: "$metadata.provider", count: { $sum: 1 }, avgLatency: { $avg: "$metadata.latencyMs" } } }
    ]);

    // Recent failures
    const recentGeminiFailures = await TelemetryEvent.find({
      eventType: "AI_REQUEST_FAILED",
      "metadata.provider": "gemini"
    }).sort({ timestamp: -1 }).limit(10).lean();

    const recentOllamaFailures = await TelemetryEvent.find({
      eventType: "AI_REQUEST_FAILED",
      "metadata.provider": "ollama"
    }).sort({ timestamp: -1 }).limit(10).lean();

    // Budget tracking metrics
    const config = await SystemConfig.findOne({ key: "AI_KILL_SWITCH" });
    const globalAI = await AITracking.findOne({ date: currentMonth, userId: null, endpoint: "GLOBAL_MONTHLY" });
    const monthlyCost = globalAI ? globalAI.estimatedCostUSD : 0;
    const budgetLimit = 100.00;
    const remainingBudget = Math.max(0, budgetLimit - monthlyCost);
    const { totalDays, elapsedDays } = getMonthDaysInfo();
    const dailySpend = monthlyCost / elapsedDays;
    const projectedSpend = dailySpend * totalDays;
    const burnRate = dailySpend;

    const endpointCosts = await AITracking.find({
      date: currentMonth,
      userId: null,
      endpoint: { $ne: "GLOBAL_MONTHLY" }
    }).select("endpoint estimatedCostUSD requestsCount").lean();

    let pathfinderCost = 0;
    let notesCost = 0;
    let quizCost = 0;
    let otherCost = 0;

    for (const ec of endpointCosts) {
      if (ec.endpoint.includes("/pathfinder/generate") || ec.endpoint.includes("/generate-level")) {
        pathfinderCost += ec.estimatedCostUSD;
      } else if (ec.endpoint.includes("/study-notes")) {
        notesCost += ec.estimatedCostUSD;
      } else if (ec.endpoint.includes("/quiz") || ec.endpoint.includes("/boss")) {
        quizCost += ec.estimatedCostUSD;
      } else {
        otherCost += ec.estimatedCostUSD;
      }
    }

    const warningEvents = await SecurityEvent.find({
      eventType: "AI_BUDGET_ALERT"
    }).sort({ timestamp: -1 }).limit(10).lean();

    res.json({
      totalExecuted,
      totalFailed,
      failureRate,
      timeoutsCount,
      slowestModel,
      mostExpensiveEndpoint,
      providerStats,
      recentGeminiFailures,
      recentOllamaFailures,
      monthlyCost,
      dailySpend,
      remainingBudget,
      projectedSpend,
      burnRate,
      warningEvents,
      features: {
        pathfinder: pathfinderCost,
        notes: notesCost,
        quiz: quizCost,
        other: otherCost
      },
      endpointCosts,
      killSwitchEngaged: config ? !!config.value : false
    });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------------------------
// 3. Rate Limiting & Abuse Monitoring
// ----------------------------------------------------------------------------
router.get("/abuse-detection", async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    // Blocked requests
    const blockedCount = await SecurityEvent.countDocuments({ eventType: "RATE_LIMIT" });

    // Top offending IPs
    const topIPs = await SecurityEvent.aggregate([
      { $match: { eventType: "RATE_LIMIT" } },
      { $group: { _id: "$ipAddress", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    // Top offending Users
    const topUsers = await SecurityEvent.aggregate([
      { $match: { eventType: "RATE_LIMIT" } },
      { $group: { _id: "$username", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    // Most abused endpoints
    const topEndpoints = await SecurityEvent.aggregate([
      { $match: { eventType: "RATE_LIMIT" } },
      { $group: { _id: "$endpoint", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    // Daily lockouts today
    const lockoutsToday = await SecurityEvent.countDocuments({ eventType: "LOCKOUT", timestamp: { $gte: startOfDay } });

    // Abuse Event History
    const history = await SecurityEvent.find({
      eventType: { $in: ["RATE_LIMIT", "LOCKOUT", "AI_ABUSE", "BOLA_ATTEMPT"] }
    }).sort({ timestamp: -1 }).limit(30).lean();

    res.json({
      blockedCount,
      topIPs,
      topUsers,
      topEndpoints,
      lockoutsToday,
      history
    });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------------------------
// 4. AI Budget Intelligence (Burn rates, projections, feature allocations)
// ----------------------------------------------------------------------------
router.get("/ai-budget-detail", async (req, res, next) => {
  try {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const globalAI = await AITracking.findOne({ date: currentMonth, userId: null, endpoint: "GLOBAL_MONTHLY" });
    const config = await SystemConfig.findOne({ key: "AI_KILL_SWITCH" });

    const monthlyCost = globalAI ? globalAI.estimatedCostUSD : 0;
    const budgetLimit = 100.00; // Limit
    const remainingBudget = Math.max(0, budgetLimit - monthlyCost);

    // Days Elapsed
    const { totalDays, elapsedDays } = getMonthDaysInfo();
    const dailySpend = monthlyCost / elapsedDays;
    const projectedSpend = dailySpend * totalDays;
    const burnRate = dailySpend; // spend per day

    // Cost per endpoint
    const endpointCosts = await AITracking.find({
      date: currentMonth,
      userId: null,
      endpoint: { $ne: "GLOBAL_MONTHLY" }
    }).select("endpoint estimatedCostUSD requestsCount").lean();

    // Cost per feature groups:
    // - Pathfinder: /pathfinder/generate, /pathfinder/generate-level
    // - Study Notes: /pathfinder/study-notes
    // - Quiz: /quiz/generate, /boss/generate
    let pathfinderCost = 0;
    let notesCost = 0;
    let quizCost = 0;
    let otherCost = 0;

    for (const ec of endpointCosts) {
      if (ec.endpoint.includes("/pathfinder/generate") || ec.endpoint.includes("/generate-level")) {
        pathfinderCost += ec.estimatedCostUSD;
      } else if (ec.endpoint.includes("/study-notes")) {
        notesCost += ec.estimatedCostUSD;
      } else if (ec.endpoint.includes("/quiz") || ec.endpoint.includes("/boss")) {
        quizCost += ec.estimatedCostUSD;
      } else {
        otherCost += ec.estimatedCostUSD;
      }
    }

    // Budget warnings thresholds triggered in recent SecurityEvents
    const warningEvents = await SecurityEvent.find({
      eventType: "AI_BUDGET_ALERT"
    }).sort({ timestamp: -1 }).limit(10).lean();

    res.json({
      monthlyCost,
      dailySpend,
      remainingBudget,
      projectedSpend,
      burnRate,
      warningEvents,
      features: {
        pathfinder: pathfinderCost,
        notes: notesCost,
        quiz: quizCost,
        other: otherCost
      },
      endpointCosts
    });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------------------------
// 5. Real-Time User Activity Feed
// ----------------------------------------------------------------------------
router.get("/activity-feed", async (req, res, next) => {
  try {
    const activityEvents = [
      "PATHFINDER_GENERATED", "QUIZ_STARTED", "QUIZ_COMPLETED", "QUIZ_PASSED", "QUIZ_FAILED",
      "VIDEO_OPENED", "VIDEO_COMPLETED", "XP_AWARDED", "LEVEL_UP", 
      "NOTES_GENERATED", "ROADMAP_COMPLETED"
    ];

    const feed = await TelemetryEvent.find({
      eventType: { $in: activityEvents }
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .select("username eventType timestamp journeyId correlationId metadata")
    .lean();

    res.json(feed);
  } catch (err) { next(err); }
});

// ----------------------------------------------------------------------------
// 6. Operational Error Center
// ----------------------------------------------------------------------------
router.get("/error-center", async (req, res, next) => {
  try {
    const errorTypes = [
      "CLIENT_ERROR", "API_ERROR", "SOCKET_ERROR", "VIDEO_LOAD_FAILED",
      "PATHFINDER_GENERATION_FAILED", "QUIZ_GENERATION_FAILED", "NOTES_GENERATION_FAILED",
      "GEMINI_API_FAILED", "GEMINI_API_TIMEOUT", "MONGO_CONNECTION_FAILED"
    ];

    const errors = await TelemetryEvent.find({
      eventType: { $in: errorTypes }
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();

    res.json(errors);
  } catch (err) { next(err); }
});

// ----------------------------------------------------------------------------
// 7. Feature Status Panel / Config Editor
// ----------------------------------------------------------------------------
router.get("/config", async (req, res, next) => {
  try {
    const configs = await SystemConfig.find();
    res.json(configs);
  } catch (err) { next(err); }
});

router.post("/config", async (req, res, next) => {
  const { key, value } = req.body;
  try {
    const config = await SystemConfig.findOneAndUpdate(
      { key },
      { value, updatedBy: req.user.username },
      { upsert: true, new: true }
    );
    await redisClient.del(`config:feature:${key}`);
    await logAudit(req.user.username, "UPDATE_FEATURE_FLAG", key, { value }, req.ip);
    
    // Log to Telemetry
    await TelemetryEvent.create({
      userId: req.user.userId,
      username: req.user.username,
      eventType: "FEATURE_FLAG_CHANGED",
      metadata: { key, value },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    
    res.json(config);
  } catch (err) { next(err); }
});

// ----------------------------------------------------------------------------
// 8. Session & Revoke Operations
// ----------------------------------------------------------------------------
router.get("/sessions", async (req, res, next) => {
  try {
    const count = await Session.countDocuments();
    const recent = await Session.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("userId", "username");

    // Aggregate sessions per user
    const sessionsPerUser = await Session.aggregate([
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { username: "$user.username", count: 1 } },
      { $sort: { count: -1 } }
    ]);

    res.json({ activeSessions: count, recent, sessionsPerUser });
  } catch (err) { next(err); }
});

router.post("/sessions/revoke", async (req, res, next) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "Session ID required" });

  try {
    const session = await Session.findById(sessionId).populate("userId", "username");
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Telemetry Event
    await TelemetryEvent.create({
      userId: session.userId?._id,
      username: session.userId?.username || "unknown",
      eventType: "SESSION_ENDED",
      sessionId: session._id.toString(),
      metadata: { reason: "revoked_by_admin", revokedBy: req.user.username }
    });

    await Session.deleteOne({ _id: sessionId });
    await logAudit(req.user.username, "REVOKE_SESSION", sessionId, { username: session.userId?.username }, req.ip);

    res.json({ success: true, message: `Neural-link terminated for session: ${sessionId}` });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------------------------
// 9. Security Operations summary (failed logins, locker, denials)
// ----------------------------------------------------------------------------
router.get("/security-stream", async (req, res, next) => {
  try {
    const events = await SecurityEvent.find().sort({ timestamp: -1 }).limit(50);
    res.json(events);
  } catch (err) { next(err); }
});

router.get("/security-stats", async (req, res, next) => {
  try {
    // Total failed/successful logins, lockouts
    const successfulLogins = await SecurityEvent.countDocuments({ eventType: "SUCCESSFUL_LOGIN" });
    const failedLogins = await SecurityEvent.countDocuments({ eventType: "FAILED_LOGIN" });
    const lockouts = await SecurityEvent.countDocuments({ eventType: "LOCKOUT" });
    
    // Command Center access attempts
    const ccAccessSuccessful = await TelemetryEvent.countDocuments({ eventType: "COMMAND_CENTER_ACCESSED" });
    const ccAccessDenied = await TelemetryEvent.countDocuments({ eventType: "COMMAND_CENTER_ACCESS_DENIED" });

    // MFA Failures / success
    const mfaFailures = await TelemetryEvent.countDocuments({ eventType: "MFA_FAILURE" });
    const mfaSuccess = await TelemetryEvent.countDocuments({ eventType: "MFA_SUCCESS" });

    // Password resets (placeholder/future proofing)
    const passwordResets = await TelemetryEvent.countDocuments({ eventType: "PASSWORD_RESET_REQUESTED" });

    res.json({
      successfulLogins,
      failedLogins,
      lockouts,
      ccAccessSuccessful,
      ccAccessDenied,
      mfaFailures,
      mfaSuccess,
      passwordResets
    });
  } catch (err) { next(err); }
});

export default router;
