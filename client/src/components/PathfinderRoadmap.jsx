import { useState, useEffect } from "react";
import * as sound from "../utils/audio";

const BACKEND_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:5000" : "";

// Status visual config
const STATUS_CONFIG = {
  completed:  { bg: "#dcfce7", border: "#16a34a", text: "#16a34a", icon: "✓", label: "Completed" },
  active:     { bg: "#fff7ed", border: "#ff6a00", text: "#ff6a00", icon: "▶", label: "In Progress" },
  unlocked:   { bg: "#ffffff", border: "#e2e8f0", text: "#64748b", icon: "○", label: "Available" },
  locked:     { bg: "#f8fafc", border: "#e2e8f0", text: "#cbd5e1", icon: "🔒", label: "Locked" },
  revision:   { bg: "#fef9c3", border: "#ca8a04", text: "#ca8a04", icon: "↺", label: "Revision" },
};

const LEVEL_META = {
  1: { emoji: "🌱", label: "Foundations", range: "Basic → Intermediate" },
  2: { emoji: "⚡", label: "Intermediate", range: "Intermediate → Advanced" },
  3: { emoji: "🔥", label: "Mastery",     range: "Advanced → God Tier" },
};

function MilestoneNode({ milestone, levelColor, isLastInLevel, onSelect, isSelected, levelNum }) {
  const cfg = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.locked;
  const isClickable = milestone.status !== "locked";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      {/* Connector line above (except first) */}
      {!isLastInLevel && (
        <div style={{
          position: "absolute", top: "52px", left: "50%",
          transform: "translateX(-50%)",
          width: "2px", height: "40px",
          background: milestone.status === "completed"
            ? levelColor
            : "repeating-linear-gradient(to bottom, #e2e8f0 0, #e2e8f0 5px, transparent 5px, transparent 10px)",
          zIndex: 0
        }} />
      )}

      {/* The node card */}
      <div
        onClick={() => isClickable && onSelect(milestone)}
        style={{
          width: "260px",
          background: isSelected ? `${cfg.bg}` : cfg.bg,
          border: `2px solid ${isSelected ? levelColor : cfg.border}`,
          borderRadius: "16px",
          padding: "16px 18px",
          cursor: isClickable ? "pointer" : "default",
          transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: isSelected
            ? `0 8px 30px ${levelColor}33, 0 0 0 4px ${levelColor}22`
            : "0 2px 8px rgba(0,0,0,0.05)",
          position: "relative",
          zIndex: 1,
          transform: isSelected ? "scale(1.03)" : milestone.status === "locked" ? "none" : "none",
          opacity: milestone.status === "locked" ? 0.6 : 1,
        }}
        onMouseOver={e => {
          if (isClickable && !isSelected) {
            e.currentTarget.style.boxShadow = `0 6px 20px ${levelColor}33`;
            e.currentTarget.style.borderColor = levelColor;
            e.currentTarget.style.transform = "translateY(-2px)";
          }
        }}
        onMouseOut={e => {
          if (!isSelected) {
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
            e.currentTarget.style.borderColor = cfg.border;
            e.currentTarget.style.transform = "none";
          }
        }}
      >
        {/* Revision badge */}
        {milestone.isRevision && (
          <div style={{
            position: "absolute", top: "-8px", right: "12px",
            background: "#fef9c3", border: "1px solid #ca8a04",
            color: "#ca8a04", fontSize: "10px", fontWeight: "800",
            padding: "2px 8px", borderRadius: "10px", letterSpacing: "0.5px"
          }}>
            REVISION
          </div>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          {/* Status icon circle */}
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: milestone.status === "completed" ? levelColor
              : milestone.status === "active" ? "#fff7ed"
              : milestone.status === "unlocked" ? "#f1f5f9"
              : "#f8fafc",
            border: `2px solid ${milestone.status === "locked" ? "#e2e8f0" : levelColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: milestone.status === "completed" ? "14px" : "12px",
            color: milestone.status === "completed" ? "#fff" : cfg.text,
            fontWeight: "900",
            flexShrink: 0,
          }}>
            {cfg.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--text-light)", lineHeight: "1.3", marginBottom: "4px" }}>
              {milestone.title}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {milestone.description}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
              {milestone.estimatedMinutes && (
                <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                  ⏱ {milestone.estimatedMinutes}min
                </span>
              )}
              {milestone.xpReward && (
                <span style={{
                  fontSize: "10px", fontWeight: "800",
                  color: milestone.status === "completed" ? "#16a34a" : cfg.text,
                  background: milestone.status === "completed" ? "#dcfce7" : "#f1f5f9",
                  padding: "2px 6px", borderRadius: "6px"
                }}>
                  +{milestone.xpReward} XP
                </span>
              )}
              <span style={{
                fontSize: "10px", fontWeight: "700",
                color: cfg.text, marginLeft: "auto"
              }}>
                {cfg.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// JavaScript syntax highlighting helper
function highlightJS(code) {
  // Escape HTML
  let html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Highlight comments (double slash or block)
  html = html.replace(/(\/\/[^\n]*)/g, '<span style="color: #6a737d; font-style: italic;">$1</span>');
  html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6a737d; font-style: italic;">$1</span>');
  
  // Highlight strings (double quotes, single quotes, backticks)
  html = html.replace(/(["'`])(.*?)\1/g, '<span style="color: #9ecbff;">$1$2$1</span>');
  
  // Highlight keywords: let, const, var, function, return, class, import, export, from, if, else, for, while, async, await, new, try, catch, throw
  const keywords = /\b(let|const|var|function|return|class|import|export|from|if|else|for|while|async|await|new|try|catch|throw|default|switch|case|break|continue|typeof|instanceof)\b/g;
  html = html.replace(keywords, '<span style="color: #ff7b72; font-weight: bold;">$1</span>');

  // Highlight built-ins/globals: console, log, window, document, process, Map, Set, Object, Array, String, Number, Boolean, Symbol, Promise
  const builtins = /\b(console|log|window|document|process|Map|Set|Object|Array|String|Number|Boolean|Symbol|Promise|undefined|null|true|false)\b/g;
  html = html.replace(builtins, '<span style="color: #79c0ff;">$1</span>');

  // Highlight function calls: foo() -> foo is highlighted
  html = html.replace(/\b([a-zA-Z0-9_]+)(?=\()/g, '<span style="color: #d2a8ff;">$1</span>');

  // Highlight numbers
  html = html.replace(/\b(\d+)\b/g, '<span style="color: #ff9e64;">$1</span>');

  return html;
}

