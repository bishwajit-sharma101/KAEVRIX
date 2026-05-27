import { useState, useEffect } from "react";
import * as sound from "../utils/audio";

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

function MilestoneNode({ milestone, levelColor, isLastInLevel, onSelect, isSelected, levelNum, index, isDarkMode }) {
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
    ? `2px solid ${isDarkMode ? "rgba(100,90,80,0.25)" : "#e2e8f0"}`
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
          <div style={{ fontSize: "13px", fontWeight: "800", color: titleColor, fontFamily: "'Cinzel', serif", marginBottom: "4px", lineHeight: "1.3" }}>
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
            fontFamily: "'Cinzel', serif",
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
          <div style={{ fontSize: "13px", fontWeight: "800", color: titleColor, fontFamily: "'Cinzel', serif", marginBottom: "4px", lineHeight: "1.3" }}>
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

function FullscreenNotesReader({ milestone, roadmapTopic, levelColor, onClose, onSearchDuel, onMarkComplete, username, onSaveNotes, isDarkMode }) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(milestone.studyNotes || null);
  const [genStep, setGenStep] = useState(0);
  const [genLog, setGenLog] = useState([]);

  // Load answers for personalization
  const answersKey = `kaevrix_roadmap_answers_${username}`;
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
              Kaevrix Pathfinder Study Suite
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

function MilestoneDetailPanel({ milestone, levelColor, onClose, onSearchDuel, onMarkComplete, onOpenNotes, onSelectVideo, isDarkMode }) {
  const cfg = getStatusConfig(isDarkMode)[milestone.status] || getStatusConfig(isDarkMode).locked;
  const hasNotes = !!milestone.studyNotes;

  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    if (milestone.searchQuery) {
      setLoadingVideos(true);
      fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(milestone.searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setVideos(data.slice(0, 3));
          }
        })
        .catch(err => console.error("Error searching videos:", err))
        .finally(() => setLoadingVideos(false));
    }
  }, [milestone.searchQuery]);

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
            {milestone.title}
          </h2>
          <p style={{ fontSize: "14px", color: isDarkMode ? "rgba(255,255,255,0.6)" : "var(--text-muted)", lineHeight: "1.5", margin: 0 }}>
            {milestone.description}
          </p>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: "24px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Key Objectives */}
          {milestone.keyPoints?.length > 0 && (
            <div>
              <h3 style={{ fontSize: "11px", fontWeight: "900", color: "var(--neon-orange)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
                📌 Milestone Objectives
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {milestone.keyPoints.map((pt, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: milestone.status === "completed" ? "#10b981" : (isDarkMode ? "rgba(255,255,255,0.1)" : "#f1f5f9"),
                      color: milestone.status === "completed" ? "#fff" : (isDarkMode ? "#fff" : "#475569"),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "9px", fontWeight: "900", flexShrink: 0, marginTop: "2px"
                    }}>
                      {milestone.status === "completed" ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: "13px", color: isDarkMode ? "rgba(255,255,255,0.8)" : "var(--text-light)", lineHeight: "1.4" }}>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YouTube recommended videos */}
          {milestone.status !== "locked" && (
            <div>
              <h3 style={{ fontSize: "11px", fontWeight: "900", color: "var(--neon-blue)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
                📺 Recommended Training Videos
              </h3>
              {loadingVideos ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: isDarkMode ? "rgba(255,255,255,0.4)" : "var(--text-muted)", fontSize: "13px" }}>
                  <div className="spinner" style={{ width: "16px", height: "16px", border: `2px solid ${isDarkMode ? "#00f2fe" : "var(--neon-blue)"}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Scanning YouTube library for "{milestone.title}"...
                </div>
              ) : videos.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {videos.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => onSelectVideo && onSelectVideo(vid)}
                      style={{
                        display: "flex", gap: "12px", padding: "10px",
                        background: isDarkMode ? "rgba(255,255,255,0.02)" : "#f8fafc",
                        border: isDarkMode ? "1.5px solid rgba(255,255,255,0.06)" : "1.5px solid #e2e8f0",
                        borderRadius: "12px", cursor: "pointer",
                        transition: "all 0.2s", alignItems: "center"
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = "var(--neon-blue)"; e.currentTarget.style.background = isDarkMode ? "rgba(0,242,254,0.04)" : "rgba(255,106,0,0.04)"; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = isDarkMode ? "rgba(255,255,255,0.06)" : "#e2e8f0"; e.currentTarget.style.background = isDarkMode ? "rgba(255,255,255,0.02)" : "#f8fafc"; }}
                    >
                      <div style={{ width: "90px", height: "50px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, position: "relative", background: "#000" }}>
                        <img src={vid.thumbnail} alt="thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <span style={{ position: "absolute", bottom: "2px", right: "4px", background: "rgba(0,0,0,0.8)", fontSize: "9px", color: "#fff", padding: "1px 3px", borderRadius: "3px" }}>
                          {Math.floor(vid.duration / 60)}:{String(vid.duration % 60).padStart(2, '0')}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: isDarkMode ? "#fff" : "var(--text-light)", fontSize: "13px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "3px" }}>
                          {vid.title}
                        </div>
                        <div style={{ color: isDarkMode ? "rgba(255,255,255,0.4)" : "var(--text-muted)", fontSize: "11px" }}>
                          🎬 {vid.channel}
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--neon-blue)", fontWeight: "bold", paddingRight: "6px" }}>▶ WATCH</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: isDarkMode ? "rgba(255,255,255,0.4)" : "var(--text-muted)", fontSize: "13px" }}>
                  No training videos found. Use search or mark complete manually.
                </div>
              )}
            </div>
          )}

          {/* Study Guide CTA */}
          <div style={{
            background: isDarkMode ? "rgba(255,255,255,0.02)" : "#f8fafc",
            borderRadius: "16px",
            padding: "20px",
            border: isDarkMode ? "1.5px solid rgba(255,255,255,0.06)" : "1.5px solid #e2e8f0",
            textAlign: "center"
          }}>
            <h4 style={{ fontSize: "15px", fontWeight: "800", color: isDarkMode ? "#fff" : "var(--text-light)", marginBottom: "6px" }}>
              {hasNotes ? "📖 Study Notes Ready" : "✨ AI Study Notes Guide"}
            </h4>
            <p style={{ fontSize: "13px", color: isDarkMode ? "rgba(255,255,255,0.5)" : "var(--text-muted)", marginBottom: "16px", lineHeight: "1.5" }}>
              {hasNotes 
                ? "Your comprehensive study notes are ready for reading. Expand to fullscreen to start learning."
                : "Generate a detailed study guide containing theoretical breakdowns, comparisons, and mock interview questions."}
            </p>
            <button
              onClick={() => { sound.playClockTick(); onOpenNotes(); onClose(); }}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: "10px",
                border: "none",
                background: `linear-gradient(135deg, ${levelColor}, ${levelColor}dd)`,
                color: "#ffffff",
                fontWeight: "900",
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

          {milestone.status === "unlocked" && (
            <button
              onClick={() => { sound.playClockTick(); onMarkComplete(milestone); onClose(); }}
              style={{
                padding: "12px 20px", borderRadius: "10px",
                border: `1.5px solid ${levelColor}`, background: "transparent",
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

function SoloLearningModal({ video, milestone, username, onClose, onMarkComplete, isDarkMode }) {
  const [step, setStep] = useState("watch"); // watch, generating, quiz, results
  const [quizData, setQuizData] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [loadingLog, setLoadingLog] = useState("Accessing YouTube database...");

  const handleStartQuiz = async () => {
    setStep("generating");
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
      setQuizData(quiz);
      setAnswers(Array(quiz.postVideoQuestions.length).fill(null));
      setStep("quiz");
      sound.playMatchFound();
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
      setQuizData(fallbackQuiz);
      setAnswers(Array(5).fill(null));
      setStep("quiz");
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
          <div style={{ padding: "48px 28px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "350px" }}>
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: "rgba(0, 242, 254, 0.1)",
              border: "2px solid var(--neon-blue)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "36px",
              boxShadow: "0 0 20px rgba(0, 242, 254, 0.3)",
              marginBottom: "32px",
              animation: "pulse 1.5s infinite"
            }}>
              🧠
            </div>
            <h3 style={{ color: isDarkMode ? "#fff" : "var(--text-light)", fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>AI Generating Solo Quiz</h3>
            <p style={{ color: isDarkMode ? "rgba(255,255,255,0.5)" : "var(--text-muted)", fontSize: "14px", marginBottom: "24px", textAlign: "center", maxWidth: "380px" }}>
              Analyzing video content to synthesize dynamic multiple choice questions...
            </p>
            <div style={{
              background: isDarkMode ? "#050811" : "#f1f5f9",
              border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
              borderRadius: "12px", padding: "12px 24px", fontFamily: "monospace",
              color: "var(--neon-orange)", fontSize: "12.5px"
            }}>
              {loadingLog}
            </div>
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

export default function PathfinderRoadmap({ roadmap: initialRoadmap, username, onSearchDuel, onReset, isDarkMode }) {
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
            <h1 style={{ fontSize: "32px", fontWeight: "900", color: "var(--text-light)", marginBottom: "4px", textShadow: isDarkMode ? "0 0 15px rgba(255,255,255,0.15)" : "none" }}>
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

        {/* Daily Quest Questcard (Spans full width) */}
        <div style={{
          background: isDarkMode 
            ? "linear-gradient(135deg, rgba(234, 88, 12, 0.15) 0%, rgba(20, 10, 5, 0.5) 100%)" 
            : "linear-gradient(135deg, rgba(234, 88, 12, 0.05) 0%, rgba(254, 243, 199, 0.2) 100%)",
          borderRadius: "18px",
          padding: "20px 24px",
          border: isDarkMode ? "1.5px solid rgba(234, 88, 12, 0.4)" : "1.5px solid #fed7aa",
          boxShadow: isDarkMode ? "0 0 25px rgba(234, 88, 12, 0.1)" : "0 4px 15px rgba(255, 106, 0, 0.05)",
          display: "flex",
          alignItems: "center",
          gap: "18px",
          marginBottom: "32px",
          transition: "all 0.2s"
        }}
        onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = isDarkMode ? "0 0 35px rgba(234, 88, 12, 0.25)" : "0 6px 20px rgba(255, 106, 0, 0.1)"; }}
        onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = isDarkMode ? "0 0 25px rgba(234, 88, 12, 0.1)" : "0 4px 15px rgba(255, 106, 0, 0.05)"; }}
        >
          <div style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: "#ea580c", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "24px", color: "#ffffff",
            boxShadow: "0 0 15px rgba(234, 88, 12, 0.5)", flexShrink: 0,
            border: isDarkMode ? "2px solid rgba(255,255,255,0.1)" : "2px solid rgba(0,0,0,0.05)"
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
              {isOpen && (
                <div style={{ padding: "28px", background: isDarkMode ? "var(--bg-dark-base)" : "#ffffff" }}>
                  {/* gamified vertical skill path */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "50px",
                    padding: "20px 0",
                    position: "relative"
                  }}>
                    {data.milestones.map((milestone, idx) => (
                      <MilestoneNode
                        key={milestone.id}
                        milestone={milestone}
                        levelColor={color}
                        isLastInLevel={idx === data.milestones.length - 1}
                        isSelected={selectedMilestone?.id === milestone.id}
                        onSelect={(m) => {
                          sound.playClockTick();
                          setSelectedMilestone(m);
                        }}
                        levelNum={num}
                        index={idx}
                        isDarkMode={isDarkMode}
                      />
                    ))}
                  </div>

                  {/* Level completion message */}
                  {data.completedInLevel === data.milestones.length && (
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
          onSelectVideo={(video) => setActiveVideo(video)}
          isDarkMode={isDarkMode}
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
    </div>
  );
}
