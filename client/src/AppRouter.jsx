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

export default function AppRouter(props) {
  const { username, setUsername, avatar, setAvatar, selectedClass, setSelectedClass, isRegistered, setIsRegistered, xp, setXp, level, setLevel, wins, setWins, losses, setLosses, isDarkMode, setIsDarkMode, token, setToken, isMusicMuted, setIsMusicMuted, musicProfile, setMusicProfile, keepMusicInGame, setKeepMusicInGame, showMusicSettings, setShowMusicSettings, showSurpassLimits, setShowSurpassLimits, isExitIntercept, setIsExitIntercept, interceptTrackIdx, setInterceptTrackIdx, showDailyModal, setShowDailyModal, journeyDay, setJourneyDay, energy, setEnergy, isFrozen, setIsFrozen, isBlurred, setIsBlurred, progressAtQuizEntry, setProgressAtQuizEntry, doubleDownQuestions, setDoubleDownQuestions, disabledOptions, setDisabledOptions, leaderboard, setLeaderboard, curatedVideos, setCuratedVideos, selectedVideo, setSelectedVideo, selectedSoloVideo, setSelectedSoloVideo, vsBot, setVsBot, searchQuery, setSearchQuery, activeSearchQuery, setActiveSearchQuery, searchResults, setSearchResults, isSearching, setIsSearching, socket, setSocket, status, setStatus, room, setRoom, opponent, setOpponent, countdown, setCountdown, myProgress, setMyProgress, opponentProgress, setOpponentProgress, opponentWaiting, setOpponentWaiting, opponentSubmitted, setOpponentSubmitted, chatMessages, setChatMessages, chatInput, setChatInput, questions, setQuestions, currentQuestionIdx, setCurrentQuestionIdx, selectedAnswers, setSelectedAnswers, quizTimer, setQuizTimer, gameResults, setGameResults, xpGained, setXpGained, leveledUp, setLeveledUp, handleLogout, cancelMatchmaking, handleSearchSubmit, clearSearch, resetToDashboard, startMatchmaking, handleReadyToPlay, handleSendChat, handleVideoProgress, handleVideoFinished, handleUsePowerup, handleSelectOption, handleDoubleDown, handleHackersClue, submitQuizAnswers, handleNextQuestion, handleStartSoloStudy, handleAddSoloXp, exitAttemptsRef, BACKEND_URL, getRankTitle, triggerSearch, initializeSocketAndRegister } = props;

  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [isCodingMode, setIsCodingMode] = React.useState(false);
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

  // Header display
  const headerComponent = (
    <header className="app-header">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Back Arrow — only show when not on dashboard */}
        {status !== "idle" && (
          <button
            onClick={() => { sound.playClockTick(); resetToDashboard(); }}
            title="Back to Dashboard"
            style={{
              width: "38px", height: "38px",
              borderRadius: "10px",
              border: "1.5px solid var(--glass-border)",
              background: "var(--bg-dark-surface)",
              color: "var(--neon-orange)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: "700",
              transition: "all 0.2s",
              boxShadow: "0 2px 8px rgba(255,106,0,0.1)",
              flexShrink: 0,
            }}
            onMouseOver={e => { e.currentTarget.style.background = "#fff7ed"; e.currentTarget.style.transform = "translateX(-2px)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "var(--bg-dark-surface)"; e.currentTarget.style.transform = "none"; }}
          >
            ⬅️
          </button>
        )}
        <div className="logo-container" onClick={resetToDashboard} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.png" alt="Kaevrix Logo" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
          <span className="logo-text" style={{ fontSize: "24px" }}>Kaevrix</span>
        </div>
      </div>

      <div className="header-search-container" style={{ flex: 1, maxWidth: "600px", margin: "0 40px", display: "flex", alignItems: "center", gap: "15px" }}>
        <form 
          onSubmit={handleSearchSubmit} 
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
          <div style={{
            display: "flex",
            alignItems: "center",
            paddingLeft: "18px"
          }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
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
              flex: 1, 
              border: "none", 
              background: "transparent", 
              padding: "12px 14px", 
              fontSize: "15px", 
              outline: "none", 
              color: isDarkMode ? "#ffffff" : "#0f172a",
              fontFamily: "'Outfit', var(--font-sans)"
            }}
          />
          <button 
            type="submit" 
            style={{ 
              alignSelf: "stretch",
              padding: "0 28px", 
              background: isDarkMode ? "linear-gradient(135deg, #ff6a00, #ffb300)" : "linear-gradient(135deg, #ea580c, #f97316)", 
              border: "none", 
              clipPath: "polygon(12px 0, 100% 0, 100% 100%, 0 100%)",
              cursor: isSearching ? "not-allowed" : "pointer", 
              color: "#ffffff", 
              fontSize: "16px",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }} 
            disabled={isSearching}
          >
            {isSearching ? (
              <div className="search-dots-loader">
                <span className="search-dot" style={{ backgroundColor: "#ffffff" }}></span>
                <span className="search-dot" style={{ backgroundColor: "#ffffff" }}></span>
                <span className="search-dot" style={{ backgroundColor: "#ffffff" }}></span>
              </div>
            ) : (
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ transition: "transform 0.2s" }} 
                onMouseOver={e => e.currentTarget.style.transform = "scale(1.15)"} 
                onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
          </button>
        </form>
        <button 
          onClick={() => { sound.playClockTick(); setIsDarkMode(!isDarkMode); }}
          style={{ flexShrink: 0, width: "40px", height: "40px", borderRadius: "50%", background: isDarkMode ? "#1e293b" : "#fff", border: "1px solid var(--neon-orange)", color: "var(--neon-orange)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "18px", boxShadow: "0 2px 10px rgba(255,106,0,0.15)", transition: "all 0.3s ease" }}
          title="Toggle Dark Mode"
        >
          {isDarkMode ? "🌙" : "☀️"}
        </button>

        <div style={{ position: "relative", display: "flex", gap: "8px", alignItems: "center" }}>
          <button 
            onClick={() => { sound.playClockTick(); setIsMusicMuted(!isMusicMuted); localStorage.setItem("kaevrix_music_muted", String(!isMusicMuted)); }}
            style={{ flexShrink: 0, width: "40px", height: "40px", borderRadius: "50%", background: isDarkMode ? "#1e293b" : "#fff", border: "1px solid var(--neon-orange)", color: "var(--neon-orange)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "18px", boxShadow: "0 2px 10px rgba(255,106,0,0.15)", transition: "all 0.3s ease" }}
            title={isMusicMuted ? "Unmute Ambient Music" : "Mute Ambient Music"}
          >
            {isMusicMuted ? "🔇" : "🔊"}
          </button>
          
          <button 
            onClick={() => { sound.playClockTick(); setShowMusicSettings(!showMusicSettings); }}
            style={{ flexShrink: 0, width: "40px", height: "40px", borderRadius: "50%", background: isDarkMode ? "#1e293b" : "#fff", border: "1px solid var(--neon-orange)", color: "var(--neon-orange)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "18px", boxShadow: "0 2px 10px rgba(255,106,0,0.15)", transition: "all 0.3s ease" }}
            title="Soundscape Console"
          >
            🎵
          </button>

          {showMusicSettings && (
            <div style={{
              position: "absolute", top: "50px", right: 0, zIndex: 10000,
              width: "280px", background: isDarkMode ? "#1e293b" : "#ffffff",
              border: "1px solid var(--neon-orange)", borderRadius: "16px",
              padding: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              display: "flex", flexDirection: "column", gap: "12px",
              fontFamily: "var(--font-sans)",
              color: "var(--text-light)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "8px" }}>
                <span style={{ fontFamily: "var(--font-gamer)", fontSize: "12px", fontWeight: "900", color: "var(--neon-orange)", letterSpacing: "1px" }}>SOUNDSCAPE CONSOLE</span>
                <button 
                  onClick={() => { sound.playClockTick(); setShowMusicSettings(false); }}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "14px" }}
                >
                  ❌
                </button>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)", letterSpacing: "0.5px" }}>SELECT STATION:</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "150px", overflowY: "auto", paddingRight: "4px" }}>
                  {sound.MUSIC_PROFILES.map((p, idx) => {
                    const isActive = musicProfile === idx;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          sound.playClockTick();
                          setMusicProfile(idx);
                          localStorage.setItem("kaevrix_music_profile", String(idx));
                        }}
                        style={{
                          textAlign: "left", padding: "8px 12px", borderRadius: "8px",
                          background: isActive ? "var(--accent-gradient)" : "transparent",
                          border: `1px solid ${isActive ? "transparent" : "var(--glass-border)"}`,
                          color: isActive ? "#ffffff" : "var(--text-light)",
                          cursor: "pointer", fontSize: "12px", transition: "all 0.2s"
                        }}
                      >
                        <div style={{ fontWeight: "bold" }}>{p.name}</div>
                        <div style={{ fontSize: "10px", opacity: isActive ? 0.9 : 0.6, marginTop: "2px" }}>{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "8px", borderTop: "1px solid var(--glass-border)", paddingTop: "10px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="keepMusicInGame"
                  checked={keepMusicInGame}
                  onChange={(e) => {
                    sound.playClockTick();
                    const val = e.target.checked;
                    setKeepMusicInGame(val);
                    localStorage.setItem("kaevrix_music_in_game", String(val));
                  }}
                  style={{ cursor: "pointer", accentColor: "var(--neon-orange)" }}
                />
                <label htmlFor="keepMusicInGame" style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-light)", cursor: "pointer" }}>
                  Keep playing during matches
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Hell Mode Toggle Button */}
        <button
          onClick={() => {
            sound.playMatchFound();
            const nextHell = !hellMode;
            setHellMode(nextHell);
            localStorage.setItem("hellMode", String(nextHell));
          }}
          className={hellMode ? "hell-btn-active" : "hell-btn-inactive"}
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 18px",
            borderRadius: "22px",
            fontSize: "12px",
            fontWeight: "900",
            fontFamily: "var(--font-gamer)",
            letterSpacing: "2px",
            cursor: "pointer",
            outline: "none",
            height: "42px",
            transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
            alignSelf: "center",
            boxSizing: "border-box",
            position: "relative",
            overflow: "visible",
            zIndex: 2,
          }}
          title={hellMode ? "Hell Mode Active - Click to disable" : "Unleash Hell Mode"}
        >
          {hellMode && <div className="hell-aura" />}
          {hellMode && <div className="hell-sheen" />}
          {hellMode && (
            <div className="hell-sparks">
              <span/><span/><span/><span/><span/>
            </div>
          )}
          <span className="hell-text" style={{ position: "relative", zIndex: 5 }}>
            {hellMode ? "💀 HELL ACTIVE" : "🔥 HELL MODE"}
          </span>
        </button>

        <div className="header-profile" style={{ display: "flex", alignItems: "center", gap: "12px", background: isDarkMode ? "#1e293b" : "#ffffff", padding: "6px 16px 6px 6px", borderRadius: "30px", border: "1px solid var(--glass-border)", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
          <div className="profile-avatar" style={{ width: "36px", height: "36px", borderRadius: "50%", background: isDarkMode ? "#0f172a" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", border: "1px solid var(--glass-border)", overflow: "hidden" }}>
            {avatar && avatar.includes('http') ? <img src={avatar} alt="avatar" style={{width: "100%", height: "100%", objectFit: "cover"}}/> : avatar}
          </div>
          <div className="profile-info" style={{ display: "flex", flexDirection: "column" }}>
            <div className="profile-name" style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-light)" }}>{username}</div>
            <div className="profile-level-badge" style={{ fontSize: "11px", color: "var(--neon-orange)", fontWeight: "700" }}>
              LVL {level} <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>({xp % 200}/200)</span>
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          style={{
            flexShrink: 0,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1.5px solid rgba(239, 68, 68, 0.2)",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            transition: "all 0.2s",
          }}
          onMouseOver={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }}
          onMouseOut={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)"; e.currentTarget.style.color = "#ef4444"; }}
        >
          🚪
        </button>
      </div>
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
      {(!isCodingMode || status !== "solo_study") && headerComponent}

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
    </div>
  );
}

