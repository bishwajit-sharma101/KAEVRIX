import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import * as sound from "../../utils/audio";

// Detailed 32x32 Pixel Art SVG Components
function PlayerKnightSVG({ isHurt }) {
  return (
    <svg width="90" height="90" viewBox="0 0 32 32" style={{ imageRendering: "pixelated", overflow: "visible", filter: isHurt ? "drop-shadow(0 0 15px #c8102e) brightness(1.8)" : "none" }}>
      <defs>
        <filter id="playerGlow">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Cape (glowing crimson/purple, waving) */}
      <g className="pixel-player-cape">
        <path d="M 8,14 Q 3,18 2,26 Q 7,28 11,25 Q 10,19 9,14 Z" fill="#580000" />
        <path d="M 9,14 Q 5,17 4,25 Q 8,27 11,25 Q 11,20 10,14 Z" fill="#c8102e" />
        <path d="M 10,14 Q 7,17 6,23 Q 9,25 11,24 Q 11,20 10,14 Z" fill="#ff4d4d" />
      </g>
      
      {/* Legs & Boots */}
      <g className="pixel-player-legs">
        <rect x="11" y="23" width="3" height="5" fill="#2d3748" />
        <rect x="16" y="23" width="3" height="5" fill="#2d3748" />
        <rect x="10" y="26" width="4" height="2" fill="#1a202c" />
        <rect x="16" y="26" width="4" height="2" fill="#1a202c" />
      </g>

      {/* Torso & Armor */}
      <g className="pixel-player-torso">
        <rect x="10" y="13" width="10" height="11" fill="#4a5568" rx="1" />
        <rect x="11" y="14" width="8" height="9" fill="#718096" />
        {/* Chest Crest */}
        <rect x="14" y="15" width="2" height="6" fill="#c8102e" />
        <rect x="13" y="17" width="4" height="2" fill="#c8102e" />
        {/* Belt */}
        <rect x="10" y="22" width="10" height="1" fill="#111" />
        <rect x="14" y="21" width="2" height="2" fill="#e2e8f0" />
      </g>

      {/* Head & Helmet */}
      <g className="pixel-player-head">
        <rect x="11" y="5" width="8" height="9" fill="#718096" rx="1" />
        <rect x="12" y="6" width="6" height="7" fill="#a0aec0" />
        {/* Visor slit */}
        <rect x="12" y="8" width="6" height="2" fill="#1a202c" />
        {/* Glowing Eyes */}
        <rect x="13" y="8.5" width="1.5" height="1" fill="#00e5ff" style={{ animation: "pulseOpacity 1.5s infinite alternate" }} />
        <rect x="16.5" y="8.5" width="1.5" height="1" fill="#00e5ff" style={{ animation: "pulseOpacity 1.5s infinite alternate" }} />
        {/* Crest Plume */}
        <path d="M 12,5 Q 9,1 14,0 Q 17,1 16,5 Z" fill="#c8102e" />
        <path d="M 13,4 Q 11,2 14,1 Q 16,2 15,4 Z" fill="#ff4d4d" />
      </g>

      {/* Shield (Left arm / Foreground block) */}
      <g className="pixel-player-shield">
        <path d="M 7,14 h 5 v 6 l -2.5,4 l -2.5,-4 z" fill="#1a202c" />
        <path d="M 8,15 h 3 v 4 l -1.5,3 l -1.5,-3 z" fill="#4a5568" />
        <path d="M 9.5,15 v 5" stroke="#c8102e" strokeWidth="1" />
        <rect x="7" y="16" width="1" height="1" fill="#cbd5e0" />
        <rect x="12" y="16" width="1" height="1" fill="#cbd5e0" />
      </g>

      {/* Sword (Right arm, with glowing blade) */}
      <g className="pixel-player-sword" style={{ transformOrigin: "19px 18px" }}>
        {/* Right shoulder & arm */}
        <rect x="19" y="15" width="3" height="3" fill="#4a5568" />
        {/* Guard */}
        <rect x="21" y="11" width="2" height="8" fill="#a0aec0" transform="rotate(-20 22 15)" />
        {/* Hilt */}
        <rect x="20" y="14" width="2" height="2" fill="#1a202c" />
        {/* Blade (glowing) */}
        <rect x="23" y="13" width="11" height="3" fill="#e2e8f0" transform="rotate(-20 22 15)" />
        <rect x="23" y="14" width="11" height="1" fill="#ffffff" transform="rotate(-20 22 15)" />
        {/* Aura energy glow around blade */}
        <rect x="23" y="12" width="12" height="5" fill="rgba(0, 229, 255, 0.45)" filter="url(#playerGlow)" transform="rotate(-20 22 15)" className="pixel-player-sword-glow" />
      </g>
    </svg>
  );
}

function PixelCallbackDemonSVG({ isHurt }) {
  return (
    <svg width="100" height="100" viewBox="0 0 32 32" style={{ imageRendering: "pixelated", overflow: "visible", filter: isHurt ? "drop-shadow(0 0 25px #c8102e) brightness(1.8)" : "drop-shadow(0 0 15px rgba(168,85,247,0.4))" }}>
      <defs>
        <filter id="demonGlow">
          <feGaussianBlur stdDeviation="1" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Flapping Wings */}
      <g className="pixel-boss-wings">
        <path d="M 12,12 Q 2,2 1,14 Q 5,16 11,15 Z" fill="#2d004d" />
        <path d="M 11,13 Q 4,5 3,13 Q 6,15 10,14 Z" fill="#ff007f" opacity="0.8" />
        <path d="M 20,12 Q 30,2 31,14 Q 27,16 21,15 Z" fill="#2d004d" />
        <path d="M 21,13 Q 28,5 29,13 Q 26,15 22,14 Z" fill="#ff007f" opacity="0.8" />
      </g>

      {/* Legs & Tail */}
      <g>
        <path d="M 16,22 Q 13,29 9,29 Q 12,31 16,27 Q 20,31 23,29 Q 19,29 16,22 Z" fill="#1a0033" />
        <rect x="11" y="27" width="2" height="2" fill="#ff007f" />
        <rect x="19" y="27" width="2" height="2" fill="#ff007f" />
      </g>

      {/* Torso */}
      <g>
        <rect x="11" y="12" width="10" height="11" fill="#1a0033" rx="1" />
        <rect x="12" y="13" width="8" height="9" fill="#2d004d" />
        <polygon points="16,14 18,17 16,20 14,17" fill="#ff007f" style={{ animation: "pulseOpacity 1.5s infinite alternate" }} />
      </g>

      {/* Horned Head */}
      <g>
        <rect x="12" y="5" width="8" height="8" fill="#1a0033" rx="1" />
        <rect x="13" y="8" width="1.5" height="1" fill="#ff007f" />
        <rect x="17.5" y="8" width="1.5" height="1" fill="#ff007f" />
        <path d="M 12,5 Q 9,0 8,3 L 11,6 Z" fill="#ff007f" />
        <path d="M 20,5 Q 23,0 24,3 L 21,6 Z" fill="#ff007f" />
      </g>

      {/* Trident Weapon */}
      <g className="pixel-boss-weapon" style={{ transformOrigin: "12px 17px" }}>
        <line x1="8" y1="26" x2="15" y2="10" stroke="#111827" strokeWidth="1.5" />
        <path d="M 13,12 L 18,5 L 14,11 L 16,9 Z" fill="#ff007f" filter="url(#demonGlow)" />
        <path d="M 14,11 L 11,7 L 13,12 Z" fill="#ff007f" filter="url(#demonGlow)" />
        <path d="M 13,12 L 15,10" stroke="#ffffff" strokeWidth="1" />
      </g>
    </svg>
  );
}

function PixelScopeWardenSVG({ isHurt }) {
  return (
    <svg width="100" height="100" viewBox="0 0 32 32" style={{ imageRendering: "pixelated", overflow: "visible", filter: isHurt ? "drop-shadow(0 0 25px #c8102e) brightness(1.8)" : "drop-shadow(0 0 15px rgba(56,189,248,0.4))" }}>
      <defs>
        <filter id="wardenGlow">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Floating Shards (Lexical scopes orbiting) */}
      <g className="pixel-boss-shards">
        <rect x="4" y="6" width="2" height="2" fill="#38bdf8" filter="url(#wardenGlow)" style={{ animation: "pixelIdle 2s infinite alternate" }} />
        <rect x="26" y="8" width="2" height="2" fill="#38bdf8" filter="url(#wardenGlow)" style={{ animation: "pixelIdle 2.5s infinite alternate-reverse" }} />
        <rect x="6" y="22" width="2" height="2" fill="#38bdf8" filter="url(#wardenGlow)" style={{ animation: "pixelIdle 1.8s infinite alternate" }} />
      </g>

      {/* Robes */}
      <g>
        <path d="M 11,14 L 21,14 L 25,28 L 7,28 Z" fill="#0f172a" />
        <path d="M 13,14 L 19,14 L 22,28 L 10,28 Z" fill="#1e293b" />
        <path d="M 15,14 L 17,14 L 18,28 L 14,28 Z" fill="#38bdf8" opacity="0.6" />
      </g>

      {/* Pauldrons (Silver/Ice) */}
      <g>
        <rect x="9" y="13" width="4" height="3" fill="#cbd5e1" rx="1" />
        <rect x="19" y="13" width="4" height="3" fill="#cbd5e1" rx="1" />
      </g>

      {/* Hooded Head */}
      <g>
        <rect x="12" y="5" width="8" height="9" fill="#0f172a" rx="1" />
        <rect x="13" y="6" width="6" height="7" fill="#020617" />
        <rect x="14" y="8.5" width="1" height="1" fill="#38bdf8" filter="url(#wardenGlow)" />
        <rect x="17" y="8.5" width="1" height="1" fill="#38bdf8" filter="url(#wardenGlow)" />
      </g>

      {/* Lexical Crystal Staff */}
      <g className="pixel-boss-weapon" style={{ transformOrigin: "23px 20px" }}>
        <rect x="22" y="6" width="2" height="23" fill="#64748b" />
        <circle cx="23" cy="4" r="2.5" fill="#38bdf8" filter="url(#wardenGlow)" />
        <circle cx="23" cy="4" r="1" fill="#ffffff" />
        <path d="M 20,4 C 20,2 26,2 26,4 C 26,6 20,6 20,4 Z" fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="1 1" />
      </g>
    </svg>
  );
}

function PixelDOMDestroyerSVG({ isHurt }) {
  return (
    <svg width="100" height="100" viewBox="0 0 32 32" style={{ imageRendering: "pixelated", overflow: "visible", filter: isHurt ? "drop-shadow(0 0 25px #c8102e) brightness(1.8)" : "drop-shadow(0 0 15px rgba(34,197,94,0.4))" }}>
      <defs>
        <filter id="domGlow">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Segmented Spider-Like Legs */}
      <g className="pixel-boss-legs">
        <path d="M 10,16 L 3,18 L 1,28" stroke="#14532d" strokeWidth="1.5" fill="none" />
        <path d="M 10,19 L 4,22 L 3,29" stroke="#14532d" strokeWidth="1.5" fill="none" />
        <path d="M 22,16 L 29,18 L 31,28" stroke="#14532d" strokeWidth="1.5" fill="none" />
        <path d="M 22,19 L 28,22 L 29,29" stroke="#14532d" strokeWidth="1.5" fill="none" />
      </g>

      {/* Glitchy Matrix Torso */}
      <g>
        <rect x="9" y="11" width="14" height="11" fill="#022c22" rx="1" />
        <rect x="10" y="12" width="12" height="9" fill="#064e3b" />
        <rect x="13" y="14" width="2" height="2" fill="#10b981" style={{ animation: "pulseOpacity 0.8s infinite alternate" }} />
        <rect x="17" y="16" width="2" height="2" fill="#06b6d4" style={{ animation: "pulseOpacity 1.2s infinite alternate" }} />
        <rect x="15" y="13" width="1.5" height="1.5" fill="#10b981" />
      </g>

      {/* Mechanical Glitch Head */}
      <g>
        <rect x="12" y="4" width="8" height="7" fill="#022c22" rx="1" />
        <rect x="13" y="5" width="6" height="5" fill="#10b981" />
        <rect x="14" y="6" width="1" height="1" fill="#ffffff" />
        <rect x="17" y="6" width="1" height="1" fill="#ffffff" />
        <rect x="15.5" y="8" width="1" height="1" fill="#06b6d4" />
      </g>

      {/* Energy Slicers */}
      <g className="pixel-boss-weapon" style={{ transformOrigin: "12px 18px" }}>
        <path d="M 7,16 L 1,12" stroke="#10b981" strokeWidth="2" filter="url(#domGlow)" />
        <path d="M 25,16 L 31,12" stroke="#10b981" strokeWidth="2" filter="url(#domGlow)" />
      </g>
    </svg>
  );
}

