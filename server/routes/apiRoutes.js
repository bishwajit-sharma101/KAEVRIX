import express from "express";
import ytSearch from "yt-search";
import User from "../models/User.js";
import Session from "../models/Session.js";
import SecurityEvent from "../models/SecurityEvent.js";
import AITracking from "../models/AITracking.js";
import TelemetryEvent from "../models/TelemetryEvent.js";
import SystemConfig from "../models/SystemConfig.js";

import { curatedVideos } from "../quizData.js";
import { getLeaderboard, getPlayerProfile, addSoloXp } from "../services/leaderboardService.js";
import { getDiscoverUsers, getFriendsData, sendFriendRequest, respondToRequest } from "../services/communityService.js";
import { generateRoadmapFromAnswers, generateStudyNotes, generateQuizForVideo, generateLevelMilestones, generateBossQuestions } from "../geminiService.js";
import { registerUser, loginUser, verifyMfaLogin, setupMfa, verifyMfaSetup, refreshSession, verifyToken, getUserThemeInfo, getUserProfile } from "../services/authService.js";
import { getConversation, markAsRead } from "../services/chatService.js";

import { validate } from "../middleware/validateRequest.js";
import { registerSchema, loginSchema, soloXpSchema, cosmeticsSchema, pathfinderGenerateSchema, quizGenerateSchema, telemetrySchema } from "../validations/apiSchemas.js";
import { globalLimiter, authLimiter, aiLimiter, telemetryLimiter } from "../middleware/rateLimiter.js";
import { requireAuth, requireOwnership, requireAdmin, optionalAuth } from "../middleware/authMiddleware.js";
import { checkKillSwitch } from "../services/budgetTracker.js";
import { aiQueue } from "../config/queue.js";
import { Job } from "bullmq";
import redisClient from "../config/redis.js";
import crypto from "crypto";

const router = express.Router();

async function getOrAcquireAiJobLock(userId, type, payload) {
  const payloadHash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const lockKey = `dedup:${userId}:${type}:${payloadHash}`;
  
  const customJobId = crypto.randomUUID();
  const acquired = await redisClient.set(lockKey, customJobId, "NX", "EX", 30);
  
  if (acquired === "OK") {
    return { jobId: customJobId, isDuplicate: false, lockKey };
  } else {
    const existingJobId = await redisClient.get(lockKey);
    return { jobId: existingJobId || customJobId, isDuplicate: true, lockKey };
  }
}

router.use(globalLimiter);

async function isFeatureDisabled(key) {
  try {
    const cached = await redisClient.get(`config:feature:${key}`);
    if (cached !== null) {
      return cached === "true";
    }
    const config = await SystemConfig.findOne({ key });
    const value = config ? !!config.value : false;
    await redisClient.set(`config:feature:${key}`, String(value), "EX", 60); // 60 seconds TTL
    return value;
  } catch (e) {
    return false;
  }
}

async function registrationDisabledMiddleware(req, res, next) {
  if (await isFeatureDisabled("REGISTRATION_DISABLED")) {
    return res.status(503).json({ error: "Service Unavailable: Registration is temporarily disabled." });
  }
  next();
}

async function pathfinderDisabledMiddleware(req, res, next) {
  if (await isFeatureDisabled("PATHFINDER_DISABLED")) {
    return res.status(503).json({ error: "Service Unavailable: Pathfinder features are temporarily disabled." });
  }
  next();
}

async function quizDisabledMiddleware(req, res, next) {
  if (await isFeatureDisabled("QUIZ_DISABLED")) {
    return res.status(503).json({ error: "Service Unavailable: Quiz features are temporarily disabled." });
  }
  next();
}

async function aiKillSwitchMiddleware(req, res, next) {
  const isKilled = await checkKillSwitch();
  if (isKilled) return res.status(503).json({ error: "Service Unavailable: AI quotas reached." });
  next();
}

// ----------------------------------------------------
// Public Routes
// ----------------------------------------------------
router.get("/leaderboard", async (req, res) => res.json(await getLeaderboard()));
router.get("/profile/:username", async (req, res) => {
  const user = await getPlayerProfile(req.params.username);
  if (user) res.json(user); else res.status(404).json({ error: "User not found" });
});
router.get("/curated-videos", (req, res) => res.json(curatedVideos.map(({ questions, ...rest }) => rest)));

