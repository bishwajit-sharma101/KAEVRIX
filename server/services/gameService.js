import { curatedVideos } from "../quizData.js";
import { generateQuizForVideo } from "../geminiService.js";
import { 
  BOT_NAMES, 
  BOT_INTRO_CHATS, 
  BOT_MID_CHATS, 
  BOT_SUBMIT_CHATS 
} from "../config/constants.js";
import { updatePlayerStats, getLeaderboard } from "./leaderboardService.js";
import TelemetryEvent from "../models/TelemetryEvent.js";
import redisClient from "../config/redis.js";
import logger from "../config/logger.js";

export const rooms = new Map(); // roomId -> room details (kept for backward compatibility interfaces, though primary is Redis)
export const activeIntervals = new Map(); // roomId -> { botInterval, botChatInterval, countdownInterval, createdAt }

// H3 fix: Periodic sweep to clean up orphaned timers
// If Redis pub/sub fails during disconnect, timers would run forever.
// This sweep checks every 5 minutes and clears timers for rooms that no longer exist in Redis.
setInterval(async () => {
  for (const [roomId, timers] of activeIntervals.entries()) {
    try {
      const roomExists = await redisClient.exists(`room:${roomId}`);
      if (!roomExists) {
        if (timers.botInterval) clearInterval(timers.botInterval);
        if (timers.botChatInterval) clearInterval(timers.botChatInterval);
        if (timers.countdownInterval) clearInterval(timers.countdownInterval);
        activeIntervals.delete(roomId);
        logger.info(`[Timer Sweep] Cleaned orphaned timers for expired room`, { roomId });
      }
    } catch (err) {
      // Redis may be unreachable — skip this room and retry next sweep
    }
  }
}, 5 * 60 * 1000);

let io = null;

export function init(socketIo) {
  io = socketIo;
}

// Redis database getters/setters for distributed rooms
export async function getRoom(roomId) {
  const data = await redisClient.get(`room:${roomId}`);
  return data ? JSON.parse(data) : null;
}

export async function saveRoom(roomId, room) {
  await redisClient.set(`room:${roomId}`, JSON.stringify(room), "EX", 3600); // 1 hour TTL
}

export async function deleteRoom(roomId) {
  await redisClient.del(`room:${roomId}`);
}

// Subscribe to global game signals (cross-server timers synchronization)
const signalSubClient = redisClient.duplicate();
signalSubClient.subscribe("game-signals");
signalSubClient.on("message", (channel, message) => {
  if (channel === "game-signals") {
    try {
      const signal = JSON.parse(message);
      if (signal.type === "clear-intervals") {
        const timers = activeIntervals.get(signal.roomId);
        if (timers) {
          if (timers.botInterval) clearInterval(timers.botInterval);
          if (timers.botChatInterval) clearInterval(timers.botChatInterval);
          if (timers.countdownInterval) clearInterval(timers.countdownInterval);
          activeIntervals.delete(signal.roomId);
          logger.info(`[Game Signals] Cleared intervals globally for room`, { roomId: signal.roomId });
        }
      }
    } catch (err) {
      logger.error("[Game Signals] Failed to parse game signal message", { error: err.message, stack: err.stack });
    }
  }
});

