import { useState, useEffect, useRef } from "react";
import * as sound from "../../utils/audio";
import CognitivePathfinder from "../Roadmap/CognitivePathfinder";
import ProfilePanel from "./ProfilePanel";

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
    default:
      return { color: "#ea580c", bg: "#ffedd5" };
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
  setStatus
}) {
  const [activeTab, setActiveTab] = useState("duels");
  const [personalizedFeed, setPersonalizedFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [activeMilestones, setActiveMilestones] = useState([]);
  const [todayVideos, setTodayVideos] = useState([]);
  const [loadingToday, setLoadingToday] = useState(false);

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
        const res = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent(query)}`);
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

  useEffect(() => {
    if (!topic || searchQuery) return;
    
    let isMounted = true;
    const fetchFeed = async () => {
      const cacheKey = `kaevrix_feed_${username}_${encodeURIComponent(topic)}_${encodeURIComponent(why)}`;
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, why })
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
  }, [topic, why, searchQuery, backendUrl, setSelectedVideo, username]);

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
    { id: "rules", icon: "📘", label: "Combat Manual" },
    { id: "rankings", icon: "🏆", label: "Global Rankings" },
  ];

  return (
    <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto", padding: "40px 0", display: "flex", gap: "28px", alignItems: "flex-start" }}>

      {/* Sidebar Navigation */}
      <div style={{ width: "220px", display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0, position: "sticky", top: "20px" }}>
        <div style={{ marginBottom: "8px", padding: "0 12px" }}>
          <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "2px", fontFamily: "var(--font-gamer)" }}>NAVIGATION SYSTEM</span>
        </div>
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

        {/* Quick Stats Widget */}
        <div className="hud-stats-box" style={{ marginTop: "24px" }}>
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
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeTab === "profile" && (
          <ProfilePanel username={username} selectedClass={selectedClass} onSurpassLimits={onSurpassLimits} onTestJourneyDay={onTestJourneyDay} />
        )}

        {activeTab === "duels" && (
          <div>
            {/* Premium Topic Header */}
            {/* Main Duels Content Logic */}
            {!searchQuery && !topic ? (
              <div style={{
                width: "100%",
                minHeight: "60vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                textAlign: "center",
                background: "transparent"
              }}>
                <style>{`
                  .premium-empty-text {
                    font-size: 6vw;
                    max-font-size: 80px;
                    min-font-size: 40px;
                    font-weight: 900;
                    line-height: 1.1;
                    letter-spacing: 4px;
                    font-family: var(--font-gamer);
                    text-transform: uppercase;
                    color: var(--text-light);
                    margin-bottom: 24px;
                    opacity: 0.9;
                  }
                  .premium-empty-subtext {
                    font-size: 20px;
                    font-weight: 500;
                    color: var(--text-muted);
                    max-width: 600px;
                    line-height: 1.6;
                    margin-bottom: 48px;
                    font-family: var(--font-outfit);
                  }
                  .premium-text-link {
                    font-size: 18px;
                    font-weight: 800;
                    color: #ea580c;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-family: var(--font-gamer);
                    cursor: pointer;
                    position: relative;
                    padding: 10px 20px;
                    transition: all 0.3s ease;
                    background: transparent;
                    border: none;
                  }
                  .premium-text-link::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    width: 0;
                    height: 2px;
                    background: #ea580c;
                    transition: all 0.3s ease;
                    transform: translateX(-50%);
                  }
                  .premium-text-link:hover {
                    color: #f97316;
                    text-shadow: 0 0 20px rgba(234, 88, 12, 0.4);
                  }
                  .premium-text-link:hover::after {
                    width: 80%;
                  }
                `}</style>
                
                <h2 className="premium-empty-text" style={{ fontSize: "clamp(40px, 6vw, 80px)" }}>
                  ARENA OFFLINE
                </h2>
                
                <p className="premium-empty-subtext">
                  You cannot enter the training grounds without a target directive. Engage the Pathfinder to establish your learning roadmap and unlock the Arena.
                </p>

                <button className="premium-text-link" onClick={() => handleTabChange("pathfinder")}>
                  Setup Pathfinder →
                </button>
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

            {/* Videos Grid — standard 16:9 cards OR game loading animation */}
            {isSearching || loadingFeed || loadingToday ? (
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
            ) : searchQuery ? (
              // Search results mode
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                {(searchResults || []).map((video) => (
                  <div
                    key={video.id}
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
                      {todayVideos.map((video) => (
                        <div
                          key={video.id}
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
                      RADAR SCAN (EXPANDED RECON)
                    </h3>
                  </div>

                  {personalizedFeed.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                      {personalizedFeed.map((video) => (
                        <div
                          key={video.id}
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
                {(curatedVideos || []).map((video) => (
                  <div
                    key={video.id}
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
            onStartSoloStudy={onStartSoloStudy}
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

      {/* Right Sidebar: Pathfinder To-Do List */}
      {activeTab === "duels" && (
        <div style={{ width: "280px", display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0, position: "sticky", top: "20px" }}>
          <div className="hud-panel" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1.5px solid rgba(255, 106, 0, 0.15)", paddingBottom: "10px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#ea580c", textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: "var(--font-gamer)" }}>QUEST TRACKER</span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "60vh", overflowY: "auto", paddingRight: "4px" }} className="custom-scrollbar">
              {activeMilestones.length > 0 ? (
                activeMilestones.map(m => {
                  const isMilestoneDone = m.status === "completed";
                  const subtopicIndex = m.subtopicIndex || 0;
                  
                  return (
                    <div key={m.id} style={{ marginBottom: "12px" }}>
                      <div style={{
                        fontSize: "11.5px", fontWeight: "900", color: "var(--text-light)",
                        marginBottom: "8px", borderBottom: "1px solid var(--glass-border)",
                        paddingBottom: "4px", fontFamily: "var(--font-gamer)", letterSpacing: "0.5px", textTransform: "uppercase"
                      }}>
                        {cleanMilestoneTitle(m.title)}
                      </div>
                      
                      {m.keyPoints?.map((pt, i) => {
                        const isDone = isMilestoneDone || i < subtopicIndex;
                        
                        return (
                          <div key={i} className={`hud-quest-row ${isDone ? "hud-quest-row-completed" : "hud-quest-row-active"}`}>
                            <div style={{
                              marginTop: "2px",
                              color: isDone ? "#10b981" : "#ea580c",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center"
                            }}>
                              {isDone ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontSize: "11.5px", 
                                fontWeight: isDone ? "500" : "700", 
                                color: isDone ? "var(--text-muted)" : "var(--text-light)",
                                textDecoration: isDone ? "line-through" : "none",
                                lineHeight: "1.4",
                                fontFamily: "var(--font-outfit)"
                              }}>
                                {pt}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                  No active directives. Go to the Pathfinder tab to generate a roadmap!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
