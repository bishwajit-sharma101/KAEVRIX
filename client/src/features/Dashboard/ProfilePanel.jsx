import { useState, useEffect, useMemo } from "react";
import * as sound from "../../utils/audio";

const TIER_COLORS = {
  "Novice": "#64748b",
  "Adept": "#3b82f6",
  "Expert": "#10b981",
  "Master": "#f59e0b",
  "Legend": "var(--neon-pink)"
};

const PRESET_COSMETICS = [
  { banner: "", avatarFrame: "", profileEffect: "" },
  { banner: "none", avatarFrame: "inferno-aura", profileEffect: "inferno" },
  { banner: "none", avatarFrame: "rage-aura", profileEffect: "rage" },
  { banner: "none", avatarFrame: "void-aura", profileEffect: "void" },
  { banner: "none", avatarFrame: "sakura-bunny", profileEffect: "sakura-dream" },
  { banner: "none", avatarFrame: "synth-ring", profileEffect: "cyberpunk-neon" },
  { banner: "none", avatarFrame: "vinyl-glow", profileEffect: "lofi-study" },
  
  // 8 New Archetype Presets
  { banner: "none", avatarFrame: "pixel-crown", profileEffect: "pixel-retro" },
  { banner: "none", avatarFrame: "vine-wreath", profileEffect: "cottagecore-forest" },
  { banner: "none", avatarFrame: "boba-ears", profileEffect: "boba-cafe" },
  { banner: "none", avatarFrame: "event-horizon", profileEffect: "blackhole" },
  { banner: "none", avatarFrame: "jelly-pulse", profileEffect: "abyssal-glow" },
  { banner: "none", avatarFrame: "clockwork-gears", profileEffect: "steampunk-gear" },
  { banner: "none", avatarFrame: "bat-wings", profileEffect: "crimson-moon" },
  { banner: "none", avatarFrame: "cyber-visor", profileEffect: "vapor-glitch" },
  
  { banner: "https://images.unsplash.com/photo-1620802051772-52055660890c?w=800", avatarFrame: "kawaii-clouds", profileEffect: "magical-girl" },
  { banner: "https://images.unsplash.com/photo-1561485132-59468cd0b553?w=800", avatarFrame: "lightning-strike", profileEffect: "thunder-storm" },
  { banner: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800", avatarFrame: "hologram-ring", profileEffect: "matrix-glitch" },
  { banner: "https://images.unsplash.com/photo-1483664852095-d6cc6870702d?w=800", avatarFrame: "frost-ring", profileEffect: "blizzard" }
];

const getCatConfig = (effect) => {
  switch (effect) {
    case "inferno":
      return {
        primary: "#e64a19",
        secondary: "#d84315",
        accent: "#ffb74d",
        eye: "#ffd54f",
        accessory: "fire"
      };
    case "void":
      return {
        primary: "#4a148c",
        secondary: "#311b92",
        accent: "#ea80fc",
        eye: "#00e5ff",
        accessory: "void-shield"
      };
    case "rage":
      return {
        primary: "#3e2723",
        secondary: "#1b0000",
        accent: "#d50000",
        eye: "#ffffff",
        accessory: "rage-embers"
      };
    case "matrix-glitch":
      return {
        primary: "#1b5e20",
        secondary: "#00c853",
        accent: "#a5d6a7",
        eye: "#00e676",
        accessory: "binary"
      };
    case "sakura-dream":
      return {
        primary: "#fce4ec",
        secondary: "#f8bbd0",
        accent: "#ff4081",
        eye: "#ffffff",
        accessory: "flower"
      };
    case "cyberpunk-neon":
      return {
        primary: "#1a062c",
        secondary: "#ff00ff",
        accent: "#00ffff",
        eye: "#ff00ff",
        accessory: "cyber-headphones"
      };
    case "lofi-study":
      return {
        primary: "#5d4037",
        secondary: "#3e2723",
        accent: "#d7ccc8",
        eye: "#8d6e63",
        accessory: "headphones"
      };
    case "pixel-retro":
      return {
        primary: "#37474f",
        secondary: "#212121",
        accent: "#ffd54f",
        eye: "#00e5ff",
        accessory: "crown"
      };
    case "cottagecore-forest":
      return {
        primary: "#2e7d32",
        secondary: "#1b5e20",
        accent: "#c5e1a5",
        eye: "#ffd54f",
        accessory: "leaf"
      };
    case "boba-cafe":
      return {
        primary: "#d7ccc8",
        secondary: "#8d6e63",
        accent: "#5c3a21",
        eye: "#ff80ab",
        accessory: "boba"
      };
    case "blackhole":
      return {
        primary: "#0a0015",
        secondary: "#4a148c",
        accent: "#d500f9",
        eye: "#00e5ff",
        accessory: "blackhole-orbit"
      };
    case "abyssal-glow":
      return {
        primary: "#0d47a1",
        secondary: "#01579b",
        accent: "#00e5ff",
        eye: "#00ffff",
        accessory: "bubbles"
      };
    case "steampunk-gear":
      return {
        primary: "#4e342e",
        secondary: "#3e2723",
        accent: "#ffd54f",
        eye: "#ffb74d",
        accessory: "goggles"
      };
    case "crimson-moon":
      return {
        primary: "#110007",
        secondary: "#310000",
        accent: "#ff1744",
        eye: "#ff1744",
        accessory: "bat-wings"
      };
    case "vapor-glitch":
      return {
        primary: "#2e124d",
        secondary: "#ff007f",
        accent: "#00e5ff",
        eye: "#00e5ff",
        accessory: "visor"
      };
    default:
      return {
        primary: "#f97316",
        secondary: "#ea580c",
        accent: "#ffedd5",
        eye: "#ec4899",
        accessory: "none"
      };
  }
};

const renderAccessory = (type, cfg, state) => {
  let ox = 0;
  let oy = 0;
  if (state === "sleep") {
    ox = 4;
    oy = 7;
  } else if (state === "play") {
    ox = 2;
    oy = 5;
  }

  switch (type) {
    case "crown":
      return (
        <g style={state === "sleep" ? { animation: "catSleepBreath 3s ease-in-out infinite", transformOrigin: "22px 24px" } : { animation: "catHeadBob 2s ease-in-out infinite", transformOrigin: "19px 16px" }}>
          <rect x={17 + ox} y={3 + oy} width="5" height="4" fill="#fbc02d" />
          <rect x={17 + ox} y={3 + oy} width="1" height="1" fill="transparent" />
          <rect x={19 + ox} y={3 + oy} width="1" height="1" fill="transparent" />
          <rect x={21 + ox} y={3 + oy} width="1" height="1" fill="transparent" />
          <rect x={18 + ox} y={4 + oy} width="1" height="1" fill="#d32f2f" />
          <rect x={20 + ox} y={4 + oy} width="1" height="1" fill="#1976d2" />
        </g>
      );
    case "leaf":
      return (
        <g style={state === "sleep" ? { animation: "catSleepBreath 3s ease-in-out infinite", transformOrigin: "22px 24px" } : { animation: "catHeadBob 2s ease-in-out infinite", transformOrigin: "19px 16px" }}>
          <rect x={16 + ox} y={5 + oy} width="7" height="2" fill="#4caf50" />
          <rect x={19 + ox} y={3 + oy} width="1" height="2" fill="#388e3c" />
        </g>
      );
    case "headphones":
    case "cyber-headphones":
      const color = type === "cyber-headphones" ? "#00ffff" : "#8d6e63";
      const cupColor = type === "cyber-headphones" ? "#ff00ff" : "#d7ccc8";
      return (
        <g style={state === "sleep" ? { animation: "catSleepBreath 3s ease-in-out infinite", transformOrigin: "22px 24px" } : { animation: "catHeadBob 2s ease-in-out infinite", transformOrigin: "19px 16px" }}>
          <rect x={16 + ox} y={6 + oy} width="7" height="1" fill={color} />
          <rect x={15 + ox} y={7 + oy} width="1" height="1" fill={color} />
          <rect x={23 + ox} y={7 + oy} width="1" height="1" fill={color} />
          <rect x={14 + ox} y={8 + oy} width="2" height="4" fill={cupColor} />
          <rect x={23 + ox} y={8 + oy} width="2" height="4" fill={cupColor} />
        </g>
      );
    case "goggles":
      return (
        <g style={state === "sleep" ? { animation: "catSleepBreath 3s ease-in-out infinite", transformOrigin: "22px 24px" } : { animation: "catHeadBob 2s ease-in-out infinite", transformOrigin: "19px 16px" }}>
          <rect x={15 + ox} y={8 + oy} width="9" height="3" fill="#8d6e63" />
          <rect x={16 + ox} y={9 + oy} width="2" height="2" fill="#ffd54f" />
          <rect x={21 + ox} y={9 + oy} width="2" height="2" fill="#ffd54f" />
          <rect x={17 + ox} y={10 + oy} width="1" height="1" fill="#fff" />
          <rect x={22 + ox} y={10 + oy} width="1" height="1" fill="#fff" />
        </g>
      );
    case "visor":
      return (
        <g style={state === "sleep" ? { animation: "catSleepBreath 3s ease-in-out infinite", transformOrigin: "22px 24px" } : { animation: "catHeadBob 2s ease-in-out infinite", transformOrigin: "19px 16px" }}>
          <rect x={15 + ox} y={10 + oy} width="9" height="2" fill="#ff007f" opacity="0.9" />
          <rect x={17 + ox} y={10 + oy} width="5" height="1" fill="#00e5ff" />
        </g>
      );
    case "flower":
      return (
        <g style={state === "sleep" ? { animation: "catSleepBreath 3s ease-in-out infinite", transformOrigin: "22px 24px" } : { animation: "catHeadBob 2s ease-in-out infinite", transformOrigin: "19px 16px" }}>
          <rect x={14 + ox} y={3 + oy} width="2" height="2" fill="#ff4081" />
          <rect x={13 + ox} y={4 + oy} width="1" height="1" fill="#fff" />
          <rect x={16 + ox} y={4 + oy} width="1" height="1" fill="#fff" />
          <rect x={15 + ox} y={2 + oy} width="1" height="1" fill="#fff" />
          <rect x={15 + ox} y={5 + oy} width="1" height="1" fill="#fff" />
        </g>
      );
    case "boba":
      return (
        <g style={state === "sleep" ? { animation: "catSleepBreath 3s ease-in-out infinite", transformOrigin: "22px 24px" } : {}}>
          <rect x={state === "sleep" ? 11 : 9} y={state === "sleep" ? 14 : 10} width="4" height="5" fill="#fbf3e6" rx="1" />
          <rect x={state === "sleep" ? 12 : 10} y={state === "sleep" ? 12 : 8} width="1" height="3" fill="#ff80ab" />
          <rect x={state === "sleep" ? 12 : 10} y={state === "sleep" ? 16 : 12} width="2" height="2" fill="#5c3a21" opacity="0.6" />
        </g>
      );
    case "fire":
      return (
        <g>
          <circle cx={state === "sleep" ? 3 : 3} cy={state === "sleep" ? 18 : 6} r="2" fill="#ff9800" style={{ animation: "steamRise 1.5s infinite" }} />
          <circle cx={state === "sleep" ? 5 : 5} cy={state === "sleep" ? 17 : 8} r="1" fill="#ffeb3b" style={{ animation: "steamRise 2s infinite 0.5s" }} />
        </g>
      );
    case "void-shield":
      return (
        <g>
          <circle cx="8" cy="18" r="3" fill="#ea80fc" opacity="0.3" filter="blur(1px)" style={{ animation: "fireflyFloat 3s infinite" }} />
          <circle cx="22" cy="14" r="2" fill="#00e5ff" opacity="0.4" filter="blur(1px)" style={{ animation: "fireflyFloat 4s infinite 1s" }} />
        </g>
      );
    case "rage-embers":
      return (
        <g>
          <rect x="10" y="12" width="1" height="1" fill="#ff1744" style={{ animation: "steamRise 1s infinite" }} />
          <rect x="18" y="10" width="1" height="1" fill="#ff5252" style={{ animation: "steamRise 1.5s infinite 0.5s" }} />
        </g>
      );
    case "binary":
      return (
        <g style={{ fontFamily: "monospace", fontSize: "4px", fill: "#00ff00", opacity: 0.8 }}>
          <text x={state === "sleep" ? "20" : "15"} y={state === "sleep" ? "10" : "4"}>1</text>
          <text x={state === "sleep" ? "24" : "20"} y={state === "sleep" ? "12" : "6"}>0</text>
        </g>
      );
    case "blackhole-orbit":
      return (
        <g>
          <circle cx={state === "sleep" ? "22" : "18"} cy={state === "sleep" ? "18" : "11"} r="5" fill="none" stroke="#d500f9" strokeWidth="1" strokeDasharray="2 2" style={{ animation: "electricSpin 3s linear infinite" }} />
        </g>
      );
    case "bubbles":
      return (
        <g>
          <circle cx={state === "sleep" ? "24" : "20"} cy={state === "sleep" ? "10" : "4"} r="1.5" fill="none" stroke="#00ffff" strokeWidth="0.5" style={{ animation: "steamRise 2s infinite" }} />
          <circle cx={state === "sleep" ? "20" : "16"} cy={state === "sleep" ? "12" : "6"} r="1" fill="none" stroke="#00e5ff" strokeWidth="0.5" style={{ animation: "steamRise 1.5s infinite 0.7s" }} />
        </g>
      );
    case "bat-wings":
      return (
        <g style={state === "sleep" ? { animation: "catSleepBreath 3s ease-in-out infinite", transformOrigin: "22px 24px" } : {}}>
          <text x={state === "sleep" ? "5" : "3"} y={state === "sleep" ? "19" : "15"} style={{ fontSize: "14px", animation: "batWingsFlutter 2.5s infinite", transformOrigin: "right center" }}>🦇</text>
        </g>
      );
    default:
      return null;
  }
};

const renderSleepingCat = (cfg) => (
  <svg width="64px" height="64px" viewBox="0 0 32 32" style={{ imageRendering: "pixelated", shapeRendering: "crispEdges", overflow: "visible" }}>
    {renderAccessory(cfg.accessory, cfg, "sleep")}
    <rect x="5" y="20" width="5" height="3" fill={cfg.secondary} />
    <rect x="4" y="19" width="2" height="2" fill={cfg.secondary} />
    <rect x="9" y="18" width="14" height="6" fill={cfg.primary} style={{ animation: "catSleepBreath 3s ease-in-out infinite", transformOrigin: "bottom" }} />
    <rect x="13" y="18" width="1" height="4" fill={cfg.secondary} />
    <rect x="17" y="18" width="1" height="4" fill={cfg.secondary} />
    <g style={{ animation: "catSleepBreath 3s ease-in-out infinite", transformOrigin: "22px 24px" }}>
      <rect x="18" y="14" width="9" height="8" fill={cfg.primary} />
      <rect x="19" y="11" width="2" height="3" fill={cfg.primary} />
      <rect x="19" y="12" width="1" height="2" fill="#ff80ab" />
      <rect x="24" y="11" width="2" height="3" fill={cfg.primary} />
      <rect x="25" y="12" width="1" height="2" fill="#ff80ab" />
      <rect x="20" y="17" width="2" height="1" fill={cfg.secondary} />
      <rect x="24" y="17" width="2" height="1" fill={cfg.secondary} />
      <rect x="22" y="18" width="1" height="1" fill="#ff80ab" />
    </g>
    <rect x="11" y="22" width="3" height="2" fill={cfg.secondary} />
    <rect x="15" y="22" width="3" height="2" fill={cfg.secondary} />
  </svg>
);

const renderIdleWalkCat = (cfg, isWalking) => (
  <svg width="64px" height="64px" viewBox="0 0 32 32" style={{ imageRendering: "pixelated", shapeRendering: "crispEdges", overflow: "visible" }}>
    {renderAccessory(cfg.accessory, cfg, "idle")}
    <g style={{ animation: "catTailWiggle 1.5s ease-in-out infinite", transformOrigin: "5px 16px" }}>
      <rect x="5" y="15" width="2" height="2" fill={cfg.primary} />
      <rect x="4" y="13" width="2" height="3" fill={cfg.primary} />
      <rect x="3" y="10" width="2" height="4" fill={cfg.primary} />
      <rect x="2" y="8" width="2" height="3" fill={cfg.primary} />
      <rect x="3" y="6" width="2" height="3" fill={cfg.primary} />
      <rect x="4" y="5" width="2" height="2" fill={cfg.secondary} />
    </g>
    <g style={isWalking ? { animation: "catBodyBob 0.4s ease-in-out infinite" } : {}}>
      <rect x="7" y="14" width="12" height="8" fill={cfg.primary} />
      <rect x="10" y="14" width="1" height="5" fill={cfg.secondary} />
      <rect x="13" y="14" width="1" height="5" fill={cfg.secondary} />
      <rect x="17" y="14" width="2" height="6" fill={cfg.accent} />
      <rect x="16" y="16" width="2" height="3" fill={cfg.accent} />
    </g>
    <g style={isWalking ? { animation: "catHeadBob 0.4s ease-in-out infinite", transformOrigin: "19px 16px" } : { animation: "catHeadBob 3s ease-in-out infinite", transformOrigin: "19px 16px" }}>
      <rect x="14" y="7" width="10" height="9" fill={cfg.primary} />
      <rect x="15" y="4" width="2" height="3" fill={cfg.primary} />
      <rect x="15" y="5" width="1" height="2" fill="#ff80ab" />
      <rect x="21" y="4" width="2" height="3" fill={cfg.primary} />
      <rect x="22" y="5" width="1" height="2" fill="#ff80ab" />
      <rect x="18" y="7" width="2" height="2" fill={cfg.secondary} />
      <rect x="16" y="10" width="2" height="2" fill={cfg.eye} style={{ animation: "catEyeBlink 4s infinite" }} />
      <rect x="21" y="10" width="2" height="2" fill={cfg.eye} style={{ animation: "catEyeBlink 4s infinite" }} />
      <rect x="19" y="12" width="1" height="1" fill="#ff80ab" />
      <rect x="18" y="13" width="3" height="1" fill={cfg.secondary} />
    </g>
    <g style={isWalking ? { animation: "catLeg1 0.4s ease-in-out infinite" } : {}}>
      <rect x="7" y="22" width="2" height="5" fill={cfg.secondary} />
    </g>
    <g style={isWalking ? { animation: "catLeg2 0.4s ease-in-out infinite" } : {}}>
      <rect x="9" y="22" width="2" height="5" fill={cfg.primary} />
    </g>
    <g style={isWalking ? { animation: "catLeg1 0.4s ease-in-out infinite" } : {}}>
      <rect x="15" y="22" width="2" height="5" fill={cfg.secondary} />
    </g>
    <g style={isWalking ? { animation: "catLeg2 0.4s ease-in-out infinite" } : {}}>
      <rect x="17" y="22" width="2" height="5" fill={cfg.primary} />
    </g>
  </svg>
);

const renderPlayingCat = (cfg) => (
  <svg width="64px" height="64px" viewBox="0 0 32 32" style={{ imageRendering: "pixelated", shapeRendering: "crispEdges", overflow: "visible" }}>
    {renderAccessory(cfg.accessory, cfg, "play")}
    <g style={{ animation: "catTailWiggleFast 0.2s linear infinite", transformOrigin: "3px 18px" }}>
      <rect x="2" y="10" width="2" height="8" fill={cfg.primary} />
    </g>
    <rect x="6" y="17" width="14" height="7" fill={cfg.primary} />
    <rect x="9" y="17" width="1" height="5" fill={cfg.secondary} />
    <rect x="13" y="17" width="1" height="5" fill={cfg.secondary} />
    <rect x="18" y="17" width="3" height="5" fill={cfg.accent} />
    <g style={{ animation: "catHeadBob 0.3s ease-in-out infinite", transformOrigin: "20px 21px" }}>
      <rect x="16" y="12" width="9" height="9" fill={cfg.primary} />
      <rect x="17" y="9" width="3" height="3" fill={cfg.primary} />
      <rect x="18" y="10" width="1" height="2" fill="#ff80ab" />
      <rect x="22" y="9" width="3" height="3" fill={cfg.primary} />
      <rect x="23" y="10" width="1" height="2" fill="#ff80ab" />
      <rect x="18" y="15" width="2" height="2" fill={cfg.eye} />
      <rect x="22" y="15" width="2" height="2" fill={cfg.eye} />
      <rect x="21" y="17" width="1" height="1" fill="#ff80ab" />
    </g>
    <rect x="7" y="24" width="2" height="2" fill={cfg.secondary} />
    <rect x="9" y="24" width="2" height="2" fill={cfg.primary} />
    <rect x="16" y="24" width="2" height="2" fill={cfg.secondary} />
    <rect x="18" y="24" width="2" height="2" fill={cfg.primary} />
  </svg>
);

const renderYarnBall = () => (
  <svg width="24px" height="24px" viewBox="0 0 16 16" style={{ imageRendering: "pixelated", shapeRendering: "crispEdges", animation: "yarnBallWobble 0.8s infinite" }}>
    <rect x="4" y="4" width="8" height="8" fill="#e91e63" rx="2" />
    <rect x="5" y="3" width="6" height="10" fill="#e91e63" />
    <rect x="3" y="5" width="10" height="6" fill="#e91e63" />
    <rect x="5" y="5" width="1" height="6" fill="#c2185b" />
    <rect x="7" y="4" width="1" height="8" fill="#f48fb1" />
    <rect x="9" y="4" width="1" height="8" fill="#c2185b" />
    <path d="M 12 12 Q 14 15, 15 11" stroke="#e91e63" strokeWidth="1.5" fill="none" />
  </svg>
);

const ProfileStyles = () => (
  <style>{`
        /* ============================ */
        /* 1. THUNDER STORM            */
        /* ============================ */
        @keyframes lightningFlash {
          0%, 95%, 98% { opacity: 0; background: transparent; }
          96%, 99% { opacity: 1; background: rgba(255, 255, 255, 0.8); }
          100% { opacity: 0; }
        }
        @keyframes rainFall {
          0% { transform: translate3d(0, -10vh, 0) rotate(15deg); }
          100% { transform: translate3d(0, 110vh, 0) rotate(15deg); }
        }
        @keyframes electricArc {
          0% { clip-path: polygon(0 0, 100% 0, 100% 10%, 0 10%); }
          25% { clip-path: polygon(0 20%, 100% 20%, 100% 30%, 0 30%); }
          50% { clip-path: polygon(0 50%, 100% 50%, 100% 60%, 0 60%); }
          75% { clip-path: polygon(0 80%, 100% 80%, 100% 90%, 0 90%); }
          100% { clip-path: polygon(0 100%, 100% 100%, 100% 90%, 0 90%); }
        }
        @keyframes electricSpin {
          0% { transform: rotate(0deg); filter: hue-rotate(0deg); }
          100% { transform: rotate(360deg); filter: hue-rotate(90deg); }
        }
        
        /* ============================ */
        /* 2. INFERNO AURA             */
        /* ============================ */
        @keyframes plasmaMorph {
          0% { border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%; transform: rotate(0deg) scale(1); }
          34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; transform: rotate(120deg) scale(1.1); }
          67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; transform: rotate(240deg) scale(1.15); }
          100% { border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%; transform: rotate(360deg) scale(1); }
        }
        @keyframes fireEmber {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
          100% { transform: translate3d(0, -40vh, 0) scale(0); opacity: 0; }
        }

        /* ============================ */
        /* 3. MAGICAL GIRL (KAWAII)    */
        /* ============================ */
        @keyframes kawaiiFloat {
          0%, 100% { transform: translateY(0) scale(1) rotate(-5deg); }
          50% { transform: translateY(-15px) scale(1.1) rotate(5deg); }
        }
        @keyframes sparkleFall {
          0% { transform: translate3d(0, -20px, 0) scale(0); opacity: 0; }
          50% { transform: translate3d(0, 150px, 0) scale(1); opacity: 1; }
          100% { transform: translate3d(0, 300px, 0) scale(0); opacity: 0; }
        }
        @keyframes sunburstSpin {
          0% { transform: rotate(0deg) scale(2); }
          100% { transform: rotate(360deg) scale(2); }
        }
        @keyframes cloudBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes snowFall {
          0% { transform: translate3d(0, -10vh, 0) translateX(0) scale(1); opacity: 1; }
          100% { transform: translate3d(50px, 110vh, 0) scale(0.5); opacity: 0; }
        }
        @keyframes matrixScan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes hologramFlicker {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.3; filter: hue-rotate(90deg); }
        }

        /* ============================ */
        /* 4. SAKURA DREAM              */
        /* ============================ */
        @keyframes sakuraSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes sakuraPetalFall {
          0% { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translate3d(100px, 110vh, 0) rotate(360deg); opacity: 0; }
        }
        @keyframes bunnyEarWiggle {
          0%, 100% { transform: rotate(-15deg) scale(1); }
          50% { transform: rotate(-18deg) scale(1.03); }
        }
        @keyframes bunnyEarWiggleRight {
          0%, 100% { transform: rotate(15deg) scale(1); }
          50% { transform: rotate(18deg) scale(1.03); }
        }

        /* ============================ */
        /* 5. CYBERPUNK NEON            */
        /* ============================ */
        @keyframes cyberGridScroll {
          0% { transform: perspective(200px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(200px) rotateX(60deg) translateY(40px); }
        }
        @keyframes neonFlicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
            box-shadow: 0 0 10px #00ffff, 0 0 20px rgba(0, 255, 255, 0.4), inset 0 0 10px #00ffff;
            border-color: #00ffff;
          }
          20%, 24%, 55% {
            box-shadow: none;
            border-color: rgba(0, 255, 255, 0.2);
          }
        }
        @keyframes neonFlickerPink {
          0%, 14%, 16%, 18%, 20%, 64%, 66%, 100% {
            box-shadow: 0 0 10px #ff00ff, 0 0 20px rgba(255, 0, 255, 0.4), inset 0 0 10px #ff00ff;
            border-color: #ff00ff;
          }
          15%, 19%, 65% {
            box-shadow: none;
            border-color: rgba(255, 0, 255, 0.2);
          }
        }
        @keyframes synthwaveSunPulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.15; }
          50% { transform: translateX(-50%) scale(1.05); opacity: 0.25; }
        }

        /* ============================ */
        /* 6. LOFI STUDY                */
        /* ============================ */
        @keyframes vinylSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes lofiNotesRise {
          0% { transform: translate3d(0, 50px, 0) scale(0.8) rotate(0deg); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { transform: translate3d(-40px, -450px, 0) scale(1.1) rotate(15deg); opacity: 0; }
        }
        @keyframes dustFloat {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.2; }
          50% { transform: translate3d(20px, -120px, 0); opacity: 0.7; }
        }
        @keyframes warmLightRay {
          0%, 100% { opacity: 0.08; transform: rotate(-12deg) scaleX(1); }
          50% { opacity: 0.20; transform: rotate(-10deg) scaleX(1.05); }
        }

        /* ============================ */
        /* 7. PIXEL RETRO               */
        /* ============================ */
        @keyframes pixelFloat {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate3d(0, -300px, 0) scale(1); opacity: 0; }
        }
        @keyframes pixelSpinStep {
          0% { transform: rotate(0deg); }
          12.5% { transform: rotate(45deg); }
          25% { transform: rotate(90deg); }
          37.5% { transform: rotate(135deg); }
          50% { transform: rotate(180deg); }
          62.5% { transform: rotate(225deg); }
          75% { transform: rotate(270deg); }
          87.5% { transform: rotate(315deg); }
          100% { transform: rotate(360deg); }
        }

        /* ============================ */
        /* 8. COTTAGECORE FOREST        */
        /* ============================ */
        @keyframes leafFall {
          0% { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 0; }
          15% { opacity: 0.85; }
          85% { opacity: 0.85; }
          100% { transform: translate3d(80px, 110vh, 0) rotate(180deg); opacity: 0; }
        }
        @keyframes fireflyFloat {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          50% { transform: translate(10px, -20px); opacity: 0.95; }
        }

        /* ============================ */
        /* 9. BOBA CAFE                 */
        /* ============================ */
        @keyframes bobaRise {
          0% { transform: translate3d(0, 100px, 0) scale(0.6); opacity: 0; }
          20% { opacity: 0.85; }
          80% { opacity: 0.85; }
          100% { transform: translate3d(0, -300px, 0) scale(1.1); opacity: 0; }
        }
        @keyframes catEarTwitch {
          0%, 90%, 100% { transform: rotate(0deg); }
          92%, 96% { transform: rotate(-5deg); }
          94%, 98% { transform: rotate(5deg); }
        }

        /* ============================ */
        /* 10. BLACKHOLE                */
        /* ============================ */
        @keyframes singularitySwirl {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(0.95); }
          100% { transform: rotate(360deg) scale(1); }
        }

        /* ============================ */
        /* 11. ABYSSAL GLOW             */
        /* ============================ */
        @keyframes jellyPulse {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(0.85) scaleX(1.1); }
        }
        @keyframes abyssRay {
          0%, 100% { opacity: 0.08; transform: rotate(15deg) scaleY(1); }
          50% { opacity: 0.20; transform: rotate(20deg) scaleY(1.1); }
        }

        /* ============================ */
        /* 12. STEAMPUNK GEAR           */
        /* ============================ */
        @keyframes gearSpinClockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gearSpinCounter {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes steamRise {
          0% { transform: translate3d(0, 0, 0) scale(0.8); opacity: 0; }
          10% { opacity: 0.45; }
          90% { opacity: 0.45; }
          100% { transform: translate3d(0, -200px, 0) scale(1.5); opacity: 0; }
        }

        /* ============================ */
        /* 13. CRIMSON MOON             */
        /* ============================ */
        @keyframes batWingsFlutter {
          0%, 100% { transform: scaleX(1) rotate(0deg); }
          50% { transform: scaleX(0.8) rotate(-5deg); }
        }
        @keyframes batWingsFlutterRight {
          0%, 100% { transform: scaleX(1) rotate(0deg); }
          50% { transform: scaleX(0.8) rotate(5deg); }
        }
        @keyframes eclipseGlow {
          0%, 100% { box-shadow: 0 0 20px #ff1744; }
          50% { box-shadow: 0 0 35px #ff1744, 0 0 15px #ff5252; }
        }

        /* ============================ */
        /* 14. VAPOR GLITCH             */
        /* ============================ */
        @keyframes scrollVaporGrid {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
        @keyframes glitchSlice {
          0%, 95%, 100% { clip-path: inset(0 0 0 0); transform: translateX(0); }
          96% { clip-path: inset(20% 0 50% 0); transform: translateX(-5px); }
          98% { clip-path: inset(60% 0 10% 0); transform: translateX(5px); }
        }

        /* ============================ */
        /* PIXEL COMPANION ANIMATIONS  */
        /* ============================ */
        @keyframes catLeg1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes catLeg2 {
          0%, 100% { transform: translateY(-3px); }
          50% { transform: translateY(0); }
        }
        @keyframes catBodyBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }
        @keyframes catHeadBob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-1px) rotate(1deg); }
        }
        @keyframes catTailWiggle {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes catTailWiggleFast {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(20deg); }
        }
        @keyframes catEyeBlink {
          0%, 96%, 100% { opacity: 1; }
          98% { opacity: 0.1; }
        }
        @keyframes catSleepBreath {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.92); }
        }
        @keyframes zzzRise {
          0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translate(15px, -30px) scale(1.1); opacity: 0; }
        }
        @keyframes yarnBallWobble {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(10deg) translateY(-2px); }
        }
        @keyframes speechFade {
          0% { opacity: 0; transform: translateY(10px) scale(0.8); }
          15% { opacity: 1; transform: translateY(0) scale(1); }
          85% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-10px) scale(0.8); }
        }
  `}</style>
);

export default function ProfilePanel({ username, selectedClass, onSurpassLimits }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cosmeticIndex, setCosmeticIndex] = useState(0);

  const profileEffect = profile?.cosmetics?.profileEffect;
  const avatarFrame = profile?.cosmetics?.avatarFrame;

  const savedRoadmapStr = localStorage.getItem(`kaevrix_roadmap_progress_${username}`);
  const savedRoadmap = savedRoadmapStr ? JSON.parse(savedRoadmapStr) : null;
  const isHellMode = savedRoadmap?.difficulty === "Hell";

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const BACKEND_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
      const res = await fetch(`${BACKEND_URL}/api/profile/${username}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        
        // Auto-sync active cosmetic index
        if (data?.cosmetics) {
          const idx = PRESET_COSMETICS.findIndex(
            c => c.profileEffect === data.cosmetics.profileEffect &&
                 c.avatarFrame === data.cosmetics.avatarFrame &&
                 c.banner === data.cosmetics.banner
          );
          if (idx !== -1) {
            setCosmeticIndex(idx);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  // Companion state machine hooks
  const [companionState, setCompanionState] = useState("idle");
  const [companionX, setCompanionX] = useState(30); // percentage (15% to 85%)
  const [companionFacing, setCompanionFacing] = useState("right");
  const [targetX, setTargetX] = useState(30);
  const [yarnX, setYarnX] = useState(null);
  const [speechText, setSpeechText] = useState("");
  const [showSpeech, setShowSpeech] = useState(false);

  // Memoized background particle styles to prevent Math.random() recalculations on walk loop renders
  const particlesConfig = useMemo(() => {
    const configs = {};
    
    // Helper to generate N items with random values
    const makeRandomArray = (count, generator) => {
      const arr = [];
      for (let i = 0; i < count; i++) {
        arr.push(generator(i));
      }
      return arr;
    };

    configs["thunder-storm"] = makeRandomArray(30, () => ({
      left: (Math.random() * 120) - 10,
      height: 20 + Math.random() * 30,
      delay: Math.random(),
      duration: 0.2 + Math.random() * 0.3
    }));

    configs["inferno"] = makeRandomArray(40, () => ({
      left: Math.random() * 100,
      size: 4 + Math.random() * 8,
      color: Math.random() > 0.5 ? "#ffaa00" : "#ff3300",
      delay: Math.random() * 2,
      duration: 1 + Math.random() * 2
    }));

    configs["rage"] = makeRandomArray(50, () => ({
      left: Math.random() * 100,
      size: 4 + Math.random() * 10,
      color: Math.random() > 0.5 ? "#ff0000" : "#550000",
      delay: Math.random() * 2,
      duration: 0.5 + Math.random() * 1.5
    }));

    configs["void"] = makeRandomArray(30, () => ({
      left: Math.random() * 100,
      size: 10 + Math.random() * 20,
      color: Math.random() > 0.5 ? "rgba(138,43,226,0.8)" : "rgba(75,0,130,0.8)",
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3
    }));

    configs["matrix-glitch"] = makeRandomArray(20, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2
    }));

    configs["blizzard"] = makeRandomArray(40, () => ({
      left: Math.random() * 100,
      size: 4 + Math.random() * 6,
      delay: Math.random() * 2,
      duration: 1 + Math.random() * 2
    }));

    configs["magical-girl-hearts"] = makeRandomArray(8, () => ({
      top: Math.random() * 60,
      left: Math.random() * 100,
      fontSize: 20 + Math.random() * 40,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 3
    }));

    configs["magical-girl-sparkles"] = makeRandomArray(20, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2
    }));

    configs["sakura-dream"] = makeRandomArray(24, () => ({
      left: Math.random() * 100,
      fontSize: 12 + Math.random() * 16,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 5
    }));

    configs["lofi-notes"] = makeRandomArray(8, () => ({
      left: 15 + Math.random() * 70,
      fontSize: 18 + Math.random() * 12,
      delay: Math.random() * 6,
      duration: 6 + Math.random() * 4
    }));

    configs["lofi-dust"] = makeRandomArray(15, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 4,
      duration: 8 + Math.random() * 6
    }));

    configs["pixel-retro"] = makeRandomArray(12, () => ({
      left: 10 + Math.random() * 80,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 3
    }));

    configs["cottagecore-leaves"] = makeRandomArray(16, () => ({
      left: Math.random() * 100,
      fontSize: 16 + Math.random() * 10,
      delay: Math.random() * 5,
      duration: 12 + Math.random() * 8
    }));

    configs["cottagecore-fireflies"] = makeRandomArray(12, () => ({
      top: 20 + Math.random() * 70,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 4 + Math.random() * 3
    }));

    configs["boba-cafe-bubbles"] = makeRandomArray(16, () => ({
      left: 5 + Math.random() * 90,
      size: 12 + Math.random() * 12,
      delay: Math.random() * 4,
      duration: 4 + Math.random() * 3
    }));

    configs["boba-cafe-sparkles"] = makeRandomArray(10, () => ({
      top: 20 + Math.random() * 70,
      left: Math.random() * 100,
      duration: 2 + Math.random() * 2
    }));

    configs["blackhole"] = makeRandomArray(30, () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 250 + Math.random() * 350;
      const startX = Math.cos(angle) * distance;
      const startY = Math.sin(angle) * distance;
      return {
        startX,
        startY,
        delay: Math.random() * 2,
        duration: 1.5 + Math.random() * 1.5
      };
    });

    configs["abyssal-glow-bubbles"] = makeRandomArray(18, () => ({
      left: 5 + Math.random() * 90,
      size: 6 + Math.random() * 10,
      delay: Math.random() * 4,
      duration: 6 + Math.random() * 4
    }));

    configs["steampunk-gears"] = makeRandomArray(6, () => ({
      top: 10 + Math.random() * 80,
      left: 5 + Math.random() * 90,
      size: 20 + Math.random() * 20
    }));

    configs["steampunk-steam"] = makeRandomArray(8, () => ({
      left: 10 + Math.random() * 80,
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 3
    }));

    configs["crimson-moon-petals"] = makeRandomArray(15, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 5 + Math.random() * 4
    }));

    configs["crimson-moon-bats"] = makeRandomArray(5, (i) => ({
      top: 20 + Math.random() * 50,
      delay: i * 2
    }));

    configs["vapor-glitch-items"] = makeRandomArray(8, () => ({
      left: 15 + Math.random() * 70,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4
    }));

    return configs;
  }, [profileEffect]);

  const backgroundEffectsElement = useMemo(() => (
    <>
      {/* Thunder Storm Effect */}
      {profileEffect === "thunder-storm" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "400px", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", animation: "lightningFlash 5s infinite", mixBlendMode: "overlay" }} />
          {particlesConfig["thunder-storm"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", top: "-100px", left: p.left + "%", 
              width: "2px", height: p.height + "px", background: "rgba(255,255,255,0.4)",
              animation: "rainFall " + p.duration + "s linear " + p.delay + "s infinite"
            }} />
          ))}
        </div>
      )}

      {/* Inferno Effect */}
      {profileEffect === "inferno" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "300px", background: "linear-gradient(to top, rgba(255,60,0,0.4), transparent)", mixBlendMode: "screen" }} />
          {particlesConfig["inferno"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", bottom: "-20px", left: p.left + "%", 
              width: p.size + "px", height: p.size + "px", 
              background: p.color, borderRadius: "50%", boxShadow: "0 0 10px " + p.color,
              animation: "fireEmber " + p.duration + "s ease-in " + p.delay + "s infinite"
            }} />
          ))}
        </div>
      )}

      {/* Rage Effect */}
      {profileEffect === "rage" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "300px", background: "linear-gradient(to top, rgba(255,0,0,0.4), transparent)", mixBlendMode: "screen" }} />
          {particlesConfig["rage"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", bottom: "-20px", left: p.left + "%", 
              width: p.size + "px", height: p.size + "px", 
              background: p.color, borderRadius: "50%", boxShadow: "0 0 15px " + p.color,
              animation: "fireEmber " + p.duration + "s ease-in " + p.delay + "s infinite"
            }} />
          ))}
        </div>
      )}

      {/* Void Effect */}
      {profileEffect === "void" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "300px", background: "linear-gradient(to top, rgba(138,43,226,0.5), transparent)", mixBlendMode: "screen" }} />
          {particlesConfig["void"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", bottom: "-20px", left: p.left + "%", 
              width: p.size + "px", height: p.size + "px", 
              background: p.color, borderRadius: "50%", filter: "blur(5px)",
              animation: "fireEmber " + p.duration + "s ease-in " + p.delay + "s infinite"
            }} />
          ))}
        </div>
      )}

      {/* Matrix Glitch Effect */}
      {profileEffect === "matrix-glitch" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "10px", background: "rgba(0, 255, 0, 0.4)", boxShadow: "0 0 20px #0f0", animation: "matrixScan 3s linear infinite" }} />
          {particlesConfig["matrix-glitch"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", top: "-50px", left: p.left + "%", color: "#0f0", fontSize: "14px", fontFamily: "monospace", textShadow: "0 0 5px #0f0",
              animation: "rainFall " + p.duration + "s linear " + p.delay + "s infinite"
            }}>10101101</div>
          ))}
        </div>
      )}

      {/* Blizzard Effect */}
      {profileEffect === "blizzard" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          {particlesConfig["blizzard"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", top: "-20px", left: p.left + "%", width: p.size + "px", height: p.size + "px", 
              background: "#fff", borderRadius: "50%", boxShadow: "0 0 10px #fff", animation: "snowFall " + p.duration + "s linear " + p.delay + "s infinite"
            }} />
          ))}
        </div>
      )}

      {/* Magical Girl (Kawaii) Effect */}
      {profileEffect === "magical-girl" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          <div style={{ 
            position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "400px", 
            background: "conic-gradient(from 0deg, rgba(255,182,193,0.4) 0deg 15deg, transparent 15deg 30deg, rgba(173,216,230,0.4) 30deg 45deg, transparent 45deg 60deg, rgba(255,182,193,0.4) 60deg 75deg, transparent 75deg 90deg, rgba(173,216,230,0.4) 90deg 105deg, transparent 105deg 120deg, rgba(255,182,193,0.4) 120deg 135deg, transparent 135deg 150deg, rgba(173,216,230,0.4) 150deg 165deg, transparent 165deg 180deg, rgba(255,182,193,0.4) 180deg 195deg, transparent 195deg 210deg, rgba(173,216,230,0.4) 210deg 225deg, transparent 225deg 240deg, rgba(255,182,193,0.4) 240deg 255deg, transparent 255deg 270deg, rgba(173,216,230,0.4) 270deg 285deg, transparent 285deg 300deg, rgba(255,182,193,0.4) 300deg 315deg, transparent 315deg 330deg, rgba(173,216,230,0.4) 330deg 345deg, transparent 345deg 360deg)",
            animation: "sunburstSpin 30s linear infinite", mixBlendMode: "overlay"
          }} />
          {/* Floating Hearts */}
          {particlesConfig["magical-girl-hearts"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", 
              top: p.top + "%", left: p.left + "%", 
              fontSize: p.fontSize + "px",
              opacity: 0.6,
              animation: "kawaiiFloat " + p.duration + "s ease-in-out " + p.delay + "s infinite"
            }}>💖</div>
          ))}
          {/* Falling Sparkles */}
          {particlesConfig["magical-girl-sparkles"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", 
              top: "-20px", left: p.left + "%", 
              fontSize: "16px", color: "#ffd700",
              animation: "sparkleFall " + p.duration + "s linear " + p.delay + "s infinite"
            }}>✨</div>
          ))}
        </div>
      )}

      {/* Sakura Dream Effect */}
      {profileEffect === "sakura-dream" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          {particlesConfig["sakura-dream"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", top: "-20px", left: p.left + "%", 
              fontSize: p.fontSize + "px",
              animation: "sakuraPetalFall " + p.duration + "s linear " + p.delay + "s infinite",
              opacity: 0.8
            }}>🌸</div>
          ))}
        </div>
      )}

      {/* Cyberpunk Neon Effect */}
      {profileEffect === "cyberpunk-neon" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          {/* Retro Neon Sun */}
          <div style={{ 
            position: "absolute", top: "40px", left: "50%",
            width: "320px", height: "160px", 
            background: "linear-gradient(to bottom, #ff007f 0%, #ffaa00 100%)",
            borderRadius: "160px 160px 0 0",
            animation: "synthwaveSunPulse 6s ease-in-out infinite",
            zIndex: -1
          }}>
            {/* Horizontal sun slices */}
            {[...Array(6)].map((_, i) => (
               <div key={i} style={{ 
                 position: "absolute", bottom: (i * 12) + "px", left: 0, width: "100%", height: (2 + i) + "px", background: "var(--bg-dark-base)" 
               }} />
            ))}
          </div>
          
          {/* Perspective Cyber Grid */}
          <div style={{ 
            position: "absolute", bottom: 0, left: "-50%", width: "200%", height: "350px", 
            backgroundImage: "linear-gradient(rgba(0, 255, 255, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            transformOrigin: "top center",
            animation: "cyberGridScroll 2s linear infinite",
            maskImage: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            opacity: 0.35, zIndex: -1
          }} />
        </div>
      )}

      {/* Lo-Fi Study Effect */}
      {profileEffect === "lofi-study" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          {/* Warm Cafe Window Light Ray */}
          <div style={{ 
            position: "absolute", top: "-10%", left: "-10%", width: "60%", height: "120%", 
            background: "linear-gradient(105deg, rgba(245, 230, 211, 0.08) 0%, transparent 60%)",
            transformOrigin: "top left",
            animation: "warmLightRay 8s ease-in-out infinite",
            zIndex: -1
          }} />
          
          {/* Rising chill music notes */}
          {particlesConfig["lofi-notes"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", bottom: "-20px", left: p.left + "%", 
              fontSize: p.fontSize + "px", color: "#f5e6d3",
              animation: "lofiNotesRise " + p.duration + "s linear " + p.delay + "s infinite",
              opacity: 0.45
            }}>{i % 2 === 0 ? "🎵" : "🎶"}</div>
          ))}
          
          {/* Floating dust motes in the warm light */}
          {particlesConfig["lofi-dust"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", 
              top: p.top + "%", left: p.left + "%", 
              width: p.size + "px", height: p.size + "px", 
              background: "#f5e6d3", borderRadius: "50%",
              boxShadow: "0 0 6px #f5e6d3",
              animation: "dustFloat " + p.duration + "s ease-in-out " + p.delay + "s infinite",
              opacity: 0.35
            }} />
          ))}
        </div>
      )}

      {/* Pixel Retro Effect */}
      {profileEffect === "pixel-retro" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          {/* Floating pixel coins and hearts */}
          {particlesConfig["pixel-retro"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", bottom: "-20px", left: p.left + "%", 
              fontSize: "20px",
              animation: "pixelFloat " + p.duration + "s linear " + p.delay + "s infinite",
              fontFamily: "monospace"
            }}>{i % 2 === 0 ? "🪙" : "❤️"}</div>
          ))}
          {/* Pixel grid scan overlay */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(18, 10, 42, 0.15) 2px, transparent 2px)", backgroundSize: "100% 4px", zIndex: 2 }} />
        </div>
      )}

      {/* Cottagecore Forest Effect */}
      {profileEffect === "cottagecore-forest" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          {/* Falling Autumn Leaves */}
          {particlesConfig["cottagecore-leaves"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", top: "-20px", left: p.left + "%", 
              fontSize: p.fontSize + "px",
              animation: "leafFall " + p.duration + "s linear " + p.delay + "s infinite",
              opacity: 0.75
            }}>{i % 2 === 0 ? "🍁" : "🍂"}</div>
          ))}
          {/* Fireflies floating around */}
          {particlesConfig["cottagecore-fireflies"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", 
              top: p.top + "%", left: p.left + "%", 
              width: "6px", height: "6px", borderRadius: "50%", background: "#d4e157",
              boxShadow: "0 0 12px #d4e157",
              animation: "fireflyFloat " + p.duration + "s ease-in-out " + p.delay + "s infinite",
            }} />
          ))}
        </div>
      )}

      {/* Boba Cafe Effect */}
      {profileEffect === "boba-cafe" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          {/* Floating Boba Bubbles */}
          {particlesConfig["boba-cafe-bubbles"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", bottom: "-30px", left: p.left + "%", 
              width: p.size + "px", height: p.size + "px", 
              background: "rgba(92, 58, 33, 0.65)", borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.4)",
              boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.4)",
              animation: "bobaRise " + p.duration + "s ease-in " + p.delay + "s infinite"
            }} />
          ))}
          {/* Cute floating sparkles */}
          {particlesConfig["boba-cafe-sparkles"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", top: p.top + "%", left: p.left + "%", 
              fontSize: "16px", color: "#ffd54f", animation: "kawaiiFloat " + p.duration + "s ease-in-out infinite"
            }}>✨</div>
          ))}
        </div>
      )}

      {/* Blackhole Effect */}
      {profileEffect === "blackhole" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          {/* Gravity pulls (stardust streams towards avatar center) */}
          {particlesConfig["blackhole"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", 
              top: "40%", left: "30%", 
              width: "4px", height: "4px", background: "cyan", borderRadius: "50%",
              boxShadow: "0 0 10px cyan",
              animation: "gravityPull " + p.duration + "s linear " + p.delay + "s infinite",
              "--startX": p.startX + "px",
              "--startY": p.startY + "px"
            }} />
          ))}
        </div>
      )}

      {/* Abyssal Glow Effect */}
      {profileEffect === "abyssal-glow" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          {/* Deep marine rays */}
          <div style={{ 
            position: "absolute", top: "-10%", left: "20%", width: "50%", height: "120%", 
            background: "linear-gradient(105deg, rgba(0, 229, 255, 0.06) 0%, transparent 60%)",
            transformOrigin: "top left",
            animation: "abyssRay 9s ease-in-out infinite",
            zIndex: -1
          }} />
          {/* Bioluminescent rising bubbles */}
          {particlesConfig["abyssal-glow-bubbles"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", bottom: "-20px", left: p.left + "%", 
              width: p.size + "px", height: p.size + "px", 
              background: "transparent", border: "1.5px solid rgba(0, 255, 255, 0.3)", borderRadius: "50%",
              boxShadow: "0 0 8px rgba(0, 255, 255, 0.2)",
              animation: "bobaRise " + p.duration + "s ease-in-out " + p.delay + "s infinite"
            }} />
          ))}
        </div>
      )}

      {/* Steampunk Airship Effect */}
      {profileEffect === "steampunk-gear" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          {/* Floating Clockwork gears */}
          {particlesConfig["steampunk-gears"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", 
              top: p.top + "%", left: p.left + "%", 
              fontSize: p.size + "px", color: "rgba(255, 183, 77, 0.25)",
              animation: (i % 2 === 0 ? "gearSpinClockwise" : "gearSpinCounter") + " 10s linear infinite"
            }}>⚙️</div>
          ))}
          {/* Rising puffs of steam */}
          {particlesConfig["steampunk-steam"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", bottom: "-30px", left: p.left + "%", 
              width: "40px", height: "40px", background: "rgba(255,255,255,0.06)", borderRadius: "50%",
              filter: "blur(12px)",
              animation: "steamRise " + p.duration + "s ease-out " + p.delay + "s infinite"
            }} />
          ))}
        </div>
      )}

      {/* Crimson Moon Effect */}
      {profileEffect === "crimson-moon" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          {/* Red Eclipse Moon Glow */}
          <div style={{ 
            position: "absolute", top: "50px", right: "120px", 
            width: "100px", height: "100px", borderRadius: "50%", 
            background: "#080304", 
            border: "2px solid #ff1744",
            animation: "eclipseGlow 4s ease-in-out infinite",
            zIndex: -1
          }} />
          {/* Falling dark red rose petals */}
          {particlesConfig["crimson-moon-petals"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", top: "-20px", left: p.left + "%", 
              fontSize: "18px",
              animation: "sakuraPetalFall " + p.duration + "s linear " + p.delay + "s infinite",
              opacity: 0.65
            }}>🌹</div>
          ))}
          {/* Small flying bat silhouettes */}
          {particlesConfig["crimson-moon-bats"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", top: p.top + "%", left: "-50px",
              fontSize: "20px", color: "rgba(0,0,0,0.65)",
              animation: "rainFall 6s linear " + p.delay + "s infinite",
              transform: "rotate(-75deg)"
            }}>🦇</div>
          ))}
        </div>
      )}

      {/* Vapor Glitch Effect */}
      {profileEffect === "vapor-glitch" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          {/* Horizontal glitch scanner line */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "2px", background: "#ff007f", boxShadow: "0 0 10px #ff007f", animation: "matrixScan 4s linear infinite" }} />
          {/* Scrolling horizontal grid background */}
          <div style={{ 
            position: "absolute", inset: 0, 
            backgroundImage: "linear-gradient(rgba(0, 229, 255, 0.08) 1px, transparent 1px)",
            backgroundSize: "100% 30px",
            animation: "scrollVaporGrid 3s linear infinite",
            zIndex: -1
          }} />
          {/* Floating retro neon items */}
          {particlesConfig["vapor-glitch-items"]?.map((p, i) => (
            <div key={i} style={{ 
              position: "absolute", bottom: "-20px", left: p.left + "%", 
              fontSize: "24px",
              animation: "pixelFloat " + p.duration + "s linear " + p.delay + "s infinite",
              opacity: 0.55
            }}>{i % 2 === 0 ? "💾" : "🌴"}</div>
          ))}
        </div>
      )}
    </>
  ), [profileEffect, particlesConfig]);

  // Auto-dismiss speech bubble
  useEffect(() => {
    if (showSpeech) {
      const timer = setTimeout(() => {
        setShowSpeech(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSpeech]);

  // Periodic Companion Decider Loop
  useEffect(() => {
    let deciderTimer;
    
    const tickDecider = () => {
      const delay = 6000 + Math.random() * 6000;
      
      deciderTimer = setTimeout(() => {
        setCompanionState(current => {
          if (current === "play" || yarnX !== null) {
            tickDecider();
            return current;
          }
          
          const rand = Math.random();
          if (rand < 0.45) {
            const newTarget = 15 + Math.random() * 70;
            setTargetX(newTarget);
            return "walk";
          } else if (rand < 0.75) {
            return "sleep";
          } else {
            return "idle";
          }
        });
        tickDecider();
      }, delay);
    };
    
    tickDecider();
    return () => clearTimeout(deciderTimer);
  }, [yarnX]);

  // Companion Movement Tick Loop
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setCompanionState(state => {
        if (state === "sleep" || state === "idle") {
          return state;
        }
        
        let reached = false;
        setCompanionX(cx => {
          const diff = targetX - cx;
          const speed = state === "play" ? 1.5 : 0.7;
          
          if (Math.abs(diff) <= speed) {
            reached = true;
            return targetX;
          }
          
          const nextFacing = diff > 0 ? "right" : "left";
          setCompanionFacing(nextFacing);
          return cx + (diff > 0 ? speed : -speed);
        });
        
        if (reached) {
          if (state === "play") {
            setTimeout(() => {
              setYarnX(null);
              setCompanionState("idle");
            }, 4000);
            return "play";
          }
          return "idle";
        }
        
        return state;
      });
    }, 60);

    return () => clearInterval(moveInterval);
  }, [targetX, companionState]);

  // Interactive handler: click on floor to drop yarn
  const handleFloorClick = (e) => {
    if (e.target !== e.currentTarget) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentX = Math.max(15, Math.min(85, (clickX / rect.width) * 100));
    
    setYarnX(percentX);
    setTargetX(percentX);
    setCompanionState("play");
    
    if (sound && typeof sound.playClockTick === "function") {
      sound.playClockTick(true);
    }
  };

  // Interactive handler: click on cat
  const handleCatClick = (e) => {
    e.stopPropagation();
    
    const phrases = ["nya~", "purr...", "mew!", "*nuzzle*", "feed me!", "pet me!", "hug!", "hi master!", "zZZ... nya?"];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    if (companionState === "sleep") {
      setCompanionState("idle");
      setSpeechText("yawn... hello!");
    } else {
      setSpeechText(randomPhrase);
      const oldState = companionState;
      setCompanionState("play");
      setTimeout(() => {
        setCompanionState(oldState);
      }, 1500);
    }
    
    setShowSpeech(true);
    if (sound && typeof sound.playCorrect === "function") {
      sound.playCorrect();
    }
  };

  const level = profile ? profile.level : 1;
  const xp = profile ? profile.xp : 0;
  const xpProgress = (xp % 200) / 200 * 100;
  const skills = profile?.skills || [];
  
  const totalMatches = profile ? profile.wins + profile.losses : 0;
  const winRate = totalMatches > 0 ? Math.round((profile.wins / totalMatches) * 100) : 0;
  const watchTime = Math.floor((profile?.totalWatchTime || 0) / 60);

  // Apply aura background and styling to document body dynamically
  useEffect(() => {
    document.body.style.transition = "background 0.5s ease, background-color 0.5s ease, color 0.5s ease";

    if (!profileEffect) {
      document.body.style.removeProperty("background");
      document.body.style.removeProperty("--text-light");
      document.body.style.removeProperty("--text-muted");
      document.body.style.removeProperty("--bg-dark-base");
      document.body.style.removeProperty("--bg-dark-surface");
      return;
    }

    if (["rage", "void", "inferno", "matrix-glitch", "blizzard", "thunder-storm", "cyberpunk-neon", "blackhole", "abyssal-glow", "steampunk-gear", "crimson-moon", "vapor-glitch"].includes(profileEffect)) {
      document.body.style.setProperty("--text-light", "#ffffff");
      document.body.style.setProperty("--text-muted", "rgba(255, 255, 255, 0.6)");
      document.body.style.setProperty("--bg-dark-base", "rgba(0, 0, 0, 0.5)");
      document.body.style.setProperty("--bg-dark-surface", "rgba(0, 0, 0, 0.5)");
    } else if (profileEffect === "magical-girl") {
      document.body.style.setProperty("--text-light", "#d81b60");
      document.body.style.setProperty("--text-muted", "#f06292");
      document.body.style.setProperty("--bg-dark-base", "#ffe4e1");
      document.body.style.setProperty("--bg-dark-surface", "#fff0f5");
    } else if (profileEffect === "sakura-dream") {
      document.body.style.setProperty("--text-light", "#880e4f");
      document.body.style.setProperty("--text-muted", "#ad1457");
      document.body.style.setProperty("--bg-dark-base", "#fff3f5");
      document.body.style.setProperty("--bg-dark-surface", "#fff8fa");
    } else if (profileEffect === "lofi-study") {
      document.body.style.setProperty("--text-light", "#f5e6d3");
      document.body.style.setProperty("--text-muted", "#a89f91");
      document.body.style.setProperty("--bg-dark-base", "rgba(0, 0, 0, 0.4)");
      document.body.style.setProperty("--bg-dark-surface", "rgba(0, 0, 0, 0.4)");
    } else if (profileEffect === "pixel-retro") {
      document.body.style.setProperty("--text-light", "#ffeb3b");
      document.body.style.setProperty("--text-muted", "#80deea");
      document.body.style.setProperty("--bg-dark-base", "#120a2a");
      document.body.style.setProperty("--bg-dark-surface", "#1e113a");
    } else if (profileEffect === "cottagecore-forest") {
      document.body.style.setProperty("--text-light", "#f5f5dc");
      document.body.style.setProperty("--text-muted", "#aed581");
      document.body.style.setProperty("--bg-dark-base", "#0f140f");
      document.body.style.setProperty("--bg-dark-surface", "#161f16");
    } else if (profileEffect === "boba-cafe") {
      document.body.style.setProperty("--text-light", "#5c3a21");
      document.body.style.setProperty("--text-muted", "#a87c5b");
      document.body.style.setProperty("--bg-dark-base", "#fbf3e6");
      document.body.style.setProperty("--bg-dark-surface", "#fffdfa");
    }

    if (profileEffect === "rage") {
      document.body.style.background = "linear-gradient(135deg, #180909 0%, #0c0404 100%)";
    } else if (profileEffect === "void") {
      document.body.style.background = "linear-gradient(135deg, #130a1c 0%, #09040d 100%)";
    } else if (profileEffect === "inferno") {
      document.body.style.background = "linear-gradient(135deg, #1a0f08 0%, #0d0704 100%)";
    } else if (profileEffect === "matrix-glitch") {
      document.body.style.background = "linear-gradient(135deg, #090d09 0%, #040604 100%)";
      document.body.style.setProperty("--text-light", "#00ff00");
    } else if (profileEffect === "blizzard") {
      document.body.style.background = "linear-gradient(135deg, #0a111a 0%, #05080c 100%)";
    } else if (profileEffect === "thunder-storm") {
      document.body.style.background = "linear-gradient(135deg, #0d0f17 0%, #06070a 100%)";
    } else if (profileEffect === "magical-girl") {
      document.body.style.background = "linear-gradient(135deg, #fff5f7 0%, #ffebee 100%)";
    } else if (profileEffect === "sakura-dream") {
      document.body.style.background = "linear-gradient(135deg, #fff5f7 0%, #ffebee 100%)";
    } else if (profileEffect === "cyberpunk-neon") {
      document.body.style.background = "linear-gradient(135deg, #0d0614 0%, #030107 100%)";
      document.body.style.setProperty("--text-light", "#00ffff");
      document.body.style.setProperty("--text-muted", "#ff00ff");
    } else if (profileEffect === "lofi-study") {
      document.body.style.background = "linear-gradient(135deg, #131110 0%, #0b0a09 100%)";
    } else if (profileEffect === "pixel-retro") {
      document.body.style.background = "linear-gradient(135deg, #160c2e 0%, #080313 100%)";
    } else if (profileEffect === "cottagecore-forest") {
      document.body.style.background = "linear-gradient(135deg, #0e140e 0%, #050805 100%)";
    } else if (profileEffect === "boba-cafe") {
      document.body.style.background = "linear-gradient(135deg, #fdf5e6 0%, #f5deb3 100%)";
    } else if (profileEffect === "blackhole") {
      document.body.style.background = "radial-gradient(circle at center, #0c0014 0%, #000000 100%)";
    } else if (profileEffect === "abyssal-glow") {
      document.body.style.background = "linear-gradient(135deg, #030a18 0%, #010308 100%)";
      document.body.style.setProperty("--text-light", "#00ffff");
      document.body.style.setProperty("--text-muted", "#00b0ff");
    } else if (profileEffect === "steampunk-gear") {
      document.body.style.background = "linear-gradient(135deg, #17100e 0%, #0a0706 100%)";
      document.body.style.setProperty("--text-light", "#ffd54f");
      document.body.style.setProperty("--text-muted", "#ffb74d");
    } else if (profileEffect === "crimson-moon") {
      document.body.style.background = "linear-gradient(135deg, #120508 0%, #060203 100%)";
      document.body.style.setProperty("--text-light", "#ff1744");
      document.body.style.setProperty("--text-muted", "#b0bec5");
    } else if (profileEffect === "vapor-glitch") {
      document.body.style.background = "linear-gradient(135deg, #10061e 0%, #05020a 100%)";
      document.body.style.setProperty("--text-light", "#ff007f");
      document.body.style.setProperty("--text-muted", "#00e5ff");
    }

    return () => {
      document.body.style.removeProperty("background");
      document.body.style.removeProperty("--text-light");
      document.body.style.removeProperty("--text-muted");
      document.body.style.removeProperty("--bg-dark-base");
      document.body.style.removeProperty("--bg-dark-surface");
      document.body.style.removeProperty("transition");
    };
  }, [profileEffect]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div style={{ width: "2px", height: "40px", background: "var(--neon-orange)", animation: "pulse 1s infinite" }} />
      </div>
    );
  }

  const handleCycleCosmetics = async () => {
    const nextIndex = (cosmeticIndex + 1) % PRESET_COSMETICS.length;
    const nextCosmetics = PRESET_COSMETICS[nextIndex];
    setCosmeticIndex(nextIndex);
    
    try {
      const BACKEND_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
      const res = await fetch(`${BACKEND_URL}/api/profile/cosmetics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, ...nextCosmetics })
      });
      if (res.ok) fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper for dynamic frame styling (fallback if no complex overlay)
  const getAvatarFrameStyle = (frame) => {
    if (frame === "neon-pulse") return { border: "3px solid var(--neon-blue)", boxShadow: "0 0 15px var(--neon-blue)", animation: "pulse 2s infinite" };
    return { border: "2px solid var(--neon-orange)" }; // Default
  };

  const bannerUrl = profile?.cosmetics?.banner;
  const bannerBackground = bannerUrl === "none"
    ? "transparent"
    : bannerUrl 
      ? `url(${bannerUrl}) center/cover no-repeat` 
      : "linear-gradient(135deg, rgba(255,106,0,0.8) 0%, rgba(255,59,48,0.4) 100%)";

  const getRootStyle = () => {
    return { 
      flex: 1, overflowY: "auto", height: "100%", display: "flex", 
      flexDirection: "column", paddingBottom: "60px", position: "relative"
    };
  };

  return (
    <div style={getRootStyle()}>
      


      <ProfileStyles />

      {/* --- BACKGROUND PROFILE EFFECTS --- */}
      {backgroundEffectsElement}

      {/* 1. CUSTOMIZABLE BANNER SECTION */}
      <div style={{ 
        width: "100%", height: "240px", 
        background: bannerBackground,
        position: "relative",
        borderBottom: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ position: "absolute", top: "20px", right: "30px", display: "flex", gap: "12px" }}>
          <button onClick={handleCycleCosmetics} style={{ 
            background: "rgba(59,130,246,0.5)", border: "1px solid rgba(59,130,246,0.8)", 
            color: "#fff", padding: "8px 16px", borderRadius: "20px", fontSize: "12px", 
            fontWeight: "800", cursor: "pointer", backdropFilter: "blur(4px)"
          }}>
            DEV: CYCLE COSMETICS
          </button>
          <button style={{ 
            background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", 
            color: "#fff", padding: "8px 16px", borderRadius: "20px", fontSize: "12px", 
            fontWeight: "800", cursor: "pointer", backdropFilter: "blur(4px)"
          }}>
            EDIT BANNER
          </button>
        </div>
      </div>

      {/* 2. PROFILE BODY (No Boxes, Pure Layout) */}
      <div style={{ padding: "0 60px", position: "relative" }}>
        
        {/* Identity Row: Overlapping Avatar & Name */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "30px", marginTop: "-70px", marginBottom: "40px" }}>
          
          {/* Avatar Container with Intense Decorations */}
          <div style={{ 
            width: "160px", height: "160px", borderRadius: "50%", 
            background: "var(--bg-dark-base)", 
            padding: "8px", position: "relative", zIndex: 10
          }}>
            
            {/* --- AVATAR EFFECTS --- */}
            
            {avatarFrame === "inferno-aura" && (
              <>
                <div style={{ position: "absolute", top: "-30px", left: "-30px", right: "-30px", bottom: "-30px", background: "linear-gradient(45deg, #ff0000, #ff7300, #fffb00)", mixBlendMode: "screen", filter: "blur(15px)", animation: "plasmaMorph 3s linear infinite", zIndex: -1 }} />
                <div style={{ position: "absolute", top: "-15px", left: "-15px", right: "-15px", bottom: "-15px", background: "linear-gradient(45deg, #ff7300, #ff0000)", mixBlendMode: "screen", filter: "blur(8px)", animation: "plasmaMorph 2s linear reverse infinite", zIndex: -1 }} />
              </>
            )}

            {avatarFrame === "rage-aura" && (
              <>
                <div style={{ position: "absolute", top: "-30px", left: "-30px", right: "-30px", bottom: "-30px", background: "linear-gradient(45deg, #8b0000, #ff0000, #330000)", mixBlendMode: "screen", filter: "blur(15px)", animation: "plasmaMorph 2s linear infinite", zIndex: -1 }} />
                <div style={{ position: "absolute", top: "-15px", left: "-15px", right: "-15px", bottom: "-15px", background: "linear-gradient(45deg, #ff0000, #8b0000)", mixBlendMode: "screen", filter: "blur(8px)", animation: "plasmaMorph 1.5s linear reverse infinite", zIndex: -1 }} />
              </>
            )}

            {avatarFrame === "void-aura" && (
              <>
                <div style={{ position: "absolute", top: "-35px", left: "-35px", right: "-35px", bottom: "-35px", background: "linear-gradient(45deg, #8a2be2, #4b0082, #ff00ff)", mixBlendMode: "screen", filter: "blur(20px)", animation: "plasmaMorph 4s linear infinite", zIndex: -1 }} />
                <div style={{ position: "absolute", top: "-20px", left: "-20px", right: "-20px", bottom: "-20px", background: "linear-gradient(45deg, #4b0082, #8a2be2)", mixBlendMode: "screen", filter: "blur(12px)", animation: "plasmaMorph 3s linear reverse infinite", zIndex: -1 }} />
              </>
            )}

            {avatarFrame === "lightning-strike" && (
              <>
                <div style={{ position: "absolute", top: "-15px", left: "-15px", right: "-15px", bottom: "-15px", border: "4px solid cyan", borderRadius: "50%", animation: "electricSpin 0.5s steps(4) infinite", filter: "blur(2px)", mixBlendMode: "screen" }} />
                <div style={{ position: "absolute", top: "-5px", left: "-5px", right: "-5px", bottom: "-5px", border: "2px solid white", borderRadius: "50%", animation: "electricArc 0.1s linear infinite" }} />
                <div style={{ position: "absolute", top: "-10px", left: "50%", width: "4px", height: "30px", background: "white", boxShadow: "0 0 10px cyan", transform: "translateX(-50%) rotate(45deg)", animation: "lightningFlash 1s infinite" }} />
              </>
            )}

            {avatarFrame === "kawaii-clouds" && (
              <>
                {/* Cloud Border */}
                <div style={{ position: "absolute", top: "-20px", left: "-20px", right: "-20px", bottom: "-20px", background: "white", borderRadius: "50%", filter: "drop-shadow(0 0 15px rgba(255,182,193,0.8))", animation: "cloudBounce 3s ease-in-out infinite", zIndex: -1 }}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} style={{ position: "absolute", width: "60px", height: "60px", background: "white", borderRadius: "50%", top: (Math.sin(i * Math.PI / 4) * 85 + 70) + "px", left: (Math.cos(i * Math.PI / 4) * 85 + 70) + "px" }} />
                  ))}
                </div>
                {/* Cute Ribbons */}
                <div style={{ position: "absolute", top: "50%", left: "-45px", fontSize: "40px", transform: "translateY(-50%) scaleX(-1) rotate(-15deg)", animation: "kawaiiFloat 2s ease-in-out infinite" }}>🎀</div>
                <div style={{ position: "absolute", top: "50%", right: "-45px", fontSize: "40px", transform: "translateY(-50%) rotate(15deg)", animation: "kawaiiFloat 2s ease-in-out 0.5s infinite" }}>🎀</div>
                {/* Extra Sparkles */}
                <div style={{ position: "absolute", top: "-10px", left: "0px", fontSize: "20px", animation: "kawaiiFloat 1.5s ease-in-out 0.2s infinite" }}>🌸</div>
                <div style={{ position: "absolute", bottom: "-10px", right: "0px", fontSize: "20px", animation: "kawaiiFloat 1.8s ease-in-out 0.7s infinite" }}>🌸</div>
              </>
            )}

            {avatarFrame === "hologram-ring" && (
              <>
                <div style={{ position: "absolute", top: "-10px", left: "-10px", right: "-10px", bottom: "-10px", border: "2px solid #0f0", borderRadius: "50%", animation: "hologramFlicker 2s infinite", filter: "blur(2px)", mixBlendMode: "screen" }} />
                <div style={{ position: "absolute", top: "-5px", left: "-5px", right: "-5px", bottom: "-5px", border: "4px dashed #0f0", borderRadius: "50%", animation: "electricSpin 4s linear infinite" }} />
                <div style={{ position: "absolute", top: "-20px", left: "0", right: "0", height: "5px", background: "#0f0", boxShadow: "0 0 15px #0f0", animation: "matrixScan 2s linear infinite" }} />
              </>
            )}

            {avatarFrame === "frost-ring" && (
              <>
                <div style={{ position: "absolute", top: "-15px", left: "-15px", right: "-15px", bottom: "-15px", border: "4px solid rgba(173,216,230,0.8)", borderRadius: "50%", filter: "blur(4px)", animation: "plasmaMorph 5s linear infinite" }} />
                <div style={{ position: "absolute", top: "-5px", left: "-5px", right: "-5px", bottom: "-5px", border: "2px dotted white", borderRadius: "50%", animation: "electricSpin 10s linear infinite" }} />
              </>
            )}

            {avatarFrame === "sakura-bunny" && (
              <>
                {/* Wiggling Bunny Ears */}
                <div style={{ 
                  position: "absolute", top: "-45px", left: "15px", width: "30px", height: "70px", 
                  background: "#ffffff", border: "5px solid #ff80ab", borderRadius: "50% 50% 0 0", 
                  transform: "rotate(-15deg)", transformOrigin: "bottom center", 
                  animation: "bunnyEarWiggle 3s ease-in-out infinite", zIndex: 1 
                }}>
                  <div style={{ width: "12px", height: "45px", background: "#ff80ab", borderRadius: "50% 50% 0 0", margin: "10px auto 0" }} />
                </div>
                <div style={{ 
                  position: "absolute", top: "-45px", right: "15px", width: "30px", height: "70px", 
                  background: "#ffffff", border: "5px solid #ff80ab", borderRadius: "50% 50% 0 0", 
                  transform: "rotate(15deg)", transformOrigin: "bottom center", 
                  animation: "bunnyEarWiggleRight 3s ease-in-out 0.3s infinite", zIndex: 1 
                }}>
                  <div style={{ width: "12px", height: "45px", background: "#ff80ab", borderRadius: "50% 50% 0 0", margin: "10px auto 0" }} />
                </div>
                {/* Spin Sakura Blossom outline */}
                <div style={{ 
                  position: "absolute", inset: "-15px", border: "4px dashed #ff80ab", borderRadius: "50%", 
                  animation: "sakuraSpin 15s linear infinite", filter: "drop-shadow(0 0 8px #ff80ab)" 
                }} />
                {/* Cute Floating Blossoms */}
                <div style={{ position: "absolute", top: "-5px", left: "-5px", fontSize: "22px", animation: "kawaiiFloat 2s ease-in-out infinite" }}>🌸</div>
                <div style={{ position: "absolute", bottom: "-5px", right: "-5px", fontSize: "22px", animation: "kawaiiFloat 2.5s ease-in-out infinite" }}>🌸</div>
              </>
            )}

            {avatarFrame === "synth-ring" && (
              <>
                {/* Cyan outer ring */}
                <div style={{ 
                  position: "absolute", inset: "-15px", border: "3px solid #00ffff", borderRadius: "50%", 
                  animation: "sakuraSpin 4s linear infinite, neonFlicker 3s infinite", zIndex: 1 
                }} />
                {/* Pink inner ring */}
                <div style={{ 
                  position: "absolute", inset: "-8px", border: "3px solid #ff00ff", borderRadius: "50%", 
                  animation: "sakuraSpin 6s linear reverse infinite, neonFlickerPink 4s infinite", zIndex: 1 
                }} />
                {/* Grid dots behind */}
                <div style={{ 
                  position: "absolute", inset: "-25px", background: "radial-gradient(circle, rgba(0,255,255,0.2) 2px, transparent 4px)", 
                  backgroundSize: "10px 10px", borderRadius: "50%", filter: "blur(2px)", zIndex: -1 
                }} />
              </>
            )}

            {avatarFrame === "vinyl-glow" && (
              <>
                {/* Rotating Vinyl Record Frame */}
                <div style={{ 
                  position: "absolute", inset: "-22px", 
                  background: "repeating-radial-gradient(circle, #1c1917, #1c1917 4px, #0c0a09 5px, #0c0a09 8px)", 
                  border: "2px solid #d97706", borderRadius: "50%", 
                  animation: "vinylSpin 12s linear infinite", 
                  boxShadow: "0 0 20px rgba(217,119,6,0.45)", zIndex: -1 
                }}>
                  <div style={{ position: "absolute", inset: "25px", border: "2px solid rgba(217,119,6,0.3)", borderRadius: "50%" }} />
                </div>
                {/* Floating gold music notes */}
                <div style={{ position: "absolute", top: "-10px", left: "-10px", fontSize: "20px", color: "#d97706", animation: "kawaiiFloat 2s ease-in-out infinite" }}>🎵</div>
                <div style={{ position: "absolute", bottom: "-10px", right: "-10px", fontSize: "20px", color: "#d97706", animation: "kawaiiFloat 3s ease-in-out infinite" }}>🎶</div>
              </>
            )}

            {avatarFrame === "pixel-crown" && (
              <>
                {/* 8-bit gold Crown floating */}
                <div style={{ position: "absolute", top: "-32px", left: "50%", transform: "translateX(-50%) scale(0.9)", animation: "kawaiiFloat 3s ease-in-out infinite", zIndex: 11, fontSize: "40px" }}>👑</div>
                <div style={{ position: "absolute", inset: "-12px", border: "4px dotted #ffeb3b", borderRadius: "50%", animation: "pixelSpinStep 8s steps(8) infinite" }} />
              </>
            )}

            {avatarFrame === "vine-wreath" && (
              <>
                {/* Mossy, leaf-woven border */}
                <div style={{ position: "absolute", inset: "-15px", border: "4px double #aed581", borderRadius: "50%", filter: "drop-shadow(0 0 5px rgba(174,213,129,0.5))", animation: "vinylSpin 25s linear infinite" }} />
                <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", fontSize: "18px" }}>🌿</div>
                <div style={{ position: "absolute", bottom: "-14px", left: "50%", transform: "translateX(-50%)", fontSize: "18px" }}>🌿</div>
                <div style={{ position: "absolute", left: "-14px", top: "50%", transform: "translateY(-50%) rotate(90deg)", fontSize: "18px" }}>🌿</div>
                <div style={{ position: "absolute", right: "-14px", top: "50%", transform: "translateY(-50%) rotate(-90deg)", fontSize: "18px" }}>🌿</div>
                {/* Glowing fireflies */}
                <div style={{ position: "absolute", top: "10px", left: "-5px", width: "5px", height: "5px", borderRadius: "50%", background: "#ffd54f", boxShadow: "0 0 8px #ffd54f", animation: "fireflyFloat 3s ease-in-out infinite" }} />
                <div style={{ position: "absolute", bottom: "10px", right: "-5px", width: "5px", height: "5px", borderRadius: "50%", background: "#ffd54f", boxShadow: "0 0 8px #ffd54f", animation: "fireflyFloat 4s ease-in-out 1s infinite" }} />
              </>
            )}

            {avatarFrame === "boba-ears" && (
              <>
                {/* Wiggling Cat ears */}
                <div style={{ position: "absolute", top: "-15px", left: "15px", width: "40px", height: "40px", background: "#fbf3e6", border: "4px solid #5c3a21", borderRightWidth: 0, borderBottomWidth: 0, borderRadius: "20px 0 0 0", transform: "skewY(-30deg) rotate(-15deg)", transformOrigin: "bottom right", animation: "catEarTwitch 5s ease-in-out infinite", zIndex: 1 }}>
                  <div style={{ position: "absolute", inset: "6px", background: "#ff80ab", borderRadius: "10px 0 0 0" }} />
                </div>
                <div style={{ position: "absolute", top: "-15px", right: "15px", width: "40px", height: "40px", background: "#fbf3e6", border: "4px solid #5c3a21", borderLeftWidth: 0, borderBottomWidth: 0, borderRadius: "0 20px 0 0", transform: "skewY(30deg) rotate(15deg)", transformOrigin: "bottom left", animation: "catEarTwitch 5s ease-in-out 0.2s infinite", zIndex: 1 }}>
                  <div style={{ position: "absolute", inset: "6px", background: "#ff80ab", borderRadius: "0 10px 0 0" }} />
                </div>
                <div style={{ position: "absolute", inset: "-10px", border: "4px dashed #5c3a21", borderRadius: "50%" }} />
                <div style={{ position: "absolute", bottom: "-10px", left: "0px", fontSize: "24px" }}>🧋</div>
                <div style={{ position: "absolute", bottom: "-10px", right: "0px", fontSize: "24px" }}>🧋</div>
              </>
            )}

            {avatarFrame === "event-horizon" && (
              <>
                {/* Swirling gravity vortex */}
                <div style={{ position: "absolute", inset: "-25px", background: "conic-gradient(from 0deg, #d500f9, #00e5ff, transparent 50%, #00e5ff, #d500f9)", borderRadius: "50%", filter: "blur(4px)", animation: "vinylSpin 3s linear infinite", zIndex: -1 }} />
                <div style={{ position: "absolute", inset: "-5px", border: "3px solid #000", borderRadius: "50%", boxShadow: "0 0 15px rgba(213,0,249,0.8)", zIndex: 1 }} />
              </>
            )}

            {avatarFrame === "jelly-pulse" && (
              <>
                {/* Bioluminescent pulse border */}
                <div style={{ position: "absolute", inset: "-15px", border: "4px solid #00ffff", borderRadius: "50%", animation: "jellyPulse 4s ease-in-out infinite", boxShadow: "0 0 15px rgba(0, 255, 255, 0.4)", zIndex: 1 }} />
                {/* Floating bioluminescent tentacles */}
                <div style={{ position: "absolute", bottom: "-25px", left: "20px", fontSize: "24px", color: "#00ffff", opacity: 0.8, filter: "blur(0.5px)", animation: "kawaiiFloat 3s ease-in-out infinite" }}>🎐</div>
                <div style={{ position: "absolute", bottom: "-25px", right: "20px", fontSize: "24px", color: "#00ffff", opacity: 0.8, filter: "blur(0.5px)", animation: "kawaiiFloat 3s ease-in-out 0.5s infinite" }}>🎐</div>
              </>
            )}

            {avatarFrame === "clockwork-gears" && (
              <>
                {/* Interlocking Gears */}
                <div style={{ position: "absolute", top: "-20px", left: "-20px", fontSize: "32px", color: "#ffd54f", animation: "gearSpinClockwise 12s linear infinite" }}>⚙️</div>
                <div style={{ position: "absolute", bottom: "-20px", right: "-20px", fontSize: "28px", color: "#ffb74d", animation: "gearSpinCounter 8s linear infinite" }}>⚙️</div>
                <div style={{ position: "absolute", inset: "-10px", border: "4px solid #8d6e63", borderRadius: "50%", boxShadow: "inset 0 0 10px rgba(0,0,0,0.5), 0 0 10px rgba(255,213,79,0.3)" }} />
              </>
            )}

            {avatarFrame === "bat-wings" && (
              <>
                {/* Bat wings flanking */}
                <div style={{ position: "absolute", top: "35%", left: "-45px", fontSize: "35px", transformOrigin: "right center", animation: "batWingsFlutter 2.5s ease-in-out infinite", zIndex: 1 }}>🦇</div>
                <div style={{ position: "absolute", top: "35%", right: "-45px", fontSize: "35px", transformOrigin: "left center", transform: "scaleX(-1)", animation: "batWingsFlutterRight 2.5s ease-in-out 0.2s infinite", zIndex: 1 }}>🦇</div>
                <div style={{ position: "absolute", inset: "-12px", border: "3px solid #ff1744", borderRadius: "50%", boxShadow: "0 0 15px #ff1744", animation: "eclipseGlow 3s infinite" }} />
              </>
            )}

            {avatarFrame === "cyber-visor" && (
              <>
                {/* Cyber visor bar */}
                <div style={{ position: "absolute", inset: "-12px", border: "2px solid #00e5ff", borderRadius: "50%", zIndex: 1 }} />
                <div style={{ position: "absolute", top: "45%", left: "-15px", right: "-15px", height: "16px", background: "rgba(255, 0, 127, 0.8)", border: "1.5px solid #ff007f", borderRadius: "4px", boxShadow: "0 0 10px #ff007f", transform: "translateY(-50%)", animation: "glitchSlice 4s infinite", zIndex: 11 }} />
                <div style={{ position: "absolute", inset: "-20px", border: "2px dashed #ff007f", borderRadius: "50%", animation: "vinylSpin 20s linear infinite", opacity: 0.6 }} />
              </>
            )}

            <div style={{ 
              width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden",
              background: "var(--bg-dark-surface)", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "60px", position: "relative", zIndex: 5,
              ...(!["lightning-strike", "inferno-aura", "rage-aura", "void-aura", "kawaii-clouds", "hologram-ring", "frost-ring", "sakura-bunny", "synth-ring", "vinyl-glow", "pixel-crown", "vine-wreath", "boba-ears", "event-horizon", "jelly-pulse", "clockwork-gears", "bat-wings", "cyber-visor"].includes(avatarFrame) ? getAvatarFrameStyle(avatarFrame) : { border: "2px solid transparent" })
            }}>
              {profile?.avatar ? (
                profile.avatar.includes('http') ? <img src={profile.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : profile.avatar
              ) : "👤"}
            </div>
          </div>

          {/* Name & Title */}
          <div style={{ flex: 1, paddingBottom: "10px" }}>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "48px", fontWeight: "900", color: "var(--text-light)", fontFamily: "var(--font-outfit)", letterSpacing: "2px" }}>
              {username}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--neon-orange)", letterSpacing: "1px", textTransform: "uppercase" }}>Combatant Class</span>
              <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>|</span>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-muted)" }}>Global Rank <strong style={{ color: "var(--text-light)" }}>{level}</strong></span>
              {(isHellMode || localStorage.getItem("hellMode") === "true") && (
                <>
                  <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>|</span>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#ef4444", border: "1px solid #ef4444", padding: "2px 8px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", letterSpacing: "1px" }}>🔥 HELL MODE</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ paddingBottom: "20px", display: "flex", gap: "12px" }}>
            <button style={{ 
              background: "var(--neon-orange)", color: "#fff", border: "none", 
              padding: "12px 24px", borderRadius: "30px", fontSize: "13px", fontWeight: "800", letterSpacing: "1px",
              cursor: "pointer", transition: "transform 0.2s"
            }} onMouseOver={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseOut={e=>e.currentTarget.style.transform="scale(1)"}>
              ADD FRIEND
            </button>
            <button style={{ 
              background: "transparent", color: "var(--text-light)", border: "1px solid var(--text-muted)", 
              padding: "12px 24px", borderRadius: "30px", fontSize: "13px", fontWeight: "800", letterSpacing: "1px",
              cursor: "pointer", transition: "border-color 0.2s"
            }} onMouseOver={e=>e.currentTarget.style.borderColor="var(--text-light)"} onMouseOut={e=>e.currentTarget.style.borderColor="var(--text-muted)"}>
              MESSAGE
            </button>
          </div>
        </div>

        {/* Level Progress (No Box) */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "60px" }}>
          <div style={{ flex: 1, height: "2px", background: "rgba(128,128,128,0.2)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${xpProgress}%`, background: "var(--neon-orange)", boxShadow: "0 0 10px var(--neon-orange)" }} />
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "1px", fontFamily: "var(--font-gamer)" }}>
            {xp % 200} / 200 XP TO NEXT RANK
          </div>
        </div>

        {/* 3. TWO COLUMN STATS & SKILLS (NO BOXES) */}
        <div style={{ display: "flex", gap: "80px", alignItems: "flex-start", flexWrap: "wrap" }}>
          
          {/* Left Column: Stats */}
          <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "40px" }}>
            <h3 style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "4px", textTransform: "uppercase", borderBottom: "1px solid rgba(128,128,128,0.2)", paddingBottom: "12px" }}>
              Combat Analytics
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
              {/* Stat */}
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Win Rate</div>
                <div style={{ fontSize: "48px", fontWeight: "900", color: "var(--text-light)", fontFamily: "var(--font-outfit)", lineHeight: 1 }}>
                  {winRate}<span style={{ fontSize: "20px", color: "var(--neon-orange)" }}>%</span>
                </div>
              </div>
              
              {/* Stat */}
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>W/L Spread</div>
                <div style={{ fontSize: "40px", fontWeight: "900", color: "var(--text-light)", fontFamily: "var(--font-outfit)", lineHeight: 1 }}>
                  {profile?.wins || 0} <span style={{ fontSize: "20px", color: "var(--text-muted)" }}>/</span> {profile?.losses || 0}
                </div>
              </div>

              {/* Stat */}
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Watch Time</div>
                <div style={{ fontSize: "40px", fontWeight: "900", color: "var(--text-light)", fontFamily: "var(--font-outfit)", lineHeight: 1 }}>
                  {watchTime} <span style={{ fontSize: "16px", color: "var(--neon-blue)", textTransform: "uppercase" }}>Minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Skills */}
          <div style={{ flex: "2 1 400px", display: "flex", flexDirection: "column", gap: "40px" }}>
            <h3 style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "4px", textTransform: "uppercase", borderBottom: "1px solid rgba(128,128,128,0.2)", paddingBottom: "12px" }}>
              Mastery Roles
            </h3>

            {skills.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {skills.sort((a, b) => b.xp - a.xp).map((skill, idx) => {
                  const tierColor = TIER_COLORS[skill.tier] || TIER_COLORS["Novice"];
                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                      
                      {/* Name */}
                      <div style={{ flex: "0 0 140px", fontSize: "16px", fontWeight: "800", color: "var(--text-light)", letterSpacing: "1px" }}>
                        {skill.name}
                      </div>

                      {/* Tier Dot & Label */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: tierColor, boxShadow: `0 0 8px ${tierColor}` }} />
                        <span style={{ fontSize: "12px", fontWeight: "800", color: tierColor, textTransform: "uppercase", letterSpacing: "1px" }}>{skill.tier}</span>
                      </div>

                      {/* Progress Line */}
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ flex: 1, height: "2px", background: "rgba(128,128,128,0.2)", position: "relative" }}>
                          <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: skill.tier === "Legend" ? "100%" : `${(skill.xp % 5000) / 50}%`, background: tierColor }} />
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-gamer)", width: "60px", textAlign: "right" }}>
                          {skill.xp.toLocaleString()} XP
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: "14px", color: "var(--text-muted)", fontStyle: "italic", paddingTop: "10px" }}>
                Start watching tutorials to unlock mastery roles.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. PIXEL CAT COMPANION FOOTER AREA */}
      <div 
        onClick={handleFloorClick}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "80px",
          cursor: "cell",
          zIndex: 90
        }}
      >
        {/* Yarn Ball (if active) */}
        {yarnX !== null && (
          <div style={{
            position: "absolute",
            bottom: "10px",
            left: `${yarnX}%`,
            transform: "translateX(-50%)",
            pointerEvents: "none"
          }}>
            {renderYarnBall()}
          </div>
        )}

        {/* Cat Companion */}
        <div 
          onClick={handleCatClick}
          style={{
            position: "absolute",
            bottom: "5px",
            left: `${companionX}%`,
            transform: "translateX(-50%)",
            transition: companionState === "walk" || companionState === "play" ? "none" : "left 0.3s ease-out",
            pointerEvents: "auto",
            cursor: "pointer"
          }}
        >
          {/* Speech dialogue bubble */}
          {showSpeech && (
            <div style={{
              position: "absolute",
              bottom: "75px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--bg-dark-surface)",
              border: "2px solid var(--text-muted)",
              borderRadius: "8px",
              padding: "4px 8px",
              fontSize: "12px",
              fontWeight: "bold",
              color: "var(--text-light)",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
              animation: "speechFade 2s forwards",
              zIndex: 110,
              pointerEvents: "none",
              fontFamily: "monospace"
            }}>
              {speechText}
              <div style={{
                position: "absolute",
                bottom: "-6px",
                left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
                width: "8px",
                height: "8px",
                background: "var(--bg-dark-surface)",
                borderRight: "2px solid var(--text-muted)",
                borderBottom: "2px solid var(--text-muted)"
              }} />
            </div>
          )}

          {/* Sleeping Zzz particles */}
          {companionState === "sleep" && (
            <div style={{ position: "absolute", bottom: "60px", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }}>
              <span style={{ position: "absolute", fontSize: "10px", fontFamily: "monospace", color: "var(--text-muted)", animation: "zzzRise 3s infinite" }}>Z</span>
              <span style={{ position: "absolute", fontSize: "12px", fontFamily: "monospace", color: "var(--text-muted)", animation: "zzzRise 3s infinite 1s" }}>Z</span>
              <span style={{ position: "absolute", fontSize: "14px", fontFamily: "monospace", color: "var(--text-light)", animation: "zzzRise 3s infinite 2s" }}>Z</span>
            </div>
          )}

          {/* Render the SVG wrapped in mirroring scale */}
          <div style={{
            transform: `scaleX(${companionFacing === "left" ? -1 : 1})`,
            transformOrigin: "center"
          }}>
            {companionState === "sleep" && renderSleepingCat(getCatConfig(profileEffect))}
            {companionState === "play" && renderPlayingCat(getCatConfig(profileEffect))}
            {(companionState === "idle" || companionState === "walk") && renderIdleWalkCat(getCatConfig(profileEffect), companionState === "walk")}
          </div>
        </div>
      </div>

    </div>
  );
}