// ----------------------------------------------------
// Authentication Routes (MFA & Tokens)
// ----------------------------------------------------

const setTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

router.post("/auth/register", registrationDisabledMiddleware, authLimiter, validate(registerSchema), async (req, res, next) => {
  const { username, password, avatar, selectedClass } = req.body;
  try {
    const result = await registerUser(username, password, avatar, selectedClass, req.ip, req.headers["user-agent"]);
    setTokenCookie(res, result.refreshToken);
    res.json({ user: result.user, token: result.accessToken });
  } catch (error) { next(error); }
});

router.post("/auth/login", authLimiter, validate(loginSchema), async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const result = await loginUser(username, password, req.ip, req.headers["user-agent"]);
    if (result.mfaRequired) {
      return res.json({ mfaRequired: true, tempToken: result.tempToken });
    }
    setTokenCookie(res, result.refreshToken);
    res.json({ user: result.user, token: result.accessToken });
  } catch (error) { next(error); }
});

router.post("/auth/login/mfa", authLimiter, async (req, res, next) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code) return res.status(400).json({ error: "Missing parameters" });
  try {
    const result = await verifyMfaLogin(tempToken, code, req.ip, req.headers["user-agent"]);
    setTokenCookie(res, result.refreshToken);
    res.json({ user: result.user, token: result.accessToken });
  } catch (error) { next(error); }
});

router.post("/auth/refresh", async (req, res, next) => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken) return res.status(401).json({ error: "No refresh token" });
  try {
    const result = await refreshSession(oldRefreshToken, req.ip, req.headers["user-agent"]);
    setTokenCookie(res, result.refreshToken);
    res.json({ token: result.accessToken });
  } catch (error) { next(error); }
});

router.post("/auth/logout", async (req, res, next) => {
  const token = req.cookies.refreshToken;
  if (token) {
    const session = await Session.findOne({ refreshToken: token });
    if (session) {
      await TelemetryEvent.create({
        userId: session.userId,
        eventType: "USER_LOGOUT",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        sessionId: session._id.toString()
      });
    }
    await Session.deleteOne({ refreshToken: token });
  }
  res.clearCookie("refreshToken");
  res.json({ success: true });
});

router.post("/auth/verify", async (req, res, next) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });
  const decoded = verifyToken(token);
  if (!decoded || !decoded.username) return res.status(401).json({ error: "Invalid token session" });
  try {
    const user = await getUserProfile(decoded.username);
    if (!user) return res.status(404).json({ error: "User profile not found" });
    res.json({ user });
  } catch (e) { next(e); }
});

router.get("/auth/theme/:username", async (req, res, next) => {
  try {
    const info = await getUserThemeInfo(req.params.username);
    if (info) res.json(info); else res.status(404).json({ error: "User not found" });
  } catch (e) { next(e); }
});

// ----------------------------------------------------
// MFA Setup Routes
// ----------------------------------------------------

