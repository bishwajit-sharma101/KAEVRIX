import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";
import User from "./models/User.js";

dotenv.config();

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

const CLASSES = [
  "doomscroller", "speedrunner", "streamsniper", "edgelord", 
  "vibechecker", "glitchmancer", "sigmagrinder", "npc", 
  "brainiac", "gachaaddict"
];

const SKILL_NAMES = [
  "JavaScript", "Python", "Operating Systems", "C++", 
  "Java", "Frontend Web", "System Design", "Algorithms"
];

const DUMMY_NAMES = [
  "CyberNinja", "CodeViper", "PixelPulse", "BinaryBeast",
  "AlgoRhythm", "SynthWave", "ShadowByte", "QuantumGamer",
  "NeonSpecter", "ZeroCool", "ByteMe", "LogicBomb",
  "MegaHertz", "DataDrifter", "GlitchKing", "ConsoleLog",
  "Recursion", "StackOverflow", "CookieMonster", "PromptEngineer"
];

const seedDummyUsers = async () => {
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ytplay";
  console.log(`Connecting to MongoDB at: ${mongoURI}`);
  
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB successfully.");

    // Delete existing dummy users with these usernames to avoid duplicates and allow running multiple times
    const deleteRes = await User.deleteMany({ username: { $in: DUMMY_NAMES.map(name => name.toLowerCase()) } });
    console.log(`Removed ${deleteRes.deletedCount} existing dummy users to reset list.`);

    const dummyUsers = [];
    const password = "password123"; // default password for all dummy users

    for (let i = 0; i < DUMMY_NAMES.length; i++) {
      const username = DUMMY_NAMES[i];
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = hashPassword(password, salt);
      const selectedClass = CLASSES[Math.floor(Math.random() * CLASSES.length)];
      const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}&backgroundColor=transparent`;
      
      // Random stats
      const xp = Math.floor(Math.random() * 5000) + 100; // 100 to 5100 XP
      const level = Math.floor(xp / 200) + 1;
      const wins = Math.floor(Math.random() * (level * 3)) + 1;
      const losses = Math.max(1, Math.floor(Math.random() * (level * 2)));
      const totalVideosWatched = wins + losses + Math.floor(Math.random() * 5);
      const totalWatchTime = totalVideosWatched * (Math.floor(Math.random() * 300) + 120); // seconds

      // Skills seeding
      const skills = [];
      const numSkills = Math.floor(Math.random() * 3) + 1; // 1 to 3 skills
      const shuffledSkills = [...SKILL_NAMES].sort(() => 0.5 - Math.random());
      
      for (let s = 0; s < numSkills; s++) {
        const skillXp = Math.floor(Math.random() * (xp * 0.5)) + 50;
        let tier = "Novice";
        if (skillXp >= 3000) tier = "Master";
        else if (skillXp >= 1500) tier = "Expert";
        else if (skillXp >= 500) tier = "Adept";
        
        skills.push({
          name: shuffledSkills[s],
          xp: skillXp,
          tier
        });
      }

      dummyUsers.push({
        username: username, // model schema has unique constraints but lowers it or uses trim. Let's provide case preserved but lowercase will be checked in unique index
        salt,
        passwordHash,
        avatar,
        selectedClass,
        xp,
        level,
        wins,
        losses,
        totalVideosWatched,
        totalWatchTime,
        watchHistory: [],
        skills,
        cosmetics: {
          banner: "",
          avatarFrame: "",
          profileEffect: ""
        }
      });
    }

    const created = await User.create(dummyUsers);
    console.log(`Successfully created ${created.length} dummy users!`);
    
    // Print out credentials so they can be logged into if wanted
    console.log("\n==============================================");
    console.log("Credentials for login (all share same password):");
    console.log(`Password: ${password}`);
    console.log("Usernames:");
    DUMMY_NAMES.forEach(name => console.log(` - ${name}`));
    console.log("==============================================\n");

  } catch (error) {
    console.error("Error seeding dummy users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

seedDummyUsers();
