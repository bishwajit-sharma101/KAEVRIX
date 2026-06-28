export const CLASS_COLORS = [
  "#a855f7", // Purple (Doomscroller)
  "#f97316", // Orange (Speedrunner)
  "#3b82f6", // Blue (Streamsniper)
  "#ef4444", // Red (Edgelord)
  "#22c55e", // Green (Vibechecker)
  "#06b6d4", // Cyan (Glitchmancer)
  "#eab308", // Yellow (Sigmagrinder)
  "#8b5cf6", // Violet (NPC)
  "#f43f5e", // Rose (Brainiac)
  "#ec4899"  // Pink (Gachaaddict)
];

export const CLASS_ICONS = ["🧠", "⚡", "🛡️", "👾", "🎯", "👁️", "⚔️", "🤖", "🧬", "🎲"];

export const CLASS_STATS = {
  doomscroller: { focus: 40, speed: 50, disruption: 85, defense: 30, chaos: 60 },
  speedrunner: { focus: 75, speed: 99, disruption: 45, defense: 40, chaos: 50 },
  streamsniper: { focus: 80, speed: 60, disruption: 70, defense: 30, chaos: 65 },
  edgelord: { focus: 45, speed: 70, disruption: 90, defense: 20, chaos: 75 },
  vibechecker: { focus: 90, speed: 50, disruption: 10, defense: 99, chaos: 20 },
  glitchmancer: { focus: 50, speed: 60, disruption: 98, defense: 35, chaos: 80 },
  sigmagrinder: { focus: 95, speed: 75, disruption: 50, defense: 60, chaos: 30 },
  npc: { focus: 30, speed: 40, disruption: 75, defense: 50, chaos: 70 },
  brainiac: { focus: 99, speed: 65, disruption: 30, defense: 70, chaos: 25 },
  gachaaddict: { focus: 35, speed: 55, disruption: 60, defense: 40, chaos: 99 }
};

export const PATHFINDER_QUESTIONS = [
  {
    id: "topic",
    question: "What do you want to learn?",
    hint: "Be specific — e.g. 'React & Next.js', 'Python Data Science', 'Guitar basics'",
    placeholder: "I want to learn..."
  },
  {
    id: "why",
    question: "Why do you want to learn this?",
    hint: "Your reason shapes the path — job, hobby, building a startup?",
    placeholder: "Because I want to..."
  },
  {
    id: "time",
    question: "How much time can you dedicate daily?",
    hint: "Be realistic — 30 min? 1 hour? 3 hours?",
    placeholder: "About... hours/day..."
  },
  {
    id: "background",
    question: "What is your current level with this?",
    hint: "Beginner? Some basic familiarity? Stuck at intermediate?",
    placeholder: "Right now I..."
  },
  {
    id: "goal",
    question: "What does success look like in 3 months?",
    hint: "A working project? Passing an interview? Freelance client?",
    placeholder: "In 3 months I want to..."
  }
];

export const RETRO_TIPS = [
  "TIP: CORRECT ANSWERS YIELD 50 XP BASE + SPEED BONUS UP TO 10% PER REMAINING SECOND!",
  "TIP: DOOMSCROLLER CLASS SPECIALIZES IN VISUAL DISRUPTION AND CHAOS!",
  "TIP: STREAMSIPER CAN FREEZE OPPONENTS TO DELAY THEIR VIDEO PLAYBACK!",
  "TIP: KEEP AN EYE ON YOUR WATCH ENERGY BAR TO ACTIVATE POWERFUL SIGNATURE ACTIONS!",
  "TIP: QUESTIONS POP UP DYNAMICALLY BASED ON VIDEO LENGTH IN THE SECOND HALF!",
  "TIP: REROLL YOUR AVATAR MATRIX SEED TO GENERATE UNIQUE BOT DETAILS!"
];
