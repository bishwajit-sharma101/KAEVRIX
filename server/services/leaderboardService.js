import fs from "fs";
import { DATA_DIR, LEADERBOARD_FILE } from "../config/constants.js";

let leaderboard = [];

export function loadLeaderboard() {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }

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
}

export function saveLeaderboard() {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
  } catch (error) {
    console.error("Failed to save leaderboard:", error);
  }
}

export function getLeaderboard() {
  return leaderboard;
}

export function getPlayerProfile(username) {
  return leaderboard.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function updatePlayerStats(username, xpGained, won, videoDetails = null, avatar = null, selectedClass = null) {
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

export function addSoloXp(username, xpEarned, videoTitle) {
  let user = leaderboard.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return null;
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

  return { xp: user.xp, level: user.level, leveledUp };
}