function PixelSyntaxSentinelSVG({ isHurt }) {
  return (
    <svg width="100" height="100" viewBox="0 0 32 32" style={{ imageRendering: "pixelated", overflow: "visible", filter: isHurt ? "drop-shadow(0 0 25px #c8102e) brightness(1.8)" : "drop-shadow(0 0 15px rgba(234,88,12,0.4))" }}>
      <defs>
        <filter id="sentinelGlow">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer Rotating Gears */}
      <g className="pixel-boss-gears" style={{ transformOrigin: "16px 16px" }}>
        <circle cx="16" cy="16" r="13" fill="none" stroke="#7c2d12" strokeWidth="1" strokeDasharray="3 5" />
        <circle cx="16" cy="16" r="15" fill="none" stroke="#ea580c" strokeWidth="0.5" strokeDasharray="6 8" />
      </g>

      {/* Floating Rune Shards */}
      <g>
        <rect x="15" y="1" width="2" height="2" fill="#ea580c" filter="url(#sentinelGlow)" style={{ animation: "pixelIdle 1.5s infinite alternate" }} />
        <rect x="15" y="29" width="2" height="2" fill="#ea580c" filter="url(#sentinelGlow)" style={{ animation: "pixelIdle 1.5s infinite alternate-reverse" }} />
      </g>

      {/* Main Runic Core Orb */}
      <g>
        <circle cx="16" cy="16" r="8" fill="#431407" />
        <circle cx="16" cy="16" r="7" fill="#9a3412" />
        <circle cx="16" cy="16" r="5" fill="#ea580c" />
        <rect x="14" y="14" width="4" height="1" fill="#ff6a00" />
        <rect x="15" y="17" width="2" height="1" fill="#ff6a00" />
      </g>

      {/* Central Laser Eye */}
      <g>
        <circle cx="16" cy="16" r="2.5" fill="#ffffff" filter="url(#sentinelGlow)" />
        <circle cx="16" cy="16" r="1" fill="#00e5ff" />
      </g>
    </svg>
  );
}

function PixelGarbageCollectorSVG({ isHurt }) {
  return (
    <svg width="100" height="100" viewBox="0 0 32 32" style={{ imageRendering: "pixelated", overflow: "visible", filter: isHurt ? "drop-shadow(0 0 25px #c8102e) brightness(1.8)" : "drop-shadow(0 0 15px rgba(239,68,68,0.4))" }}>
      <defs>
        <filter id="garbageGlow">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Exhaust Pipes & Smoke */}
      <g className="pixel-boss-vents">
        <rect x="8" y="6" width="2" height="4" fill="#27272a" />
        <circle cx="7" cy="4" r="1.5" fill="#71717a" opacity="0.6" style={{ animation: "pixelIdle 1.2s infinite alternate" }} />
        <rect x="22" y="6" width="2" height="4" fill="#27272a" />
        <circle cx="25" cy="3" r="2" fill="#71717a" opacity="0.6" style={{ animation: "pixelIdle 1.4s infinite alternate-reverse" }} />
      </g>

      {/* Legs & Platform */}
      <g>
        <rect x="11" y="24" width="4" height="4" fill="#18181b" />
        <rect x="17" y="24" width="4" height="4" fill="#18181b" />
        <rect x="9" y="27" width="14" height="2" fill="#991b1b" />
      </g>

      {/* Rusted Bulky Torso */}
      <g>
        <rect x="8" y="10" width="16" height="14" fill="#18181b" rx="1" />
        <rect x="9" y="11" width="14" height="12" fill="#27272a" />
        <rect x="10" y="12" width="2" height="2" fill="#7c2d12" />
        <rect x="20" y="18" width="2" height="2" fill="#7c2d12" />
        <rect x="11" y="20" width="3" height="1" fill="#7c2d12" />
        <rect x="14" y="14" width="4" height="4" fill="#7f1d1d" />
        <rect x="15" y="15" width="2" height="2" fill="#ea580c" style={{ animation: "pulseOpacity 1s infinite alternate" }} />
      </g>

      {/* Head */}
      <g>
        <rect x="13" y="6" width="6" height="5" fill="#18181b" />
        <rect x="14" y="8" width="4" height="1" fill="#ef4444" filter="url(#garbageGlow)" />
      </g>

      {/* Massive Trash Hook */}
      <g className="pixel-boss-weapon" style={{ transformOrigin: "9px 15px" }}>
        <rect x="4" y="12" width="2" height="9" fill="#18181b" />
        <path d="M 2,21 Q 2,27 8,27 L 8,24 Q 4,24 4,21 Z" fill="#7c2d12" />
        <rect x="7" y="27" width="1" height="2" fill="#22c55e" style={{ animation: "pulseOpacity 1.5s infinite alternate" }} />
      </g>
    </svg>
  );
}

// Enemy Configuration list containing all 6 boss sprite sheets and their details
const ENEMY_LIST = [
  { folder: "1 Snake", name: "Snake", idleFrames: 4, attackFrames: 6, hurtFrames: 2, deathFrames: 4, attackType: "melee" },
  { folder: "2 Hyena", name: "Hyena", idleFrames: 4, attackFrames: 6, hurtFrames: 2, deathFrames: 6, attackType: "melee" },
  { folder: "3 Scorpio", name: "Scorpio", idleFrames: 4, attackFrames: 4, hurtFrames: 2, deathFrames: 4, attackType: "melee" },
  { folder: "4 Vulture", name: "Vulture", idleFrames: 4, attackFrames: 4, hurtFrames: 2, deathFrames: 4, attackType: "projectile" },
  { folder: "5 Mummy", name: "Mummy", idleFrames: 4, attackFrames: 6, hurtFrames: 2, deathFrames: 6, attackType: "spell" },
  { folder: "6 Deceased", name: "Deceased", idleFrames: 4, attackFrames: 4, hurtFrames: 2, deathFrames: 6, attackType: "projectile" },
];

// Knight sprite animator — cycles individual frame PNGs
function KnightSprite({ action, isHurt, playerHP }) {
  // action: 'idle' | 'attack' | 'hurt'
  const [frame, setFrame] = useState(1);
  const frameRef = useRef(null);
  
  const isDead = playerHP <= 0;
  // If hurt but alive, play normal idle frames to avoid awkward mid-air floating frames of Dead sheet,
  // letting CSS recoil animations handle visual feedback. If dead, run full Dead falling sheet.
  const prefix = action === "attack" ? "Attack" : action === "jumpAttack" ? "JumpAttack" : (action === "hurt" && isDead) ? "Dead" : "Idle";
  const totalFrames = 10;
  const fps = (action === "attack" || action === "jumpAttack") ? 14 : (action === "hurt" && isDead) ? 8 : 8;

  useEffect(() => {
    setFrame(1);
    frameRef.current = setInterval(() => {
      setFrame(f => {
        if (action !== "idle" && (action === "attack" || action === "jumpAttack" || isDead) && f >= totalFrames) return totalFrames; // hold last frame
        return f >= totalFrames ? 1 : f + 1;
      });
    }, 1000 / fps);
    return () => clearInterval(frameRef.current);
  }, [action, fps, totalFrames, isDead]);

  const filterStyle = isHurt
    ? "drop-shadow(0 0 20px #c8102e) drop-shadow(0 0 40px #ff0000) brightness(1.8)"
    : "drop-shadow(0 0 6px rgba(0,229,255,0.3))";

  return (
    <img
      src={`/knight/png/${prefix} (${frame}).png`}
      alt="Knight"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        imageRendering: "auto",
        filter: filterStyle,
      }}
    />
  );
}

// Enemy sprite sheet animator — steps through sprite sheet using background-position
function EnemySprite({ enemyConfig, action, isHurt }) {
  const [frame, setFrame] = useState(0);
  const frameRef = useRef(null);
  const config = enemyConfig || ENEMY_LIST[0];

  let sheetSuffix = "_idle";
  let totalFrames = config.idleFrames;
  if (action === "attack") { sheetSuffix = "_attack"; totalFrames = config.attackFrames; }
  else if (action === "hurt") { sheetSuffix = "_hurt"; totalFrames = config.hurtFrames; }
  else if (action === "death") { sheetSuffix = "_death"; totalFrames = config.deathFrames; }

  const fps = action === "attack" ? 12 : action === "hurt" ? 8 : (action === "death" ? 8 : 6);

  useEffect(() => {
    setFrame(0);
    frameRef.current = setInterval(() => {
      setFrame(f => {
        if (action !== "idle" && f >= totalFrames - 1) return totalFrames - 1; // hold last
        return f >= totalFrames - 1 ? 0 : f + 1;
      });
    }, 1000 / fps);
    return () => clearInterval(frameRef.current);
  }, [action, fps, totalFrames]);

  const sheetUrl = `/enemies/${config.folder}/${config.name}${sheetSuffix}.png`;
  const bgWidth = totalFrames * 100;
  const xPos = totalFrames <= 1 ? 0 : (frame / (totalFrames - 1)) * 100;

  const filterStyle = isHurt
    ? "drop-shadow(0 0 25px #c8102e) brightness(1.8)"
    : "drop-shadow(0 0 10px rgba(168,85,247,0.4))";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundImage: `url("${sheetUrl}")`,
        backgroundPosition: `${xPos}% 0%`,
        backgroundSize: `${bgWidth}% 100%`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        filter: filterStyle,
      }}
    />
  );
}

const getEnemyIndexForMilestone = (milestone) => {
  if (!milestone) return 0;
  const str = milestone.title || milestone.id || "";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % ENEMY_LIST.length;
};

