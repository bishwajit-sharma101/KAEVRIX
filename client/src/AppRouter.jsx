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
        {/* Back Arrow ΓÇö only show when not on dashboard */}
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
        <form onSubmit={handleSearchSubmit} className="header-search-form" style={{ display: "flex", flex: 1, background: "#f1f5f9", borderRadius: "24px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}>
          <input
            type="text"
            placeholder="Search YouTube videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: "none", background: "transparent", padding: "12px 20px", fontSize: "15px", outline: "none", color: "var(--text-light)" }}
          />
          <button type="submit" style={{ padding: "0 24px", background: "#f8fafc", border: "none", borderLeft: "1px solid #e2e8f0", cursor: "pointer", color: "var(--text-muted)", fontSize: "16px" }} disabled={isSearching}>
            {isSearching ? "..." : "🔍"}
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
  return (
    <div className="app-container">
      {headerComponent}

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

