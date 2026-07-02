import { 
  joinQueue, 
  leaveQueue, 
  cleanUpQueue 
} from "../services/matchmakingService.js";
import { 
  getRoom,
  saveRoom,
  deleteRoom,
  activeIntervals, 
  startCountdown, 
  evaluateGame,
  sendBotChat, 
  handleBotHitByPowerup 
} from "../services/gameService.js";
import { saveMessage } from "../services/chatService.js";
import TelemetryEvent from "../models/TelemetryEvent.js";
import { logInfrastructureError } from "../services/telemetryHealthService.js";
import redisClient from "../config/redis.js";
import logger from "../config/logger.js";
import SystemConfig from "../models/SystemConfig.js";

// Global map to track online users: username -> socketId
export const onlineUsers = new Map();

export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    logger.info(`[Socket] Connected`, { socketId: socket.id });

    // H2 fix: Force-disconnect sockets that never authenticate within 30s
    // This prevents the onlineUsers Map from leaking entries during connection storms
    const authTimeout = setTimeout(() => {
      if (!socket.username) {
        logger.info(`[Socket] Auth timeout — disconnecting unauthenticated socket`, { socketId: socket.id });
        socket.disconnect(true);
      }
    }, 30000);

    socket.on("error", (err) => {
      logInfrastructureError("SOCKET_ERROR", { message: err.message, stack: err.stack, socketId: socket.id });
    });

    // Presence & Global
    socket.on("user_login", (username) => {
      if (!username) return;
      clearTimeout(authTimeout);
      socket.username = username;
      onlineUsers.set(username, socket.id);
      logger.info(`[Presence] User is online`, { username, totalOnline: onlineUsers.size });
      
      // Broadcast presence updates
      socket.broadcast.emit("user_online", username);
    });

    socket.on("send_chat_message", async ({ receiver, message }) => {
      if (!socket.username || !receiver || !message) return;
      try {
        const chatDisabled = await SystemConfig.findOne({ key: "CHAT_DISABLED" });
        if (chatDisabled && chatDisabled.value) {
          socket.emit("receive_chat_message", {
            id: "system_alert_" + Date.now(),
            sender: "System",
            receiver: socket.username,
            content: "⚠️ Chatting is temporarily disabled for maintenance.",
            timestamp: new Date().toISOString()
          });
          return;
        }
        const msg = await saveMessage(socket.username, receiver, message);
        
        // Find target socket if online
        const targetSocketId = onlineUsers.get(receiver);
        if (targetSocketId) {
          io.to(targetSocketId).emit("receive_chat_message", msg);
        }
        
        // Confirm sending to sender
        socket.emit("chat_message_sent", msg);
      } catch (err) {
        logger.error("[Chat] Failed to send chat message", { error: err.message, stack: err.stack, sender: socket.username, receiver });
      }
    });

    // Queue / Matchmaking
    socket.on("join_queue", async (params) => {
      await joinQueue(socket, params);
    });

    socket.on("leave_queue", async () => {
      await leaveQueue(socket);
    });

    // Game play events
    socket.on("player_ready", async () => {
      const currentRoomId = socket.currentRoomId || await redisClient.get(`socket:room:${socket.id}`);
      if (!currentRoomId) return;
      const room = await getRoom(currentRoomId);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (player) {
        player.ready = true;
        logger.info(`[Game] Player is ready`, { username: player.username, roomId: currentRoomId });
        
        await saveRoom(currentRoomId, room);
        io.to(currentRoomId).emit("room_update", room);

        // Check if everyone is ready
        const allReady = room.players.every((p) => p.ready);
        if (allReady) {
          startCountdown(currentRoomId);
        }
      }
    });

    socket.on("video_progress", async ({ progress }) => {
      const currentRoomId = socket.currentRoomId || await redisClient.get(`socket:room:${socket.id}`);
      if (!currentRoomId) return;
      const room = await getRoom(currentRoomId);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (player) {
        player.progress = progress;
        await saveRoom(currentRoomId, room);
        // Broadcast progress to the room
        socket.to(currentRoomId).emit("opponent_progress", { 
          socketId: socket.id, 
          progress 
        });
      }
    });

    socket.on("video_finished", async () => {
      const currentRoomId = socket.currentRoomId || await redisClient.get(`socket:room:${socket.id}`);
      if (!currentRoomId) return;
      const room = await getRoom(currentRoomId);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (player) {
        player.finished = true;
        logger.info(`[Game] Player finished video`, { username: player.username, roomId: currentRoomId });
        
        TelemetryEvent.create({
          username: player.username,
          eventType: "VIDEO_COMPLETED",
          metadata: { roomId: currentRoomId }
        }).catch(err => logger.error("Telemetry failed in video completed", { error: err.message }));

        await saveRoom(currentRoomId, room);
        io.to(currentRoomId).emit("room_update", room);
        
        // Notify other player that this player is already in the quiz!
        socket.to(currentRoomId).emit("opponent_waiting_quiz", { username: player.username });
      }
    });

    socket.on("submit_answers", async ({ answers, watchProgress, doubleDowns }) => {
      const currentRoomId = socket.currentRoomId || await redisClient.get(`socket:room:${socket.id}`);
      if (!currentRoomId) return;
      const room = await getRoom(currentRoomId);
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
          
          TelemetryEvent.create({
            username: player.username,
            eventType: "SANCTUM_QUESTION_ANSWERED",
            metadata: { roomId: currentRoomId, questionIndex: idx, isCorrect, selectedOption: answers[idx] }
          }).catch(err => logger.error("Telemetry failed in question answer", { error: err.message }));

          if (isCorrect) {
            correctCount++;
            score += isDoubleDown ? 200 : 100;
          } else {
            score += isDoubleDown ? -100 : 0;
          }
        });
        player.score = Math.max(0, Math.round(score * multiplier));
        player.correctCount = correctCount;

        logger.info(`[Game] Player submitted quiz`, { username: player.username, roomId: currentRoomId, correctCount, multiplier, score: player.score });

        // Send confirmation to this player
        socket.emit("answers_recorded", { score: player.score });
        
        await saveRoom(currentRoomId, room);

        // Check if all players submitted
        const allSubmitted = room.players.every((p) => p.submitted);
        if (allSubmitted) {
          await evaluateGame(currentRoomId);
        } else {
          // Notify others
          socket.to(currentRoomId).emit("opponent_submitted", { username: player.username });
        }
      }
    });

    socket.on("submit_in_video_answer", async ({ questionIdx, answerIndex, remainingSeconds }) => {
      const currentRoomId = socket.currentRoomId || await redisClient.get(`socket:room:${socket.id}`);
      if (!currentRoomId) return;
      const room = await getRoom(currentRoomId);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      const inVideoQs = room.video.inVideoQuestions || [];
      const q = inVideoQs[questionIdx];
      if (!q) return;

      const isCorrect = answerIndex === q.answerIndex;
      let xpGained = 0;
      let scoreGained = 0;

      if (isCorrect) {
        // 50 XP base + speed bonus
        const speedBonus = Math.round(remainingSeconds) * 5;
        xpGained = 50 + speedBonus;
        scoreGained = 50 + speedBonus;
        
        player.score = (player.score || 0) + scoreGained;
        player.inVideoXp = (player.inVideoXp || 0) + xpGained;
      }

      TelemetryEvent.create({
        username: player.username,
        eventType: "SANCTUM_QUESTION_ANSWERED",
        metadata: { roomId: currentRoomId, inVideoQuestionIndex: questionIdx, isCorrect, selectedOption: answerIndex, remainingSeconds }
      }).catch(err => logger.error("Telemetry failed in in-video question answer", { error: err.message }));

      socket.emit("in_video_answer_result", { 
        questionIdx, 
        isCorrect, 
        correctAnswerIdx: q.answerIndex,
        submittedAnswerIdx: answerIndex,
        xpGained,
        scoreGained
      });

      await saveRoom(currentRoomId, room);

      // Emit room_update to broadcast score updates
      io.to(currentRoomId).emit("room_update", room);
      logger.info(`[Game] Player answered in-video question`, { username: player.username, questionIdx, isCorrect, scoreGained, roomId: currentRoomId });
    });

    socket.on("send_message", async ({ message }) => {
      const currentRoomId = socket.currentRoomId || await redisClient.get(`socket:room:${socket.id}`);
      if (!currentRoomId) return;
      const room = await getRoom(currentRoomId);
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

    socket.on("use_powerup", async ({ type }) => {
      const currentRoomId = socket.currentRoomId || await redisClient.get(`socket:room:${socket.id}`);
      if (!currentRoomId) return;
      const room = await getRoom(currentRoomId);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      const opponent = room.players.find((p) => p.socketId !== socket.id);
      if (player && opponent) {
        logger.info(`[Powerup] Player used powerup`, { sender: player.username, target: opponent.username, type, roomId: currentRoomId });
        
        if (type === "__local_2x_speed__") {
          // Local self-buff, server does not propagate it as an attack/debuff to the opponent.
          return;
        }

        if (!opponent.isBot) {
          io.to(opponent.socketId).emit("opponent_powerup", { type });
        } else {
          await handleBotHitByPowerup(currentRoomId, opponent, type);
        }

        const emoji = type === "freeze" ? "⚡ EMP FREEZE" : "🌫️ SMOKE SCREEN";
        sendBotChat(room, "SYSTEM", `⚠️ ${player.username} deployed ${emoji} on ${opponent.username}!`);
      }
    });

    socket.on("disconnect", async () => {
      logger.info(`[Socket] Disconnected`, { socketId: socket.id });
      
      // Global presence cleanup
      if (socket.username) {
        onlineUsers.delete(socket.username);
        logger.info(`[Presence] User went offline`, { username: socket.username });
        socket.broadcast.emit("user_offline", socket.username);
      }

      await cleanUpQueue(socket);
      
      let currentRoomId = socket.currentRoomId;
      if (!currentRoomId) {
        currentRoomId = await redisClient.get(`socket:room:${socket.id}`);
      }
      if (currentRoomId) {
        const room = await getRoom(currentRoomId);
        if (room) {
          // Cancel bot/countdown intervals globally using pub/sub
          await redisClient.publish("game-signals", JSON.stringify({ type: "clear-intervals", roomId: currentRoomId }));

          if (socket.username && room.status !== "finished") {
            TelemetryEvent.create({
              username: socket.username,
              eventType: "SANCTUM_ABANDONED",
              metadata: { roomId: currentRoomId, reason: "disconnected", videoId: room.video?.id }
            }).catch(err => logger.error("Telemetry failed in match abandon", { error: err.message }));
          }

          // Notify remaining human players
          const remainingPlayers = room.players.filter((p) => p.socketId !== socket.id && !p.isBot);
          remainingPlayers.forEach((p) => {
            io.to(p.socketId).emit("opponent_left", { 
              message: "Your opponent disconnected! You win by default." 
            });
          });
          
          await deleteRoom(currentRoomId);
          await redisClient.del(`socket:room:${socket.id}`);
        }
      }
    });
  });
}
