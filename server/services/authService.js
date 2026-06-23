import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import User from "../models/User.js";
import Session from "../models/Session.js";
import SecurityEvent from "../models/SecurityEvent.js";
import TelemetryEvent from "../models/TelemetryEvent.js";

const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!SECRET_KEY || !REFRESH_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET and JWT_REFRESH_SECRET environment variables must be defined!");
  process.exit(1);
}
const COMMON_PASSWORDS = ["password", "12345678", "qwertyuiop", "password123", "123456789"];

export function generateAccessToken(user) {
  return jwt.sign({ userId: user._id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: "15m" });
}

export function generateRefreshToken(user) {
  return jwt.sign({ userId: user._id }, REFRESH_SECRET, { expiresIn: "7d" });
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
    return currentDay;
  }
  return null;
}

export async function registerUser(username, password, avatar, selectedClass, ipAddress = "unknown", userAgent = "unknown") {
  const normalized = username.trim();
  if (!normalized) throw new Error("Gamer tag cannot be empty");
  if (!password || password.trim().length < 8) throw new Error("Passkey must be at least 8 characters long and not empty");
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) throw new Error("Passkey is too common. Please choose a stronger one.");

  const existing = await User.findOne({ username: normalized.toLowerCase() });
  if (existing) throw new Error("Alias already taken in this domain");

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

  await SecurityEvent.create({ userId: newUser._id, username: newUser.username, ipAddress, endpoint: "/auth/register", eventType: "SUCCESSFUL_LOGIN" });
  await TelemetryEvent.create({ userId: newUser._id, username: newUser.username, eventType: "USER_REGISTERED", metadata: { ipAddress, userAgent } });
  await TelemetryEvent.create({ userId: newUser._id, username: newUser.username, eventType: "SESSION_STARTED", sessionId: session._id.toString(), ipAddress, userAgent });
  return { user: sanitized, accessToken, refreshToken };
}

async function checkLockout(username, ipAddress) {
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentFails = await SecurityEvent.countDocuments({ $or: [{ username: username.toLowerCase() }, { ipAddress }], eventType: "FAILED_LOGIN", timestamp: { $gte: thirtyMinsAgo } });
  if (recentFails >= 10) {
    await SecurityEvent.create({ username, ipAddress, endpoint: "/auth/login", eventType: "LOCKOUT" });
    throw new Error("Account temporarily locked due to multiple failed login attempts. Try again in 30 minutes.");
  }
  const veryRecentFails = await SecurityEvent.countDocuments({ $or: [{ username: username.toLowerCase() }, { ipAddress }], eventType: "FAILED_LOGIN", timestamp: { $gte: fiveMinsAgo } });
  if (veryRecentFails >= 5) {
    await SecurityEvent.create({ username, ipAddress, endpoint: "/auth/login", eventType: "LOCKOUT" });
    throw new Error("Account temporarily locked due to multiple failed login attempts. Try again in 5 minutes.");
  }
}

export async function loginUser(username, password, ipAddress = "unknown", userAgent = "unknown") {
  const normalized = username.trim();
  await checkLockout(normalized, ipAddress);

  const user = await User.findOne({ username: normalized.toLowerCase() });
  if (!user) {
    await SecurityEvent.create({ username: normalized, ipAddress, endpoint: "/auth/login", eventType: "FAILED_LOGIN" });
    throw new Error("Invalid tag or passkey");
  }

  let isValid = false;
  if (user.passwordHash.length === 128) {
     const checkHash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, "sha512").toString("hex");
     isValid = (checkHash === user.passwordHash);
     if (isValid) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);
        await user.save();
     }
  } else {
     isValid = await bcrypt.compare(password, user.passwordHash);
  }

  if (!isValid) {
    await SecurityEvent.create({ userId: user._id, username: user.username, ipAddress, endpoint: "/auth/login", eventType: "FAILED_LOGIN" });
    throw new Error("Invalid tag or passkey");
  }

  // If MFA is enabled, return a temporary token to prompt for TOTP instead of full login
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

  await SecurityEvent.create({ userId: user._id, username: user.username, ipAddress, endpoint: "/auth/login", eventType: "SUCCESSFUL_LOGIN" });
  await TelemetryEvent.create({ userId: user._id, username: user.username, eventType: "USER_LOGIN", metadata: { ipAddress, userAgent, currentDay } });
  await TelemetryEvent.create({ userId: user._id, username: user.username, eventType: "SESSION_STARTED", sessionId: session._id.toString(), ipAddress, userAgent });
  return { user: sanitized, accessToken, refreshToken };
}

