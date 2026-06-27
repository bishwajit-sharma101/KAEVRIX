import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import User from "../models/User.js";
import Session from "../models/Session.js";
import SecurityEvent from "../models/SecurityEvent.js";
import TelemetryEvent from "../models/TelemetryEvent.js";
import redisClient from "../config/redis.js";

const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!SECRET_KEY || !REFRESH_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET and JWT_REFRESH_SECRET environment variables must be defined!");
  process.exit(1);
}
const COMMON_PASSWORDS = ["password", "12345678", "qwertyuiop", "password123", "123456789"];

// Helper to throw customized errors with HTTP status codes
function throwError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

export function generateAccessToken(user) {
  return jwt.sign({ userId: user._id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: "15m" });
}

export function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user._id, jti: crypto.randomUUID() },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  if (!token) return null;
  try { return jwt.verify(token, SECRET_KEY); } catch (e) { return null; }
}

async function checkJourneyDay(user) {
  if (!user.createdAt) user.createdAt = new Date();
  if (user.lastSeenDay === undefined) user.lastSeenDay = 0;
  const createdAt = new Date(user.createdAt);
  const diffMs = new Date() - createdAt;
  const currentDay = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  if (currentDay > user.lastSeenDay) {
    user.lastSeenDay = currentDay;
    await user.save();
    // Invalidate cached profiles
    await Promise.all([
      redisClient.del(`user:profile:${user.username.toLowerCase()}`),
      redisClient.del(`user:theme:${user.username.toLowerCase()}`)
    ]);
    return currentDay;
  }
  return null;
}

export async function registerUser(username, password, avatar, selectedClass, ipAddress = "unknown", userAgent = "unknown") {
  const normalized = username.trim();
  if (!normalized) throwError("Gamer tag cannot be empty", 400);
  if (!password || password.trim().length < 8) throwError("Passkey must be at least 8 characters long and not empty", 400);
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) throwError("Passkey is too common. Please choose a stronger one.", 400);

  const existing = await User.findOne({ username: normalized.toLowerCase() });
  if (existing) throwError("Alias already taken in this domain", 400);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    username: normalized,
    salt: "deprecated",
    passwordHash,
    avatar,
    selectedClass: selectedClass || "doomscroller",
    role: "user"
  });

  const accessToken = generateAccessToken(newUser);
  const refreshToken = generateRefreshToken(newUser);

  const session = await Session.create({
    userId: newUser._id,
    refreshToken,
    userAgent,
    ipAddress,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  const sanitized = sanitizeUser(newUser);
  sanitized.showDailyAnnouncement = 1;

  SecurityEvent.create({ userId: newUser._id, username: newUser.username, ipAddress, endpoint: "/auth/register", eventType: "SUCCESSFUL_LOGIN" }).catch(() => {});
  TelemetryEvent.create({ userId: newUser._id, username: newUser.username, eventType: "USER_REGISTERED", metadata: { ipAddress, userAgent } }).catch(() => {});
  TelemetryEvent.create({ userId: newUser._id, username: newUser.username, eventType: "SESSION_STARTED", sessionId: session._id.toString(), ipAddress, userAgent }).catch(() => {});
  return { user: sanitized, accessToken, refreshToken };
}

// Redis-backed Lockout check & failed login recorder
async function checkLockout(username, ipAddress) {
  const normUser = username.toLowerCase();
  const keys = [
    `lockout:fail:30m:${normUser}`,
    `lockout:fail:5m:${normUser}`
  ];
  const [fail30User, fail5User] = await redisClient.mget(keys);
  
  const total30Fails = parseInt(fail30User || 0, 10);
  if (total30Fails >= 10) {
    throwError("Account temporarily locked due to multiple failed login attempts. Try again in 30 minutes.", 403);
  }
  
  const total5Fails = parseInt(fail5User || 0, 10);
  if (total5Fails >= 5) {
    throwError("Account temporarily locked due to multiple failed login attempts. Try again in 5 minutes.", 403);
  }
}

async function recordFailedLogin(username, ipAddress) {
  const normUser = username.toLowerCase();
  const pipeline = redisClient.pipeline();
  
  pipeline.incr(`lockout:fail:30m:${normUser}`);
  pipeline.expire(`lockout:fail:30m:${normUser}`, 1800);
  
  pipeline.incr(`lockout:fail:30m:${ipAddress}`);
  pipeline.expire(`lockout:fail:30m:${ipAddress}`, 1800);
  
  pipeline.incr(`lockout:fail:5m:${normUser}`);
  pipeline.expire(`lockout:fail:5m:${normUser}`, 300);
  
  pipeline.incr(`lockout:fail:5m:${ipAddress}`);
  pipeline.expire(`lockout:fail:5m:${ipAddress}`, 300);
  
  await pipeline.exec();
}

async function clearLockout(username, ipAddress) {
  const normUser = username.toLowerCase();
  await Promise.all([
    redisClient.del(`lockout:fail:30m:${normUser}`),
    redisClient.del(`lockout:fail:30m:${ipAddress}`),
    redisClient.del(`lockout:fail:5m:${normUser}`),
    redisClient.del(`lockout:fail:5m:${ipAddress}`)
  ]);
}

export async function loginUser(username, password, ipAddress = "unknown", userAgent = "unknown") {
  const normalized = username.trim();
  await checkLockout(normalized, ipAddress);

  const user = await User.findOne({ username: normalized.toLowerCase() });
  if (!user) {
    await recordFailedLogin(normalized, ipAddress);
    SecurityEvent.create({ username: normalized, ipAddress, endpoint: "/auth/login", eventType: "FAILED_LOGIN" }).catch(() => {});
    throwError("Invalid tag or passkey", 401);
  }

  let isValid = false;
  if (user.passwordHash.length === 128) {
     const checkHash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, "sha512").toString("hex");
     isValid = (checkHash === user.passwordHash);
     if (isValid) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);
        await user.save();
        await redisClient.del(`user:profile:${user.username.toLowerCase()}`);
     }
  } else {
     isValid = await bcrypt.compare(password, user.passwordHash);
  }

  if (!isValid) {
    await recordFailedLogin(user.username, ipAddress);
    SecurityEvent.create({ userId: user._id, username: user.username, ipAddress, endpoint: "/auth/login", eventType: "FAILED_LOGIN" }).catch(() => {});
    throwError("Invalid tag or passkey", 401);
  }

  // Clear failed counter on success
  await clearLockout(user.username, ipAddress);

  if (user.mfaEnabled) {
    const tempToken = jwt.sign({ tempUserId: user._id }, SECRET_KEY, { expiresIn: "5m" });
    return { mfaRequired: true, tempToken };
  }

  return await completeLogin(user, ipAddress, userAgent);
}

