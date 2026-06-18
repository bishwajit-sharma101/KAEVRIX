import { useState, useEffect } from "react";
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
};

const getConstellationLayout = (n) => {
  if (n === 1) return [{x: 50, y: 50}];
  if (n === 2) return [{x: 20, y: 50}, {x: 80, y: 50}];
  if (n === 3) return [{x: 20, y: 80}, {x: 50, y: 20}, {x: 80, y: 80}]; // Triangle
  
  // Organic Constellation Path (Sine Wave)
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
    ? `2px solid ${isDarkMode ? "rgba(100,90,80,0.25)" : "#e2e8f0"}`
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
          background: isCompleted ? neonColor : (isActive ? neonColor : "#1e293b"),
          borderRadius: "12px", // rounded diamond
          transform: "rotate(45deg)",
          boxShadow: isCompleted ? `0 0 25px ${neonColor}, 0 0 50px ${neonColor}66` : (isActive ? `0 0 20px ${neonColor}aa` : "none"),
          border: `2px solid ${isCompleted || isActive ? "#ffffff" : "#334155"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2,
        }}>
          {/* Inner Dark Tech Core */}
          <div style={{
            width: "44px", height: "44px",
            background: "#0f172a",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "inset 0 0 15px rgba(0,0,0,0.9), 0 0 5px rgba(0,0,0,0.5)"
          }}>
            {/* Un-rotated Icon Container */}
            <span style={{
              transform: "rotate(-45deg)", 
              color: isCompleted ? neonColor : (isActive ? neonColor : "#64748b"),
              fontSize: "22px", fontWeight: "900",
              textShadow: isCompleted || isActive ? `0 0 15px ${neonColor}` : "none"
            }}>
              {isCompleted ? "✓" : (isLocked ? "🔒" : "◈")}
            </span>
          </div>
        </div>
      </div>
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
      const res = await fetch(`${BACKEND_URL}/api/pathfinder/study-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

                {/* Progress Terminal Log */}
                <div style={{
                  width: "100%",
                  maxWidth: "480px",
                  background: "#090d16",
                  borderRadius: "16px",
                  padding: "20px 24px",
                  border: "1px solid #1e293b",
                  boxShadow: "0 12px 24px rgba(0,0,0,0.1)"
                }}>
                  {genLog.map((log, idx) => (
                    <div key={idx} style={{
                      fontFamily: "monospace",
                      fontSize: "12.5px",
                      color: idx === genLog.length - 1 ? "#ea580c" : "#94a3b8",
                      marginBottom: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span style={{ color: idx < genLog.length - 1 ? "#10b981" : "#ea580c" }}>
                        {idx < genLog.length - 1 ? "✓" : "⚡"}
                      </span>
                      {log}
                    </div>
                  ))}
                  {genStep < STUDY_GEN_LOGS.length - 1 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#ea580c",
                        animation: "pulse 0.8s infinite"
                      }} />
                      <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#475569" }}>
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

  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const keyPoints = milestone.keyPoints || [];
  const activeSubtopicIndex = milestone.subtopicIndex || 0;
  const isAllSubtopicsFinished = activeSubtopicIndex >= keyPoints.length;

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
    // Only search if strictly unlocked (skip locked and completed) and not all finished
    if (milestone.status === "unlocked" && !isAllSubtopicsFinished && keyPoints.length > 0) {
      const currentSubtopic = keyPoints[activeSubtopicIndex];
      // Construct dynamic search query
      const dynamicQuery = `${roadmapTopic} ${currentSubtopic} tutorial`;
      
      setLoadingVideos(true);
      fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(dynamicQuery)}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // User requested ONLY ONE video (the best one)
            setVideos(data.slice(0, 1));
          }
        })
        .catch(err => console.error("Error searching videos:", err))
        .finally(() => setLoadingVideos(false));
    }
  }, [milestone.status, activeSubtopicIndex, keyPoints, roadmapTopic]);

  const handleFinishSubtopic = () => {
    sound.playCorrect();
    onUpdateMilestoneData(milestone.id, { subtopicIndex: activeSubtopicIndex + 1 });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(3, 5, 10, 0.8)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px"
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "600px",
          background: isDarkMode ? "rgba(10, 16, 32, 0.95)" : "#ffffff",
          border: isDarkMode ? "1.5px solid rgba(0, 242, 254, 0.25)" : "1.5px solid #e2e8f0",
          boxShadow: isDarkMode ? "0 30px 80px rgba(0,0,0,0.6)" : "0 30px 80px rgba(0,0,0,0.15)",
          display: "flex", flexDirection: "column",
          borderRadius: "24px",
          overflow: "hidden",
          maxHeight: "90vh"
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 28px",
          borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9",
          background: isDarkMode ? "rgba(255,255,255,0.02)" : "#f8fafc",
          position: "relative"
        }}>
          <button onClick={onClose} style={{
            position: "absolute", top: "20px", right: "20px",
            width: "32px", height: "32px", borderRadius: "50%",
            border: isDarkMode ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e8f0", 
            background: isDarkMode ? "rgba(0,0,0,0.3)" : "#ffffff",
            cursor: "pointer", fontSize: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: isDarkMode ? "rgba(255,255,255,0.6)" : "#64748b"
          }}>✕</button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{
              fontSize: "10px", fontWeight: "800", color: isDarkMode ? "#000" : "#ffffff",
              background: levelColor, padding: "3px 10px", borderRadius: "8px",
              textTransform: "uppercase", letterSpacing: "1px",
              boxShadow: isDarkMode ? `0 0 10px ${levelColor}` : "none"
            }}>
              {cfg.label}
            </span>
            {milestone.estimatedMinutes && (
              <span style={{ fontSize: "12px", color: isDarkMode ? "rgba(255,255,255,0.6)" : "var(--text-muted)", fontWeight: "600" }}>⏱ {milestone.estimatedMinutes} min</span>
            )}
            <span style={{ fontSize: "12px", fontWeight: "800", color: levelColor }}>+{milestone.xpReward} XP</span>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: isDarkMode ? "#fff" : "var(--text-light)", lineHeight: "1.3", marginBottom: "6px" }}>
            {cleanMilestoneTitle(milestone.title)}
          </h2>
          <p style={{ fontSize: "14px", color: isDarkMode ? "rgba(255,255,255,0.6)" : "var(--text-muted)", lineHeight: "1.5", margin: 0 }}>
            {cleanMilestoneTitle(milestone.description).replace("Get started with Module,", "Get started,")}
          </p>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: "24px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Key Objectives & Subtopic Progression */}
          {keyPoints.length > 0 && (
            <div>
              <h3 style={{ fontSize: "11px", fontWeight: "900", color: "var(--neon-orange)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>
                📌 Subtopic Objectives
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {keyPoints.map((pt, i) => {
                  const isFinished = milestone.status === "completed" || i < activeSubtopicIndex;
                  const isUnlocked = milestone.status !== "locked" && i === activeSubtopicIndex;
                  const isLocked = milestone.status === "locked" || i > activeSubtopicIndex;
                  
                  return (
                    <div key={i} style={{ 
                      display: "flex", flexDirection: "column", gap: "10px",
                      opacity: isLocked ? 0.5 : 1,
                      background: isUnlocked ? (isDarkMode ? "rgba(0,242,254,0.03)" : "#f0f9ff") : "transparent",
                      border: isUnlocked ? `1px solid ${isDarkMode ? "rgba(0,242,254,0.2)" : "#bae6fd"}` : "1px solid transparent",
                      borderRadius: "12px",
                      padding: isUnlocked ? "12px" : "4px 12px",
                      transition: "all 0.3s"
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                        <div style={{
                          width: "22px", height: "22px", borderRadius: "50%",
                          background: isFinished ? "#10b981" : (isUnlocked ? "var(--neon-blue)" : (isDarkMode ? "rgba(255,255,255,0.1)" : "#f1f5f9")),
                          color: (isFinished || isUnlocked) ? "#fff" : (isDarkMode ? "#fff" : "#475569"),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: "900", flexShrink: 0, marginTop: "0px",
                          boxShadow: isUnlocked ? "0 0 10px var(--neon-blue)" : "none"
                        }}>
                          {isFinished ? "✓" : (isUnlocked ? "▶" : i + 1)}
                        </div>
                        <span style={{ 
                          fontSize: "14px", 
                          color: isFinished ? "var(--text-muted)" : (isDarkMode ? "rgba(255,255,255,0.9)" : "var(--text-light)"),
                          textDecoration: isFinished ? "line-through" : "none",
                          fontWeight: isUnlocked ? "800" : "500",
                          lineHeight: "1.4",
                          marginTop: "2px"
                        }}>
                          {pt}
                        </span>
                      </div>
                      
                      {/* Dynamic Video Embed for the CURRENTLY Unlocked Subtopic */}
                      {isUnlocked && (
                        <div style={{ paddingLeft: "34px", marginTop: "4px" }}>
                          {loadingVideos ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: isDarkMode ? "rgba(255,255,255,0.4)" : "var(--text-muted)", fontSize: "12px" }}>
                              <div className="spinner" style={{ width: "14px", height: "14px", border: `2px solid ${isDarkMode ? "#00f2fe" : "var(--neon-blue)"}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                              Scanning YouTube for precisely "{pt}"...
                            </div>
                          ) : videos.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                              {videos.map((vid) => (
                                <div
                                  key={vid.id}
                                  onClick={() => onSelectVideo && onSelectVideo(vid)}
                                  style={{
                                    display: "flex", gap: "12px", padding: "10px",
                                    background: isDarkMode ? "rgba(255,255,255,0.02)" : "#ffffff",
                                    border: isDarkMode ? "1.5px solid rgba(255,255,255,0.06)" : "1.5px solid #e2e8f0",
                                    borderRadius: "10px", cursor: "pointer",
                                    transition: "all 0.2s", alignItems: "center",
                                    boxShadow: isDarkMode ? "none" : "0 2px 5px rgba(0,0,0,0.02)"
                                  }}
                                  onMouseOver={e => { e.currentTarget.style.borderColor = "var(--neon-blue)"; e.currentTarget.style.background = isDarkMode ? "rgba(0,242,254,0.04)" : "rgba(255,106,0,0.04)"; }}
                                  onMouseOut={e => { e.currentTarget.style.borderColor = isDarkMode ? "rgba(255,255,255,0.06)" : "#e2e8f0"; e.currentTarget.style.background = isDarkMode ? "rgba(255,255,255,0.02)" : "#ffffff"; }}
                                >
                                  <div style={{ width: "100px", height: "56px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, position: "relative", background: "#000" }}>
                                    <img src={vid.thumbnail} alt="thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    <span style={{ position: "absolute", bottom: "2px", right: "4px", background: "rgba(0,0,0,0.8)", fontSize: "9px", color: "#fff", padding: "1px 3px", borderRadius: "3px" }}>
                                      {Math.floor(vid.duration / 60)}:{String(vid.duration % 60).padStart(2, '0')}
                                    </span>
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ color: isDarkMode ? "#fff" : "var(--text-light)", fontSize: "13px", fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: "4px" }}>
                                      {vid.title}
                                    </div>
                                    <div style={{ color: isDarkMode ? "rgba(255,255,255,0.4)" : "var(--text-muted)", fontSize: "11px" }}>
                                      🎬 {vid.channel}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              <button 
                                onClick={handleFinishSubtopic}
                                style={{
                                  padding: "8px 16px", borderRadius: "8px", border: "none",
                                  background: "#10b981", color: "#fff", fontWeight: "800", fontSize: "12px",
                                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                                }}
                              >
                                ✓ Finish Subtopic
                              </button>
                            </div>
                          ) : (
                            <div style={{ color: isDarkMode ? "rgba(255,255,255,0.4)" : "var(--text-muted)", fontSize: "12px" }}>
                              No specific video found for this subtopic. Click "Finish Subtopic" to proceed.
                              <button 
                                onClick={handleFinishSubtopic}
                                style={{
                                  marginTop: "8px", width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #10b981",
                                  background: "transparent", color: "#10b981", fontWeight: "700", fontSize: "12px", cursor: "pointer"
                                }}
                              >
                                ✓ Mark Subtopic Complete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}


        </div>

        {/* Footer actions */}
        <div style={{
          padding: "20px 28px",
          borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9",
          display: "flex", gap: "12px",
          background: isDarkMode ? "rgba(255,255,255,0.02)" : "#f8fafc"
        }}>
          {milestone.status !== "locked" && (
            <button
              onClick={() => { sound.playClockTick(); onSearchDuel(milestone); onClose(); }}
              style={{
                flex: 1, padding: "12px 20px", borderRadius: "10px",
                border: isDarkMode ? "none" : "1.5px solid #e2e8f0", 
                background: isDarkMode ? "rgba(255,255,255,0.06)" : "#ffffff",
                color: isDarkMode ? "#fff" : "var(--text-light)", 
                fontWeight: "800", fontSize: "13.5px",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "6px"
              }}
            >
              ⚔️ Duel Topic
            </button>
          )}

          {milestone.status === "unlocked" && onChallengeBoss && (
            <button
              onClick={() => { sound.playClockTick(); onChallengeBoss(milestone); onClose(); }}
              style={{
                flex: 1, padding: "12px 20px", borderRadius: "10px",
                border: "none",
                background: `linear-gradient(135deg, ${levelColor}, ${levelColor}dd)`,
                color: "#ffffff",
                fontWeight: "900", fontSize: "13.5px",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "6px",
                boxShadow: `0 4px 15px ${levelColor}35`
              }}
            >
              ⚔️ Challenge Boss
            </button>
          )}

          {milestone.status === "unlocked" && isAllSubtopicsFinished && (
            <button
              onClick={() => { sound.playClockTick(); onMarkComplete(milestone); onClose(); }}
              style={{
                padding: "12px 20px", borderRadius: "10px",
                border: `1.5px solid ${levelColor}`, background: "transparent",
                color: levelColor, fontWeight: "700", fontSize: "13px",
                cursor: "pointer"
              }}
            >
              ✓ Mark Milestone Complete
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

  const handleExplodeComplete = () => {
    setShowRuneLoader(false);
    setIsExploding(false);
    if (pendingQuizData) {
      setQuizData(pendingQuizData);
      setAnswers(Array(pendingQuizData.postVideoQuestions.length).fill(null));
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
      const res = await fetch(`${BACKEND_URL}/api/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          title: video.title,
          duration: video.duration
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
          headers: { "Content-Type": "application/json" },
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

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000,
      background: isDarkMode ? "rgba(3, 5, 10, 0.95)" : "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        width: "100%", maxWidth: "700px",
        background: isDarkMode ? "rgba(10, 16, 32, 0.95)" : "#ffffff",
        border: isDarkMode ? "1.5px solid rgba(0, 242, 254, 0.3)" : "1.5px solid #e2e8f0",
        boxShadow: isDarkMode ? "0 0 40px rgba(0, 242, 254, 0.15)" : "0 30px 80px rgba(0,0,0,0.15)",
        borderRadius: "24px",
        overflow: "hidden",
        display: "flex", flexDirection: "column"
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
          <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--neon-orange)", fontWeight: "bold", fontSize: "13px" }}>
                QUESTION {currentIdx + 1} OF {quizData.postVideoQuestions.length}
              </span>
              <span style={{ color: isDarkMode ? "rgba(255,255,255,0.4)" : "var(--text-muted)", fontSize: "13px" }}>
                Score: {score}
              </span>
            </div>

            <div style={{ color: isDarkMode ? "#fff" : "var(--text-light)", fontSize: "18px", fontWeight: "800", lineHeight: "1.4" }}>
              {quizData.postVideoQuestions[currentIdx].question}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {quizData.postVideoQuestions[currentIdx].options.map((opt, oIdx) => {
                const isSelected = selectedAns === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleAnswerSelect(oIdx)}
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      background: isSelected 
                        ? (isDarkMode ? "rgba(0, 242, 254, 0.1)" : "rgba(255, 106, 0, 0.08)")
                        : (isDarkMode ? "rgba(255,255,255,0.02)" : "#f8fafc"),
                      border: isSelected
                        ? `1.5px solid ${isDarkMode ? "var(--neon-blue)" : "var(--neon-orange)"}`
                        : `1.5px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                      borderRadius: "12px",
                      color: isSelected 
                        ? (isDarkMode ? "#fff" : "var(--text-light)")
                        : (isDarkMode ? "rgba(255,255,255,0.8)" : "var(--text-light)"),
                      fontWeight: "600",
                      fontSize: "14px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: isSelected 
                        ? (isDarkMode ? "0 0 15px rgba(0, 242, 254, 0.15)" : "0 0 15px rgba(255,106,0,0.12)")
                        : "none"
                    }}
                    onMouseOver={e => { if(!isSelected) e.currentTarget.style.borderColor = isDarkMode ? "rgba(255,255,255,0.2)" : "#cbd5e1"; }}
                    onMouseOut={e => { if(!isSelected) e.currentTarget.style.borderColor = isDarkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0"; }}
                  >
                    <span style={{ color: isSelected ? (isDarkMode ? "var(--neon-blue)" : "var(--neon-orange)") : (isDarkMode ? "rgba(255,255,255,0.4)" : "#94a3b8"), marginRight: "12px", fontWeight: "900" }}>
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
                padding: "16px",
                background: selectedAns === null 
                  ? (isDarkMode ? "rgba(255,255,255,0.05)" : "#f1f5f9")
                  : "linear-gradient(135deg, var(--neon-orange), #ffb300)",
                border: "none",
                borderRadius: "12px",
                color: selectedAns === null 
                  ? (isDarkMode ? "rgba(255,255,255,0.2)" : "#cbd5e1")
                  : "#fff",
                fontWeight: "900",
                fontSize: "15px",
                cursor: selectedAns === null ? "default" : "pointer",
                letterSpacing: "1px",
                transition: "all 0.2s"
              }}
            >
              {currentIdx < quizData.postVideoQuestions.length - 1 ? "NEXT QUESTION" : "SUBMIT QUIZ"}
            </button>
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

      const res = await fetch(`${BACKEND_URL}/api/pathfinder/generate-level`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
  ];

  const completedCount = getAllMilestones().filter(m => m.status === "completed").length;
  const totalCount = getAllMilestones().length;
  const totalXpEarned = getAllMilestones().filter(m => m.status === "completed").reduce((s, m) => s + (m.xpReward || 0), 0);

  const markComplete = (milestone) => {
    sound.playCorrect();
    setRoadmap(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const allLevels = ["level1", "level2", "level3"];

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
      headers: { "Content-Type": "application/json" },
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

        {/* Quest Board Stats (Glass panel glowing border) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginTop: "24px",
          marginBottom: "18px"
        }}>
          {[
            { label: "Campaign Progress", value: `${completedCount} / ${totalCount}`, sub: "Milestones Cleared", color: "#ff6a00", icon: "🗺️", progress: true },
            { label: "Bounty Reward", value: `+${totalXpEarned} XP`, sub: "Earned from milestones", color: "#eab308", icon: "🏆" },
            { label: "Intel Required", value: `${roadmap.totalVideosEstimated || (totalCount * 2)} Videos`, sub: "Training files to watch", color: "#3b82f6", icon: "🎬" },
            { label: "Campaign Duration", value: `${roadmap.totalEstimatedHours || Math.round((totalCount * 45) / 60)} Hours`, sub: "Total estimated study time", color: "#8b5cf6", icon: "⏱️" },
          ].map((s, i) => (
            <div key={i} style={{
              background: isDarkMode ? "var(--bg-dark-surface)" : "#ffffff", 
              borderRadius: "18px",
              padding: "20px", 
              border: isDarkMode ? "1.5px solid var(--glass-border)" : "1.5px solid #e2e8f0",
              boxShadow: isDarkMode ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
              display: "flex", gap: "16px", alignItems: "center",
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
              <div style={{
                width: "48px", height: "48px", borderRadius: "12px",
                background: `${s.color}15`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "22px", color: s.color, flexShrink: 0,
                border: `1px solid ${s.color}33`, boxShadow: `0 0 10px ${s.color}11`
              }}>
                {s.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>{s.label}</div>
                <div style={{ fontSize: "18px", fontWeight: "900", color: s.color, lineHeight: "1.2" }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", fontWeight: "600" }}>{s.sub}</div>
                {s.progress && (
                  <div style={{ marginTop: "8px", height: "4px", background: "rgba(100, 100, 100, 0.15)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(completedCount / totalCount) * 100}%`, background: `linear-gradient(90deg, ${s.color}, #ffb300)`, borderRadius: "2px", transition: "width 0.5s" }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>


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
                style={{
                  padding: "20px 28px",
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

                <div style={{ fontSize: "16px", color: "var(--text-muted)", transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "none" }}>
                  ▼
                </div>
              </div>

              {/* Milestones — shown when expanded */}
              {isOpen && (() => {
                const layout = getConstellationLayout(data.milestones.length);
                const isLevelComplete = data.completedInLevel === data.milestones.length;
                return (
                <div style={{ 
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
                    height: "350px", // Organic snake needs less vertical height than tree
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
                          background: `linear-gradient(135deg, #0f172a, ${color}15)`,
                          border: `1.5px solid ${color}66`,
                          borderRadius: "14px", textAlign: "center",
                          boxShadow: `0 0 25px ${color}22`
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
