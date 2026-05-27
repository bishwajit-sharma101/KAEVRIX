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