// Bot chat helper
export function sendBotChat(room, sender, message) {
  if (!io) return;
  const chatMsg = {
    id: Math.random().toString(36).substr(2, 9),
    sender,
    message,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
  io.to(room.id).emit("receive_message", chatMsg);
}

// Room Creation Helper (Human Match)
export async function createHumanMatch(p1, p2, videoId, videoObj = null) {
  const roomId = `room_${Math.random().toString(36).substr(2, 9)}`;
  
  // Determine if parameters are sockets or ID/meta pairs
  let p1SocketId, p1Meta, p2SocketId, p2Meta;
  if (typeof p1 === "string") {
    p1SocketId = p1;
    p1Meta = p2;
    p2SocketId = videoId;
    p2Meta = videoObj;
    videoId = arguments[4];
    videoObj = arguments[5] || null;
  } else {
    p1SocketId = p1.id;
    p1Meta = {
      username: p1.username,
      avatar: p1.avatar,
      selectedClass: p1.selectedClass || "doomscroller",
      queuedVideoTitle: p1.queuedVideoTitle,
      queuedVideoChannel: p1.queuedVideoChannel,
      queuedVideoDuration: p1.queuedVideoDuration,
      queuedVideoThumbnail: p1.queuedVideoThumbnail
    };
    p2SocketId = p2.id;
    p2Meta = {
      username: p2.username,
      avatar: p2.avatar,
      selectedClass: p2.selectedClass || "doomscroller",
      queuedVideoTitle: p2.queuedVideoTitle,
      queuedVideoChannel: p2.queuedVideoChannel,
      queuedVideoDuration: p2.queuedVideoDuration,
      queuedVideoThumbnail: p2.queuedVideoThumbnail
    };
  }

  let video = videoObj;
  if (!video) {
    const curated = curatedVideos.find((v) => v.id === videoId);
    if (curated) {
      video = { ...curated };
    }
  }

  let isGenerating = false;
  if (!video) {
    const title = p1Meta.queuedVideoTitle || p2Meta.queuedVideoTitle || `Custom Video: ${videoId}`;
    const channel = p1Meta.queuedVideoChannel || p2Meta.queuedVideoChannel || "YouTube Creator";
    const duration = Number(p1Meta.queuedVideoDuration || p2Meta.queuedVideoDuration) || 300;
    const thumbnail = p1Meta.queuedVideoThumbnail || p2Meta.queuedVideoThumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    
    video = {
      id: videoId,
      title,
      channel,
      category: "Custom Watch",
      duration,
      thumbnail,
      questions: [],
      inVideoQuestions: [],
      captions: []
    };
    isGenerating = true;
  } else {
    if (!video.inVideoQuestions) {
      isGenerating = true;
    }
  }

  const room = {
    id: roomId,
    video,
    generatingQuiz: isGenerating,
    players: [
      { socketId: p1SocketId, username: p1Meta.username, avatar: p1Meta.avatar, selectedClass: p1Meta.selectedClass, progress: 0, finished: false, score: 0, answers: [], submitTime: null, ready: false, isBot: false, inVideoXp: 0 },
      { socketId: p2SocketId, username: p2Meta.username, avatar: p2Meta.avatar, selectedClass: p2Meta.selectedClass, progress: 0, finished: false, score: 0, answers: [], submitTime: null, ready: false, isBot: false, inVideoXp: 0 }
    ],
    status: "waiting",
    createdAt: Date.now()
  };

  // Join sockets cluster-wide
  io.in(p1SocketId).socketsJoin(roomId);
  io.in(p2SocketId).socketsJoin(roomId);

  // Store room mapping in Redis
  await Promise.all([
    redisClient.set(`socket:room:${p1SocketId}`, roomId, "EX", 3600),
    redisClient.set(`socket:room:${p2SocketId}`, roomId, "EX", 3600)
  ]);

  // Set locally if local socket connection exists
  const s1 = io.sockets.sockets.get(p1SocketId);
  if (s1) s1.currentRoomId = roomId;
  const s2 = io.sockets.sockets.get(p2SocketId);
  if (s2) s2.currentRoomId = roomId;

  await saveRoom(roomId, room);
  
  io.to(p1SocketId).emit("match_found", { roomId, room });
  io.to(p2SocketId).emit("match_found", { roomId, room });

  logger.info(`[Match] Human Match Created`, { roomId, videoId: video.id, videoTitle: video.title, isGenerating });
  
  TelemetryEvent.create({
    username: p1Meta.username,
    eventType: "SANCTUM_MATCH_FOUND",
    metadata: { roomId, videoId: video.id, opponent: p2Meta.username }
  }).catch(err => logger.error("Telemetry failed in match found", { error: err.message }));

  TelemetryEvent.create({
    username: p2Meta.username,
    eventType: "SANCTUM_MATCH_FOUND",
    metadata: { roomId, videoId: video.id, opponent: p1Meta.username }
  }).catch(err => logger.error("Telemetry failed in match found", { error: err.message }));

  // Skip lobby - immediately start countdown
  startCountdown(roomId);

  if (isGenerating) {
    generateQuizForVideo(video.id, video.title, video.duration).then(async (generatedQuestions) => {
      const r = await getRoom(roomId);
      if (r) {
        r.video.questions = r.video.questions?.length ? r.video.questions : generatedQuestions.postVideoQuestions;
        r.video.inVideoQuestions = generatedQuestions.inVideoQuestions;
        r.video.captions = generatedQuestions.captions || [];
        r.generatingQuiz = false;
        await saveRoom(roomId, r);
        io.to(roomId).emit("room_update", r);
        logger.info(`[Match] AI Quiz Generation complete for room`, { roomId });
      }
    }).catch(err => logger.error(`[Match] Failed to generate quiz for room`, { roomId, error: err.message, stack: err.stack }));
  }
}

// Room Creation Helper (Bot Match)
export async function createBotMatch(player, videoIdOrMeta, videoId, customVideoDetails = null) {
  const roomId = `room_${Math.random().toString(36).substr(2, 9)}`;
  const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  
  let playerSocketId, playerMeta;
  if (typeof player === "string") {
    playerSocketId = player;
    playerMeta = videoIdOrMeta;
    videoId = videoId;
    customVideoDetails = customVideoDetails;
  } else {
    playerSocketId = player.id;
    playerMeta = {
      username: player.username,
      avatar: player.avatar,
      selectedClass: player.selectedClass || "doomscroller",
      queuedVideoTitle: player.queuedVideoTitle,
      queuedVideoChannel: player.queuedVideoChannel,
      queuedVideoDuration: player.queuedVideoDuration,
      queuedVideoThumbnail: player.queuedVideoThumbnail
    };
    videoId = videoIdOrMeta;
  }
  
  let video = curatedVideos.find((v) => v.id === videoId);
  if (video) {
    video = { ...video };
  }
  let isGenerating = false;
  if (!video && videoId) {
    const title = customVideoDetails?.title || playerMeta.queuedVideoTitle || `Custom Video: ${videoId}`;
    const channel = customVideoDetails?.channel || playerMeta.queuedVideoChannel || "YouTube Creator";
    const duration = Number(customVideoDetails?.duration || playerMeta.queuedVideoDuration) || 300;
    const thumbnail = customVideoDetails?.thumbnail || playerMeta.queuedVideoThumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    
    video = {
      id: videoId,
      title,
      channel,
      category: "Custom Watch",
      duration,
      thumbnail,
      questions: [],
      inVideoQuestions: [],
      captions: []
    };
    isGenerating = true;
  }

  if (!video) {
    const randomCurated = curatedVideos[Math.floor(Math.random() * curatedVideos.length)];
    video = { ...randomCurated };
  }

  if (!video.inVideoQuestions) {
    isGenerating = true;
  }

  const BOT_CLASSES = ["doomscroller", "speedrunner", "streamsniper", "edgelord", "vibechecker", "glitchmancer", "sigmagrinder", "npc", "brainiac", "gachaaddict"];
  const botClass = BOT_CLASSES[Math.floor(Math.random() * BOT_CLASSES.length)];
  const room = {
    id: roomId,
    video,
    generatingQuiz: isGenerating,
    players: [
      { socketId: playerSocketId, username: playerMeta.username, avatar: playerMeta.avatar, selectedClass: playerMeta.selectedClass, progress: 0, finished: false, score: 0, answers: [], submitTime: null, ready: false, isBot: false, inVideoXp: 0 },
      { socketId: `bot_${Math.random().toString(36).substr(2, 5)}`, username: botName, avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${botName}&backgroundColor=transparent`, selectedClass: botClass, progress: 0, finished: false, score: 0, answers: [], submitTime: null, ready: true, isBot: true, promptedInVideoIndices: [], isAnsweringInVideo: false, inVideoXp: 0 }
    ],
    status: "waiting",
    createdAt: Date.now()
  };

  io.in(playerSocketId).socketsJoin(roomId);
  await redisClient.set(`socket:room:${playerSocketId}`, roomId, "EX", 3600);
  const s = io.sockets.sockets.get(playerSocketId);
  if (s) s.currentRoomId = roomId;

  await saveRoom(roomId, room);
  io.to(playerSocketId).emit("match_found", { roomId, room });

  logger.info(`[Match] Bot Match Created`, { roomId, videoId: video.id, videoTitle: video.title, botName, isGenerating });
  
  TelemetryEvent.create({
    username: playerMeta.username,
    eventType: "SANCTUM_MATCH_FOUND",
    metadata: { roomId, videoId: video.id, opponent: botName, isBot: true }
  }).catch(err => logger.error("Telemetry failed in bot match found", { error: err.message }));

  // Skip lobby - immediately start countdown
  startCountdown(roomId);

  if (isGenerating) {
    generateQuizForVideo(video.id, video.title, video.duration).then(async (generatedQuestions) => {
      const r = await getRoom(roomId);
      if (r) {
        r.video.questions = r.video.questions?.length ? r.video.questions : generatedQuestions.postVideoQuestions;
        r.video.inVideoQuestions = generatedQuestions.inVideoQuestions;
        r.video.captions = generatedQuestions.captions || [];
        r.generatingQuiz = false;
        await saveRoom(roomId, r);
        io.to(roomId).emit("room_update", r);
        logger.info(`[Match] AI Quiz Generation complete for bot room`, { roomId });
      }
    }).catch(err => logger.error(`[Match] Failed to generate quiz for bot room`, { roomId, error: err.message, stack: err.stack }));
  }

  // Simulate bot introduction chat
  setTimeout(() => {
    const intro = BOT_INTRO_CHATS[Math.floor(Math.random() * BOT_INTRO_CHATS.length)];
    sendBotChat(room, botName, intro);
  }, 1500);
}

// Start Countdown Sequence
export async function startCountdown(roomOrRoomId) {
  if (!io) return;
  const roomId = typeof roomOrRoomId === "string" ? roomOrRoomId : roomOrRoomId.id;
  const room = await getRoom(roomId);
  if (!room) return;

  room.status = "countdown";
  await saveRoom(roomId, room);
  io.to(roomId).emit("room_update", room);
  logger.info(`[Game] Countdown starting in room`, { roomId });

  let count = 5;
  const countdownInterval = setInterval(async () => {
    io.to(roomId).emit("countdown_tick", { count });
    count--;

    if (count < 0) {
      clearInterval(countdownInterval);
      const timers = activeIntervals.get(roomId);
      if (timers) timers.countdownInterval = null;
      await startGameplay(roomId);
    }
  }, 1000);

  if (!activeIntervals.has(roomId)) {
    activeIntervals.set(roomId, {});
  }
  activeIntervals.get(roomId).countdownInterval = countdownInterval;
}

// Start Video Gameplay
export async function startGameplay(roomId) {
  if (!io) return;
  const room = await getRoom(roomId);
  if (!room) return;

  room.status = "playing";
  await saveRoom(roomId, room);
  io.to(roomId).emit("room_update", room);
  io.to(roomId).emit("game_play");
  logger.info(`[Game] Play starting in room`, { roomId });

  // Telemetry
  room.players.forEach(p => {
    if (!p.isBot) {
      TelemetryEvent.create({
        username: p.username,
        eventType: "SANCTUM_JOINED",
        metadata: { videoId: room.video?.id, roomId }
      }).catch(err => logger.error("Telemetry failed in gameplay start", { error: err.message }));
      
      TelemetryEvent.create({
        username: p.username,
        eventType: "VIDEO_OPENED",
        metadata: { videoId: room.video?.id, roomId }
      }).catch(err => logger.error("Telemetry failed in video opened", { error: err.message }));
    }
  });

  // If there's a bot player, simulate their progress and chat
  const botPlayer = room.players.find((p) => p.isBot);
  if (botPlayer) {
    simulateBotProgress(room, botPlayer);
  }
}

// Bot Simulation Engine
export function simulateBotProgress(room, botPlayer) {
  let progressFloat = 0;
  
  // Calculate human-like watch speed
  let watchSpeedMultiplier = 1.0;
  if (botPlayer.selectedClass === "speedrunner") {
    watchSpeedMultiplier = 0.7; // 30% faster
  } else if (botPlayer.selectedClass === "doomscroller") {
    watchSpeedMultiplier = 1.25; // 25% slower
  }
  
  const videoDurationMs = Number(room.video?.duration || 300) * 1000;
  const baseWatchTimeMs = Math.max(60000, Math.min(videoDurationMs * 0.5, 120000));
  const totalWatchTimeMs = baseWatchTimeMs * watchSpeedMultiplier;
  
  const updateIntervalMs = 500;
  const steps = totalWatchTimeMs / updateIntervalMs;
  const increment = 100 / steps;

  const chatSteps = [Math.floor(steps * 0.3), Math.floor(steps * 0.7)];

  let currentStep = 0;
  botPlayer.lastPowerupTime = 0;

  const interval = setInterval(async () => {
    // Check if room still exists in Redis
    const latestRoom = await getRoom(room.id);
    if (!latestRoom) {
      clearInterval(interval);
      return;
    }

    const bot = latestRoom.players.find(p => p.isBot);
    if (!bot) {
      clearInterval(interval);
      return;
    }

    // If bot is answering an in-video question, pause progress updates
    if (bot.isAnsweringInVideo) {
      return;
    }

    // If bot is frozen, skip progress updates
    if (bot.isFrozen) {
      io.to(latestRoom.id).emit("opponent_progress", {
        socketId: bot.socketId,
        progress: Math.round(progressFloat)
      });
      return;
    }

    // Calculate current elapsed time in seconds
    const botTimeSec = (progressFloat / 100) * Number(latestRoom.video?.duration || 300);
    const inVideoQs = latestRoom.video?.inVideoQuestions || [];
    const nextQIdx = inVideoQs.findIndex((q, idx) => botTimeSec >= q.timestamp && !bot.promptedInVideoIndices.includes(idx));
    
    if (nextQIdx !== -1) {
      bot.promptedInVideoIndices.push(nextQIdx);
      bot.isAnsweringInVideo = true;
      await saveRoom(latestRoom.id, latestRoom);
      
      const delaySec = 1.5 + Math.random() * 3.0;
      const delayMs = delaySec * 1000;
      
      setTimeout(async () => {
        const r = await getRoom(latestRoom.id);
        if (!r) return;
        const b = r.players.find(p => p.isBot);
        if (!b) return;
        
        const q = r.video.inVideoQuestions[nextQIdx];
        const accuracy = b.isBlurred ? 0.50 : 0.75;
        const isCorrect = Math.random() < accuracy;
        
        let scoreGained = 0;
        let xpGained = 0;
        
        if (isCorrect) {
          const remainingSeconds = Math.max(0, 6 - delaySec);
          const speedBonus = Math.round(remainingSeconds) * 5;
          xpGained = 50 + speedBonus;
          scoreGained = 50 + speedBonus;
          
          b.score = (b.score || 0) + scoreGained;
          b.inVideoXp = (b.inVideoXp || 0) + xpGained;
        }
        
        logger.info(`[Bot Simulation] Bot answered in-video question`, { roomId: latestRoom.id, questionIndex: nextQIdx, isCorrect });

        if (Math.random() < 0.4) {
          const botReactions = isCorrect 
            ? ["Got it! That was easy.", "Nice, I knew that one!", "Boom, got the speed bonus!"] 
            : ["Wait, what? I missed that part.", "Ah, that was a trick question!", "Oof, dynamic questions are hard."];
          const reaction = botReactions[Math.floor(Math.random() * botReactions.length)];
          sendBotChat(r, b.username, reaction);
        }
        
        b.isAnsweringInVideo = false;
        await saveRoom(r.id, r);
        io.to(r.id).emit("room_update", r);
      }, delayMs);
      
      return;
    }

    currentStep++;
    progressFloat = Math.min(100, progressFloat + increment);
    const displayProgress = Math.round(progressFloat);
    bot.progress = displayProgress;

    await saveRoom(latestRoom.id, latestRoom);

    // Broadcast bot progress to player
    io.to(latestRoom.id).emit("opponent_progress", {
      socketId: bot.socketId,
      progress: displayProgress
    });

    // Send mid chat
    if (chatSteps.includes(currentStep)) {
      const msg = BOT_MID_CHATS[Math.floor(Math.random() * BOT_MID_CHATS.length)];
      sendBotChat(latestRoom, bot.username, msg);
    }

    // Bot random powerup attack simulation
    const now = Date.now();
    if (progressFloat < 100 && now - (bot.lastPowerupTime || 0) > 8000 && Math.random() < 0.15) {
      const type = Math.random() < 0.5 ? "freeze" : "blur";
      bot.lastPowerupTime = now;
      await saveRoom(latestRoom.id, latestRoom);
      
      const humanPlayer = latestRoom.players.find((p) => !p.isBot);
      if (humanPlayer && !humanPlayer.finished) {
        io.to(humanPlayer.socketId).emit("opponent_powerup", { type });
        
        const taunts = type === "freeze" 
          ? ["Glitch out! ⚡ Freeze!", "Can you handle the EMP? ⚡", "Pause right there! ⚡"] 
          : ["Eat some smoke! 🌫️ Blur active!", "Getting foggy in here? 🌫️", "Smoke screen deployed! 🌫️"];
        const taunt = taunts[Math.floor(Math.random() * taunts.length)];
        sendBotChat(latestRoom, bot.username, taunt);
 
        const emoji = type === "freeze" ? "⚡ EMP FREEZE" : "🌫️ SMOKE SCREEN";
        sendBotChat(latestRoom, "SYSTEM", `⚠️ ${bot.username} deployed ${emoji} on ${humanPlayer.username}!`);
      }
    }

    if (progressFloat >= 100) {
      clearInterval(interval);
      bot.finished = true;
      await saveRoom(latestRoom.id, latestRoom);
      logger.info(`[Bot Simulation] Bot finished video`, { roomId: latestRoom.id, botName: bot.username });
      io.to(latestRoom.id).emit("room_update", latestRoom);

      simulateBotQuizAnswers(latestRoom, bot);
    }
  }, updateIntervalMs);

  if (!activeIntervals.has(room.id)) {
    activeIntervals.set(room.id, {});
  }
  activeIntervals.get(room.id).botInterval = interval;
}

// Bot quiz answering simulation
export function simulateBotQuizAnswers(room, botPlayer) {
  const totalQuestions = room.video.questions.length;
  const delayBonus = botPlayer.isBlurred ? 4000 : 0;
  const submitTimeMs = 8000 + Math.random() * 8000 + delayBonus; 

  setTimeout(async () => {
    const latestRoom = await getRoom(room.id);
    if (!latestRoom) return;

    const bot = latestRoom.players.find(p => p.isBot);
    if (!bot) return;

    bot.submitted = true;
    bot.submitTime = Date.now();
    bot.multiplier = 1.0;
    bot.watchProgressAtSubmission = 100;

    const botAnswers = [];
    let correctCount = 0;
    const accuracy = bot.isBlurred ? 0.50 : 0.75;
    
    latestRoom.video.questions.forEach((q, idx) => {
      const isCorrect = Math.random() < accuracy;
      let selectedOption;
      if (isCorrect) {
        selectedOption = q.answerIndex;
        correctCount++;
      } else {
        const incorrectOptions = [0, 1, 2, 3].filter((i) => i !== q.answerIndex);
        selectedOption = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
      }
      botAnswers.push(selectedOption);
    });

    bot.answers = botAnswers;
    bot.score = correctCount * 100;
    bot.correctCount = correctCount;

    logger.info(`[Bot Simulation] Bot submitted quiz`, { roomId: latestRoom.id, botName: bot.username, correctCount });

    const msg = BOT_SUBMIT_CHATS[Math.floor(Math.random() * BOT_SUBMIT_CHATS.length)];
    sendBotChat(latestRoom, bot.username, msg);

    io.to(latestRoom.id).emit("opponent_submitted", { username: bot.username });

    const allSubmitted = latestRoom.players.every((p) => p.submitted);
    if (allSubmitted) {
      await evaluateGame(latestRoom);
    } else {
      await saveRoom(latestRoom.id, latestRoom);
    }
  }, submitTimeMs);
}

// Bot powerup hit handler
export async function handleBotHitByPowerup(roomOrRoomId, botPlayer, type) {
  const roomId = typeof roomOrRoomId === "string" ? roomOrRoomId : roomOrRoomId.id;
  const latestRoom = await getRoom(roomId);
  if (!latestRoom) return;
  const bot = latestRoom.players.find(p => p.isBot);
  if (!bot) return;

  logger.info(`[Bot Powerup] Bot hit by powerup`, { roomId, botName: bot.username, type });
  if (type === "freeze") {
    bot.isFrozen = true;
    await saveRoom(roomId, latestRoom);
    setTimeout(async () => {
      const r = await getRoom(roomId);
      if (r) {
        const b = r.players.find(p => p.isBot);
        if (b) {
          b.isFrozen = false;
          await saveRoom(roomId, r);
        }
      }
    }, 3000);
  } else if (type === "blur") {
    bot.isBlurred = true;
    await saveRoom(roomId, latestRoom);
    setTimeout(async () => {
      const r = await getRoom(roomId);
      if (r) {
        const b = r.players.find(p => p.isBot);
        if (b) {
          b.isBlurred = false;
          await saveRoom(roomId, r);
        }
      }
    }, 5000);
  }
}

// Evaluate Match & Announce Winner
export async function evaluateGame(roomOrRoomId) {
  if (!io) return;
  const roomId = typeof roomOrRoomId === "string" ? roomOrRoomId : roomOrRoomId.id;
  const room = await getRoom(roomId);
  if (!room) return;

  room.status = "finished";
  
  const p1 = room.players[0];
  const p2 = room.players[1];

  let winner = null;
  let loser = null;
  let isDraw = false;

  const totalQuestions = room.video?.questions?.length || 5;
  const p1Pct = p1.correctCount / totalQuestions;
  const p2Pct = p2.correctCount / totalQuestions;

  const p1Time = p1.submitTime || Infinity;
  const p2Time = p2.submitTime || Infinity;

  if (p1Time < p2Time) {
    if (p1Pct >= 0.7) {
      winner = p1;
      loser = p2;
    } else if (p2Pct >= 0.7) {
      winner = p2;
      loser = p1;
    } else {
      if (p1.score > p2.score) {
        winner = p1;
        loser = p2;
      } else if (p2.score > p1.score) {
        winner = p2;
        loser = p1;
      } else {
        winner = p1;
        loser = p2;
        winner.score += 50;
      }
    }
  } else if (p2Time < p1Time) {
    if (p2Pct >= 0.7) {
      winner = p2;
      loser = p1;
    } else if (p1Pct >= 0.7) {
      winner = p1;
      loser = p2;
    } else {
      if (p1.score > p2.score) {
        winner = p1;
        loser = p2;
      } else if (p2.score > p1.score) {
        winner = p2;
        loser = p1;
      } else {
        winner = p2;
        loser = p1;
        winner.score += 50;
      }
    }
  } else {
    if (p1Pct >= 0.7 && p2Pct < 0.7) {
      winner = p1;
      loser = p2;
    } else if (p2Pct >= 0.7 && p1Pct < 0.7) {
      winner = p2;
      loser = p1;
    } else {
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
  for (const p of room.players) {
    if (!p.isBot) {
      let base = 50;
      let won = false;

      if (isDraw) {
        base = 80;
      } else if (winner && p.username === winner.username) {
        base = 150;
        won = true;
      }

      const xpGained = base + (p.inVideoXp || 0);
      const { user, leveledUp } = await updatePlayerStats(p.username, xpGained, won, room.video, p.avatar, p.selectedClass);
      p.xpGained = xpGained;
      p.leveledUp = leveledUp;
      if (user) {
        p.totalXp = user.xp;
        p.level = user.level;
      }

      const userId = user ? user._id : null;
      const passThreshold = 0.6;
      const percentage = p.correctCount / totalQuestions;
      const passed = percentage >= passThreshold;
      const eventType = passed ? "QUIZ_COMPLETED" : "QUIZ_FAILED";

      await TelemetryEvent.create({
        userId,
        username: p.username,
        eventType,
        videoId: room.video?.id,
        metadata: {
          score: p.score,
          percentage: (percentage * 100).toFixed(1) + "%",
          passed,
          questionCount: totalQuestions,
          correctAnswers: p.correctCount,
          incorrectAnswers: totalQuestions - p.correctCount,
          failureReason: passed ? null : "Low Score",
          difficulty: "Medium"
        }
      }).catch(err => logger.error("Telemetry failed in quiz completion", { error: err.message }));

      await TelemetryEvent.create({
        userId,
        username: p.username,
        eventType: won ? "SANCTUM_WON" : "SANCTUM_LOST",
        videoId: room.video?.id,
        metadata: {
          completionStatus: won ? "won" : (isDraw ? "draw" : "lost"),
          roomId
        }
      }).catch(err => logger.error("Telemetry failed in match completion", { error: err.message }));

      if (user) {
        await TelemetryEvent.create({
          userId: user._id,
          username: p.username,
          eventType: "XP_AWARDED",
          xpAwarded: xpGained,
          metadata: {
            xpBefore: user.xp - xpGained,
            xpAfter: user.xp,
            source: "SANCTUM_COMPLETED"
          }
        }).catch(err => logger.error("Telemetry failed in xp award", { error: err.message }));
      }
    }
  }

  const leaderboard = await getLeaderboard();
  io.to(roomId).emit("game_over", { results, room, leaderboard });
  logger.info(`[Game] Room finished`, { roomId, winner: isDraw ? "Draw" : winner?.username });
  
  // Publish signal to cancel active intervals across all node workers
  await redisClient.publish("game-signals", JSON.stringify({ type: "clear-intervals", roomId }));
  
  // Delete room from Redis
  await deleteRoom(roomId);
}
