import User from "../models/User.js";
import TelemetryEvent from "../models/TelemetryEvent.js";
import redisClient from "../config/redis.js";
import logger from "../config/logger.js";

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
    const cached = await redisClient.get("leaderboard:global");
    if (cached) {
      return JSON.parse(cached);
    }
    const users = await User.find({}, "username xp level wins losses avatar selectedClass")
      .sort({ xp: -1 })
      .limit(50)
      .lean();
    
    await redisClient.set("leaderboard:global", JSON.stringify(users), "EX", 30); // Cache for 30s
    return users;
  } catch (error) {
    logger.error("Error fetching leaderboard", { error: error.message, stack: error.stack });
    return [];
  }
}

export async function getPlayerProfile(username) {
  try {
    const key = `user:profile:${username.toLowerCase()}`;
    const cached = await redisClient.get(key);
    if (cached) {
      if (cached === "null") return null;
      const parsed = JSON.parse(cached);
      // Defense-in-depth: strip sensitive fields even from cache
      const { passwordHash, salt, mfaSecret, ...safe } = parsed;
      return safe;
    }
    const user = await User.findOne({ username: username.toLowerCase() })
      .select('-passwordHash -salt -mfaSecret')
      .lean();
    if (user) {
      await redisClient.set(key, JSON.stringify(user), "EX", 300); // 5 minutes TTL
    } else {
      await redisClient.set(key, "null", "EX", 30); // Cache non-existence for 30s
    }
    return user;
  } catch (error) {
    logger.error("Error fetching player profile", { username, error: error.message, stack: error.stack });
    return null;
  }
}

export async function updatePlayerStats(username, xpGained, won, videoDetails = null, avatar = null, selectedClass = null) {
  try {
    const normalizedUsername = username.toLowerCase();

    // Build atomic $inc payload — prevents XP/wins/losses corruption under concurrent game evaluations
    const incFields = { xp: xpGained };
    if (won === true)  incFields.wins   = 1;
    if (won === false) incFields.losses = 1;
    if (videoDetails) {
      incFields.totalVideosWatched = 1;
      incFields.totalWatchTime = videoDetails.duration || 0;
    }

    // Build $set payload for optional profile updates
    const setFields = {};
    if (avatar)       setFields.avatar       = avatar;
    if (selectedClass) setFields.selectedClass = selectedClass;

    // Build $push for watch history
    const pushOps = {};
    if (videoDetails) {
      pushOps.watchHistory = {
        $each: [{ id: videoDetails.id, title: videoDetails.title, timestamp: new Date(), solo: videoDetails.solo || false }],
        $position: 0,
        $slice: 20
      };
    }

    const updateOp = { $inc: incFields };
    if (Object.keys(setFields).length > 0) updateOp.$set = setFields;
    if (Object.keys(pushOps).length > 0)   updateOp.$push = pushOps;

    const updatedUser = await User.findOneAndUpdate(
      { username: normalizedUsername },
      updateOp,
      { new: true }
    );

    if (!updatedUser) {
      logger.warn("User not found for stats update", { username });
      return { user: null, leveledUp: false };
    }

    // Compute and persist new level atomically
    const newLevel = Math.floor(updatedUser.xp / 200) + 1;
    const leveledUp = newLevel > updatedUser.level;
    const oldLevel = updatedUser.level;

    if (newLevel !== updatedUser.level) {
      await User.updateOne({ username: normalizedUsername }, { $set: { level: newLevel } });
      updatedUser.level = newLevel;
    }

    // Award skill XP (lower contention — separate write)
    if (videoDetails) {
      const userForSkills = await User.findOne({ username: normalizedUsername });
      if (userForSkills) {
        awardSkillXp(userForSkills, videoDetails.title, xpGained);
        await userForSkills.save();
      }
    }

    // Clear user-specific caches & global leaderboard
    await Promise.all([
      redisClient.del(`user:profile:${normalizedUsername}`),
      redisClient.del(`user:theme:${normalizedUsername}`),
      redisClient.del("leaderboard:global")
    ]);

    if (leveledUp) {
      TelemetryEvent.create({
        userId: updatedUser._id,
        username: updatedUser.username,
        eventType: "LEVEL_UP",
        metadata: { previousLevel: oldLevel, newLevel, totalXp: updatedUser.xp, xpRequired: (newLevel - 1) * 200 }
      }).catch(err => logger.error("Telemetry failed on level up", { error: err.message }));
    }

    if (onStatsUpdatedCallback) {
      onStatsUpdatedCallback(username, xpGained, won, videoDetails, avatar, selectedClass);
    }

    return { user: updatedUser.toObject(), leveledUp };
  } catch (error) {
    logger.error("Error updating player stats", { username, error: error.message, stack: error.stack });
    return { user: null, leveledUp: false };
  }
}

export async function addSoloXp(username, xpEarned, videoTitle) {
  try {
    const normalizedUsername = username.toLowerCase();

    // --- ATOMIC XP INCREMENT ---
    // Use $inc to atomically add XP and video count, preventing race conditions
    // where concurrent reads all see stale XP and overwrite each other.
    const historyItem = videoTitle ? [{
      title: videoTitle,
      timestamp: new Date(),
      solo: true
    }] : [];

    const updatedUser = await User.findOneAndUpdate(
      { username: normalizedUsername },
      {
        $inc: {
          xp: xpEarned,
          totalVideosWatched: videoTitle ? 1 : 0
        },
        ...(historyItem.length > 0 ? { $push: { watchHistory: { $each: historyItem, $position: 0, $slice: 20 } } } : {})
      },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return null;
    }

    // Compute new level from the authoritative post-increment XP value
    const newLevel = Math.floor(updatedUser.xp / 200) + 1;
    const leveledUp = newLevel > updatedUser.level;

    if (newLevel !== updatedUser.level) {
      await User.updateOne({ username: normalizedUsername }, { $set: { level: newLevel } });
      updatedUser.level = newLevel;
    }

    // Award skill XP (reads updated doc, writes only skill subdoc — lower contention)
    if (videoTitle) {
      // Reload full user to update skills array safely
      const userForSkills = await User.findOne({ username: normalizedUsername });
      if (userForSkills) {
        awardSkillXp(userForSkills, videoTitle, xpEarned);
        await userForSkills.save();
      }
    }

    // Clear caches
    await Promise.all([
      redisClient.del(`user:profile:${normalizedUsername}`),
      redisClient.del(`user:theme:${normalizedUsername}`),
      redisClient.del("leaderboard:global")
    ]);

    if (leveledUp) {
      TelemetryEvent.create({
        userId: updatedUser._id,
        username: updatedUser.username,
        eventType: "LEVEL_UP",
        metadata: { previousLevel: newLevel - 1, newLevel, totalXp: updatedUser.xp, xpRequired: (newLevel - 1) * 200 }
      }).catch(err => logger.error("Telemetry failed on level up", { error: err.message }));
    }

    if (onStatsUpdatedCallback) {
      onStatsUpdatedCallback(username, xpEarned, null, { title: videoTitle, solo: true }, null, null);
    }

    return { xp: updatedUser.xp, level: updatedUser.level, leveledUp };
  } catch (error) {
    logger.error("Error adding solo xp", { username, error: error.message, stack: error.stack });
    return null;
  }
}
