import React from "react";
import * as sound from "./utils/audio";
import WelcomeScreen from "./features/Auth/WelcomeScreen";
import Dashboard from "./features/Dashboard/Dashboard";
import Matchmaking from "./features/GameArena/Matchmaking";
import Lobby from "./features/GameArena/Lobby";
import Countdown from "./features/Shared/Countdown";
import GameArena from "./features/GameArena/GameArena";
import QuizPanel from "./features/GameArena/QuizPanel";
import ResultsPanel from "./features/GameArena/ResultsPanel";
import SurpassLimits from "./features/Dashboard/SurpassLimits";
import DailyLogin from "./features/Dashboard/DailyLogin";
import SoloStudyRoom from "./features/SoloStudy/SoloStudyRoom";
import ModeSelection from "./features/GameArena/ModeSelection";
import CommandCenter from "./features/Admin/CommandCenter";

export default function AppRouter(props) {
  const { username, setUsername, avatar, setAvatar, selectedClass, setSelectedClass, isRegistered, setIsRegistered, xp, setXp, level, setLevel, wins, setWins, losses, setLosses, isDarkMode, setIsDarkMode, token, setToken, isMusicMuted, setIsMusicMuted, musicProfile, setMusicProfile, keepMusicInGame, setKeepMusicInGame, showMusicSettings, setShowMusicSettings, showSurpassLimits, setShowSurpassLimits, isExitIntercept, setIsExitIntercept, interceptTrackIdx, setInterceptTrackIdx, showDailyModal, setShowDailyModal, journeyDay, setJourneyDay, energy, setEnergy, isFrozen, setIsFrozen, isBlurred, setIsBlurred, progressAtQuizEntry, setProgressAtQuizEntry, doubleDownQuestions, setDoubleDownQuestions, disabledOptions, setDisabledOptions, leaderboard, setLeaderboard, curatedVideos, setCuratedVideos, selectedVideo, setSelectedVideo, selectedSoloVideo, setSelectedSoloVideo, vsBot, setVsBot, searchQuery, setSearchQuery, activeSearchQuery, setActiveSearchQuery, searchResults, setSearchResults, isSearching, setIsSearching, socket, setSocket, status, setStatus, room, setRoom, opponent, setOpponent, countdown, setCountdown, myProgress, setMyProgress, opponentProgress, setOpponentProgress, opponentWaiting, setOpponentWaiting, opponentSubmitted, setOpponentSubmitted, chatMessages, setChatMessages, chatInput, setChatInput, questions, setQuestions, currentQuestionIdx, setCurrentQuestionIdx, selectedAnswers, setSelectedAnswers, quizTimer, setQuizTimer, gameResults, setGameResults, xpGained, setXpGained, leveledUp, setLeveledUp, handleLogout, cancelMatchmaking, handleSearchSubmit, clearSearch, resetToDashboard, startMatchmaking, handleReadyToPlay, handleSendChat, handleVideoProgress, handleVideoFinished, handleUsePowerup, handleSelectOption, handleDoubleDown, handleHackersClue, submitQuizAnswers, handleNextQuestion, handleStartSoloStudy, handleAddSoloXp, exitAttemptsRef, BACKEND_URL, getRankTitle, triggerSearch, initializeSocketAndRegister } = props;

  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [isCodingMode, setIsCodingMode] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("duels");
  const [isMobileSearchActive, setIsMobileSearchActive] = React.useState(false);
  const [searchHistory, setSearchHistory] = React.useState([]);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("kaevrix_search_history");
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, [isMobileSearchActive]);

  const saveSearchToHistory = (query) => {
    if (!query || !query.trim()) return;
    const trimmed = query.trim();
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, 6);
      localStorage.setItem("kaevrix_search_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleLocalSearchSubmit = (e) => {
    if (e) e.preventDefault();
    saveSearchToHistory(searchQuery);
    handleSearchSubmit(e);
  };
  const [hellMode, setHellMode] = React.useState(() => {
    const localVal = localStorage.getItem("hellMode");
    if (localVal === "true") return true;
    if (localVal === "false") return false;
    try {
      const savedRoadmap = localStorage.getItem(`kaevrix_roadmap_progress_${username}`);
      if (savedRoadmap) {
        const roadmapObj = JSON.parse(savedRoadmap);
        return roadmapObj?.difficulty === "Hell";
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  });



  // 1. Initial Login Setup Overlay
  if (!isRegistered) {
    return (
      <WelcomeScreen
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isMusicMuted={isMusicMuted}
        setIsMusicMuted={setIsMusicMuted}
        musicProfile={musicProfile}
        setMusicProfile={setMusicProfile}
        keepMusicInGame={keepMusicInGame}
        setKeepMusicInGame={setKeepMusicInGame}
        onAuthSuccess={(user, userToken) => {
          setToken(userToken);
          localStorage.setItem("kaevrix_token", userToken);
          setUsername(user.username);
          setAvatar(user.avatar);
          setSelectedClass(user.selectedClass);
          setXp(user.xp);
          setLevel(user.level);
          setWins(user.wins || 0);
          setLosses(user.losses || 0);
          if (user.showDailyAnnouncement) {
            setJourneyDay(user.showDailyAnnouncement);
            setShowDailyModal(true);
          }
          setIsRegistered(true);
          initializeSocketAndRegister(user.username, user.avatar, user.selectedClass);
        }}
      />
    );
  }

  const renderSearchHelperOverlay = () => {
    if (!isMobileSearchActive) return null;
    return (
      <div 
        className="mobile-search-helper-overlay"
        style={{
          position: "fixed",
          top: "60px",
          left: 0,
          width: "100%",
          height: "calc(100% - 60px)",
          background: isDarkMode ? "#090d16" : "#ffffff",
          zIndex: 9999,
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxSizing: "border-box",
          overflowY: "auto"
        }}
      >
        {/* Recent Searches */}
        <div>
          <h4 style={{ 
            fontSize: "12px", 
            fontWeight: "800", 
            color: "var(--neon-orange)", 
            textTransform: "uppercase", 
            letterSpacing: "1px", 
            marginBottom: "12px" 
          }}>
            Recent Searches
          </h4>
          {searchHistory.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {searchHistory.map((historyQuery, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: isDarkMode ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 0, 0, 0.05)"
                  }}
                >
                  <div 
                    onClick={() => {
                      sound.playClockTick();
                      setSearchQuery(historyQuery);
                      triggerSearch(historyQuery);
                      setIsMobileSearchActive(false);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", flex: 1 }}
                  >
                    <span style={{ fontSize: "16px", opacity: 0.6 }}>🕒</span>
                    <span style={{ fontSize: "14px", color: isDarkMode ? "#f8fafc" : "#0f172a", fontWeight: "500" }}>{historyQuery}</span>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClockTick();
                      const updated = searchHistory.filter(h => h !== historyQuery);
                      setSearchHistory(updated);
                      localStorage.setItem("kaevrix_search_history", JSON.stringify(updated));
                    }}
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "12px", cursor: "pointer", padding: "4px" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>No recent searches.</p>
          )}
        </div>

        {/* Trending tech topics */}
        <div>
          <h4 style={{ 
            fontSize: "12px", 
            fontWeight: "800", 
            color: "var(--neon-orange)", 
            textTransform: "uppercase", 
            letterSpacing: "1px", 
            marginBottom: "12px" 
          }}>
            Trending Tech Topics
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {[
              "React Hooks & State",
              "Machine Learning Basics",
              "Node.js REST API",
              "CSS Flexbox & Grid",
              "Web Security & JWT",
              "SQL vs NoSQL Databases"
            ].map((topicText, idx) => (
              <button
                key={idx}
                onClick={() => {
                  sound.playClockTick();
                  setSearchQuery(topicText);
                  triggerSearch(topicText);
                  saveSearchToHistory(topicText);
                  setIsMobileSearchActive(false);
                }}
                style={{
                  background: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
                  border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.08)",
                  borderRadius: "20px",
                  padding: "8px 16px",
                  fontSize: "12.5px",
                  color: isDarkMode ? "#cbd5e1" : "#334155",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "var(--neon-orange)"; e.currentTarget.style.color = "var(--neon-orange)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"; e.currentTarget.style.color = isDarkMode ? "#cbd5e1" : "#334155"; }}
              >
                🔥 {topicText}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Header display
  const headerComponent = (
    <header className="app-header" style={{ height: "60px", padding: "8px 16px", display: "flex", alignItems: "center", boxSizing: "border-box" }}>
      {(isMobileSearchActive || searchQuery) ? (
        <div className="mobile-search-active-bar" style={{ display: "flex", width: "100%", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => {
              sound.playClockTick();
              clearSearch();
              setIsMobileSearchActive(false);
            }}
            style={{ 
              background: "transparent", border: "none", color: "var(--neon-orange)", 
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              padding: "6px", flexShrink: 0
            }}
            title="Clear Search"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <form 
            onSubmit={handleLocalSearchSubmit}
            className="header-search-form"
            style={{ 
              display: "flex", 
              flex: 1, 
              background: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)", 
              borderRadius: "24px", 
              overflow: "hidden", 
              border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(0, 0, 0, 0.1)", 
              alignItems: "center",
              padding: "2px 8px 2px 16px",
              height: "40px"
            }}
          >
            <input
              type="text"
              placeholder="Search YouTube videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                flex: 1, 
                border: "none", 
                background: "transparent", 
                padding: "8px 0", 
                fontSize: "14px", 
                outline: "none", 
                color: isDarkMode ? "#ffffff" : "#0f172a",
                fontFamily: "'Outfit', var(--font-sans)"
              }}
              autoFocus
            />
            <button 
              type="submit" 
              style={{ 
                background: "transparent", 
                border: "none", 
                cursor: "pointer", 
                color: "var(--neon-orange)", 
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="header-left" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Hamburger Menu — only show on mobile/tablet */}
            <button
              className="header-hamburger-btn"
              onClick={() => { sound.playClockTick(); setIsDrawerOpen(true); }}
              title="Open Navigation Drawer"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--neon-orange)",
                fontSize: "24px",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ☰
            </button>
            {/* Back Arrow — only show when not on dashboard */}
            {status !== "idle" && (
              <button
                onClick={() => { sound.playClockTick(); resetToDashboard(); }}
                title="Back to Dashboard"
                style={{
                  width: "36px", height: "36px",
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  color: "var(--neon-orange)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "18px",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
                onMouseOver={e => e.currentTarget.style.transform = "translateX(-2px)"}
                onMouseOut={e => e.currentTarget.style.transform = "none"}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
            )}
            <div className="logo-container" onClick={resetToDashboard} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
              <img src="/logo.png" alt="Kaevrix Logo" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
              <span className="logo-text" style={{ fontSize: "24px" }}>Kaevrix</span>
            </div>
          </div>

          {/* Desktop Search Bar (shown only on large viewports) */}
          <div className="header-search-container desktop-search-only">
            <form 
              onSubmit={handleLocalSearchSubmit} 
              className="header-search-form" 
              style={{ 
                display: "flex", 
                flex: 1, 
                background: isDarkMode ? "rgba(10, 6, 4, 0.65)" : "rgba(255, 255, 255, 0.9)", 
                borderRadius: "28px", 
                overflow: "hidden", 
                border: isSearchFocused
                  ? (isDarkMode ? "1.5px solid #ff6a00" : "1.5px solid #ea580c")
                  : (isDarkMode ? "1.5px solid rgba(255, 106, 0, 0.25)" : "1.5px solid #fed7aa"), 
                boxShadow: isSearchFocused
                  ? (isDarkMode ? "0 0 25px rgba(255, 106, 0, 0.35), inset 0 2px 4px rgba(0,0,0,0.4)" : "0 4px 20px rgba(255, 106, 0, 0.15)")
                  : (isDarkMode ? "0 4px 20px rgba(0, 0, 0, 0.3)" : "inset 0 1px 2px rgba(0,0,0,0.05)"),
                backdropFilter: "blur(12px)",
                transition: "all 0.3s ease",
                alignItems: "center"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", paddingLeft: "18px" }}>
                <span style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  backgroundColor: isSearchFocused ? "#ff6a00" : (isDarkMode ? "rgba(255, 106, 0, 0.4)" : "rgba(234, 88, 12, 0.3)"),
                  boxShadow: isSearchFocused ? "0 0 8px #ff6a00, 0 0 15px #ffb300" : "none",
                  transition: "all 0.3s ease"
                }} />
              </div>
              <input
                type="text"
                placeholder="Search YouTube videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                style={{ 
                  flex: 1, border: "none", background: "transparent", 
                  padding: "12px 14px", fontSize: "15px", outline: "none", 
                  color: isDarkMode ? "#ffffff" : "#0f172a",
                  fontFamily: "'Outfit', var(--font-sans)"
                }}
              />
              <button 
                type="submit" 
                style={{ 
                  alignSelf: "stretch", padding: "0 28px", 
                  background: isDarkMode ? "linear-gradient(135deg, #ff6a00, #ffb300)" : "linear-gradient(135deg, #ea580c, #f97316)", 
                  border: "none", clipPath: "polygon(12px 0, 100% 0, 100% 100%, 0 100%)",
                  cursor: isSearching ? "not-allowed" : "pointer", color: "#ffffff", 
                  fontSize: "16px", transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }} 
                disabled={isSearching}
              >
                {isSearching ? (
                  <div className="search-dots-loader">
                    <span className="search-dot" style={{ backgroundColor: "#ffffff" }} />
                    <span className="search-dot" style={{ backgroundColor: "#ffffff" }} />
                    <span className="search-dot" style={{ backgroundColor: "#ffffff" }} />
                  </div>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.15)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                )}
              </button>
            </form>
          </div>

          <div className="header-right">
            {/* YouTube style search trigger button on mobile */}
            <button 
              className="mobile-search-trigger"
              onClick={() => { sound.playClockTick(); setIsMobileSearchActive(true); }}
              style={{ 
                background: "transparent", 
                border: "none", 
                color: "var(--neon-orange)", 
                width: "40px", 
                height: "40px",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.2s"
              }}
              title="Search"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </>
      )}
    </header>
  );
  const hellModeStyles = (
    <style>{`
      /* ═══════════════ HELL MODE - INFERNAL BADGE ═══════════════ */

      .hell-btn-active {
        position: relative !important;
        background: linear-gradient(135deg, #150202 0%, #3a0808 50%, #150202 100%) !important;
        background-size: 200% 200% !important;
        animation: hellMagmaShift 4s ease infinite !important;
        border: 1px solid rgba(255, 34, 0, 0.8) !important;
        box-shadow: 
          0 2px 10px rgba(0, 0, 0, 0.5),
          inset 0 0 10px rgba(255, 34, 0, 0.5),
          inset 0 1px 2px rgba(255, 255, 255, 0.1) !important;
      }

      .hell-btn-inactive {
        background: ${isDarkMode ? "#1e293b" : "#ffffff"};
        border: 1.5px solid ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "#e2e8f0"};
        color: #64748b;
        box-shadow: 0 2px 10px rgba(0,0,0,0.02);
      }

      .hell-btn-inactive:hover {
        border-color: rgba(255, 34, 0, 0.6);
        color: #ff3333;
        box-shadow: 0 0 20px rgba(255, 34, 0, 0.25), 0 0 40px rgba(255, 34, 0, 0.08);
        text-shadow: 0 0 8px rgba(255, 34, 0, 0.5);
        background: ${isDarkMode ? "#1c0505" : "#fff5f5"};
      }

      /* ── Magma Shifting Background ── */
      @keyframes hellMagmaShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      /* ── Breathing Aura Back-Glow ── */
      .hell-aura {
        position: absolute;
        inset: -6px;
        border-radius: 28px;
        background: rgba(255, 34, 0, 0.15);
        pointer-events: none;
        z-index: -1;
        filter: blur(8px);
        animation: hellAuraBreathe 3s ease-in-out infinite alternate;
      }

      @keyframes hellAuraBreathe {
        0% {
          transform: scale(0.96);
          opacity: 0.4;
          box-shadow: 0 0 10px rgba(255, 34, 0, 0.2);
        }
        100% {
          transform: scale(1.04);
          opacity: 1;
          box-shadow: 0 0 25px rgba(255, 34, 0, 0.5), 0 0 45px rgba(255, 34, 0, 0.2);
        }
      }

      /* ── Metallic Sheen Sweep ── */
      .hell-sheen {
        position: absolute;
        inset: 0;
        border-radius: 22px;
        overflow: hidden;
        pointer-events: none;
        z-index: 3;
      }

      .hell-sheen::after {
        content: '';
        position: absolute;
        top: 0;
        left: -150%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.1) 30%,
          rgba(255, 255, 255, 0.25) 50%,
          rgba(255, 255, 255, 0.1) 70%,
          transparent
        );
        transform: skewX(-25deg);
        animation: hellSheenSweep 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }

      @keyframes hellSheenSweep {
        0% { left: -150%; }
        30%, 100% { left: 150%; }
      }

      /* ── Tiny Spark Particles ── */
      .hell-sparks {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: visible;
        z-index: 4;
      }

      .hell-sparks span {
        position: absolute;
        display: block;
        width: 2px;
        height: 2px;
        background: #ff6a00;
        bottom: 80%;
        border-radius: 50%;
        opacity: 0;
        box-shadow: 0 0 4px #ff3300, 0 0 8px #ffaa00;
        animation: hellSparkFloat 1.8s infinite linear;
      }

      .hell-sparks span:nth-child(1) { left: 15%; animation-delay: 0s; animation-duration: 1.5s; }
      .hell-sparks span:nth-child(2) { left: 35%; animation-delay: 0.4s; animation-duration: 2s; }
      .hell-sparks span:nth-child(3) { left: 55%; animation-delay: 0.8s; animation-duration: 1.7s; }
      .hell-sparks span:nth-child(4) { left: 75%; animation-delay: 0.2s; animation-duration: 2.2s; }
      .hell-sparks span:nth-child(5) { left: 90%; animation-delay: 1.2s; animation-duration: 1.6s; }

      @keyframes hellSparkFloat {
        0% {
          transform: translateY(0) scale(1) rotate(0deg);
          opacity: 0;
        }
        15% {
          opacity: 1;
        }
        80% {
          opacity: 0.8;
        }
        100% {
          transform: translateY(-20px) translateX(4px) scale(0.3) rotate(180deg);
          opacity: 0;
        }
      }

      /* ── Pulsing Text Glow ── */
      .hell-text {
        position: relative;
        z-index: 5;
        color: #ff3c1f !important;
        text-shadow: 0 0 8px rgba(255, 34, 0, 0.8), 0 0 15px rgba(255, 34, 0, 0.4) !important;
        animation: hellTextPulse 2s ease-in-out infinite alternate;
      }

      @keyframes hellTextPulse {
        0% {
          color: #ff3c1f;
          text-shadow: 0 0 6px rgba(255, 34, 0, 0.7), 0 0 12px rgba(255, 34, 0, 0.3);
        }
        100% {
          color: #ff6a00;
          text-shadow: 0 0 10px rgba(255, 106, 0, 0.9), 0 0 20px rgba(255, 34, 0, 0.5);
        }
      }
    `}</style>
  );

  return (
    <div className="app-container">
      {/* Dynamic Hell Mode styles */}
      {hellModeStyles}
      {(!isCodingMode || status !== "solo_study") && status !== "command_center" && headerComponent}
      {renderSearchHelperOverlay()}

      {/* 2. DASHBOARD OR GAME STATES */}
      {status === "idle" && (
        <Dashboard
          isDarkMode={isDarkMode}
          curatedVideos={curatedVideos}
          selectedVideo={selectedVideo}
          setSelectedVideo={setSelectedVideo}
          vsBot={vsBot}
          setVsBot={setVsBot}
          leaderboard={leaderboard}
          username={username}
          avatar={avatar}
          selectedClass={selectedClass}
          getRankTitle={getRankTitle}
          onStartMatchmaking={startMatchmaking}
          backendUrl={BACKEND_URL}
          searchQuery={activeSearchQuery}
          isSearching={isSearching}
          searchResults={searchResults}
          onSearch={(query) => {
            if (!query) {
              clearSearch();
            } else {
              setSearchQuery(query);
              triggerSearch(query);
            }
          }}
          onSurpassLimits={() => {
            setIsExitIntercept(false);
            setShowSurpassLimits(true);
          }}
          onTestJourneyDay={(dayNum) => {
            setJourneyDay(dayNum);
            setShowDailyModal(true);
          }}
          onStartSoloStudy={handleStartSoloStudy}
          setStatus={setStatus}
          socket={socket}
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          setIsDarkMode={setIsDarkMode}
          isMusicMuted={isMusicMuted}
          setIsMusicMuted={setIsMusicMuted}
          musicProfile={musicProfile}
          setMusicProfile={setMusicProfile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleLogout={handleLogout}
        />
      )}

      {status === "mode_selection" && (
        <ModeSelection
          isDarkMode={isDarkMode}
          video={selectedVideo}
          onStartSoloStudy={handleStartSoloStudy}
          onStartMatchmaking={startMatchmaking}
          onBack={resetToDashboard}
        />
      )}

      {status === "searching" && (
        <Matchmaking
          avatar={avatar}
          selectedVideo={selectedVideo}
          onCancel={cancelMatchmaking}
        />
      )}

      {status === "matched" && (
        <Lobby
          room={room}
          socket={socket}
          avatar={avatar}
          username={username}
          level={level}
          getRankTitle={getRankTitle}
          opponent={opponent}
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          onSendChat={handleSendChat}
          onReadyToPlay={handleReadyToPlay}
          onForfeit={() => socket?.emit("disconnect")}
        />
      )}

      {status === "countdown" && (
        <Countdown
          countdown={countdown}
          room={room}
        />
      )}

      {status === "playing" && (
        <GameArena
          room={room}
          socket={socket}
          username={username}
          selectedClass={selectedClass}
          level={level}
          opponent={opponent}
          myProgress={myProgress}
          opponentProgress={opponentProgress}
          energy={energy}
          isFrozen={isFrozen}
          isBlurred={isBlurred}
          opponentWaiting={opponentWaiting}
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          onSendChat={handleSendChat}
          onVideoProgress={handleVideoProgress}
          onVideoFinished={handleVideoFinished}
          onUsePowerup={handleUsePowerup}
        />
      )}

      {status === "quiz" && (
        <QuizPanel
          questions={questions}
          currentQuestionIdx={currentQuestionIdx}
          setCurrentQuestionIdx={setCurrentQuestionIdx}
          selectedAnswers={selectedAnswers}
          handleSelectOption={handleSelectOption}
          doubleDownQuestions={doubleDownQuestions}
          handleDoubleDown={handleDoubleDown}
          disabledOptions={disabledOptions}
          handleHackersClue={handleHackersClue}
          quizTimer={quizTimer}
          energy={energy}
          opponentSubmitted={opponentSubmitted}
          handleNextQuestion={handleNextQuestion}
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          onSendChat={handleSendChat}
          username={username}
        />
      )}

      {status === "results" && gameResults && (
        <ResultsPanel
          gameResults={gameResults}
          username={username}
          xpGained={xpGained}
          leveledUp={leveledUp}
          onPlayAgain={resetToDashboard}
        />
      )}

      {status === "solo_study" && selectedSoloVideo && (
        <SoloStudyRoom
          video={selectedSoloVideo}
          username={username}
          isDarkMode={isDarkMode}
          backendUrl={BACKEND_URL}
          onBack={resetToDashboard}
          onAddSoloXp={handleAddSoloXp}
          onCodingModeChange={setIsCodingMode}
        />
      )}

      {status === "command_center" && (
        <CommandCenter
          backendUrl={BACKEND_URL}
          onExit={() => {
            window.history.pushState({}, '', '/');
            resetToDashboard();
          }}
        />
      )}

      {showSurpassLimits && (
        <SurpassLimits 
          onClose={() => {
            setShowSurpassLimits(false);
            setIsExitIntercept(false);
            exitAttemptsRef.current = 0;
          }}
          trackIndex={isExitIntercept ? interceptTrackIdx : undefined}
          isExitIntercept={isExitIntercept}
          onForceExit={() => {
            setShowSurpassLimits(false);
            setIsExitIntercept(false);
            exitAttemptsRef.current = 1;
          }}
        />
      )}

      {showDailyModal && (
        <DailyLogin 
          day={journeyDay} 
          xp={xp}
          level={level}
          wins={wins}
          losses={losses}
          onClose={() => setShowDailyModal(false)} 
        />
      )}
      {/* Mobile Bottom Navigation Bar (YouTube style) */}
      {status === "idle" && !isCodingMode && (
        <div className="mobile-bottom-nav">
          <button 
            className={`bottom-nav-btn ${activeTab === "duels" ? "bottom-nav-btn-active" : ""}`}
            onClick={() => { sound.playClockTick(); setActiveTab("duels"); }}
          >
            <span className="bottom-nav-icon">🎮</span>
            <span className="bottom-nav-label">Arena</span>
          </button>
          <button 
            className={`bottom-nav-btn ${activeTab === "pathfinder" ? "bottom-nav-btn-active" : ""}`}
            onClick={() => { sound.playClockTick(); setActiveTab("pathfinder"); }}
          >
            <span className="bottom-nav-icon">🧠</span>
            <span className="bottom-nav-label">Pathfinder</span>
          </button>
          <button 
            className={`bottom-nav-btn ${activeTab === "chronos" ? "bottom-nav-btn-active" : ""}`}
            onClick={() => { sound.playClockTick(); setActiveTab("chronos"); }}
          >
            <span className="bottom-nav-icon">⏱️</span>
            <span className="bottom-nav-label">Chronos</span>
          </button>
          <button 
            className={`bottom-nav-btn ${activeTab === "history" ? "bottom-nav-btn-active" : ""}`}
            onClick={() => { sound.playClockTick(); setActiveTab("history"); }}
          >
            <span className="bottom-nav-icon">📖</span>
            <span className="bottom-nav-label">History</span>
          </button>
          <button 
            className={`bottom-nav-btn ${activeTab === "profile" ? "bottom-nav-btn-active" : ""}`}
            onClick={() => { sound.playClockTick(); setActiveTab("profile"); }}
          >
            <span className="bottom-nav-icon">👤</span>
            <span className="bottom-nav-label">You</span>
          </button>
        </div>
      )}
    </div>
  );
}

