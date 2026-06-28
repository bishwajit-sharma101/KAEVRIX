import { useState, useEffect } from "react";

const STATUS_LOGS = [
  "📡 Contacting matchmaking server nodes...",
  "🔍 Scanning arena for real opponents...",
  "🧬 Filtering players with compatible skill seeds...",
  "👾 Setting up virtual arena variables...",
  "⏳ Waiting for a challenger to join...",
  "⚔️ Preparing the battlefield...",
  "🎯 Searching for a worthy rival...",
  "🔥 Arena is heating up..."
];

const BOT_FALLBACK_SECONDS = 60;

export default function Matchmaking({ avatar, selectedVideo, onCancel }) {
  const [logIdx, setLogIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogIdx((prev) => (prev + 1) % STATUS_LOGS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= BOT_FALLBACK_SECONDS) {
          clearInterval(timer);
          return BOT_FALLBACK_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = BOT_FALLBACK_SECONDS - elapsed;
  const progressPct = (elapsed / BOT_FALLBACK_SECONDS) * 100;

  return (
    <div className="matchmaking-container">
      <div className="radar-spinner">
        {/* Radar Rings Ripple Effect */}
        <div className="radar-ripple-ring ring-1"></div>
        <div className="radar-ripple-ring ring-2"></div>
        <div className="radar-ripple-ring ring-3"></div>
        <div className="radar-scan-line"></div>
        <div className="radar-circle">
          <div className="radar-avatar" style={{overflow: 'hidden', border: 'none'}}>{avatar && avatar.includes('http') ? <img src={avatar} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : avatar}</div>
        </div>
      </div>
      <div className="matchmaking-status">SEARCHING FOR OPPONENTS</div>
      
      {/* Countdown timer */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        margin: "8px 0 4px",
      }}>
        <div style={{
          fontSize: "28px",
          fontWeight: "900",
          fontFamily: "var(--font-gamer, monospace)",
          color: remaining <= 10 ? "#ef4444" : "var(--neon-orange, #ff6a00)",
          minWidth: "50px",
          textAlign: "center",
          letterSpacing: "2px",
          textShadow: remaining <= 10 ? "0 0 8px rgba(239,68,68,0.4)" : "0 0 6px rgba(255,106,0,0.3)"
        }}>
          0:{String(remaining).padStart(2, "0")}
        </div>
        <div style={{
          width: "160px",
          height: "6px",
          borderRadius: "10px",
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden"
        }}>
          <div style={{
            height: "100%",
            width: `${progressPct}%`,
            background: remaining <= 10
              ? "linear-gradient(90deg, #ef4444, #f87171)"
              : "linear-gradient(90deg, #ff6a00, #ffb300)",
            borderRadius: "10px",
            transition: "width 1s linear",
            boxShadow: "0 0 6px rgba(255,106,0,0.4)"
          }} />
        </div>
      </div>
      <div style={{
        fontSize: "11px",
        color: "var(--text-muted, #94a3b8)",
        fontWeight: "600",
        letterSpacing: "0.5px"
      }}>
        {remaining <= 10 ? "⚡ Bot match starting soon..." : "Waiting for a real opponent to join this video"}
      </div>

      <div className="matchmaking-log-ticker">
        {STATUS_LOGS[logIdx]}
      </div>

      <p className="matchmaking-video-info">
        Duel Video:{" "}
        <span style={{ color: "var(--neon-blue)", fontWeight: "bold" }}>
          {selectedVideo?.title || "Targeting YouTube Link"}
        </span>
      </p>
      <div className="matchmaking-actions">
        <button className="btn-secondary" onClick={onCancel}>
          CANCEL LOOKUP
        </button>
      </div>
    </div>
  );
}
