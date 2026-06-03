import crypto from "crypto";
import User from "../models/User.js";

const SECRET_KEY = process.env.SESSION_SECRET || "kaevrix-magical-secret-key-1092837";

// Stateless signed tokens
export function generateToken(username) {
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(username).digest("hex");
  return `${Buffer.from(username).toString("base64")}.${signature}`;
}

export function verifyToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  
  try {
    const username = Buffer.from(parts[0], "base64").toString("utf-8");
    const signature = parts[1];
    const expectedSignature = crypto.createHmac("sha256", SECRET_KEY).update(username).digest("hex");
    if (signature === expectedSignature) {
      return username;
    }
  } catch (e) {
    return null;
  }
  return null;
}

export function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

async function checkJourneyDay(user) {
  if (!user.createdAt) {
    user.createdAt = new Date();
  }
  if (user.lastSeenDay === undefined) {
    user.lastSeenDay = 0;
  }

  const createdAt = new Date(user.createdAt);
  const now = new Date();
  const diffMs = now - createdAt;
  const currentDay = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  if (currentDay > user.lastSeenDay) {
    user.lastSeenDay = currentDay;
    await user.save();
    return currentDay;
  }

  return null;
}

export async function registerUser(username, password, avatar, selectedClass) {
  const normalized = username.trim();
  if (!normalized) {
    throw new Error("Gamer tag cannot be empty");
  }
  if (!password || password.length < 4) {
    throw new Error("Passkey must be at least 4 characters long");
  }

  const existing = await User.findOne({ username: normalized.toLowerCase() });
  if (existing) {
    throw new Error("Alias already taken in this domain");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);

  const newUser = await User.create({
    username: normalized,
    salt,
    passwordHash,
    avatar,
    selectedClass: selectedClass || "doomscroller",
  });

  const token = generateToken(normalized);
  const sanitized = sanitizeUser(newUser);
  sanitized.showDailyAnnouncement = 1;
  return { user: sanitized, token };
}

export async function loginUser(username, password) {
  const normalized = username.trim();
  const user = await User.findOne({ username: normalized.toLowerCase() });
  if (!user) {
    throw new Error("Invalid tag or passkey");
  }

  const checkHash = hashPassword(password, user.salt);
  if (checkHash !== user.passwordHash) {
    throw new Error("Invalid tag or passkey");
  }

  const currentDay = await checkJourneyDay(user);

  const token = generateToken(user.username);
  const sanitized = sanitizeUser(user);
  if (currentDay) {
    sanitized.showDailyAnnouncement = currentDay;
  }
  return { user: sanitized, token };
}

export async function getUserThemeInfo(username) {
  const normalized = username.trim();
  const user = await User.findOne({ username: normalized.toLowerCase() });
  if (user) {
    return {
      username: user.username,
      selectedClass: user.selectedClass,
      avatar: user.avatar
    };
  }
  return null;
}

export async function getUserProfile(username) {
  const normalized = username.trim();
  const user = await User.findOne({ username: normalized.toLowerCase() });
  if (user) {
    const currentDay = await checkJourneyDay(user);
    const sanitized = sanitizeUser(user);
    if (currentDay) {
      sanitized.showDailyAnnouncement = currentDay;
    }
    return sanitized;
  }
  return null;
}

function sanitizeUser(user) {
  const userObj = user.toObject();
  const { salt, passwordHash, ...safe } = userObj;
  return safe;
}
