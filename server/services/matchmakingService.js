import { curatedVideos } from "../quizData.js";
import { createHumanMatch, createBotMatch } from "./gameService.js";
import TelemetryEvent from "../models/TelemetryEvent.js";

const activeQueues = new Map(); // videoId -> array of sockets
let quickMatchQueue = []; // array of sockets waiting for random matches

let io = null;

export function init(socketIo) {
  io = socketIo;
}

export async function joinQueue(socket, { username, avatar, selectedClass, videoId, videoTitle, videoChannel, videoDuration, videoThumbnail, vsBot }) {
  console.log(`[Queue] Player "${username}" (${socket.id}) requested match. VideoId: ${videoId || "QuickMatch"}. vsBot: ${vsBot}`);
  
  TelemetryEvent.create({
    username,
    eventType: "SANCTUM_MATCHMAKING_STARTED",
    metadata: { videoId: videoId || "QuickMatch", vsBot }
  }).catch(err => console.error("Telemetry failed", err));
  
  // Store profile metadata on socket
  socket.username = username;
  socket.avatar = avatar;
  socket.selectedClass = selectedClass || "doomscroller";
  
  if (videoId) {
    socket.queuedVideoTitle = videoTitle;
    socket.queuedVideoChannel = videoChannel;
    socket.queuedVideoDuration = Number(videoDuration) || 300;
    socket.queuedVideoThumbnail = videoThumbnail;
  }
  
  // Store vsBot preference on socket for fallback logic
  socket.vsBot = vsBot;

  if (videoId) {
    // Matchmaking for a specific video
    if (!activeQueues.has(videoId)) {
      activeQueues.set(videoId, []);
    }
    
    const queue = activeQueues.get(videoId);
    
    // Prevent duplicates
    if (queue.some((s) => s.id === socket.id)) return;
    
    if (queue.length > 0) {
      // Match found! Cancel the opponent's bot fallback timer
      const opponent = queue.shift();
      if (opponent.botFallbackTimer) clearTimeout(opponent.botFallbackTimer);
      
      await createHumanMatch(socket, opponent, videoId);
    } else {
      queue.push(socket);
      socket.queuedVideoId = videoId;
      console.log(`[Queue] Added to queue for video "${videoId}". Queue size: ${queue.length}`);
      
      // Auto-Bot Match Fallback after 60 seconds (only if vsBot is enabled)
      if (socket.vsBot) {
        socket.botFallbackTimer = setTimeout(async () => {
          if (activeQueues.has(videoId)) {
            const currentQueue = activeQueues.get(videoId);
            const idx = currentQueue.findIndex((s) => s.id === socket.id);
            if (idx !== -1) {
              currentQueue.splice(idx, 1);
              console.log(`[Queue] 60s timeout reached, starting Bot Match for video "${videoId}"`);
              await createBotMatch(socket, videoId, {
                title: socket.queuedVideoTitle,
                channel: socket.queuedVideoChannel,
                duration: Number(socket.queuedVideoDuration) || 300,
                thumbnail: socket.queuedVideoThumbnail
              });
            }
          }
        }, 60000);
      } else {
        console.log(`[Queue] Bot fallback disabled, waiting indefinitely for real opponent.`);
      }
    }
  } else {
    // Quick Match (Random Video)
    if (quickMatchQueue.some((s) => s.id === socket.id)) return;

    if (quickMatchQueue.length > 0) {
      const opponent = quickMatchQueue.shift();
      if (opponent.botFallbackTimer) clearTimeout(opponent.botFallbackTimer);
      
      // Select random curated video
      const randomVideo = curatedVideos[Math.floor(Math.random() * curatedVideos.length)];
      await createHumanMatch(socket, opponent, randomVideo.id, randomVideo);
    } else {
      quickMatchQueue.push(socket);
      socket.queuedVideoId = null;
      console.log(`[Queue] Added to Quick Match queue. Queue size: ${quickMatchQueue.length}`);
      
      // Auto-Bot Match Fallback after 60 seconds (only if vsBot is enabled)
      if (socket.vsBot) {
        socket.botFallbackTimer = setTimeout(async () => {
          const idx = quickMatchQueue.findIndex((s) => s.id === socket.id);
          if (idx !== -1) {
             quickMatchQueue.splice(idx, 1);
             console.log(`[Queue] 60s timeout reached, starting Quick Match vs Bot`);
             await createBotMatch(socket, null);
          }
        }, 60000);
      } else {
        console.log(`[Queue] Bot fallback disabled for Quick Match, waiting indefinitely.`);
      }
    }
  }
}

export function leaveQueue(socket) {
  if (socket.username) {
    TelemetryEvent.create({
      username: socket.username,
      eventType: "SANCTUM_ABANDONED",
      metadata: { reason: "left_queue", videoId: socket.queuedVideoId || "QuickMatch" }
    }).catch(err => console.error("Telemetry failed", err));
  }
  cleanUpQueue(socket);
}

export function cleanUpQueue(socket) {
  // Cancel any pending bot fallback timer
  if (socket.botFallbackTimer) {
    clearTimeout(socket.botFallbackTimer);
    socket.botFallbackTimer = null;
  }
  quickMatchQueue = quickMatchQueue.filter((x) => x.id !== socket.id);
  if (socket.queuedVideoId && activeQueues.has(socket.queuedVideoId)) {
    const q = activeQueues.get(socket.queuedVideoId);
    activeQueues.set(socket.queuedVideoId, q.filter((x) => x.id !== socket.id));
  }
}
