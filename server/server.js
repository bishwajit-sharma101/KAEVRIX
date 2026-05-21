import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import path from "path";
import { curatedVideos } from "./quizData.js";
import { generateQuizForVideo } from "./geminiService.js";
import ytSearch from "yt-search";

const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
httpServer.timeout = 600000; // 10 minutes timeout for long-running AI requests
httpServer.keepAliveTimeout = 600000;
httpServer.headersTimeout = 605000;

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Paths for persistent data
const DATA_DIR = path.resolve("./data");
const LEADERBOARD_FILE = path.join(DATA_DIR, "leaderboard.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Load Leaderboard
let leaderboard = [];
try {
  if (fs.existsSync(LEADERBOARD_FILE)) {
    leaderboard = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, "utf-8"));
  } else {
    // Initial seeds
    leaderboard = [
      { username: "CodeMaster", xp: 1250, level: 5, wins: 15, losses: 3 },
      { username: "NeonNinja", xp: 890, level: 4, wins: 10, losses: 4 },
      { username: "QuizSlayer", xp: 620, level: 3, wins: 7, losses: 2 },
      { username: "CuriosityCat", xp: 450, level: 2, wins: 5, losses: 3 },
      { username: "ByteSize", xp: 210, level: 1, wins: 2, losses: 5 }
    ];
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
  }
} catch (error) {
  console.error("Error reading leaderboard file, using default seeds:", error);
}

function saveLeaderboard() {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
  } catch (error) {
    console.error("Failed to save leaderboard:", error);
  }
}

// In-Memory Game State
const rooms = new Map(); // roomId -> room details
const activeQueues = new Map(); // videoId -> array of sockets
let quickMatchQueue = []; // array of sockets waiting for random matches
const activeIntervals = new Map(); // roomId -> { botInterval, botChatInterval, countdownInterval }

// List of bot names and chat messages for realism
const BOT_NAMES = [
  "AlphaWatch", "QuantumQuest", "BytePioneer", "CuriousBrain", 
  "SpaceDiver", "GizmoExplorer", "PixelSage", "TuringTest"
];

const BOT_INTRO_CHATS = [
  "Hey there! Ready to watch this?",
  "Hello! Let's see who gets the higher score.",
  "Hey! Love this topic, good luck!",
  "Hi! Fasten your seatbelt, I watch at 2x speed in my brain!",
  "Yo! Let's do this."
];

const BOT_MID_CHATS = [
  "Wow, that part is actually crazy.",
  "Never thought about it that way before.",
  "Interesting point they made there.",
  "Wait, I need to remember that for the quiz!",
  "This is a really well-made video."
];

const BOT_SUBMIT_CHATS = [
  "Done! Those questions were tough.",
  "Submitted! Hopefully I got them all correct.",
  "Finished watching! Good luck on the questions.",
  "Whoa, that was fast. Let's see how I did."
];

// Helper to update leaderboard
function updatePlayerStats(username, xpGained, won, videoDetails = null, avatar = null, selectedClass = null) {
  let user = leaderboard.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    user = { 
      username, 
      xp: 0, 
      level: 1, 
      wins: 0, 
      losses: 0,
      avatar: avatar,
      selectedClass: selectedClass || "doomscroller",
      totalVideosWatched: 0,
      totalWatchTime: 0,
      watchHistory: []
    };
    leaderboard.push(user);
  }

  user.xp += xpGained;
  if (won) {
    user.wins += 1;
  } else {
    user.losses += 1;
  }
  
  if (avatar) user.avatar = avatar;
  if (selectedClass) user.selectedClass = selectedClass;

  if (videoDetails) {
    user.totalVideosWatched = (user.totalVideosWatched || 0) + 1;
    user.totalWatchTime = (user.totalWatchTime || 0) + (videoDetails.duration || 0);
    if (!user.watchHistory) user.watchHistory = [];
    user.watchHistory.unshift({
      id: videoDetails.id,
      title: videoDetails.title,
      timestamp: new Date().toISOString()
    });
    // Keep only last 20 history items
    if (user.watchHistory.length > 20) user.watchHistory.pop();
  }

  // Level formula: Level = Math.floor(XP / 200) + 1
  const newLevel = Math.floor(user.xp / 200) + 1;
  const leveledUp = newLevel > user.level;
  user.level = newLevel;

  // Sort leaderboard by XP
  leaderboard.sort((a, b) => b.xp - a.xp);
  saveLeaderboard();
  
  return { user, leveledUp };
}