// Helper to define RPG Script dialogues for Elden Ring / Dark Souls storytelling
const getDialogueScript = (enemyName, topic) => {
  const scripts = {
    "Snake": {
      greeting: `Sssss... Another mortal dares step into the code garden of ${topic}? I am the Python of these domains. My venom will corrupt your syntax!`,
      responses1: [
        "Your fangs don't scare me. I will run a clean parse!",
        "A snake? I'll just write a script to sweep you away.",
        "I seek to pass this milestone. Stand aside!"
      ],
      reactions1: [
        `Parse? *hisses* You will syntax error before you can even indent!`,
        `Sweep me? *hisses* My venom runs deeper than your library paths!`,
        `Pass? *cackles* No one passes my bite! Prepare to be poisoned!`
      ],
      responses2: [
        "[Draw weapon] Enough talk. Let's see your bite!",
        "[Brace yourself] My shields will block your venom."
      ],
      finalThreat: `*hisses* FEEL MY SYNTAX VENOM! DIE!`
    },
    "Hyena": {
      greeting: `Aha-ha-ha! Look at this juicy allocation! A fresh programmer to scavenge in the garbage heap of ${topic}! *cackles hysterically*`,
      responses1: [
        "I am not garbage to be collected. Draw your claws!",
        "Go back to the wild. I compile in clean runtimes.",
        "Just let me pass this milestone."
      ],
      reactions1: [
        `Claws? *guffaws* I scavenge the heap! I will strip your memory allocation to zero!`,
        `Clean runtimes? *cackles* There is nothing clean about what I'll do to your code block!`,
        `Pass? *wheezes* The only way out is through the garbage collector!`
      ],
      responses2: [
        "[Draw weapon] Enough talk. Draw your blade!",
        "[Brace yourself] I will compile whatever errors you throw."
      ],
      finalThreat: `HEAP OVERFLOW! SCAVENGE THE REMAINS! *howls*`
    },
    "Scorpio": {
      greeting: `CLANK-CLANK! Intruder detected in the nesting grounds of ${topic}! My sting contains a lethal layout thrashing payload!`,
      responses1: [
        "I will force-render my way past you. Draw your stinger!",
        "Your claws look like unclosed tags. Let me close them.",
        "Please let me pass the milestone."
      ],
      reactions1: [
        `Stinger? *snaps* One strike and your render tree is detached forever!`,
        `Unclosed tags? *hisses* I will truncate your soul from the DOM tree!`,
        `Pass? *clanks* Access is denied. Initiate layout thrashing!`
      ],
      responses2: [
        "[Draw weapon] Enough talk. Draw your blade!",
        "[Brace yourself] My shields will absorb the layout flash."
      ],
      finalThreat: `STING OF THE DETACHED DOM! DIE!`
    },
    "Vulture": {
      greeting: `*screeches* A lost coder wandering the barren wastes of ${topic}! I will pick your bones clean of variables and scopes!`,
      responses1: [
        "My variables are globally protected. Try and take them!",
        "I'll shoot you down from the sky with custom events.",
        "Just let me pass this milestone."
      ],
      reactions1: [
        `Globally protected? *screeches* I will garbage collect your global window!`,
        `Shoot me down? *flaps* I fly above your compiler! You cannot reach me!`,
        `Pass? *caws* The desert takes all who fail! Prepare to be cleaned!`
      ],
      responses2: [
        "[Draw weapon] Enough talk. Draw your blade!",
        "[Brace yourself] I will compile whatever errors you throw."
      ],
      finalThreat: `*screeches* WIND BLADES OF REFRACTORING! DIE!`
    },
    "Mummy": {
      greeting: `WHO GURGLES IN MY ANCIENT TOMB OF ${topic}? I have been asleep since ES1. Your modern frameworks cannot save you from my sand traps!`,
      responses1: [
        "Your ancient code is legacy. I run modern runtimes!",
        "I'll wrap you in your own callback bandages.",
        "Just let me pass this milestone."
      ],
      reactions1: [
        `Legacy? *groans* My legacy rules the core stack! You are but a temporary branch!`,
        `Bandages? *hisses* My callbacks will wrap your main thread in an infinite loop!`,
        `Pass? *rumbles* None escape the lexical tomb!`
      ],
      responses2: [
        "[Draw weapon] Enough talk. Draw your blade!",
        "[Brace yourself] I will compile whatever errors you throw."
      ],
      finalThreat: `SAND STORM OF CALLBACK HELL! DIE!`
    },
    "Deceased": {
      greeting: `I am the ghost of compiled projects past. You think you can master ${topic}? You will join the graveyard of unfinished code!`,
      responses1: [
        "My project is live and robust. You cannot defeat me!",
        "I'll exorcise you with a clean refactor.",
        "I only seek to master this milestone."
      ],
      reactions1: [
        `Live? *wails* Every project dies at the first deprecation warning!`,
        `Refactor? *laughs hollowly* You cannot refactor what is already dead!`,
        `Master? *screeches* Death is the only mastery here!`
      ],
      responses2: [
        "[Draw weapon] Enough talk. Draw your blade!",
        "[Brace yourself] I will compile whatever errors you throw."
      ],
      finalThreat: `DARK FIRE OF THE DEPRECATED STACK! DIE!`
    }
  };

  return scripts[enemyName] || scripts["Snake"];
};