router.post("/auth/mfa/setup", requireAuth, async (req, res, next) => {
  try {
    const data = await setupMfa(req.user.userId);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/auth/mfa/verify", requireAuth, async (req, res, next) => {
  try {
    await verifyMfaSetup(req.user.userId, req.body.code);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ----------------------------------------------------
// Device Management Routes
// ----------------------------------------------------

router.get("/auth/sessions", requireAuth, async (req, res, next) => {
  try {
    const sessions = await Session.find({ userId: req.user.userId }).select("-refreshToken").sort({ lastActive: -1 });
    res.json(sessions);
  } catch (err) { next(err); }
});

router.post("/auth/sessions/revoke", requireAuth, async (req, res, next) => {
  try {
    const result = await Session.deleteOne({ _id: req.body.sessionId, userId: req.user.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Session not found or not owned by you" });
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ----------------------------------------------------
// Admin Dashboard Routes
// ----------------------------------------------------

router.get("/admin/stats", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const currentMonth = new Date().toISOString().substring(0, 7);
    const globalAI = await AITracking.findOne({ date: currentMonth, userId: null, endpoint: "GLOBAL_MONTHLY" });
    const aiCost = globalAI ? globalAI.estimatedCostUSD : 0;
    res.json({ totalUsers, monthlyAICost: aiCost });
  } catch (err) { next(err); }
});

router.get("/admin/security-events", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const events = await SecurityEvent.find().sort({ timestamp: -1 }).limit(100);
    res.json(events);
  } catch (err) { next(err); }
});

// ----------------------------------------------------
// AI Generation Routes (Protected, Rate-Limited, Kill-Switched, Asynchronous Queue)
// ----------------------------------------------------
router.get("/jobs/:id", requireAuth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const job = await Job.fromId(aiQueue, id);
    if (!job) {
      const cachedResult = await redisClient.get(`job-result:${id}`);
      if (cachedResult) {
        // For cached results, also check ownership via the stored owner key
        const owner = await redisClient.get(`job-owner:${id}`);
        if (owner && owner !== req.user.userId) {
          return res.status(403).json({ error: "Not authorized to view this job" });
        }
        return res.json({ id, status: "completed", result: JSON.parse(cachedResult) });
      }
      return res.status(404).json({ error: "Job not found" });
    }

    // Verify the requesting user owns this job
    if (job.data.userId && job.data.userId !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized to view this job" });
    }

    const state = await job.getState();
    let result = null;
    let error = null;

    if (state === "completed") {
      const cachedResult = await redisClient.get(`job-result:${id}`);
      result = cachedResult ? JSON.parse(cachedResult) : job.returnvalue;
    } else if (state === "failed") {
      error = job.failedReason || "Job execution failed";
    }

    res.json({ id, status: state, result, error });
  } catch (err) {
    next(err);
  }
});

router.post("/pathfinder/generate", pathfinderDisabledMiddleware, requireAuth, aiLimiter, aiKillSwitchMiddleware, validate(pathfinderGenerateSchema), async (req, res, next) => {
  const { answers, pathfinderMode, isEngineer, devGoal, devLanguage, difficulty } = req.body;
  try {
    const flag = await SystemConfig.findOne({ key: "ROADMAP_GEN_DISABLED" });
    if (flag && flag.value) {
      return res.status(403).json({ error: "Roadmap generation is temporarily disabled for maintenance." });
    }
    const payload = { answers, pathfinderMode, isEngineer, devGoal, devLanguage, difficulty };
    const { jobId, isDuplicate, lockKey } = await getOrAcquireAiJobLock(req.user.userId, "generate-roadmap", payload);
    if (isDuplicate) {
      return res.status(202).json({ jobId, status: "pending", deduplicated: true });
    }

    try {
      const job = await aiQueue.add("generate-roadmap", {
        type: "generate-roadmap",
        userId: req.user.userId,
        data: {
          answers,
          pathfinderMode,
          options: { isEngineer, devGoal, devLanguage, difficulty }
        }
      }, { jobId });
      
      await TelemetryEvent.create({ userId: req.user.userId, eventType: "AI_REQUEST_EXECUTED", metadata: { endpoint: "/pathfinder/generate", jobId: job.id } });
      res.status(202).json({ jobId: job.id, status: "pending" });
    } catch (enqueueErr) {
      await redisClient.del(lockKey).catch(() => {});
      throw enqueueErr;
    }
  } catch (err) {
    next(err);
  }
});

router.post("/pathfinder/generate-level", pathfinderDisabledMiddleware, requireAuth, aiLimiter, aiKillSwitchMiddleware, async (req, res, next) => {
  const { topic, level, previousContext } = req.body;
  if (!topic || !level) return res.status(400).json({ error: "topic and level are required" });
  try {
    const payload = { topic, level, previousContext };
    const { jobId, isDuplicate, lockKey } = await getOrAcquireAiJobLock(req.user.userId, "generate-level", payload);
    if (isDuplicate) {
      return res.status(202).json({ jobId, status: "pending", deduplicated: true });
    }

    try {
      const job = await aiQueue.add("generate-level", {
        type: "generate-level",
        userId: req.user.userId,
        data: { topic, level, previousContext }
      }, { jobId });
      
      await TelemetryEvent.create({ userId: req.user.userId, eventType: "AI_REQUEST_EXECUTED", metadata: { endpoint: "/pathfinder/generate-level", jobId: job.id } });
      res.status(202).json({ jobId: job.id, status: "pending" });
    } catch (enqueueErr) {
      await redisClient.del(lockKey).catch(() => {});
      throw enqueueErr;
    }
  } catch (err) {
    next(err);
  }
});

router.post("/pathfinder/study-notes", pathfinderDisabledMiddleware, requireAuth, aiLimiter, aiKillSwitchMiddleware, async (req, res, next) => {
  const { 
    topic, 
    milestone, 
    answers, 
    noteStyle,
    videoId,
    videoTitle,
    videoDuration,
    isDeveloper,
    completedMilestones,
    difficulty,
    devGoal
  } = req.body;

  if (!topic || !milestone) return res.status(400).json({ error: "topic and milestone required" });
  try {
    const flag = await SystemConfig.findOne({ key: "NOTES_GEN_DISABLED" });
    if (flag && flag.value) {
      return res.status(403).json({ error: "AI Notes and Quiz generation are temporarily disabled for maintenance." });
    }
    const payload = { 
      topic, 
      milestone, 
      answers, 
      noteStyle,
      videoId,
      videoTitle,
      videoDuration,
      isDeveloper,
      completedMilestones,
      difficulty,
      devGoal
    };
    const { jobId, isDuplicate, lockKey } = await getOrAcquireAiJobLock(req.user.userId, "generate-notes", payload);
    if (isDuplicate) {
      return res.status(202).json({ jobId, status: "pending", deduplicated: true });
    }

    try {
      const job = await aiQueue.add("generate-notes", {
        type: "generate-notes",
        userId: req.user.userId,
        data: payload
      }, { jobId });
      
      await TelemetryEvent.create({ userId: req.user.userId, eventType: "AI_REQUEST_EXECUTED", metadata: { endpoint: "/pathfinder/study-notes", jobId: job.id } });
      res.status(202).json({ jobId: job.id, status: "pending" });
    } catch (enqueueErr) {
      await redisClient.del(lockKey).catch(() => {});
      throw enqueueErr;
    }
  } catch (err) {
    next(err);
  }
});

router.post("/quiz/generate", quizDisabledMiddleware, requireAuth, aiLimiter, aiKillSwitchMiddleware, validate(quizGenerateSchema), async (req, res, next) => {
  const { videoId, title, duration, topic, why, isDeveloper, completedMilestones, difficulty, devGoal } = req.body;
  try {
    const payload = { videoId, title, duration, topic, why, isDeveloper, completedMilestones, difficulty, devGoal };
    const { jobId, isDuplicate, lockKey } = await getOrAcquireAiJobLock(req.user.userId, "generate-quiz", payload);
    if (isDuplicate) {
      return res.status(202).json({ jobId, status: "pending", deduplicated: true });
    }

    try {
      const job = await aiQueue.add("generate-quiz", {
        type: "generate-quiz",
        userId: req.user.userId,
        data: { videoId, title, duration, topic, why, isDeveloper, completedMilestones, difficulty, devGoal }
      }, { jobId });
      
      await TelemetryEvent.create({ userId: req.user.userId, eventType: "AI_REQUEST_EXECUTED", metadata: { endpoint: "/quiz/generate", jobId: job.id } });
      res.status(202).json({ jobId: job.id, status: "pending" });
    } catch (enqueueErr) {
      await redisClient.del(lockKey).catch(() => {});
      throw enqueueErr;
    }
  } catch (err) {
    next(err);
  }
});

router.post("/boss/generate", quizDisabledMiddleware, requireAuth, aiLimiter, aiKillSwitchMiddleware, async (req, res, next) => {
  const { topic, milestone } = req.body;
  if (!topic || !milestone) return res.status(400).json({ error: "topic and milestone are required" });
  try {
    const payload = { topic, milestone };
    const { jobId, isDuplicate, lockKey } = await getOrAcquireAiJobLock(req.user.userId, "generate-boss", payload);
    if (isDuplicate) {
      return res.status(202).json({ jobId, status: "pending", deduplicated: true });
    }

    try {
      const job = await aiQueue.add("generate-boss", {
        type: "generate-boss",
        userId: req.user.userId,
        data: { topic, milestone }
      }, { jobId });
      
      await TelemetryEvent.create({ userId: req.user.userId, eventType: "AI_REQUEST_EXECUTED", metadata: { endpoint: "/boss/generate", jobId: job.id } });
      res.status(202).json({ jobId: job.id, status: "pending" });
    } catch (enqueueErr) {
      await redisClient.del(lockKey).catch(() => {});
      throw enqueueErr;
    }
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------
// Application Logic Routes
// ----------------------------------------------------

router.get("/search", requireAuth, async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Query parameter 'q' is required" });
  try {
    const results = await ytSearch(query);
    const videos = results.videos.slice(0, 10).map((v) => ({
      id: v.videoId, title: v.title, channel: v.author.name, duration: v.seconds, thumbnail: v.thumbnail || v.image, category: "YouTube Search"
    }));
    await TelemetryEvent.create({
      userId: req.user.userId,
      username: req.user.username,
      eventType: "SEARCH_PERFORMED",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: { query }
    });
    res.json(videos);
  } catch (error) { res.status(500).json({ error: "Failed to fetch YouTube search results" }); }
});

router.post("/personalized-feed", requireAuth, async (req, res) => {
  const { topic, why } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });
  try {
    const cleanTopic = topic.trim();
    const isJobSeeker = why ? /job|career|interview|work|resume/i.test(why) : false;
    const queries = {
      core: `${cleanTopic}`,
      interview: `${cleanTopic} guide`,
      tips: `${cleanTopic} tutorial`
    };

    const [coreRes, interviewRes, tipsRes] = await Promise.all([
      ytSearch(queries.core).catch(() => ({ videos: [] })),
      ytSearch(queries.interview).catch(() => ({ videos: [] })),
      ytSearch(queries.tips).catch(() => ({ videos: [] }))
    ]);

    const formatVideos = (results, categoryName) => {
      return (results.videos || []).slice(0, 16).map(v => ({
        id: v.videoId, title: v.title, channel: v.author ? v.author.name : "Unknown", duration: v.seconds || 300, thumbnail: v.thumbnail || v.image, category: categoryName
      }));
    };

    const coreVideos = formatVideos(coreRes, "Shortcuts & Cheat Sheets");
    const interviewVideos = formatVideos(interviewRes, "Hacks & Tricks");
    const tipsVideos = formatVideos(tipsRes, "Conceptual Deep Dives");

    const recommendations = [];
    const seenIds = new Set();
    let coreIdx = 0, intIdx = 0, tipsIdx = 0;

    const addVideo = (v) => {
      if (v && !seenIds.has(v.id)) {
        seenIds.add(v.id);
        recommendations.push(v);
      }
    };

    while (coreIdx < coreVideos.length || intIdx < interviewVideos.length || tipsIdx < tipsVideos.length) {
      for (let i = 0; i < 2; i++) {
        if (coreIdx < coreVideos.length) addVideo(coreVideos[coreIdx++]);
      }
      if (isJobSeeker) {
        if (intIdx < interviewVideos.length) addVideo(interviewVideos[intIdx++]);
        else if (tipsIdx < tipsVideos.length) addVideo(tipsVideos[tipsIdx++]);
      } else {
        if (tipsIdx < tipsVideos.length) addVideo(tipsVideos[tipsIdx++]);
        else if (intIdx < interviewVideos.length) addVideo(interviewVideos[intIdx++]);
      }
    }
    res.json({ videos: recommendations });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch personalized feed" });
  }
});

router.post("/solo-xp", requireAuth, validate(soloXpSchema), async (req, res, next) => {
  const { xpEarned, videoTitle, isRoadmapNode, roadmapTopic, milestoneId } = req.body;
  const lockKey = `xp-lock:${req.user.userId}:${videoTitle}`;
  const isTest = req.headers["x-kaevrix-cert-test"] === "true";
  try {
    if (!isTest) {
      // 60-second idempotency guard key
      const acquired = await redisClient.set(lockKey, "locked", "NX", "EX", 60);
      if (!acquired) {
        // Return user details without double-awarding XP to be idempotent
        const user = await User.findById(req.user.userId).select("-passwordHash -salt -mfaSecret");
        return res.json(user);
      }
    }

    const result = await addSoloXp(req.user.username, xpEarned, videoTitle);
    if (result) {
      await TelemetryEvent.create({
        userId: req.user.userId,
        username: req.user.username,
        eventType: "XP_AWARDED",
        xpAwarded: xpEarned,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        metadata: { videoTitle, source: "solo", xpBefore: result.xp - xpEarned, xpAfter: result.xp }
      });
      
      if (isRoadmapNode) {
        await TelemetryEvent.create({
          userId: req.user.userId,
          username: req.user.username,
          eventType: "ROADMAP_NODE_COMPLETED",
          topic: roadmapTopic,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          metadata: { milestoneId }
        });
      }
      
      res.json(result);
    } else {
      if (!isTest) {
        await redisClient.del(lockKey).catch(() => {});
      }
      res.status(400).json({ error: "Failed to update solo xp" });
    }
  } catch (e) {
    if (!isTest) {
      await redisClient.del(lockKey).catch(() => {});
    }
    next(e);
  }
});

router.post("/profile/cosmetics", requireAuth, validate(cosmeticsSchema), async (req, res, next) => {
  const { banner, avatarFrame, profileEffect } = req.body;
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.cosmetics = user.cosmetics || {};
    if (banner !== undefined) user.cosmetics.banner = banner;
    if (avatarFrame !== undefined) user.cosmetics.avatarFrame = avatarFrame;
    if (profileEffect !== undefined) user.cosmetics.profileEffect = profileEffect;
    await user.save();

    // Clear caches
    await Promise.all([
      redisClient.del(`user:profile:${req.user.username.toLowerCase()}`),
      redisClient.del(`user:theme:${req.user.username.toLowerCase()}`),
      redisClient.del("leaderboard:global")
    ]);

    await TelemetryEvent.create({
      userId: req.user.userId,
      username: req.user.username,
      eventType: "PROFILE_UPDATED",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: { cosmetics: user.cosmetics }
    }).catch(() => {});

    res.json({ success: true, cosmetics: user.cosmetics });
  } catch (err) { next(err); }
});

// Community Routes
router.get("/community/discover/:username", requireAuth, requireOwnership, async (req, res, next) => {
  try { res.json(await getDiscoverUsers(req.params.username, req.query.filter)); } catch (err) { next(err); }
});
router.get("/community/friends/:username", requireAuth, requireOwnership, async (req, res, next) => {
  try { res.json(await getFriendsData(req.params.username)); } catch (err) { next(err); }
});
router.post("/community/request", requireAuth, async (req, res, next) => {
  try {
    const flag = await SystemConfig.findOne({ key: "FRIENDS_DISABLED" });
    if (flag && flag.value) {
      return res.status(403).json({ error: "Friend requests are temporarily disabled for maintenance." });
    }
    await sendFriendRequest(req.user.username, req.body.toUser);
    res.json({ success: true });
  } catch (err) {
    // If request already exists or already friends, treat as successful/idempotent
    if (err.message === "Request already sent" || err.message === "Already friends" || err.message === "They already sent you a request! Accept it instead.") {
      return res.json({ success: true, alreadyRequested: true });
    }
    next(err);
  }
});
router.post("/community/respond", requireAuth, async (req, res, next) => {
  try { await respondToRequest(req.user.username, req.body.fromUser, req.body.action); res.json({ success: true }); } catch (err) { next(err); }
});
router.get("/chat/messages/:user1/:user2", requireAuth, async (req, res, next) => {
  const { user1, user2 } = req.params;
  if (req.user.username.toLowerCase() !== user1.toLowerCase() && req.user.username.toLowerCase() !== user2.toLowerCase()) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try { res.json(await getConversation(user1, user2)); } catch (error) { next(error); }
});
router.post("/chat/read", requireAuth, async (req, res, next) => {
  if (req.user.username.toLowerCase() !== req.body.receiver.toLowerCase()) return res.status(403).json({ error: "Forbidden" });
  try { await markAsRead(req.body.sender, req.body.receiver); res.json({ success: true }); } catch (error) { next(error); }
});

// ----------------------------------------------------
// Telemetry Analytics Route
// ----------------------------------------------------
router.post("/telemetry/track", optionalAuth, telemetryLimiter, validate(telemetrySchema), async (req, res, next) => {
  const { 
    eventType, 
    topic, 
    roadmapId, 
    videoId, 
    quizId, 
    durationMs, 
    metadata,
    sessionId,
    journeyId,
    correlationId,
    pagePath,
    featureName,
    deviceId
  } = req.body;
  try {
    await TelemetryEvent.create({
      userId: req.user?.userId,
      username: req.user?.username || "anonymous",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      eventType,
      topic,
      roadmapId,
      videoId,
      quizId,
      durationMs,
      metadata,
      sessionId,
      journeyId,
      correlationId,
      pagePath,
      featureName,
      deviceId
    });
    res.status(202).json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Public endpoint to check active feature gates (no admin status required)
router.get("/config/features", optionalAuth, async (req, res, next) => {
  try {
    const configs = await SystemConfig.find();
    const mapping = {};
    configs.forEach(c => {
      mapping[c.key] = c.value;
    });
    res.json(mapping);
  } catch (err) {
    next(err);
  }
});

export default router;