function highlightCode(code, lang) {
  const l = (lang || "").toLowerCase();
  if (l === "javascript" || l === "js" || l === "jsx" || l === "ts" || l === "tsx" || l === "html" || l === "css") {
    return highlightJS(code);
  }
  // Generic escape
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parseMarkdownToHTML(md) {
  if (!md) return "";
  
  // 1. Separate code blocks from the rest of the text
  const parts = md.split(/```/);
  let isInsideCode = false;
  let resultHtml = "";
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (isInsideCode) {
      // The first line might be the language name
      const firstNewLineIdx = part.indexOf("\n");
      let lang = "javascript";
      let code = part;
      if (firstNewLineIdx !== -1) {
        const potentialLang = part.substring(0, firstNewLineIdx).trim();
        if (potentialLang.length < 15) {
          lang = potentialLang || "javascript";
          code = part.substring(firstNewLineIdx + 1);
        }
      }
      
      // Trim trailing newline
      code = code.replace(/\n$/, "");
      const highlighted = highlightCode(code, lang);
      
      // Render code block with window styling (macOS window bar)
      resultHtml += `
        <div class="code-screenshot-window" style="
          background: #090d16;
          border-radius: 12px;
          margin: 24px 0;
          box-shadow: 0 12px 36px rgba(0,0,0,0.5);
          border: 1px solid #1e293b;
          overflow: hidden;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          text-align: left;
        ">
          <div style="
            background: #0d1321;
            padding: 12px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #1e293b;
          ">
            <div style="display: flex; gap: 8px;">
              <span style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f56; display: inline-block;"></span>
              <span style="width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e; display: inline-block;"></span>
              <span style="width: 12px; height: 12px; border-radius: 50%; background: #27c93f; display: inline-block;"></span>
            </div>
            <span style="color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">${lang}</span>
            <button 
              style="
                color: #64748b; 
                font-size: 11px; 
                background: none; 
                border: none; 
                cursor: pointer;
                padding: 2px 6px;
                border-radius: 4px;
                transition: all 0.2s;
              "
              onmouseover="this.style.color='#ea580c'; this.style.background='rgba(255,106,0,0.1)';"
              onmouseout="this.style.color='#64748b'; this.style.background='none';"
              onclick="navigator.clipboard.writeText(\`${code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`).then(() => {
                const prevText = this.innerText;
                this.innerText = '✓ Copied!';
                setTimeout(() => { this.innerText = prevText; }, 2000);
              })"
            >
              📋 Copy
            </button>
          </div>
          <div style="
            padding: 20px 24px;
            margin: 0;
            overflow-x: auto;
            font-size: 14px;
            line-height: 1.65;
            color: #f8fafc;
            background: #05070c;
          ">
            <pre style="margin: 0; white-space: pre; font-family: inherit;"><code>${highlighted}</code></pre>
          </div>
        </div>
      `;
      isInsideCode = false;
    } else {
      let mdText = part;
      
      // Inline code
      mdText = mdText.replace(/`([^`\n]+)`/g, '<code style="background: rgba(255,106,0,0.1); color: #ea580c; padding: 2px 6px; border-radius: 6px; font-size: 0.9em; font-family: monospace; font-weight: bold;">$1</code>');
      
      // Headers
      mdText = mdText.replace(/^# (.+)$/gm, '<h1 style="font-size: 28px; font-weight: 900; color: #0f172a; margin: 36px 0 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; letter-spacing: -0.5px;">$1</h1>');
      mdText = mdText.replace(/^## (.+)$/gm, '<h2 style="font-size: 22px; font-weight: 850; color: #0f172a; margin: 30px 0 14px; border-left: 4px solid #ff6a00; padding-left: 14px; letter-spacing: -0.3px;">$1</h2>');
      mdText = mdText.replace(/^### (.+)$/gm, '<h3 style="font-size: 18px; font-weight: 800; color: #1e293b; margin: 24px 0 10px;">$1</h3>');
      mdText = mdText.replace(/^#### (.+)$/gm, '<h4 style="font-size: 15px; font-weight: 700; color: #334155; margin: 18px 0 6px;">$1</h4>');
      
      // Tables
      const lines = mdText.split("\n");
      let inTable = false;
      let tableHtml = "";
      let normalLines = [];
      
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j].trim();
        if (line.startsWith("|") && line.endsWith("|")) {
          if (!inTable) {
            inTable = true;
            tableHtml = '<div style="overflow-x: auto; margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);"><table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">';
          }
          if (line.includes("---") || line.includes("===")) {
            continue;
          }
          const cells = line.split("|").slice(1, -1).map(c => c.trim());
          const isHeader = !tableHtml.includes("</thead>") && !tableHtml.includes("</tr>");
          
          if (isHeader) {
            tableHtml += '<thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;"><tr>';
            cells.forEach(c => {
              tableHtml += `<th style="padding: 14px 18px; font-weight: 800; color: #0f172a;">${c}</th>`;
            });
            tableHtml += '</tr></thead><tbody>';
          } else {
            tableHtml += '<tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.backgroundColor=\'#f8fafc\'" onmouseout="this.style.backgroundColor=\'transparent\'">';
            cells.forEach(c => {
              tableHtml += `<td style="padding: 14px 18px; color: #334155; line-height: 1.5;">${c}</td>`;
            });
            tableHtml += '</tr>';
          }
        } else {
          if (inTable) {
            inTable = false;
            tableHtml += '</tbody></table></div>';
            normalLines.push(tableHtml);
            tableHtml = "";
          }
          normalLines.push(lines[j]);
        }
      }
      if (inTable) {
        tableHtml += '</tbody></table></div>';
        normalLines.push(tableHtml);
      }
      mdText = normalLines.join("\n");
      
      // Bold & Italics
      mdText = mdText.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #0f172a; font-weight: 700;">$1</strong>');
      mdText = mdText.replace(/\*([^*]+)\*/g, '<em style="font-style: italic;">$1</em>');
      
      // Lists
      mdText = mdText.replace(/^\s*-\s+(.+)$/gm, '<li style="color: #334155; font-size: 15px; line-height: 1.8; margin-bottom: 8px; list-style-type: disc; margin-left: 24px;">$1</li>');
      mdText = mdText.replace(/^\s*\*\s+(.+)$/gm, '<li style="color: #334155; font-size: 15px; line-height: 1.8; margin-bottom: 8px; list-style-type: disc; margin-left: 24px;">$1</li>');
      
      // Group adjacent <li> elements into <ul>
      mdText = mdText.replace(/(<li[^>]*>.*?<\/li>)+/gs, '<ul style="padding-left: 0; margin: 12px 0 20px;">$&</ul>');
      
      // Paragraphs
      const blocks = mdText.split(/\n\n+/);
      const parsedBlocks = blocks.map(block => {
        const trimmed = block.trim();
        if (!trimmed) return "";
        if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<div") || trimmed.startsWith("<table") || trimmed.startsWith("<blockquote")) {
          return trimmed;
        }
        return `<p style="color: #334155; font-size: 15.5px; line-height: 1.8; margin: 0 0 18px;">${trimmed.replace(/\n/g, "<br/>")}</p>`;
      });
      
      resultHtml += parsedBlocks.join("\n");
      isInsideCode = true;
    }
  }
  
  return resultHtml;
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

function FullscreenNotesReader({ milestone, roadmapTopic, levelColor, onClose, onSearchDuel, onMarkComplete, username, onSaveNotes }) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(milestone.studyNotes || null);
  const [genStep, setGenStep] = useState(0);
  const [genLog, setGenLog] = useState([]);

  // Load answers for personalization
  const answersKey = `ytplay_roadmap_answers_${username}`;
  const savedAnswers = localStorage.getItem(answersKey);
  const answers = savedAnswers ? JSON.parse(savedAnswers) : [];
  const userReason = answers.find(a => a.question.toLowerCase().includes("why"))?.answer || "learning";

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
        body: JSON.stringify({ topic: roadmapTopic, milestone, answers })
      });
      const data = await res.json();
      clearInterval(logInterval);
      setNotes(data.notes);
      onSaveNotes(milestone.id, data.notes);
      sound.playCorrect();
    } catch (err) {
      clearInterval(logInterval);
      const fallback = `## ${milestone.title}\n\n${milestone.description}\n\n${(milestone.keyPoints || []).map(p => `- ${p}`).join("\n")}`;
      setNotes(fallback);
      onSaveNotes(milestone.id, fallback);
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = milestone.status === "completed";
  const cfg = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.locked;

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
              {milestone.title}
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
              ytPlay Pathfinder Study Suite
            </div>
            <div style={{ color: "#ffffff", fontSize: "20px", fontWeight: "950", marginTop: "2px" }}>
              📖 {milestone.title} Notes
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
                <p style={{ color: "#64748b", fontSize: "15px", maxWidth: "460px", marginBottom: "28px", lineHeight: "1.6" }}>
                  Unlock an exhaustive, personalized study guide tailored to your goal of <strong>"{userReason}"</strong>. Includes comparisons, bad vs. good code blocks, and mock interview questions.
                </p>
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

function MilestoneDetailPanel({ milestone, levelColor, onClose, onSearchDuel, onMarkComplete, onOpenNotes }) {
  const cfg = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.locked;
  const hasNotes = !!milestone.studyNotes;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px"
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "560px",
          background: "#ffffff", borderRadius: "24px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "scaleIn 0.2s ease-out"
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 28px",
          borderBottom: "1px solid #f1f5f9",
          background: milestone.status === "completed" ? "#f0fdf4" : "#fff7ed",
          position: "relative"
        }}>
          <button onClick={onClose} style={{
            position: "absolute", top: "20px", right: "20px",
            width: "32px", height: "32px", borderRadius: "50%",
            border: "1px solid #e2e8f0", background: "#fff",
            cursor: "pointer", fontSize: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#64748b"
          }}>✕</button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{
              fontSize: "10px", fontWeight: "800", color: "#fff",
              background: levelColor, padding: "3px 10px", borderRadius: "8px",
              textTransform: "uppercase", letterSpacing: "1px"
            }}>
              {cfg.label}
            </span>
            {milestone.estimatedMinutes && (
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>⏱ {milestone.estimatedMinutes} min</span>
            )}
            <span style={{ fontSize: "12px", fontWeight: "800", color: levelColor }}>+{milestone.xpReward} XP</span>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", lineHeight: "1.3", marginBottom: "6px" }}>
            {milestone.title}
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.5", margin: 0 }}>
            {milestone.description}
          </p>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: "28px" }}>
          {/* Key Points Checklist */}
          {milestone.keyPoints?.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <h3 style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
                📌 Milestone Objectives
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {milestone.keyPoints.map((pt, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: "10px"
                  }}>
                    <div style={{
                      width: "20px", height: "20px", borderRadius: "50%",
                      background: milestone.status === "completed" ? "#10b981" : levelColor, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: "900", flexShrink: 0
                    }}>
                      {milestone.status === "completed" ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study Guide CTA */}
          <div style={{
            background: "#f8fafc",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            textAlign: "center"
          }}>
            <h4 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
              {hasNotes ? "📖 Study Notes Ready" : "✨ AI Study Notes Guide"}
            </h4>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px", lineHeight: "1.5" }}>
              {hasNotes 
                ? "Your comprehensive study notes are ready for reading. Expand to fullscreen to start learning."
                : "Generate a detailed study guide containing theoretical breakdowns, code examples, and mock interview questions."}
            </p>
            <button
              onClick={() => { sound.playClockTick(); onOpenNotes(); onClose(); }}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: "10px",
                border: "none",
                background: `linear-gradient(135deg, ${levelColor}, ${levelColor}dd)`,
                color: "#fff",
                fontWeight: "800",
                fontSize: "13.5px",
                cursor: "pointer",
                boxShadow: `0 4px 12px ${levelColor}22`
              }}
            >
              {hasNotes ? "📖 Read Study Guide (Fullscreen)" : "✨ Generate Study Notes"}
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: "20px 28px",
          borderTop: "1px solid #f1f5f9",
          display: "flex", gap: "12px",
          background: "#fafafa"
        }}>
          {milestone.status !== "locked" && (
            <button
              onClick={() => { sound.playClockTick(); onSearchDuel(milestone); onClose(); }}
              style={{
                flex: 1, padding: "12px 20px", borderRadius: "10px",
                border: "none", background: "linear-gradient(135deg, #475569, #334155)",
                color: "#fff", fontWeight: "800", fontSize: "13.5px",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "6px"
              }}
            >
              ⚔️ Search & Duel Topic
            </button>
          )}

          {milestone.status === "unlocked" && (
            <button
              onClick={() => { sound.playClockTick(); onMarkComplete(milestone); onClose(); }}
              style={{
                padding: "12px 20px", borderRadius: "10px",
                border: `1.5px solid ${levelColor}`, background: "#fff",
                color: levelColor, fontWeight: "700", fontSize: "13px",
                cursor: "pointer"
              }}
            >
              ✓ Mark Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PathfinderRoadmap({ roadmap: initialRoadmap, username, onSearchDuel, onReset }) {
  const storageKey = `ytplay_roadmap_progress_${username}`;

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
            // Unlock next milestone in same level
            if (i + 1 < ms.length && ms[i + 1].status === "locked") {
              ms[i + 1].status = "unlocked";
              nextUnlocked = true;
            }
          }
        }

        // If last in level completed, unlock first of next level
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
      {/* Top Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#ea580c", background: "#fff7ed", padding: "4px 12px", borderRadius: "20px", border: "1px solid #fed7aa", textTransform: "uppercase", letterSpacing: "1px" }}>
                🗺️ Your Roadmap
              </span>
            </div>
            <h1 style={{ fontSize: "32px", fontWeight: "900", color: "var(--text-light)", marginBottom: "4px" }}>
              {roadmap.topic}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "15px", maxWidth: "600px", lineHeight: "1.5" }}>
              {roadmap.summary}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            <button
              onClick={() => { sound.playClockTick(); onReset(); }}
              style={{
                padding: "10px 18px", borderRadius: "12px",
                border: "1.5px solid #e2e8f0", background: "#fff",
                color: "var(--text-muted)", fontSize: "13px", fontWeight: "700",
                cursor: "pointer"
              }}
            >
              🔄 New Roadmap
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: "flex", gap: "16px", marginTop: "24px", flexWrap: "wrap"
        }}>
          {[
            { label: "Progress", value: `${completedCount} / ${totalCount}`, sub: "milestones done", color: "#ff6a00" },
            { label: "XP Earned", value: `+${totalXpEarned}`, sub: "from roadmap", color: "#f59e0b" },
            { label: "Goal", value: roadmap.goal?.split(" ").slice(0, 5).join(" ") + (roadmap.goal?.split(" ").length > 5 ? "..." : ""), sub: roadmap.goal, color: "#8b5cf6" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "#ffffff", borderRadius: "16px",
              padding: "16px 20px", border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)", flex: "1", minWidth: "160px"
            }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>{s.label}</div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: s.color }}>{s.value}</div>
              {i === 0 && (
                <div style={{ marginTop: "6px", height: "4px", background: "#e2e8f0", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(completedCount / totalCount) * 100}%`, background: "linear-gradient(90deg, #ff6a00, #ffb300)", borderRadius: "2px", transition: "width 0.5s" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: cfg.bg, border: `1.5px solid ${cfg.border}` }} />
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>{cfg.label}</span>
          </div>
        ))}
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
              background: "#ffffff", borderRadius: "24px",
              border: `1.5px solid ${data.isLevelUnlocked ? color + "44" : "#e2e8f0"}`,
              overflow: "hidden",
              boxShadow: data.isLevelUnlocked ? `0 4px 20px ${color}11` : "0 2px 8px rgba(0,0,0,0.04)",
              opacity: data.isLevelUnlocked ? 1 : 0.7,
              transition: "all 0.3s"
            }}>
              {/* Level header — clickable to expand */}
              <div
                onClick={() => { sound.playClockTick(); setExpandedLevel(isOpen ? 0 : num); }}
                style={{
                  padding: "20px 28px",
                  background: data.isLevelUnlocked
                    ? `linear-gradient(135deg, ${color}11 0%, ${color}08 100%)`
                    : "#f8fafc",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "16px",
                  borderBottom: isOpen ? `1px solid ${color}22` : "none"
                }}
              >
                <div style={{
                  width: "48px", height: "48px", borderRadius: "14px",
                  background: data.isLevelUnlocked
                    ? `linear-gradient(135deg, ${color}, ${color}bb)`
                    : "#e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", flexShrink: 0,
                  boxShadow: data.isLevelUnlocked ? `0 4px 14px ${color}44` : "none"
                }}>
                  {data.isLevelUnlocked ? meta.emoji : "🔒"}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: "900", color: "var(--text-light)" }}>
                      {data.title}
                    </h2>
                    {!data.isLevelUnlocked && (
                      <span style={{ fontSize: "10px", fontWeight: "800", color: "#94a3b8", background: "#f1f5f9", padding: "2px 8px", borderRadius: "8px" }}>
                        LOCKED
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
                  <div style={{ marginTop: "6px", width: "80px", height: "4px", background: "#e2e8f0", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(data.completedInLevel / data.milestones.length) * 100}%`,
                      background: color, borderRadius: "2px", transition: "width 0.5s"
                    }} />
                  </div>
                </div>

                <div style={{ fontSize: "16px", color: "var(--text-muted)", transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "none" }}>
                  ▼
                </div>
              </div>

              {/* Milestones — shown when expanded */}
              {isOpen && (
                <div style={{ padding: "28px" }}>
                  {/* roadmap.sh-style node layout */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "0",
                    position: "relative"
                  }}>
                    {/* Central spine line */}
                    <div style={{
                      position: "absolute",
                      top: "26px", left: "50%",
                      transform: "translateX(-50%)",
                      width: "2px",
                      height: `calc(100% - 52px)`,
                      background: `repeating-linear-gradient(to bottom, ${color} 0, ${color} 6px, transparent 6px, transparent 12px)`,
                      opacity: 0.3,
                      display: data.milestones.length > 2 ? "block" : "none"
                    }} />

                    {data.milestones.map((milestone, idx) => (
                      <div key={milestone.id} style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: idx % 2 === 0 ? "flex-end" : "flex-start",
                        padding: "12px 16px",
                        position: "relative"
                      }}>
                        {/* Horizontal connector to center */}
                        <div style={{
                          position: "absolute",
                          top: "38px",
                          [idx % 2 === 0 ? "right" : "left"]: "0",
                          width: "16px", height: "2px",
                          background: milestone.status === "completed" ? color : "#e2e8f0"
                        }} />

                        <MilestoneNode
                          milestone={milestone}
                          levelColor={color}
                          isLastInLevel={idx === data.milestones.length - 1}
                          isSelected={selectedMilestone?.id === milestone.id}
                          onSelect={(m) => {
                            sound.playClockTick();
                            setSelectedMilestone(m);
                          }}
                          levelNum={num}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Level completion message */}
                  {data.completedInLevel === data.milestones.length && (
                    <div style={{
                      marginTop: "20px",
                      padding: "16px 20px",
                      background: `${color}11`,
                      border: `1.5px solid ${color}44`,
                      borderRadius: "14px",
                      display: "flex", alignItems: "center", gap: "12px"
                    }}>
                      <span style={{ fontSize: "24px" }}>🎉</span>
                      <div>
                        <div style={{ fontWeight: "800", color, fontSize: "15px" }}>Level Complete!</div>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                          You've mastered all {data.milestones.length} milestones in this level. Next level unlocked!
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Milestone detail modal */}
      {selectedMilestone && !viewingNotes && (
        <MilestoneDetailPanel
          milestone={selectedMilestone}
          levelColor={
            roadmap.level1?.milestones?.find(m => m.id === selectedMilestone.id) ? "#10b981" :
            roadmap.level2?.milestones?.find(m => m.id === selectedMilestone.id) ? "#f59e0b" : "#8b5cf6"
          }
          onClose={() => setSelectedMilestone(null)}
          onSearchDuel={onSearchDuel}
          onMarkComplete={(m) => { markComplete(m); setSelectedMilestone(null); }}
          onOpenNotes={() => setViewingNotes(true)}
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
        />
      )}
    </div>
  );
}