export default function BossBattleModal({ topic, milestone, username, onClose, onVictory }) {
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState("summoning"); // summoning, intro, battle, victory, defeat
  const [bossData, setBossData] = useState(null);
  
  const [bossHP, setBossHP] = useState(100);
  const [playerHP, setPlayerHP] = useState(3);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState(null);
  const [isAnswering, setIsAnswering] = useState(false);
  
  const [bossHurt, setBossHurt] = useState(false);
  const [playerHurt, setPlayerHurt] = useState(false);
  const [floatingDamage, setFloatingDamage] = useState(null);
  const [timer, setTimer] = useState(15);
  
  // Dialogue state variables (Story quest)
  const [dialogueStep, setDialogueStep] = useState(0);
  const [displayedBossText, setDisplayedBossText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chosenResponse, setChosenResponse] = useState(0);

  // Combat animation state: 'idle' | 'player-strike' | 'boss-strike'
  const [combatAnim, setCombatAnim] = useState("idle");
  const [screenFlash, setScreenFlash] = useState(null); // null, 'white', 'red'
  const [playerAttackStyle, setPlayerAttackStyle] = useState("lunge"); // 'lunge' | 'jump'

  const bossEnemyIndex = getEnemyIndexForMilestone(milestone);
  const currentEnemyConfig = ENEMY_LIST[bossEnemyIndex];

  // loading screen logs
  const [summonLogs, setSummonLogs] = useState([]);
  const [loadingPct, setLoadingPct] = useState(0);

  const timerInterval = useRef(null);
  const typingTimer = useRef(null);
  const voiceAudioCtx = useRef(null);

  // Generate embers layout statically to avoid reflicking layouts
  const embers = useRef(
    Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 2 + Math.random() * 4,
      color: Math.random() > 0.5 ? "#d4af37" : "#ef4444"
    }))
  ).current;

  // Synthesize voice blips with rapid formant variation ("tina mita" gibberish speech)
  const playSpeechSound = (char, bossType) => {
    try {
      if (!voiceAudioCtx.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        voiceAudioCtx.current = new AudioContextClass();
      }
      const ctx = voiceAudioCtx.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      let baseFreq = 120;
      let type = "triangle";
      let duration = 0.05;
      let filterFreq = 1000;
      
      if (bossType === "Deceased") {
        baseFreq = 80;
        type = "sawtooth";
        filterFreq = 500;
      } else if (bossType === "Mummy") {
        baseFreq = 180;
        type = "sine";
        filterFreq = 1500;
      } else if (bossType === "Scorpio") {
        baseFreq = 130;
        type = "square";
        filterFreq = 950;
      } else if (bossType === "Snake") {
        baseFreq = 200;
        type = "triangle";
        filterFreq = 1800;
      } else if (bossType === "Hyena") {
        baseFreq = 95;
        type = "sawtooth";
        filterFreq = 750;
      } else if (bossType === "Vulture") {
        baseFreq = 160;
        type = "sine";
        filterFreq = 1200;
      }
      
      const code = char.charCodeAt(0) || 65;
      // Synthesize consonant-vowel transitions by modifying frequency and filter envelope
      const freq = baseFreq + (code % 8) * 11;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      // Cadence pitch shifting to simulate speaking words
      if (code % 3 === 0) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.15, ctx.currentTime + duration * 0.4);
      } else {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.85, ctx.currentTime + duration * 0.4);
      }
      
      filter.type = "peaking";
      filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
      filter.Q.setValueAtTime(4, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.01);
    } catch (e) {}
  };

  // Tickers typing text word-by-word/char-by-char with speaking sound effects
  const typeText = (text, onFinish, speed = 28) => {
    setIsTyping(true);
    setDisplayedBossText("");
    let i = 0;
    if (typingTimer.current) clearInterval(typingTimer.current);

    typingTimer.current = setInterval(() => {
      if (i < text.length) {
        const char = text[i];
        setDisplayedBossText((prev) => prev + char);
        if (char !== " " && i % 2 === 0) {
          playSpeechSound(char, currentEnemyConfig.name);
        }
        i++;
      } else {
        clearInterval(typingTimer.current);
        setIsTyping(false);
        if (onFinish) onFinish();
      }
    }, speed);
  };

  // 1. Fetch boss questions
  useEffect(() => {
    let active = true;
    const fetchBossData = async () => {
      try {
        const BACKEND_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:5000" : "";
        const res = await fetch(`${BACKEND_URL}/api/boss/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, milestone })
        });
        if (!res.ok) throw new Error("Failed to generate boss questions");
        const data = await res.json();
        
        if (active) {
          setBossData(data);
          setLoading(false);
          setStage("intro");
          setDialogueStep(0);
          sound.playGlitch();
        }
      } catch (err) {
        console.error("Error loading boss:", err);
        if (active) {
          const fallback = {
            bossType: "Syntax Sentinel",
            bossIntro: "Foolish compiler! You think your code compiles here?",
            questions: [
              {
                question: "What is the result of missing a closing brace in a CSS style block?",
                options: [
                  "The browser crashes instantly",
                  "Vite builds it without issues",
                  "The rest of the code is treated as plain text css",
                  "The page becomes red automatically"
                ],
                answerIndex: 2,
                damageExplanation: "An unclosed brace prevents stylesheet parsing, causing later elements to render as plain CSS strings."
              },
              {
                question: "In React, what happens when hooks are executed conditionally or after early returns?",
                options: [
                  "React skips rendering those components",
                  "The hook order changes between renders, causing runtime errors",
                  "Performance is boosted by 50%",
                  "The component re-mounts on every state change"
                ],
                answerIndex: 1,
                damageExplanation: "React relies on the order of Hook calls to associate states. Changing order throws Hook order violation crashes."
              },
              {
                question: "Which CSS property moves animations to hardware-accelerated GPU layers to prevent thumping layout repaints?",
                options: ["display: block", "position: absolute", "transform: translate3d", "margin: auto"],
                answerIndex: 2,
                damageExplanation: "translate3d forces GPU rendering, creating a separate compositor layer and preventing layout thumping."
              },
              {
                question: "What is the primary function of Mongoose strict schema enforcement?",
                options: [
                  "To throw database validation exceptions on unmapped fields",
                  "To ignore fields not present in the model schema definition",
                  "To encrypt passwords using bcrypt automatically",
                  "To prevent socket connections from non-authenticated clients"
                ],
                answerIndex: 1,
                damageExplanation: "Strict schemas silently drop fields on document save if they aren't declared in the Mongoose schema definition."
              },
              {
                question: "Why should we avoid inline Math.random() variables in React JSX component render loops?",
                options: [
                  "It causes syntax compiling warnings",
                  "It regenerates values on every tick render, causing visual jumpiness/flickering",
                  "It locks the CPU threads",
                  "It returns float numbers instead of integers"
                ],
                answerIndex: 1,
                damageExplanation: "Recalculating random numbers on each frame tick renders elements at unstable styles, causing flashing."
              }
            ]
          };
          setBossData(fallback);
          setLoading(false);
          setStage("intro");
          setDialogueStep(0);
          sound.playGlitch();
        }
      }
    };

    fetchBossData();
    return () => { active = false; };
  }, [topic, milestone]);

  // Loading Ticker logs
  useEffect(() => {
    if (loading) {
      const logsList = [
        "✦ COMMUNING WITH THE KNOWLEDGE ARCHITECTURE...",
        "✦ RATIONING SOUL POWER FROM THE MILESTONE CORES...",
        "✦ ALLOCATING GEMMA COMPILER PARSING THREADS...",
        "✦ STABILIZING CONSOLE CONNECTION VECTOR...",
        "✦ DEFENDER CONSTRUCT DEPLOYED SUCCESSFULLY..."
      ];
      
      let logIdx = 0;
      const logInterval = setInterval(() => {
        if (logIdx < logsList.length) {
          setSummonLogs(prev => [...prev, logsList[logIdx]]);
          logIdx++;
        }
      }, 250);
      
      const pctInterval = setInterval(() => {
        setLoadingPct(prev => {
          if (prev >= 100) {
            clearInterval(pctInterval);
            return 100;
          }
          return prev + 5;
        });
      }, 70);
      
      return () => {
        clearInterval(logInterval);
        clearInterval(pctInterval);
      };
    }
  }, [loading]);

  // Dialogue Tree Hook (Triggers typing greeting and plays profile music)
  useEffect(() => {
    if (stage === "intro" && bossData && dialogueStep === 0) {
      const colors = getThemeColors(currentEnemyConfig.name);
      sound.startBackgroundMusic(colors.musicProfile);
      
      const script = getDialogueScript(currentEnemyConfig.name, topic);
      typeText(script.greeting, null, 24);
    }
  }, [stage, bossData, dialogueStep]);

  // Cleanup Music & Timers on Unmount
  useEffect(() => {
    return () => {
      sound.stopBackgroundMusic();
      if (typingTimer.current) clearInterval(typingTimer.current);
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (voiceAudioCtx.current) {
        try {
          voiceAudioCtx.current.close();
        } catch(e) {}
      }
    };
  }, []);

  // 2. Battle Timer
  useEffect(() => {
    if (stage === "battle" && !isAnswering) {
      setTimer(15);
      timerInterval.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerInterval.current);
            handleTimeout();
            return 0;
          }
          if (t <= 4) {
            sound.playCountdownBeep(t - 1);
          } else {
            sound.playClockTick(true);
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval.current);
  }, [stage, currentIdx, isAnswering]);

  const handleTimeout = () => {
    setIsAnswering(true);
    setCombatAnim("boss-strike");
    sound.playClockTick();

    setTimeout(() => {
      setPlayerHurt(true);
      sound.playIncorrect();
      setScreenFlash("red");
      setTimeout(() => setScreenFlash(null), 150);

      setPlayerHP((h) => {
        const next = h - 1;
        if (next <= 0) {
          setTimeout(() => {
            setStage("defeat");
            sound.stopBackgroundMusic();
            sound.playDefeat();
          }, 1000);
        } else {
          typeText("TIME IS UP! Face my wrath!", () => {
            setTimeout(() => {
              setPlayerHurt(false);
              setCombatAnim("idle");
              setIsAnswering(false);
              setSelectedAns(null);
              if (currentIdx < bossData.questions.length - 1) {
                setCurrentIdx((idx) => idx + 1);
              } else {
                setStage("defeat");
                sound.stopBackgroundMusic();
                sound.playDefeat();
              }
            }, 400);
          }, 6);
        }
        return next;
      });
    }, 500);
  };

  const handleAnswerSelect = (optIdx) => {
    if (isAnswering || isTyping) return;
    setIsAnswering(true);
    clearInterval(timerInterval.current);
    setSelectedAns(optIdx);

    const question = bossData.questions[currentIdx];
    const isCorrect = optIdx === question.answerIndex;

    if (isCorrect) {
      const isJump = Math.random() > 0.5;
      setPlayerAttackStyle(isJump ? "jump" : "lunge");
      setCombatAnim("player-strike");
      sound.playClockTick();

      setTimeout(() => {
        setBossHurt(true);
        setFloatingDamage("-25 HP");
        sound.playCorrect();
        setScreenFlash("white");
        setTimeout(() => setScreenFlash(null), 150);

        setBossHP((hp) => {
          const next = hp - 25;
          if (next <= 0) {
            setTimeout(() => {
              setStage("victory");
              sound.stopBackgroundMusic();
              sound.playVictory();
              if (onVictory) onVictory(milestone.xpReward * 2);
            }, 1000);
          } else {
            typeText("Agh! That script... it compiles!", () => {
              setTimeout(() => {
                setBossHurt(false);
                setFloatingDamage(null);
                setCombatAnim("idle");
                setIsAnswering(false);
                setSelectedAns(null);
                if (currentIdx < bossData.questions.length - 1) {
                  setCurrentIdx((idx) => idx + 1);
                } else {
                  setStage("victory");
                  sound.stopBackgroundMusic();
                  sound.playVictory();
                  if (onVictory) onVictory(milestone.xpReward * 2);
                }
              }, 400);
            }, 6);
          }
          return next;
        });
      }, 500);

    } else {
      setCombatAnim("boss-strike");
      sound.playClockTick();

      setTimeout(() => {
        setPlayerHurt(true);
        sound.playIncorrect();
        setScreenFlash("red");
        setTimeout(() => setScreenFlash(null), 150);

        setPlayerHP((h) => {
          const next = h - 1;
          if (next <= 0) {
            setTimeout(() => {
              setStage("defeat");
              sound.stopBackgroundMusic();
              sound.playDefeat();
            }, 1000);
          } else {
            typeText(`INCORRECT! ${question.damageExplanation}`, () => {
              setTimeout(() => {
                setPlayerHurt(false);
                setCombatAnim("idle");
                setIsAnswering(false);
                setSelectedAns(null);
                if (currentIdx < bossData.questions.length - 1) {
                  setCurrentIdx((idx) => idx + 1);
                } else {
                  setStage("defeat");
                  sound.stopBackgroundMusic();
                  sound.playDefeat();
                }
              }, 800);
            }, 6);
          }
          return next;
        });
      }, 500);
    }
  };

  const handleStartBattle = () => {
    sound.playWhoosh();
    setStage("battle");
  };

  const handleRetry = () => {
    sound.playClockTick();
    setBossHP(100);
    setPlayerHP(3);
    setCurrentIdx(0);
    setSelectedAns(null);
    setIsAnswering(false);
    setDialogueStep(0);
    setStage("intro");
  };

  // Dialogue Tree Choices Click Handlers
  const handleChoiceSelect = (choiceIdx) => {
    if (isTyping) return;
    sound.playClockTick();
    
    if (dialogueStep === 0) {
      setChosenResponse(choiceIdx);
      setDialogueStep(1);
      const script = getDialogueScript(currentEnemyConfig.name, topic);
      typeText(script.reactions1[choiceIdx]);
    } else if (dialogueStep === 1) {
      setDialogueStep(2);
      const script = getDialogueScript(currentEnemyConfig.name, topic);
      typeText(script.finalThreat);
    }
  };

  const getThemeColors = (enemyName) => {
    if (enemyName === "Snake") {
      return {
        primary: "#10b981", // green
        secondary: "#00e5ff", // cyan
        glow: "rgba(16,185,129,0.4)",
        gradient: "radial-gradient(circle at 50% 35%, #082015 0%, #020604 100%)",
        musicProfile: 1
      };
    }
    if (enemyName === "Hyena") {
      return {
        primary: "#f97316", // orange
        secondary: "#ef4444", // red
        glow: "rgba(249,115,22,0.4)",
        gradient: "radial-gradient(circle at 50% 35%, #240f04 0%, #060201 100%)",
        musicProfile: 7
      };
    }
    if (enemyName === "Scorpio") {
      return {
        primary: "#8b5cf6", // purple
        secondary: "#10b981", // green
        glow: "rgba(139,92,246,0.4)",
        gradient: "radial-gradient(circle at 50% 35%, #1c0e2b 0%, #050208 100%)",
        musicProfile: 8
      };
    }
    if (enemyName === "Vulture") {
      return {
        primary: "#38bdf8", // light blue
        secondary: "#e2e8f0", // silver
        glow: "rgba(56,189,248,0.4)",
        gradient: "radial-gradient(circle at 50% 35%, #081a24 0%, #02070a 100%)",
        musicProfile: 1
      };
    }
    if (enemyName === "Mummy") {
      return {
        primary: "#eab308", // gold
        secondary: "#f97316", // orange
        glow: "rgba(234,179,8,0.4)",
        gradient: "radial-gradient(circle at 50% 35%, #241c04 0%, #060401 100%)",
        musicProfile: 1
      };
    }
    if (enemyName === "Deceased") {
      return {
        primary: "#ef4444", // dark crimson
        secondary: "#a855f7", // purple
        glow: "rgba(239,68,68,0.4)",
        gradient: "radial-gradient(circle at 50% 35%, #280808 0%, #0a0101 100%)",
        musicProfile: 7
      };
    }
    return {
      primary: "#ff6a00",
      secondary: "#00e5ff",
      glow: "rgba(255,106,0,0.4)",
      gradient: "radial-gradient(circle at 50% 35%, #261004 0%, #060302 100%)",
      musicProfile: 1
    };
  };

  const colors = getThemeColors(currentEnemyConfig.name);

  // Render Hearts for Player Health
  const renderHearts = () => {
    return Array.from({ length: 3 }).map((_, idx) => {
      const active = idx < playerHP;
      return (
        <svg key={idx} width="24" height="24" viewBox="0 0 16 16" style={{ marginRight: "6px", shapeRendering: "crispEdges", imageRendering: "pixelated", filter: active ? "drop-shadow(0 0 6px #ff0055)" : "none", transition: "transform 0.4s" }} className={!active ? "heart-broken" : ""}>
          <path d="M 3 3 L 5 3 L 5 5 L 3 5 Z M 11 3 L 13 3 L 13 5 L 11 5 Z M 5 2 L 11 2 L 11 3 L 5 3 Z M 2 5 L 4 5 L 4 7 L 2 7 Z M 12 5 L 14 5 L 14 7 L 12 7 Z M 1 7 L 3 7 L 3 9 L 1 9 Z M 13 7 L 15 7 L 15 9 L 13 9 Z M 2 9 L 4 9 L 4 11 L 2 11 Z M 12 9 L 14 9 L 14 11 L 12 11 Z M 3 11 L 5 11 L 5 13 L 3 13 Z M 11 11 L 13 11 L 13 13 L 11 13 Z M 5 13 L 11 13 L 11 14 L 5 14 Z" fill={active ? "#ff0055" : "#374151"} />
          <rect x="5" y="4" width="6" height="8" fill={active ? "#cc0044" : "#1f2937"} />
          <rect x="3" y="5" width="10" height="5" fill={active ? "#cc0044" : "#1f2937"} />
          {active && <rect x="5" y="4" width="2" height="2" fill="#ff6699" />}
        </svg>
      );
    });
  };

  const modalContent = (
    <div className={`er-viewport ${playerHurt ? "player-hurt" : ""}`} style={{ background: colors.gradient }}>
      {/* CSS Styling Block */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
        
        .er-viewport::before {
          content: "";
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
          z-index: 1;
        }

        .er-viewport {
          position: fixed; inset: 0; z-index: 99999;
          color: #e0e0e0; font-family: 'Cormorant Garamond', serif;
          overflow-y: auto; overflow-x: hidden;
          display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
          user-select: none; background-color: #030303; padding: 12px 16px;
        }

        .ember-field { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
        .ember { position: absolute; bottom: -15px; border-radius: 50%; opacity: 0; animation: floatEmber linear infinite; }
        @keyframes floatEmber {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: 0.7; }
          70% { opacity: 0.3; }
          100% { transform: translateY(-105vh) translateX(35px) scale(0.4); opacity: 0; }
        }

        @keyframes spinSlow { 100% { transform: rotate(360deg); } }
        @keyframes spinSlowReverse { 100% { transform: rotate(-360deg); } }
        @keyframes bossBreathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.05) translateY(-10px); }
        }
        @keyframes pulseOpacity {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }

        @keyframes bossFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes bossGlitch {
          0%, 100% { transform: translate(0, 0) skewX(0deg); }
          20% { transform: translate(-2px, 1px) skewX(1deg); }
          40% { transform: translate(1px, -1px) skewX(-1deg); }
          60% { transform: translate(-1px, 2px); }
          80% { transform: translate(2px, -2px); }
        }

        .boss-hurt { animation: bossHurtAnim 0.15s linear infinite !important; }
        @keyframes bossHurtAnim {
          0%, 100% { transform: translate(0, 0); filter: brightness(2) contrast(1.5) sepia(1) saturate(10) hue-rotate(340deg); }
          50% { transform: translate(6px, -6px) rotate(4deg); filter: brightness(1.8) invert(0.1); }
        }

        /* (old player-hurt/screenShake/slash-beam removed — see enhanced heavyShake below) */

        .float-dmg {
          position: absolute; font-family: 'Cinzel', serif; font-size: 38px; color: #ef4444; font-weight: 900;
          animation: dmgRise 1.2s ease-out forwards; text-shadow: 0 0 10px #000, 0 0 20px #ef4444; z-index: 101;
        }
        @keyframes dmgRise { 0% { transform: translateY(20px) scale(0.8); opacity: 0; } 20% { opacity: 1; transform: translateY(0) scale(1.1); } 100% { transform: translateY(-70px) scale(0.9); opacity: 0; } }

        .heart-broken { animation: heartExplode 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards; }
        @keyframes heartExplode { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4) rotate(45deg); opacity: 0.6; filter: brightness(2) grayscale(0.8); } 100% { transform: scale(0) rotate(90deg); opacity: 0; } }

        .er-title { font-family: 'Cinzel Decorative', serif; font-size: 52px; letter-spacing: 8px; color: #ffffff; text-shadow: 0 0 20px rgba(255,255,255,0.4); text-transform: uppercase; }
        .er-subtitle-dialogue { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-style: italic; color: #cccccc; line-height: 1.4; text-shadow: 0 2px 8px rgba(0,0,0,0.9); text-align: center; max-width: 700px; margin: 0 auto; }

        .er-divider { display: flex; align-items: center; justify-content: center; margin: 20px 0; color: rgba(212, 175, 55, 0.4); font-size: 14px; width: 100%; }
        .er-divider::before, .er-divider::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(200, 16, 46, 0.5), transparent); margin: 0 20px; }

        /* Premium Dark Souls Option Buttons */
        .er-option-btn-premium {
          position: relative; width: 100%; background: rgba(15, 15, 15, 0.7); backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1); color: #cccccc; font-family: 'Cormorant Garamond', serif;
          font-size: 18px; padding: 10px 16px; text-align: left; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; align-items: center; overflow: hidden; outline: none;
        }
        .er-option-btn-premium::before {
          content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(200, 16, 46, 0.2) 0%, transparent 100%);
          opacity: 0; transition: opacity 0.3s ease;
        }
        .er-option-btn-premium:hover:not(:disabled) {
          color: #ffffff; border-color: rgba(200, 16, 46, 0.6); transform: translateX(4px); box-shadow: -4px 0 15px rgba(200, 16, 46, 0.3);
        }
        .er-option-btn-premium:hover:not(:disabled)::before { opacity: 1; }
        .er-option-premium-border {
          position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #c8102e; transform: scaleY(0); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .er-option-btn-premium:hover:not(:disabled) .er-option-premium-border { transform: scaleY(1); }
        .er-option-numeral { color: #8a0303; font-family: 'Cinzel', serif; font-weight: 700; font-size: 16px; margin-right: 14px; min-width: 30px; position: relative; z-index: 1; letter-spacing: 2px; }
        .er-option-text { position: relative; z-index: 1; line-height: 1.4; }

        .er-option-btn-premium.correct { background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.6); color: #fff; box-shadow: 0 0 40px rgba(16, 185, 129, 0.25); }
        .er-option-btn-premium.correct .er-option-premium-border { background: #10b981; transform: scaleY(1); }
        .er-option-btn-premium.correct .er-option-numeral { color: #10b981; }

        .er-option-btn-premium.wrong { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.6); color: #fff; animation: optionShake 0.5s ease-out; }
        .er-option-btn-premium.wrong .er-option-premium-border { background: #ef4444; transform: scaleY(1); }
        .er-option-btn-premium.wrong .er-option-numeral { color: #ef4444; }
        @keyframes optionShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }

        .er-action-btn { font-family: 'Cinzel', serif; font-size: 16px; letter-spacing: 4px; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.3); background: rgba(10, 10, 10, 0.8); padding: 12px 28px; cursor: pointer; transition: all 0.3s ease; outline: none; text-shadow: 0 0 5px rgba(255,255,255,0.3); }
        .er-action-btn:hover { color: #fff; border-color: #c8102e; background: rgba(200, 16, 46, 0.2); box-shadow: 0 0 20px rgba(200, 16, 46, 0.4); transform: translateY(-2px); }

        .er-pedestal { width: 300px; height: 12px; background: radial-gradient(ellipse, rgba(255,255,255,0.25) 0%, transparent 80%); border-radius: 50%; margin: -10px auto 0; pointer-events: none; }

        .er-boss-hp-wrapper { width: 100%; max-width: 650px; margin: 10px auto; text-align: center; }
        .er-boss-hp-label { font-family: 'Cinzel', serif; font-size: 16px; letter-spacing: 4px; color: #dfd5be; margin-bottom: 6px; text-shadow: 0 2px 5px #000; font-weight: bold; }
        .er-boss-hp-track { height: 4px; background: rgba(0, 0, 0, 0.85); border-left: 2px solid #8a0303; border-right: 2px solid #8a0303; position: relative; box-shadow: 0 0 10px rgba(138,3,3,0.4); }
        .er-boss-hp-fill { height: 100%; background: #800000; box-shadow: 0 0 12px #ff0000; transition: width 0.3s cubic-bezier(0.19, 1, 0.22, 1); }

        .victory-text-glow { font-family: 'Cinzel Decorative', serif; font-size: 72px; letter-spacing: 8px; color: #ffffff; text-shadow: 0 0 40px rgba(255, 255, 255, 0.8); animation: textFadeScale 3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes textFadeScale { 0% { transform: scale(0.9) translateY(15px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }

        .defeat-screen { animation: screenFadeRed 1s ease-in forwards; }
        @keyframes screenFadeRed { 0% { background: transparent; } 100% { background: rgba(15, 2, 4, 0.98); } }
        .defeat-text-glow { font-family: 'Cinzel', serif; font-size: 80px; font-weight: 700; letter-spacing: 15px; color: #c80000; text-shadow: 0 0 40px rgba(200, 0, 0, 0.8); animation: deathStretch 5s cubic-bezier(0.1, 0.8, 0.2, 1) forwards; }
        @keyframes deathStretch { 0% { transform: scaleX(0.8) scaleY(1); opacity: 0; letter-spacing: 4px; } 20% { opacity: 1; } 100% { transform: scaleX(1.05) scaleY(1); opacity: 1; letter-spacing: 15px; } }

        /* === Pixel Combat Arena === */

        /* Secondary animations inside SVGs */
        .pixel-player-cape {
          animation: capeWave 1.8s ease-in-out infinite alternate;
          transform-origin: 10px 14px;
        }
        @keyframes capeWave {
          0% { transform: skewY(-2deg) scaleX(1); }
          100% { transform: skewY(3deg) scaleX(0.95); }
        }
        .pixel-boss-wings {
          animation: wingFlap 1.4s ease-in-out infinite;
          transform-origin: 16px 14px;
        }
        @keyframes wingFlap {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.7) skewX(2deg); }
        }
        .pixel-boss-gears {
          animation: gearSpin 14s linear infinite;
          transform-origin: 16px 16px;
        }
        @keyframes gearSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .pixel-boss-shards {
          animation: shardsFloat 3s ease-in-out infinite alternate;
        }
        @keyframes shardsFloat { 0% { transform: translateY(0); } 100% { transform: translateY(-4px); } }
        .pixel-boss-vents {
          animation: ventsBreathe 2s ease-in-out infinite alternate;
          transform-origin: 16px 12px;
        }
        @keyframes ventsBreathe { 0% { transform: scaleY(1); } 100% { transform: scaleY(1.05); } }

        /* ========= COMBAT ARENA LAYOUT ========= */
        .pixel-arena {
          position: relative;
          width: 100%;
          max-width: 600px;
          height: 220px;
          margin: 8px auto;
          image-rendering: pixelated;
          background: transparent;
          border: none;
          box-shadow: none;
          overflow: visible;
        }

        /* Ground line */
        .pixel-ground {
          position: absolute;
          bottom: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent 5%, rgba(200, 16, 46, 0.5) 50%, transparent 95%);
          z-index: 1;
          box-shadow: 0 0 12px rgba(200,16,46,0.3), 0 2px 20px rgba(200,16,46,0.15);
        }

        /* Ground shadow puddle under characters */
        .pixel-char-shadow {
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 8px;
          background: radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%);
          border-radius: 50%;
          z-index: 0;
        }

        .pixel-char-img {
          width: 100%;
          height: 100%;
          max-width: 130px;
          max-height: 140px;
          object-fit: contain;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        }

        /* ========= CHARACTER WRAPPERS ========= */
        .pixel-fighter {
          position: absolute;
          bottom: 6px;
          left: 10%;
          width: 120px;
          height: 130px;
          z-index: 5;
        }
        .pixel-boss-fighter {
          position: absolute;
          bottom: 6px;
          right: 10%;
          width: 130px;
          height: 140px;
          z-index: 5;
        }

        /* ========= IDLE: Multi-frame breathing ========= */
        .pixel-fighter.fighting-loop {
          animation: playerIdle 2.4s ease-in-out infinite;
        }
        @keyframes playerIdle {
          0%   { transform: translateY(0px) scaleY(1) scaleX(1); }
          15%  { transform: translateY(-4px) scaleY(1.02) scaleX(0.98); }
          30%  { transform: translateY(-7px) scaleY(1.01) scaleX(1); }
          50%  { transform: translateY(-4px) scaleY(0.98) scaleX(1.01); }
          70%  { transform: translateY(-1px) scaleY(1) scaleX(1); }
          85%  { transform: translateY(1px) scaleY(0.99) scaleX(1.01); }
          100% { transform: translateY(0px) scaleY(1) scaleX(1); }
        }

        .pixel-boss-fighter.fighting-loop {
          animation: bossIdle 2.8s ease-in-out infinite;
        }
        @keyframes bossIdle {
          0%   { transform: translateY(0px) scaleY(1) rotate(0deg); }
          20%  { transform: translateY(-5px) scaleY(1.02) rotate(-0.5deg); }
          40%  { transform: translateY(-8px) scaleY(1.01) rotate(0.3deg); }
          60%  { transform: translateY(-4px) scaleY(0.98) rotate(-0.2deg); }
          80%  { transform: translateY(-1px) scaleY(1) rotate(0.1deg); }
          100% { transform: translateY(0px) scaleY(1) rotate(0deg); }
        }

        /* ========= PLAYER STRIKE: Lunge forward attack ========= */
        .pixel-fighter.striking-lunge {
          animation: playerLunge 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          z-index: 10;
        }
        @keyframes playerLunge {
          0%   { transform: translateX(0) translateY(0) scaleX(1) rotate(0deg); }
          12%  { transform: translateX(-20px) translateY(3px) scaleX(0.9) rotate(-8deg); }
          25%  { transform: translateX(180px) translateY(-10px) scaleX(1.1) rotate(5deg); }
          40%  { transform: translateX(285px) translateY(0) scaleX(1.15) rotate(10deg); }
          60%  { transform: translateX(275px) translateY(0) scaleX(1.05) rotate(5deg); }
          85%  { transform: translateX(20px) translateY(0) scaleX(1) rotate(1deg); }
          100% { transform: translateX(0) translateY(0) scaleX(1) rotate(0deg); }
        }

        /* ========= PLAYER JUMP STRIKE ========= */
        .pixel-fighter.striking-jump {
          animation: playerJumpStrike 1.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          z-index: 10;
        }
        @keyframes playerJumpStrike {
          0%   { transform: translateX(0) translateY(0) scaleX(1) rotate(0deg); }
          15%  { transform: translateX(-15px) translateY(10px) scaleX(0.9) scaleY(0.8) rotate(-10deg); }
          35%  { transform: translateX(120px) translateY(-90px) scaleX(1.1) scaleY(1.1) rotate(-20deg); }
          50%  { transform: translateX(240px) translateY(-80px) scaleX(1.1) scaleY(1.1) rotate(15deg); }
          65%  { transform: translateX(285px) translateY(0px) scaleX(1.2) scaleY(0.9) rotate(35deg); }
          80%  { transform: translateX(265px) translateY(-10px) scaleX(1.0) rotate(10deg); }
          90%  { transform: translateX(80px) translateY(-5px) scaleX(1) rotate(2deg); }
          100% { transform: translateX(0) translateY(0) scaleX(1) rotate(0deg); }
        }

        /* ========= BOSS STRIKE: Charge forward attack (Melee bosses) ========= */
        .pixel-boss-fighter.striking-melee {
          animation: bossAttackMelee 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          z-index: 10;
        }
        @keyframes bossAttackMelee {
          0%   { transform: translateX(0) translateY(0) rotate(0deg); }
          15%  { transform: translateX(20px) translateY(2px) scaleY(1.06) rotate(-3deg); }
          30%  { transform: translateX(-180px) translateY(-10px) scaleY(0.96) rotate(6deg); }
          45%  { transform: translateX(-285px) translateY(-5px) scaleY(0.94) rotate(10deg); }
          65%  { transform: translateX(-265px) translateY(-3px) rotate(6deg); }
          90%  { transform: translateX(-20px) translateY(0) rotate(1deg); }
          100% { transform: translateX(0) translateY(0) rotate(0deg); }
        }

        /* ========= BOSS STRIKE: In-place charge (Projectiles/Spell bosses) ========= */
        .pixel-boss-fighter.striking-projectile,
        .pixel-boss-fighter.striking-spell {
          animation: bossAttackInPlace 1.2s ease-in-out forwards;
          z-index: 10;
        }
        @keyframes bossAttackInPlace {
          0%   { transform: translateX(0) translateY(0) rotate(0deg); }
          15%  { transform: translateX(15px) translateY(5px) rotate(-6deg); }
          35%  { transform: translateX(-15px) translateY(-2px) scale(1.08) rotate(6deg); }
          70%  { transform: translateX(-10px) translateY(0) rotate(3deg); }
          100% { transform: translateX(0) translateY(0) rotate(0deg); }
        }

        /* ========= RECOIL: Getting hit ========= */
        .pixel-fighter.recoiling {
          animation: playerRecoil 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
        }
        @keyframes playerRecoil {
          0%   { transform: translateX(0) translateY(0) rotate(0deg); filter: brightness(1); }
          15%  { transform: translateX(-25px) translateY(-8px) rotate(-12deg); filter: brightness(2.5) saturate(0.3); }
          30%  { transform: translateX(-18px) translateY(-3px) rotate(-8deg); filter: brightness(1.6); }
          50%  { transform: translateX(-12px) translateY(2px) rotate(-4deg); filter: brightness(1.2); }
          75%  { transform: translateX(-3px) translateY(0) rotate(-1deg); filter: brightness(1); }
          100% { transform: translateX(0) translateY(0) rotate(0deg); filter: brightness(1); }
        }

        .pixel-boss-fighter.recoiling {
          animation: bossRecoil 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
        }
        @keyframes bossRecoil {
          0%   { transform: translateX(0) translateY(0) rotate(0deg); filter: brightness(1); }
          15%  { transform: translateX(25px) translateY(-10px) rotate(12deg); filter: brightness(2.5) saturate(0.3); }
          30%  { transform: translateX(18px) translateY(-4px) rotate(8deg); filter: brightness(1.6); }
          50%  { transform: translateX(10px) translateY(2px) rotate(4deg); filter: brightness(1.2); }
          75%  { transform: translateX(3px) translateY(0) rotate(1deg); filter: brightness(1); }
          100% { transform: translateX(0) translateY(0) rotate(0deg); filter: brightness(1); }
        }

        /* ========= AMBIENT ARENA GLOWS ========= */
        .pixel-arena::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          transition: background 0.5s ease;
        }
        .pixel-arena.action-player-strike::after {
          background: radial-gradient(circle at 25% 60%, rgba(0, 229, 255, 0.2) 0%, transparent 50%),
                      radial-gradient(circle at 75% 50%, rgba(0, 229, 255, 0.08) 0%, transparent 40%);
        }
        .pixel-arena.action-boss-strike::after {
          background: radial-gradient(circle at 75% 60%, rgba(255, 0, 80, 0.2) 0%, transparent 50%),
                      radial-gradient(circle at 25% 50%, rgba(255, 0, 80, 0.08) 0%, transparent 40%);
        }

        /* ========= PLAYER AURA SLASH — travels left→right from player to boss ========= */
        .player-aura-slash-container {
          position: absolute;
          /* Start at the player's sword tip position */
          left: calc(10% + 95px);
          top: 30px;
          /* Width spans from player to boss */
          width: calc(90% - 10% - 95px - 130px);
          height: 160px;
          pointer-events: none;
          z-index: 20;
        }

        /* The actual slash crescent — spawns at left, flies to right */
        .aura-slash-projectile {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 80px;
          height: 140px;
          animation: auraSlashFly 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
          filter: drop-shadow(0 0 12px rgba(0,229,255,0.8)) drop-shadow(0 0 25px rgba(0,100,255,0.5));
        }
        @keyframes auraSlashFly {
          0%   { left: -10%; opacity: 0; transform: translateY(-50%) scale(0.3) rotate(-20deg); }
          12%  { opacity: 1; transform: translateY(-50%) scale(1.3) rotate(-5deg); }
          35%  { left: 35%; opacity: 1; transform: translateY(-50%) scale(1.1) rotate(2deg); }
          65%  { left: 70%; opacity: 1; transform: translateY(-50%) scale(1.0) rotate(5deg); }
          85%  { left: 95%; opacity: 0.7; transform: translateY(-50%) scale(0.9) rotate(8deg); }
          100% { left: 110%; opacity: 0; transform: translateY(-50%) scale(0.5) rotate(12deg); }
        }

        /* Flash at sword tip when slash begins */
        .player-strike-flash {
          position: absolute;
          left: calc(10% + 100px);
          top: 70px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: radial-gradient(circle, #ffffff 0%, rgba(0,229,255,0.8) 40%, transparent 70%);
          box-shadow: 0 0 30px #00e5ff, 0 0 60px rgba(0,229,255,0.5), 0 0 90px rgba(0,100,255,0.3);
          animation: swordFlash 0.5s ease-out forwards;
          z-index: 25;
          pointer-events: none;
        }
        @keyframes swordFlash {
          0%   { transform: scale(0) rotate(0deg); opacity: 0; }
          30%  { transform: scale(2.2) rotate(30deg); opacity: 1; }
          60%  { transform: scale(1.8) rotate(60deg); opacity: 0.6; }
          100% { transform: scale(0) rotate(90deg); opacity: 0; }
        }

        /* Sword trail streaks during slash */
        .sword-trail {
          position: absolute;
          left: calc(10% + 80px);
          top: 40px;
          width: 120px;
          height: 140px;
          pointer-events: none;
          z-index: 15;
        }
        .sword-trail-arc {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid transparent;
          border-top-color: rgba(0, 229, 255, 0.6);
          border-radius: 50%;
          animation: trailSweep 0.5s ease-out forwards;
          filter: blur(1px);
        }
        .sword-trail-arc:nth-child(2) {
          animation-delay: 0.05s;
          border-top-color: rgba(255,255,255,0.4);
          transform: scale(0.85);
        }
        .sword-trail-arc:nth-child(3) {
          animation-delay: 0.1s;
          border-top-color: rgba(0,100,255,0.3);
          transform: scale(0.7);
        }
        @keyframes trailSweep {
          0%   { transform: rotate(-90deg) scale(0.3); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: rotate(90deg) scale(1.2); opacity: 0; }
        }

        /* Hit sparks at boss position on slash impact */
        .hit-sparks {
          position: absolute;
          right: calc(10% + 40px);
          top: 50%;
          transform: translateY(-50%);
          width: 80px;
          height: 80px;
          pointer-events: none;
          z-index: 30;
          animation: sparkBurst 0.6s ease-out forwards;
        }
        .hit-spark {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 6px #00e5ff, 0 0 12px #ffffff;
        }
        .hit-spark:nth-child(1) { animation: sparkFly1 0.5s ease-out 0.3s forwards; }
        .hit-spark:nth-child(2) { animation: sparkFly2 0.5s ease-out 0.3s forwards; }
        .hit-spark:nth-child(3) { animation: sparkFly3 0.5s ease-out 0.32s forwards; }
        .hit-spark:nth-child(4) { animation: sparkFly4 0.5s ease-out 0.32s forwards; }
        .hit-spark:nth-child(5) { animation: sparkFly5 0.5s ease-out 0.34s forwards; }
        .hit-spark:nth-child(6) { animation: sparkFly6 0.5s ease-out 0.34s forwards; }
        @keyframes sparkFly1 { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(30px,-25px) scale(0); opacity: 0; } }
        @keyframes sparkFly2 { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(-20px,-30px) scale(0); opacity: 0; } }
        @keyframes sparkFly3 { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(25px,20px) scale(0); opacity: 0; } }
        @keyframes sparkFly4 { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(-15px,25px) scale(0); opacity: 0; } }
        @keyframes sparkFly5 { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(35px,5px) scale(0); opacity: 0; } }
        @keyframes sparkFly6 { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(-25px,-10px) scale(0); opacity: 0; } }
        @keyframes sparkBurst {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* ========= BOSS PROJECTILES & SPELLS ========= */
        .pixel-projectile {
          position: absolute;
          right: calc(10% + 50px);
          top: 60px;
          width: 64px;
          height: 32px;
          z-index: 20;
          pointer-events: none;
          animation: bossProjectileFly 0.8s linear forwards;
        }
        @keyframes bossProjectileFly {
          0%   { right: calc(10% + 50px); opacity: 0; transform: scale(0.6); }
          15%  { opacity: 1; transform: scale(1.2); }
          80%  { right: calc(90% - 100px); opacity: 1; transform: scale(1); }
          100% { right: calc(90% - 130px); opacity: 0; transform: scale(0.6); }
        }

        .pixel-spell-pillar {
          position: absolute;
          left: calc(10% + 40px);
          bottom: 3px;
          width: 40px;
          height: 100px;
          z-index: 20;
          pointer-events: none;
          transform-origin: bottom center;
          animation: spellPillarRise 1.0s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          filter: drop-shadow(0 0 10px rgba(56,189,248,0.7));
        }
        @keyframes spellPillarRise {
          0%   { transform: scaleY(0); opacity: 0; }
          25%  { transform: scaleY(1); opacity: 1; }
          75%  { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(0); opacity: 0; }
        }

        /* Impact flash on player when boss hit connects */
        .beam-impact-flash {
          position: absolute;
          left: calc(10% + 20px);
          top: 50px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: radial-gradient(circle, #ffffff 0%, #ff0055 40%, transparent 70%);
          box-shadow: 0 0 25px #ff0055, 0 0 50px #ff0055;
          animation: impactFlash 0.6s ease-out 0.35s forwards;
          opacity: 0;
          z-index: 26;
        }
        @keyframes impactFlash {
          0%   { transform: scale(0); opacity: 0; }
          30%  { transform: scale(2); opacity: 1; }
          60%  { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(0); opacity: 0; }
        }

        /* Boss beam hit sparks at player */
        .beam-hit-sparks {
          position: absolute;
          left: calc(10% + 40px);
          top: 50%;
          transform: translateY(-50%);
          width: 60px;
          height: 60px;
          pointer-events: none;
          z-index: 30;
          animation: sparkBurst 0.6s ease-out 0.35s forwards;
          opacity: 0;
        }
        .beam-hit-spark {
          position: absolute;
          top: 50%; left: 50%;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 4px #ff0055, 0 0 8px #ffffff;
        }
        .beam-hit-spark:nth-child(1) { animation: sparkFly1 0.4s ease-out 0.35s forwards; }
        .beam-hit-spark:nth-child(2) { animation: sparkFly2 0.4s ease-out 0.37s forwards; }
        .beam-hit-spark:nth-child(3) { animation: sparkFly3 0.4s ease-out 0.36s forwards; }
        .beam-hit-spark:nth-child(4) { animation: sparkFly4 0.4s ease-out 0.38s forwards; }

        /* ========= SCREEN FLASH OVERLAY ========= */
        .screen-flash-overlay {
          position: absolute; inset: 0; pointer-events: none; z-index: 99;
          transition: background-color 0.05s ease;
        }
        .screen-flash-overlay.flash-white {
          background-color: rgba(255, 255, 255, 0.75);
          animation: flashPulse 0.2s ease-out;
        }
        .screen-flash-overlay.flash-red {
          background-color: rgba(239, 68, 68, 0.55);
          animation: flashPulse 0.2s ease-out;
        }
        @keyframes flashPulse {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }

        /* ========= ENHANCED SCREEN SHAKE ========= */
        .player-hurt {
          animation: heavyShake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) 1;
          box-shadow: inset 0 0 120px rgba(200, 16, 46, 0.5);
        }
        @keyframes heavyShake {
          0%, 100% { transform: translate(0, 0) rotate(0); }
          10% { transform: translate(-10px, 6px) rotate(-0.5deg); }
          20% { transform: translate(10px, -8px) rotate(0.5deg); }
          30% { transform: translate(-8px, -6px) rotate(-0.3deg); }
          40% { transform: translate(8px, 8px) rotate(0.3deg); }
          50% { transform: translate(-6px, -4px) rotate(-0.2deg); }
          60% { transform: translate(6px, 4px) rotate(0.2deg); }
          70% { transform: translate(-4px, -2px) rotate(-0.1deg); }
          80% { transform: translate(3px, 2px) rotate(0.1deg); }
          90% { transform: translate(-1px, 0) rotate(0); }
        }

      `}</style>

      {/* Ash/Embers Particles */}
      <div className="ember-field">
        {embers.map((e) => (
          <div
            key={e.id}
            className="ember"
            style={{
              left: `${e.left}%`,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.duration}s`,
              width: `${e.size}px`,
              height: `${e.size}px`,
              background: e.color,
              boxShadow: `0 0 6px ${e.color}`
            }}
          />
        ))}
      </div>

      {/* --- STAGE: SUMMONING (LOADING SCREEN) --- */}
      {loading && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 10, overflow: "hidden"
        }}>
          {/* Fog / atmosphere overlays */}
          <div style={{
            position: "absolute", inset: 0, 
            background: "radial-gradient(ellipse at 50% 120%, rgba(120, 0, 0, 0.25) 0%, transparent 60%)",
            animation: "pulseOpacity 4s ease-in-out infinite alternate", pointerEvents: "none"
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 50% -20%, rgba(80, 0, 0, 0.15) 0%, transparent 50%)",
            pointerEvents: "none"
          }} />
          
          {/* Massive danger sigil in background */}
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -55%)",
            opacity: loadingPct > 30 ? 0.08 + (loadingPct / 1000) : 0, transition: "opacity 2s ease",
            pointerEvents: "none"
          }}>
            <svg width="500" height="500" viewBox="0 0 100 100" style={{ animation: "spinSlow 90s linear infinite" }}>
              <circle cx="50" cy="50" r="48" fill="none" stroke="#c8102e" strokeWidth="0.3" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#c8102e" strokeWidth="0.5" strokeDasharray="3 8" />
              <polygon points="50,5 95,75 5,75" fill="none" stroke="#c8102e" strokeWidth="0.4" />
              <polygon points="50,95 5,25 95,25" fill="none" stroke="#c8102e" strokeWidth="0.4" />
              <circle cx="50" cy="50" r="20" fill="none" stroke="#c8102e" strokeWidth="0.6" strokeDasharray="12 6" />
              <line x1="50" y1="2" x2="50" y2="98" stroke="#c8102e" strokeWidth="0.2" />
              <line x1="2" y1="50" x2="98" y2="50" stroke="#c8102e" strokeWidth="0.2" />
            </svg>
          </div>

          {/* Top warning text */}
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: "11px", letterSpacing: "8px",
            color: "#c8102e", textTransform: "uppercase", fontWeight: 700,
            marginBottom: "20px", opacity: loadingPct > 10 ? 0.8 : 0, transition: "opacity 1s ease"
          }}>
            — WARNING —
          </div>

          {/* Main massive title */}
          <div style={{
            fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(48px, 8vw, 90px)", 
            fontWeight: 900, letterSpacing: "clamp(8px, 2vw, 20px)", lineHeight: 1,
            color: "#ffffff", textTransform: "uppercase", textAlign: "center",
            textShadow: "0 0 60px rgba(200, 16, 46, 0.5), 0 0 120px rgba(200, 16, 46, 0.2), 0 4px 20px rgba(0,0,0,0.9)",
            marginBottom: "8px", animation: "pulseOpacity 3s ease-in-out infinite alternate"
          }}>
            A FOE
          </div>
          <div style={{
            fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(48px, 8vw, 90px)",
            fontWeight: 900, letterSpacing: "clamp(8px, 2vw, 20px)", lineHeight: 1,
            color: "#ffffff", textTransform: "uppercase", textAlign: "center",
            textShadow: "0 0 60px rgba(200, 16, 46, 0.5), 0 0 120px rgba(200, 16, 46, 0.2), 0 4px 20px rgba(0,0,0,0.9)",
            marginBottom: "30px"
          }}>
            APPROACHES
          </div>

          {/* Thin decorative line */}
          <div style={{
            width: "clamp(200px, 40vw, 500px)", height: "1px", marginBottom: "30px",
            background: "linear-gradient(90deg, transparent, rgba(200, 16, 46, 0.6), transparent)"
          }} />

          {/* Atmospheric flavor text */}
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontStyle: "italic",
            color: "#777", letterSpacing: "2px", marginBottom: "50px", maxWidth: "500px",
            textAlign: "center", lineHeight: 1.6,
            opacity: loadingPct > 20 ? 1 : 0, transition: "opacity 1.5s ease"
          }}>
            The air grows heavy. Something ancient stirs beneath the milestone...
          </div>

          {/* HP-bar style loading bar */}
          <div style={{ width: "clamp(280px, 50vw, 550px)", textAlign: "center" }}>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: "10px", letterSpacing: "5px",
              color: "#555", textTransform: "uppercase", marginBottom: "8px"
            }}>
              Manifesting Guardian
            </div>
            <div style={{
              width: "100%", height: "3px", background: "rgba(255,255,255,0.05)",
              position: "relative", overflow: "hidden"
            }}>
              <div style={{
                height: "100%", width: `${loadingPct}%`,
                background: "linear-gradient(90deg, #5a0000, #c8102e)",
                boxShadow: "0 0 15px rgba(200, 16, 46, 0.8), 0 0 30px rgba(200, 16, 46, 0.4)",
                transition: "width 0.08s linear"
              }} />
            </div>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: "28px", fontWeight: 700,
              color: "#c8102e", marginTop: "12px", letterSpacing: "4px",
              textShadow: "0 0 20px rgba(200, 16, 46, 0.5)"
            }}>
              {loadingPct}%
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE: INTRO (RPG STORY DIALOGUE PHASE) --- */}
      {!loading && stage === "intro" && (
        <div style={{
          width: "100%", maxWidth: "800px", padding: "10px",
          display: "flex", flexDirection: "column", alignItems: "center",
          zIndex: 10, position: "relative", margin: "auto 0"
        }}>
          {/* Top Threat Indicator */}
          <div style={{ fontSize: "12px", color: "#ef4444", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "12px", fontWeight: "bold" }}>
            ⚔ Milestone Construct Materialized ⚔
          </div>

          {/* Boss Sprite and Altar */}
          <div style={{ width: "150px", height: "150px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
            <div className={bossHurt ? "boss-hurt" : ""} style={{ width: "130px", height: "130px" }}>
              <EnemySprite enemyConfig={currentEnemyConfig} action="idle" isHurt={false} />
            </div>
            <div className="er-pedestal" />
          </div>

          {/* Boss Name */}
          <h1 className="er-title" style={{ fontSize: "38px", margin: "0 0 4px 0", color: "#fff" }}>
            {currentEnemyConfig.name.toUpperCase()}
          </h1>
          <div style={{ fontSize: "14px", color: "#ffffff", fontWeight: "600", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "20px" }}>
            Guardian of "{milestone.title}" ({bossData.bossType})
          </div>

          <div className="er-divider" />

          {/* Boss speech subtitles with typing effect */}
          <div style={{ minHeight: "70px", marginBottom: "30px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="er-subtitle-dialogue">
              "{displayedBossText}"
            </p>
          </div>

          {/* Interactive Player Choices */}
          {!isTyping && (
            <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
              {dialogueStep === 0 && (
                <>
                  <button className="er-option-btn-premium" onClick={() => handleChoiceSelect(0)}>
                    <div className="er-option-premium-border" />
                    <span className="er-option-text">{getDialogueScript(bossData.bossType, topic).responses1[0]}</span>
                  </button>
                  <button className="er-option-btn-premium" onClick={() => handleChoiceSelect(1)}>
                    <div className="er-option-premium-border" />
                    <span className="er-option-text">{getDialogueScript(bossData.bossType, topic).responses1[1]}</span>
                  </button>
                  <button className="er-option-btn-premium" onClick={() => handleChoiceSelect(2)}>
                    <div className="er-option-premium-border" />
                    <span className="er-option-text">{getDialogueScript(bossData.bossType, topic).responses1[2]}</span>
                  </button>
                </>
              )}

              {dialogueStep === 1 && (
                <>
                  <button className="er-option-btn-premium" onClick={() => handleChoiceSelect(0)}>
                    <div className="er-option-premium-border" />
                    <span className="er-option-text">{getDialogueScript(bossData.bossType, topic).responses2[0]}</span>
                  </button>
                  <button className="er-option-btn-premium" onClick={() => handleChoiceSelect(1)}>
                    <div className="er-option-premium-border" />
                    <span className="er-option-text">{getDialogueScript(bossData.bossType, topic).responses2[1]}</span>
                  </button>
                </>
              )}

              {dialogueStep === 2 && (
                <div style={{ display: "flex", gap: "20px", justifyContent: "center", width: "100%", marginTop: "8px" }}>
                  <button className="er-action-btn" style={{ borderColor: "#ef4444", color: "#ef4444" }} onClick={onClose}>
                    RETREAT
                  </button>
                  <button className="er-action-btn" style={{ borderColor: "#ffffff", color: "#ffffff", textShadow: "0 0 10px rgba(255,255,255,0.5)" }} onClick={handleStartBattle}>
                    ⚔ BEGIN BATTLE ⚔
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- STAGE: BATTLE (GAME PLAYING SCREEN) --- */}
      {!loading && stage === "battle" && (
        <div style={{
          width: "100%", maxWidth: "800px",
          display: "flex", flexDirection: "column", zIndex: 10,
          position: "relative", width: "100%"
        }}>
          {/* Top HUD Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            {/* Player HP */}
            <div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>
                Integrity
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {renderHearts()}
              </div>
            </div>

            {/* Countdown timer */}
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: "38px",
              color: timer <= 4 ? "#ef4444" : "#d4af37", fontWeight: "bold",
              textShadow: timer <= 4 ? "0 0 10px rgba(239,68,68,0.5)" : "0 0 10px rgba(255,255,255,0.3)",
              animation: timer <= 4 ? "bossFloat 0.5s infinite" : "none"
            }}>
              {timer}
            </div>

            {/* Battle details */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>
                Quest Milestone
              </div>
              <div style={{ fontSize: "14px", color: "#fff", fontFamily: "'Cinzel', serif" }}>
                Level {milestone.level || 1}
              </div>
            </div>
          </div>

          {/* Pixel Combat Arena */}
          <div className={`pixel-arena ${combatAnim === "player-strike" ? "action-player-strike" : combatAnim === "boss-strike" ? "action-boss-strike" : ""}`}>
            <div className="pixel-ground" />
            
            {/* Screen Flash Overlay */}
            <div className={`screen-flash-overlay ${screenFlash === "white" ? "flash-white" : screenFlash === "red" ? "flash-red" : ""}`} />

            {/* === PLAYER PIXEL SLASH — travels left→right from player to boss === */}
            {combatAnim === "player-strike" && (
              <>
                {/* Flash burst at sword tip */}
                <div className="player-strike-flash" />
                
                {/* Sword trail arcs */}
                <div className="sword-trail">
                  <div className="sword-trail-arc" />
                  <div className="sword-trail-arc" />
                  <div className="sword-trail-arc" />
                </div>

                {/* Aura slash crescent projectile — flies from player to boss */}
                <div className="player-aura-slash-container">
                  <svg className="aura-slash-projectile" viewBox="0 0 16 28" shapeRendering="crispEdges">
                    <rect x="0" y="6" width="2" height="16" fill="#00e5ff" />
                    <rect x="2" y="3" width="2" height="22" fill="#ffffff" />
                    <rect x="4" y="1" width="2" height="26" fill="#ffffff" />
                    <rect x="6" y="0" width="2" height="28" fill="#ffffff" />
                    <rect x="8" y="2" width="2" height="24" fill="#00e5ff" />
                    <rect x="10" y="4" width="2" height="20" fill="#00e5ff" />
                    <rect x="12" y="8" width="2" height="12" fill="#0066ff" />
                    <rect x="14" y="11" width="2" height="6" fill="#0022aa" />
                  </svg>
                </div>

                {/* Hit sparks at boss position */}
                <div className="hit-sparks">
                  <div className="hit-spark" />
                  <div className="hit-spark" />
                  <div className="hit-spark" />
                  <div className="hit-spark" />
                  <div className="hit-spark" />
                  <div className="hit-spark" />
                </div>
              </>
            )}
            
            {/* === BOSS ATTACKS (Melee / Projectile / Spell) === */}
            {combatAnim === "boss-strike" && (
              <>
                {/* 1. Projectiles (Syntax Sentinel / Vulture wind blade or Callback Demon / Deceased fire ball) */}
                {currentEnemyConfig.attackType === "projectile" && (
                  <div className="pixel-projectile">
                    {currentEnemyConfig.name === "Deceased" ? (
                      <svg width="24" height="24" viewBox="0 0 8 8" shapeRendering="crispEdges">
                        <rect x="3" y="1" width="2" height="6" fill="#a855f7" />
                        <rect x="2" y="2" width="4" height="4" fill="#ff007f" />
                        <rect x="1" y="3" width="6" height="2" fill="#ffffff" />
                        <rect x="3" y="3" width="2" height="2" fill="#ffffff" />
                      </svg>
                    ) : (
                      <svg width="32" height="16" viewBox="0 0 16 8" shapeRendering="crispEdges">
                        <rect x="0" y="3" width="2" height="2" fill="#00ffff" />
                        <rect x="2" y="2" width="2" height="4" fill="#00ffff" />
                        <rect x="4" y="1" width="2" height="6" fill="#ffffff" />
                        <rect x="6" y="0" width="2" height="8" fill="#ffffff" />
                        <rect x="8" y="1" width="2" height="6" fill="#00e5ff" />
                        <rect x="10" y="2" width="2" height="4" fill="#00e5ff" />
                        <rect x="12" y="3" width="2" height="2" fill="#0066ff" />
                      </svg>
                    )}
                  </div>
                )}

                {/* 2. Spells (Scope Warden / Mummy sand spike rising from ground) */}
                {currentEnemyConfig.attackType === "spell" && (
                  <div className="pixel-spell-pillar">
                    <svg width="40" height="100" viewBox="0 0 8 20" shapeRendering="crispEdges">
                      <rect x="3" y="0" width="2" height="2" fill="#eab308" />
                      <rect x="2" y="2" width="4" height="3" fill="#eab308" />
                      <rect x="1" y="5" width="6" height="5" fill="#ca8a04" />
                      <rect x="0" y="10" width="8" height="10" fill="#854d0e" />
                      <rect x="3" y="4" width="2" height="12" fill="#38bdf8" />
                    </svg>
                  </div>
                )}

                {/* Impact flash at player position */}
                <div className="beam-impact-flash" />

                {/* Hit sparks at player */}
                <div className="beam-hit-sparks">
                  <div className="beam-hit-spark" />
                  <div className="beam-hit-spark" />
                  <div className="beam-hit-spark" />
                  <div className="beam-hit-spark" />
                </div>
              </>
            )}

            {/* Floating damage numbers */}
            {floatingDamage && (
              <div className="float-dmg" style={{ top: "5%", right: "15%" }}>
                {floatingDamage}
              </div>
            )}

            {/* Pixel Player (Left) — Animated Knight Sprite */}
            <div className={`pixel-fighter ${combatAnim === "player-strike" ? (playerAttackStyle === "jump" ? "striking-jump" : "striking-lunge") : combatAnim === "boss-strike" ? "recoiling" : "fighting-loop"}`}>
              <KnightSprite
                action={playerHP <= 0 ? "hurt" : (combatAnim === "player-strike" ? (playerAttackStyle === "jump" ? "jumpAttack" : "attack") : playerHurt ? "hurt" : "idle")}
                isHurt={playerHurt}
                playerHP={playerHP}
              />
              <div className="pixel-char-shadow" />
            </div>

            {/* Pixel Boss (Right) — Animated Enemy Sprite Sheet */}
            <div className={`pixel-boss-fighter ${combatAnim === "boss-strike" ? `striking-${currentEnemyConfig.attackType}` : combatAnim === "player-strike" ? "recoiling" : "fighting-loop"}`}>
              <EnemySprite
                enemyConfig={currentEnemyConfig}
                action={bossHP <= 0 ? "death" : (combatAnim === "boss-strike" ? "attack" : bossHurt ? "hurt" : "idle")}
                isHurt={bossHurt}
              />
              <div className="pixel-char-shadow" />
            </div>
          </div>

          {/* Boss combat dialogues / Subtitle block - rendered inline, not absolute, to prevent text overlay */}
          <div style={{ minHeight: "44px", margin: "5px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {displayedBossText && (
              <p className="er-subtitle-dialogue" style={{ fontSize: "17px", color: "#fcebd2", margin: 0 }}>
                "{displayedBossText}"
              </p>
            )}
          </div>

          {/* Boss HP Bar & Questions HUD (Bottom) */}
          <div style={{ marginTop: "10px" }}>
            {/* Boss Health Bar */}
            <div className="er-boss-hp-wrapper">
              <div className="er-boss-hp-label">{currentEnemyConfig.name.toUpperCase()}</div>
              <div className="er-boss-hp-track">
                <div className="er-boss-hp-fill" style={{ width: `${bossHP}%` }} />
              </div>
            </div>

            {/* Active Question Display */}
            {!isTyping && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ fontSize: "11px", color: "#ffffff", fontWeight: "700", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px", textAlign: "center" }}>
                  CONFRONTATION {currentIdx + 1} OF {bossData.questions.length}
                </div>
                
                <h3 style={{ fontSize: "19px", fontWeight: "600", color: "#fff", lineHeight: "1.4", textAlign: "center", margin: "0 auto 12px", maxWidth: "680px" }}>
                  {bossData.questions[currentIdx].question}
                </h3>

                {/* Answers */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", maxWidth: "700px", margin: "0 auto 15px", width: "100%" }}>
                  {bossData.questions[currentIdx].options.map((opt, oIdx) => {
                    let btnClass = "";
                    if (isAnswering) {
                      const correctIdx = bossData.questions[currentIdx].answerIndex;
                      if (oIdx === correctIdx) {
                        btnClass = "correct";
                      } else if (selectedAns === oIdx) {
                        btnClass = "wrong";
                      }
                    }
                    
                    const romanNumerals = ["I", "II", "III", "IV", "V"];
                    return (
                      <button
                        key={oIdx}
                        disabled={isAnswering}
                        onClick={() => handleAnswerSelect(oIdx)}
                        className={`er-option-btn-premium ${btnClass}`}
                      >
                        <div className="er-option-premium-border" />
                        <span className="er-option-numeral">
                          {romanNumerals[oIdx]}.
                        </span>
                        <span className="er-option-text">
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- STAGE: VICTORY (BOSS DEFEATED) --- */}
      {stage === "victory" && (
        <div style={{
          width: "100%", maxWidth: "700px", padding: "40px 20px",
          textAlign: "center", zIndex: 10, position: "relative", margin: "auto 0"
        }}>
          <h2 style={{ fontSize: "12px", letterSpacing: "5px", color: "#ffffff", fontWeight: "bold", textTransform: "uppercase", marginBottom: "20px" }}>
            ✦ Milestone Mastered ✦
          </h2>
          
          <div className="victory-text-glow" style={{ marginBottom: "12px" }}>
            FOE VANQUISHED
          </div>

          <div className="er-divider" />

          <p style={{ fontSize: "19px", color: "#dfd7c0", marginBottom: "40px", lineHeight: "1.6", maxWidth: "550px", margin: "0 auto 40px" }}>
            The guardian <strong>{currentEnemyConfig.name} ({bossData.bossType})</strong> has fallen. Your mastery over the milestone of <strong>"{milestone.title}"</strong> has been sealed in the Erdtree of knowledge.
          </p>

          {/* Reward HUD */}
          <div style={{
            width: "100%", maxWidth: "360px", background: "rgba(212, 175, 55, 0.05)",
            borderTop: "1px solid rgba(212, 175, 55, 0.2)",
            borderBottom: "1px solid rgba(212, 175, 55, 0.2)",
            padding: "10px", display: "flex", justifyContent: "space-around",
            alignItems: "center", margin: "0 auto 40px"
          }}>
            <div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Double XP Gained</div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ffffff", textShadow: "0 0 10px rgba(255,255,255,0.3)" }}>
                +{milestone.xpReward * 2}
              </div>
            </div>
            <div style={{ width: "1px", height: "35px", background: "rgba(255,255,255,0.2)" }} />
            <div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Trophy Claimed</div>
              <div style={{ fontSize: "28px" }}>🏆</div>
            </div>
          </div>

          <button className="er-action-btn" style={{ borderColor: "#ffffff", color: "#ffffff" }} onClick={onClose}>
            RETURN TO ROADMAP
          </button>
        </div>
      )}

      {/* --- STAGE: DEFEAT (PLAYER HP = 0) --- */}
      {stage === "defeat" && (
        <div className="defeat-screen" style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 10, textAlign: "center", padding: "24px 16px"
        }}>
          <div className="defeat-text-glow" style={{ marginBottom: "10px" }}>
            YOU DIED
          </div>

          <div style={{ width: "200px", height: "1px", background: "rgba(200, 0, 0, 0.3)", marginBottom: "35px" }} />

          <p style={{ fontSize: "18px", color: "#a59b84", marginBottom: "40px", fontStyle: "italic", maxWidth: "450px" }}>
            Your compilation broke, traveler. Return to your study notes or reference the video libraries of this milestone before challenging the construct again.
          </p>

          <div style={{ display: "flex", gap: "20px" }}>
            <button className="er-action-btn" style={{ borderColor: "rgba(255,255,255,0.15)", color: "#a59b84" }} onClick={onClose}>
              ABANDON
            </button>
            <button className="er-action-btn" style={{ borderColor: "#c80000", color: "#c80000" }} onClick={handleRetry}>
              RETRY CONFRONTATION
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
