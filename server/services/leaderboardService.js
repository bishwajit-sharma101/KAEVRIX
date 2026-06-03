import User from "../models/User.js";

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
    }

    // Level formula: Level = Math.floor(XP / 200) + 1
    const newLevel = Math.floor(user.xp / 200) + 1;
    const leveledUp = newLevel > user.level;
    user.level = newLevel;

    await user.save();
    
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
    }

    await user.save();

    if (onStatsUpdatedCallback) {
      onStatsUpdatedCallback(username, xpEarned, null, { title: videoTitle, solo: true }, null, null);
    }

    return { xp: user.xp, level: user.level, leveledUp };
  } catch (error) {
    console.error("Error adding solo xp:", error);
    return null;
  }
}
