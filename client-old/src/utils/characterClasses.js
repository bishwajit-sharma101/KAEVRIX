export const CHARACTER_CLASSES = {
  doomscroller: {
    id: "doomscroller",
    name: "The Doomscroller",
    description: "Distraction & UI Clutter. Throws irrelevant content at the opponent to break their focus.",
    avatarSeed: "Felix", // DiceBear seed mapping
    skills: [
      { level: 1, name: "TikTok Brain", desc: "Spawns a fake notification on the opponent's screen." },
      { level: 10, name: "Subway Surfer", desc: "Splits the opponent's video screen in half, playing random footage for 5s." },
      { level: 20, name: "Attention Span 0", desc: "Auto-skips 5 seconds of the opponent's video." },
      { level: 30, name: "Ad Break", desc: "Forces a fake 'Unskippable Ad' overlay on the opponent for 3s." },
      { level: 40, name: "Endless Feed", desc: "Shuffles the opponent's quiz answers every 3 seconds." },
      { level: 50, name: "Brain Rot", desc: "Blurs the opponent's video entirely and plays loud static for 5s." }
    ]
  },
  speedrunner: {
    id: "speedrunner",
    name: "The Speedrunner",
    description: "Time Manipulation. Gains insane temporal advantages and skips requirements.",
    avatarSeed: "Aneka",
    skills: [
      { level: 1, name: "2x Speed", desc: "Fast-forwards your own video by 2 seconds." },
      { level: 10, name: "Frame Skip", desc: "Skips the last 5% of your video requirement." },
      { level: 20, name: "Lag Switch", desc: "Pauses the opponent's video for 3 seconds." },
      { level: 30, name: "Time Split", desc: "Reduces your quiz timer but gives you 2x points." },
      { level: 40, name: "Skip Cutscene", desc: "Instantly skips 15% of your video watch requirement." },
      { level: 50, name: "World Record", desc: "Automatically answers 1 quiz question correctly for you." }
    ]
  },
  streamsniper: {
    id: "streamsniper",
    name: "The StreamSniper",
    description: "Information Theft. Peeks at the opponent's progress and steals answers.",
    avatarSeed: "Leo",
    skills: [
      { level: 1, name: "Peeking", desc: "Reveals the opponent's exact video watch percentage." },
      { level: 10, name: "Inspect Element", desc: "Highlights 1 incorrect option in the quiz." },
      { level: 20, name: "Ghosting", desc: "Hides your progress bar from the opponent completely." },
      { level: 30, name: "Ctrl+C", desc: "Get a hint if the opponent answers correctly before you." },
      { level: 40, name: "Screen Cheat", desc: "Locks the opponent's quiz screen for 2 seconds." },
      { level: 50, name: "Full Doxx", desc: "Removes 2 incorrect answers from your current quiz question." }
    ]
  },
  edgelord: {
    id: "edgelord",
    name: "The Edgelord",
    description: "Griefing & Energy Drain. Highly offensive. Steals battery and punishes.",
    avatarSeed: "Bandit",
    skills: [
      { level: 1, name: "Ratio'd", desc: "Drains 10% of the opponent's battery energy." },
      { level: 10, name: "Cringe Aura", desc: "The opponent's battery charges 50% slower for 10s." },
      { level: 20, name: "Vampire Bite", desc: "Steals 20% of the opponent's energy." },
      { level: 30, name: "Toxic Chat", desc: "Inverts the opponent's mouse controls during the quiz for 3s." },
      { level: 40, name: "Shadowban", desc: "Disables the opponent from using skills for 10s." },
      { level: 50, name: "Cancel Culture", desc: "Drains 100% of opponent's energy & pauses video for 4s." }
    ]
  },
  vibechecker: {
    id: "vibechecker",
    name: "The VibeChecker",
    description: "Defensive & Immune. Protects against attacks and focuses on pure learning.",
    avatarSeed: "Fluffy",
    skills: [
      { level: 1, name: "Good Vibes", desc: "Heals your own battery by 15%." },
      { level: 10, name: "Do Not Disturb", desc: "Blocks the next attack thrown at you." },
      { level: 20, name: "Zen Mode", desc: "Speeds up your battery recharge rate by 2x for 10s." },
      { level: 30, name: "Touch Grass", desc: "Cleanses all active debuffs currently on you." },
      { level: 40, name: "Aura Shield", desc: "Reflects the next attack back at the opponent." },
      { level: 50, name: "Immaculate Vibes", desc: "Immune to all attacks for 15s + 50% battery gain." }
    ]
  },
  glitchmancer: {
    id: "glitchmancer",
    name: "The GlitchMancer",
    description: "Visual Disruption. Destroys the opponent's UI and visuals.",
    avatarSeed: "Gizmo",
    skills: [
      { level: 1, name: "Dead Pixel", desc: "Puts a large black square in the center of opponent's video." },
      { level: 10, name: "Deepfry", desc: "Turns the opponent's video contrast and saturation to 500%." },
      { level: 20, name: "Buffer Ring", desc: "Forces a fake loading spinner on opponent's screen for 4s." },
      { level: 30, name: "CSS Break", desc: "Randomly moves the opponent's quiz buttons around." },
      { level: 40, name: "Flashbang", desc: "Blinds the opponent with a pure white screen for 3s." },
      { level: 50, name: "BSOD", desc: "Hits the opponent with a fake Blue Screen of Death for 5s." }
    ]
  },
  sigmagrinder: {
    id: "sigmagrinder",
    name: "The SigmaGrinder",
    description: "Late-Game Scaling. Starts weak but becomes an unstoppable god over time.",
    avatarSeed: "Jack",
    skills: [
      { level: 1, name: "Hustle", desc: "Battery charges 5% faster permanently." },
      { level: 10, name: "Compound Interest", desc: "Every correct quiz answer gives +10% extra energy." },
      { level: 20, name: "Passive Income", desc: "Generate 1% energy every second passively." },
      { level: 30, name: "Grindset", desc: "If you are behind on video progress, your video plays 1.2x faster." },
      { level: 40, name: "Market Crash", desc: "Steals 5% energy from the opponent every second for 5s." },
      { level: 50, name: "Trillionaire", desc: "Instantly fills your battery & disables opponent's for 10s." }
    ]
  },
  npc: {
    id: "npc",
    name: "The NPC",
    description: "Deception & Confusion. Predictable but uses confusion tactics.",
    avatarSeed: "Cuddles",
    skills: [
      { level: 1, name: "Default Dance", desc: "Sends a loud, distracting sound effect to the opponent." },
      { level: 10, name: "Dialogue Tree", desc: "Replaces opponent's quiz text with gibberish for 2s." },
      { level: 20, name: "Pathing Error", desc: "Reverses the opponent's video by 3 seconds." },
      { level: 30, name: "Despawn", desc: "Makes your own progress invisible for the rest of the match." },
      { level: 40, name: "Aggro", desc: "Forces opponent to click a moving target to unpause video." },
      { level: 50, name: "Hivemind", desc: "Swaps your battery energy percentage with the opponent's." }
    ]
  },
  brainiac: {
    id: "brainiac",
    name: "The Brainiac",
    description: "Quiz Dominance. Pure focus on dominating the cognitive test phase.",
    avatarSeed: "Oliver",
    skills: [
      { level: 1, name: "Flashcard", desc: "3-second preview of the first quiz question." },
      { level: 10, name: "Process of Elimination", desc: "Disables 1 wrong answer for the current question." },
      { level: 20, name: "Photographic Memory", desc: "Re-watch 5 seconds of the video during the quiz." },
      { level: 30, name: "Double Down", desc: "Bet energy; if correct, gain 2x points." },
      { level: 40, name: "Einstein's Ghost", desc: "Highlights the correct answer for 0.5 seconds." },
      { level: 50, name: "Omniscience", desc: "Automatically skip and correctly answer the hardest question." }
    ]
  },
  gachaaddict: {
    id: "gachaaddict",
    name: "The GachaAddict",
    description: "RNG & Chaos. High risk, high reward. Relies on randomness.",
    avatarSeed: "Princess",
    skills: [
      { level: 1, name: "Gacha Pull", desc: "50% chance to gain 20% energy, 50% chance to lose 10%." },
      { level: 10, name: "Mystery Box", desc: "Casts a random Lvl 10 skill from any other class." },
      { level: 20, name: "Reroll", desc: "Shuffles your current quiz question for a brand new one." },
      { level: 30, name: "Pity System", desc: "50% point refund if you get a quiz question wrong." },
      { level: 40, name: "5-Star Pull", desc: "10% chance to instantly finish the video, 90% chance to do nothing." },
      { level: 50, name: "Jackpot", desc: "Randomly applies 3 massive debuffs to the opponent at once." }
    ]
  }
};

export const getUnlockedSkills = (classId, level) => {
  const charClass = CHARACTER_CLASSES[classId];
  if (!charClass) return [];
  return charClass.skills.filter(s => level >= s.level);
};
