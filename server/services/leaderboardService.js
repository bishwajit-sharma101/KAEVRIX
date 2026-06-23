import User from "../models/User.js";
import TelemetryEvent from "../models/TelemetryEvent.js";

// --- SKILL SYSTEM HELPERS ---
const categorizeVideo = (title) => {
  if (!title) return "General Tech";
  const t = title.toLowerCase();
  if (t.includes("javascript") || t.includes(" js ") || t.includes("react") || t.includes("node")) return "JavaScript";
  if (t.includes("python") || t.includes("django") || t.includes("flask")) return "Python";
  if (t.includes(" os ") || t.includes("operating system") || t.includes("linux")) return "Operating Systems";
  if (t.includes("c++") || t.includes("cpp")) return "C++";
  if (t.includes("java") || t.includes("spring")) return "Java";
  if (t.includes("css") || t.includes("html") || t.includes("frontend") || t.includes("web dev")) return "Frontend Web";
  if (t.includes("system design") || t.includes("architecture")) return "System Design";
  if (t.includes("algorithm") || t.includes("leetcode") || t.includes("data structure")) return "Algorithms";
  return "General Tech";
};

const calculateTier = (xp) => {
  if (xp >= 5000) return "Legend";
  if (xp >= 3000) return "Master";
  if (xp >= 1500) return "Expert";
  if (xp >= 500) return "Adept";
  return "Novice";
};

const awardSkillXp = (user, title, xpEarned) => {
  if (!user.skills) user.skills = [];
  const skillName = categorizeVideo(title);
  let skill = user.skills.find(s => s.name === skillName);
  
  if (!skill) {
    skill = { name: skillName, xp: 0, tier: "Novice" };
    user.skills.push(skill);
  }
  
  skill.xp += xpEarned;
  skill.tier = calculateTier(skill.xp);
};
// ----------------------------

let onStatsUpdatedCallback = null;

export function registerStatsCallback(cb) {
  onStatsUpdatedCallback = cb;
}

export async function getLeaderboard() {
  try {
    const users = await User.find({}, "username xp level wins losses avatar selectedClass")
      .sort({ xp: -1 })
      .limit(50)
      .lean();
    return users;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

export async function getPlayerProfile(username) {
  try {
    const user = await User.findOne({ username: username.toLowerCase() }).lean();
    return user;
  } catch (error) {
    console.error("Error fetching player profile:", error);
    return null;
  }
}

export async function updatePlayerStats(username, xpGained, won, videoDetails = null, avatar = null, selectedClass = null) {
  try {
    let user = await User.findOne({ username: username.toLowerCase() });
    
    // In MongoDB, the user should already exist since registration creates the document.
    if (!user) {
      console.warn(`User ${username} not found for stats update.`);
      return { user: null, leveledUp: false };
    }

    user.xp = (user.xp || 0) + xpGained;
    if (won !== null) {
      if (won) {
        user.wins = (user.wins || 0) + 1;
      } else {
        user.losses = (user.losses || 0) + 1;
      }
    }
    
    if (avatar) user.avatar = avatar;
    if (selectedClass) user.selectedClass = selectedClass;

    if (videoDetails) {
      user.totalVideosWatched = (user.totalVideosWatched || 0) + 1;
      user.totalWatchTime = (user.totalWatchTime || 0) + (videoDetails.duration || 0);
      
      const historyItem = {
        id: videoDetails.id,
        title: videoDetails.title,
        timestamp: new Date(),
        solo: videoDetails.solo || false
      };
      
      user.watchHistory.unshift(historyItem);
      // Keep only last 20 history items
      if (user.watchHistory.length > 20) {
        user.watchHistory = user.watchHistory.slice(0, 20);
      }

      awardSkillXp(user, videoDetails.title, xpGained);
    }

    // Level formula: Level = Math.floor(XP / 200) + 1
    const newLevel = Math.floor(user.xp / 200) + 1;
    const leveledUp = newLevel > user.level;
    const oldLevel = user.level;
    user.level = newLevel;

    await user.save();
    
    if (leveledUp) {
      TelemetryEvent.create({
        userId: user._id,
        username: user.username,
        eventType: "LEVEL_UP",
        metadata: { previousLevel: oldLevel, newLevel, totalXp: user.xp, xpRequired: (newLevel - 1) * 200 }
      }).catch(err => console.error("Telemetry failed", err));
    }
    
    if (onStatsUpdatedCallback) {
      onStatsUpdatedCallback(username, xpGained, won, videoDetails, avatar, selectedClass);
    }
    
    return { user: user.toObject(), leveledUp };
  } catch (error) {
    console.error("Error updating player stats:", error);
    return { user: null, leveledUp: false };
  }
}

export async function addSoloXp(username, xpEarned, videoTitle) {
  try {
    let user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return null;
    }

    user.xp = (user.xp || 0) + xpEarned;
    const newLevel = Math.floor(user.xp / 200) + 1;
    const leveledUp = newLevel > user.level;
    user.level = newLevel;

    if (videoTitle) {
      const historyItem = {
        title: videoTitle,
        timestamp: new Date(),
        solo: true
      };
      user.watchHistory.unshift(historyItem);
      if (user.watchHistory.length > 20) {
         user.watchHistory = user.watchHistory.slice(0, 20);
      }
      user.totalVideosWatched = (user.totalVideosWatched || 0) + 1;
      awardSkillXp(user, videoTitle, xpEarned);
    }

    await user.save();

    if (leveledUp) {
      TelemetryEvent.create({
        userId: user._id,
        username: user.username,
        eventType: "LEVEL_UP",
        metadata: { previousLevel: newLevel - 1, newLevel, totalXp: user.xp, xpRequired: (newLevel - 1) * 200 }
      }).catch(err => console.error("Telemetry failed", err));
    }

    if (onStatsUpdatedCallback) {
      onStatsUpdatedCallback(username, xpEarned, null, { title: videoTitle, solo: true }, null, null);
    }

    return { xp: user.xp, level: user.level, leveledUp };
  } catch (error) {
    console.error("Error adding solo xp:", error);
    return null;
  }
}
