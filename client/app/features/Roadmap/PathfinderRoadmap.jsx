import { useState, useEffect } from "react";
import { fetchWithJobPolling } from "../../utils/asyncJob";
import * as sound from "../../utils/audio";
import { parseMarkdownToHTML } from "../../utils/markdown";
import BossBattleModal from "./BossBattleModal";
import CanvasRuneLoader from "../Shared/CanvasRuneLoader";

const BACKEND_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:5000" : "";

// Status visual config helper
function getStatusConfig(isDarkMode) {
  if (isDarkMode) {
    return {
      completed:  { bg: "rgba(212, 175, 55, 0.12)", border: "#d4af37", text: "#e5c158", icon: "✦", label: "Mastered" },
      active:     { bg: "rgba(245, 158, 11, 0.15)", border: "#f59e0b", text: "#f59e0b", icon: "✵", label: "Active Quest" },
      unlocked:   { bg: "rgba(138, 115, 67, 0.08)", border: "#8a7343", text: "#c5a85c", icon: "○", label: "Available" },
      locked:     { bg: "rgba(100, 90, 80, 0.04)", border: "rgba(138, 115, 67, 0.15)", text: "#7c7267", icon: "🔒", label: "Locked" },
      revision:   { bg: "rgba(234, 179, 8, 0.12)", border: "#eab308", text: "#eab308", icon: "↺", label: "Revision" },
    };
  } else {
    return {
      completed:  { bg: "#dcfce7", border: "#16a34a", text: "#16a34a", icon: "✓", label: "Completed" },
      active:     { bg: "#fff7ed", border: "#ff6a00", text: "#ff6a00", icon: "▶", label: "In Progress" },
      unlocked:   { bg: "#ffffff", border: "#e2e8f0", text: "#64748b", icon: "○", label: "Available" },
      locked:     { bg: "#f8fafc", border: "#e2e8f0", text: "#cbd5e1", icon: "🔒", label: "Locked" },
      revision:   { bg: "#fef9c3", border: "#ca8a04", text: "#ca8a04", icon: "↺", label: "Revision" },
    };
  }
}

const LEVEL_META = {
  1: { emoji: "🌱", label: "Foundations", range: "Basic → Intermediate" },
  2: { emoji: "⚡", label: "Intermediate", range: "Intermediate → Advanced" },
  3: { emoji: "🔥", label: "Mastery",     range: "Advanced → God Tier" },
  4: { emoji: "🏛️", label: "Architecture", range: "Real World Mastery" },
  5: { emoji: "👑", label: "Supreme Mastery", range: "Interview Ready" },
};

const getConstellationLayoutMobile = (n) => {
  if (n === 1) return [{x: 50, y: 50}];
  if (n === 2) return [{x: 35, y: 25}, {x: 65, y: 75}];
  if (n === 3) return [{x: 35, y: 15}, {x: 65, y: 50}, {x: 35, y: 85}];
  
  const coords = [];
  const startY = 8;
  const endY = 92;
  const stepY = (endY - startY) / (n - 1 || 1);
  
  for(let i = 0; i < n; i++) {
    const y = startY + (stepY * i);
    // Smooth winding snake path left and right around 50% center
    const angle = (i / (n - 1 || 1)) * Math.PI * 3;
    const x = 50 + Math.sin(angle) * 22; // alternate left and right by 22%
    coords.push({x, y});
  }
  return coords;
};

const getConstellationLayoutDesktop = (n) => {
  if (n === 1) return [{x: 50, y: 50}];
  if (n === 2) return [{x: 20, y: 50}, {x: 80, y: 50}];
  if (n === 3) return [{x: 20, y: 80}, {x: 50, y: 20}, {x: 80, y: 80}]; // Triangle
  
  const coords = [];
  const startX = 10;
  const endX = 90;
  const stepX = (endX - startX) / (n - 1 || 1);
  for(let i=0; i<n; i++) {
    // 2 periods of sine wave over the path
    const progress = i / (n - 1 || 1);
    const angle = progress * Math.PI * 4; 
    let y = 50 + Math.sin(angle) * 35; // Oscillation between 15% and 85%
    
    // Add vertical organic jitter
    if (i % 2 === 0) y -= 5; else y += 5;
    y = Math.max(10, Math.min(90, y)); // Clamp safely
    
    let x = startX + (stepX * i);
    coords.push({x, y});
  }
  return coords;
};


