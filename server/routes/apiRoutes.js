import express from "express";
import ytSearch from "yt-search";
import { curatedVideos } from "../quizData.js";
import { 
  getLeaderboard, 
  getPlayerProfile, 
  addSoloXp 
} from "../services/leaderboardService.js";
import { 
  generateRoadmapFromAnswers, 
  generateStudyNotes,
  generateQuizForVideo
} from "../geminiService.js";
import {
  registerUser,
  loginUser,
  verifyToken,
  getUserThemeInfo,
  getUserProfile
} from "../services/authService.js";

const router = express.Router();

// GET Leaderboard
router.get("/leaderboard", (req, res) => {
  res.json(getLeaderboard());
});

// GET Profile
router.get("/profile/:username", (req, res) => {
  const user = getPlayerProfile(req.params.username);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// GET Curated Videos (Strips questions for security)
router.get("/curated-videos", (req, res) => {
  const videosPreview = curatedVideos.map(({ questions, ...rest }) => rest);
  res.json(videosPreview);
});

// GET YouTube Search
router.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }
  try {
    const results = await ytSearch(query);
    const videos = results.videos.slice(0, 10).map((v) => ({
      id: v.videoId,
      title: v.title,
      channel: v.author.name,
      duration: v.seconds,
      thumbnail: v.thumbnail || v.image,
      category: "YouTube Search"
    }));
    res.json(videos);
  } catch (error) {
    console.error("[Search] YouTube search error:", error);
    res.status(500).json({ error: "Failed to fetch YouTube search results" });
  }
});

// POST Personalized Feed
router.post("/personalized-feed", async (req, res) => {
  const { topic, why } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }
  try {
    const cleanTopic = topic.trim();
    const isJobSeeker = why ? /job|career|interview|work|resume/i.test(why) : false;
    
    // Customize search query depending on whether user is seeking a job
    const interviewQuery = isJobSeeker 
      ? `${cleanTopic} job coding interview questions preparation`
      : `${cleanTopic} practice coding exercises interview questions`;

    const queries = {
      core: `${cleanTopic} full course tutorial playlist`,
      interview: interviewQuery,
      tips: `${cleanTopic} best practices tips and tricks hack`
    };

    // Run searches in parallel
    const [coreRes, interviewRes, tipsRes] = await Promise.all([
      ytSearch(queries.core).catch(() => ({ videos: [] })),
      ytSearch(queries.interview).catch(() => ({ videos: [] })),
      ytSearch(queries.tips).catch(() => ({ videos: [] }))
    ]);

    const formatVideos = (results, categoryName) => {
      const videos = results.videos || [];
      return videos.slice(0, 8).map(v => ({
        id: v.videoId,
        title: v.title,
        channel: v.author ? v.author.name : "Unknown",
        duration: v.seconds || 300,
        thumbnail: v.thumbnail || v.image,
        category: categoryName
      }));
    };

    res.json({
      core: formatVideos(coreRes, `${cleanTopic} Core`),
      interview: formatVideos(interviewRes, `${cleanTopic} Prep`),
      tips: formatVideos(tipsRes, `${cleanTopic} Tips`)
    });
  } catch (error) {
    console.error("[PersonalizedFeed] Error generating personalized feed:", error);
    res.status(500).json({ error: "Failed to fetch personalized feed" });
  }
});

// POST Pathfinder Generate Roadmap
router.post("/pathfinder/generate", async (req, res) => {
  req.setTimeout(600000);
  res.setTimeout(600000);
  const { answers } = req.body;
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: "answers array required" });
  }

  try {
    const roadmap = await generateRoadmapFromAnswers(answers);
    res.json(roadmap);
  } catch (err) {
    console.error("[Pathfinder] Roadmap generation failed:", err.message);
    res.status(500).json({ error: "Roadmap generation failed", details: err.message });
  }
});

// POST Pathfinder Study Notes
router.post("/pathfinder/study-notes", async (req, res) => {
  req.setTimeout(600000);
  res.setTimeout(600000);
  const { topic, milestone, answers } = req.body;
  if (!topic || !milestone) {
    return res.status(400).json({ error: "topic and milestone required" });
  }

  try {
    const notes = await generateStudyNotes(topic, milestone, answers);
    res.json({ notes });
  } catch (err) {
    console.error("[Pathfinder] Study notes generation failed:", err.message);
    res.status(500).json({ error: "Study notes generation failed" });
  }
});

// POST Generate Quiz for Video
router.post("/quiz/generate", async (req, res) => {
  req.setTimeout(600000);
  res.setTimeout(600000);
  const { videoId, title, duration } = req.body;
  if (!title) {
    return res.status(400).json({ error: "video title required" });
  }

  try {
    const quiz = await generateQuizForVideo(videoId, title, duration);
    res.json(quiz);
  } catch (err) {
    console.error("[Quiz] Quiz generation failed:", err.message);
    res.status(500).json({ error: "Quiz generation failed", details: err.message });
  }
});

// POST Solo XP
router.post("/solo-xp", (req, res) => {
  const { username, xpEarned, videoTitle } = req.body;
  if (!username || !xpEarned) {
    return res.status(400).json({ error: "username and xpEarned required" });
  }

  const result = addSoloXp(username, xpEarned, videoTitle);
  if (!result) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(result);
});

// POST Auth Register
router.post("/auth/register", (req, res) => {
  const { username, password, avatar, selectedClass } = req.body;
  try {
    const result = registerUser(username, password, avatar, selectedClass);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST Auth Login
router.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  try {
    const result = loginUser(username, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST Auth Verify Token
router.post("/auth/verify", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });
  const username = verifyToken(token);
  if (!username) return res.status(401).json({ error: "Invalid token session" });
  const user = getUserProfile(username);
  if (!user) return res.status(404).json({ error: "User profile not found" });
  res.json({ user });
});

// GET Auth Theme & Identity of Username
router.get("/auth/theme/:username", (req, res) => {
  const info = getUserThemeInfo(req.params.username);
  if (info) {
    res.json(info);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

export default router;