export async function completeLogin(user, ipAddress, userAgent) {
  const currentDay = await checkJourneyDay(user);
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const session = await Session.create({
    userId: user._id,
    refreshToken,
    userAgent,
    ipAddress,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  const sanitized = sanitizeUser(user);
  if (currentDay) sanitized.showDailyAnnouncement = currentDay;

  SecurityEvent.create({ userId: user._id, username: user.username, ipAddress, endpoint: "/auth/login", eventType: "SUCCESSFUL_LOGIN" }).catch(() => {});
  TelemetryEvent.create({ userId: user._id, username: user.username, eventType: "USER_LOGIN", metadata: { ipAddress, userAgent, currentDay } }).catch(() => {});
  TelemetryEvent.create({ userId: user._id, username: user.username, eventType: "SESSION_STARTED", sessionId: session._id.toString(), ipAddress, userAgent }).catch(() => {});
  return { user: sanitized, accessToken, refreshToken };
}

export async function verifyMfaLogin(tempToken, tokenCode, ipAddress, userAgent) {
  try {
    const decoded = jwt.verify(tempToken, SECRET_KEY);
    const user = await User.findById(decoded.tempUserId);
    if (!user || !user.mfaEnabled) throwError("Invalid MFA state", 400);

    const verified = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: "base32", token: tokenCode, window: 1 });
    if (!verified) throwError("Invalid 2FA code", 401);

    await clearLockout(user.username, ipAddress);
    return await completeLogin(user, ipAddress, userAgent);
  } catch (err) {
    if (err.statusCode) throw err;
    throwError("MFA Verification Failed: " + err.message, 401);
  }
}

export async function setupMfa(userId) {
  const user = await User.findById(userId);
  if (!user) throwError("User not found", 404);
  
  const secret = speakeasy.generateSecret({ name: `Kaevrix (${user.username})` });
  user.mfaSecret = secret.base32;
  await user.save();
  await redisClient.del(`user:profile:${user.username.toLowerCase()}`);

  const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);
  return { secret: secret.base32, qrCode: qrCodeDataURL };
}

