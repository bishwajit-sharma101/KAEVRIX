import User from "../models/User.js";
import logger from "../config/logger.js";

// Utility to get user profiles safely
const getUserProfileSafe = (user) => {
  return {
    username: user.username,
    avatar: user.avatar,
    selectedClass: user.selectedClass,
    level: user.level || 1,
    xp: user.xp || 0,
    wins: user.wins || 0,
    losses: user.losses || 0
  };
};

export async function getDiscoverUsers(username, filterQuery = "") {
  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) throw new Error("User not found");

    // Exclude current user, current friends, and users who already have a request pending either way
    const excludeList = [
      user.username,
      ...(user.friends || []),
      ...(user.friendRequests || []),
      ...(user.sentRequests || [])
    ].map(u => u.toLowerCase());

    // Build search criteria
    const query = { username: { $nin: excludeList } };
    if (filterQuery && filterQuery.trim().length > 0) {
      query.username = { $regex: filterQuery.trim(), $options: "i", $nin: excludeList };
    }

    // Fetch up to 100 users matching criteria, sorted by XP (top players first)
    const discoverUsers = await User.aggregate([
      { $match: query },
      { $sort: { xp: -1 } },
      { $limit: 100 },
      { $project: { username: 1, avatar: 1, selectedClass: 1, level: 1, xp: 1, wins: 1, losses: 1, _id: 0 } }
    ]);

    return discoverUsers;
  } catch (error) {
    logger.error("Error in getDiscoverUsers", { error: error.message, stack: error.stack });
    return [];
  }
}

export async function getFriendsData(username) {
  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) throw new Error("User not found");

    const friendsList = user.friends || [];
    const requestsList = user.friendRequests || [];

    // Fetch detailed profiles
    const [friends, incomingRequests] = await Promise.all([
      User.find({ username: { $in: friendsList } }).lean(),
      User.find({ username: { $in: requestsList } }).lean()
    ]);

    return {
      friends: friends.map(getUserProfileSafe),
      incomingRequests: incomingRequests.map(getUserProfileSafe)
    };
  } catch (error) {
    logger.error("Error in getFriendsData", { error: error.message, stack: error.stack });
    return { friends: [], incomingRequests: [] };
  }
}

export async function sendFriendRequest(fromUsername, toUsername) {
  try {
    if (fromUsername.toLowerCase() === toUsername.toLowerCase()) {
      throw new Error("Cannot send request to yourself");
    }

    const fromUser = await User.findOne({ username: fromUsername.toLowerCase() });
    const toUser = await User.findOne({ username: toUsername.toLowerCase() });

    if (!fromUser || !toUser) throw new Error("User not found");

    if (fromUser.friends?.includes(toUser.username)) throw new Error("Already friends");
    if (fromUser.sentRequests?.includes(toUser.username)) throw new Error("Request already sent");
    if (fromUser.friendRequests?.includes(toUser.username)) throw new Error("They already sent you a request! Accept it instead.");

    // Update arrays
    fromUser.sentRequests = fromUser.sentRequests || [];
    fromUser.sentRequests.push(toUser.username);

    toUser.friendRequests = toUser.friendRequests || [];
    toUser.friendRequests.push(fromUser.username);

    await Promise.all([fromUser.save(), toUser.save()]);
    
    return { success: true };
  } catch (error) {
    logger.error("Error in sendFriendRequest", { error: error.message, stack: error.stack });
    throw error;
  }
}

export async function respondToRequest(username, fromUsername, action) {
  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    const requester = await User.findOne({ username: fromUsername.toLowerCase() });

    if (!user || !requester) throw new Error("User not found");
    
    // Ensure request exists
    if (!user.friendRequests?.includes(requester.username)) {
      throw new Error("No pending request from this user");
    }

    // Remove from incoming/outgoing arrays
    user.friendRequests = user.friendRequests.filter(u => u !== requester.username);
    requester.sentRequests = requester.sentRequests?.filter(u => u !== user.username) || [];

    if (action === "accept") {
      user.friends = user.friends || [];
      if (!user.friends.includes(requester.username)) user.friends.push(requester.username);
      
      requester.friends = requester.friends || [];
      if (!requester.friends.includes(user.username)) requester.friends.push(user.username);
    }

    await Promise.all([user.save(), requester.save()]);
    
    return { success: true };
  } catch (error) {
    logger.error("Error in respondToRequest", { error: error.message, stack: error.stack });
    throw error;
  }
}
