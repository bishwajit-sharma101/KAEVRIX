import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  salt: {
    type: String,
    required: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: "https://api.dicebear.com/7.x/bottts/svg?seed=newuser",
  },
  selectedClass: {
    type: String,
    default: "doomscroller",
  },
  xp: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  wins: {
    type: Number,
    default: 0,
  },
  losses: {
    type: Number,
    default: 0,
  },
  totalVideosWatched: {
    type: Number,
    default: 0,
  },
  totalWatchTime: {
    type: Number,
    default: 0,
  },
  watchHistory: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastSeenDay: {
    type: Number,
    default: 1,
  },
  friends: {
    type: [String],
    default: [],
  },
  friendRequests: {
    type: [String],
    default: [],
  },
  sentRequests: {
    type: [String],
    default: [],
  },
  skills: {
    type: [
      {
        name: String,
        xp: { type: Number, default: 0 },
        tier: { type: String, default: "Novice" }
      }
    ],
    default: [],
  },
  cosmetics: {
    banner: { type: String, default: "" },
    avatarFrame: { type: String, default: "" },
    profileEffect: { type: String, default: "" }
  }
});

const User = mongoose.model("User", userSchema);

export default User;
