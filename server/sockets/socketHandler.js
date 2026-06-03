import { 
  joinQueue, 
  leaveQueue, 
  cleanUpQueue 
} from "../services/matchmakingService.js";
import { 
  rooms, 
  activeIntervals, 
  startCountdown, 
  evaluateGame, 
  sendBotChat, 
  handleBotHitByPowerup 
} from "../services/gameService.js";
import { saveMessage } from "../services/chatService.js";

// Global map to track online users: username -> socketId
export const onlineUsers = new Map();

export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Presence & Global
    socket.on("user_login", (username) => {
      if (!username) return;
      socket.username = username;
      onlineUsers.set(username, socket.id);
      console.log(`[Presence] User "${username}" is online. Total online: ${onlineUsers.size}`);
      
      // Tell this user who is online (send list of online users)
      const onlineList = Array.from(onlineUsers.keys());
      socket.emit("online_users_list", onlineList);

      // Broadcast to everyone else that this user came online
      socket.broadcast.emit("user_online", username);
    });

    socket.on("send_dm", async ({ sender, receiver, content }) => {
      try {
        // Save to DB
        const msg = await saveMessage(sender, receiver, content);
        
        // If receiver is online, send immediately
        const receiverSocketId = onlineUsers.get(receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_dm", msg);
        }
        
        // Send back confirmation to sender
        socket.emit("receive_dm", msg);
      } catch (err) {
        console.error("[Socket] Failed to send DM:", err);
      }
    });

    socket.on("send_friend_request", ({ sender, receiver }) => {
      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_friend_request", { sender });
      }
    });

    socket.on("respond_friend_request", ({ sender, receiver, action }) => {
      // sender is the person accepting/rejecting the request, receiver is the original requester
      if (action === "accept") {
        const receiverSocketId = onlineUsers.get(receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("friend_request_accepted", { sender });
        }
      }
    });

    // Queue events
    socket.on("join_queue", async (params) => {
      await joinQueue(socket, params);
    });

    socket.on("leave_queue", () => {
      leaveQueue(socket);
    });

    // Game play events
    socket.on("player_ready", () => {
      const currentRoomId = socket.currentRoomId;
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
      const currentRoomId = socket.currentRoomId;
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
      const currentRoomId = socket.currentRoomId;
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
      const currentRoomId = socket.currentRoomId;
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

    socket.on("submit_in_video_answer", ({ questionIdx, answerIndex, remainingSeconds }) => {
      const currentRoomId = socket.currentRoomId;
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
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
        // 50 XP base + speed bonus (10% of base XP, i.e., 5 XP, per remaining second on 6s timer)
        const speedBonus = Math.round(remainingSeconds) * 5;
        xpGained = 50 + speedBonus;
        scoreGained = 50 + speedBonus;
        
        player.score = (player.score || 0) + scoreGained;
        player.inVideoXp = (player.inVideoXp || 0) + xpGained;
      }

      socket.emit("in_video_answer_result", { 
        questionIdx, 
        isCorrect, 
        correctAnswerIdx: q.answerIndex,
        submittedAnswerIdx: answerIndex,
        xpGained,
        scoreGained
      });

      // Emit room_update to broadcast score updates
      io.to(currentRoomId).emit("room_update", room);
      console.log(`[Game] Player "${player.username}" answered in-video question ${questionIdx + 1} ${isCorrect ? "correctly" : "incorrectly"}. Gained: ${scoreGained} points.`);
    });

    socket.on("send_message", ({ message }) => {
      const currentRoomId = socket.currentRoomId;
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
      const currentRoomId = socket.currentRoomId;
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
      
      // Global presence cleanup
      if (socket.username) {
        onlineUsers.delete(socket.username);
        console.log(`[Presence] User "${socket.username}" went offline.`);
        socket.broadcast.emit("user_offline", socket.username);
      }

      cleanUpQueue(socket);
      
      const currentRoomId = socket.currentRoomId;
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
  });
}
