import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { registerUser, refreshSession } from "../services/authService.js";
import redisClient from "../config/redis.js";

async function run() {
  await connectDB();

  await User.deleteMany({ username: /^test_replay_/ });
  await Session.deleteMany({});

  const username = `test_replay_${Math.random().toString(36).slice(-5)}`;
  const reg = await registerUser(username, "Password_123", "avatar", "speedrunner");
  const token1 = reg.refreshToken;
  console.log("token1:", token1.substring(0, 40) + "...");

  const ref1 = await refreshSession(token1, "127.0.0.1", "test-agent");
  const token2 = ref1.refreshToken;
  console.log("token2:", token2.substring(0, 40) + "...");
  console.log("Same?", token1 === token2, "(should be false)");

  // Old token should be invalidated
  try {
    await refreshSession(token1, "127.0.0.1", "test-agent");
    console.log("❌ VULNERABLE: Old token still works!");
  } catch (e) {
    console.log("✅ SECURE: Old token rejected:", e.message);
  }

  // New token should work
  try {
    const ref2 = await refreshSession(token2, "127.0.0.1", "test-agent");
    console.log("✅ New token works. Token3:", ref2.refreshToken.substring(0, 40) + "...");
  } catch (e) {
    console.log("❌ New token rejected:", e.message);
  }

  await mongoose.disconnect();
  redisClient.disconnect();
}

run();
