import { useState, useEffect } from "react";
import * as sound from "../utils/audio";
import PathfinderOnboarding from "./PathfinderOnboarding";
import PathfinderRoadmap from "./PathfinderRoadmap";

const BACKEND_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "";

export default function CognitivePathfinder({ username, onTriggerSearch, isDarkMode }) {
  const roadmapKey = `kaevrix_roadmap_progress_${username}`;
  const answersKey = `kaevrix_roadmap_answers_${username}`;

  const [roadmap, setRoadmap] = useState(() => {
    const saved = localStorage.getItem(roadmapKey);
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [view, setView] = useState(roadmap ? "roadmap" : "landing");

  const handleRoadmapReady = (newRoadmap) => {
    sound.playCorrect();
    localStorage.setItem(roadmapKey, JSON.stringify(newRoadmap));
    setRoadmap(newRoadmap);
    setView("roadmap");
  };

  const handleReset = () => {
    if (window.confirm("This will clear your current roadmap and progress. Are you sure?")) {
      sound.playClockTick();
      localStorage.removeItem(roadmapKey);
      localStorage.removeItem(answersKey);
      setRoadmap(null);
      setView("landing");
    }
  };

  const handleSearchDuel = (milestone) => {
    if (onTriggerSearch) {
      onTriggerSearch(milestone.searchQuery || milestone.title);
    }
  };

  // Landing page — shown if no roadmap yet
  if (view === "landing") {
    return (
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 20px" }}>
        {/* Hero */}
        <div style={{
          background: isDarkMode ? "linear-gradient(135deg, #0f172a 0%, #1e0a00 100%)" : "linear-gradient(135deg, #f8fafc 0%, #fff7ed 100%)",
          borderRadius: "28px", padding: "48px 40px",
          textAlign: "center", position: "relative", overflow: "hidden",
          marginBottom: "32px",
          border: isDarkMode ? "none" : "1px solid rgba(255, 106, 0, 0.25)",
          boxShadow: isDarkMode ? "none" : "0 10px 30px rgba(255, 106, 0, 0.05)"
        }}>
          <div style={{
            position: "absolute", top: "-30px", right: "-30px",
            width: "180px", height: "180px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,106,0,0.2) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />

          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🗺️</div>
          <h1 style={{ fontSize: "36px", fontWeight: "900", color: isDarkMode ? "#ffffff" : "var(--text-light)", marginBottom: "12px", lineHeight: "1.2" }}>
            Cognitive Pathfinder
          </h1>
          <p style={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "var(--text-muted)", fontSize: "16px", lineHeight: "1.6", marginBottom: "32px", maxWidth: "500px", margin: "0 auto 32px" }}>
            Tell the AI what you want to learn. It builds you a personalized 3-level roadmap with YouTube videos, study notes, and XP rewards — unique to your goals.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "32px", flexWrap: "wrap" }}>
            {[
              { icon: "💬", text: "5 quick questions" },
              { icon: "🧠", text: "AI builds your path" },
              { icon: "⚔️", text: "Duel to level up" },
            ].map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(255, 106, 0, 0.05)",
                border: isDarkMode ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255, 106, 0, 0.15)",
                padding: "10px 18px", borderRadius: "20px"
              }}>
                <span>{f.icon}</span>
                <span style={{ fontSize: "13px", color: isDarkMode ? "rgba(255,255,255,0.8)" : "var(--text-light)", fontWeight: "600" }}>{f.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => { sound.playClockTick(); setView("onboarding"); }}
            style={{
              padding: "18px 40px", borderRadius: "16px",
              border: "none", background: "linear-gradient(135deg, #ff6a00, #ffb300)",
              color: "#fff", fontWeight: "900", fontSize: "16px",
              cursor: "pointer", letterSpacing: "0.5px",
              boxShadow: "0 8px 30px rgba(255,106,0,0.4)",
              transition: "all 0.2s"
            }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(255,106,0,0.5)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(255,106,0,0.4)"; }}
          >
            🚀 Start Building My Roadmap
          </button>
        </div>

        {/* Level preview cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {[
            { num: 1, emoji: "🌱", title: "Level 1", sub: "Basic → Intermediate", color: "#10b981", desc: "Build solid foundations, core concepts, and first projects." },
            { num: 2, emoji: "⚡", title: "Level 2", sub: "Intermediate → Advanced", color: "#f59e0b", desc: "Master patterns, performance, and real-world applications." },
            { num: 3, emoji: "🔥", title: "Level 3", sub: "Advanced → God Tier", color: "#8b5cf6", desc: "Architecture, internals, and production-grade mastery." },
          ].map(l => (
            <div key={l.num} style={{
              background: "var(--bg-dark-surface)", borderRadius: "20px",
              padding: "20px", border: "1px solid var(--glass-border)",
              boxShadow: "var(--shadow-purple)"
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: `${l.color}22`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "22px", marginBottom: "12px"
              }}>
                {l.emoji}
              </div>
              <div style={{ fontSize: "15px", fontWeight: "900", color: l.color, marginBottom: "2px" }}>{l.title}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{l.sub}</div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>{l.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === "onboarding") {
    return (
      <PathfinderOnboarding
        username={username}
        backendUrl={BACKEND_URL}
        onRoadmapReady={handleRoadmapReady}
      />
    );
  }

  if (view === "roadmap" && roadmap) {
    return (
      <PathfinderRoadmap
        roadmap={roadmap}
        username={username}
        onSearchDuel={handleSearchDuel}
        onReset={handleReset}
        isDarkMode={isDarkMode}
      />
    );
  }

  return null;
}
