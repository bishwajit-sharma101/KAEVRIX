import { useState, useEffect } from "react";
import * as sound from "../../utils/audio";
import PathfinderOnboarding from "./PathfinderOnboarding";
import PathfinderRoadmap from "./PathfinderRoadmap";

const BACKEND_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "";

export default function CognitivePathfinder({ username, onTriggerSearch, onStartSoloStudy, isDarkMode }) {
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
  const [initialTopic, setInitialTopic] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [activeNode, setActiveNode] = useState(1);

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
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 20px", position: "relative", minHeight: "78vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <style>{`
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 200%; }
          }
          @keyframes breathe {
            0%, 100% { 
              box-shadow: 0 0 20px rgba(255,106,0,0.15), 0 0 40px rgba(255,106,0,0.05);
            }
            50% { 
              box-shadow: 0 0 30px rgba(255,106,0,0.3), 0 0 60px rgba(255,106,0,0.1);
            }
          }
          .ultra-btn-wrap {
            position: relative;
            padding: 2px;
            border-radius: 14px;
            background: linear-gradient(135deg, #ff6a00, #ff8f00, #ffb300, #ff8f00, #ff6a00);
            background-size: 300% 300%;
            animation: breathe 3s ease-in-out infinite;
            transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
            cursor: pointer;
          }
          .ultra-btn-wrap:hover {
            transform: translateY(-3px) scale(1.02);
            animation: none;
            box-shadow: 0 0 35px rgba(255,106,0,0.5), 0 12px 30px rgba(255,106,0,0.2);
          }
          .ultra-btn-wrap:active {
            transform: translateY(0px) scale(0.99);
          }
          .ultra-btn-inner {
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
            padding: 18px 48px;
            border-radius: 12px;
            background: var(--bg-dark-base);
            font-size: 14px;
            font-weight: 900;
            font-family: var(--font-gamer), sans-serif;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #ff6a00;
            border: none;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
          }
          .ultra-btn-wrap:hover .ultra-btn-inner {
            background: linear-gradient(135deg, #ff6a00 0%, #ff8f00 100%);
            color: #ffffff;
          }
          .ultra-btn-inner::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 60%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
            transform: skewX(-20deg);
            animation: shimmer 4s ease-in-out infinite;
            pointer-events: none;
          }
          .ultra-btn-wrap:hover .ultra-btn-inner::after {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation-duration: 1.5s;
          }
          .ultra-btn-arrow {
            transition: transform 0.35s cubic-bezier(0.19, 1, 0.22, 1);
            font-size: 16px;
            display: inline-block;
          }
          .ultra-btn-wrap:hover .ultra-btn-arrow {
            transform: translateX(6px);
          }
        `}</style>

        {/* Ambient glow */}
        <div style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background: isDarkMode 
            ? "radial-gradient(circle, rgba(255,106,0,0.04) 0%, transparent 60%)"
            : "radial-gradient(circle, rgba(255,106,0,0.025) 0%, transparent 60%)",
          zIndex: 0,
          pointerEvents: "none"
        }} />

        {/* Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          background: isDarkMode ? "rgba(255, 106, 0, 0.08)" : "#fff7ed",
          border: isDarkMode ? "1px solid rgba(255, 106, 0, 0.2)" : "1px solid #fed7aa",
          padding: "6px 16px",
          borderRadius: "100px",
          marginBottom: "24px",
          fontSize: "10px",
          fontWeight: "900",
          color: "#ff6a00",
          textTransform: "uppercase",
          letterSpacing: "2px",
          fontFamily: "var(--font-gamer), sans-serif",
          position: "relative",
          zIndex: 1
        }}>
          <span style={{ fontSize: "13px" }}>🧠</span> AI LEARNING ENGINE
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "56px",
          fontWeight: "900",
          fontFamily: "var(--font-gamer), sans-serif",
          background: isDarkMode 
            ? "linear-gradient(135deg, #ffffff 25%, #ff8f00 100%)" 
            : "linear-gradient(135deg, #0f172a 25%, #ff6a00 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          margin: "0 0 16px",
          letterSpacing: "3px",
          lineHeight: "1.1",
          textTransform: "uppercase",
          textAlign: "center",
          position: "relative",
          zIndex: 1
        }}>
          COGNITIVE<br />PATHFINDER
        </h1>

        {/* Tagline */}
        <p style={{
          color: isDarkMode ? "rgba(255,255,255,0.55)" : "var(--text-muted)",
          fontSize: "16px",
          lineHeight: "1.7",
          textAlign: "center",
          maxWidth: "480px",
          fontFamily: "var(--font-sans)",
          margin: "0 0 20px",
          position: "relative",
          zIndex: 1
        }}>
          Tell the AI what you want to master. It builds a personalized 3-level roadmap with curated videos, study notes, and XP rewards.
        </p>

        {/* Feature words */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "44px",
          fontSize: "11px",
          fontWeight: "800",
          fontFamily: "var(--font-outfit), sans-serif",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          color: isDarkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)",
          position: "relative",
          zIndex: 1
        }}>
          <span>5 Questions</span>
          <span style={{ color: "#ff6a00", fontSize: "6px" }}>●</span>
          <span>AI Synthesis</span>
          <span style={{ color: "#ff6a00", fontSize: "6px" }}>●</span>
          <span>Duel Mode</span>
        </div>

        {/* Ultra Premium Button */}
        <div 
          className="ultra-btn-wrap"
          onClick={() => {
            sound.playClockTick();
            setView("onboarding");
          }}
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="ultra-btn-inner">
            <span>INITIALIZE PATHFINDER</span>
            <span className="ultra-btn-arrow">→</span>
          </div>
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
        onStartSoloStudy={onStartSoloStudy}
        isDarkMode={isDarkMode}
      />
    );
  }

  return null;
}
