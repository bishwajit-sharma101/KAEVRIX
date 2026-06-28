import { useState, useEffect, useRef } from "react";
import * as sound from "../../utils/audio";
import CognitivePathfinder from "../Roadmap/CognitivePathfinder";
import ProfilePanel from "./ProfilePanel";
import CommunityTab from "../Community/CommunityTab";
import CanvasRuneLoader from "../Shared/CanvasRuneLoader";
import PathfinderScheduler from "../Roadmap/PathfinderScheduler";
import StudyHistory from "./StudyHistory";

const TRENDING_TOPICS = [
  { icon: "⚡", label: "JavaScript", color: "#f59e0b", players: 1420 },
  { icon: "🐍", label: "Python", color: "#10b981", players: 983 },
  { icon: "🤖", label: "Machine Learning", color: "#8b5cf6", players: 756 },
  { icon: "🛠️", label: "System Design", color: "#3b82f6", players: 621 },
  { icon: "🧮", label: "Algorithms", color: "#ef4444", players: 549 },
  { icon: "🌐", label: "Web Dev", color: "#ff6a00", players: 498 },
];

const getCategoryStyle = (category) => {
  switch (category) {
    case "Core Tutorial":
      return { color: "#4338ca", bg: "#e0e7ff" };
    case "Interview Prep":
      return { color: "#065f46", bg: "#d1fae5" };
    case "Pro Tips":
      return { color: "#92400e", bg: "#fef3c7" };
    case "Shortcuts & Cheat Sheets":
      return { color: "#06b6d4", bg: "rgba(6,182,212,0.1)" };
    case "Hacks & Tricks":
      return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
    case "Conceptual Deep Dives":
      return { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" };
    default:
      return { color: "#ea580c", bg: "rgba(234,88,12,0.1)" };
  }
};


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
  onStartSoloStudy,
  setStatus,
  socket,
  isDrawerOpen,
  setIsDrawerOpen,
  setIsDarkMode,
  isMusicMuted,
  setIsMusicMuted,
  musicProfile,
  setMusicProfile,
  activeTab,
  setActiveTab,
  handleLogout,
  showSchedulerSettings,
  setShowSchedulerSettings,
  showSystemSettings,
  setShowSystemSettings
}) {
  const [isRobotHovered, setIsRobotHovered] = useState(false);
  const [personalizedFeed, setPersonalizedFeed] = useState([]);
  const [showDrawerSettings, setShowDrawerSettings] = useState(false);
  const [showTodoPopup, setShowTodoPopup] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [activeMilestones, setActiveMilestones] = useState([]);
  const [todayVideos, setTodayVideos] = useState([]);
  const [loadingToday, setLoadingToday] = useState(false);

  const [showRuneLoader, setShowRuneLoader] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  const activeLoading = isSearching || loadingFeed || loadingToday;

  useEffect(() => {
    if (activeLoading) {
      setShowRuneLoader(true);
      setIsExploding(false);
    } else if (showRuneLoader && !isExploding) {
      setIsExploding(true);
    }
  }, [activeLoading, showRuneLoader, isExploding]);

  const handleExplodeComplete = () => {
    setShowRuneLoader(false);
    setIsExploding(false);
  };

  useEffect(() => {
    if (!username) return;
    const saved = localStorage.getItem(`kaevrix_roadmap_progress_${username}`);
    if (saved) {
      try {
        const roadmap = JSON.parse(saved);
        let milestones = [];
        if (roadmap.level1?.milestones?.some(m => m.status !== "completed")) {
          milestones = roadmap.level1.milestones;
        } else if (roadmap.level2?.milestones?.some(m => m.status !== "completed")) {
          milestones = roadmap.level2.milestones;
        } else if (roadmap.level3?.milestones?.some(m => m.status !== "completed")) {
          milestones = roadmap.level3.milestones;
        } else {
          milestones = roadmap.level3?.milestones || [];
        }
        
        // Only show completed and currently unlocked milestones, hide future locked ones
        milestones = milestones.filter(m => m.status !== "locked");
        
        setActiveMilestones(milestones);
      } catch (e) {
        console.error("Failed to parse roadmap logic in Dashboard:", e);
      }
    }
  }, [username, activeTab]);

  const selectedVideoRef = useRef(selectedVideo);
  useEffect(() => {
    selectedVideoRef.current = selectedVideo;
  }, [selectedVideo]);

  // Load topic from actual AI-generated roadmap (avoids pasting user's raw prompt)
  const roadmapKey = `kaevrix_roadmap_progress_${username}`;
  const savedRoadmapStr = localStorage.getItem(roadmapKey);
  const savedRoadmap = savedRoadmapStr ? JSON.parse(savedRoadmapStr) : null;
  
  // Load answers just as a fallback if no roadmap exists
  const answersKey = `kaevrix_roadmap_answers_${username}`;
  const savedAnswers = localStorage.getItem(answersKey);
  const answers = savedAnswers ? JSON.parse(savedAnswers) : null;
  
  const truncateText = (text, maxLength = 45) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    // Attempt to slice cleanly
    return text.substring(0, maxLength).trim() + "...";
  };

  let rawTopic = savedRoadmap?.topic || (answers && answers[0] ? answers[0].answer : "");
  if (rawTopic.length > 35) {
    // Extract a small relatable title (first 3-4 words) from the massive prompt
    const words = rawTopic.split(/\s+/);
    rawTopic = words.length > 3 ? words.slice(0, 4).join(" ") : rawTopic.substring(0, 30);
  }
  const topic = truncateText(rawTopic);
  const why = truncateText(savedRoadmap?.goal || (answers && answers[1] ? answers[1].answer : ""), 80);

  // Calculate schedule parameters for the quest tracker sidebar
  const getTodayDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const todayDateStr = getTodayDateString();

  const savedSchedule = localStorage.getItem(`kaevrix_roadmap_schedule_${username}`);
  const schedule = savedSchedule ? JSON.parse(savedSchedule) : null;
  const savedTodayProgress = localStorage.getItem(`kaevrix_today_progress_${username}`);
  const todayProgress = savedTodayProgress ? JSON.parse(savedTodayProgress) : null;

  let dailyTarget = 0;
  let completedToday = 0;
  let remainingTodayTarget = 0;
  let velocityStatus = "TRACK";
  let streak = 0;
  let todaysTasks = [];
  let activePendingTasks = [];
  let nextLimitBreakTask = null;
  let completedTodayTasks = [];
  let allIncompleteTasks = [];
  let baselineTarget = 1;
  let quotaDescription = "";

  if (schedule && savedRoadmap) {
    let totalSubtopics = 0;
    let completedSubtopics = 0;
    const allLevels = ["level1", "level2", "level3"];
    
    for (const lk of allLevels) {
      const ms = savedRoadmap[lk]?.milestones || [];
      for (const m of ms) {
        if (m.isEncrypted || !m.keyPoints || m.keyPoints.length === 0) {
          totalSubtopics += 4;
          if (m.status === "completed") completedSubtopics += 4;
        } else {
          totalSubtopics += m.keyPoints.length;
          if (m.status === "completed") {
            completedSubtopics += m.keyPoints.length;
          } else if (m.status === "locked") {
            completedSubtopics += 0;
          } else {
            completedSubtopics += (m.subtopicIndex || 0);
          }
        }
      }
    }

    const elapsedDays = Math.max(0, Math.floor((new Date(todayDateStr) - new Date(schedule.startDate)) / (1000 * 60 * 60 * 24)) + schedule.missedDaysOffset);
    const remainingDays = Math.max(1, schedule.durationDays - elapsedDays);
    
    completedToday = (todayProgress && todayProgress.date === todayDateStr) ? todayProgress.completedToday : 0;
    const completedBeforeToday = Math.max(0, completedSubtopics - completedToday);
    const remainingSubtopicsStartOfToday = Math.max(0, totalSubtopics - completedBeforeToday);
    
    dailyTarget = remainingSubtopicsStartOfToday > 0 ? Math.ceil(remainingSubtopicsStartOfToday / remainingDays) : 0;
    remainingTodayTarget = Math.max(0, dailyTarget - completedToday);
    streak = schedule.streak;

    const targetSubtopicsSoFar = Math.round(totalSubtopics * (elapsedDays / schedule.durationDays));
    if (completedSubtopics > targetSubtopicsSoFar) {
      velocityStatus = "AHEAD";
    } else if (completedSubtopics < targetSubtopicsSoFar) {
      velocityStatus = "BEHIND";
    } else {
      velocityStatus = "TRACK";
    }

    baselineTarget = Math.ceil(totalSubtopics / schedule.durationDays) || 1;
    quotaDescription = `Quota: Baseline of ${baselineTarget}/day is sufficient.`;
    if (dailyTarget > baselineTarget) {
      quotaDescription = `⚠️ Quota increased from ${baselineTarget}/day to catch up.`;
    } else if (dailyTarget < baselineTarget) {
      quotaDescription = `🍀 Quota decreased from ${baselineTarget}/day!`;
    }

    // Get flat list of next incomplete subtopics
    const list = [];
    for (const lk of allLevels) {
      const ms = savedRoadmap[lk]?.milestones || [];
      for (const m of ms) {
        if (m.status === "completed") continue;
        if (m.isEncrypted) {
          list.push({
            milestone: m,
            subtopicIndex: 0,
            text: "Decrypt next tier in Pathfinder",
            isEncrypted: true
          });
          continue;
        }
        const startIdx = m.status === "locked" ? 0 : (m.subtopicIndex || 0);
        const keyPoints = m.keyPoints || [];
        for (let i = startIdx; i < keyPoints.length; i++) {
          list.push({
            milestone: m,
            subtopicIndex: i,
            text: keyPoints[i],
            isEncrypted: false
          });
        }
      }
    }
    todaysTasks = list.slice(0, Math.max(2, dailyTarget));
    activePendingTasks = todaysTasks.slice(completedToday);
    nextLimitBreakTask = list.length > 0 ? list[0] : null;
    allIncompleteTasks = list;

    // Get flat list of completed subtopics to extract completed today tasks
    const completedList = [];
    for (const lk of allLevels) {
      const ms = savedRoadmap[lk]?.milestones || [];
      for (const m of ms) {
        if (m.isEncrypted) continue;
        const keyPoints = m.keyPoints || [];
        const completedCount = m.status === "completed" 
          ? keyPoints.length 
          : (m.status === "unlocked" || m.status === "revision" ? (m.subtopicIndex || 0) : 0);
        
        for (let i = 0; i < completedCount; i++) {
          completedList.push({
            milestone: m,
            text: keyPoints[i]
          });
        }
      }
    }
    completedTodayTasks = completedList.slice(-completedToday);
  }

  const cleanMilestoneTitle = (title) => {
    if (!title) return "";
    const rawAns = answers && answers[0] ? answers[0].answer : "";
    let cleaned = title;
    if (rawAns && rawAns.length > 20 && cleaned.includes(rawAns)) {
      cleaned = cleaned.replace(rawAns, "Module:").trim();
    }
    // If it's still weirdly long, just return the last 30 characters (which usually contains the actual subject like "Orientation") or clamp it.
    if (cleaned.length > 45) {
      const words = cleaned.split(" ");
      if (words.length > 4) {
        cleaned = "..." + words.slice(-4).join(" ");
      } else {
        cleaned = cleaned.substring(0, 45) + "...";
      }
    }
    return cleaned;
  };

  // Get active subtopic from roadmap progression
  const getActiveSubtopic = () => {
    if (!activeMilestones || activeMilestones.length === 0) return null;
    const activeMilestone = activeMilestones.find(m => m.status === "unlocked") || activeMilestones.find(m => m.status !== "completed");
    if (!activeMilestone || activeMilestone.status === "completed") return null;
    
    const subtopicIdx = activeMilestone.subtopicIndex || 0;
    const keyPoints = activeMilestone.keyPoints || [];
    if (subtopicIdx < keyPoints.length) {
      return {
        milestoneTitle: activeMilestone.title,
        subtopic: keyPoints[subtopicIdx]
      };
    }
    return null;
  };

  const activeSubtopicObj = getActiveSubtopic();
  const activeSubtopicStr = activeSubtopicObj ? activeSubtopicObj.subtopic : "";

  // Fetch Recommended for Today videos
  useEffect(() => {
    if (!topic || !activeSubtopicStr || searchQuery) {
      setTodayVideos([]);
      return;
    }

    let isMounted = true;
    const fetchTodayVideos = async () => {
      setLoadingToday(true);
      const query = `${topic} ${activeSubtopicStr} tutorial`;
      try {
        const res = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent(query)}`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}` }
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          // Display up to 4 videos for today's objective
          setTodayVideos(data.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to fetch today's videos:", err);
      } finally {
        if (isMounted) setLoadingToday(false);
      }
    };

    fetchTodayVideos();
    return () => {
      isMounted = false;
    };
  }, [topic, activeSubtopicStr, searchQuery, backendUrl]);

  // Helper to extract banner pills dynamically from active roadmap
  const getBannerPills = () => {
    if (!topic) return TRENDING_TOPICS;
    
    const roadmapKey = `kaevrix_roadmap_progress_${username}`;
    const savedRoadmap = localStorage.getItem(roadmapKey);
    if (savedRoadmap) {
      try {
        const r = JSON.parse(savedRoadmap);
        const milestones = [
          ...(r.level1?.milestones || []),
          ...(r.level2?.milestones || []),
          ...(r.level3?.milestones || [])
        ];
        
        // Take first 6 milestones
        const titles = milestones.slice(0, 6).map(m => ({
          icon: "✦",
          label: m.title,
          color: r.level1?.color || "#ff6a00",
          query: m.searchQuery || `${topic} ${m.title}`
        }));
        if (titles.length > 0) return titles;
      } catch (e) {
        console.error("Error parsing roadmap for banner pills:", e);
      }
    }
    
    return [
      { icon: "🎓", label: `${topic} Basics`, color: "#4f46e5", query: `${topic} basics` },
      { icon: "💻", label: `${topic} Course`, color: "#10b981", query: `${topic} course` },
      { icon: "💼", label: `${topic} Interview`, color: "#ef4444", query: `${topic} interview` },
      { icon: "⚡", label: `${topic} Tips`, color: "#f59e0b", query: `${topic} tips` },
    ];
  };

  const activeMilestoneTitle = allIncompleteTasks && allIncompleteTasks[0] ? allIncompleteTasks[0].milestone.title : "";

  useEffect(() => {
    if (!topic || searchQuery) return;
    
    let isMounted = true;
    const fetchFeed = async () => {
      const currentTopicFocus = activeMilestoneTitle ? `${topic} ${activeMilestoneTitle}` : topic;
      const cacheKey = `kaevrix_feed_${username}_${encodeURIComponent(currentTopicFocus)}_${encodeURIComponent(why)}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPersonalizedFeed(parsed);
            if (!selectedVideoRef.current && isMounted) {
              setSelectedVideo(parsed[0]);
            }
            return;
          }
        } catch (e) {
          console.error("Error loading cached feed:", e);
        }
      }

      setLoadingFeed(true);
      try {
        const res = await fetch(`${backendUrl}/api/personalized-feed`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`
          },
          body: JSON.stringify({ topic: currentTopicFocus, why })
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          const videos = data.videos || [];
          setPersonalizedFeed(videos);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(videos));
          } catch (e) {
            console.error("Error setting session storage cache:", e);
          }
          if (videos.length > 0 && !selectedVideoRef.current) {
            setSelectedVideo(videos[0]);
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
  }, [topic, activeMilestoneTitle, why, searchQuery, backendUrl, setSelectedVideo, username]);

  const handleTabChange = (tab) => {
    sound.playClockTick();
    setActiveTab(tab);
  };

  const handleSelectVideo = (video) => {
    sound.playClockTick();
    setSelectedVideo(video);
    setStatus("mode_selection");
  };

  const getVideoCardStyle = (video) => ({
    display: "flex", 
    flexDirection: "column",
  });

  const renderVideoCardContent = (video, defaultCategory) => {
    const category = video.category || defaultCategory || "Training";
    const catStyle = getCategoryStyle(category);
    return (
      <>
        {/* 16:9 Thumbnail */}
        <div className="hud-thumbnail-wrap">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="hud-thumbnail-img"
            style={{ opacity: 0.92 }}
          />
          {/* Gradient overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)" }} />

          {/* LIVE badge */}
          <div style={{ position: "absolute", top: "10px", left: "10px", background: "#ef4444", color: "#fff", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "900", display: "flex", alignItems: "center", gap: "5px", fontFamily: "var(--font-gamer)", letterSpacing: "0.5px" }}>
            <span style={{ width: "5.5px", height: "5.5px", borderRadius: "50%", background: "#fff", animation: "pulse 1.5s infinite" }} />
            LIVE
          </div>

          {/* Queue count */}
          <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", color: "#fff", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "800", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            {Math.floor((video.id || "0").charCodeAt(0) * 3.7) + 120} QUEUING
          </div>

          {/* Duration */}
          <span style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(0,0,0,0.75)", color: "#fff", padding: "3px 7px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {Math.floor((video.duration || 300) / 60)}:{String((video.duration || 300) % 60).padStart(2, '0')}
          </span>
          
          {/* HUD Tech learning progress bar */}
          <div className="hud-progress-bar-hud">
            <div className="hud-progress-bar-hud-fill" style={{ width: selectedVideo?.id === video.id ? "100%" : "30%" }}></div>
          </div>
        </div>

        {/* Card Info */}
        <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Tags */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "9px", fontWeight: "800", color: catStyle.color, background: catStyle.bg, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase", border: `1px solid ${catStyle.color}25` }}>{category}</span>
            <span style={{ fontSize: "9px", fontWeight: "800", color: "#4338ca", background: "#e0e7ff", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase", border: "1px solid rgba(67, 56, 202, 0.15)" }}>TRENDING</span>
          </div>

          <h4 style={{ fontSize: "14.5px", fontWeight: "800", color: "var(--text-light)", marginBottom: "6px", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.35", fontFamily: "var(--font-outfit)" }}>
            {video.title}
          </h4>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "auto", display: "flex", alignItems: "center", gap: "4px", fontWeight: "600", textTransform: "uppercase", fontFamily: "monospace", letterSpacing: "0.2px" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>
            {video.channel}
          </p>
        </div>
      </>
    );
  };

  const navItems = [
    { id: "profile", icon: "👤", label: "Profile" },
    { id: "duels", icon: "🎮", label: "Arena" },
    { id: "pathfinder", icon: "🧠", label: "Pathfinder" },
    { id: "chronos", icon: "⏱️", label: "Chronos" },
    { id: "history", icon: "📖", label: "History" },
    { id: "community", icon: "👥", label: "Community" },
    { id: "rankings", icon: "🏆", label: "Global Rankings" },
  ];

  return (
    <div className="dashboard-wrapper">

      {/* Sidebar Navigation */}
      <div className="dashboard-sidebar">
        <div style={{ marginBottom: "8px", padding: "0 12px" }} className="dashboard-sidebar-title">
          <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "2px", fontFamily: "var(--font-gamer)" }}>NAVIGATION SYSTEM</span>
        </div>
        <div className="dashboard-sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`hud-nav-btn ${activeTab === item.id ? "hud-nav-btn-active" : ""}`}
              style={{ width: "100%" }}
            >
              <span style={{ fontSize: "15px" }}>{item.icon}</span>
              <span style={{ fontFamily: "var(--font-outfit)" }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Quick Stats Widget */}
        <div className="hud-stats-box dashboard-stats-widget" style={{ marginTop: "24px" }}>
          <div style={{ fontSize: "10px", fontWeight: "800", color: "#ea580c", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px", fontFamily: "var(--font-gamer)", display: "flex", alignItems: "center", gap: "5px" }}>
            <span className="hud-pulse-dot" style={{ color: "#ea580c" }} />
            LIVE ACTIVITY
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>Battles now</span>
              <span style={{ fontWeight: "800", color: "#ea580c", fontFamily: "monospace" }}>1,247</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>Players online</span>
              <span style={{ fontWeight: "800", color: "#10b981", fontFamily: "monospace" }}>3,821</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>Videos in queue</span>
              <span style={{ fontWeight: "800", color: "#8b5cf6", fontFamily: "monospace" }}>94</span>
            </div>
          </div>
          
          {/* Waveform graphic inside the widget for gaming aesthetic */}
          <div style={{ height: "20px", marginTop: "14px", opacity: 0.25, display: "flex", alignItems: "flex-end", gap: "2px" }}>
            <div style={{ flex: 1, height: "40%", background: "#ea580c", borderRadius: "1px", animation: "pulse 1.2s infinite alternate" }} />
            <div style={{ flex: 1, height: "70%", background: "#ea580c", borderRadius: "1px", animation: "pulse 0.8s infinite alternate-reverse" }} />
            <div style={{ flex: 1, height: "25%", background: "#ea580c", borderRadius: "1px", animation: "pulse 1.5s infinite alternate" }} />
            <div style={{ flex: 1, height: "90%", background: "#ea580c", borderRadius: "1px", animation: "pulse 0.6s infinite alternate-reverse" }} />
            <div style={{ flex: 1, height: "50%", background: "#ea580c", borderRadius: "1px", animation: "pulse 1.1s infinite alternate" }} />
            <div style={{ flex: 1, height: "75%", background: "#ea580c", borderRadius: "1px", animation: "pulse 0.9s infinite alternate-reverse" }} />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="dashboard-content">
        {activeTab === "profile" && (
          <ProfilePanel 
            username={username} 
            selectedClass={selectedClass} 
            onSurpassLimits={onSurpassLimits} 
            onTestJourneyDay={onTestJourneyDay} 
            handleLogout={handleLogout} 
            leaderboard={leaderboard}
            backendUrl={backendUrl}
            getRankTitle={getRankTitle}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            isMusicMuted={isMusicMuted}
            setIsMusicMuted={setIsMusicMuted}
            musicProfile={musicProfile}
            setMusicProfile={setMusicProfile}
            socket={socket}
            showSystemSettings={showSystemSettings}
            setShowSystemSettings={setShowSystemSettings}
          />
        )}

        {activeTab === "duels" && (
          <div style={{ padding: "0 clamp(16px, 4vw, 24px)", boxSizing: "border-box" }}>
            {!searchQuery && !topic ? (
              <div className="arena-empty-container">
                <style>{`
                  .arena-empty-container {
                    width: 100%;
                    max-width: 600px;
                    margin: -10px auto 0 auto;
                    min-height: 320px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 0px 24px;
                    text-align: center;
                    background: transparent;
                    border: none;
                    box-shadow: none;
                    backdrop-filter: none;
                    position: relative;
                    overflow: visible;
                    transition: all 0.4s ease;
                  }
                  .popular-paths-link {
                    transition: all 0.3s ease;
                  }
                  .popular-paths-link:hover .link-arrow {
                    transform: translateX(3px);
                  }
                `}</style>

                {/* Character visual wrapper (no motion, blended background, shifted up) */}
                <div style={{ position: "relative", marginBottom: "12px" }}>
                  <img 
                    src="/empty_state_robot.png" 
                    alt="Explorer Robot Map" 
                    style={{
                      width: "330px",
                      height: "auto",
                      display: "block",
                      mixBlendMode: isDarkMode ? "screen" : "multiply",
                      filter: isDarkMode 
                        ? "invert(0.92) hue-rotate(180deg) brightness(0.65) contrast(1.15)" 
                        : "brightness(1.06) contrast(1.03)",
                      WebkitMaskImage: "radial-gradient(ellipse at center, black 60%, transparent 76%)",
                      maskImage: "radial-gradient(ellipse at center, black 60%, transparent 76%)"
                    }}
                  />
                </div>

                <h2 style={{
                  fontSize: "28px",
                  fontWeight: "800",
                  lineHeight: "1.3",
                  color: "var(--text-light)",
                  margin: "0 0 12px 0",
                  fontFamily: "var(--font-outfit)",
                  letterSpacing: "-0.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  justifyContent: "center",
                  zIndex: 1
                }}>
                  No path found yet <span style={{ whiteSpace: "nowrap" }}>🧭</span>
                </h2>

                <p style={{
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "var(--text-muted)",
                  maxWidth: "460px",
                  lineHeight: "1.6",
                  margin: "0 0 16px 0",
                  fontFamily: "var(--font-outfit)",
                  zIndex: 1
                }}>
                  Even the best warriors need a map.<br />
                  Generate your first learning pathway and start your journey towards mastery.
                </p>

                <div 
                  className="popular-paths-link"
                  onClick={() => handleTabChange("pathfinder")}
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    transition: "color 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    zIndex: 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-light)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  <span>Not sure where to start? Browse </span>
                  <span style={{ color: "#ff6a00", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                    popular paths <span style={{ transition: "transform 0.2s", display: "inline-block" }} className="link-arrow">→</span>
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Premium Topic Header */}
                {!searchQuery && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "24px" }}>
                    <div>
                      <div style={{ fontSize: "9px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "2.5px", fontFamily: "var(--font-gamer)", textTransform: "uppercase", marginBottom: "2px" }}>
                        {topic ? "ACTIVE PATHWAY" : "CLASS ONBOARDING"}
                      </div>
                      <h1 style={{ 
                        fontSize: "26px", 
                        fontWeight: "900", 
                        margin: 0, 
                        color: "var(--text-light)",
                        lineHeight: "1.2",
                        fontFamily: "var(--font-outfit)",
                        letterSpacing: "-0.5px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {topic ? (topic.length > 60 ? topic.substring(0, 60) + "..." : topic) : "TRAINING ARENA"}
                      </h1>
                    </div>
                    {topic && activeSubtopicObj && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <span className="hud-tag hud-tag-green" style={{ fontSize: "10px", fontWeight: "800", padding: "4px 10px", borderRadius: "6px" }}>
                          <span className="hud-pulse-dot" />
                          TARGET DIRECTIVE // {activeSubtopicObj.subtopic}
                        </span>
                      </div>
                    )}
                  </div>
                )}

            {/* Search Results Header */}
            {searchQuery && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-light)", marginBottom: "4px" }}>
                    Results for "{searchQuery}"
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
                    {isSearching ? "Scanning the learning grid..." : `${searchResults?.length || 0} videos found`}
                  </p>
                </div>
                <button onClick={() => onSearch && onSearch("")} style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", color: "var(--text-muted)", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                  ✕ Clear Search
                </button>
              </div>
            )}

            {showRuneLoader ? (
              <CanvasRuneLoader
                isExploding={isExploding}
                onExplodeComplete={handleExplodeComplete}
                isDarkMode={isDarkMode}
                statusText="Entering the Arena"
                subtopic={searchQuery}
              />
            ) : searchQuery ? (
              // Search results mode
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                {(searchResults || []).map((video, idx) => (
                  <div
                    key={`search-vid-${video.id || idx}-${idx}`}
                    onClick={() => handleSelectVideo(video)}
                    className={`hud-card ${selectedVideo?.id === video.id ? "hud-card-active" : ""}`}
                    style={getVideoCardStyle(video)}
                  >
                    {renderVideoCardContent(video)}
                  </div>
                ))}
              </div>
            ) : topic ? (
              // Split Feeds: Recommended for Today & Explore
              <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
                {/* 1. Active Mission (Recommended) */}
                <div>
                  <div className="hud-feed-header">
                    <div className="hud-feed-header-line" />
                    <h3 className="hud-feed-title" style={{ fontSize: "14px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                      RECOMMENDED FOR TODAY
                    </h3>
                  </div>
                  
                  {todayVideos.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                      {todayVideos.map((video, idx) => (
                        <div
                          key={`today-vid-${video.id || idx}-${idx}`}
                          onClick={() => handleSelectVideo(video)}
                          className={`hud-card ${selectedVideo?.id === video.id ? "hud-card-active" : ""}`}
                          style={getVideoCardStyle(video)}
                        >
                          {renderVideoCardContent(video, "Core Tutorial")}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: "24px", textAlign: "center", background: isDarkMode ? "rgba(255,255,255,0.01)" : "#f8fafc", borderRadius: "12px", border: "1px dashed var(--glass-border)", color: "var(--text-muted)", fontSize: "13px" }}>
                      {activeSubtopicObj ? "Finding best tutorials for today's objective..." : "Initialize Pathfinder to get custom daily objectives."}
                    </div>
                  )}
                </div>

                {/* 2. Radar (Explore) */}
                <div>
                  <div className="hud-feed-header" style={{ marginTop: "24px" }}>
                    <div className="hud-feed-header-line" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)", boxShadow: "0 0 10px #3b82f6" }} />
                    <h3 className="hud-feed-title" style={{ fontSize: "14px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                      KNOWLEDGE BOOSTER (HACKS, TRICKS & DEEP DIVES)
                    </h3>
                  </div>

                  {personalizedFeed.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                      {personalizedFeed.map((video, idx) => (
                        <div
                          key={`feed-vid-${video.id || idx}-${idx}`}
                          onClick={() => handleSelectVideo(video)}
                          className={`hud-card ${selectedVideo?.id === video.id ? "hud-card-active" : ""}`}
                          style={getVideoCardStyle(video)}
                        >
                          {renderVideoCardContent(video)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: "24px", textAlign: "center", background: isDarkMode ? "rgba(255,255,255,0.01)" : "#f8fafc", borderRadius: "12px", border: "1px dashed var(--glass-border)", color: "var(--text-muted)", fontSize: "13px" }}>
                      No recommendations found. Try adjusting your Pathfinder goals.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Curated Fallbacks
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                {(curatedVideos || []).map((video, idx) => (
                  <div
                    key={`curated-vid-${video.id || idx}-${idx}`}
                    onClick={() => handleSelectVideo(video)}
                    className={`hud-card ${selectedVideo?.id === video.id ? "hud-card-active" : ""}`}
                    style={getVideoCardStyle(video)}
                  >
                    {renderVideoCardContent(video)}
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
                        {player.avatar ? (player.avatar.includes('http') ? <img src={player.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : player.avatar) : "👤"}
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
          </>
        )}
      </div>
    )}

        {activeTab === "community" && (
          <div style={{ padding: "0 clamp(16px, 4vw, 24px)", boxSizing: "border-box" }}>
            <CommunityTab 
              username={username}
              backendUrl={backendUrl}
              getRankTitle={getRankTitle}
              isDarkMode={isDarkMode}
              socket={socket}
            />
          </div>
        )}

        {activeTab === "pathfinder" && (
          <div style={{ padding: "0 clamp(16px, 4vw, 24px)", boxSizing: "border-box" }}>
            <CognitivePathfinder
              username={username}
              onTriggerSearch={(topicName) => {
                if (onSearch) onSearch(topicName);
                setActiveTab("duels");
              }}
              onStartSoloStudy={onStartSoloStudy}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {activeTab === "chronos" && (
          <div style={{ padding: "0 clamp(16px, 4vw, 24px)", boxSizing: "border-box" }}>
            <PathfinderScheduler
              roadmap={savedRoadmap}
              username={username}
              isDarkMode={isDarkMode}
              onSelectMilestone={(m) => {
                sound.playClockTick();
                setActiveTab("pathfinder");
              }}
              showSettings={showSchedulerSettings}
              setShowSettings={setShowSchedulerSettings}
            />
          </div>
        )}

        {activeTab === "history" && (
          <div className="history-tab-container" style={{ padding: "0 clamp(16px, 4vw, 24px)", boxSizing: "border-box" }}>
            <StudyHistory
              username={username}
              isDarkMode={isDarkMode}
              onStartSoloStudy={onStartSoloStudy}
            />
          </div>
        )}

        {activeTab === "rankings" && (
          <div style={{ padding: "0 clamp(16px, 4vw, 24px)", boxSizing: "border-box" }}>
            <div style={{ marginBottom: "36px" }}>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--neon-orange)", letterSpacing: "4px", marginBottom: "10px", fontFamily: "var(--font-gamer)" }}>
                GLOBAL RANKINGS
              </div>
              <h2 style={{ 
                fontSize: "44px", fontWeight: "900", margin: 0, lineHeight: 1.1, 
                fontFamily: "var(--font-outfit)", letterSpacing: "-2px",
                background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
              }}>
                The Top Duelists
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "15px", margin: "10px 0 0", fontWeight: "500" }}>
                Legends across all domains.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {leaderboard.map((player, index) => {
                const isTop3 = index < 3;
                const rankColor = index === 0 ? "var(--neon-gold)" : index === 1 ? "#cbd5e1" : index === 2 ? "#cd7f32" : "var(--text-muted)";
                const rankGlow = index === 0 ? "0 0 15px rgba(255,179,0,0.6)" : index === 1 ? "0 0 10px rgba(203,213,225,0.4)" : index === 2 ? "0 0 10px rgba(205,127,50,0.4)" : "none";
                const isMe = player.username?.toLowerCase() === username?.toLowerCase();

                return (
                  <div key={player.username} className="rankings-row" style={{ 
                    position: "relative",
                    display: "flex", alignItems: "center", gap: "24px", padding: "16px 24px", 
                    borderRadius: "4px", cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    background: isMe ? "linear-gradient(90deg, rgba(255,106,0,0.1) 0%, transparent 100%)" : "rgba(255,255,255,0.02)",
                    borderLeft: `4px solid ${isMe ? "var(--neon-orange)" : isTop3 ? rankColor : "transparent"}`,
                    overflow: "hidden"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "linear-gradient(90deg, rgba(255,106,0,0.15) 0%, rgba(255,106,0,0.02) 100%)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = isMe ? "linear-gradient(90deg, rgba(255,106,0,0.1) 0%, transparent 100%)" : "rgba(255,255,255,0.02)";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                  >
                    {/* Background glow for Top 3 */}
                    {isTop3 && (
                      <div style={{
                        position: "absolute", top: 0, bottom: 0, left: 0, width: "100px",
                        background: `linear-gradient(90deg, ${rankColor} 0%, transparent 100%)`,
                        opacity: 0.05, pointerEvents: "none"
                      }} />
                    )}

                    {/* Rank Number */}
                    <div style={{ 
                      width: "40px", textAlign: "right", fontSize: isTop3 ? "32px" : "20px", 
                      fontWeight: "900", color: rankColor, fontFamily: "var(--font-gamer)", 
                      textShadow: rankGlow, fontStyle: "italic", letterSpacing: "-2px" 
                    }}>
                      {index + 1}
                    </div>
                    
                    {/* Avatar */}
                    <div className="rankings-avatar-container" style={{ 
                      width: "56px", height: "56px", borderRadius: "12px", 
                      position: "relative", flexShrink: 0, overflow: "hidden", 
                      border: `2px solid ${isTop3 ? rankColor : "var(--glass-border)"}`, 
                      boxShadow: isTop3 ? rankGlow : "none",
                      transform: "rotate(45deg)"
                    }}>
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-45deg) scale(1.45)" }}>
                        {player.avatar ? (
                          player.avatar.includes('http') 
                            ? <img src={player.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", background: "var(--bg-dark-surface)" }}>{player.avatar}</div>
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", background: "var(--bg-dark-surface)" }}>👤</div>
                        )}
                      </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="rankings-user-info" style={{ flex: 1, marginLeft: "12px" }}>
                      <div style={{ 
                        fontWeight: "800", color: isMe ? "var(--neon-orange)" : "var(--text-light)", 
                        fontSize: "18px", fontFamily: "var(--font-outfit)", letterSpacing: "1px", 
                        textTransform: "uppercase" 
                      }}>
                        {player.username}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--neon-orange)", marginTop: "4px", fontWeight: "700", fontFamily: "var(--font-gamer)", letterSpacing: "2px" }}>
                        {getRankTitle(player.level || 1)}
                      </div>
                    </div>

                    {/* Stats HUD Block */}
                    <div className="rankings-stats-hud" style={{ display: "flex", alignItems: "center", gap: "32px", borderLeft: "1px solid var(--glass-border)", paddingLeft: "32px" }}>
                      {/* Level Hexagon */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "60px" }}>
                        <div style={{ 
                          fontSize: "24px", fontWeight: "900", color: "var(--text-light)", 
                          fontFamily: "var(--font-gamer)", lineHeight: 1 
                        }}>
                          {player.level || 1}
                        </div>
                        <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "2px", marginTop: "4px" }}>
                          LEVEL
                        </div>
                      </div>

                      {/* Score/XP */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "80px" }}>
                        <div style={{ 
                          fontSize: "18px", fontWeight: "800", color: "var(--neon-orange)", 
                          fontFamily: "var(--font-outfit)", lineHeight: 1 
                        }}>
                          {(player.xp || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "2px", marginTop: "4px" }}>
                          SCORE
                        </div>
                      </div>

                      {/* Combat Record */}
                      <div style={{ display: "flex", flexDirection: "column", width: "100px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--neon-green)" }}>{player.wins || 0} W</span>
                          <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)" }}>-</span>
                          <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--neon-pink)" }}>{player.losses || 0} L</span>
                        </div>
                        <div style={{ width: "100%", height: "4px", background: "var(--glass-border)", display: "flex" }}>
                          <div style={{ 
                            width: `${(player.wins || 0) + (player.losses || 0) === 0 ? 50 : ((player.wins || 0) / ((player.wins || 0) + (player.losses || 0))) * 100}%`, 
                            height: "100%", background: "var(--neon-green)" 
                          }} />
                          <div style={{ flex: 1, height: "100%", background: "var(--neon-pink)" }} />
                        </div>
                        <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "2px", marginTop: "6px", textAlign: "center" }}>
                          WIN RATIO
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Right Sidebar: Pathfinder To-Do List */}
      {activeTab === "duels" && (
        <div style={{ width: "280px", display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0, position: "sticky", top: "20px" }}>
          <div className="hud-panel" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
            
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1.5px solid rgba(255, 106, 0, 0.15)", paddingBottom: "10px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#ff6a00", textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: "var(--font-gamer)" }}>DAILY QUEST MATRIX</span>
            </div>
            
            {/* Daily Quota Tracking Block */}
            {schedule && (
              <div style={{
                background: "transparent",
                border: "none",
                borderRadius: "0px",
                padding: "0px",
                marginBottom: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--text-muted)", textTransform: "uppercase" }}>TODAY'S TARGET</span>
                  <span style={{ fontSize: "12.5px", fontWeight: "900", color: "#ff6a00" }}>{completedToday} / {dailyTarget} Done</span>
                </div>
                <div style={{ height: "4px", background: "rgba(100,100,100,0.15)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ 
                    height: "100%", 
                    width: `${dailyTarget > 0 ? Math.min(100, (completedToday / dailyTarget) * 100) : 0}%`, 
                    background: "#ff6a00", 
                    borderRadius: "2px",
                    transition: "width 0.4s ease"
                  }} />
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10.5px", marginTop: "2px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Status:</span>
                  {velocityStatus === "AHEAD" ? (
                    <span style={{ color: "#10b981", fontWeight: "800" }}>🚀 Ahead</span>
                  ) : velocityStatus === "BEHIND" ? (
                    <span style={{ color: "#ef4444", fontWeight: "800" }}>⚠️ Behind</span>
                  ) : (
                    <span style={{ color: "#f59e0b", fontWeight: "800" }}>⚡ On Track</span>
                  )}
                </div>

                {quotaDescription && (
                  <div style={{ 
                    fontSize: "10px", 
                    color: velocityStatus === "BEHIND" ? "#ef4444" : (velocityStatus === "AHEAD" ? "#10b981" : "var(--text-muted)"), 
                    fontWeight: "600",
                    marginTop: "2px",
                    lineHeight: "1.3"
                  }}>
                    {quotaDescription}
                  </div>
                )}

                {streak > 0 && (
                  <div style={{ fontSize: "10.5px", color: "#ff6a00", fontWeight: "800", borderTop: "1px solid var(--glass-border)", paddingTop: "4px", marginTop: "2px" }}>
                    🔥 Streak Active: {streak} Days!
                  </div>
                )}
              </div>
            )}

            {/* Subtopic Objectives Checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "40vh", overflowY: "auto", paddingRight: "4px" }} className="custom-scrollbar">
              {completedToday >= dailyTarget && dailyTarget > 0 ? (
                <div style={{ fontSize: "12px", fontWeight: "800", color: "#ff6a00", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ✓ Today's goal reached
                </div>
              ) : (
                <div style={{ fontSize: "10.5px", fontWeight: "900", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                  QUEST OBJECTIVES
                </div>
              )}

              {completedToday >= dailyTarget && dailyTarget > 0 && (
                <div style={{ fontSize: "10.5px", fontWeight: "900", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "4px", marginBottom: "2px" }}>
                  EXTRA
                </div>
              )}

              {allIncompleteTasks && allIncompleteTasks[0] ? (
                <div 
                  onClick={() => {
                    if (!allIncompleteTasks[0].isEncrypted && onSearch) {
                      sound.playClockTick();
                      onSearch(allIncompleteTasks[0].milestone.searchQuery || allIncompleteTasks[0].milestone.title);
                    }
                  }}
                  className="hud-quest-row hud-quest-row-active"
                  style={{
                    cursor: allIncompleteTasks[0].isEncrypted ? "default" : "pointer",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background: "rgba(255, 106, 0, 0.03)",
                    border: "1px solid rgba(255, 106, 0, 0.12)",
                    display: "flex",
                    gap: "8px"
                  }}
                >
                  <div style={{
                    marginTop: "2px",
                    color: "#ff6a00",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center"
                  }}>
                    <div style={{ 
                      width: "12px", height: "12px", borderRadius: "50%", 
                      border: "2.5px solid #ff6a00", background: "transparent"
                    }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: "11px", 
                      fontWeight: "700", 
                      color: "var(--text-light)",
                      lineHeight: "1.4",
                      fontFamily: "var(--font-outfit)"
                    }}>
                      {allIncompleteTasks[0].text}
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Node: {cleanMilestoneTitle(allIncompleteTasks[0].milestone.title)}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "12px" }}>
                  No active objectives. Initialize Pathfinder roadmap to begin.
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* 7. Floating ToDo Action Button & Popup */}
      {schedule && savedRoadmap && (
        <>
          <button 
            className="floating-todo-fab"
            onClick={() => {
              sound.playClockTick();
              setShowTodoPopup(!showTodoPopup);
            }}
            title="Daily Neuronal Directives"
          >
            <span>📋</span>
            {remainingTodayTarget > 0 ? (
              <span className="todo-fab-badge">{remainingTodayTarget}</span>
            ) : (
              <span className="todo-fab-badge todo-badge-clear">✓</span>
            )}
          </button>

          {showTodoPopup && (
            <div className="floating-todo-popup">
              <div className="todo-popup-header">
                <span className="todo-popup-title">🛡️ NEURAL DIRECTIVES</span>
                <button 
                  className="todo-popup-close"
                  onClick={() => setShowTodoPopup(false)}
                >
                  ✕
                </button>
              </div>

              <div className="todo-popup-body">
                {activePendingTasks.length > 0 ? (
                  <div className="todo-tasks-list">
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: "600" }}>
                      PENDING DAILY QUOTA:
                    </div>
                    {activePendingTasks.map((t, idx) => {
                      const taskNum = completedToday + idx + 1;
                      return (
                        <div key={`${t.milestone.id}_${t.subtopicIndex}`} className="todo-task-item">
                          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                            <span className="todo-task-num">{taskNum}</span>
                            <div>
                              <div className="todo-task-text">{t.text}</div>
                              <span className="todo-task-node">Node: {t.milestone.title}</span>
                            </div>
                          </div>
                          {!t.isEncrypted && (
                            <div className="todo-task-actions" style={{ marginTop: "6px" }}>
                              <button
                                onClick={() => {
                                  sound.playClockTick();
                                  onStartSoloStudy && onStartSoloStudy(t.milestone);
                                  setShowTodoPopup(false);
                                }}
                                className="todo-action-btn"
                              >
                                📖 Study Node
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="todo-clear-state">
                    <span style={{ fontSize: "28px" }}>🌟</span>
                    <h4 style={{ color: "var(--neon-green)", margin: "8px 0 4px 0", fontSize: "14px", fontWeight: "900" }}>DIRECTIVES CLEAR</h4>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Daily quota cleared! Limit break mode active. Keep studying to gain extra XP multiplier.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
