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
  generateQuizForVideo,
  generateLevelMilestones
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
router.get("/leaderboard", async (req, res) => {
  res.json(await getLeaderboard());
});

// GET Profile
router.get("/profile/:username", async (req, res) => {
  const user = await getPlayerProfile(req.params.username);
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
      return videos.slice(0, 12).map(v => ({
        id: v.videoId,
        title: v.title,
        channel: v.author ? v.author.name : "Unknown",
        duration: v.seconds || 300,
        thumbnail: v.thumbnail || v.image,
        category: categoryName
      }));
    };

    const coreVideos = formatVideos(coreRes, "Core Tutorial");
    const interviewVideos = formatVideos(interviewRes, "Interview Prep");
    const tipsVideos = formatVideos(tipsRes, "Pro Tips");

    const recommendations = [];
    let coreIdx = 0;
    let intIdx = 0;
    let tipsIdx = 0;

    // Weave them: 2 Core, 1 Interview (if job seeker) or 1 Tips, etc.
    while (coreIdx < coreVideos.length || intIdx < interviewVideos.length || tipsIdx < tipsVideos.length) {
      // Add up to 2 Core videos
      for (let i = 0; i < 2; i++) {
        if (coreIdx < coreVideos.length) {
          recommendations.push(coreVideos[coreIdx++]);
        }
      }
      
      // Add 1 Interview or Tips
      if (isJobSeeker) {
        if (intIdx < interviewVideos.length) {
          recommendations.push(interviewVideos[intIdx++]);
        } else if (tipsIdx < tipsVideos.length) {
          recommendations.push(tipsVideos[tipsIdx++]);
        }
      } else {
        if (tipsIdx < tipsVideos.length) {
          recommendations.push(tipsVideos[tipsIdx++]);
        } else if (intIdx < interviewVideos.length) {
          recommendations.push(interviewVideos[intIdx++]);
        }
      }
    }

    res.json({
      videos: recommendations
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
  const { answers, pathfinderMode } = req.body;
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: "answers array required" });
  }

  try {
    const roadmap = await generateRoadmapFromAnswers(answers, pathfinderMode);
    res.json(roadmap);
  } catch (err) {
    console.error("[Pathfinder] Roadmap generation failed:", err.message);
    res.status(500).json({ error: "Roadmap generation failed", details: err.message });
  }
});

// POST Pathfinder Generate Level (Lazy JIT Generation)
router.post("/pathfinder/generate-level", async (req, res) => {
  req.setTimeout(600000);
  res.setTimeout(600000);
  const { topic, level, previousContext } = req.body;
  
  if (!topic || !level) {
    return res.status(400).json({ error: "topic and level are required" });
  }

  try {
    const milestones = await generateLevelMilestones(topic, level, previousContext);
    res.json({ milestones });
  } catch (err) {
    console.error(`[Pathfinder] Level ${level} generation failed:`, err.message);
    res.status(500).json({ error: `Level ${level} generation failed`, details: err.message });
  }
});

// POST Pathfinder Study Notes
router.post("/pathfinder/study-notes", async (req, res) => {
  req.setTimeout(600000);
  res.setTimeout(600000);
  const { topic, milestone, answers, noteStyle } = req.body;
  if (!topic || !milestone) {
    return res.status(400).json({ error: "topic and milestone required" });
  }

  try {
    const notes = await generateStudyNotes(topic, milestone, answers, noteStyle);
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
router.post("/solo-xp", async (req, res) => {
  const { username, xpEarned, videoTitle } = req.body;
  if (!username || !xpEarned) {
    return res.status(400).json({ error: "username and xpEarned required" });
  }

  const result = await addSoloXp(username, xpEarned, videoTitle);
  if (!result) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(result);
});

// POST Auth Register
router.post("/auth/register", async (req, res) => {
  const { username, password, avatar, selectedClass } = req.body;
  try {
    const result = await registerUser(username, password, avatar, selectedClass);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST Auth Login
router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await loginUser(username, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST Auth Verify Token
router.post("/auth/verify", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });
  const username = verifyToken(token);
  if (!username) return res.status(401).json({ error: "Invalid token session" });
  const user = await getUserProfile(username);
  if (!user) return res.status(404).json({ error: "User profile not found" });
  res.json({ user });
});

// GET Auth Theme & Identity of Username
router.get("/auth/theme/:username", async (req, res) => {
  const info = await getUserThemeInfo(req.params.username);
  if (info) {
    res.json(info);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

export default router;
