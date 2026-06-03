import Message from "../models/Message.js";

/**
 * Save a new direct message.
 */
export async function saveMessage(sender, receiver, content) {
  try {
    const newMsg = new Message({
      sender,
      receiver,
      content,
    });
    await newMsg.save();
    return newMsg;
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
}

/**
 * Fetch chat history between two users.
 */
export async function getConversation(user1, user2, limit = 50) {
  try {
    // Find messages where (sender=user1 and receiver=user2) OR (sender=user2 and receiver=user1)
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    })
    .sort({ timestamp: 1 }) // Chronological order
    .limit(limit);
    
    return messages;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
}

/**
 * Mark all messages from a sender to a receiver as read.
 */
export async function markAsRead(sender, receiver) {
  try {
    await Message.updateMany(
      { sender, receiver, read: false },
      { $set: { read: true } }
    );
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
}
