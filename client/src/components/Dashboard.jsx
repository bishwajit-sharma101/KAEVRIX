import { useState, useEffect } from "react";
import * as sound from "../utils/audio";
import CognitivePathfinder from "./CognitivePathfinder";
import ProfilePanel from "./ProfilePanel";

const TRENDING_TOPICS = [
  { icon: "⚡", label: "JavaScript", color: "#f59e0b", players: 1420 },
  { icon: "🐍", label: "Python", color: "#10b981", players: 983 },
  { icon: "🤖", label: "Machine Learning", color: "#8b5cf6", players: 756 },
  { icon: "🛠️", label: "System Design", color: "#3b82f6", players: 621 },
  { icon: "🧮", label: "Algorithms", color: "#ef4444", players: 549 },
  { icon: "🌐", label: "Web Dev", color: "#ff6a00", players: 498 },
];

const LIVE_BATTLES = [
  { player1: "ByteKing_X", player2: "NeuralNova", topic: "React Hooks", duration: "4:21", viewers: 312 },
  { player1: "SyntaxSage", player2: "LoopBreaker", topic: "Python Decorators", duration: "1:08", viewers: 198 },
  { player1: "AlgoAce", player2: "DataDruid", topic: "Binary Search", duration: "7:55", viewers: 274 },
];

