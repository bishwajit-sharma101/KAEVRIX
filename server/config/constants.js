import path from "path";

export const DATA_DIR = path.resolve("./data");
export const LEADERBOARD_FILE = path.join(DATA_DIR, "leaderboard.json");

export const BOT_NAMES = [
  "AlphaWatch", "QuantumQuest", "BytePioneer", "CuriousBrain", 
  "SpaceDiver", "GizmoExplorer", "PixelSage", "TuringTest"
];

export const BOT_INTRO_CHATS = [
  "Hey there! Ready to watch this?",
  "Hello! Let's see who gets the higher score.",
  "Hey! Love this topic, good luck!",
  "Hi! Fasten your seatbelt, I watch at 2x speed in my brain!",
  "Yo! Let's do this."
];

export const BOT_MID_CHATS = [
  "Wow, that part is actually crazy.",
  "Never thought about it that way before.",
  "Interesting point they made there.",
  "Wait, I need to remember that for the quiz!",
  "This is a really well-made video."
];

export const BOT_SUBMIT_CHATS = [
  "Done! Those questions were tough.",
  "Submitted! Hopefully I got them all correct.",
  "Finished watching! Good luck on the questions.",
  "Whoa, that was fast. Let's see how I did."
];
