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
import SurpassLimits from "./components/SurpassLimits";
import DailyLogin from "./components/DailyLogin";
import SoloStudyRoom from "./components/SoloStudyRoom";

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
  const [username, setUsername] = useState(() => localStorage.getItem("kaevrix_username") || "");
  const [avatar, setAvatar] = useState(() => localStorage.getItem("kaevrix_avatar") || DEFAULT_AVATAR);
  const [selectedClass, setSelectedClass] = useState(() => localStorage.getItem("kaevrix_class") || "doomscroller");
  const [isRegistered, setIsRegistered] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("kaevrix_theme") === "dark");
  const [token, setToken] = useState(() => localStorage.getItem("kaevrix_token") || "");
  const [isMusicMuted, setIsMusicMuted] = useState(() => localStorage.getItem("kaevrix_music_muted") === "true");
  const [musicProfile, setMusicProfile] = useState(() => Number(localStorage.getItem("kaevrix_music_profile")) || 0);
  const [keepMusicInGame, setKeepMusicInGame] = useState(() => localStorage.getItem("kaevrix_music_in_game") === "true");
  const [showMusicSettings, setShowMusicSettings] = useState(false);
  const [showSurpassLimits, setShowSurpassLimits] = useState(false);
  const [isExitIntercept, setIsExitIntercept] = useState(false);
  const [interceptTrackIdx, setInterceptTrackIdx] = useState(1);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [journeyDay, setJourneyDay] = useState(1);

  const exitAttemptsRef = useRef(0);

  const isDailyQuestComplete = () => {
    if (!username) return true;
    const saved = localStorage.getItem(`kaevrix_roadmap_progress_${username}`);
    if (!saved) return true;
    try {
      const roadmap = JSON.parse(saved);
      let activeLevel = null;
      let milestones = [];
      if (roadmap.level1?.milestones?.some(m => m.status !== "completed")) {
        activeLevel = "level1";
        milestones = roadmap.level1.milestones;
      } else if (roadmap.level2?.milestones?.some(m => m.status !== "completed")) {
        activeLevel = "level2";
        milestones = roadmap.level2.milestones;
      } else if (roadmap.level3?.milestones?.some(m => m.status !== "completed")) {
        activeLevel = "level3";
        milestones = roadmap.level3.milestones;
      } else {
        return true;
      }

      const targetIndex = Math.min(milestones.length - 1, Math.max(0, journeyDay - 1));
      const targetMilestone = milestones[targetIndex];
      return targetMilestone && targetMilestone.status === "completed";
    } catch (e) {
      console.error("Failed to parse roadmap logic:", e);
      return true;
    }
  };

  useEffect(() => {
    exitAttemptsRef.current = 0;
  }, [username, journeyDay]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isRegistered || !username || isDailyQuestComplete()) return;

      if (exitAttemptsRef.current === 0) {
        exitAttemptsRef.current = 1;
        setInterceptTrackIdx(Math.random() < 0.5 ? 1 : 3);
        setIsExitIntercept(true);
        setTimeout(() => {
          setShowSurpassLimits(true);
        }, 150);

        e.preventDefault();
        e.returnValue = "You have not completed your daily quest! Surpass your limits!";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isRegistered, username, journeyDay, showSurpassLimits]);

  useEffect(() => {
    const savedToken = localStorage.getItem("kaevrix_token");
    if (savedToken) {
      fetch(`${BACKEND_URL || ""}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: savedToken })
      })
      .then(res => {
        if (!res.ok) throw new Error("Invalid session");
        return res.json();
      })
      .then(data => {
        const { user } = data;
        setToken(savedToken);
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
      })
      .catch(err => {
        console.warn("[Auth] Session restore failed:", err.message);
        localStorage.removeItem("kaevrix_token");
        setToken("");
        setIsRegistered(false);
      });
    }
  }, []);

  const handleLogout = () => {
    sound.playClockTick();
    localStorage.removeItem("kaevrix_token");
    setToken("");
    setUsername("");
    setAvatar(DEFAULT_AVATAR);
    setSelectedClass("doomscroller");
    setXp(0);
    setLevel(1);
    setWins(0);
    setLosses(0);
    setIsRegistered(false);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

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
  const [selectedSoloVideo, setSelectedSoloVideo] = useState(null);
  const [vsBot, setVsBot] = useState(true); // Default to bot mode for easy local demo
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
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
      localStorage.setItem("kaevrix_theme", "dark");
      document.body.classList.add("dark-theme");
    } else {
      localStorage.setItem("kaevrix_theme", "light");
      document.body.classList.remove("dark-theme");
    }
  }, [isDarkMode]);

  // Global Procedural Background Music Player Effect
  useEffect(() => {
    const shouldPlay = !isMusicMuted && (!isRegistered || keepMusicInGame || status === "idle") && !showSurpassLimits;
    
    if (shouldPlay) {
      const startMusicOnInteraction = () => {
        sound.startBackgroundMusic(musicProfile);
        document.removeEventListener("click", startMusicOnInteraction);
        document.removeEventListener("keydown", startMusicOnInteraction);
      };
      
      document.addEventListener("click", startMusicOnInteraction);
      document.addEventListener("keydown", startMusicOnInteraction);
      
      sound.startBackgroundMusic(musicProfile);
      
      return () => {
        document.removeEventListener("click", startMusicOnInteraction);
        document.removeEventListener("keydown", startMusicOnInteraction);
        sound.stopBackgroundMusic();
      };
    } else {
      sound.stopBackgroundMusic();
    }
  }, [isMusicMuted, musicProfile, keepMusicInGame, isRegistered, status, showSurpassLimits]);

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
      localStorage.setItem("kaevrix_avatar", upgradeUrl);
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
    setActiveSearchQuery(query.trim());
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
    setActiveSearchQuery("");
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

    localStorage.setItem("kaevrix_username", name.trim());
    localStorage.setItem("kaevrix_avatar", av);
    localStorage.setItem("kaevrix_class", cls);
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
      setCountdown(5);
      setStatus("countdown");
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

  const [isWaitingForQuiz, setIsWaitingForQuiz] = useState(false);

  useEffect(() => {
    // If we're waiting for the quiz and the room updates with questions, transition to quiz
    if (isWaitingForQuiz && room && room.video && room.video.questions && !room.generatingQuiz) {
      setQuestions(room.video.questions);
      setSelectedAnswers(Array(room.video.questions.length).fill(null));
      setCurrentQuestionIdx(0);
      setQuizTimer(60);
      setStatus("quiz");
      setIsWaitingForQuiz(false);
    }
  }, [isWaitingForQuiz, room]);

  const handleVideoFinished = (fromClick = false) => {
    const progressAtEntry = fromClick ? myProgress : 100;
    setMyProgress(progressAtEntry);
    setProgressAtQuizEntry(progressAtEntry);
    
    if (socket) {
      socket.emit("video_progress", { progress: progressAtEntry });
      socket.emit("video_finished");
    }
    
    if (room && room.video && room.video.questions && !room.generatingQuiz) {
      setQuestions(room.video.questions);
      setSelectedAnswers(Array(room.video.questions.length).fill(null));
      setCurrentQuestionIdx(0);
      setQuizTimer(60);
      setStatus("quiz");
    } else {
      setIsWaitingForQuiz(true);
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

  const handleStartSoloStudy = (video) => {
    setSelectedSoloVideo(video);
    setStatus("solo_study");
  };

  const handleAddSoloXp = async (xpEarned, videoTitle) => {
    if (!username) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/solo-xp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, xpEarned, videoTitle })
      });
      if (res.ok) {
        const data = await res.json();
        setXp(data.xp);
        setLevel(data.level);
        if (data.leveledUp) {
          setLeveledUp(true);
        }
        // Force update leaderboard
        fetch(`${BACKEND_URL}/api/leaderboard`)
          .then((res) => res.json())
          .then((data) => setLeaderboard(data))
          .catch((err) => console.error("Error fetching leaderboard:", err));
      }
    } catch (err) {
      console.error("Error adding solo XP:", err);
    }
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
            ←
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
                  ✕
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
