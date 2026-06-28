"use client";

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import * as sound from "./utils/audio";
import AppRouter from "./AppRouter";
import GlobalSplashScreen from "./features/Shared/GlobalSplashScreen";
import { trackTelemetry } from "./utils/telemetry";

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
  const [isAppReady, setIsAppReady] = useState(false);
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

  // Handle verify & restore logic
  const handleAuthRestore = (user, userToken) => {
    setToken(userToken);
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
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("kaevrix_token");
    if (!savedToken) return;

    const restoreSession = async (accessToken) => {
      const res = await fetch(`${BACKEND_URL || ""}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessToken })
      });
      if (!res.ok) throw new Error("Verification failed");
      return res.json();
    };

    restoreSession(savedToken)
      .then(data => {
        handleAuthRestore(data.user, savedToken);
      })
      .catch(async (err) => {
        console.warn("[Auth] Access token invalid, attempting silent refresh...", err.message);
        try {
          const refreshRes = await fetch(`${BACKEND_URL || ""}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
          });
          if (!refreshRes.ok) throw new Error("Session expired");
          const refreshData = await refreshRes.json();
          localStorage.setItem("kaevrix_token", refreshData.token);
          
          const verifyData = await restoreSession(refreshData.token);
          handleAuthRestore(verifyData.user, refreshData.token);
          console.log("[Auth] Session restored successfully via refresh token.");
        } catch (refreshErr) {
          console.warn("[Auth] Session restore failed:", refreshErr.message);
          localStorage.removeItem("kaevrix_token");
          setToken("");
          setIsRegistered(false);
        }
      });
  }, []);

  // Background token refresh loop
  useEffect(() => {
    if (!token || !isRegistered) return;
    
    // Refresh access token every 10 minutes (expires in 15m)
    const interval = setInterval(() => {
      console.log("[Auth] Performing background access token refresh...");
      fetch(`${BACKEND_URL || ""}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      })
      .then(res => {
        if (!res.ok) throw new Error("Silent refresh failed");
        return res.json();
      })
      .then(data => {
        localStorage.setItem("kaevrix_token", data.token);
        setToken(data.token);
        console.log("[Auth] Silent access token refresh success.");
      })
      .catch(err => {
        console.warn("[Auth] Silent refresh failed:", err.message);
      });
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token, isRegistered]);

  const handleLogout = () => {
    sound.playClockTick();
    
    // Clear cookies on backend
    fetch(`${BACKEND_URL || ""}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    }).catch(err => console.warn("Logout request failed:", err));

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

  // Global Error Tracking
  useEffect(() => {
    const handleWindowError = (event) => {
      trackTelemetry({
        eventType: "CLIENT_ERROR",
        metadata: {
          message: event.message,
          source: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      });
    };

    const handleUnhandledRejection = (event) => {
      trackTelemetry({
        eventType: "CLIENT_ERROR",
        metadata: {
          message: event.reason?.message || "Unhandled Promise Rejection",
          stack: event.reason?.stack
        }
      });
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  // PAGE_VIEW and PAGE_EXIT tracking based on status changes
  useEffect(() => {
    // Record page view on transition
    trackTelemetry({
      eventType: "PAGE_VIEW",
      pagePath: `/${status === "idle" ? "dashboard" : status}`
    });

    const startTime = Date.now();
    return () => {
      // Record page exit duration
      trackTelemetry({
        eventType: "PAGE_EXIT",
        pagePath: `/${status === "idle" ? "dashboard" : status}`,
        durationMs: Date.now() - startTime
      });
    };
  }, [status]);

  // Fetch lists on load
  useEffect(() => {
    if (window.location.pathname === "/command-center") {
      setStatus("command_center");
    }

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

  const submitQuizAnswers = () => {
    if (!socket) return;
    const finalAnswers = selectedAnswers.map((ans) => (ans === null ? -1 : ans));
    socket.emit("submit_answers", { 
      answers: finalAnswers, 
      watchProgress: progressAtQuizEntry,
      doubleDowns: doubleDownQuestions
    });
  };

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
      const response = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(query.trim())}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}` }
      });
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
      // Register presence globally
      newSocket.emit("user_login", name.trim());
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
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("kaevrix_token") || token}`
        },
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

  const appProps = { username, setUsername, avatar, setAvatar, selectedClass, setSelectedClass, isRegistered, setIsRegistered, xp, setXp, level, setLevel, wins, setWins, losses, setLosses, isDarkMode, setIsDarkMode, token, setToken, isMusicMuted, setIsMusicMuted, musicProfile, setMusicProfile, keepMusicInGame, setKeepMusicInGame, showMusicSettings, setShowMusicSettings, showSurpassLimits, setShowSurpassLimits, isExitIntercept, setIsExitIntercept, interceptTrackIdx, setInterceptTrackIdx, showDailyModal, setShowDailyModal, journeyDay, setJourneyDay, energy, setEnergy, isFrozen, setIsFrozen, isBlurred, setIsBlurred, progressAtQuizEntry, setProgressAtQuizEntry, doubleDownQuestions, setDoubleDownQuestions, disabledOptions, setDisabledOptions, leaderboard, setLeaderboard, curatedVideos, setCuratedVideos, selectedVideo, setSelectedVideo, selectedSoloVideo, setSelectedSoloVideo, vsBot, setVsBot, searchQuery, setSearchQuery, activeSearchQuery, setActiveSearchQuery, searchResults, setSearchResults, isSearching, setIsSearching, socket, setSocket, status, setStatus, room, setRoom, opponent, setOpponent, countdown, setCountdown, myProgress, setMyProgress, opponentProgress, setOpponentProgress, opponentWaiting, setOpponentWaiting, opponentSubmitted, setOpponentSubmitted, chatMessages, setChatMessages, chatInput, setChatInput, questions, setQuestions, currentQuestionIdx, setCurrentQuestionIdx, selectedAnswers, setSelectedAnswers, quizTimer, setQuizTimer, gameResults, setGameResults, xpGained, setXpGained, leveledUp, setLeveledUp, handleLogout, cancelMatchmaking, handleSearchSubmit, clearSearch, resetToDashboard, startMatchmaking, handleReadyToPlay, handleSendChat, handleVideoProgress, handleVideoFinished, handleUsePowerup, handleSelectOption, handleDoubleDown, handleHackersClue, submitQuizAnswers, handleNextQuestion, handleStartSoloStudy, handleAddSoloXp, exitAttemptsRef, BACKEND_URL, getRankTitle, triggerSearch, initializeSocketAndRegister };
  return (
    <>
      {!isAppReady && (
        <GlobalSplashScreen onComplete={() => setIsAppReady(true)} />
      )}
      <div className="bg-mesh-container">
        <div className="bg-aurora-blob bg-aurora-primary"></div>
        <div className="bg-aurora-blob bg-aurora-secondary"></div>
        <div className="bg-aurora-blob bg-aurora-accent"></div>
        <div className="bg-noise"></div>
      </div>
      <AppRouter {...appProps} />
    </>
  );
}