// REST Endpoints
app.get("/api/leaderboard", (req, res) => {
  res.json(leaderboard);
});

app.get("/api/profile/:username", (req, res) => {
  const user = leaderboard.find((u) => u.username.toLowerCase() === req.params.username.toLowerCase());
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

app.get("/api/curated-videos", (req, res) => {
  // Strip questions from video list for security before match starts
  const videosPreview = curatedVideos.map(({ questions, ...rest }) => rest);
  res.json(videosPreview);
});

app.get("/api/search", async (req, res) => {
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

// ── Pathfinder: Generate AI Roadmap from conversation answers ──────────────
app.post("/api/pathfinder/generate", async (req, res) => {
  req.setTimeout(600000);
  res.setTimeout(600000);
  const { answers } = req.body; // array of { question, answer }
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: "answers array required" });
  }

  const { generateRoadmapFromAnswers } = await import("./geminiService.js");
  try {
    const roadmap = await generateRoadmapFromAnswers(answers);
    res.json(roadmap);
  } catch (err) {
    console.error("[Pathfinder] Roadmap generation failed:", err.message);
    res.status(500).json({ error: "Roadmap generation failed", details: err.message });
  }
});

// ── Pathfinder: Generate AI Study Notes for a milestone ───────────────────
app.post("/api/pathfinder/study-notes", async (req, res) => {
  req.setTimeout(600000);
  res.setTimeout(600000);
  const { topic, milestone, answers } = req.body;
  if (!topic || !milestone) {
    return res.status(400).json({ error: "topic and milestone required" });
  }

  const { generateStudyNotes } = await import("./geminiService.js");
  try {
    const notes = await generateStudyNotes(topic, milestone, answers);
    res.json({ notes });
  } catch (err) {
    console.error("[Pathfinder] Study notes generation failed:", err.message);
    res.status(500).json({ error: "Study notes generation failed" });
  }
});

// ── Solo XP: Award XP for watching a video solo (no duel) ─────────────────
app.post("/api/solo-xp", (req, res) => {
  const { username, xpEarned, videoTitle } = req.body;
  if (!username || !xpEarned) {
    return res.status(400).json({ error: "username and xpEarned required" });
  }

  let user = leaderboard.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.xp = (user.xp || 0) + xpEarned;
  const newLevel = Math.floor(user.xp / 200) + 1;
  const leveledUp = newLevel > user.level;
  user.level = newLevel;

  if (videoTitle) {
    if (!user.watchHistory) user.watchHistory = [];
    user.watchHistory.unshift({ title: videoTitle, timestamp: new Date().toISOString(), solo: true });
    if (user.watchHistory.length > 20) user.watchHistory.pop();
    user.totalVideosWatched = (user.totalVideosWatched || 0) + 1;
  }

  leaderboard.sort((a, b) => b.xp - a.xp);
  saveLeaderboard();

  res.json({ xp: user.xp, level: user.level, leveledUp });
});

// Socket.io Handlers
io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Socket state
  let currentRoomId = null;

  socket.on("join_queue", async ({ username, avatar, selectedClass, videoId, videoTitle, videoChannel, videoDuration, videoThumbnail, vsBot }) => {
    console.log(`[Queue] Player "${username}" (${socket.id}) requested match. VideoId: ${videoId || "QuickMatch"}. vsBot: ${vsBot}`);
    
    // Store profile metadata on socket
    socket.username = username;
    socket.avatar = avatar;
    socket.selectedClass = selectedClass || "doomscroller";
    
    if (videoId) {
      socket.queuedVideoTitle = videoTitle;
      socket.queuedVideoChannel = videoChannel;
      socket.queuedVideoDuration = videoDuration;
      socket.queuedVideoThumbnail = videoThumbnail;
    }
    
    if (vsBot) {
      // Instantly start a Bot match
      await createBotMatch(socket, videoId, {
        title: videoTitle,
        channel: videoChannel,
        duration: videoDuration,
        thumbnail: videoThumbnail
      });
      return;
    }

    if (videoId) {
      // Matchmaking for a specific video
      if (!activeQueues.has(videoId)) {
        activeQueues.set(videoId, []);
      }
      
      const queue = activeQueues.get(videoId);
      
      // Prevent duplicates
      if (queue.some((s) => s.id === socket.id)) return;
      
      if (queue.length > 0) {
        // Match found!
        const opponent = queue.shift();
        await createHumanMatch(socket, opponent, videoId);
      } else {
        queue.push(socket);
        socket.queuedVideoId = videoId;
        console.log(`[Queue] Added to queue for video "${videoId}". Queue size: ${queue.length}`);
        
        // Auto-Bot Match Fallback after 5 seconds
        setTimeout(async () => {
          if (activeQueues.has(videoId)) {
            const currentQueue = activeQueues.get(videoId);
            const idx = currentQueue.findIndex((s) => s.id === socket.id);
            if (idx !== -1) {
              currentQueue.splice(idx, 1);
              console.log(`[Queue] Timeout reached, starting Bot Match for video "${videoId}"`);
              await createBotMatch(socket, videoId, {
                title: socket.queuedVideoTitle,
                channel: socket.queuedVideoChannel,
                duration: socket.queuedVideoDuration,
                thumbnail: socket.queuedVideoThumbnail
              });
            }
          }
        }, 5000);
      }
    } else {
      // Quick Match (Random Video)
      if (quickMatchQueue.some((s) => s.id === socket.id)) return;

      if (quickMatchQueue.length > 0) {
        const opponent = quickMatchQueue.shift();
        // Select random curated video
        const randomVideo = curatedVideos[Math.floor(Math.random() * curatedVideos.length)];
        await createHumanMatch(socket, opponent, randomVideo.id, randomVideo);
      } else {
        quickMatchQueue.push(socket);
        socket.queuedVideoId = null;
        console.log(`[Queue] Added to Quick Match queue. Queue size: ${quickMatchQueue.length}`);
        
        // Auto-Bot Match Fallback after 5 seconds
        setTimeout(async () => {
          const idx = quickMatchQueue.findIndex((s) => s.id === socket.id);
          if (idx !== -1) {
             quickMatchQueue.splice(idx, 1);
             console.log(`[Queue] Timeout reached, starting Quick Match vs Bot`);
             await createBotMatch(socket, null);
          }
        }, 5000);
      }
    }
  });

  socket.on("leave_queue", () => {
    cleanUpQueue(socket);
  });

  socket.on("player_ready", () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (player) {
      player.ready = true;
      console.log(`[Game] Player "${player.username}" is ready in room "${currentRoomId}"`);
      
      // Notify all
      io.to(currentRoomId).emit("room_update", room);

      // Check if everyone is ready
      const allReady = room.players.every((p) => p.ready);
      if (allReady) {
        startCountdown(room);
      }
    }
  });

  socket.on("video_progress", ({ progress }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (player) {
      player.progress = progress;
      // Broadcast progress to the room
      socket.to(currentRoomId).emit("opponent_progress", { 
        socketId: socket.id, 
        progress 
      });
    }
  });

  socket.on("video_finished", () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (player) {
      player.finished = true;
      console.log(`[Game] Player "${player.username}" finished video in room "${currentRoomId}"`);
      
      io.to(currentRoomId).emit("room_update", room);
      
      // Notify other player that this player is already in the quiz!
      socket.to(currentRoomId).emit("opponent_waiting_quiz", { username: player.username });
    }
  });

  socket.on("submit_answers", ({ answers, watchProgress, doubleDowns }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (player && !player.submitted) {
      player.submitted = true;
      player.answers = answers;
      player.submitTime = Date.now();
      
      // Calculate speedrun multiplier based on progress when skipped/finished
      const progress = (watchProgress !== undefined) ? watchProgress : player.progress;
      let multiplier = 1.0;
      if (progress >= 100) {
        multiplier = 1.0;
      } else if (progress >= 75) {
        multiplier = 1.2;
      } else if (progress >= 50) {
        multiplier = 1.5;
      } else {
        multiplier = 2.0;
      }

      player.multiplier = multiplier;
      player.watchProgressAtSubmission = progress;

      // Calculate score
      let score = 0;
      let correctCount = 0;
      room.video.questions.forEach((q, idx) => {
        const isCorrect = answers[idx] === q.answerIndex;
        const isDoubleDown = doubleDowns && doubleDowns[idx];
        if (isCorrect) {
          correctCount++;
          score += isDoubleDown ? 200 : 100;
        } else {
          score += isDoubleDown ? -100 : 0;
        }
      });
      player.score = Math.max(0, Math.round(score * multiplier));
      player.correctCount = correctCount;

      console.log(`[Game] Player "${player.username}" submitted quiz in room "${currentRoomId}". Correct: ${correctCount}/5, Mult: ${multiplier}x, Score: ${player.score}`);

      // Send confirmation to this player
      socket.emit("answers_recorded", { score: player.score });
      
      // Check if all players submitted
      const allSubmitted = room.players.every((p) => p.submitted);
      if (allSubmitted) {
        evaluateGame(room);
      } else {
        // Notify others
        socket.to(currentRoomId).emit("opponent_submitted", { username: player.username });
      }
    }
  });

  socket.on("send_message", ({ message }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (player) {
      const chatMsg = {
        id: Math.random().toString(36).substr(2, 9),
        sender: player.username,
        message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      io.to(currentRoomId).emit("receive_message", chatMsg);
    }
  });

  socket.on("use_powerup", ({ type }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    const opponent = room.players.find((p) => p.socketId !== socket.id);
    if (player && opponent) {
      console.log(`[Powerup] Player "${player.username}" used "${type}" on "${opponent.username}"`);
      
      if (type === "__local_2x_speed__") {
        // Local self-buff, server does not propagate it as an attack/debuff to the opponent.
        return;
      }

      if (!opponent.isBot) {
        io.to(opponent.socketId).emit("opponent_powerup", { type });
      } else {
        handleBotHitByPowerup(room, opponent, type);
      }

      const emoji = type === "freeze" ? "⚡ EMP FREEZE" : "🌫️ SMOKE SCREEN";
      sendBotChat(room, "SYSTEM", `⚠️ ${player.username} deployed ${emoji} on ${opponent.username}!`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    cleanUpQueue(socket);
    
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        // Cancel bot intervals if any
        const timers = activeIntervals.get(room.id);
        if (timers) {
          if (timers.botInterval) clearInterval(timers.botInterval);
          if (timers.botChatInterval) clearInterval(timers.botChatInterval);
          if (timers.countdownInterval) clearInterval(timers.countdownInterval);
          activeIntervals.delete(room.id);
        }

        // Notify remaining human players
        const remainingPlayers = room.players.filter((p) => p.socketId !== socket.id && !p.isBot);
        remainingPlayers.forEach((p) => {
          io.to(p.socketId).emit("opponent_left", { 
            message: "Your opponent disconnected! You win by default." 
          });
        });
        rooms.delete(currentRoomId);
      }
    }
  });

  // Clean queue function
  function cleanUpQueue(s) {
    quickMatchQueue = quickMatchQueue.filter((x) => x.id !== s.id);
    if (s.queuedVideoId && activeQueues.has(s.queuedVideoId)) {
      const q = activeQueues.get(s.queuedVideoId);
      activeQueues.set(s.queuedVideoId, q.filter((x) => x.id !== s.id));
    }
  }

  // Room Creation Helper (Human Match)
  async function createHumanMatch(p1Socket, p2Socket, videoId, videoObj = null) {
    const roomId = `room_${Math.random().toString(36).substr(2, 9)}`;
    
    let video = videoObj;
    if (!video) {
      // Find in curated
      video = curatedVideos.find((v) => v.id === videoId);
    }

    if (!video) {
      // Construct from socket metadata or default
      const title = p1Socket.queuedVideoTitle || p2Socket.queuedVideoTitle || `Custom Video: ${videoId}`;
      const channel = p1Socket.queuedVideoChannel || p2Socket.queuedVideoChannel || "YouTube Creator";
      const duration = p1Socket.queuedVideoDuration || p2Socket.queuedVideoDuration || 300;
      const thumbnail = p1Socket.queuedVideoThumbnail || p2Socket.queuedVideoThumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      
      const generatedQuestions = await generateQuizForVideo(videoId, title);
      video = {
        id: videoId,
        title,
        channel,
        category: "Custom Watch",
        duration,
        thumbnail,
        questions: generatedQuestions
      };
    }

    const room = {
      id: roomId,
      video,
      players: [
        { socketId: p1Socket.id, username: p1Socket.username, avatar: p1Socket.avatar, selectedClass: p1Socket.selectedClass, progress: 0, finished: false, score: 0, answers: [], submitTime: null, ready: false, isBot: false },
        { socketId: p2Socket.id, username: p2Socket.username, avatar: p2Socket.avatar, selectedClass: p2Socket.selectedClass, progress: 0, finished: false, score: 0, answers: [], submitTime: null, ready: false, isBot: false }
      ],
      status: "waiting",
      createdAt: Date.now()
    };

    rooms.set(roomId, room);
    
    // Join sockets
    p1Socket.join(roomId);
    p2Socket.join(roomId);
    p1Socket.emit("match_found", { roomId, room });
    p2Socket.emit("match_found", { roomId, room });

    currentRoomId = roomId;
    p2Socket.currentRoomId = roomId; // Assign on other socket too
    
    console.log(`[Match] Human Match Created in room "${roomId}" for video "${video.title}"`);
  }

  // Room Creation Helper (Bot Match)
  async function createBotMatch(playerSocket, videoId, customVideoDetails = null) {
    const roomId = `room_${Math.random().toString(36).substr(2, 9)}`;
    const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    
    let video = curatedVideos.find((v) => v.id === videoId);
    if (!video && videoId) {
      // If it's a custom URL/search
      const title = customVideoDetails?.title || playerSocket.queuedVideoTitle || `Custom Video: ${videoId}`;
      const channel = customVideoDetails?.channel || playerSocket.queuedVideoChannel || "YouTube Creator";
      const duration = customVideoDetails?.duration || playerSocket.queuedVideoDuration || 300;
      const thumbnail = customVideoDetails?.thumbnail || playerSocket.queuedVideoThumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      
      const generatedQuestions = await generateQuizForVideo(videoId, title);
      video = {
        id: videoId,
        title,
        channel,
        category: "Custom Watch",
        duration,
        thumbnail,
        questions: generatedQuestions
      };
    }

    if (!video) {
      // Quick Match vs Bot, pick random curated video
      video = curatedVideos[Math.floor(Math.random() * curatedVideos.length)];
    }

    const BOT_CLASSES = ["doomscroller", "speedrunner", "streamsniper", "edgelord", "vibechecker", "glitchmancer", "sigmagrinder", "npc", "brainiac", "gachaaddict"];
    const botClass = BOT_CLASSES[Math.floor(Math.random() * BOT_CLASSES.length)];
    const room = {
      id: roomId,
      video,
      players: [
        { socketId: playerSocket.id, username: playerSocket.username, avatar: playerSocket.avatar, selectedClass: playerSocket.selectedClass, progress: 0, finished: false, score: 0, answers: [], submitTime: null, ready: false, isBot: false },
        { socketId: `bot_${Math.random().toString(36).substr(2, 5)}`, username: botName, avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${botName}&backgroundColor=transparent`, selectedClass: botClass, progress: 0, finished: false, score: 0, answers: [], submitTime: null, ready: true, isBot: true }
      ],
      status: "waiting",
      createdAt: Date.now()
    };

    rooms.set(roomId, room);
    playerSocket.join(roomId);
    playerSocket.emit("match_found", { roomId, room });
    currentRoomId = roomId;

    console.log(`[Match] Bot Match Created in room "${roomId}" for video "${video.title}". Bot: ${botName}`);

    // Simulate bot introduction chat
    setTimeout(() => {
      const intro = BOT_INTRO_CHATS[Math.floor(Math.random() * BOT_INTRO_CHATS.length)];
      sendBotChat(room, botName, intro);
    }, 1500);
  }
});

// Bot chat helper
function sendBotChat(room, sender, message) {
  const chatMsg = {
    id: Math.random().toString(36).substr(2, 9),
    sender,
    message,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
  io.to(room.id).emit("receive_message", chatMsg);
}

// Start Countdown Sequence
function startCountdown(room) {
  room.status = "countdown";
  io.to(room.id).emit("room_update", room);
  console.log(`[Game] Countdown starting in room "${room.id}"`);

  let count = 5;
  const countdownInterval = setInterval(() => {
    io.to(room.id).emit("countdown_tick", { count });
    count--;

    if (count < 0) {
      clearInterval(countdownInterval);
      const timers = activeIntervals.get(room.id);
      if (timers) timers.countdownInterval = null;
      startGameplay(room);
    }
  }, 1000);

  if (!activeIntervals.has(room.id)) {
    activeIntervals.set(room.id, {});
  }
  activeIntervals.get(room.id).countdownInterval = countdownInterval;
}

// Start Video Gameplay
function startGameplay(room) {
  room.status = "playing";
  io.to(room.id).emit("room_update", room);
  io.to(room.id).emit("game_play");
  console.log(`[Game] Play starting in room "${room.id}"`);

  // If there's a bot player, simulate their progress and chat
  const botPlayer = room.players.find((p) => p.isBot);
  if (botPlayer) {
    simulateBotProgress(room, botPlayer);
  }
}

// Bot Simulation Engine
function simulateBotProgress(room, botPlayer) {
  let progressFloat = 0;
  
  // Calculate human-like watch speed (slower, matches realistic scaling)
  let watchSpeedMultiplier = 1.0;
  if (botPlayer.selectedClass === "speedrunner") {
    watchSpeedMultiplier = 0.7; // 30% faster
  } else if (botPlayer.selectedClass === "doomscroller") {
    watchSpeedMultiplier = 1.25; // 25% slower (gets distracted)
  }
  
  const videoDurationMs = (room.video?.duration || 300) * 1000;
  // Bot watches at a human-like pace (e.g. 50% of video duration, capped between 60s and 120s)
  const baseWatchTimeMs = Math.max(60000, Math.min(videoDurationMs * 0.5, 120000));
  const totalWatchTimeMs = baseWatchTimeMs * watchSpeedMultiplier;
  
  const updateIntervalMs = 500;
  const steps = totalWatchTimeMs / updateIntervalMs;
  const increment = 100 / steps;

  // Bot will chat once or twice in the middle of watching
  const chatSteps = [Math.floor(steps * 0.3), Math.floor(steps * 0.7)];

  let currentStep = 0;
  botPlayer.lastPowerupTime = 0;

  const interval = setInterval(() => {
    // Check if room still exists (e.g. if human left)
    if (!rooms.has(room.id)) {
      clearInterval(interval);
      return;
    }

    // If bot is frozen by human player, skip progress updates
    if (botPlayer.isFrozen) {
      io.to(room.id).emit("opponent_progress", {
        socketId: botPlayer.socketId,
        progress: Math.round(progressFloat)
      });
      return;
    }

    currentStep++;
    progressFloat = Math.min(100, progressFloat + increment);
    const displayProgress = Math.round(progressFloat);
    botPlayer.progress = displayProgress;

    // Broadcast bot progress to player
    io.to(room.id).emit("opponent_progress", {
      socketId: botPlayer.socketId,
      progress: displayProgress
    });

    // Send mid chat
    if (chatSteps.includes(currentStep)) {
      const msg = BOT_MID_CHATS[Math.floor(Math.random() * BOT_MID_CHATS.length)];
      sendBotChat(room, botPlayer.username, msg);
    }

    // Bot random powerup attack simulation (15% chance every 8 seconds)
    const now = Date.now();
    if (progressFloat < 100 && now - botPlayer.lastPowerupTime > 8000 && Math.random() < 0.15) {
      const type = Math.random() < 0.5 ? "freeze" : "blur";
      botPlayer.lastPowerupTime = now;
      
      const humanPlayer = room.players.find((p) => !p.isBot);
      if (humanPlayer && !humanPlayer.finished) {
        io.to(humanPlayer.socketId).emit("opponent_powerup", { type });
        
        // Bot taunt message
        const taunts = type === "freeze" 
          ? ["Glitch out! ⚡ Freeze!", "Can you handle the EMP? ⚡", "Pause right there! ⚡"] 
          : ["Eat some smoke! 🌫️ Blur active!", "Getting foggy in here? 🌫️", "Smoke screen deployed! 🌫️"];
        const taunt = taunts[Math.floor(Math.random() * taunts.length)];
        sendBotChat(room, botPlayer.username, taunt);

        const emoji = type === "freeze" ? "⚡ EMP FREEZE" : "🌫️ SMOKE SCREEN";
        sendBotChat(room, "SYSTEM", `⚠️ ${botPlayer.username} deployed ${emoji} on ${humanPlayer.username}!`);
      }
    }

    if (progressFloat >= 100) {
      clearInterval(interval);
      botPlayer.finished = true;
      console.log(`[Bot Simulation] Bot "${botPlayer.username}" finished video in room "${room.id}"`);
      io.to(room.id).emit("room_update", room);

      // Bot starts answering questions immediately
      simulateBotQuizAnswers(room, botPlayer);
    }
  }, updateIntervalMs);

  if (!activeIntervals.has(room.id)) {
    activeIntervals.set(room.id, {});
  }
  activeIntervals.get(room.id).botInterval = interval;
}



// Bot quiz answering simulation
function simulateBotQuizAnswers(room, botPlayer) {
  // Bot takes between 10-18 seconds to answer all 5 questions
  const totalQuestions = room.video.questions.length;
  // If bot is blurred, add 4s delay to represent screen distraction!
  const delayBonus = botPlayer.isBlurred ? 4000 : 0;
  const submitTimeMs = 8000 + Math.random() * 8000 + delayBonus; 

  setTimeout(() => {
    if (!rooms.has(room.id)) return;

    botPlayer.submitted = true;
    botPlayer.submitTime = Date.now();
    botPlayer.multiplier = 1.0;
    botPlayer.watchProgressAtSubmission = 100;

    // Generate bot answers
    const botAnswers = [];
    let correctCount = 0;
    
    // Bot has a 75% accuracy rate, but if blurred it drops to 50%
    const accuracy = botPlayer.isBlurred ? 0.50 : 0.75;
    
    room.video.questions.forEach((q, idx) => {
      const isCorrect = Math.random() < accuracy;
      let selectedOption;
      if (isCorrect) {
        selectedOption = q.answerIndex;
        correctCount++;
      } else {
        // Pick a random incorrect option
        const incorrectOptions = [0, 1, 2, 3].filter((i) => i !== q.answerIndex);
        selectedOption = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
      }
      botAnswers.push(selectedOption);
    });

    botPlayer.answers = botAnswers;
    botPlayer.score = correctCount * 100;
    botPlayer.correctCount = correctCount;

    console.log(`[Bot Simulation] Bot "${botPlayer.username}" submitted quiz. Correct: ${correctCount}/5 (Blurred: ${!!botPlayer.isBlurred})`);

    // Send chat message about submission
    const msg = BOT_SUBMIT_CHATS[Math.floor(Math.random() * BOT_SUBMIT_CHATS.length)];
    sendBotChat(room, botPlayer.username, msg);

    // Notify human player
    io.to(room.id).emit("opponent_submitted", { username: botPlayer.username });

    // Check if human also submitted
    const allSubmitted = room.players.every((p) => p.submitted);
    if (allSubmitted) {
      evaluateGame(room);
    }
  }, submitTimeMs);
}

// Bot powerup hit handler
function handleBotHitByPowerup(room, botPlayer, type) {
  console.log(`[Bot Powerup] Bot "${botPlayer.username}" hit by "${type}" in room "${room.id}"`);
  if (type === "freeze") {
    botPlayer.isFrozen = true;
    setTimeout(() => {
      botPlayer.isFrozen = false;
    }, 3000);
  } else if (type === "blur") {
    botPlayer.isBlurred = true;
    setTimeout(() => {
      botPlayer.isBlurred = false;
    }, 5000);
  }
}

// Evaluate Match & Announce Winner
function evaluateGame(room) {
  room.status = "finished";
  
  const p1 = room.players[0];
  const p2 = room.players[1];

  let winner = null;
  let loser = null;
  let isDraw = false;

  // Evaluation criteria:
  // 1. The player who submits first wins the game, provided they have at least 70% correct answers.
  // 2. If the first submitter does not meet the 70% threshold, but the second submitter does, the second submitter wins.
  // 3. Otherwise, fall back to standard rules: higher score wins, and if scores are tied, the faster submission wins.
  const totalQuestions = room.video?.questions?.length || 5;
  const p1Pct = p1.correctCount / totalQuestions;
  const p2Pct = p2.correctCount / totalQuestions;

  const p1Time = p1.submitTime || Infinity;
  const p2Time = p2.submitTime || Infinity;

  if (p1Time < p2Time) {
    // p1 submitted first
    if (p1Pct >= 0.7) {
      winner = p1;
      loser = p2;
    } else if (p2Pct >= 0.7) {
      winner = p2;
      loser = p1;
    } else {
      // Fallback
      if (p1.score > p2.score) {
        winner = p1;
        loser = p2;
      } else if (p2.score > p1.score) {
        winner = p2;
        loser = p1;
      } else {
        winner = p1; // p1 was faster
        loser = p2;
        winner.score += 50; // speed bonus
      }
    }
  } else if (p2Time < p1Time) {
    // p2 submitted first
    if (p2Pct >= 0.7) {
      winner = p2;
      loser = p1;
    } else if (p1Pct >= 0.7) {
      winner = p1;
      loser = p2;
    } else {
      // Fallback
      if (p1.score > p2.score) {
        winner = p1;
        loser = p2;
      } else if (p2.score > p1.score) {
        winner = p2;
        loser = p1;
      } else {
        winner = p2; // p2 was faster
        loser = p1;
        winner.score += 50; // speed bonus
      }
    }
  } else {
    // Both timed out or submitted at exact same time
    if (p1Pct >= 0.7 && p2Pct < 0.7) {
      winner = p1;
      loser = p2;
    } else if (p2Pct >= 0.7 && p1Pct < 0.7) {
      winner = p2;
      loser = p1;
    } else {
      // Fallback
      if (p1.score > p2.score) {
        winner = p1;
        loser = p2;
      } else if (p2.score > p1.score) {
        winner = p2;
        loser = p1;
      } else {
        isDraw = true;
      }
    }
  }

  const results = {
    draw: isDraw,
    winner: winner ? { username: winner.username, score: winner.score, correctCount: winner.correctCount } : null,
    loser: loser ? { username: loser.username, score: loser.score, correctCount: loser.correctCount } : null,
    players: room.players.map((p) => ({
      username: p.username,
      score: p.score,
      correctCount: p.correctCount,
      submitTimeSec: (((p.submitTime || Date.now()) - room.createdAt) / 1000).toFixed(1),
      answers: p.answers,
      multiplier: p.multiplier || 1.0,
      watchProgress: p.watchProgressAtSubmission || 100
    }))
  };

  // Update XP and levels for human players
  room.players.forEach((p) => {
    if (!p.isBot) {
      let xpGained = 50; // base participation XP
      let won = false;

      if (isDraw) {
        xpGained = 80;
      } else if (winner && p.username === winner.username) {
        xpGained = 150; // victory XP
        won = true;
      }

      const { user, leveledUp } = updatePlayerStats(p.username, xpGained, won, room.video, p.avatar, p.selectedClass);
      p.xpGained = xpGained;
      p.leveledUp = leveledUp;
      p.totalXp = user.xp;
      p.level = user.level;
    }
  });

  io.to(room.id).emit("game_over", { results, room, leaderboard });
  console.log(`[Game] Room "${room.id}" finished. Winner: ${isDraw ? "Draw" : winner.username}`);
  
  // Cancel active intervals if any
  const timers = activeIntervals.get(room.id);
  if (timers) {
    if (timers.botInterval) clearInterval(timers.botInterval);
    if (timers.botChatInterval) clearInterval(timers.botChatInterval);
    if (timers.countdownInterval) clearInterval(timers.countdownInterval);
    activeIntervals.delete(room.id);
  }

  // Delete room
  rooms.delete(room.id);
}

// Start Server
httpServer.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` ytPlay Backend Server Running on Port ${PORT}`);
  console.log(`========================================`);
});