export default function Dashboard({
  isDarkMode,
  curatedVideos,
  selectedVideo,
  setSelectedVideo,
  vsBot,
  setVsBot,
  leaderboard,
  username,
  avatar,
  getRankTitle,
  onStartMatchmaking,
  backendUrl,
  searchQuery,
  searchResults,
  onSearch,
  selectedClass,
  onSurpassLimits,
  onTestJourneyDay,
  isSearching,
  onStartSoloStudy
}) {
  const [activeTab, setActiveTab] = useState("duels");
  const [personalizedFeed, setPersonalizedFeed] = useState(null);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedTab, setFeedTab] = useState("core"); // core, interview, tips

  // Load Pathfinder answers for query generation
  const answersKey = `kaevrix_roadmap_answers_${username}`;
  const savedAnswers = localStorage.getItem(answersKey);
  const answers = savedAnswers ? JSON.parse(savedAnswers) : null;
  const topic = answers && answers[0] ? answers[0].answer : "";
  const why = answers && answers[1] ? answers[1].answer : "";

  useEffect(() => {
    if (!topic || searchQuery) return;
    
    let isMounted = true;
    const fetchFeed = async () => {
      setLoadingFeed(true);
      try {
        const res = await fetch(`${backendUrl}/api/personalized-feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, why })
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setPersonalizedFeed(data);
          if (data.core && data.core.length > 0) {
            setSelectedVideo(data.core[0]);
          }
        }
      } catch (err) {
        console.error("Error loading personalized feed:", err);
      } finally {
        if (isMounted) setLoadingFeed(false);
      }
    };
    
    fetchFeed();
    return () => {
      isMounted = false;
    };
  }, [topic, why, searchQuery, backendUrl, setSelectedVideo]);

  const handleTabChange = (tab) => {
    sound.playClockTick();
    setActiveTab(tab);
  };

  const handleSelectVideo = (video) => {
    sound.playClockTick();
    setSelectedVideo(video);
  };

  const navItems = [
    { id: "profile", icon: "👤", label: "Profile" },
    { id: "duels", icon: "🎮", label: "Duel Arena" },
    { id: "pathfinder", icon: "🧠", label: "Pathfinder" },
    { id: "rules", icon: "📘", label: "Combat Manual" },
    { id: "rankings", icon: "🏆", label: "Global Rankings" },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px", display: "flex", gap: "28px", alignItems: "flex-start" }}>

      {/* Sidebar Navigation */}
      <div style={{ width: "220px", display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0, position: "sticky", top: "20px" }}>
        <div style={{ marginBottom: "8px", padding: "0 12px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Navigation</span>
        </div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              border: "none",
              background: activeTab === item.id ? "linear-gradient(135deg, #fff7ed, #ffedd5)" : "transparent",
              color: activeTab === item.id ? "#ea580c" : "var(--text-muted)",
              fontWeight: "700",
              fontSize: "14px",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: activeTab === item.id ? "0 2px 12px rgba(255,106,0,0.15)" : "none",
              borderLeft: activeTab === item.id ? "3px solid #ff6a00" : "3px solid transparent",
            }}
          >
            <span style={{ fontSize: "16px" }}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        {/* Quick Stats Widget */}
        <div style={{ marginTop: "24px", background: "linear-gradient(135deg, #fff7ed, #ffedd5)", borderRadius: "16px", padding: "16px", border: "1px solid #fed7aa" }}>
          <div style={{ fontSize: "11px", fontWeight: "800", color: "#ea580c", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>⚡ Live Activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "var(--text-muted)" }}>Battles now</span>
              <span style={{ fontWeight: "800", color: "#ea580c" }}>1,247</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "var(--text-muted)" }}>Players online</span>
              <span style={{ fontWeight: "800", color: "#10b981" }}>3,821</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "var(--text-muted)" }}>Videos in queue</span>
              <span style={{ fontWeight: "800", color: "#8b5cf6" }}>94</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeTab === "profile" && (
          <ProfilePanel username={username} selectedClass={selectedClass} onSurpassLimits={onSurpassLimits} onTestJourneyDay={onTestJourneyDay} />
        )}

        {activeTab === "duels" && (
          <div>
            {/* Hero Section */}
            {!searchQuery && (
              <div style={{
                background: isDarkMode 
                  ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e0a00 100%)" 
                  : "linear-gradient(135deg, #fffaf5 0%, #ffedd5 60%, #ffe3d1 100%)",
                border: isDarkMode ? "none" : "1px solid rgba(255, 106, 0, 0.2)",
                boxShadow: isDarkMode ? "none" : "0 10px 30px rgba(255, 106, 0, 0.06)",
                borderRadius: "24px",
                padding: "40px",
                marginBottom: "32px",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Background decorations */}
                <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: isDarkMode ? "radial-gradient(circle, rgba(255,106,0,0.2) 0%, transparent 70%)" : "radial-gradient(circle, rgba(255,106,0,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "-30px", left: "30%", width: "150px", height: "150px", borderRadius: "50%", background: isDarkMode ? "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)" : "radial-gradient(circle, rgba(255,106,0,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ background: "rgba(255,106,0,0.2)", color: "#ff6a00", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "800", border: "1px solid rgba(255,106,0,0.3)" }}>⚔️ DUEL ARENA</span>
                    <span style={{ background: "rgba(16,185,129,0.2)", color: "#10b981", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "800", border: "1px solid rgba(16,185,129,0.3)", animation: "pulse 2s infinite" }}>🔴 LIVE</span>
                  </div>
                  <h1 style={{ fontSize: "36px", fontWeight: "900", color: isDarkMode ? "#ffffff" : "#1e293b", marginBottom: "8px", lineHeight: "1.2" }}>
                    Choose Your <span style={{ background: "linear-gradient(135deg, #ff6a00, #ffb300)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Battle Ground</span>
                  </h1>
                  <p style={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "#475569", fontSize: "16px", maxWidth: "500px", lineHeight: "1.6" }}>
                    Select a video, enter matchmaking, and face off against a real opponent. The AI generates your quiz from the video content.
                  </p>

                  {/* Trending Topics Pills */}
                  <div style={{ marginTop: "24px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {TRENDING_TOPICS.map(t => (
                      <button
                        key={t.label}
                        onClick={() => onSearch && onSearch(t.label)}
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "8px 16px", borderRadius: "20px",
                          border: isDarkMode ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255, 106, 0, 0.22)",
                          background: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(255, 255, 255, 0.75)",
                          color: isDarkMode ? "#fff" : "#1e293b", fontSize: "13px", fontWeight: "700",
                          cursor: "pointer", transition: "all 0.2s",
                          backdropFilter: "blur(8px)",
                        }}
                        onMouseOver={e => { 
                          e.currentTarget.style.background = `${t.color}22`; 
                          e.currentTarget.style.borderColor = t.color; 
                        }}
                        onMouseOut={e => { 
                          e.currentTarget.style.background = isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(255, 255, 255, 0.75)"; 
                          e.currentTarget.style.borderColor = isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(255, 106, 0, 0.22)"; 
                        }}
                      >
                        {t.icon} {t.label}
                        <span style={{ fontSize: "11px", color: isDarkMode ? "rgba(255,255,255,0.7)" : "#64748b", fontWeight: "normal" }}>
                          {t.players.toLocaleString()} playing
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pathfinder Cognitive Profile Offline Alert Banner */}
            {!searchQuery && !topic && (
              <div style={{
                background: isDarkMode 
                  ? "rgba(239, 68, 68, 0.08)"
                  : "linear-gradient(135deg, #fff1f2, #fffbeb)",
                border: isDarkMode ? "1.5px solid rgba(239, 68, 68, 0.25)" : "1.5px solid #fecdd3",
                boxShadow: "0 10px 30px rgba(239,68,68,0.03)",
                borderRadius: "20px",
                padding: "32px",
                marginBottom: "36px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                alignItems: "center",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "40px", animation: "pulse 2s infinite" }}>🧠</div>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "900", color: isDarkMode ? "#fca5a5" : "#be123c", margin: "0 0 6px 0", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    Pathfinder Cognitive Profile Offline
                  </h3>
                  <p style={{ fontSize: "14px", color: isDarkMode ? "rgba(255,255,255,0.6)" : "#475569", margin: 0, lineHeight: "1.5", maxWidth: "580px" }}>
                    To unlock your personalized training grounds, specialized playlist categories, and custom AI study notes, you must first construct your learning roadmap.
                  </p>
                </div>
                <button
                  onClick={() => handleTabChange("pathfinder")}
                  style={{
                    padding: "12px 28px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #ef4444, #f59e0b)",
                    color: "#fff",
                    fontWeight: "800",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(239,68,68,0.25)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseOut={e => e.currentTarget.style.transform = "none"}
                >
                  ⚡ Initialize Pathfinder Onboarding
                </button>
              </div>
            )}

            {/* Personalized Feed Category Navigation Strip */}
            {!searchQuery && topic && (
              <div style={{
                background: isDarkMode ? "rgba(30,30,40,0.3)" : "#f8fafc",
                borderRadius: "20px",
                border: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
                padding: "24px",
                marginBottom: "32px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.01)"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "900", color: isDarkMode ? "#ffb300" : "#ea580c", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>
                      🧠 personalized playlist: {topic}
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                      Curated automatically from your cognitive goals and learning profile.
                    </p>
                  </div>
                  
                  {/* Category Tabs */}
                  <div style={{ display: "flex", gap: "6px", background: isDarkMode ? "#0f172a" : "#e2e8f0", padding: "4px", borderRadius: "10px" }}>
                    {[
                      { id: "core", label: "🎓 Core Training", color: "#4f46e5" },
                      { id: "interview", label: "💼 Career Prep", color: "#10b981" },
                      { id: "tips", label: "⚡ Tips & Hacks", color: "#f59e0b" }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => { sound.playClockTick(); setFeedTab(t.id); }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: "none",
                          fontSize: "12.5px",
                          fontWeight: "800",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          background: feedTab === t.id ? (isDarkMode ? "#1e293b" : "#ffffff") : "transparent",
                          color: feedTab === t.id ? (isDarkMode ? "#ffb300" : t.color) : "var(--text-muted)",
                          boxShadow: feedTab === t.id ? "0 2px 8px rgba(0,0,0,0.05)" : "none"
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtext description detailing active category context */}
                <div style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  background: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  padding: "12px 18px",
                  borderRadius: "12px",
                  borderLeft: `4px solid ${feedTab === "core" ? "#4f46e5" : feedTab === "interview" ? "#10b981" : "#f59e0b"}`,
                  lineHeight: "1.5"
                }}>
                  {feedTab === "core" && `📚 Core learning materials for mastering ${topic} fundamentals step-by-step.`}
                  {feedTab === "interview" && `💼 Specialized problem solving, coding challenges, and key interview prep questions targeting "${why || "getting a job"}".`}
                  {feedTab === "tips" && `⚡ Speed techniques, pro shortcuts, clean code tips, and architectural hacks to work smarter.`}
                </div>
              </div>
            )}

            {/* Live Battles Spectate Strip */}
            {!searchQuery && (
              <div style={{ marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-light)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ background: "#ef4444", color: "#fff", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "900", animation: "pulse 1.5s infinite" }}>LIVE</span>
                    Battles in Progress
                  </h2>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>{LIVE_BATTLES.length * 412 + 1} spectators watching</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                  {LIVE_BATTLES.map((b, i) => (
                    <div key={i} style={{
                      background: isDarkMode ? "#1e293b" : "#ffffff",
                      borderRadius: "16px",
                      padding: "20px",
                      border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      display: "flex", flexDirection: "column", gap: "12px",
                      transition: "all 0.2s",
                      cursor: "default",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>⚔️ {b.topic}</span>
                        <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                          {b.duration}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #ff6a00, #ffb300)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800", color: "#fff" }}>{b.player1[0]}</div>
                          <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-light)" }}>{b.player1}</span>
                        </div>
                        <span style={{ fontWeight: "900", fontSize: "16px", color: "#ef4444" }}>VS</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-light)" }}>{b.player2}</span>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800", color: "#fff" }}>{b.player2[0]}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        👁️ {b.viewers} spectating
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Selection Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-light)", marginBottom: "4px" }}>
                  {searchQuery ? `Results for "${searchQuery}"` : (topic ? `🎯 Personalized training: ${topic}` : "🎯 Featured Training Videos")}
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                  {isSearching || loadingFeed ? "Scanning the learning grid..." : (searchQuery ? `${searchResults?.length || 0} videos found` : (topic ? `Categorized under ${feedTab.toUpperCase()} training mode` : "Hand-picked educational content — AI quizzes generated from each video"))}
                </p>
              </div>
              {searchQuery && (
                <button onClick={() => onSearch && onSearch("")} style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", color: "var(--text-muted)", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                  ✕ Clear Search
                </button>
              )}
            </div>

            {/* Videos Grid — standard 16:9 cards OR game loading animation */}
            {isSearching || loadingFeed ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "400px",
                gap: "32px",
                padding: "40px 0"
              }}>
                <style>{`
                  @keyframes emblemPulse {
                    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(255,106,0,0.3)); }
                    50% { transform: scale(1.08); filter: drop-shadow(0 0 28px rgba(255,106,0,0.55)); }
                  }
                  @keyframes orbit {
                    0% { transform: rotate(0deg) translateX(52px) rotate(0deg); }
                    100% { transform: rotate(360deg) translateX(52px) rotate(-360deg); }
                  }
                  @keyframes orbitReverse {
                    0% { transform: rotate(0deg) translateX(40px) rotate(0deg); }
                    100% { transform: rotate(-360deg) translateX(40px) rotate(360deg); }
                  }
                  @keyframes ringGrow {
                    0% { transform: scale(0.85); opacity: 0.6; }
                    50% { transform: scale(1.15); opacity: 0.15; }
                    100% { transform: scale(0.85); opacity: 0.6; }
                  }
                  @keyframes textReveal {
                    0% { opacity: 0; transform: translateY(8px); }
                    100% { opacity: 1; transform: translateY(0); }
                  }
                  @keyframes barSlide {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                  }
                `}</style>

                {/* Animated emblem area */}
                <div style={{
                  position: "relative",
                  width: "120px",
                  height: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {/* Outer breathing ring */}
                  <div style={{
                    position: "absolute",
                    width: "110px", height: "110px",
                    borderRadius: "50%",
                    border: `2px solid ${isDarkMode ? "rgba(255,106,0,0.25)" : "rgba(234,88,12,0.2)"}`,
                    animation: "ringGrow 2.5s ease-in-out infinite"
                  }} />

                  {/* Orbiting embers — outer ring */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={`o-${i}`} style={{
                      position: "absolute",
                      width: "7px", height: "7px",
                      borderRadius: "50%",
                      background: isDarkMode
                        ? `radial-gradient(circle, #ffb300, #ff6a00)`
                        : `radial-gradient(circle, #ff8c3a, #ea580c)`,
                      boxShadow: isDarkMode
                        ? "0 0 6px rgba(255,179,0,0.6)"
                        : "0 0 5px rgba(234,88,12,0.4)",
                      animation: `orbit ${3 + i * 0.4}s linear infinite`,
                      animationDelay: `${i * -0.6}s`,
                      opacity: 0.9
                    }} />
                  ))}

                  {/* Orbiting embers — inner ring, reverse */}
                  {[0, 1, 2].map(i => (
                    <div key={`ir-${i}`} style={{
                      position: "absolute",
                      width: "4px", height: "4px",
                      borderRadius: "50%",
                      background: isDarkMode ? "#ffb300" : "#f59e0b",
                      boxShadow: isDarkMode
                        ? "0 0 4px rgba(255,179,0,0.5)"
                        : "0 0 3px rgba(245,158,11,0.4)",
                      animation: `orbitReverse ${2.5 + i * 0.5}s linear infinite`,
                      animationDelay: `${i * -0.8}s`,
                      opacity: 0.7
                    }} />
                  ))}

                  {/* Center emblem */}
                  <div style={{
                    fontSize: "44px",
                    animation: "emblemPulse 2.5s ease-in-out infinite",
                    lineHeight: 1,
                    zIndex: 2
                  }}>
                    ⚔️
                  </div>
                </div>

                {/* Text */}
                <div style={{
                  textAlign: "center",
                  animation: "textReveal 0.6s ease-out forwards"
                }}>
                  <h3 style={{
                    fontSize: "20px",
                    fontWeight: "900",
                    color: isDarkMode ? "#ffb300" : "#ea580c",
                    margin: "0 0 8px 0",
                    letterSpacing: "1px"
                  }}>
                    Entering the Arena
                  </h3>
                  <p style={{
                    fontSize: "14px",
                    color: "var(--text-muted)",
                    margin: 0,
                    fontWeight: "500"
                  }}>
                    Finding battles for <span style={{ fontWeight: "700", color: isDarkMode ? "#ff8c3a" : "#c2410c" }}>{searchQuery}</span>
                  </p>
                </div>

                {/* Sleek loading bar — no container box */}
                <div style={{
                  width: "200px",
                  height: "3px",
                  borderRadius: "4px",
                  background: isDarkMode ? "rgba(255,106,0,0.12)" : "rgba(234,88,12,0.1)",
                  overflow: "hidden",
                  position: "relative"
                }}>
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0,
                    width: "40%",
                    height: "100%",
                    background: "linear-gradient(90deg, transparent, #ff6a00, #ffb300, transparent)",
                    borderRadius: "4px",
                    animation: "barSlide 1.4s ease-in-out infinite"
                  }} />
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                {(() => {
                  if (searchResults?.length > 0 || searchQuery) {
                    return searchResults || [];
                  }
                  if (topic && personalizedFeed?.[feedTab]) {
                    return personalizedFeed[feedTab];
                  }
                  return curatedVideos;
                })().map((video) => (
                  <div
                    key={video.id}
                    onClick={() => handleSelectVideo(video)}
                    style={{
                      background: selectedVideo?.id === video.id 
                        ? (isDarkMode ? "rgba(255, 106, 0, 0.08)" : "#fff7ed") 
                        : (isDarkMode ? "#1e293b" : "#ffffff"),
                      border: selectedVideo?.id === video.id 
                        ? "2px solid #ff6a00" 
                        : (isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0"),
                      borderRadius: "18px",
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: selectedVideo?.id === video.id 
                        ? "0 10px 30px rgba(255,106,0,0.2)" 
                        : "0 2px 8px rgba(0,0,0,0.06)",
                      transform: selectedVideo?.id === video.id ? "translateY(-4px)" : "none",
                      display: "flex", flexDirection: "column",
                    }}
                  >
                    {/* 16:9 Thumbnail */}
                    <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", background: "#000", overflow: "hidden" }}>
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.92 }}
                      />
                      {/* Gradient overlay */}
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)" }} />

                      {/* LIVE badge */}
                      <div style={{ position: "absolute", top: "10px", left: "10px", background: "#ef4444", color: "#fff", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "900", display: "flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#fff", animation: "pulse 1.5s infinite" }} />
                        LIVE
                      </div>

                      {/* Queue count */}
                      <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", color: "#fff", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "800", border: "1px solid rgba(255,255,255,0.12)" }}>
                        👁️ {Math.floor(video.id.charCodeAt(0) * 3.7) + 120} queuing
                      </div>

                      {/* Duration */}
                      <span style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(0,0,0,0.7)", color: "#fff", padding: "3px 7px", borderRadius: "5px", fontSize: "11px", fontWeight: "700" }}>
                        {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Card Info */}
                    <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column" }}>
                      {/* Tags */}
                      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "10px", fontWeight: "800", color: "#ea580c", background: "#ffedd5", padding: "3px 8px", borderRadius: "5px", textTransform: "uppercase" }}>{video.category || "Training"}</span>
                        <span style={{ fontSize: "10px", fontWeight: "800", color: "#4338ca", background: "#e0e7ff", padding: "3px 8px", borderRadius: "5px", textTransform: "uppercase" }}>TRENDING</span>
                      </div>

                      <h4 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-light)", marginBottom: "6px", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.4" }}>
                        {video.title}
                      </h4>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "5px", fontWeight: "600" }}>
                        📺 {video.channel}
                      </p>

                      {selectedVideo?.id === video.id && (
                        <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid #fed7aa", display: "flex", flexDirection: "column", gap: "10px", animation: "fadeIn 0.3s" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); onStartMatchmaking(); }}
                            style={{
                              width: "100%", padding: "14px",
                              borderRadius: "12px", fontSize: "14px", fontWeight: "900",
                              background: "linear-gradient(135deg, #ff6a00, #ffb300)",
                              border: "none", color: "#fff", cursor: "pointer",
                              boxShadow: "0 6px 20px rgba(255,106,0,0.35)",
                              textTransform: "uppercase", letterSpacing: "1px",
                              transition: "transform 0.2s, box-shadow 0.2s",
                            }}
                            onMouseOver={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(255,106,0,0.5)"; }}
                            onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(255,106,0,0.35)"; }}
                          >
                            ⚡ ENTER MATCHMAKING
                          </button>
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); sound.playClockTick(); onStartSoloStudy(video); }}
                            style={{
                              width: "100%", padding: "12px",
                              borderRadius: "12px", fontSize: "14px", fontWeight: "900",
                              background: isDarkMode
                                ? "linear-gradient(135deg, #4f46e5, #6366f1)"
                                : "linear-gradient(135deg, #6366f1, #818cf8)",
                              border: "none", color: "#fff", cursor: "pointer",
                              boxShadow: isDarkMode ? "0 6px 20px rgba(99,102,241,0.25)" : "0 6px 20px rgba(99,102,241,0.35)",
                              textTransform: "uppercase", letterSpacing: "1px",
                              transition: "transform 0.2s, box-shadow 0.2s",
                            }}
                            onMouseOver={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.5)"; }}
                            onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = isDarkMode ? "0 6px 20px rgba(99,102,241,0.25)" : "0 6px 20px rgba(99,102,241,0.35)"; }}
                          >
                            🎓 ENTER SOLO STUDY Room
                          </button>

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              id={`bot-toggle-${video.id}`}
                              checked={vsBot}
                              onChange={(e) => { sound.playClockTick(); setVsBot(e.target.checked); }}
                              style={{ width: "15px", height: "15px", accentColor: "#ff6a00", cursor: "pointer" }}
                            />
                            <label htmlFor={`bot-toggle-${video.id}`} style={{ fontSize: "13px", color: "var(--text-muted)", cursor: "pointer", userSelect: "none", fontWeight: "600" }}>
                              Enable Bot Fallback
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Domain Leaderboards Strip */}
            {!searchQuery && (
              <div style={{ marginTop: "40px", background: "#ffffff", borderRadius: "20px", padding: "28px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-light)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                  🏆 Top Duelists This Week
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>Updated every hour</span>
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(leaderboard || []).slice(0, 5).map((player, idx) => (
                    <div key={player.username} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", background: player.username?.toLowerCase() === username?.toLowerCase() ? "#fff7ed" : "#f8fafc", borderRadius: "12px", border: player.username?.toLowerCase() === username?.toLowerCase() ? "2px solid #ff6a00" : "1px solid #e2e8f0" }}>
                      <span style={{ width: "28px", textAlign: "center", fontWeight: "900", fontSize: "18px", color: idx === 0 ? "#f59e0b" : idx === 1 ? "#94a3b8" : idx === 2 ? "#b45309" : "#cbd5e1" }}>#{idx + 1}</span>
                      <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #ff6a00, #ffb300)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", overflow: "hidden" }}>
                        {player.avatar ? (player.avatar.includes("http") ? <img src={player.avatar} alt="av" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : player.avatar) : "👤"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "700", fontSize: "15px", color: "var(--text-light)" }}>{player.username}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{getRankTitle ? getRankTitle(player.level || 1) : "Rookie"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: "800", color: "#ff6a00", fontSize: "15px" }}>LVL {player.level || 1}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{player.wins || 0}W / {player.losses || 0}L</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "rules" && (
          <div style={{ background: "#ffffff", borderRadius: "24px", padding: "40px", boxShadow: "0 10px 40px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: "36px", fontWeight: "800", color: "#4338ca", marginBottom: "12px" }}>Combat Manual</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "40px" }}>Master the arena with these essential techniques and status effects.</p>
            <div style={{ background: "linear-gradient(145deg, #f8fafc, #eff6ff)", borderRadius: "20px", padding: "30px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#1e40af", marginBottom: "20px" }}>Status Effects Explained</h3>
              <p style={{ color: "var(--text-muted)", lineHeight: "1.6", marginBottom: "30px" }}>
                Understanding how different status effects interact is key to dominating the Duel Arena. Collect battery power (+2% per sec) to invoke active countermeasures!
              </p>
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "25px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "20px" }}>
                <h4 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-light)", marginBottom: "10px" }}>Weapon Systems</h4>
                {[
                  { icon: "⚡", bg: "#fef3c7", color: "#d97706", title: "EMP Freeze (50% energy)", desc: "Pause the opponent's video stream for 3 seconds and glitch their viewport with CRT static noise." },
                  { icon: "🌫️", bg: "#f1f5f9", color: "#64748b", title: "Smoke Screen (40% energy)", desc: "Blur the opponent's view for 5 seconds using heavy smoke fog. Reduces visibility significantly." },
                  { icon: "💻", bg: "#fee2e2", color: "#ef4444", title: "Hacker's Clue (60% energy)", desc: "Scans answers during the quiz phase to permanently filter out two incorrect choices for the active question." },
                ].map(w => (
                  <div key={w.title} style={{ display: "flex", gap: "15px", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "24px", background: w.bg, padding: "10px", borderRadius: "12px", color: w.color, display: "flex", flexShrink: 0 }}>{w.icon}</div>
                    <div>
                      <strong style={{ color: "var(--text-light)", fontSize: "15px" }}>{w.title}</strong>
                      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px", lineHeight: "1.5" }}>{w.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "pathfinder" && (
          <CognitivePathfinder
            username={username}
            onTriggerSearch={(topicName) => {
              if (onSearch) onSearch(topicName);
              setActiveTab("duels");
            }}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === "rankings" && (
          <div style={{ background: "#ffffff", borderRadius: "24px", padding: "40px", boxShadow: "0 10px 40px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: "36px", fontWeight: "800", color: "#4338ca", marginBottom: "12px" }}>Global Rankings</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "40px" }}>The top duelists across all domains.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {leaderboard.map((player, index) => (
                <div key={player.username} style={{ display: "flex", alignItems: "center", gap: "20px", padding: "20px", background: player.username?.toLowerCase() === username?.toLowerCase() ? "#fff7ed" : "#f8fafc", borderRadius: "16px", border: player.username?.toLowerCase() === username?.toLowerCase() ? "2px solid var(--neon-orange)" : "1px solid #e2e8f0", transition: "all 0.2s ease" }}>
                  <div style={{ fontSize: "24px", fontWeight: "900", color: index === 0 ? "#f59e0b" : index === 1 ? "#94a3b8" : index === 2 ? "#b45309" : "#cbd5e1", width: "40px", textAlign: "center" }}>#{index + 1}</div>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fff", border: "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", overflow: "hidden" }}>
                    {player.avatar ? (player.avatar.includes('http') ? <img src={player.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : player.avatar) : "👤"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-light)" }}>{player.username}</div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>{getRankTitle(player.level || 1)}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--neon-orange)" }}>LVL {player.level || 1}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{player.wins} Wins | {player.losses} Losses</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
