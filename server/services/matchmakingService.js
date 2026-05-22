import { curatedVideos } from "../quizData.js";
import { createHumanMatch, createBotMatch } from "./gameService.js";

const activeQueues = new Map(); // videoId -> array of sockets
let quickMatchQueue = []; // array of sockets waiting for random matches

let io = null;

export function init(socketIo) {
  io = socketIo;
}

export async function joinQueue(socket, { username, avatar, selectedClass, videoId, videoTitle, videoChannel, videoDuration, videoThumbnail, vsBot }) {
  console.log(`[Queue] Player "${username}" (${socket.id}) requested match. VideoId: ${videoId || "QuickMatch"}. vsBot: ${vsBot}`);
  
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
  
  if (vsBot) {
    // Instantly start a Bot match
    await createBotMatch(socket, videoId, {
      title: videoTitle,
      channel: videoChannel,
      duration: Number(videoDuration) || 300,
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
              duration: Number(socket.queuedVideoDuration) || 300,
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
}

export function leaveQueue(socket) {
  cleanUpQueue(socket);
}

export function cleanUpQueue(socket) {
  quickMatchQueue = quickMatchQueue.filter((x) => x.id !== socket.id);
  if (socket.queuedVideoId && activeQueues.has(socket.queuedVideoId)) {
    const q = activeQueues.get(socket.queuedVideoId);
    activeQueues.set(socket.queuedVideoId, q.filter((x) => x.id !== socket.id));
  }
}