function MilestoneNode({ milestone, levelColor, onSelect, isSelected, isDarkMode, position }) {
  const statusConfig = getStatusConfig(isDarkMode);
  const cfg = statusConfig[milestone.status] || statusConfig.locked;
  const isClickable = milestone.status !== "locked";
  const isLocked = milestone.status === "locked";
  const isActive = milestone.status === "active";
  const isCompleted = milestone.status === "completed";

  // Different neon color for active/completed states
  const neonColor = isCompleted ? "#00f2fe" : (isActive ? "#ff007f" : levelColor);

  let medallionBg;
  if (isCompleted) {
    medallionBg = isDarkMode
      ? "radial-gradient(circle at 38% 35%, rgba(255,225,100,0.58) 0%, rgba(180,135,30,0.96) 42%, rgba(88,65,14,1) 100%)"
      : "radial-gradient(circle at 38% 35%, #fffde7 0%, #fef3c7 42%, #fde68a 100%)";
  } else if (isActive) {
    medallionBg = isDarkMode
      ? "radial-gradient(circle at 38% 35%, rgba(255,178,52,0.62) 0%, rgba(205,122,18,0.96) 42%, rgba(98,63,10,1) 100%)"
      : "radial-gradient(circle at 38% 35%, #fff7ed 0%, #ffedd5 42%, #fed7aa 100%)";
  } else if (isLocked) {
    medallionBg = isDarkMode
      ? "radial-gradient(circle at 38% 35%, rgba(60,58,54,0.72) 0%, rgba(38,36,32,0.96) 100%)"
      : "radial-gradient(circle at 38% 35%, #f8fafc 0%, #e2e8f0 100%)";
  } else {
    medallionBg = isDarkMode
      ? "radial-gradient(circle at 38% 35%, rgba(120,95,48,0.72) 0%, rgba(68,53,24,0.96) 100%)"
      : "radial-gradient(circle at 38% 35%, #fef9ee 0%, #fef3c7 100%)";
  }
  if (isSelected) {
    medallionBg = isDarkMode
      ? "radial-gradient(circle at 38% 35%, rgba(255,240,132,0.68) 0%, rgba(212,175,55,0.93) 42%, rgba(128,98,18,1) 100%)"
      : "radial-gradient(circle at 38% 35%, #fffbeb 0%, #fef3c7 42%, #fde68a 100%)";
  }

  const cornerColor = isLocked
    ? (isDarkMode ? "rgba(100,90,80,0.32)" : "rgba(185,175,160,0.5)")
    : isSelected ? (isDarkMode ? "#ffd700" : neonColor)
    : (isCompleted || isActive) ? neonColor
    : (isDarkMode ? "#8a7343" : "#c5a85c");

  const medallionBorder = isLocked
    ? `2px solid ${isDarkMode ? "rgba(100,90,80,0.25)" : "#cbd5e1"}`
    : isSelected ? `2.5px solid ${isDarkMode ? "#ffd700" : neonColor}`
    : `2px solid ${cornerColor}`;

  const medallionGlow = isLocked ? "none"
    : isSelected ? `0 0 38px ${neonColor}, 0 0 76px ${neonColor}77, inset 0 0 20px ${neonColor}44`
    : isActive ? `0 0 30px ${neonColor}cc, 0 0 60px ${neonColor}66`
    : isCompleted ? `0 0 24px ${neonColor}aa, 0 0 48px ${neonColor}55`
    : "none";

  return (
    <div style={{
      position: "absolute",
      left: `${position.x}%`,
      top: `${position.y}%`,
      transform: "translate(-50%, -50%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      zIndex: 10,
    }}>
      {/* Premium Cyberpunk Diamond Node */}
      <div 
        className="node-medallion-container" 
        onClick={() => isClickable && onSelect(milestone)}
        style={{ 
          position: "relative",
          cursor: isClickable ? "pointer" : "default",
          transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)",
        }}
        onMouseOver={e => {
          if (isClickable) e.currentTarget.style.transform = "scale(1.15)";
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = "none";
        }}
      >
        {/* Outer Rotating Glow Ring (if active) */}
        {isActive && (
          <div style={{
            position: "absolute", top: "-10px", left: "-10px", right: "-10px", bottom: "-10px",
            border: `2px dashed ${neonColor}`, borderRadius: "4px",
            transform: "rotate(45deg)", animation: "graceRotate 6s linear infinite",
            pointerEvents: "none", zIndex: 0,
          }} />
        )}

        {/* The Diamond Base */}
        <div style={{
          position: "relative", width: "56px", height: "56px",
          background: medallionBg,
          borderRadius: "12px", // rounded diamond
          transform: "rotate(45deg)",
          boxShadow: medallionGlow,
          border: medallionBorder,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2,
        }}>
          {/* Inner Dark Tech Core */}
          <div style={{
            width: "44px", height: "44px",
            background: isDarkMode ? "#0f172a" : "#ffffff",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isDarkMode ? "inset 0 0 15px rgba(0,0,0,0.9), 0 0 5px rgba(0,0,0,0.5)" : "inset 0 0 8px rgba(0,0,0,0.06)"
          }}>
            {/* Un-rotated Icon Container */}
            <span style={{
              transform: "rotate(-45deg)", 
              color: isCompleted ? neonColor : (isActive ? neonColor : (isDarkMode ? "#64748b" : "#475569")),
              fontSize: "22px", fontWeight: "900",
              textShadow: (isCompleted || isActive) && isDarkMode ? `0 0 15px ${neonColor}` : "none"
            }}>
              {isCompleted ? "✓" : (isLocked ? "🔒" : "◈")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestoneNodeTimeline({ milestone, levelColor, isLastInLevel, onSelect, isSelected, index, isDarkMode }) {
  const statusConfig = getStatusConfig(isDarkMode);
  const cfg = statusConfig[milestone.status] || statusConfig.locked;
  const isClickable = milestone.status !== "locked";
  const isEven = index % 2 === 0;
  const isLocked = milestone.status === "locked";
  const isActive = milestone.status === "active";
  const isCompleted = milestone.status === "completed";

  let medallionBg;
  if (isCompleted) {
    medallionBg = isDarkMode
      ? "radial-gradient(circle at 38% 35%, rgba(255,225,100,0.58) 0%, rgba(180,135,30,0.96) 42%, rgba(88,65,14,1) 100%)"
      : "radial-gradient(circle at 38% 35%, #fffde7 0%, #fef3c7 42%, #fde68a 100%)";
  } else if (isActive) {
    medallionBg = isDarkMode
      ? "radial-gradient(circle at 38% 35%, rgba(255,178,52,0.62) 0%, rgba(205,122,18,0.96) 42%, rgba(98,63,10,1) 100%)"
      : "radial-gradient(circle at 38% 35%, #fff7ed 0%, #ffedd5 42%, #fed7aa 100%)";
  } else if (isLocked) {
    medallionBg = isDarkMode
      ? "radial-gradient(circle at 38% 35%, rgba(60,58,54,0.72) 0%, rgba(38,36,32,0.96) 100%)"
      : "radial-gradient(circle at 38% 35%, #f8fafc 0%, #e2e8f0 100%)";
  } else {
    medallionBg = isDarkMode
      ? "radial-gradient(circle at 38% 35%, rgba(120,95,48,0.72) 0%, rgba(68,53,24,0.96) 100%)"
      : "radial-gradient(circle at 38% 35%, #fef9ee 0%, #fef3c7 100%)";
  }
  if (isSelected) {
    medallionBg = isDarkMode
      ? "radial-gradient(circle at 38% 35%, rgba(255,240,132,0.68) 0%, rgba(212,175,55,0.93) 42%, rgba(128,98,18,1) 100%)"
      : "radial-gradient(circle at 38% 35%, #fffbeb 0%, #fef3c7 42%, #fde68a 100%)";
  }

  const cornerColor = isLocked
    ? (isDarkMode ? "rgba(100,90,80,0.32)" : "rgba(185,175,160,0.5)")
    : isSelected ? (isDarkMode ? "#ffd700" : levelColor)
    : (isCompleted || isActive) ? levelColor
    : (isDarkMode ? "#8a7343" : "#c5a85c");

  const medallionBorder = isLocked
    ? `2px solid ${isDarkMode ? "rgba(100,90,80,0.25)" : "#cbd5e1"}`
    : isSelected ? `2.5px solid ${isDarkMode ? "#ffd700" : levelColor}`
    : `2px solid ${cornerColor}`;

  const medallionGlow = isLocked ? "none"
    : isSelected ? `0 0 28px ${levelColor}, 0 0 56px ${levelColor}55, inset 0 0 16px ${levelColor}33`
    : isActive ? `0 0 20px ${levelColor}bb, 0 0 40px ${levelColor}44`
    : isCompleted ? `0 0 14px ${levelColor}88, 0 0 28px ${levelColor}33`
    : "none";

  const labelBg = isSelected
    ? (isDarkMode ? "rgba(212,175,55,0.11)" : "rgba(254,243,199,0.55)")
    : (isDarkMode ? "rgba(22,16,8,0.75)" : "#ffffff");

  const titleColor = isLocked
    ? (isDarkMode ? "#7c7267" : "#94a3b8")
    : isSelected ? (isDarkMode ? "#ffd700" : levelColor)
    : (isDarkMode ? "#f3e2b4" : "#78350f");

  const sideAccentActive = (isCompleted || isActive) ? levelColor + "cc" : (isDarkMode ? "rgba(138,115,67,0.22)" : "rgba(0,0,0,0.07)");
  const sideAccentSelected = isDarkMode ? "#ffd700" : levelColor;

  return (
    <div className="node-row">
      {!isLastInLevel && (
        <div className="node-connector" style={{
          width: "3px",
          background: isCompleted
            ? `linear-gradient(to bottom, ${levelColor}ee, ${levelColor}77)`
            : (isDarkMode
                ? "repeating-linear-gradient(to bottom, rgba(212,175,55,0.48) 0, rgba(212,175,55,0.48) 4px, transparent 4px, transparent 10px)"
                : "repeating-linear-gradient(to bottom, rgba(180,140,60,0.48) 0, rgba(180,140,60,0.48) 4px, transparent 4px, transparent 10px)"),
          boxShadow: isCompleted ? `0 0 9px ${levelColor}bb` : "none",
        }} />
      )}

      {isEven ? (
        <div
          className="node-label-card align-left"
          onClick={() => isClickable && onSelect(milestone)}
          style={{
            cursor: isClickable ? "pointer" : "default",
            opacity: isLocked ? 0.38 : 1,
            background: labelBg,
            border: `1.5px solid ${isDarkMode ? "rgba(138,115,67,0.18)" : "rgba(0,0,0,0.06)"}`,
            borderRight: `3px solid ${isSelected ? sideAccentSelected : sideAccentActive}`,
            boxShadow: isSelected ? `0 4px 22px ${levelColor}20, -4px 0 18px ${levelColor}15` : "none",
            backdropFilter: isDarkMode ? "blur(10px)" : "none",
          }}
          onMouseOver={e => {
            if (isClickable && !isSelected) {
              e.currentTarget.style.background = isDarkMode ? "rgba(212,175,55,0.09)" : "rgba(254,243,199,0.5)";
              e.currentTarget.style.borderRightColor = levelColor;
            }
          }}
          onMouseOut={e => {
            if (!isSelected) {
              e.currentTarget.style.background = labelBg;
              e.currentTarget.style.borderRightColor = sideAccentActive;
            }
          }}
        >
          {milestone.isRevision && (
            <div style={{
              background: "rgba(234,179,8,0.18)", border: "1px solid rgba(234,179,8,0.5)",
              color: "#eab308", fontSize: "8px", fontWeight: "900",
              padding: "1px 7px", borderRadius: "8px", letterSpacing: "0.5px",
              marginBottom: "5px", display: "inline-block"
            }}>REVISION</div>
          )}
          <div style={{ fontSize: "13px", fontWeight: "800", color: titleColor, fontFamily: "var(--font-outfit)", marginBottom: "4px", lineHeight: "1.3" }}>
            {milestone.title}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.45", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {milestone.description}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "7px", alignItems: "center", justifyContent: "flex-end" }}>
            {milestone.estimatedMinutes && (
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>⏱ {milestone.estimatedMinutes}m</span>
            )}
            {milestone.xpReward && (
              <span style={{ fontSize: "10px", fontWeight: "800", color: isDarkMode ? "#d4af37" : "#b45309" }}>+{milestone.xpReward} XP</span>
            )}
          </div>
        </div>
      ) : (
        <div className="node-spacer" />
      )}

      {/* Center: Elden Ring Grace Node */}
      <div className="node-medallion-container">
        {/* Rotating arc ring — active only */}
        {isActive && (
          <div style={{
            position: "absolute",
            top: "-15px", left: "-15px", right: "-15px", bottom: "-15px",
            borderRadius: "50%",
            border: `1.5px solid ${levelColor}`,
            borderTopColor: "transparent",
            borderLeftColor: "transparent",
            animation: "graceRotate 3.5s linear infinite",
            pointerEvents: "none",
            zIndex: 4,
          }} />
        )}
        {/* Halo pulse ring */}
        {(isActive || isCompleted) && (
          <div style={{
            position: "absolute",
            top: "-8px", left: "-8px", right: "-8px", bottom: "-8px",
            borderRadius: "50%",
            border: `1px solid ${levelColor}55`,
            animation: isActive ? "gracePulse 1.8s ease-in-out infinite" : "none",
            pointerEvents: "none",
          }} />
        )}
        {/* Main clickable orb */}
        <div
          onClick={() => isClickable && onSelect(milestone)}
          style={{
            position: "relative",
            width: "76px", height: "76px",
            borderRadius: "50%",
            background: medallionBg,
            border: medallionBorder,
            boxShadow: medallionGlow,
            cursor: isClickable ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s",
            zIndex: 2,
          }}
          onMouseOver={e => {
            if (isClickable) {
              e.currentTarget.style.transform = "scale(1.12)";
              e.currentTarget.style.boxShadow = `0 0 26px ${levelColor}, 0 0 52px ${levelColor}55`;
            }
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = medallionGlow;
          }}
        >
          {/* Inner dashed decorative ring */}
          <div style={{
            position: "absolute", top: "7px", left: "7px", right: "7px", bottom: "7px",
            borderRadius: "50%",
            border: `1px dashed ${isDarkMode ? "rgba(212,175,55,0.3)" : "rgba(180,140,60,0.45)"}`,
            pointerEvents: "none",
          }} />
          {/* Status icon */}
          <span style={{
            fontSize: isLocked ? "15px" : "20px",
            color: isLocked
              ? (isDarkMode ? "rgba(180,168,155,0.28)" : "rgba(150,150,150,0.35)")
              : isSelected ? (isDarkMode ? "#ffd700" : levelColor)
              : cfg.text,
            fontWeight: "900",
            fontFamily: "var(--font-outfit)",
            textShadow: (!isLocked && (isActive || isCompleted || isSelected)) ? `0 0 10px ${levelColor}` : "none",
            position: "relative", zIndex: 1,
          }}>
            {cfg.icon}
          </span>
          {/* 4 corner diamond points: N / S / W / E */}
          {!isLocked && [
            { top: "-8px", left: "50%", transform: "translateX(-50%) rotate(45deg)" },
            { bottom: "-8px", left: "50%", transform: "translateX(-50%) rotate(45deg)" },
            { left: "-8px", top: "50%", transform: "translateY(-50%) rotate(45deg)" },
            { right: "-8px", top: "50%", transform: "translateY(-50%) rotate(45deg)" },
          ].map((pos, i) => (
            <div key={i} style={{
              position: "absolute",
              width: "12px", height: "12px",
              background: cornerColor,
              boxShadow: `0 0 7px ${cornerColor}${(isSelected || isActive || isCompleted) ? "dd" : "77"}`,
              pointerEvents: "none",
              ...pos,
            }} />
          ))}
        </div>
      </div>

      {/* Right label */}
      {!isEven ? (
        <div
          className="node-label-card align-right"
          onClick={() => isClickable && onSelect(milestone)}
          style={{
            cursor: isClickable ? "pointer" : "default",
            opacity: isLocked ? 0.38 : 1,
            background: labelBg,
            border: `1.5px solid ${isDarkMode ? "rgba(138,115,67,0.18)" : "rgba(0,0,0,0.06)"}`,
            borderLeft: `3px solid ${isSelected ? sideAccentSelected : sideAccentActive}`,
            boxShadow: isSelected ? `0 4px 22px ${levelColor}20, 4px 0 18px ${levelColor}15` : "none",
            backdropFilter: isDarkMode ? "blur(10px)" : "none",
          }}
          onMouseOver={e => {
            if (isClickable && !isSelected) {
              e.currentTarget.style.background = isDarkMode ? "rgba(212,175,55,0.09)" : "rgba(254,243,199,0.5)";
              e.currentTarget.style.borderLeftColor = levelColor;
            }
          }}
          onMouseOut={e => {
            if (!isSelected) {
              e.currentTarget.style.background = labelBg;
              e.currentTarget.style.borderLeftColor = sideAccentActive;
            }
          }}
        >
          {milestone.isRevision && (
            <div style={{
              background: "rgba(234,179,8,0.18)", border: "1px solid rgba(234,179,8,0.5)",
              color: "#eab308", fontSize: "8px", fontWeight: "900",
              padding: "1px 7px", borderRadius: "8px", letterSpacing: "0.5px",
              marginBottom: "5px", display: "inline-block"
            }}>REVISION</div>
          )}
          <div style={{ fontSize: "13px", fontWeight: "800", color: titleColor, fontFamily: "var(--font-outfit)", marginBottom: "4px", lineHeight: "1.3" }}>
            {milestone.title}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.45", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {milestone.description}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "7px", alignItems: "center" }}>
            {milestone.estimatedMinutes && (
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>⏱ {milestone.estimatedMinutes}m</span>
            )}
            {milestone.xpReward && (
              <span style={{ fontSize: "10px", fontWeight: "800", color: isDarkMode ? "#d4af37" : "#b45309" }}>+{milestone.xpReward} XP</span>
            )}
          </div>
        </div>
      ) : (
        <div className="node-spacer" />
      )}
    </div>
  );
}


const STUDY_GEN_LOGS = [
  "🔍 Extracting milestone concepts and keys...",
  "🎯 Aligning guide with onboarding goals...",
  "📚 Structuring deep theoretical breakdown...",
  "📋 Constructing syntax comparison matrices...",
  "💻 Formulating Before/After code examples...",
  "💼 Pinpointing core mock interview questions...",
  "⚡ Preparing interactive practice challenges...",
  "✨ Finalizing formatting and rendering guide..."
];

function FullscreenNotesReader({ milestone, roadmapTopic, levelColor, onClose, onSearchDuel, onMarkComplete, username, onSaveNotes, isDarkMode }) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(milestone.studyNotes || null);
  const [genStep, setGenStep] = useState(0);
  const [genLog, setGenLog] = useState([]);
  const [noteStyle, setNoteStyle] = useState("smart");

  // Load answers for personalization
  const answersKey = `kaevrix_roadmap_answers_${username}`;
  const savedAnswers = localStorage.getItem(answersKey);
  const answers = savedAnswers ? JSON.parse(savedAnswers) : [];
  const userReason = answers.find(a => a.question.toLowerCase().includes("why"))?.answer || "learning";

  const cleanMilestoneTitle = (title) => {
    if (!title) return "";
    const rawAns = answers && answers.length > 0 ? answers[0].answer : "";
    let cleaned = title;
    if (rawAns && rawAns.length > 20 && cleaned.includes(rawAns)) {
      cleaned = cleaned.replace(rawAns, "").trim() || "Module";
    }
    if (cleaned.length > 45) {
      const words = cleaned.split(" ");
      if (words.length > 4) {
        cleaned = "..." + words.slice(-4).join(" ");
      } else {
        cleaned = cleaned.substring(0, 45) + "...";
      }
    }
    return cleaned;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setGenStep(0);
    setGenLog([STUDY_GEN_LOGS[0]]);

    // Log timer
    const logInterval = setInterval(() => {
      setGenStep(prev => {
        const next = prev + 1;
        if (next < STUDY_GEN_LOGS.length) {
          setGenLog(logs => [...logs, STUDY_GEN_LOGS[next]]);
          return next;
        } else {
          clearInterval(logInterval);
          return prev;
        }
      });
    }, 1200);

    try {
      sound.playClockTick();
      const res = await fetchWithJobPolling(`${BACKEND_URL}/api/pathfinder/study-notes`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`
        },
        body: JSON.stringify({ topic: roadmapTopic, milestone, answers, noteStyle })
      });
      const data = await res.json();
      clearInterval(logInterval);
      setNotes(data.notes);
      onSaveNotes(milestone.id, data.notes);
      sound.playCorrect();
    } catch (err) {
      clearInterval(logInterval);
      const fallback = `## ${cleanMilestoneTitle(milestone.title)}\n\n${cleanMilestoneTitle(milestone.description).replace("Get started with Module,", "Get started,")}\n\n${(milestone.keyPoints || []).map(p => `- ${p}`).join("\n")}`;
      setNotes(fallback);
      onSaveNotes(milestone.id, fallback);
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = milestone.status === "completed";
  const cfg = getStatusConfig(isDarkMode)[milestone.status] || getStatusConfig(isDarkMode).locked;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 2000,
      background: "#f8fafc",
      display: "flex",
      flexDirection: "row",
      overflow: "hidden"
    }} className="animate-slideup">
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100vh); }
          to { transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        .animate-slideup {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-pulse-brain {
          animation: pulse 1.8s infinite ease-in-out;
        }
      `}</style>

      {/* Left Sidebar (Stats, checklist, action items) */}
      <div style={{
        width: "340px",
        background: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flexShrink: 0,
        boxSizing: "border-box"
      }}>
        {/* Top sidebar content */}
        <div style={{ padding: "32px", overflowY: "auto", flex: 1 }}>
          {/* Back button */}
          <button 
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              color: "#64748b",
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "8px",
              marginLeft: "-12px",
              transition: "all 0.2s"
            }}
            onMouseOver={e => { e.currentTarget.style.color = "#0f172a"; e.currentTarget.style.background = "#f1f5f9"; }}
            onMouseOut={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "none"; }}
          >
            ← Back to Roadmap
          </button>

          <div style={{ marginTop: "28px" }}>
            <span style={{
              fontSize: "10px",
              fontWeight: "800",
              color: levelColor,
              background: `${levelColor}15`,
              padding: "4px 10px",
              borderRadius: "8px",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}>
              {cfg.label}
            </span>
            <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#0f172a", marginTop: "12px", marginBottom: "8px", lineHeight: "1.25" }}>
              {cleanMilestoneTitle(milestone.title)}
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.5", marginBottom: "24px" }}>
              {milestone.description}
            </p>
          </div>

          {/* Key Stats card */}
          <div style={{
            background: "#f8fafc",
            borderRadius: "16px",
            padding: "16px",
            border: "1px solid #e2e8f0",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "28px"
          }}>
            <div>
              <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>XP Reward</div>
              <div style={{ fontSize: "18px", fontWeight: "900", color: levelColor }}>+{milestone.xpReward || 50} XP</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Duration</div>
              <div style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a" }}>⏱ {milestone.estimatedMinutes || 45}m</div>
            </div>
          </div>

          {/* Key points checklist */}
          {milestone.keyPoints?.length > 0 && (
            <div>
              <h3 style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
                📌 Key Objectives
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {milestone.keyPoints.map((pt, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <div style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: isCompleted ? "#10b981" : "#e2e8f0",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "900",
                      marginTop: "2px",
                      flexShrink: 0
                    }}>
                      {isCompleted ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: "13px", color: "#475569", lineHeight: "1.4" }}>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions block */}
        <div style={{
          padding: "24px 32px",
          borderTop: "1px solid #e2e8f0",
          background: "#fafafa",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          {milestone.status !== "locked" && (
            <button
              onClick={() => { sound.playClockTick(); onSearchDuel(milestone); onClose(); }}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: `linear-gradient(135deg, ${levelColor}, ${levelColor}dd)`,
                color: "#ffffff",
                fontWeight: "800",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: `0 6px 18px ${levelColor}35`,
                transition: "all 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseOut={e => e.currentTarget.style.transform = "none"}
            >
              ⚔️ Search & Duel Topic
            </button>
          )}

          {milestone.status === "unlocked" && (
            <button
              onClick={() => { sound.playClockTick(); onMarkComplete(milestone); onClose(); }}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: `1.5px solid ${levelColor}`,
                background: "#ffffff",
                color: levelColor,
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseOver={e => { e.currentTarget.style.background = `${levelColor}08`; }}
              onMouseOut={e => { e.currentTarget.style.background = "#ffffff"; }}
            >
              ✓ Mark Complete
            </button>
          )}
        </div>
      </div>

      {/* Right Content Area (Detailed Study Notes) */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Fullscreen study notes header */}
        <div style={{
          background: `linear-gradient(135deg, ${levelColor} 0%, #1e1b4b 100%)`,
          padding: "24px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0
        }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>
              Kaevrix Pathfinder Study Suite
            </div>
            <div style={{ color: "#ffffff", fontSize: "20px", fontWeight: "950", marginTop: "2px" }}>
              📖 {cleanMilestoneTitle(milestone.title)} Notes
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
            onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
          >
            Close Guide
          </button>
        </div>

        {/* Scrollable Document Pane */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          background: "#f1f5f9",
          padding: "48px"
        }}>
          <div style={{
            maxWidth: "880px",
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            border: "1px solid #e2e8f0",
            padding: "48px 64px",
            minHeight: "100%",
            boxSizing: "border-box"
          }}>
            {loading ? (
              /* Beautiful Generation Loader Screen */
              <div style={{
                height: "100%",
                minHeight: "400px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <div 
                  className="animate-pulse-brain"
                  style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${levelColor}, #ff6a00)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "44px",
                    color: "#ffffff",
                    boxShadow: `0 0 30px ${levelColor}55`,
                    marginBottom: "32px"
                  }}
                >
                  🧠
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", marginBottom: "8px", textAlign: "center" }}>
                  Generating High-Fidelity Study Guide
                </h3>
                <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "32px", textAlign: "center", maxWidth: "400px" }}>
                  Our AI engine is compiling detailed explanations, tables, before/after code blocks, and job interview questions...
                </p>

                {/* Clean SaaS-style progress log */}
                <div style={{
                  width: "100%",
                  maxWidth: "480px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}>
                  {genLog.map((log, idx) => (
                    <div key={idx} style={{
                      fontSize: "13.5px",
                      fontWeight: "750",
                      fontFamily: "var(--font-outfit), sans-serif",
                      color: idx === genLog.length - 1 ? "#ea580c" : "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: idx === genLog.length - 1 ? "rgba(234, 88, 12, 0.05)" : "transparent",
                      border: idx === genLog.length - 1 ? "1px solid rgba(234, 88, 12, 0.15)" : "1px solid transparent",
                      transition: "all 0.3s ease"
                    }}>
                      <span style={{ color: idx < genLog.length - 1 ? "#10b981" : "#ea580c" }}>
                        {idx < genLog.length - 1 ? "✓" : "⚡"}
                      </span>
                      {log}
                    </div>
                  ))}
                  {genStep < STUDY_GEN_LOGS.length - 1 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px" }}>
                      <div style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#ea580c",
                        animation: "pulse 0.8s infinite"
                      }} />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
                        processing...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : notes ? (
              /* Display Generated Notes */
              <div 
                style={{
                  lineHeight: "1.8",
                  fontFamily: "var(--font-sans)",
                  textAlign: "left"
                }}
                dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(notes) }}
              />
            ) : (
              /* Call to Action to Generate Notes */
              <div style={{
                height: "100%",
                minHeight: "350px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "52px", marginBottom: "20px" }}>✨</div>
                <h3 style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", marginBottom: "8px" }}>
                  Detailed Study Notes & Code Examples
                </h3>
                <p style={{ color: "#64748b", fontSize: "15px", maxWidth: "460px", marginBottom: "32px", lineHeight: "1.6" }}>
                  Unlock an exhaustive, personalized study guide tailored to your goal of <strong>"{userReason}"</strong>. Includes comparisons, bad vs. good code blocks, and mock interview questions.
                </p>

                {/* Note Style Toggle Switch */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  background: isDarkMode ? "rgba(0,0,0,0.2)" : "#f8fafc",
                  padding: "6px",
                  borderRadius: "16px",
                  border: isDarkMode ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0",
                  marginBottom: "24px"
                }}>
                  <button
                    onClick={() => setNoteStyle("basic")}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "12px",
                      border: "none",
                      background: noteStyle === "basic" ? (isDarkMode ? "rgba(255, 106, 0, 0.15)" : "#ffedd5") : "transparent",
                      color: noteStyle === "basic" ? "#ff6a00" : (isDarkMode ? "#94a3b8" : "#64748b"),
                      fontWeight: noteStyle === "basic" ? "800" : "600",
                      fontSize: "13.5px",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Basic Notes
                  </button>
                  <button
                    onClick={() => setNoteStyle("smart")}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "12px",
                      border: "none",
                      background: noteStyle === "smart" ? (isDarkMode ? "rgba(255, 106, 0, 0.15)" : "#ffedd5") : "transparent",
                      color: noteStyle === "smart" ? "#ff6a00" : (isDarkMode ? "#94a3b8" : "#64748b"),
                      fontWeight: noteStyle === "smart" ? "800" : "600",
                      fontSize: "13.5px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    Smart Notes ✨
                  </button>
                </div>

                <button
                  onClick={handleGenerate}
                  style={{
                    padding: "16px 36px",
                    borderRadius: "14px",
                    border: "none",
                    background: `linear-gradient(135deg, ${levelColor}, #ea580c)`,
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "15px",
                    cursor: "pointer",
                    boxShadow: `0 8px 24px ${levelColor}35`,
                    transition: "all 0.2s"
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseOut={e => e.currentTarget.style.transform = "none"}
                >
                  🧠 Generate Study Guide
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestoneDetailPanel({ roadmapTopic, milestone, levelColor, onClose, onSearchDuel, onMarkComplete, onUpdateMilestoneData, onOpenNotes, onSelectVideo, isDarkMode, username, onChallengeBoss }) {
  const cfg = getStatusConfig(isDarkMode)[milestone.status] || getStatusConfig(isDarkMode).locked;
  const hasNotes = !!milestone.studyNotes;

  const [panelTheme, setPanelTheme] = useState(() => localStorage.getItem("milestone_panel_theme") || "medieval");
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const keyPoints = milestone.keyPoints || [];
  const activeSubtopicIndex = milestone.subtopicIndex || 0;
  const isAllSubtopicsFinished = activeSubtopicIndex >= keyPoints.length;
  const isLight = !isDarkMode;

  const cleanMilestoneTitle = (title) => {
    if (!title) return "";
    const savedAnswers = localStorage.getItem(`kaevrix_roadmap_answers_${username}`);
    const answers = savedAnswers ? JSON.parse(savedAnswers) : null;
    const rawAns = answers && answers[0] ? answers[0].answer : "";
    let cleaned = title;
    if (rawAns && rawAns.length > 20 && cleaned.includes(rawAns)) {
      cleaned = cleaned.replace(rawAns, "").trim() || "Module";
    }
    if (cleaned.length > 45) {
      const words = cleaned.split(" ");
      if (words.length > 4) {
        cleaned = "..." + words.slice(-4).join(" ");
      } else {
        cleaned = cleaned.substring(0, 45) + "...";
      }
    }
    return cleaned;
  };

  useEffect(() => {
    setVideos([]);
    setHasSearched(false);
  }, [activeSubtopicIndex, milestone.id]);

  const handleSearchVideos = async () => {
    if (keyPoints.length === 0) return;
    const currentSubtopic = keyPoints[activeSubtopicIndex];
    const dynamicQuery = `${roadmapTopic} ${currentSubtopic} tutorial`;
    
    setLoadingVideos(true);
    setHasSearched(true);
    sound.playClockTick();
    
    try {
      const res = await fetch(BACKEND_URL + "/api/search?q=" + encodeURIComponent(dynamicQuery), {
        headers: { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setVideos(data.slice(0, 1));
      }
    } catch (err) {
      console.error("Error searching videos:", err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleFinishSubtopic = () => {
    sound.playCorrect();
    onUpdateMilestoneData(milestone.id, { subtopicIndex: activeSubtopicIndex + 1 });
  };

  return (
    <div className={`er-quest-overlay ${panelTheme === "medieval" ? "er-rpg" : "er-modern"} ${isLight ? "er-light" : ""}`} onClick={onClose}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Outfit:wght@400;600;800&family=Inter:wght@400;500;600;700&display=swap');

        .er-quest-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(3, 3, 5, 0.95);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: erFadeIn 0.3s ease-out forwards;
        }

        @keyframes erFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .er-quest-panel {
          width: 95%;
          max-width: 1000px;
          max-height: 85vh;
          background: radial-gradient(circle at 50% 30%, #121216 0%, #060608 100%);
          border: 1px solid rgba(212, 175, 55, 0.3);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.95), inset 0 0 40px rgba(0, 0, 0, 0.9), 0 0 25px rgba(212, 175, 55, 0.05);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          animation: erPanelSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes erPanelSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .er-hud-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .er-hud-body {
            flex-direction: column;
            overflow-y: auto;
          }
        }

        .er-hud-left {
          width: 42%;
          border-right: 1px solid rgba(212, 175, 55, 0.15);
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.15);
        }

        @media (max-width: 768px) {
          .er-hud-left {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid rgba(212, 175, 55, 0.15);
            overflow-y: visible;
          }
        }

        .er-hud-right {
          width: 58%;
          padding: 28px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .er-hud-right {
            width: 100%;
            overflow-y: visible;
          }
        }

        .er-quest-title {
          font-family: 'Cinzel', serif;
          font-size: 24px;
          font-weight: 700;
          color: #dfd5be;
          text-transform: uppercase;
          letter-spacing: 2px;
          line-height: 1.3;
          margin-bottom: 12px;
          text-shadow: 0 2px 10px rgba(212, 175, 55, 0.25);
        }

        .er-lore-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          font-style: italic;
          color: #a59b84;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .er-section-header {
          font-family: 'Cinzel', serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 3px;
          color: #dfd5be;
          text-transform: uppercase;
          margin-bottom: 20px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .er-section-header::before, .er-section-header::after {
          content: "";
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.25), transparent);
        }

        .er-stats-row {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .er-stat-card {
          flex: 1;
          background: rgba(10, 10, 12, 0.65);
          border: 1px solid rgba(212, 175, 55, 0.12);
          padding: 10px 14px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .er-stat-val {
          font-family: 'Cinzel', serif;
          font-size: 16px;
          font-weight: bold;
          color: #dfd5be;
        }

        .er-stat-label {
          font-family: 'Cormorant Garamond', serif;
          font-size: 12px;
          color: #a59b84;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .er-steps-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          padding-left: 20px;
        }

        .er-steps-connector {
          position: absolute;
          left: 8px;
          top: 15px;
          bottom: 15px;
          width: 1px;
          background: rgba(212, 175, 55, 0.15);
          z-index: 1;
        }

        .er-step-item {
          position: relative;
          z-index: 2;
        }

        .er-step-bullet {
          position: absolute;
          left: -20px;
          top: 13px;
          transform: translate(-50%, -50%);
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #0d0d10;
          border: 1px solid rgba(212, 175, 55, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .er-step-bullet.completed {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.15);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }

        .er-step-bullet.active {
          border-color: #d4af37;
          background: #d4af37;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
        }

        .er-step-card {
          background: rgba(14, 14, 18, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 4px;
          padding: 12px 14px;
          transition: all 0.3s ease;
        }

        .er-step-card.active {
          background: rgba(20, 18, 16, 0.6);
          border: 1px solid rgba(212, 175, 55, 0.35);
          box-shadow: 0 4px 15px rgba(0,0,0,0.5), inset 0 0 12px rgba(212,175,55,0.02);
        }

        .er-step-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 600;
          color: #dfd5be;
          line-height: 1.4;
        }

        .er-step-title.completed {
          color: #7e796c;
          text-decoration: line-through;
        }

        .er-step-title.active {
          font-weight: 700;
          color: #ffffff;
        }

        .er-stream-card {
          display: flex;
          gap: 12px;
          background: rgba(8, 8, 10, 0.85);
          border: 1px solid rgba(212, 175, 55, 0.18);
          border-radius: 4px;
          padding: 10px;
          align-items: center;
          margin-top: 12px;
        }

        .er-stream-thumb {
          width: 80px;
          height: 46px;
          border-radius: 3px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(255,255,255,0.05);
          background: #000;
          flex-shrink: 0;
        }

        .er-btn {
          font-family: 'Cinzel', serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          color: #dfd5be;
          background: rgba(18, 18, 22, 0.85);
          border: 1px solid rgba(212, 175, 55, 0.35);
          padding: 10px 18px;
          cursor: pointer;
          outline: none;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 3px;
          text-transform: uppercase;
        }

        .er-btn:hover:not(:disabled) {
          color: #ffffff;
          border-color: #d4af37;
          background: rgba(212, 175, 55, 0.08);
          box-shadow: 0 0 12px rgba(212, 175, 55, 0.15);
          transform: translateY(-1px);
        }

        .er-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .er-btn.primary {
          background: linear-gradient(135deg, #700000 0%, #3a0000 100%);
          border-color: rgba(212, 175, 55, 0.4);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(112, 0, 0, 0.25);
        }

        .er-btn.primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #950000 0%, #4a0000 100%);
          border-color: #d4af37;
          box-shadow: 0 6px 18px rgba(112, 0, 0, 0.4), 0 0 8px rgba(212,175,55,0.15);
        }

        .er-btn.success {
          background: linear-gradient(135deg, #0d3d2a 0%, #062318 100%);
          border-color: rgba(16, 185, 129, 0.35);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        }

        .er-btn.success:hover:not(:disabled) {
          border-color: #10b981;
          background: linear-gradient(135deg, #15573c 0%, #093424 100%);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
        }

        .er-conjure-loader {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
          justify-content: center;
          padding: 12px;
          border: 1px dashed rgba(212, 175, 55, 0.2);
          background: rgba(12, 12, 15, 0.4);
          border-radius: 4px;
          margin-top: 10px;
        }

        .er-conjure-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 14px;
          font-style: italic;
          color: #dfd5be;
          animation: erPulseText 2s infinite alternate;
        }

        @keyframes erPulseText {
          from { opacity: 0.5; }
          to { opacity: 1; text-shadow: 0 0 6px rgba(212,175,55,0.3); }
        }

        .er-aura-pulse {
          width: 30px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #d4af37, transparent);
          animation: erAuraWidth 1.5s infinite alternate ease-in-out;
        }

        @keyframes erAuraWidth {
          from { width: 10px; opacity: 0.2; }
          to { width: 120px; opacity: 0.8; }
        }

        .er-close-corner {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: #a59b84;
          font-family: 'Cinzel', serif;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          padding: 4px;
          z-index: 10;
        }

        .er-close-corner:hover {
          color: #c8102e;
          text-shadow: 0 0 6px rgba(200, 16, 46, 0.5);
        }

        /* =========================================
           MODERN THEME OVERRIDES (Vercel/Stripe/Google)
           ========================================= */

        .er-quest-overlay.er-modern {
          background: rgba(6, 8, 12, 0.95);
          font-family: 'Inter', sans-serif;
        }

        .er-quest-overlay.er-modern .er-quest-panel {
          background: radial-gradient(circle at 50% 30%, #0d111c 0%, #05070a 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.95), inset 0 0 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(255, 106, 0, 0.03);
        }

        .er-quest-overlay.er-modern .er-hud-left {
          background: rgba(255, 255, 255, 0.01);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          font-family: 'Inter', sans-serif;
        }

        .er-quest-overlay.er-modern .er-hud-right {
          font-family: 'Inter', sans-serif;
        }

        .er-quest-overlay.er-modern .er-quest-title {
          font-family: 'Outfit', sans-serif;
          color: #ffffff;
          text-transform: none;
          letter-spacing: -0.5px;
          text-shadow: none;
          font-size: 26px;
          font-weight: 800;
        }

        .er-quest-overlay.er-modern .er-lore-text {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-style: normal;
          color: #94a3b8;
          line-height: 1.6;
        }

        .er-quest-overlay.er-modern .er-section-header {
          font-family: 'Outfit', sans-serif;
          color: #ffffff;
          text-transform: none;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0px;
        }

        .er-quest-overlay.er-modern .er-section-header::before, 
        .er-quest-overlay.er-modern .er-section-header::after {
          background: rgba(255, 255, 255, 0.1);
        }

        .er-quest-overlay.er-modern .er-stat-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .er-quest-overlay.er-modern .er-stat-val {
          font-family: 'Outfit', sans-serif;
          color: #ff6a00;
          font-size: 18px;
        }

        .er-quest-overlay.er-modern .er-stat-label {
          font-family: 'Inter', sans-serif;
          color: #64748b;
          text-transform: none;
          letter-spacing: 0px;
        }

        .er-quest-overlay.er-modern .er-steps-connector {
          background: rgba(255, 255, 255, 0.08);
        }

        .er-quest-overlay.er-modern .er-step-bullet {
          border-color: rgba(255, 255, 255, 0.15);
          background: #080a10;
        }

        .er-quest-overlay.er-modern .er-step-bullet.completed {
          border-color: #10b981;
          background: #10b981;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        }

        .er-quest-overlay.er-modern .er-step-bullet.active {
          border-color: #ff6a00;
          background: #ff6a00;
          box-shadow: 0 0 12px rgba(255, 106, 0, 0.4);
        }

        .er-quest-overlay.er-modern .er-step-card {
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .er-quest-overlay.er-modern .er-step-card.active {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 106, 0, 0.35);
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }

        .er-quest-overlay.er-modern .er-step-title {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #cbd5e1;
          text-decoration: none;
        }

        .er-quest-overlay.er-modern .er-step-title.completed {
          color: #64748b;
          text-decoration: line-through;
        }

        .er-quest-overlay.er-modern .er-step-title.active {
          color: #ffffff;
        }

        .er-quest-overlay.er-modern .er-stream-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .er-quest-overlay.er-modern .er-btn {
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          letter-spacing: 0px;
          color: #cbd5e1;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.12);
          text-transform: none;
          font-weight: 600;
          border-radius: 6px;
        }

        .er-quest-overlay.er-modern .er-btn:hover:not(:disabled) {
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.05);
        }

        .er-quest-overlay.er-modern .er-btn.primary {
          background: linear-gradient(135deg, #ff6a00 0%, #ff8f00 100%);
          border-color: rgba(255, 255, 255, 0.06);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(255, 106, 0, 0.25);
        }

        .er-quest-overlay.er-modern .er-btn.primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff8f00 0%, #ffa500 100%);
          box-shadow: 0 6px 18px rgba(255, 106, 0, 0.4);
        }

        .er-quest-overlay.er-modern .er-btn.success {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          border-color: rgba(255, 255, 255, 0.06);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        }

        .er-quest-overlay.er-modern .er-btn.success:hover:not(:disabled) {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
        }

        .er-quest-overlay.er-modern .er-conjure-loader {
          border: 1px dashed rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.01);
        }

        .er-quest-overlay.er-modern .er-conjure-text {
          font-family: 'Inter', sans-serif;
          font-style: normal;
          color: #94a3b8;
          animation: erPulseTextModern 2s infinite alternate;
        }

        @keyframes erPulseTextModern {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }

        .er-quest-overlay.er-modern .er-aura-pulse {
          background: linear-gradient(90deg, transparent, #ff6a00, transparent);
        }

        .er-quest-overlay.er-modern .er-close-corner {
          font-family: sans-serif;
          color: #64748b;
        }

        .er-quest-overlay.er-modern .er-close-corner:hover {
          color: #ffffff;
          text-shadow: none;
        }

        /* =========================================
           LIGHT MODE OVERRIDES
           ========================================= */

        /* 1. Light RPG Theme Overrides */
        .er-quest-overlay.er-light.er-rpg {
          background: rgba(246, 243, 234, 0.65);
        }

        .er-quest-overlay.er-light.er-rpg .er-quest-panel {
          background: radial-gradient(circle at 50% 30%, #fdfbf7 0%, #f6f3ea 100%);
          border: 1px solid rgba(138, 115, 67, 0.4);
          box-shadow: 0 25px 60px rgba(0,0,0,0.15), inset 0 0 30px rgba(242, 237, 224, 0.6);
        }

        .er-quest-overlay.er-light.er-rpg .er-hud-left {
          background: rgba(138, 115, 67, 0.03);
          border-right: 1px solid rgba(138, 115, 67, 0.15);
        }

        .er-quest-overlay.er-light.er-rpg .er-quest-title {
          color: #5c4d37;
          text-shadow: 0 1px 4px rgba(138, 115, 67, 0.15);
        }

        .er-quest-overlay.er-light.er-rpg .er-lore-text {
          color: #7c6a4e;
        }

        .er-quest-overlay.er-light.er-rpg .er-section-header {
          color: #5c4d37;
        }

        .er-quest-overlay.er-light.er-rpg .er-section-header::before,
        .er-quest-overlay.er-light.er-rpg .er-section-header::after {
          background: linear-gradient(90deg, transparent, rgba(138, 115, 67, 0.25), transparent);
        }

        .er-quest-overlay.er-light.er-rpg .er-stat-card {
          background: rgba(253, 252, 249, 0.8);
          border: 1px solid rgba(138, 115, 67, 0.18);
        }

        .er-quest-overlay.er-light.er-rpg .er-stat-val {
          color: #8a7343;
        }

        .er-quest-overlay.er-light.er-rpg .er-stat-label {
          color: #7c6a4e;
        }

        .er-quest-overlay.er-light.er-rpg .er-steps-connector {
          background: rgba(138, 115, 67, 0.15);
        }

        .er-quest-overlay.er-light.er-rpg .er-step-bullet {
          border-color: rgba(138, 115, 67, 0.35);
          background: #fdfcf9;
        }

        .er-quest-overlay.er-light.er-rpg .er-step-bullet.completed {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        .er-quest-overlay.er-light.er-rpg .er-step-bullet.active {
          border-color: #8a7343;
          background: #8a7343;
        }

        .er-quest-overlay.er-light.er-rpg .er-step-card {
          background: rgba(138, 115, 67, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.03);
        }

        .er-quest-overlay.er-light.er-rpg .er-step-card.active {
          background: rgba(253, 252, 249, 0.95);
          border: 1.5px solid rgba(138, 115, 67, 0.5);
          box-shadow: 0 4px 12px rgba(138,115,67,0.08);
        }

        .er-quest-overlay.er-light.er-rpg .er-step-title {
          color: #5c4d37;
        }

        .er-quest-overlay.er-light.er-rpg .er-step-title.completed {
          color: #8b7c62;
        }

        .er-quest-overlay.er-light.er-rpg .er-step-title.active {
          color: #2c2518;
        }

        .er-quest-overlay.er-light.er-rpg .er-stream-card {
          background: rgba(253, 252, 249, 0.9);
          border: 1px solid rgba(138, 115, 67, 0.2);
        }

        .er-quest-overlay.er-light.er-rpg .er-stream-card div {
          color: #2c2518 !important;
        }

        .er-quest-overlay.er-light.er-rpg .er-btn {
          background: #fdfcf9;
          border-color: rgba(138, 115, 67, 0.4);
          color: #5c4d37;
        }

        .er-quest-overlay.er-light.er-rpg .er-btn:hover:not(:disabled) {
          background: rgba(138, 115, 67, 0.08);
          border-color: #8a7343;
          color: #2c2518;
        }

        .er-quest-overlay.er-light.er-rpg .er-btn.primary {
          background: linear-gradient(135deg, #a81111 0%, #700000 100%);
          border-color: rgba(138, 115, 67, 0.45);
          color: #ffffff;
        }

        .er-quest-overlay.er-light.er-rpg .er-btn.primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #c51a1a 0%, #900000 100%);
        }

        .er-quest-overlay.er-light.er-rpg .er-btn.success {
          background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
          border-color: rgba(138, 115, 67, 0.35);
          color: #ffffff;
        }

        .er-quest-overlay.er-light.er-rpg .er-btn.success:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
        }

        .er-quest-overlay.er-light.er-rpg .er-conjure-loader {
          border-color: rgba(138, 115, 67, 0.3);
          background: rgba(138, 115, 67, 0.04);
        }

        .er-quest-overlay.er-light.er-rpg .er-conjure-text {
          color: #5c4d37;
        }

        .er-quest-overlay.er-light.er-rpg .er-aura-pulse {
          background: linear-gradient(90deg, transparent, #8a7343, transparent);
        }

        .er-quest-overlay.er-light.er-rpg .er-close-corner {
          color: #7c6a4e;
        }

        .er-quest-overlay.er-light.er-rpg .er-close-corner:hover {
          color: #a81111;
        }

        .er-quest-overlay.er-light.er-rpg .er-style-toggle-btn {
          background: #fdfcf9;
          border-color: rgba(138, 115, 67, 0.3);
          color: #5c4d37;
        }

        /* 2. Light Modern Theme Overrides */
        .er-quest-overlay.er-light.er-modern {
          background: rgba(255, 255, 255, 0.65);
        }

        .er-quest-overlay.er-light.er-modern .er-quest-panel {
          background: radial-gradient(circle at 50% 30%, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.12), inset 0 0 40px rgba(255, 255, 255, 0.9);
        }

        .er-quest-overlay.er-light.er-modern .er-hud-left {
          background: rgba(0, 0, 0, 0.015);
          border-right: 1px solid rgba(0, 0, 0, 0.05);
        }

        .er-quest-overlay.er-light.er-modern .er-quest-title {
          color: #0f172a;
        }

        .er-quest-overlay.er-light.er-modern .er-lore-text {
          color: #475569;
        }

        .er-quest-overlay.er-light.er-modern .er-section-header {
          color: #0f172a;
        }

        .er-quest-overlay.er-light.er-modern .er-section-header::before, 
        .er-quest-overlay.er-light.er-modern .er-section-header::after {
          background: rgba(0, 0, 0, 0.06);
        }

        .er-quest-overlay.er-light.er-modern .er-stat-card {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .er-quest-overlay.er-light.er-modern .er-stat-val {
          color: #ff6a00;
        }

        .er-quest-overlay.er-light.er-modern .er-stat-label {
          color: #64748b;
        }

        .er-quest-overlay.er-light.er-modern .er-steps-connector {
          background: rgba(0, 0, 0, 0.05);
        }

        .er-quest-overlay.er-light.er-modern .er-step-bullet {
          border-color: rgba(0, 0, 0, 0.1);
          background: #ffffff;
        }

        .er-quest-overlay.er-light.er-modern .er-step-bullet.completed {
          border-color: #10b981;
          background: #10b981;
        }

        .er-quest-overlay.er-light.er-modern .er-step-bullet.active {
          border-color: #ff6a00;
          background: #ff6a00;
          box-shadow: 0 0 10px rgba(255, 106, 0, 0.35);
        }

        .er-quest-overlay.er-light.er-modern .er-step-card {
          background: rgba(0, 0, 0, 0.005);
          border: 1px solid rgba(0, 0, 0, 0.02);
        }

        .er-quest-overlay.er-light.er-modern .er-step-card.active {
          background: #ffffff;
          border: 1px solid rgba(255, 106, 0, 0.3);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
        }

        .er-quest-overlay.er-light.er-modern .er-step-title {
          color: #475569;
        }

        .er-quest-overlay.er-light.er-modern .er-step-title.completed {
          color: #94a3b8;
        }

        .er-quest-overlay.er-light.er-modern .er-step-title.active {
          color: #0f172a;
        }

        .er-quest-overlay.er-light.er-modern .er-stream-card {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .er-quest-overlay.er-light.er-modern .er-stream-card div {
          color: #0f172a !important;
        }

        .er-quest-overlay.er-light.er-modern .er-btn {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: #475569;
        }

        .er-quest-overlay.er-light.er-modern .er-btn:hover:not(:disabled) {
          background: #f8fafc;
          color: #0f172a;
          border-color: rgba(0, 0, 0, 0.15);
        }

        .er-quest-overlay.er-light.er-modern .er-btn.primary {
          background: linear-gradient(135deg, #ff6a00 0%, #ff8f00 100%);
          border-color: rgba(0, 0, 0, 0.05);
          color: #ffffff;
        }

        .er-quest-overlay.er-light.er-modern .er-btn.primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff8f00 0%, #ffa500 100%);
        }

        .er-quest-overlay.er-light.er-modern .er-btn.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: rgba(0, 0, 0, 0.05);
          color: #ffffff;
        }

        .er-quest-overlay.er-light.er-modern .er-btn.success:hover:not(:disabled) {
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
        }

        .er-quest-overlay.er-light.er-modern .er-conjure-loader {
          border-color: rgba(0, 0, 0, 0.06);
          background: rgba(0, 0, 0, 0.01);
        }

        .er-quest-overlay.er-light.er-modern .er-conjure-text {
          color: #64748b;
        }

        .er-quest-overlay.er-light.er-modern .er-close-corner {
          color: #64748b;
        }

        .er-quest-overlay.er-light.er-modern .er-close-corner:hover {
          color: #0f172a;
        }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        className="er-quest-panel"
      >
        {/* Style Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            sound.playClockTick();
            const nextTheme = panelTheme === "medieval" ? "modern" : "medieval";
            setPanelTheme(nextTheme);
            localStorage.setItem("milestone_panel_theme", nextTheme);
          }}
          className="er-btn"
          style={{
            position: "absolute",
            top: "14px",
            right: "48px",
            background: panelTheme === "medieval"
              ? (isLight ? "#fdfcf9" : "rgba(18, 18, 22, 0.85)")
              : (isLight ? "#ffffff" : "rgba(255, 255, 255, 0.02)"),
            borderColor: panelTheme === "medieval"
              ? (isLight ? "rgba(138, 115, 67, 0.3)" : "rgba(212, 175, 55, 0.4)")
              : (isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.15)"),
            color: panelTheme === "medieval"
              ? (isLight ? "#5c4d37" : "#dfd5be")
              : (isLight ? "#475569" : "#94a3b8"),
            fontFamily: panelTheme === "medieval" ? "'Cinzel', serif" : "'Outfit', sans-serif",
            fontSize: "10px",
            fontWeight: "700",
            padding: "5px 12px",
            borderRadius: panelTheme === "medieval" ? "3px" : "6px",
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "1px",
            transition: "all 0.2s",
            zIndex: 10
          }}
        >
          {panelTheme === "medieval" ? "✨ RPG Realm" : "✨ Modern Style"}
        </button>

        {/* Close Button */}
        <button onClick={onClose} className="er-close-corner">✕</button>

        {/* HUD Split Body */}
        <div className="er-hud-body">
          
          {/* Left Panel: Quest Logs */}
          <div className="er-hud-left">
            <div>
              {/* Status Badge */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px" }}>
                <span style={{
                  fontFamily: panelTheme === "medieval" ? "'Cinzel', serif" : "'Outfit', sans-serif",
                  fontSize: "10px",
                  fontWeight: "bold",
                  color: milestone.status === "locked" ? (isLight ? "#64748b" : "#7c7267") : levelColor,
                  border: panelTheme === "medieval" 
                    ? `1px solid ${milestone.status === "locked" ? (isLight ? "rgba(138, 115, 67, 0.2)" : "rgba(138, 115, 67, 0.15)") : `${levelColor}44`}`
                    : `1px solid ${milestone.status === "locked" ? (isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255,255,255,0.08)") : `${levelColor}22`}`,
                  background: panelTheme === "medieval"
                    ? `${milestone.status === "locked" ? "transparent" : `${levelColor}08`}`
                    : `${milestone.status === "locked" ? "rgba(0, 0, 0, 0.02)" : `${levelColor}15`}`,
                  padding: "3px 10px",
                  borderRadius: panelTheme === "medieval" ? "3px" : "6px",
                  letterSpacing: "1px",
                  textTransform: "uppercase"
                }}>
                  {cfg.label}
                </span>
                {milestone.status !== "locked" && (
                  <span style={{
                    fontFamily: panelTheme === "medieval" ? "'Cinzel', serif" : "'Outfit', sans-serif",
                    fontSize: "10px",
                    fontWeight: "bold",
                    color: panelTheme === "medieval" ? (isLight ? "#8a7343" : "#d4af37") : (isLight ? "#ff6a00" : "#6366f1"),
                    border: panelTheme === "medieval" ? (isLight ? "1px solid rgba(138, 115, 67, 0.25)" : "1px solid rgba(212, 175, 55, 0.25)") : (isLight ? "1px solid rgba(255, 106, 0, 0.25)" : "1px solid rgba(99, 102, 241, 0.2)"),
                    background: panelTheme === "medieval" ? "rgba(138, 115, 67, 0.04)" : (isLight ? "rgba(255, 106, 0, 0.06)" : "rgba(99, 102, 241, 0.04)"),
                    padding: "3px 10px",
                    borderRadius: panelTheme === "medieval" ? "3px" : "6px",
                    letterSpacing: "1px",
                    textTransform: "uppercase"
                  }}>
                    {panelTheme === "medieval" ? "ACTIVE LOG" : "Active Module"}
                  </span>
                )}
              </div>

              {/* Title & Lore Description */}
              <h2 className="er-quest-title">
                {cleanMilestoneTitle(milestone.title)}
              </h2>
              
              <p className="er-lore-text">
                {cleanMilestoneTitle(milestone.description).replace("Get started with Module,", "Get started,")}
              </p>

              {/* Core Stats Row */}
              <div className="er-stats-row">
                <div className="er-stat-card">
                  <span className="er-stat-val" style={{ color: panelTheme === "medieval" ? (isLight ? "#8a7343" : "#d4af37") : "#ff6a00" }}>+{milestone.xpReward} XP</span>
                  <span className="er-stat-label">{panelTheme === "medieval" ? "Trial Reward" : "XP Reward"}</span>
                </div>
                {milestone.estimatedMinutes && (
                  <div className="er-stat-card">
                    <span className="er-stat-val">⏱ {milestone.estimatedMinutes}m</span>
                    <span className="er-stat-label">{panelTheme === "medieval" ? "Estimated" : "Duration"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Knowledge Study Guide Trigger Button */}
            {milestone.status !== "locked" && (
              <button
                onClick={() => { sound.playClockTick(); onOpenNotes(); }}
                className="er-btn"
                style={{ width: "100%", borderColor: panelTheme === "medieval" ? (isLight ? "rgba(138, 115, 67, 0.4)" : "rgba(212, 175, 55, 0.45)") : (isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.1)"), color: panelTheme === "medieval" ? (isLight ? "#5c4d37" : "#dfd5be") : (isLight ? "#475569" : "#ffffff") }}
              >
                {panelTheme === "medieval" ? "📖 OPEN STUDY GUIDE" : "📖 Open Study Notes"}
              </button>
            )}
          </div>

          {/* Right Panel: Mission Progression Steps */}
          <div className="er-hud-right">
            <h3 className="er-section-header">
              {panelTheme === "medieval" ? "✦ STEPS OF THE TRIAL ✦" : "Module Lessons"}
            </h3>

            {keyPoints.length > 0 ? (
              <div className="er-steps-container">
                <div className="er-steps-connector" />

                {keyPoints.map((pt, i) => {
                  const isFinished = milestone.status === "completed" || i < activeSubtopicIndex;
                  const isUnlocked = milestone.status !== "locked" && i === activeSubtopicIndex;
                  const isLocked = milestone.status === "locked" || i > activeSubtopicIndex;

                  return (
                    <div key={i} className="er-step-item" style={{ opacity: isLocked ? (isLight ? 0.65 : 0.4) : 1 }}>
                      {/* Step Indicator Connector Node */}
                      <div className={`er-step-bullet ${isFinished ? "completed" : isUnlocked ? "active" : ""}`}>
                        {isFinished && <span style={{ color: "#10b981", fontSize: "9px", fontWeight: "900" }}>✓</span>}
                        {isUnlocked && <span style={{ color: panelTheme === "medieval" ? (isLight ? "#fff" : "#000") : "#fff", fontSize: "8px", fontWeight: "900" }}>▶</span>}
                      </div>

                      {/* Subtopic Card */}
                      <div className={`er-step-card ${isUnlocked ? "active" : ""}`}>
                        <div className={`er-step-title ${isFinished ? "completed" : isUnlocked ? "active" : ""}`}>
                          {pt}
                        </div>

                        {/* Active Trial Control Center */}
                        {isUnlocked && (
                          <div style={{ paddingLeft: "4px" }}>
                            
                            {/* Search video trigger button */}
                            {!hasSearched && !loadingVideos && (
                              <button
                                onClick={handleSearchVideos}
                                className="er-btn"
                                style={{ marginTop: "12px", width: "100%", borderStyle: "dashed" }}
                              >
                                {panelTheme === "medieval" ? "⚔️ SEEK GUIDANCE" : "🔍 Search Video Tutorial"}
                              </button>
                            )}

                            {/* Loading state */}
                            {loadingVideos && (
                              <div className="er-conjure-loader">
                                <span className="er-conjure-text">
                                  {panelTheme === "medieval" ? "Conjuring stream pathways..." : "Searching video tutorials..."}
                                </span>
                                <div className="er-aura-pulse" />
                              </div>
                            )}

                            {/* Search Results */}
                            {hasSearched && !loadingVideos && videos.length > 0 && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {videos.map((vid) => (
                                  <div key={vid.id} className="er-stream-card">
                                    <div className="er-stream-thumb">
                                      <img src={vid.thumbnail} alt="thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                      <span style={{ 
                                        position: "absolute", bottom: "2px", right: "4px", 
                                        background: "rgba(10, 10, 12, 0.85)", border: panelTheme === "medieval" ? "1px solid rgba(212, 175, 55, 0.3)" : "1px solid rgba(255,255,255,0.15)",
                                        fontSize: "8px", color: panelTheme === "medieval" ? "#dfd5be" : "#fff", padding: "1px 3px", borderRadius: "2px",
                                        fontWeight: "800", fontFamily: "monospace"
                                      }}>
                                        {Math.floor(vid.duration / 60)}:{String(vid.duration % 60).padStart(2, '0')}
                                      </span>
                                    </div>
                                    
                                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                                      <div style={{ 
                                        color: panelTheme === "medieval" ? (isLight ? "#2c2518" : "#dfd5be") : (isLight ? "#0f172a" : "#ffffff"), 
                                        fontSize: "13px", 
                                        fontWeight: "600", 
                                        fontFamily: panelTheme === "medieval" ? "'Cormorant Garamond', serif" : "'Inter', sans-serif",
                                        overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", 
                                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: "1.3"
                                      }}>
                                        {vid.title}
                                      </div>
                                      <div style={{ 
                                        color: panelTheme === "medieval" ? (isLight ? "#7c6a4e" : "#a59b84") : (isLight ? "#64748b" : "#94a3b8"), 
                                        fontSize: "11px", 
                                        fontFamily: panelTheme === "medieval" ? "'Cormorant Garamond', serif" : "'Inter', sans-serif" 
                                      }}>
                                        🎬 {vid.channel}
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => onSelectVideo && onSelectVideo(vid)}
                                      className="er-btn primary"
                                      style={{ padding: "8px 14px", fontSize: "11px", letterSpacing: "1.5px" }}
                                    >
                                      {panelTheme === "medieval" ? "⚔️ PLAY" : "▶ Play Lesson"}
                                    </button>
                                  </div>
                                ))}

                                <button
                                  onClick={handleFinishSubtopic}
                                  className="er-btn success"
                                  style={{ alignSelf: "flex-start", marginTop: "4px" }}
                                >
                                  {panelTheme === "medieval" ? "✓ SEAL STEP" : "✓ Mark Step Complete"}
                                </button>
                              </div>
                            )}

                            {/* Search Empty Bypass override */}
                            {hasSearched && !loadingVideos && videos.length === 0 && (
                              <div style={{ 
                                marginTop: "12px", 
                                padding: "12px", 
                                border: panelTheme === "medieval" ? (isLight ? "1px solid rgba(138,115,67,0.2)" : "1px solid rgba(212, 175, 55, 0.15)") : (isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.08)"), 
                                background: panelTheme === "medieval" ? (isLight ? "#f4ece1" : "rgba(10,10,12,0.45)") : (isLight ? "#f1f5f9" : "rgba(10,10,12,0.45)"), 
                                borderRadius: "4px" 
                              }}>
                                <p style={{ 
                                  fontFamily: panelTheme === "medieval" ? "'Cormorant Garamond', serif" : "'Inter', sans-serif", 
                                  fontSize: "13px", 
                                  color: panelTheme === "medieval" ? (isLight ? "#7c6a4e" : "#a59b84") : (isLight ? "#475569" : "#a59b84"), 
                                  margin: "0 0 10px", 
                                  fontStyle: "italic" 
                                }}>
                                  {panelTheme === "medieval" ? "No stream registered in the archives. Override and complete:" : "No lessons found in search. Skip step:"}
                                </p>
                                <button
                                  onClick={handleFinishSubtopic}
                                  className="er-btn"
                                  style={{ width: "100%", padding: "8px 12px", fontSize: "11px", letterSpacing: "1px" }}
                                >
                                  {panelTheme === "medieval" ? "✓ BYPASS STEP" : "✓ Skip Step"}
                                </button>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", fontFamily: panelTheme === "medieval" ? "'Cormorant Garamond', serif" : "'Inter', sans-serif", fontStyle: "italic", color: "#a59b84" }}>
                No objectives defined for this milestone trial.
              </div>
            )}
          </div>
        </div>

        {/* Footer command panel */}
        <div style={{
          padding: "16px 28px",
          borderTop: panelTheme === "medieval" ? (isLight ? "1px solid rgba(138, 115, 67, 0.15)" : "1px solid rgba(212, 175, 55, 0.15)") : (isLight ? "1px solid rgba(0, 0, 0, 0.06)" : "1px solid rgba(255, 255, 255, 0.08)"),
          display: "flex", gap: "12px",
          background: panelTheme === "medieval"
            ? (isLight ? "#f3eee0" : "rgba(5, 5, 6, 0.4)")
            : (isLight ? "#f1f5f9" : "rgba(5, 5, 6, 0.4)"),
          flexDirection: "row",
          justifyContent: "flex-end"
        }}>
          {milestone.status !== "locked" && (
            <button
              onClick={() => { sound.playClockTick(); onSearchDuel(milestone); onClose(); }}
              className="er-btn"
              style={{ flex: 1, borderColor: panelTheme === "medieval" ? (isLight ? "rgba(138, 115, 67, 0.25)" : "rgba(128, 90, 213, 0.4)") : (isLight ? "rgba(255, 106, 0, 0.25)" : "rgba(255, 106, 0, 0.3)"), color: panelTheme === "medieval" ? (isLight ? "#8a7343" : "#d6bcfa") : "#ff6a00" }}
            >
              {panelTheme === "medieval" ? "⚔️ DUEL TOPIC" : "Practice Quiz"}
            </button>
          )}

          {milestone.status === "unlocked" && onChallengeBoss && (
            <button
              onClick={() => { sound.playClockTick(); onChallengeBoss(milestone); onClose(); }}
              className="er-btn primary"
              style={{ flex: 1 }}
            >
              {panelTheme === "medieval" ? "⚔️ CHALLENGE BOSS" : "Challenge Boss"}
            </button>
          )}

          {milestone.status === "unlocked" && isAllSubtopicsFinished && (
            <button
              onClick={() => { sound.playClockTick(); onMarkComplete(milestone); onClose(); }}
              className="er-btn success"
              style={{ flex: 1 }}
            >
              {panelTheme === "medieval" ? "✓ CLAIM MILESTONE COMPLETE" : "✓ Complete Milestone"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SoloLearningModal({ video, milestone, username, onClose, onMarkComplete, isDarkMode }) {
  const [step, setStep] = useState("watch"); // watch, generating, quiz, results
  const [quizData, setQuizData] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [loadingLog, setLoadingLog] = useState("Accessing YouTube database...");

  const [showRuneLoader, setShowRuneLoader] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [pendingQuizData, setPendingQuizData] = useState(null);

  const [currentCode, setCurrentCode] = useState("");
  const [testResults, setTestResults] = useState(null);
  const [consoleError, setConsoleError] = useState(null);

  useEffect(() => {
    if (quizData?.postVideoQuestions[currentIdx]) {
      const q = quizData.postVideoQuestions[currentIdx];
      if (q.type === "coding") {
        setCurrentCode(q.starterCode || "");
        setTestResults(null);
        setConsoleError(null);
      }
    }
  }, [currentIdx, quizData]);

  const handleRunCode = () => {
    sound.playClockTick();
    const currentQ = quizData.postVideoQuestions[currentIdx];
    if (!currentQ || currentQ.type !== "coding") return;

    try {
      setConsoleError(null);
      
      const solver = new Function(`
        ${currentCode}
        if (typeof solve !== 'function') {
          throw new Error("Function 'solve' is not defined. Please define solve(input).");
        }
        return solve;
      `)();

      const results = [];
      for (let tc of currentQ.testCases) {
        let parsedInput;
        try {
          parsedInput = JSON.parse(tc.input);
        } catch {
          parsedInput = tc.input;
        }

        let parsedExpected;
        try {
          parsedExpected = JSON.parse(tc.expected);
        } catch {
          parsedExpected = tc.expected;
        }

        const got = solver(parsedInput);
        const passed = JSON.stringify(got) === JSON.stringify(parsedExpected);
        results.push({
          input: tc.input,
          expected: parsedExpected,
          got: got,
          passed
        });
      }

      setTestResults(results);
      
      const allPassed = results.every(r => r.passed);
      if (allPassed) {
        sound.playCorrect();
      } else {
        sound.playIncorrect();
      }
    } catch (err) {
      console.error("User Code Execution Error:", err);
      setConsoleError(err.message);
      sound.playIncorrect();
    }
  };

  const handleSubmitCode = () => {
    sound.playClockTick();
    const currentQ = quizData.postVideoQuestions[currentIdx];
    if (!currentQ || currentQ.type !== "coding") return;

    let results = [];
    let allPassed = false;
    try {
      const solver = new Function(`
        ${currentCode}
        if (typeof solve !== 'function') {
          throw new Error("Function 'solve' is not defined. Please define solve(input).");
        }
        return solve;
      `)();

      for (let tc of currentQ.testCases) {
        let parsedInput;
        try {
          parsedInput = JSON.parse(tc.input);
        } catch {
          parsedInput = tc.input;
        }

        let parsedExpected;
        try {
          parsedExpected = JSON.parse(tc.expected);
        } catch {
          parsedExpected = tc.expected;
        }

        const got = solver(parsedInput);
        const passed = JSON.stringify(got) === JSON.stringify(parsedExpected);
        results.push({
          input: tc.input,
          expected: parsedExpected,
          got: got,
          passed
        });
      }

      setTestResults(results);
      allPassed = results.every(r => r.passed);
    } catch (err) {
      setConsoleError(err.message);
      sound.playIncorrect();
      return;
    }

    if (allPassed) {
      setScore(s => s + 1);
      setAnswers(prev => {
        const next = [...prev];
        next[currentIdx] = "passed_code";
        return next;
      });
      sound.playCorrect();
    } else {
      sound.playIncorrect();
      setConsoleError("Submit Failed: Some test cases did not pass.");
    }
  };

  const handleNextCodingQuestion = () => {
    sound.playClockTick();
    if (currentIdx < quizData.postVideoQuestions.length - 1) {
      setCurrentIdx(idx => idx + 1);
    } else {
      setStep("results");
      if (score >= 3) {
        sound.playVictory();
        
        fetch(`${BACKEND_URL}/api/solo-xp`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`
          },
          body: JSON.stringify({
            username,
            xpEarned: milestone.xpReward || 50,
            videoTitle: video.title
          })
        }).catch(err => console.error("XP Award Error:", err));
        
        onMarkComplete(milestone);
      } else {
        sound.playDefeat();
      }
    }
  };

  const handleExplodeComplete = () => {
    setShowRuneLoader(false);
    setIsExploding(false);
    if (pendingQuizData) {
      const filteredQuiz = {
        ...pendingQuizData,
        postVideoQuestions: (pendingQuizData.postVideoQuestions || []).filter(q => q.type !== "coding")
      };
      setQuizData(filteredQuiz);
      setAnswers(Array(filteredQuiz.postVideoQuestions.length).fill(null));
      setStep("quiz");
      sound.playMatchFound();
    }
  };

  const handleStartQuiz = async () => {
    setStep("generating");
    setShowRuneLoader(true);
    setIsExploding(false);
    setLoadingLog("Transcribing video stream...");
    
    const logs = [
      "Transcribing video stream...",
      "Analyzing technical concepts...",
      "Generating quiz questions...",
      "Injecting options and verifying answers...",
      "Synthesizing solo match..."
    ];
    let logIdx = 0;
    const logInterval = setInterval(() => {
      if (logIdx < logs.length - 1) {
        logIdx++;
        setLoadingLog(logs[logIdx]);
      }
    }, 1200);

    try {
      sound.playClockTick();
      const roadmapKey = `kaevrix_roadmap_progress_${username}`;
      const savedRoadmapStr = localStorage.getItem(roadmapKey);
      const savedRoadmap = savedRoadmapStr ? JSON.parse(savedRoadmapStr) : null;
      const topic = savedRoadmap?.topic || milestone.title || "General learning";

      const answersKey = `kaevrix_roadmap_answers_${username}`;
      const savedAnswers = localStorage.getItem(answersKey);
      const answersList = savedAnswers ? JSON.parse(savedAnswers) : [];

      const devKeywords = [
        "developer", "engineer", "programming", "coding", "software", "web dev",
        "frontend", "backend", "fullstack", "full stack", "javascript", "python",
        "react", "node", "java", "c++", "c#", "rust", "go language", "golang", "devops",
        "data science", "machine learning", "database", "sql", "html", "css", "git", "leet", "leetcode", "hacker", "hackerrank"
      ];
      const whyAnswer = answersList.find(a => a.question.toLowerCase().includes("why") || a.question.toLowerCase().includes("dream"))?.answer || "";
      const isDev = devKeywords.some(kw => 
        topic.toLowerCase().includes(kw) || 
        video.title.toLowerCase().includes(kw) || 
        whyAnswer.toLowerCase().includes(kw)
      );

      const completedMilestones = savedRoadmap 
        ? [
            ...(savedRoadmap.level1?.milestones || []),
            ...(savedRoadmap.level2?.milestones || []),
            ...(savedRoadmap.level3?.milestones || [])
          ]
            .filter(m => m.status === "completed")
            .map(m => m.title)
        : [];

      const res = await fetchWithJobPolling(`${BACKEND_URL}/api/quiz/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`
        },
        body: JSON.stringify({
          videoId: video.id,
          title: video.title,
          duration: video.duration,
          topic: topic,
          why: whyAnswer,
          isDeveloper: isDev,
          completedMilestones: completedMilestones
        })
      });
      if (!res.ok) throw new Error("Quiz API failed");
      const quiz = await res.json();
      clearInterval(logInterval);
      setPendingQuizData(quiz);
      setIsExploding(true);
    } catch (err) {
      console.error("Failed to generate quiz:", err);
      clearInterval(logInterval);
      
      const fallbackQuiz = {
        postVideoQuestions: [
          {
            question: `What is the core theme of the training video: "${video.title}"?`,
            options: [
              "An overview of introductory rules and practical examples",
              "A history of unrelated operating systems",
              "A guide to offline board games",
              "An advertisement for retail products"
            ],
            answerIndex: 0,
            points: 100
          },
          {
            question: "Why is active note-taking and watching recommended?",
            options: [
              "It has no measurable benefit",
              "It enhances memory retention and concept mastery",
              "It accelerates device battery drainage",
              "It guarantees a college degree instantly"
            ],
            answerIndex: 1,
            points: 100
          },
          {
            question: "What is the passing criteria for this milestone quiz?",
            options: [
              "Scoring at least 1/5",
              "Scoring at least 3/5",
              "Answering all questions incorrectly",
              "Completing the quiz in 3 seconds"
            ],
            answerIndex: 1,
            points: 100
          },
          {
            question: "What should you do if you fail the quiz?",
            options: [
              "Give up and close the application",
              "Watch the video again, study the notes, and retry",
              "Inject false scores into the database",
              "Write a complaint letter"
            ],
            answerIndex: 1,
            points: 100
          },
          {
            question: "What does clearing a milestone reward you with?",
            options: [
              "Real money transfers",
              "XP points and progress on your path",
              "Unrelated shopping discount codes",
              "Nothing"
            ],
            answerIndex: 1,
            points: 100
          }
        ]
      };
      setPendingQuizData(fallbackQuiz);
      setIsExploding(true);
    }
  };

  const handleAnswerSelect = (optionIdx) => {
    setSelectedAns(optionIdx);
  };

  const handleNext = () => {
    if (selectedAns === null) return;
    
    const currentQ = quizData.postVideoQuestions[currentIdx];
    const isCorrect = selectedAns === currentQ.answerIndex;
    
    if (isCorrect) {
      setScore(s => s + 1);
      sound.playCorrect();
    } else {
      sound.playIncorrect();
    }

    setAnswers(prev => {
      const next = [...prev];
      next[currentIdx] = selectedAns;
      return next;
    });

    setSelectedAns(null);

    if (currentIdx < quizData.postVideoQuestions.length - 1) {
      setCurrentIdx(idx => idx + 1);
    } else {
      const finalScore = score + (isCorrect ? 1 : 0);
      setStep("results");
      
      if (finalScore >= 3) {
        sound.playVictory();
        
        fetch(`${BACKEND_URL}/api/solo-xp`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`
          },
          body: JSON.stringify({
            username,
            xpEarned: milestone.xpReward || 50,
            videoTitle: video.title
          })
        }).catch(err => console.error("XP Award Error:", err));
        
        onMarkComplete(milestone);
      } else {
        sound.playDefeat();
      }
    }
  };

  const handleRetry = () => {
    sound.playClockTick();
    setStep("watch");
    setCurrentIdx(0);
    setSelectedAns(null);
    setScore(0);
    setQuizData(null);
  };

  const isCodingChallenge = step === "quiz" && quizData?.postVideoQuestions[currentIdx]?.type === "coding";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000,
      background: isDarkMode ? "rgba(3, 5, 10, 0.95)" : "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        width: isCodingChallenge ? "95%" : "100%", 
        maxWidth: isCodingChallenge ? "1100px" : "700px",
        height: isCodingChallenge ? "85vh" : "auto",
        background: isDarkMode ? "rgba(10, 16, 32, 0.95)" : "#ffffff",
        border: isDarkMode ? "1.5px solid rgba(0, 242, 254, 0.3)" : "1.5px solid #e2e8f0",
        boxShadow: isDarkMode ? "0 0 40px rgba(0, 242, 254, 0.15)" : "0 30px 80px rgba(0,0,0,0.15)",
        borderRadius: "24px",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        transition: "all 0.3s ease"
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "20px 28px",
          borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9",
          background: isDarkMode ? "rgba(255,255,255,0.02)" : "#f8fafc",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--neon-orange)", letterSpacing: "1px", textTransform: "uppercase" }}>
              SOLO TRAINING CHALLENGE
            </span>
            <div style={{ color: isDarkMode ? "#fff" : "var(--text-light)", fontSize: "16px", fontWeight: "bold", marginTop: "2px" }}>
              {milestone.title}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: isDarkMode ? "rgba(255,255,255,0.4)" : "#94a3b8",
            cursor: "pointer", fontSize: "20px"
          }}>✕</button>
        </div>

        {/* Watch Step */}
        {step === "watch" && (
          <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", background: "#000", borderRadius: "12px", overflow: "hidden" }}>
              <iframe
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                src={`https://www.youtube.com/embed/${video.id}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div>
              <h3 style={{ color: "#fff", fontSize: "18px", fontWeight: "bold", marginBottom: "6px" }}>{video.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>Channel: {video.channel}</p>
            </div>
            
            <button
              onClick={handleStartQuiz}
              style={{
                width: "100%",
                padding: "16px",
                background: "linear-gradient(135deg, var(--neon-blue), var(--neon-pink))",
                border: "none",
                borderRadius: "12px",
                color: "#fff",
                fontWeight: "900",
                fontSize: "15px",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(0, 242, 254, 0.3)",
                letterSpacing: "1px",
                transition: "transform 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.transform = "scale(1.01)"}
              onMouseOut={e => e.currentTarget.style.transform = "none"}
            >
              ⚔️ TAKE QUIZ CHALLENGE ⚔️
            </button>
          </div>
        )}

        {/* AI Generating Quiz Step */}
        {step === "generating" && (
          <div style={{ padding: "20px", minHeight: "350px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CanvasRuneLoader
              isExploding={isExploding}
              onExplodeComplete={handleExplodeComplete}
              isDarkMode={isDarkMode}
              statusText="Synthesizing Quiz"
              subtopic={loadingLog}
            />
          </div>
        )}

        {/* Quiz Taking Step */}
        {step === "quiz" && quizData && (
          <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "16px", flex: 1, overflow: "hidden" }}>
            
            {/* Header info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <span style={{ color: "var(--neon-orange)", fontWeight: "bold", fontSize: "13px" }}>
                QUESTION {currentIdx + 1} OF {quizData.postVideoQuestions.length}
              </span>
              <span style={{ color: isDarkMode ? "rgba(255,255,255,0.4)" : "var(--text-muted)", fontSize: "13px", fontWeight: "700" }}>
                {quizData.postVideoQuestions[currentIdx].type === "coding" ? "💻 CODING PLAYGROUND" : `Score: ${score}`}
              </span>
            </div>

            {quizData.postVideoQuestions[currentIdx].type === "coding" ? (
              /* Splitscreen Sandbox inside Modal */
              <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: "24px", minHeight: "350px" }}>
                
                {/* Left side: Problem & Tests */}
                <div style={{
                  width: "50%",
                  background: isDarkMode ? "rgba(255, 255, 255, 0.02)" : "#f8fafc",
                  borderRight: isDarkMode ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid #e2e8f0",
                  paddingRight: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  overflowY: "auto"
                }} className="custom-scrollbar">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <h3 style={{ fontSize: "17px", fontWeight: "900", color: isDarkMode ? "#fff" : "#0f172a" }}>
                        {quizData.postVideoQuestions[currentIdx].title}
                      </h3>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: "850",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                        background: quizData.postVideoQuestions[currentIdx].difficulty === "Easy" ? "rgba(16, 185, 129, 0.15)" : quizData.postVideoQuestions[currentIdx].difficulty === "Hard" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: quizData.postVideoQuestions[currentIdx].difficulty === "Easy" ? "#10b981" : quizData.postVideoQuestions[currentIdx].difficulty === "Hard" ? "#ef4444" : "#f59e0b"
                      }}>
                        {quizData.postVideoQuestions[currentIdx].difficulty}
                      </span>
                    </div>
                    
                    <div 
                      style={{ fontSize: "13.5px", lineHeight: "1.5", textAlign: "left", opacity: 0.9, color: isDarkMode ? "#cbd5e1" : "#334155" }}
                      dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(quizData.postVideoQuestions[currentIdx].question) }}
                    />
                  </div>

                  {/* Test cases list */}
                  <div>
                    <h4 style={{ fontSize: "13px", fontWeight: "800", textTransform: "uppercase", color: "#ff6a00", marginBottom: "8px" }}>Test Cases</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {quizData.postVideoQuestions[currentIdx].testCases.map((tc, tcIdx) => {
                        const result = testResults ? testResults[tcIdx] : null;
                        return (
                          <div key={tcIdx} style={{
                            padding: "10px",
                            borderRadius: "6px",
                            background: isDarkMode ? "rgba(0,0,0,0.15)" : "#ffffff",
                            border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.04)" : "1px solid #e2e8f0",
                            fontSize: "12px"
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontWeight: "700", color: "var(--text-muted)" }}>Case {tcIdx + 1}</span>
                              {result && (
                                <span style={{ fontWeight: "800", color: result.passed ? "#10b981" : "#ef4444" }}>
                                  {result.passed ? "✅ Passed" : "❌ Failed"}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontFamily: "monospace" }}>
                              <div><span style={{ color: "#a78bfa" }}>Input:</span> {tc.input}</div>
                              <div><span style={{ color: "#38bdf8" }}>Expected:</span> {JSON.stringify(result ? result.expected : tc.expected)}</div>
                              {result && !result.passed && (
                                <div style={{ color: "#f87171" }}><span style={{ color: "#f87171" }}>Got:</span> {JSON.stringify(result.got)}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right side: Editor & console */}
                <div style={{
                  width: "50%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <textarea
                      value={currentCode}
                      onChange={(e) => setCurrentCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          const { selectionStart, selectionEnd, value } = e.target;
                          const newValue = value.substring(0, selectionStart) + "  " + value.substring(selectionEnd);
                          setCurrentCode(newValue);
                          setTimeout(() => {
                            e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
                          }, 0);
                        }
                      }}
                      placeholder="Write your JavaScript solution here..."
                      style={{
                        width: "100%",
                        flex: 1,
                        backgroundColor: "#090d16",
                        color: "#38bdf8",
                        fontFamily: "'Fira Code', 'Courier New', monospace",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        padding: "12px",
                        border: "1px solid rgba(0, 242, 254, 0.25)",
                        borderRadius: "10px",
                        outline: "none",
                        resize: "none"
                      }}
                    />
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={handleRunCode}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1.5px solid #ff6a00",
                        background: "transparent",
                        color: "#ff6a00",
                        fontWeight: "800",
                        cursor: "pointer",
                        clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={e => e.currentTarget.style.background = "rgba(255, 106, 0, 0.08)"}
                      onMouseOut={e => e.currentTarget.style.background = "transparent"}
                    >
                      ▶ Run Code
                    </button>
                    <button
                      onClick={handleSubmitCode}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "8px",
                        border: "none",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "#ffffff",
                        fontWeight: "900",
                        cursor: "pointer",
                        clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={e => e.currentTarget.style.filter = "brightness(1.1)"}
                      onMouseOut={e => e.currentTarget.style.filter = "none"}
                    >
                      🚀 Submit
                    </button>
                  </div>

                  {/* Output Box */}
                  <div style={{
                    height: "85px",
                    backgroundColor: isDarkMode ? "rgba(0,0,0,0.2)" : "#f8fafc",
                    border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.04)" : "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "10px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    overflowY: "auto",
                    textAlign: "left"
                  }} className="custom-scrollbar">
                    <div style={{ color: "var(--text-muted)", fontWeight: "700", marginBottom: "2px" }}>Console:</div>
                    {consoleError ? (
                      <div style={{ color: "#f87171" }}>{consoleError}</div>
                    ) : testResults && testResults.every(r => r.passed) ? (
                      <div style={{ color: "#34d399" }}>🎉 Test cases passed! Click Next to submit.</div>
                    ) : testResults ? (
                      <div style={{ color: "#fb7185" }}>❌ Output mismatch. Some tests failed.</div>
                    ) : (
                      <div style={{ color: "var(--text-muted)" }}>Run code or Submit to check results.</div>
                    )}
                  </div>

                  {/* Move Next */}
                  {answers[currentIdx] === "passed_code" && (
                    <button
                      onClick={handleNextCodingQuestion}
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #ffd700, #ff8c00)",
                        color: "#0f172a",
                        fontWeight: "900",
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}
                    >
                      {currentIdx < quizData.postVideoQuestions.length - 1 ? "Next Challenge →" : "Submit Assessment"}
                    </button>
                  )}
                </div>

              </div>
            ) : (
              /* Standard MCQ Layout */
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ color: isDarkMode ? "#fff" : "var(--text-light)", fontSize: "16px", fontWeight: "800", lineHeight: "1.4", minHeight: "45px", textAlign: "left" }}>
                  {quizData.postVideoQuestions[currentIdx].question}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {quizData.postVideoQuestions[currentIdx].options.map((opt, oIdx) => {
                    const isSelected = selectedAns === oIdx;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleAnswerSelect(oIdx)}
                        style={{
                          width: "100%",
                          padding: "14px 18px",
                          background: isSelected 
                            ? (isDarkMode ? "rgba(0, 242, 254, 0.1)" : "rgba(255, 106, 0, 0.08)")
                            : (isDarkMode ? "rgba(255,255,255,0.02)" : "#f8fafc"),
                          border: isSelected
                            ? `1.5px solid ${isDarkMode ? "var(--neon-blue)" : "var(--neon-orange)"}`
                            : `1.5px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                          borderRadius: "10px",
                          color: isSelected 
                            ? (isDarkMode ? "#fff" : "var(--text-light)")
                            : (isDarkMode ? "rgba(255,255,255,0.8)" : "var(--text-light)"),
                          fontWeight: "600",
                          fontSize: "13.5px",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        <span style={{ color: isSelected ? (isDarkMode ? "var(--neon-blue)" : "var(--neon-orange)") : (isDarkMode ? "rgba(255,255,255,0.4)" : "#94a3b8"), marginRight: "10px", fontWeight: "900" }}>
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleNext}
                  disabled={selectedAns === null}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: selectedAns === null 
                      ? (isDarkMode ? "rgba(255,255,255,0.05)" : "#f1f5f9")
                      : "linear-gradient(135deg, var(--neon-orange), #ffb300)",
                    border: "none",
                    borderRadius: "10px",
                    color: selectedAns === null 
                      ? (isDarkMode ? "rgba(255,255,255,0.2)" : "#cbd5e1")
                      : "#fff",
                    fontWeight: "900",
                    fontSize: "14px",
                    cursor: selectedAns === null ? "default" : "pointer",
                    letterSpacing: "0.5px",
                    transition: "all 0.2s"
                  }}
                >
                  {currentIdx < quizData.postVideoQuestions.length - 1 ? "NEXT QUESTION" : "SUBMIT QUIZ"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Step */}
        {step === "results" && (
          <div style={{ padding: "40px 28px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            {score >= 3 ? (
              <>
                <div style={{ fontSize: "64px", marginBottom: "24px" }}>🏆</div>
                <h3 style={{ color: "#10b981", fontSize: "28px", fontWeight: "900", marginBottom: "8px", textShadow: "0 0 15px rgba(16,185,129,0.3)" }}>
                  VICTORY!
                </h3>
                <p style={{ color: isDarkMode ? "#fff" : "var(--text-light)", fontSize: "16px", fontWeight: "bold", marginBottom: "16px" }}>
                  You scored {score} / 5 correct answers!
                </p>
                <p style={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "var(--text-muted)", fontSize: "14px", marginBottom: "32px", maxWidth: "420px" }}>
                  Milestone cleared successfully. You've earned <strong>+{milestone.xpReward} XP</strong> and unlocked the next nodes on your roadmap!
                </p>
                <button
                  onClick={onClose}
                  style={{
                    width: "100%",
                    padding: "16px",
                    background: "linear-gradient(135deg, var(--neon-blue), var(--neon-pink))",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontWeight: "900",
                    fontSize: "15px",
                    cursor: "pointer",
                    boxShadow: "0 0 20px rgba(0, 242, 254, 0.3)"
                  }}
                >
                  CLOSE &amp; CONTINUE
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: "64px", marginBottom: "24px" }}>💀</div>
                <h3 style={{ color: "#ef4444", fontSize: "28px", fontWeight: "900", marginBottom: "8px", textShadow: "0 0 15px rgba(239,68,68,0.3)" }}>
                  DEFEAT
                </h3>
                <p style={{ color: isDarkMode ? "#fff" : "var(--text-light)", fontSize: "16px", fontWeight: "bold", marginBottom: "16px" }}>
                  You scored {score} / 5 correct answers.
                </p>
                <p style={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "var(--text-muted)", fontSize: "14px", marginBottom: "32px", maxWidth: "420px" }}>
                  You need at least <strong>3 / 5</strong> correct answers to clear this milestone. Watch the recommended training video again and retry the challenge!
                </p>
                
                <div style={{ display: "flex", gap: "16px", width: "100%" }}>
                  <button
                    onClick={handleRetry}
                    style={{
                      flex: 1,
                      padding: "16px",
                      background: isDarkMode ? "rgba(255,255,255,0.05)" : "#f8fafc",
                      border: isDarkMode ? "1.5px solid rgba(255,255,255,0.1)" : "1.5px solid #e2e8f0",
                      borderRadius: "12px",
                      color: isDarkMode ? "#fff" : "var(--text-light)",
                      fontWeight: "900",
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    RETRY CHALLENGE
                  </button>
                  <button
                    onClick={onClose}
                    style={{
                      flex: 1,
                      padding: "16px",
                      background: "#ef4444",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontWeight: "900",
                      fontSize: "14px",
                      cursor: "pointer",
                      boxShadow: "0 0 20px rgba(239,68,68,0.25)"
                    }}
                  >
                    CLOSE
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function PathfinderRoadmap({ roadmap: initialRoadmap, username, onSearchDuel, onReset, onStartSoloStudy, isDarkMode }) {
  const storageKey = `kaevrix_roadmap_progress_${username}`;

  const [roadmap, setRoadmap] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch { return initialRoadmap; }
    }
    return initialRoadmap;
  });

  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [expandedLevel, setExpandedLevel] = useState(1);
  const [viewingNotes, setViewingNotes] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [bossBattleMilestone, setBossBattleMilestone] = useState(null);

  const [isMobileView, setIsMobileView] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const [decryptingLevel, setDecryptingLevel] = useState(null);
  const [decryptError, setDecryptError] = useState(null);

  const handleDecryptLevel = async (levelNum) => {
    if (decryptingLevel) return;
    setDecryptingLevel(levelNum);
    setDecryptError(null);
    try {
      sound.playClockTick();
      
      // Build context of previously completed levels
      const prevContext = [];
      if (levelNum > 1 && roadmap.level1) {
        prevContext.push(...roadmap.level1.milestones.map(m => m.title));
      }
      if (levelNum > 2 && roadmap.level2) {
        prevContext.push(...roadmap.level2.milestones.map(m => m.title));
      }

      const res = await fetchWithJobPolling(`${BACKEND_URL}/api/pathfinder/generate-level`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`
        },
        body: JSON.stringify({
          topic: roadmap.topic,
          level: levelNum,
          previousContext: prevContext.join(", ")
        })
      });

      if (!res.ok) {
        throw new Error("Failed to decrypt level. Neural link unstable.");
      }

      const data = await res.json();
      
      setRoadmap(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next[`level${levelNum}`].milestones = data.milestones;
        return next;
      });
      
      sound.playLevelUp();
    } catch (err) {
      console.error("[Decrypt] Error:", err);
      setDecryptError(err.message);
      sound.playError();
    } finally {
      setDecryptingLevel(null);
    }
  };

  const saveStudyNotes = (milestoneId, notesText) => {
    setRoadmap(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const levelsList = ["level1", "level2", "level3"];
      for (const lk of levelsList) {
        const ms = next[lk]?.milestones || [];
        for (let i = 0; i < ms.length; i++) {
          if (ms[i].id === milestoneId) {
            ms[i].studyNotes = notesText;
            break;
          }
        }
      }
      return next;
    });
  };

  const updateMilestoneData = (milestoneId, updates) => {
    setRoadmap(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const levelsList = ["level1", "level2", "level3"];
      for (const lk of levelsList) {
        const ms = next[lk]?.milestones || [];
        for (let i = 0; i < ms.length; i++) {
          if (ms[i].id === milestoneId) {
            Object.assign(ms[i], updates);
            // also update selectedMilestone if it's the one currently open
            if (selectedMilestone && selectedMilestone.id === milestoneId) {
              setSelectedMilestone(prevSelected => ({ ...prevSelected, ...updates }));
            }
            break;
          }
        }
      }
      return next;
    });
  };

  // Sync to localStorage whenever roadmap changes
  useEffect(() => {
    if (roadmap) {
      localStorage.setItem(storageKey, JSON.stringify(roadmap));
    }
  }, [roadmap, storageKey]);

  // Update roadmap with new initial if parent changes it
  useEffect(() => {
    if (initialRoadmap) {
      setRoadmap(initialRoadmap);
    }
  }, [initialRoadmap]);

  const getAllMilestones = () => [
    ...(roadmap?.level1?.milestones || []),
    ...(roadmap?.level2?.milestones || []),
    ...(roadmap?.level3?.milestones || []),
    ...(roadmap?.level4?.milestones || []),
    ...(roadmap?.level5?.milestones || []),
  ];

  const completedCount = getAllMilestones().filter(m => m.status === "completed").length;
  const totalCount = getAllMilestones().length;
  const totalXpEarned = getAllMilestones().filter(m => m.status === "completed").reduce((s, m) => s + (m.xpReward || 0), 0);

  const markComplete = (milestone) => {
    sound.playCorrect();
    setRoadmap(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const allLevels = ["level1", "level2", "level3"];
      if (next.level4) allLevels.push("level4", "level5");

      let found = false;
      let nextUnlocked = false;

      for (const lk of allLevels) {
        const ms = next[lk]?.milestones || [];
        for (let i = 0; i < ms.length; i++) {
          if (ms[i].id === milestone.id) {
            ms[i].status = "completed";
            found = true;
            if (i + 1 < ms.length && ms[i + 1].status === "locked") {
              ms[i + 1].status = "unlocked";
              nextUnlocked = true;
            }
          }
        }

        if (found && !nextUnlocked) {
          const allDone = ms.every(m => m.status === "completed");
          if (allDone) {
            const nextLevelIdx = allLevels.indexOf(lk) + 1;
            if (nextLevelIdx < allLevels.length) {
              const nextMs = next[allLevels[nextLevelIdx]]?.milestones;
              if (nextMs?.[0]) {
                nextMs[0].status = "unlocked";
                setExpandedLevel(nextLevelIdx + 1);
              }
            }
          }
          break;
        }
      }

      return next;
    });
  };

  const handleBossVictory = (m, xpEarned) => {
    fetch(`${BACKEND_URL}/api/solo-xp`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`
      },
      body: JSON.stringify({
        username,
        xpEarned,
        videoTitle: `Milestone Boss Defeated: ${m.title}`
      })
    }).catch(err => console.error("XP Award Error:", err));

    markComplete(m);
  };

  const getLevelData = (levelKey, levelNum) => {
    const data = roadmap?.[levelKey];
    if (!data) return null;
    const milestones = data.milestones || [];
    const completedInLevel = milestones.filter(m => m.status === "completed").length;
    const isLevelUnlocked = milestones.some(m => m.status !== "locked");
    return { ...data, milestones, completedInLevel, isLevelUnlocked, levelNum };
  };

  if (!roadmap) return null;

  const levels = [
    { key: "level1", num: 1, color: "#10b981" },
    { key: "level2", num: 2, color: "#f59e0b" },
    { key: "level3", num: 3, color: "#8b5cf6" },
  ];
  if (roadmap.level4) {
    levels.push({ key: "level4", num: 4, color: "#ec4899" });
    levels.push({ key: "level5", num: 5, color: "#ef4444" });
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px" }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        .spinner {
          display: inline-block;
          border: 2px solid #00f2fe;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Elden Ring Constellation Path Styles */

        @keyframes graceRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes gracePulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.07); }
        }

        .node-row {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 92px;
          width: 100%;
        }

        .node-connector {
          position: absolute;
          top: 92px;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 50px;
          z-index: 0;
        }

        .node-medallion-container {
          position: relative;
          z-index: 2;
        }

        .node-label-card {
          position: absolute;
          width: 240px;
          padding: 10px 14px;
          border-radius: 12px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 3;
        }

        /* Left-aligned label */
        .node-label-card.align-left {
          right: calc(50% + 52px);
          text-align: right;
          align-items: flex-end;
        }

        /* Right-aligned label */
        .node-label-card.align-right {
          left: calc(50% + 52px);
          text-align: left;
          align-items: flex-start;
        }

        .node-spacer {
          width: 240px;
        }

        /* Responsive styling for mobile */
        @media (max-width: 640px) {
          .node-row {
            justify-content: flex-start;
            height: auto;
            min-height: 92px;
            padding-left: 24px;
            gap: 16px;
          }
          
          .node-connector {
            left: 62px; /* Center of 76px medallion at 24px left padding */
            top: 92px;
            height: calc(100% - 24px);
          }

          .node-label-card {
            position: static !important; /* Back to normal flow */
            width: auto !important;
            flex: 1;
            text-align: left !important;
            align-items: flex-start !important;
            border-left-width: 2.5px !important;
            border-right-width: 0px !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Top Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ 
                fontSize: "11px", 
                fontWeight: "900", 
                color: isDarkMode ? "#00f2fe" : "#ea580c", 
                background: isDarkMode ? "rgba(0,242,254,0.06)" : "#fff7ed", 
                padding: "4px 12px", 
                borderRadius: "20px", 
                border: isDarkMode ? "1px solid rgba(0,242,254,0.3)" : "1px solid #fed7aa", 
                textTransform: "uppercase", 
                letterSpacing: "1px", 
                boxShadow: isDarkMode ? "0 0 10px rgba(0,242,254,0.15)" : "none" 
              }}>
                🗺️ COGNITIVE PATHFINDER
              </span>
            </div>
            <h1 style={{ 
              fontSize: "32px", 
              fontWeight: "900", 
              color: "var(--text-light)", 
              marginBottom: "4px", 
              textShadow: isDarkMode ? "0 0 15px rgba(255,255,255,0.15)" : "none",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              {roadmap.topic}
            </h1>
            <p style={{ 
              color: "var(--text-muted)", 
              fontSize: "15px", 
              maxWidth: "600px", 
              lineHeight: "1.5",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              {roadmap.summary}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            <button
              onClick={() => { sound.playClockTick(); onReset(); }}
              style={{
                padding: "10px 18px", borderRadius: "12px",
                border: isDarkMode ? "1.5px solid var(--glass-border)" : "1.5px solid #e2e8f0", 
                background: isDarkMode ? "var(--bg-dark-surface)" : "#ffffff",
                color: "var(--text-muted)", fontSize: "13px", fontWeight: "700",
                cursor: "pointer", transition: "all 0.2s"
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "var(--neon-orange)"; e.currentTarget.style.color = "var(--text-light)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = isDarkMode ? "var(--glass-border)" : "#e2e8f0"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              🔄 New Roadmap
            </button>
          </div>
        </div>

        {/* Quest Board Stats */}
        {!isMobileView ? (
          <>
            {/* Desktop layout: original 4-card grid */}
            <div className="pathfinder-stats-grid">
              {[
                { label: "Campaign Progress", value: `${completedCount} / ${totalCount}`, sub: "Milestones Cleared", color: "#ff6a00", icon: "🗺️", progress: true },
                { label: "Bounty Reward", value: `+${totalXpEarned} XP`, sub: "Earned from milestones", color: "#eab308", icon: "🏆" },
                { label: "Intel Required", value: `${roadmap.totalVideosEstimated || (totalCount * 2)} Videos`, sub: "Training files to watch", color: "#3b82f6", icon: "🎬" },
                { label: "Campaign Duration", value: `${roadmap.totalEstimatedHours || Math.round((totalCount * 45) / 60)} Hours`, sub: "Total estimated study time", color: "#8b5cf6", icon: "⏱️" },
              ].map((s, i) => (
                <div key={i} className="pathfinder-stat-card" style={{
                  background: isDarkMode ? "var(--bg-dark-surface)" : "#ffffff", 
                  border: isDarkMode ? "1.5px solid var(--glass-border)" : "1.5px solid #e2e8f0",
                  boxShadow: isDarkMode ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "all 0.2s"
                }}
                onMouseOver={e => { 
                  e.currentTarget.style.transform = "translateY(-2px)"; 
                  e.currentTarget.style.borderColor = s.color; 
                  e.currentTarget.style.boxShadow = isDarkMode ? `0 0 20px ${s.color}22` : `0 8px 16px rgba(0,0,0,0.08)`; 
                }}
                onMouseOut={e => { 
                  e.currentTarget.style.transform = "none"; 
                  e.currentTarget.style.borderColor = isDarkMode ? "var(--glass-border)" : "#e2e8f0"; 
                  e.currentTarget.style.boxShadow = isDarkMode ? "none" : "0 2px 8px rgba(0,0,0,0.04)"; 
                }}
                >
                  <div className="pathfinder-stat-icon-wrap" style={{
                    background: `${s.color}15`, 
                    color: s.color,
                    border: `1px solid ${s.color}33`, 
                    boxShadow: `0 0 10px ${s.color}11`
                  }}>
                    {s.icon}
                  </div>
                  <div className="pathfinder-stat-info">
                    <div className="pathfinder-stat-label">{s.label}</div>
                    <div className="pathfinder-stat-value" style={{ color: s.color }}>{s.value}</div>
                    <div className="pathfinder-stat-sub">{s.sub}</div>
                    {s.progress && (
                      <div className="pathfinder-stat-progress-bar">
                        <div style={{ height: "100%", width: `${(completedCount / totalCount) * 100}%`, background: `linear-gradient(90deg, ${s.color}, #ffb300)`, borderRadius: "2px", transition: "width 0.5s" }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Active Daily Quest card */}
            <div style={{
              background: isDarkMode ? "linear-gradient(135deg, rgba(255, 106, 0, 0.08) 0%, transparent 100%)" : "#ffffff", 
              border: isDarkMode ? "1.5px solid rgba(255, 106, 0, 0.25)" : "1.5px solid #fed7aa",
              borderRadius: "18px",
              padding: "20px", 
              display: "flex", gap: "20px", alignItems: "center",
              boxShadow: isDarkMode ? "0 4px 20px rgba(0, 0, 0, 0.3)" : "0 4px 12px rgba(255, 106, 0, 0.03)",
              marginBottom: "24px"
            }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "12px",
                background: "rgba(255, 106, 0, 0.12)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "24px", color: "var(--neon-orange)", flexShrink: 0,
                border: "1px solid rgba(255, 106, 0, 0.25)", boxShadow: "0 0 10px rgba(255, 106, 0, 0.1)"
              }}>
                ⚔️
              </div>
              <div>
                <div style={{ fontSize: "10px", fontWeight: "900", color: "#f97316", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "4px" }}>ACTIVE DAILY QUEST</div>
                <div style={{ fontSize: "16px", fontWeight: "900", color: "var(--text-light)" }}>"{roadmap.dailyGoal || "Complete 1 node and watch 1 video daily"}"</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Complete this objective to maintain your learning streak and gain bonus XP!
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Mobile layout: unified conic gradient stats bar */
          (() => {
            const percent = Math.round((completedCount / totalCount) * 100) || 0;
            const durationVal = `${roadmap.totalEstimatedHours || Math.round((totalCount * 45) / 60)}H`;
            
            return (
              <div className="pathfinder-unified-stats" style={{
                background: isDarkMode ? "var(--bg-dark-surface)" : "#ffffff",
                border: isDarkMode ? "1.5px solid var(--glass-border)" : "1.5px solid #e2e8f0",
                boxShadow: isDarkMode ? "none" : "0 4px 12px rgba(0,0,0,0.03)",
                marginBottom: "18px"
              }}>
                {/* Progress Section */}
                <div className="pathfinder-unified-stat-item">
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: `conic-gradient(var(--neon-orange) ${percent}%, ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"} ${percent}% 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    flexShrink: 0
                  }}>
                    <div style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: isDarkMode ? "#0b0f19" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "900",
                      color: isDarkMode ? "#f8fafc" : "#0f172a"
                    }}>
                      {percent}%
                    </div>
                  </div>
                  <div className="pathfinder-unified-stat-info">
                    <div className="pathfinder-unified-stat-label">Progress</div>
                    <div className="pathfinder-unified-stat-value" style={{ color: "var(--neon-orange)" }}>{completedCount} / {totalCount}</div>
                  </div>
                </div>

                {/* Divider */}
                <div className="pathfinder-unified-divider" style={{ background: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)" }} />

                {/* Reward Section */}
                <div className="pathfinder-unified-stat-item">
                  <div style={{ fontSize: "28px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    🏆
                  </div>
                  <div className="pathfinder-unified-stat-info">
                    <div className="pathfinder-unified-stat-label">Reward</div>
                    <div className="pathfinder-unified-stat-value" style={{ color: "#eab308" }}>+{totalXpEarned} XP</div>
                  </div>
                </div>

                {/* Divider */}
                <div className="pathfinder-unified-divider" style={{ background: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)" }} />

                {/* Duration Section */}
                <div className="pathfinder-unified-stat-item">
                  <div style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    border: isDarkMode ? "2px solid rgba(255,255,255,0.2)" : "2px solid rgba(0,0,0,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isDarkMode ? "#cbd5e1" : "#475569",
                    flexShrink: 0
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="pathfinder-unified-stat-info">
                    <div className="pathfinder-unified-stat-label">Duration</div>
                    <div className="pathfinder-unified-stat-value" style={{ color: "#8b5cf6" }}>{durationVal}</div>
                  </div>
                </div>
              </div>
            );
          })()
        )}


        {/* Legend */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
          {Object.entries(getStatusConfig(isDarkMode)).map(([key, cfg]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: cfg.bg, border: `1.5px solid ${cfg.border}`, boxShadow: `0 0 6px ${cfg.border}` }} />
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Levels */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {levels.map(({ key, num, color }) => {
          const data = getLevelData(key, num);
          if (!data) return null;
          const isOpen = expandedLevel === num;
          const meta = LEVEL_META[num];

          return (
            <div key={key} style={{
              background: isDarkMode ? "var(--bg-dark-surface)" : "#ffffff", 
              borderRadius: "24px",
              border: isDarkMode 
                ? `1.5px solid ${data.isLevelUnlocked ? color + "66" : "var(--glass-border)"}`
                : `1.5px solid ${data.isLevelUnlocked ? color + "44" : "#e2e8f0"}`,
              overflow: "hidden",
              boxShadow: isDarkMode 
                ? (data.isLevelUnlocked ? `0 0 25px ${color}11` : "none")
                : (data.isLevelUnlocked ? `0 4px 20px ${color}11` : "0 2px 8px rgba(0,0,0,0.04)"),
              opacity: data.isLevelUnlocked ? 1 : 0.45,
              transition: "all 0.3s"
            }}>
              {/* Level header — clickable to expand */}
              <div
                onClick={() => { sound.playClockTick(); setExpandedLevel(isOpen ? 0 : num); }}
                className="pathfinder-level-header"
                style={{
                  background: data.isLevelUnlocked
                    ? (isDarkMode 
                        ? `linear-gradient(135deg, ${color}15 0%, transparent 100%)` 
                        : `linear-gradient(135deg, ${color}08 0%, transparent 100%)`)
                    : (isDarkMode ? "rgba(0,0,0,0.2)" : "#f8fafc"),
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "16px",
                  borderBottom: isOpen ? (isDarkMode ? "1px solid var(--glass-border)" : "1px solid #e2e8f0") : "none"
                }}
              >
                <div style={{
                  width: "48px", height: "48px", borderRadius: "14px",
                  background: data.isLevelUnlocked
                    ? `linear-gradient(135deg, ${color}, ${color}bb)`
                    : "rgba(100, 100, 100, 0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", flexShrink: 0,
                  boxShadow: data.isLevelUnlocked ? `0 0 15px ${color}44` : "none",
                  border: `1.5px solid ${data.isLevelUnlocked ? "rgba(255,255,255,0.2)" : "var(--glass-border)"}`
                }}>
                  {data.isLevelUnlocked ? meta.emoji : "🔒"}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: "900", color: "var(--text-light)", textShadow: isDarkMode ? "0 0 8px rgba(255,255,255,0.1)" : "none" }}>
                      {data.title}
                    </h2>
                    {!data.isLevelUnlocked && (
                      <span style={{ 
                        fontSize: "10px", 
                        fontWeight: "900", 
                        color: isDarkMode ? "var(--text-muted)" : "#94a3b8", 
                        background: isDarkMode ? "rgba(255,255,255,0.05)" : "#f1f5f9", 
                        padding: "2px 8px", 
                        borderRadius: "8px", 
                        border: isDarkMode ? "1px solid var(--glass-border)" : "1px solid #e2e8f0" 
                      }}>
                        🔒 LOCKED
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{data.subtitle}</p>
                </div>

                {/* Level progress */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "16px", fontWeight: "900", color }}>
                    {data.completedInLevel} / {data.milestones.length}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>completed</div>
                  <div style={{ marginTop: "6px", width: "80px", height: "4px", background: isDarkMode ? "rgba(100, 100, 100, 0.15)" : "#e2e8f0", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(data.completedInLevel / data.milestones.length) * 100}%`,
                      background: color, borderRadius: "2px", transition: "width 0.5s",
                      boxShadow: `0 0 6px ${color}`
                    }} />
                  </div>
                </div>

                <div style={{ transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "none" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", display: "block" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Milestones — shown when expanded */}
              {isOpen && (() => {
                // Swap layouts dynamically: horizontal sine wave for desktop, vertical snake for mobile
                const layout = !isMobileView 
                  ? getConstellationLayoutDesktop(data.milestones.length)
                  : getConstellationLayoutMobile(data.milestones.length);
                const isLevelComplete = data.completedInLevel === data.milestones.length;
                return (
                  <div className="pathfinder-constellation-container" style={{ 
                    padding: "40px", 
                    background: "#09090b", // ALWAYS dark for gaming vibe
                    position: "relative",
                    overflow: "hidden",
                    borderBottomLeftRadius: "16px",
                    borderBottomRightRadius: "16px",
                    backgroundImage: `
                      radial-gradient(circle at 50% 50%, ${color}1a 0%, transparent 70%),
                      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '100% 100%, 40px 40px, 40px 40px'
                  }}>
                    {/* gamified constellation skill path */}
                    <div style={{
                      position: "relative",
                      width: "100%",
                      height: !isMobileView ? "350px" : `${Math.max(380, data.milestones.length * 80)}px`,
                      margin: "20px 0",
                    }}>
                      {/* SVG Connecting Lines */}
                      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "visible" }}>
                        {data.milestones.map((milestone, idx) => {
                          const start = layout[idx];
                          const nextIdx = (idx + 1) % data.milestones.length;
                          const end = layout[nextIdx];
                          
                          // Only draw the final closing line if the level is complete and we have enough nodes for a polygon
                          if (idx === data.milestones.length - 1 && (!isLevelComplete || data.milestones.length < 3)) return null;

                          const isLineActive = milestone.status === "completed";
                          const lineNeon = "#00f2fe";
                          
                          return (
                            <line
                              key={`line-${idx}`}
                              x1={`${start.x}%`} y1={`${start.y}%`}
                              x2={`${end.x}%`} y2={`${end.y}%`}
                              stroke={isLineActive ? lineNeon : (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)")}
                              strokeWidth={isLineActive ? "5" : "2"}
                              strokeDasharray={isLineActive ? "none" : "8, 8"}
                              style={{
                                filter: isLineActive ? `drop-shadow(0 0 15px ${lineNeon}) drop-shadow(0 0 30px ${lineNeon}88)` : "none",
                                transition: "all 0.5s ease"
                              }}
                            />
                          );
                        })}
                      </svg>

                      {/* Completion Emoji Overlay */}
                      {isLevelComplete && (
                        <div style={{
                          position: "absolute",
                          top: "50%", left: "50%",
                          transform: "translate(-50%, -50%)",
                          fontSize: "140px",
                          opacity: isDarkMode ? 0.2 : 0.1,
                          pointerEvents: "none",
                          zIndex: 0,
                          textShadow: `0 0 50px ${color}`,
                          animation: "gracePulse 3s infinite ease-in-out"
                        }}>
                          👌
                      </div>
                      )}

                      {/* Nodes */}
                      {data.milestones.map((milestone, idx) => (
                        <MilestoneNode
                          key={milestone.id}
                          milestone={milestone}
                          levelColor={color}
                          isSelected={selectedMilestone?.id === milestone.id}
                          onSelect={(m) => {
                            sound.playClockTick();
                            setSelectedMilestone(m);
                          }}
                          isDarkMode={isDarkMode}
                          position={layout[idx]}
                        />
                      ))}
                    </div>

                    {/* Level completion or Decrypt Next Level message */}
                    {(() => {
                      if (data.completedInLevel !== data.milestones.length) return null;
                      
                      const nextLevelNum = data.levelNum + 1;
                      const nextLevelKey = `level${nextLevelNum}`;
                      const nextLevelData = roadmap[nextLevelKey];
                      const isNextEncrypted = nextLevelData?.milestones?.[0]?.isEncrypted;

                      if (isNextEncrypted) {
                        const isDecrypting = decryptingLevel === nextLevelNum;
                        return (
                          <div style={{
                            marginTop: "20px", padding: "20px",
                            background: isDarkMode ? `linear-gradient(135deg, #0b0f19, ${color}15)` : `linear-gradient(135deg, #f8fafc, ${color}10)`,
                            border: `1.5px solid ${color}44`,
                            borderRadius: "14px", textAlign: "center",
                            boxShadow: `0 0 25px ${color}11`
                          }}>
                            <div style={{ fontWeight: "800", color, fontSize: "16px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
                              Neural Link Established
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                              You have mastered Level {data.levelNum}. Level {nextLevelNum} is currently encrypted.
                            </div>
                            
                            {decryptError && decryptingLevel === nextLevelNum && (
                              <div style={{ color: "#ef4444", fontSize: "12px", marginBottom: "12px" }}>
                                {decryptError}
                              </div>
                            )}

                            <button 
                              onClick={() => handleDecryptLevel(nextLevelNum)}
                              disabled={isDecrypting}
                              style={{
                                background: isDecrypting ? "#334155" : `linear-gradient(45deg, ${color}, #2563eb)`,
                                color: "#fff",
                                border: "none",
                                padding: "12px 24px",
                                borderRadius: "8px",
                                fontWeight: "bold",
                                fontSize: "14px",
                                cursor: isDecrypting ? "not-allowed" : "pointer",
                                display: "inline-flex", alignItems: "center", gap: "8px",
                                boxShadow: isDecrypting ? "none" : `0 4px 15px ${color}66`,
                                transition: "all 0.2s"
                              }}>
                              {isDecrypting ? (
                                <>
                                  <span style={{ animation: "spin 1s linear infinite" }}>⚙️</span> Decrypting Curriculum...
                                </>
                              ) : (
                                <>
                                  🔓 Decrypt Level {nextLevelNum}
                                </>
                              )}
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div style={{
                          marginTop: "20px",
                          padding: "16px 20px",
                          background: `${color}15`,
                          border: `1.5px solid ${color}44`,
                          borderRadius: "14px",
                          display: "flex", alignItems: "center", gap: "12px",
                          boxShadow: `0 0 15px ${color}11`
                        }}>
                          <span style={{ fontSize: "24px" }}>🎉</span>
                          <div>
                            <div style={{ fontWeight: "800", color, fontSize: "15px" }}>Level Complete!</div>
                            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                              You've mastered all {data.milestones.length} milestones in this level.
                              {nextLevelData ? " Next level unlocked!" : " You've completed the roadmap!"}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Milestone detail modal */}
      {selectedMilestone && !viewingNotes && (
        <MilestoneDetailPanel
          roadmapTopic={roadmap.topic}
          milestone={selectedMilestone}
          levelColor={
            roadmap.level1?.milestones?.find(m => m.id === selectedMilestone.id) ? "#10b981" :
            roadmap.level2?.milestones?.find(m => m.id === selectedMilestone.id) ? "#f59e0b" : "#8b5cf6"
          }
          onClose={() => setSelectedMilestone(null)}
          onSearchDuel={onSearchDuel}
          onMarkComplete={(m) => { markComplete(m); setSelectedMilestone(null); }}
          onUpdateMilestoneData={updateMilestoneData}
          onOpenNotes={() => setViewingNotes(true)}
          onSelectVideo={(video) => {
            if (onStartSoloStudy) {
              onStartSoloStudy(video);
            }
            setSelectedMilestone(null);
          }}
          isDarkMode={isDarkMode}
          username={username}
          onChallengeBoss={(m) => setBossBattleMilestone(m)}
        />
      )}

      {/* Solo Learning Video / Quiz Modal Embed */}
      {activeVideo && selectedMilestone && (
        <SoloLearningModal
          video={activeVideo}
          milestone={selectedMilestone}
          username={username}
          isDarkMode={isDarkMode}
          onClose={() => setActiveVideo(null)}
          onMarkComplete={(m) => {
            markComplete(m);
            setSelectedMilestone(null);
            setActiveVideo(null);
          }}
        />
      )}

      {/* Fullscreen Notes Reader */}
      {viewingNotes && selectedMilestone && (
        <FullscreenNotesReader
          milestone={selectedMilestone}
          roadmapTopic={roadmap.topic}
          levelColor={
            roadmap.level1?.milestones?.find(m => m.id === selectedMilestone.id) ? "#10b981" :
            roadmap.level2?.milestones?.find(m => m.id === selectedMilestone.id) ? "#f59e0b" : "#8b5cf6"
          }
          username={username}
          onClose={() => setViewingNotes(false)}
          onSearchDuel={onSearchDuel}
          onMarkComplete={(m) => { markComplete(m); setViewingNotes(false); setSelectedMilestone(null); }}
          onSaveNotes={saveStudyNotes}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Kaevrix Boss Battle Modal */}
      {bossBattleMilestone && (
        <BossBattleModal
          topic={roadmap.topic}
          milestone={bossBattleMilestone}
          username={username}
          onClose={() => setBossBattleMilestone(null)}
          onVictory={(xpEarned) => handleBossVictory(bossBattleMilestone, xpEarned)}
        />
      )}
    </div>
  );
}