export async function verifyMfaSetup(userId, tokenCode) {
  const user = await User.findById(userId);
  if (!user) throwError("User not found", 404);

  const verified = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: "base32", token: tokenCode, window: 1 });
  if (verified) {
    user.mfaEnabled = true;
    await user.save();
    await redisClient.del(`user:profile:${user.username.toLowerCase()}`);
    return true;
  }
  throwError("Invalid 2FA code", 401);
}

export async function refreshSession(oldRefreshToken, ipAddress, userAgent) {
  if (!oldRefreshToken) throwError("No refresh token provided", 401);
  
  try {
    const decoded = jwt.verify(oldRefreshToken, REFRESH_SECRET);
    const session = await Session.findOne({ refreshToken: oldRefreshToken, userId: decoded.userId });
    if (!session) throwError("Session revoked or invalid", 401);

    // Load from Redis cache or fallback to DB
    const profileKey = `user:profile:${decoded.userId}`;
    let user;
    const cachedUser = await redisClient.get(profileKey);
    if (cachedUser) {
      user = JSON.parse(cachedUser);
    } else {
      const userDoc = await User.findById(decoded.userId);
      if (!userDoc) throwError("User not found", 401);
      user = userDoc.toObject();
      await redisClient.set(profileKey, JSON.stringify(user), "EX", 300);
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Atomic update: replace old token with new one in a single DB operation
    // This guarantees the old token is invalidated even under race conditions
    const updated = await Session.findOneAndUpdate(
      { _id: session._id, refreshToken: oldRefreshToken },
      { $set: { refreshToken: newRefreshToken } },
      { returnDocument: 'after' }
    );
    if (!updated) throwError("Session already rotated (replay detected)", 401);

    return { accessToken, refreshToken: newRefreshToken };
  } catch (err) {
    const invalidSession = await Session.findOne({ refreshToken: oldRefreshToken });
    if (invalidSession) {
      TelemetryEvent.create({ userId: invalidSession.userId, eventType: "SESSION_ENDED", sessionId: invalidSession._id.toString(), metadata: { reason: "refresh_failed" } }).catch(() => {});
      Session.deleteOne({ _id: invalidSession._id }).catch(() => {});
    }
    if (err.statusCode) throw err;
    throwError("Refresh token expired or invalid", 401);
  }
}

export async function getUserThemeInfo(username) {
  const normalized = username.trim().toLowerCase();
  const key = `user:theme:${normalized}`;
  const cached = await redisClient.get(key);
  if (cached) {
    return cached === "null" ? null : JSON.parse(cached);
  }
  const user = await User.findOne({ username: normalized });
  if (user) {
    const themeInfo = { username: user.username, selectedClass: user.selectedClass, avatar: user.avatar };
    await redisClient.set(key, JSON.stringify(themeInfo), "EX", 300);
    return themeInfo;
  } else {
    await redisClient.set(key, "null", "EX", 30);
    return null;
  }
}

export async function getUserProfile(username) {
  const normalized = username.trim().toLowerCase();
  const key = `user:profile:${normalized}`;
  const cached = await redisClient.get(key);
  let user;
  if (cached) {
    if (cached === "null") return null;
    user = JSON.parse(cached);
  } else {
    const userDoc = await User.findOne({ username: normalized });
    if (userDoc) {
      user = userDoc.toObject();
      await redisClient.set(key, JSON.stringify(user), "EX", 300);
    } else {
      await redisClient.set(key, "null", "EX", 30);
      return null;
    }
  }

  // checkJourneyDay expects a Mongoose document. Call it with a temporary mock or load from DB if check is needed.
  const createdAt = new Date(user.createdAt || Date.now());
  const diffMs = new Date() - createdAt;
  const currentDay = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  
  if (currentDay > (user.lastSeenDay || 0)) {
    const userDoc = await User.findOne({ username: normalized });
    if (userDoc) {
      await checkJourneyDay(userDoc);
      const updated = userDoc.toObject();
      const sanitized = sanitizeUser(updated);
      sanitized.showDailyAnnouncement = currentDay;
      return sanitized;
    }
  }

  const sanitized = sanitizeUser(user);
  return sanitized;
}

function sanitizeUser(user) {
  const userObj = typeof user.toObject === "function" ? user.toObject() : user;
  const { salt, passwordHash, mfaSecret, ...safe } = userObj;
  return safe;
}
