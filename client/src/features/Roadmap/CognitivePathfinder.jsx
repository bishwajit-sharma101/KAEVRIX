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
      <div className="pathfinder-empty-container">
        <style>{`
          .pathfinder-empty-container {
            width: 100%;
            max-width: 800px;
            margin: -25px auto 0 auto;
            min-height: 480px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0px 20px;
            text-align: center;
            position: relative;
            overflow: visible;
            transition: all 0.4s ease;
          }
          .pathfinder-cta-btn {
            position: relative;
            background: linear-gradient(135deg, #ff6a00 0%, #ff4500 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #ffffff !important;
            padding: 12px 32px;
            border-radius: 10px;
            font-size: 14.5px;
            font-weight: 800;
            font-family: var(--font-outfit);
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 4px 15px rgba(255, 106, 0, 0.3);
            overflow: hidden;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            text-decoration: none;
            margin-bottom: 20px;
            z-index: 1;
          }
          .pathfinder-cta-btn::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -60%;
            width: 30%;
            height: 200%;
            background: rgba(255, 255, 255, 0.25);
            transform: rotate(30deg);
            transition: all 0.6s ease;
            pointer-events: none;
          }
          .pathfinder-cta-btn:hover {
            transform: translateY(-2.5px) scale(1.02);
            box-shadow: 0 8px 25px rgba(255, 106, 0, 0.45);
          }
          .pathfinder-cta-btn:hover::after {
            left: 140%;
          }
          .pathfinder-cta-btn:hover .btn-arrow {
            transform: translateX(4px);
          }
          .pathfinder-cta-btn:active {
            transform: translateY(1px);
            box-shadow: 0 2px 10px rgba(255, 106, 0, 0.2);
          }
          @media (max-width: 640px) {
            .steps-container {
              flex-direction: column !important;
              gap: 16px !important;
            }
          }
        `}</style>

        {/* Ambient glow */}
        <div style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "500px",
          height: "260px",
          background: isDarkMode 
            ? "radial-gradient(circle, rgba(255,106,0,0.04) 0%, transparent 60%)"
            : "radial-gradient(circle, rgba(255,106,0,0.025) 0%, transparent 60%)",
          zIndex: 0,
          pointerEvents: "none"
        }} />

        {/* Pathfinder core visual illustration (feather blended background) */}
        <div style={{ position: "relative", marginBottom: "8px", zIndex: 1 }}>
          <img 
            src="/pathfinder_orb.png" 
            alt="Pathfinder Core Engine" 
            style={{
              width: "270px",
              height: "auto",
              display: "block",
              mixBlendMode: isDarkMode ? "screen" : "multiply",
              filter: isDarkMode 
                ? "invert(0.92) hue-rotate(180deg) brightness(0.65) contrast(1.15)" 
                : "brightness(1.06) contrast(1.03)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 50%, transparent 74%)",
              maskImage: "radial-gradient(ellipse at center, black 50%, transparent 74%)"
            }}
          />
        </div>

        <h1 style={{
          fontSize: "28px",
          fontWeight: "800",
          lineHeight: "1.3",
          color: "var(--text-light)",
          margin: "0 0 10px 0",
          fontFamily: "var(--font-outfit)",
          letterSpacing: "-0.5px",
          zIndex: 1
        }}>
          Initialize your Pathfinder
        </h1>

        <p style={{
          fontSize: "15px",
          fontWeight: "500",
          color: "var(--text-muted)",
          maxWidth: "480px",
          lineHeight: "1.6",
          margin: "0 0 20px 0",
          fontFamily: "var(--font-outfit)",
          zIndex: 1
        }}>
          Your learning engine is ready, but it needs a destination.<br />
          Generate your first pathway to unlock structured learning, quizzes, challenges, and XP rewards.
        </p>

        {/* Generate Button */}
        <button 
          className="pathfinder-cta-btn" 
          onClick={() => {
            sound.playClockTick();
            setView("onboarding");
          }}
        >
          <span style={{ fontWeight: "700" }}>Generate Your First Pathway</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.3s" }} className="btn-arrow">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>

        {/* Guide Steps Panel (Optimized dense padding) */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "16px",
          width: "100%",
          maxWidth: "760px",
          background: isDarkMode ? "rgba(255, 255, 255, 0.015)" : "#ffffff",
          border: "1px solid var(--glass-border)",
          borderRadius: "14px",
          padding: "16px 20px",
          boxShadow: isDarkMode ? "none" : "0 4px 20px rgba(0,0,0,0.02)",
          zIndex: 1,
          flexDirection: "row"
        }} className="steps-container">
          {/* Step 1 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255, 106, 0, 0.08)", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "12.5px", fontWeight: "800", color: "var(--text-light)", marginBottom: "2px", fontFamily: "var(--font-outfit)" }}>Set your goal</div>
              <div style={{ fontSize: "11px", fontWeight: "500", color: "var(--text-muted)", lineHeight: "1.35", fontFamily: "var(--font-outfit)" }}>Tell us what you want to master</div>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255, 106, 0, 0.08)", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "12.5px", fontWeight: "800", color: "var(--text-light)", marginBottom: "2px", fontFamily: "var(--font-outfit)" }}>Get your path</div>
              <div style={{ fontSize: "11px", fontWeight: "500", color: "var(--text-muted)", lineHeight: "1.35", fontFamily: "var(--font-outfit)" }}>AI builds a personalized learning roadmap</div>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255, 106, 0, 0.08)", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "12.5px", fontWeight: "800", color: "var(--text-light)", marginBottom: "2px", fontFamily: "var(--font-outfit)" }}>Start progressing</div>
              <div style={{ fontSize: "11px", fontWeight: "500", color: "var(--text-muted)", lineHeight: "1.35", fontFamily: "var(--font-outfit)" }}>Unlock rewards, quests and level up</div>
            </div>
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
        isDarkMode={isDarkMode}
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