export async function verifyMfaLogin(tempToken, tokenCode, ipAddress, userAgent) {
  try {
    const decoded = jwt.verify(tempToken, SECRET_KEY);
    const user = await User.findById(decoded.tempUserId);
    if (!user || !user.mfaEnabled) throw new Error("Invalid MFA state");

    const verified = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: "base32", token: tokenCode, window: 1 });
    if (!verified) throw new Error("Invalid 2FA code");

    return await completeLogin(user, ipAddress, userAgent);
  } catch (err) {
    throw new Error("MFA Verification Failed: " + err.message);
  }
}

export async function setupMfa(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  
  const secret = speakeasy.generateSecret({ name: `Kaevrix (${user.username})` });
  user.mfaSecret = secret.base32;
  await user.save();

  const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);
  return { secret: secret.base32, qrCode: qrCodeDataURL };
}

export async function verifyMfaSetup(userId, tokenCode) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const verified = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: "base32", token: tokenCode, window: 1 });
  if (verified) {
    user.mfaEnabled = true;
    await user.save();
    return true;
  }
  throw new Error("Invalid 2FA code");
}

export async function refreshSession(oldRefreshToken, ipAddress, userAgent) {
  if (!oldRefreshToken) throw new Error("No refresh token provided");
  
  try {
    const decoded = jwt.verify(oldRefreshToken, REFRESH_SECRET);
    const session = await Session.findOne({ refreshToken: oldRefreshToken, userId: decoded.userId });
    if (!session) throw new Error("Session revoked or invalid");

    const user = await User.findById(decoded.userId);
    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    session.refreshToken = newRefreshToken;
    session.lastActive = new Date();
    await session.save();

    // Since a session refers to the device login lifespan, a token refresh keeps the session active.
    // If you explicitly wanted to log refresh events, you could add SESSION_REFRESHED, but for now we leave it.

    return { accessToken, refreshToken: newRefreshToken };
  } catch (err) {
    // If token is invalid or expired, delete any potentially matching sessions just in case
    const invalidSession = await Session.findOne({ refreshToken: oldRefreshToken });
    if (invalidSession) {
      await TelemetryEvent.create({ userId: invalidSession.userId, eventType: "SESSION_ENDED", sessionId: invalidSession._id.toString(), metadata: { reason: "refresh_failed" } }).catch(() => {});
      await Session.deleteOne({ _id: invalidSession._id }).catch(() => {});
    }
    throw new Error("Refresh token expired or invalid");
  }
}

export async function getUserThemeInfo(username) {
  const normalized = username.trim();
  const user = await User.findOne({ username: normalized.toLowerCase() });
  return user ? { username: user.username, selectedClass: user.selectedClass, avatar: user.avatar } : null;
}

export async function getUserProfile(username) {
  const normalized = username.trim();
  const user = await User.findOne({ username: normalized.toLowerCase() });
  if (user) {
    const currentDay = await checkJourneyDay(user);
    const sanitized = sanitizeUser(user);
    if (currentDay) sanitized.showDailyAnnouncement = currentDay;
    return sanitized;
  }
  return null;
}

function sanitizeUser(user) {
  const userObj = user.toObject();
  const { salt, passwordHash, mfaSecret, ...safe } = userObj;
  return safe;
}
