import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import * as sound from "./utils/audio";

// Modular Component Imports
import WelcomeScreen from "./components/WelcomeScreen";
import Dashboard from "./components/Dashboard";
import Matchmaking from "./components/Matchmaking";
import Lobby from "./components/Lobby";
import Countdown from "./components/Countdown";
import GameArena from "./components/GameArena";
import QuizPanel from "./components/QuizPanel";
import ResultsPanel from "./components/ResultsPanel";

const BACKEND_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/bottts/svg?seed=Cypher&backgroundColor=transparent";

const getRankTitle = (level) => {
  if (level <= 2) return "Binge Cadet";
  if (level <= 4) return "Observant Watcher";
  if (level <= 6) return "Video Inspector";
  if (level <= 9) return "Turing Scholar";
  return "Grandmaster Spectator";
};

export default function App() {
  // Authentication / Profile
  const [username, setUsername] = useState(() => localStorage.getItem("ytplay_username") || "");
  const [avatar, setAvatar] = useState(() => localStorage.getItem("ytplay_avatar") || DEFAULT_AVATAR);
  const [selectedClass, setSelectedClass] = useState(() => localStorage.getItem("ytplay_class") || "doomscroller");
  const [isRegistered, setIsRegistered] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("ytplay_theme") === "dark");

  // Powerups / V2 state
  const [energy, setEnergy] = useState(0);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const [progressAtQuizEntry, setProgressAtQuizEntry] = useState(100);
  const [doubleDownQuestions, setDoubleDownQuestions] = useState(Array(5).fill(false));
  const [disabledOptions, setDisabledOptions] = useState(Array(5).fill([]));

  // Lists from backend
  const [leaderboard, setLeaderboard] = useState([]);
  const [curatedVideos, setCuratedVideos] = useState([]);

  // Matchmaking choices
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [vsBot, setVsBot] = useState(true); // Default to bot mode for easy local demo
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Socket & Game Connection
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, searching, matched, countdown, playing, quiz, results
  const [room, setRoom] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [countdown, setCountdown] = useState(5);

  // Playback Progress
  const [myProgress, setMyProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [opponentWaiting, setOpponentWaiting] = useState(false);
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState(Array(5).fill(null));
  const [quizTimer, setQuizTimer] = useState(60); // 60 seconds total for quiz

  // Game End Results
  const [gameResults, setGameResults] = useState(null);
  const [xpGained, setXpGained] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);

  // V2 Watch Energy Accrual
  useEffect(() => {
    let interval = null;
    if (status === "playing") {
      interval = setInterval(() => {
        if (!isFrozen) {
          setEnergy((prev) => Math.min(100, prev + 2));
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, isFrozen]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("ytplay_theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("ytplay_theme", "light");
    }
  }, [isDarkMode]);

  // Fetch lists on load
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/leaderboard`)
      .then((res) => res.json())
      .then((data) => setLeaderboard(data))
      .catch((err) => console.error("Error fetching leaderboard:", err));

    fetch(`${BACKEND_URL}/api/curated-videos`)
      .then((res) => res.json())
      .then((data) => {
        setCuratedVideos(data);
        if (data.length > 0) {
          setSelectedVideo(data[0]);
        }
      })
      .catch((err) => console.error("Error fetching curated videos:", err));
  }, []);

  // Update profile from local storage if existing
  useEffect(() => {
    if (username) {
      const localUser = leaderboard.find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (localUser) {
        setXp(localUser.xp);
        setLevel(localUser.level);
        setWins(localUser.wins);
        setLosses(localUser.losses);
      }
    }
  }, [leaderboard, username]);

  useEffect(() => {
    // If the user has a legacy emoji avatar, forcefully upgrade them to a cool DiceBear avatar
    if (avatar && !avatar.includes('http')) {
      const upgradeUrl = "https://api.dicebear.com/7.x/bottts/svg?seed=Cypher&backgroundColor=transparent";
      setAvatar(upgradeUrl);
      localStorage.setItem("ytplay_avatar", upgradeUrl);
    }
  }, [avatar]);

  // Quiz Countdown Timer
  useEffect(() => {
    let interval = null;
    if (status === "quiz" && quizTimer > 0) {
      interval = setInterval(() => {
        setQuizTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            submitQuizAnswers();
            return 0;
          }
          sound.playClockTick(prev <= 16);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, selectedAnswers, progressAtQuizEntry, doubleDownQuestions]);
  // Global Search
  const triggerSearch = async (query) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setSearchResults(data);
        if (data.length > 0) {
          setSelectedVideo(data[0]);
        }
      }
    } catch (err) {
      console.error("Error searching YouTube:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    sound.playClockTick();
    await triggerSearch(searchQuery);
  };

  const clearSearch = () => {
    sound.playClockTick();
    setSearchQuery("");
    setSearchResults([]);
    if (curatedVideos.length > 0) {
      setSelectedVideo(curatedVideos[0]);
    }
  };

  // Connect socket and register player
  const initializeSocketAndRegister = (name, av, cls) => {
    if (!name || !name.trim()) return;

    setUsername(name);
    setAvatar(av);
    setSelectedClass(cls);

    localStorage.setItem("ytplay_username", name.trim());
    localStorage.setItem("ytplay_avatar", av);
    localStorage.setItem("ytplay_class", cls);
    setIsRegistered(true);

    const newSocket = io(BACKEND_URL || undefined);
    setSocket(newSocket);

    // Setup socket listeners
    newSocket.on("connect", () => {
      console.log("[Socket] Connected to backend");
    });

    newSocket.on("match_found", ({ roomId, room }) => {
      console.log("[Socket] Match found! Room:", roomId);
      setRoom(room);
      const opp = room.players.find((p) => p.username.toLowerCase() !== name.toLowerCase());
      setOpponent(opp);
      setChatMessages([]);
      setStatus("matched");
      sound.playMatchFound();
    });

    newSocket.on("countdown_tick", ({ count }) => {
      setStatus("countdown");
      setCountdown(count);
      sound.playCountdownBeep(count);
    });

    newSocket.on("game_play", () => {
      setStatus("playing");
      setMyProgress(0);
      setOpponentProgress(0);
      setOpponentWaiting(false);
      setOpponentSubmitted(false);
      setEnergy(0);
      // Note: watch hum sound intentionally removed
    });

    newSocket.on("opponent_powerup", ({ type }) => {
      if (type === "freeze") {
        setIsFrozen(true);
        sound.playGlitch();
        setTimeout(() => {
          setIsFrozen(false);
        }, 3000);
      } else if (type === "blur") {
        setIsBlurred(true);
        sound.playWhoosh();
        setTimeout(() => {
          setIsBlurred(false);
        }, 5000);
      }
    });

    newSocket.on("room_update", (updatedRoom) => {
      setRoom(updatedRoom);
      const opp = updatedRoom.players.find((p) => p.username.toLowerCase() !== name.toLowerCase());
      setOpponent(opp);
    });

    newSocket.on("opponent_progress", ({ progress }) => {
      setOpponentProgress(progress);
    });

    newSocket.on("opponent_waiting_quiz", ({ username }) => {
      setOpponentWaiting(true);
      addSystemMessage(`${username} finished watching the video!`);
    });

    newSocket.on("opponent_submitted", ({ username }) => {
      setOpponentSubmitted(true);
      addSystemMessage(`${username} submitted their quiz!`);
    });

    newSocket.on("receive_message", (message) => {
      setChatMessages((prev) => [...prev, message]);
    });

    newSocket.on("game_over", ({ results, room: finalRoom, leaderboard: newLeaderboard }) => {
      setGameResults(results);
      setLeaderboard(newLeaderboard);
      setStatus("results");

      if (results.draw) {
        sound.playVictory();
      } else if (results.winner && results.winner.username === username) {
        sound.playVictory();
      } else {
        sound.playDefeat();
      }

      const me = finalRoom.players.find((p) => p.username === username);
      if (me) {
        setXpGained(me.xpGained);
        setLeveledUp(me.leveledUp);
        setXp(me.totalXp);
        setLevel(me.level);
      }
    });

    newSocket.on("opponent_left", ({ message }) => {
      alert(message);
      resetToDashboard();
    });
  };

  const addSystemMessage = (text) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        sender: "SYSTEM",
        message: text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  // Matchmaking controls
  const startMatchmaking = () => {
    if (!socket || !selectedVideo) return;
    setStatus("searching");
    socket.emit("join_queue", {
      username,
      avatar,
      selectedClass,
      videoId: selectedVideo.id,
      videoTitle: selectedVideo.title,
      videoChannel: selectedVideo.channel,
      videoDuration: selectedVideo.duration,
      videoThumbnail: selectedVideo.thumbnail,
      vsBot
    });
  };

  const cancelMatchmaking = () => {
    if (!socket) return;
    socket.emit("leave_queue");
    setStatus("idle");
  };

  const handleReadyToPlay = () => {
    if (!socket) return;
    socket.emit("player_ready");
  };

  const handleVideoProgress = (progress) => {
    setMyProgress(progress);
    if (socket) {
      socket.emit("video_progress", { progress });
    }
  };

  const handleVideoFinished = (fromClick = false) => {
    const progressAtEntry = fromClick ? myProgress : 100;
    setMyProgress(progressAtEntry);
    setProgressAtQuizEntry(progressAtEntry);
    
    if (socket) {
      socket.emit("video_progress", { progress: progressAtEntry });
      socket.emit("video_finished");
    }
    
    if (room && room.video && room.video.questions) {
      setQuestions(room.video.questions);
      setSelectedAnswers(Array(room.video.questions.length).fill(null));
      setCurrentQuestionIdx(0);
      setQuizTimer(60);
      setStatus("quiz");
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    socket.emit("send_message", { message: chatInput.trim() });
    setChatInput("");
  };

  const handleSelectOption = (optIdx) => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[currentQuestionIdx] = optIdx;
      return next;
    });
  };

  const handleNextQuestion = () => {
    const currentQuestion = questions[currentQuestionIdx];
    const userAns = selectedAnswers[currentQuestionIdx];
    if (currentQuestion && userAns !== null) {
      if (userAns === currentQuestion.answerIndex) {
        sound.playCorrect();
      } else {
        sound.playIncorrect();
      }
    }

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      submitQuizAnswers();
    }
  };

  const submitQuizAnswers = () => {
    if (!socket) return;
    const finalAnswers = selectedAnswers.map((ans) => (ans === null ? -1 : ans));
    socket.emit("submit_answers", { 
      answers: finalAnswers, 
      watchProgress: progressAtQuizEntry,
      doubleDowns: doubleDownQuestions
    });
  };

  const handleUsePowerup = ({ type, cost }) => {
    if (!socket) return;
    if (energy < cost) return;
    setEnergy((prev) => prev - cost);
    socket.emit("use_powerup", { type });
  };

  const handleDoubleDown = () => {
    const isAlreadyActive = doubleDownQuestions[currentQuestionIdx];
    if (isAlreadyActive) {
      setDoubleDownQuestions((prev) => {
        const next = [...prev];
        next[currentQuestionIdx] = false;
        return next;
      });
      setEnergy((prev) => Math.min(100, prev + 30));
    } else {
      if (energy < 30) return;
      setDoubleDownQuestions((prev) => {
        const next = [...prev];
        next[currentQuestionIdx] = true;
        return next;
      });
      setEnergy((prev) => prev - 30);
    }
  };

  const handleHackersClue = () => {
    if (energy < 60) return;
    const currentQuestion = questions[currentQuestionIdx];
    if (!currentQuestion) return;
    
    const correctIdx = currentQuestion.answerIndex;
    const incorrectIndices = [0, 1, 2, 3].filter((idx) => idx !== correctIdx);
    
    const shuffled = incorrectIndices.sort(() => 0.5 - Math.random());
    const disabled = shuffled.slice(0, 2);

    setDisabledOptions((prev) => {
      const next = [...prev];
      next[currentQuestionIdx] = disabled;
      return next;
    });
    setEnergy((prev) => prev - 60);
  };

  const resetToDashboard = () => {
    setStatus("idle");
    setRoom(null);
    setOpponent(null);
    setGameResults(null);
    setChatMessages([]);
    setChatInput("");
    setIsFrozen(false);
    setIsBlurred(false);
    setEnergy(0);
    setProgressAtQuizEntry(100);
    setDoubleDownQuestions(Array(5).fill(false));
    setDisabledOptions(Array(5).fill([]));
  };

  // 1. Initial Login Setup Overlay
  if (!isRegistered) {
    return (
      <WelcomeScreen
        username={username}
        setUsername={setUsername}
        avatar={avatar}
        setAvatar={setAvatar}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onRegister={(name, av, cls) => {
          initializeSocketAndRegister(name, av, cls);
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
            ←
          </button>
        )}
        <div className="logo-container" onClick={resetToDashboard} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.png" alt="ytPlay Logo" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
          <span className="logo-text" style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-light)" }}>ytPlay</span>
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
      </div>

      <div className="header-profile" style={{ display: "flex", alignItems: "center", gap: "12px", background: "#ffffff", padding: "6px 16px 6px 6px", borderRadius: "30px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
        <div className="profile-avatar" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {avatar && avatar.includes('http') ? <img src={avatar} alt="avatar" style={{width: "100%", height: "100%", objectFit: "cover"}}/> : avatar}
        </div>
        <div className="profile-info" style={{ display: "flex", flexDirection: "column" }}>
          <div className="profile-name" style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-light)" }}>{username}</div>
          <div className="profile-level-badge" style={{ fontSize: "11px", color: "var(--neon-orange)", fontWeight: "700" }}>
            LVL {level} <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>({xp % 200}/200)</span>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <div className="app-container">
      {headerComponent}

      {/* 2. DASHBOARD OR GAME STATES */}
      {status === "idle" && (
        <Dashboard
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
          searchQuery={searchQuery}
          searchResults={searchResults}
          onSearch={(query) => { setSearchQuery(query); triggerSearch(query); }}
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
    </div>
  );
}
