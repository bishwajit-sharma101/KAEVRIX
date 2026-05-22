import { curatedVideos } from "../quizData.js";
import { generateQuizForVideo } from "../geminiService.js";
import { 
  BOT_NAMES, 
  BOT_INTRO_CHATS, 
  BOT_MID_CHATS, 
  BOT_SUBMIT_CHATS 
} from "../config/constants.js";
import { updatePlayerStats, getLeaderboard } from "./leaderboardService.js";

export const rooms = new Map(); // roomId -> room details
export const activeIntervals = new Map(); // roomId -> { botInterval, botChatInterval, countdownInterval }

let io = null;

export function init(socketIo) {
  io = socketIo;
}

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
export async function createHumanMatch(p1Socket, p2Socket, videoId, videoObj = null) {
  const roomId = `room_${Math.random().toString(36).substr(2, 9)}`;
  
  let video = videoObj;
  if (!video) {
    // Find in curated
    const curated = curatedVideos.find((v) => v.id === videoId);
    if (curated) {
      video = { ...curated };
    }
  }

  if (!video) {
    // Construct from socket metadata or default
    const title = p1Socket.queuedVideoTitle || p2Socket.queuedVideoTitle || `Custom Video: ${videoId}`;
    const channel = p1Socket.queuedVideoChannel || p2Socket.queuedVideoChannel || "YouTube Creator";
    const duration = Number(p1Socket.queuedVideoDuration || p2Socket.queuedVideoDuration) || 300;
    const thumbnail = p1Socket.queuedVideoThumbnail || p2Socket.queuedVideoThumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    
    const generatedQuestions = await generateQuizForVideo(videoId, title, duration);
    video = {
      id: videoId,
      title,
      channel,
      category: "Custom Watch",
      duration,
      thumbnail,
      questions: generatedQuestions.postVideoQuestions,
      inVideoQuestions: generatedQuestions.inVideoQuestions,
      captions: generatedQuestions.captions || []
    };
  } else {
    // Ensure inVideoQuestions exists on video
    if (!video.inVideoQuestions) {
      const generatedQuestions = await generateQuizForVideo(video.id, video.title, video.duration);
      video = {
        ...video,
        questions: video.questions || generatedQuestions.postVideoQuestions,
        inVideoQuestions: generatedQuestions.inVideoQuestions,
        captions: generatedQuestions.captions || []
      };
    }
  }

  const room = {
    id: roomId,
    video,
    players: [
      { socketId: p1Socket.id, username: p1Socket.username, avatar: p1Socket.avatar, selectedClass: p1Socket.selectedClass, progress: 0, finished: false, score: 0, answers: [], submitTime: null, ready: false, isBot: false, inVideoXp: 0 },
      { socketId: p2Socket.id, username: p2Socket.username, avatar: p2Socket.avatar, selectedClass: p2Socket.selectedClass, progress: 0, finished: false, score: 0, answers: [], submitTime: null, ready: false, isBot: false, inVideoXp: 0 }
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

  p1Socket.currentRoomId = roomId;
  p2Socket.currentRoomId = roomId; // Assign on other socket too
  
  console.log(`[Match] Human Match Created in room "${roomId}" for video "${video.title}"`);
}

// Room Creation Helper (Bot Match)
export async function createBotMatch(playerSocket, videoId, customVideoDetails = null) {
  const roomId = `room_${Math.random().toString(36).substr(2, 9)}`;
  const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  
  let video = curatedVideos.find((v) => v.id === videoId);
  if (video) {
    video = { ...video };
  }
  if (!video && videoId) {
    // If it's a custom URL/search
    const title = customVideoDetails?.title || playerSocket.queuedVideoTitle || `Custom Video: ${videoId}`;
    const channel = customVideoDetails?.channel || playerSocket.queuedVideoChannel || "YouTube Creator";
    const duration = Number(customVideoDetails?.duration || playerSocket.queuedVideoDuration) || 300;
    const thumbnail = customVideoDetails?.thumbnail || playerSocket.queuedVideoThumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    
    const generatedQuestions = await generateQuizForVideo(videoId, title, duration);
    video = {
      id: videoId,
      title,
      channel,
      category: "Custom Watch",
      duration,
      thumbnail,
      questions: generatedQuestions.postVideoQuestions,
      inVideoQuestions: generatedQuestions.inVideoQuestions,
      captions: generatedQuestions.captions || []
    };
  }

  if (!video) {
    // Quick Match vs Bot, pick random curated video
    const randomCurated = curatedVideos[Math.floor(Math.random() * curatedVideos.length)];
    video = { ...randomCurated };
  }

  // Ensure inVideoQuestions exists on video
  if (!video.inVideoQuestions) {
    const generatedQuestions = await generateQuizForVideo(video.id, video.title, video.duration);
    video = {
      ...video,
      questions: video.questions || generatedQuestions.postVideoQuestions,
      inVideoQuestions: generatedQuestions.inVideoQuestions,
      captions: generatedQuestions.captions || []
    };
  }

  const BOT_CLASSES = ["doomscroller", "speedrunner", "streamsniper", "edgelord", "vibechecker", "glitchmancer", "sigmagrinder", "npc", "brainiac", "gachaaddict"];
  const botClass = BOT_CLASSES[Math.floor(Math.random() * BOT_CLASSES.length)];
  const room = {
    id: roomId,
    video,
    players: [
      { socketId: playerSocket.id, username: playerSocket.username, avatar: playerSocket.avatar, selectedClass: playerSocket.selectedClass, progress: 0, finished: false, score: 0, answers: [], submitTime: null, ready: false, isBot: false, inVideoXp: 0 },
      { socketId: `bot_${Math.random().toString(36).substr(2, 5)}`, username: botName, avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${botName}&backgroundColor=transparent`, selectedClass: botClass, progress: 0, finished: false, score: 0, answers: [], submitTime: null, ready: true, isBot: true, promptedInVideoIndices: [], isAnsweringInVideo: false, inVideoXp: 0 }
    ],
    status: "waiting",
    createdAt: Date.now()
  };

  rooms.set(roomId, room);
  playerSocket.join(roomId);
  playerSocket.emit("match_found", { roomId, room });
  playerSocket.currentRoomId = roomId;

  console.log(`[Match] Bot Match Created in room "${roomId}" for video "${video.title}". Bot: ${botName}`);

  // Simulate bot introduction chat
  setTimeout(() => {
    const intro = BOT_INTRO_CHATS[Math.floor(Math.random() * BOT_INTRO_CHATS.length)];
    sendBotChat(room, botName, intro);
  }, 1500);
}

// Start Countdown Sequence
export function startCountdown(room) {
  if (!io) return;
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
export function startGameplay(room) {
  if (!io) return;
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
export function simulateBotProgress(room, botPlayer) {
  let progressFloat = 0;
  
  // Calculate human-like watch speed (slower, matches realistic scaling)
  let watchSpeedMultiplier = 1.0;
  if (botPlayer.selectedClass === "speedrunner") {
    watchSpeedMultiplier = 0.7; // 30% faster
  } else if (botPlayer.selectedClass === "doomscroller") {
    watchSpeedMultiplier = 1.25; // 25% slower (gets distracted)
  }
  
  const videoDurationMs = Number(room.video?.duration || 300) * 1000;
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

    // If bot is answering an in-video question, pause progress updates
    if (botPlayer.isAnsweringInVideo) {
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

    // Calculate current elapsed time in seconds
    const botTimeSec = (progressFloat / 100) * Number(room.video?.duration || 300);
    const inVideoQs = room.video?.inVideoQuestions || [];
    const nextQIdx = inVideoQs.findIndex((q, idx) => botTimeSec >= q.timestamp && !botPlayer.promptedInVideoIndices.includes(idx));
    
    if (nextQIdx !== -1) {
      botPlayer.promptedInVideoIndices.push(nextQIdx);
      botPlayer.isAnsweringInVideo = true;
      
      const delaySec = 1.5 + Math.random() * 3.0; // random delay between 1.5s and 4.5s
      const delayMs = delaySec * 1000;
      
      setTimeout(() => {
        if (!rooms.has(room.id)) return;
        
        const q = inVideoQs[nextQIdx];
        const accuracy = botPlayer.isBlurred ? 0.50 : 0.75;
        const isCorrect = Math.random() < accuracy;
        
        let scoreGained = 0;
        let xpGained = 0;
        
        if (isCorrect) {
          const remainingSeconds = Math.max(0, 6 - delaySec);
          const speedBonus = Math.round(remainingSeconds) * 5;
          xpGained = 50 + speedBonus;
          scoreGained = 50 + speedBonus;
          
          botPlayer.score = (botPlayer.score || 0) + scoreGained;
          botPlayer.inVideoXp = (botPlayer.inVideoXp || 0) + xpGained;
        }
        
        console.log(`[Bot Simulation] Bot answered in-video question ${nextQIdx + 1}. Correct: ${isCorrect}. Score/XP gained: ${scoreGained}/${xpGained}`);

        // Optionally send a bot chat reaction (40% chance)
        if (Math.random() < 0.4) {
          const botReactions = isCorrect 
            ? ["Got it! That was easy.", "Nice, I knew that one!", "Boom, got the speed bonus!"] 
            : ["Wait, what? I missed that part.", "Ah, that was a trick question!", "Oof, dynamic questions are hard."];
          const reaction = botReactions[Math.floor(Math.random() * botReactions.length)];
          sendBotChat(room, botPlayer.username, reaction);
        }
        
        botPlayer.isAnsweringInVideo = false;
        io.to(room.id).emit("room_update", room);
      }, delayMs);
      
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
export function simulateBotQuizAnswers(room, botPlayer) {
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
export function handleBotHitByPowerup(room, botPlayer, type) {
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
export function evaluateGame(room) {
  if (!io) return;
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
      let base = 50; // base participation XP
      let won = false;

      if (isDraw) {
        base = 80;
      } else if (winner && p.username === winner.username) {
        base = 150; // victory XP
        won = true;
      }

      const xpGained = base + (p.inVideoXp || 0);
      const { user, leveledUp } = updatePlayerStats(p.username, xpGained, won, room.video, p.avatar, p.selectedClass);
      p.xpGained = xpGained;
      p.leveledUp = leveledUp;
      p.totalXp = user.xp;
      p.level = user.level;
    }
  });

  io.to(room.id).emit("game_over", { results, room, leaderboard: getLeaderboard() });
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
