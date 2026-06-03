import React, { useState, useEffect, useMemo, useRef } from "react";
import * as sound from "../../utils/audio";
import ProfilePanel from "../Dashboard/ProfilePanel";

export default function CommunityTab({ username, backendUrl, getRankTitle, isDarkMode, socket }) {
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [sortBy, setSortBy] = useState("level_high");
  const [loading, setLoading] = useState(true);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sentThisSession, setSentThisSession] = useState([]);
  const [activeView, setActiveView] = useState("discover"); // discover | squad | requests | messages
  const itemsPerPage = 8;
  
  // Chat & Presence State
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef(null);

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;
    
    const handleOnlineList = (list) => setOnlineUsers(new Set(list));
    const handleUserOnline = (user) => setOnlineUsers(prev => { const n = new Set(prev); n.add(user); return n; });
    const handleUserOffline = (user) => setOnlineUsers(prev => { const n = new Set(prev); n.delete(user); return n; });
    const handleReceiveDm = (msg) => {
      // If we are currently chatting with the sender or receiver, append to our local chat state
      if ((msg.sender === activeChatUser && msg.receiver === username) || 
          (msg.sender === username && msg.receiver === activeChatUser)) {
        setChatMessages(prev => [...prev, msg]);
      }
      // Note: We might want a notification if they aren't the active chat user
    };

    socket.on("online_users_list", handleOnlineList);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("receive_dm", handleReceiveDm);

    return () => {
      socket.off("online_users_list", handleOnlineList);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("receive_dm", handleReceiveDm);
    };
  }, [socket, activeChatUser, username]);

  // Fetch DM History when activeChatUser changes
  useEffect(() => {
    if (activeChatUser && activeView === "messages") {
      fetch(`${backendUrl}/api/chat/messages/${username}/${activeChatUser}`)
        .then(res => res.json())
        .then(data => setChatMessages(data || []))
        .catch(err => console.error("Error fetching chat:", err));
    }
  }, [activeChatUser, activeView, backendUrl, username]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendDm = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatUser || !socket) return;
    socket.emit("send_dm", { sender: username, receiver: activeChatUser, content: chatInput.trim() });
    setChatInput("");
  };

  const fetchFriendsData = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/community/friends/${username}`);
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setIncomingRequests(data.incomingRequests || []);
      }
    } catch (err) { console.error("Error fetching friends:", err); }
  };

  const fetchDiscoverUsers = async (filter = "") => {
    try {
      const res = await fetch(`${backendUrl}/api/community/discover/${username}?filter=${encodeURIComponent(filter)}`);
      if (res.ok) {
        const data = await res.json();
        setDiscoverUsers(data || []);
        setCurrentPage(1);
      }
    } catch (err) { console.error("Error fetching discover:", err); }
  };

  const loadAllData = async (filter = "") => {
    setLoading(true);
    await Promise.all([fetchFriendsData(), fetchDiscoverUsers(filter)]);
    setLoading(false);
  };

  useEffect(() => { loadAllData(); }, [username, backendUrl]);

  const handleFilterSearch = (e) => {
    e.preventDefault();
    sound.playClockTick();
    loadAllData(filterQuery);
  };

  const handleSendRequest = async (e, toUser) => {
    e.stopPropagation();
    sound.playClockTick();
    try {
      const res = await fetch(`${backendUrl}/api/community/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUser: username, toUser })
      });
      if (res.ok) {
        setSentThisSession(prev => [...prev, toUser]);
        sound.playLevelUp();
      }
    } catch (err) { console.error("Send request failed", err); }
  };

  const handleRespond = async (e, fromUser, action) => {
    e.stopPropagation();
    sound.playClockTick();
    try {
      const res = await fetch(`${backendUrl}/api/community/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, fromUser, action })
      });
      if (res.ok) {
        if (action === "accept") sound.playLevelUp();
        fetchFriendsData();
      }
    } catch (err) { console.error("Respond failed", err); }
  };

  const sortedDiscoverUsers = useMemo(() => {
    const users = [...discoverUsers];
    if (sortBy === "level_high") users.sort((a, b) => (b.level || 0) - (a.level || 0));
    else if (sortBy === "level_low") users.sort((a, b) => (a.level || 0) - (b.level || 0));
    else if (sortBy === "wins") users.sort((a, b) => (b.wins || 0) - (a.wins || 0));
    return users;
  }, [discoverUsers, sortBy]);

  const totalPages = Math.ceil(sortedDiscoverUsers.length / itemsPerPage);
  const paginatedDiscover = sortedDiscoverUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Inject styles once
  useEffect(() => {
    const id = "community-v4-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      .cv4-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 14px 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: 12px;
        margin: 0 -16px;
        position: relative;
      }
      .cv4-row:hover {
        background: var(--bg-dark-surface);
        box-shadow: var(--shadow-neon);
      }
      .cv4-row:hover .cv4-avatar-ring {
        border-color: var(--neon-orange);
        box-shadow: 0 0 12px rgba(255,106,0,0.25);
      }
      .cv4-row:hover .cv4-username {
        color: var(--neon-orange);
      }
      .cv4-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        position: relative;
      }
      .cv4-avatar-ring {
        position: absolute;
        inset: -2px;
        border-radius: 50%;
        border: 2px solid var(--glass-border);
        transition: all 0.2s ease;
        z-index: 1;
      }
      .cv4-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        position: relative;
        z-index: 0;
      }
      .cv4-add-btn {
        padding: 8px 22px;
        border-radius: 20px;
        border: none;
        background: var(--accent-gradient);
        color: #fff;
        font-weight: 800;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        text-transform: uppercase;
        letter-spacing: 1px;
        font-family: var(--font-gamer);
        box-shadow: 0 3px 12px rgba(255,106,0,0.25);
        position: relative;
        overflow: hidden;
      }
      .cv4-add-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
        opacity: 0;
        transition: opacity 0.25s;
      }
      .cv4-add-btn:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 6px 24px rgba(255,106,0,0.45), 0 0 0 2px rgba(255,106,0,0.15);
      }
      .cv4-add-btn:hover::before {
        opacity: 1;
      }
      .cv4-add-btn:active {
        transform: translateY(0) scale(0.98);
      }
      /* Tab bar */
      .cv4-tab-bar {
        display: flex;
        gap: 4px;
        margin-bottom: 32px;
        border-bottom: 1px solid var(--glass-border);
        padding-bottom: 0;
      }
      .cv4-tab {
        padding: 10px 24px;
        border: none;
        background: transparent;
        color: var(--text-muted);
        font-weight: 700;
        font-size: 13px;
        font-family: var(--font-gamer);
        letter-spacing: 1px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        text-transform: uppercase;
      }
      .cv4-tab::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: transparent;
        border-radius: 2px 2px 0 0;
        transition: all 0.2s ease;
      }
      .cv4-tab:hover {
        color: var(--text-light);
      }
      .cv4-tab-active {
        color: var(--neon-orange);
      }
      .cv4-tab-active::after {
        background: var(--accent-gradient);
        box-shadow: 0 0 10px rgba(255,106,0,0.3);
      }
      .cv4-tab-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        background: var(--neon-orange);
        color: #fff;
        font-size: 10px;
        font-weight: 800;
        margin-left: 8px;
        padding: 0 5px;
        font-family: var(--font-sans);
      }
      .cv4-status-dot {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid var(--bg-dark-base);
        z-index: 10;
      }
      .cv4-status-online {
        background: var(--neon-green);
        box-shadow: 0 0 8px rgba(16,185,129,0.6);
      }
      .cv4-status-offline {
        background: #64748b;
      }
      .cv4-sent-badge {
        padding: 7px 14px;
        border-radius: 8px;
        background: rgba(255,106,0,0.08);
        color: var(--neon-orange);
        font-weight: 700;
        font-size: 11px;
        letter-spacing: 0.5px;
        border: 1px solid rgba(255,106,0,0.15);
      }
      .cv4-accept-btn {
        padding: 8px 22px;
        border-radius: 20px;
        border: none;
        background: var(--neon-green);
        color: #fff;
        font-weight: 800;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: var(--font-gamer);
        letter-spacing: 1px;
        box-shadow: 0 3px 12px rgba(16,185,129,0.25);
      }
      .cv4-accept-btn:hover {
        box-shadow: 0 6px 24px rgba(16,185,129,0.45);
        transform: translateY(-2px) scale(1.05);
      }
      .cv4-deny-btn {
        padding: 8px 22px;
        border-radius: 20px;
        border: 1px solid var(--glass-border);
        background: transparent;
        color: var(--text-muted);
        font-weight: 800;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: var(--font-gamer);
        letter-spacing: 1px;
      }
      .cv4-deny-btn:hover {
        border-color: var(--neon-pink);
        color: var(--neon-pink);
        background: rgba(255,59,48,0.05);
        transform: translateY(-1px);
      }
      .cv4-allied-badge {
        padding: 5px 12px;
        border-radius: 20px;
        background: rgba(16,185,129,0.08);
        color: #10b981;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
        border: 1px solid rgba(16,185,129,0.15);
      }
      .cv4-message-btn {
        padding: 8px 22px;
        border-radius: 20px;
        border: 1px solid var(--neon-orange);
        background: rgba(255,106,0,0.08);
        color: var(--neon-orange);
        font-weight: 800;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: var(--font-gamer);
        letter-spacing: 1px;
      }
      .cv4-message-btn:hover {
        background: var(--neon-orange);
        color: #fff;
        box-shadow: 0 4px 15px rgba(255,106,0,0.3);
        transform: translateY(-2px);
      }
      .cv4-section-line {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: var(--font-sans);
      }
      .cv4-section-line::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--glass-border);
      }
      .cv4-filter-select {
        padding: 9px 14px;
        border-radius: 10px;
        border: 1px solid var(--glass-border);
        background: var(--bg-dark-surface);
        color: var(--text-light);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        outline: none;
        transition: border-color 0.2s;
        font-family: var(--font-sans);
      }
      .cv4-filter-select:hover,
      .cv4-filter-select:focus {
        border-color: var(--neon-orange);
      }
      .cv4-search-input {
        padding: 9px 14px;
        border-radius: 10px;
        border: 1px solid var(--glass-border);
        background: var(--bg-dark-surface);
        color: var(--text-light);
        font-size: 13px;
        font-weight: 600;
        outline: none;
        width: 180px;
        transition: all 0.2s;
        font-family: var(--font-sans);
      }
      .cv4-search-input::placeholder {
        color: var(--text-muted);
        opacity: 0.6;
      }
      .cv4-search-input:focus {
        border-color: var(--neon-orange);
        box-shadow: 0 0 0 3px rgba(255,106,0,0.08);
      }
      .cv4-search-btn {
        padding: 9px 20px;
        border-radius: 10px;
        border: none;
        background: var(--accent-gradient);
        color: #fff;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.15s;
        font-family: var(--font-sans);
        box-shadow: 0 2px 10px rgba(255,106,0,0.15);
      }
      .cv4-search-btn:hover {
        box-shadow: 0 4px 15px rgba(255,106,0,0.3);
        transform: translateY(-1px);
      }
      .cv4-page-btn {
        padding: 7px 16px;
        border-radius: 8px;
        border: 1px solid var(--glass-border);
        background: var(--bg-dark-surface);
        color: var(--text-muted);
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s;
        font-family: var(--font-sans);
      }
      .cv4-page-btn:hover:not(:disabled) {
        border-color: var(--neon-orange);
        color: var(--neon-orange);
      }
      .cv4-page-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      .cv4-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        animation: cv4FadeIn 0.15s ease;
      }
      @keyframes cv4FadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .cv4-modal-card {
        width: 100%;
        max-width: 960px;
        max-height: 85vh;
        background: var(--bg-dark-base);
        border-radius: 20px;
        border: 1px solid var(--glass-border);
        box-shadow: 0 40px 80px rgba(0,0,0,0.4);
        overflow-y: auto;
        position: relative;
        animation: cv4SlideUp 0.2s ease;
      }
      @keyframes cv4SlideUp {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .cv4-modal-card::-webkit-scrollbar { width: 6px; }
      .cv4-modal-card::-webkit-scrollbar-track { background: transparent; }
      .cv4-modal-card::-webkit-scrollbar-thumb { background: rgba(255,106,0,0.2); border-radius: 3px; }
      .cv4-close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 1px solid var(--glass-border);
        background: var(--bg-dark-surface);
        color: var(--text-muted);
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
        z-index: 10;
      }
      .cv4-close-btn:hover {
        background: var(--neon-orange);
        color: #fff;
        border-color: var(--neon-orange);
      }
      .cv4-username {
        transition: color 0.2s ease;
      }
    `;
    document.head.appendChild(s);
  }, []);

  const getLevelColor = (level) => {
    if (level >= 10) return "var(--neon-orange)";
    if (level >= 5) return "var(--neon-gold)";
    if (level >= 3) return "#3b82f6";
    return "var(--text-muted)";
  };

  const Row = ({ user, action, index }) => (
    <div className="cv4-row" onClick={() => { sound.playClockTick(); setSelectedProfileUser(user.username); }}>
      {index != null && (
        <div style={{ width: "24px", textAlign: "center", fontSize: "14px", fontWeight: "900", color: "var(--text-muted)", opacity: 0.35, fontFamily: "var(--font-gamer)" }}>
          {index}
        </div>
      )}
      <div className="cv4-avatar">
        <div className="cv4-avatar-ring" />
        {user.avatar ? (
          user.avatar.includes('http') 
            ? <img src={user.avatar} alt="" /> 
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", background: "rgba(255,106,0,0.08)" }}>{user.avatar}</div>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", background: "rgba(255,106,0,0.08)" }}>👤</div>
        )}
        <div className={`cv4-status-dot ${onlineUsers.has(user.username) ? 'cv4-status-online' : 'cv4-status-offline'}`} />
      </div>
      {/* Player Info */}
      <div style={{ width: "140px", flexShrink: 0 }}>
        <div className="cv4-username" style={{ fontWeight: "700", color: "var(--text-light)", fontSize: "15px", fontFamily: "var(--font-outfit)", letterSpacing: "0.2px" }}>
          {user.username}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", fontWeight: "600" }}>
          {getRankTitle(user.level)}
        </div>
      </div>
      {/* Mid section: Level badge + XP bar + Win Rate */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "24px", minWidth: 0 }}>
        {/* Level Badge */}
        <div style={{
          background: "var(--accent-gradient)", borderRadius: "6px", padding: "4px 12px",
          fontSize: "11px", fontWeight: "900", color: "#fff", fontFamily: "var(--font-gamer)",
          letterSpacing: "1px", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(255,106,0,0.2)"
        }}>
          LVL {user.level}
        </div>
        {/* XP Progress Bar */}
        <div style={{ flex: 1, minWidth: "80px", maxWidth: "200px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", fontFamily: "var(--font-gamer)", letterSpacing: "0.5px" }}>XP</span>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--neon-orange)", fontFamily: "var(--font-gamer)" }}>{(user.xp || 0).toLocaleString()}</span>
          </div>
          <div style={{ width: "100%", height: "6px", background: "var(--glass-border)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, ((user.xp || 0) % 200) / 200 * 100)}%`, height: "100%", background: "var(--accent-gradient)", borderRadius: "3px", transition: "width 0.3s ease" }} />
          </div>
        </div>
        {/* Win Rate */}
        <div style={{ textAlign: "center", minWidth: "60px" }}>
          <div style={{ fontSize: "16px", fontWeight: "900", color: "var(--text-light)", fontFamily: "var(--font-gamer)", lineHeight: 1 }}>
            {(user.wins || 0) + (user.losses || 0) > 0 ? Math.round(((user.wins || 0) / ((user.wins || 0) + (user.losses || 0))) * 100) : 0}%
          </div>
          <div style={{ fontSize: "9px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "1px", marginTop: "2px" }}>WIN RATE</div>
        </div>
        {/* W/L */}
        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "700", whiteSpace: "nowrap", fontFamily: "var(--font-sans)" }}>
          <span style={{ color: "var(--neon-green)" }}>{user.wins || 0}W</span>
          <span style={{ margin: "0 4px", opacity: 0.3 }}>·</span>
          <span style={{ color: "var(--neon-pink)" }}>{user.losses || 0}L</span>
        </div>
      </div>
      <div onClick={e => e.stopPropagation()}>
        {action}
      </div>
    </div>
  );

  if (loading && friends.length === 0 && discoverUsers.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", gap: "16px" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(255,106,0,0.15)", borderTopColor: "var(--neon-orange)", borderRadius: "50%", animation: "cv4spin 0.8s linear infinite" }} />
        <div style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: "600", letterSpacing: "1px" }}>LOADING COMMUNITY</div>
        <style>{`@keyframes cv4spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      {/* No wrapper — content flows directly into the page background */}
      <div style={{ padding: "0 4px" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--neon-orange)", letterSpacing: "4px", marginBottom: "10px", fontFamily: "var(--font-gamer)" }}>
            COMMUNITY
          </div>
          <h2 style={{ 
            fontSize: "44px", fontWeight: "900", margin: 0, lineHeight: 1.1, 
            fontFamily: "var(--font-outfit)", letterSpacing: "-2px",
            background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Find Your Squad
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", margin: "10px 0 0", fontWeight: "500" }}>
            {discoverUsers.length + friends.length} players in the network
          </p>
        </div>

        {/* Tab Bar */}
        <div className="cv4-tab-bar">
          <button className={`cv4-tab ${activeView === "discover" ? "cv4-tab-active" : ""}`} onClick={() => { sound.playClockTick(); setActiveView("discover"); }}>
            Discover
          </button>
          <button className={`cv4-tab ${activeView === "squad" ? "cv4-tab-active" : ""}`} onClick={() => { sound.playClockTick(); setActiveView("squad"); }}>
            My Squad
            {friends.length > 0 && <span className="cv4-tab-badge">{friends.length}</span>}
          </button>
          <button className={`cv4-tab ${activeView === "requests" ? "cv4-tab-active" : ""}`} onClick={() => { sound.playClockTick(); setActiveView("requests"); }}>
            Requests
            {incomingRequests.length > 0 && <span className="cv4-tab-badge">{incomingRequests.length}</span>}
          </button>
          <button className={`cv4-tab ${activeView === "messages" ? "cv4-tab-active" : ""}`} onClick={() => { sound.playClockTick(); setActiveView("messages"); }}>
            Messages
          </button>
        </div>

        {/* Messages View */}
        {activeView === "messages" && (
          <div style={{ display: "flex", height: "60vh", background: "var(--bg-dark-surface)", borderRadius: "16px", border: "1px solid var(--glass-border)", overflow: "hidden" }}>
            {/* Friends Sidebar */}
            <div style={{ width: "260px", borderRight: "1px solid var(--glass-border)", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "16px", borderBottom: "1px solid var(--glass-border)", fontSize: "14px", fontWeight: "800", color: "var(--text-light)", fontFamily: "var(--font-gamer)", letterSpacing: "1px" }}>DIRECT MESSAGES</div>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                {friends.length > 0 ? friends.map(user => (
                  <div key={user.username} 
                    onClick={() => { sound.playClockTick(); setActiveChatUser(user.username); }}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "12px", padding: "12px", 
                      borderRadius: "10px", cursor: "pointer", transition: "all 0.2s",
                      background: activeChatUser === user.username ? "rgba(255,106,0,0.1)" : "transparent",
                      border: `1px solid ${activeChatUser === user.username ? "var(--neon-orange)" : "transparent"}`
                    }}>
                    <div className="cv4-avatar" style={{ width: "32px", height: "32px" }}>
                      {user.avatar && user.avatar.includes('http') ? <img src={user.avatar} alt="" /> : <div style={{width:"100%",height:"100%",background:"#333",display:"flex",alignItems:"center",justifyContent:"center"}}>👤</div>}
                      <div className={`cv4-status-dot ${onlineUsers.has(user.username) ? 'cv4-status-online' : 'cv4-status-offline'}`} style={{ width: "10px", height: "10px", bottom: 0, right: 0 }} />
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: activeChatUser === user.username ? "var(--neon-orange)" : "var(--text-light)" }}>
                      {user.username}
                    </div>
                  </div>
                )) : <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "10px" }}>No friends to message yet.</div>}
              </div>
            </div>
            {/* Chat Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {activeChatUser ? (
                <>
                  <div style={{ padding: "20px", borderBottom: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-light)" }}>@{activeChatUser}</div>
                    {onlineUsers.has(activeChatUser) && <span style={{ padding: "4px 8px", background: "rgba(16,185,129,0.1)", color: "var(--neon-green)", borderRadius: "4px", fontSize: "10px", fontWeight: "800" }}>ONLINE</span>}
                  </div>
                  <div ref={chatScrollRef} style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {chatMessages.map((msg, i) => {
                      const isMe = msg.sender === username;
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                          <div style={{ 
                            maxWidth: "70%", padding: "10px 16px", borderRadius: "16px",
                            background: isMe ? "var(--neon-orange)" : "var(--bg-dark-base)",
                            color: isMe ? "#fff" : "var(--text-light)",
                            border: isMe ? "none" : "1px solid var(--glass-border)",
                            borderBottomRightRadius: isMe ? "4px" : "16px",
                            borderBottomLeftRadius: isMe ? "16px" : "4px",
                            fontSize: "14px", lineHeight: 1.4
                          }}>
                            {msg.content}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", fontWeight: "600" }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <form onSubmit={handleSendDm} style={{ padding: "16px", borderTop: "1px solid var(--glass-border)", display: "flex", gap: "12px" }}>
                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={`Message @${activeChatUser}...`} style={{ flex: 1, padding: "12px 16px", borderRadius: "24px", border: "1px solid var(--glass-border)", background: "var(--bg-dark-base)", color: "var(--text-light)", outline: "none", fontSize: "14px" }} />
                    <button type="submit" style={{ padding: "0 24px", borderRadius: "24px", background: "var(--accent-gradient)", color: "#fff", border: "none", fontWeight: "800", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.transform="scale(1.05)"} onMouseOut={e => e.currentTarget.style.transform="scale(1)"}>SEND</button>
                  </form>
                </>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "40px" }}>💬</div>
                  <div style={{ fontSize: "16px", fontWeight: "700" }}>Select a friend to start chatting</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Requests View */}
        {activeView === "requests" && (
          <div>
            {incomingRequests.length > 0 ? (
              <>
                <div className="cv4-section-line" style={{ color: "var(--neon-orange)" }}>
                  <span>⚡ {incomingRequests.length} PENDING</span>
                </div>
                {incomingRequests.map(user => (
                  <Row key={user.username} user={user} action={
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="cv4-accept-btn" onClick={(e) => handleRespond(e, user.username, "accept")}>ACCEPT</button>
                      <button className="cv4-deny-btn" onClick={(e) => handleRespond(e, user.username, "reject")}>DECLINE</button>
                    </div>
                  } />
                ))}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>📩</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-light)", fontFamily: "var(--font-outfit)", marginBottom: "6px" }}>No pending requests</div>
                <div style={{ fontSize: "13px", fontWeight: "500" }}>When someone sends you a friend request, it will show up here.</div>
              </div>
            )}
          </div>
        )}

        {/* Squad View */}
        {activeView === "squad" && (
          <div>
            {friends.length > 0 ? (
              <>
                <div className="cv4-section-line">
                  <span>MY SQUAD · {friends.length}</span>
                </div>
                {friends.map(user => (
                  <Row key={user.username} user={user} action={
                    <button className="cv4-message-btn" onClick={(e) => { 
                      e.stopPropagation(); 
                      sound.playClockTick();
                      setActiveChatUser(user.username);
                      setActiveView("messages");
                    }}>
                      MESSAGE
                    </button>
                  } />
                ))}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🤝</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-light)", fontFamily: "var(--font-outfit)", marginBottom: "6px" }}>No allies yet</div>
                <div style={{ fontSize: "13px", fontWeight: "500" }}>Add players from the Discover tab and build your squad.</div>
              </div>
            )}
          </div>
        )}

        {/* Discover View */}
        {activeView === "discover" && <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div className="cv4-section-line" style={{ marginBottom: 0, flex: "none" }}>
              <span>DISCOVER PLAYERS</span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <select className="cv4-filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="level_high">↓ Highest Level</option>
                <option value="level_low">↑ Lowest Level</option>
                <option value="wins">🏆 Most Wins</option>
              </select>
              <form onSubmit={handleFilterSearch} style={{ display: "flex", gap: "6px" }}>
                <input className="cv4-search-input" type="text" placeholder="Search username..." value={filterQuery} onChange={(e) => setFilterQuery(e.target.value)} />
                <button className="cv4-search-btn" type="submit">SEARCH</button>
              </form>
            </div>
          </div>

          {paginatedDiscover.map((user, idx) => (
            <Row 
              key={user.username} 
              user={user} 
              index={(currentPage - 1) * itemsPerPage + idx + 1}
              action={
                sentThisSession.includes(user.username) 
                  ? <span className="cv4-sent-badge">SENT ✓</span>
                  : <button className="cv4-add-btn" onClick={(e) => handleSendRequest(e, user.username)}>ADD</button>
              } 
            />
          ))}

          {discoverUsers.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "50px 0", color: "var(--text-muted)", fontSize: "14px" }}>
              No players found.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginTop: "32px", paddingTop: "20px", borderTop: "1px solid var(--glass-border)" }}>
              <button className="cv4-page-btn" disabled={currentPage === 1} onClick={() => { sound.playClockTick(); setCurrentPage(p => p - 1); }}>← PREV</button>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {Array.from({ length: Math.min(totalPages, 12) }).map((_, i) => (
                  <div key={i} style={{
                    width: "7px", height: "7px", borderRadius: "50%",
                    background: currentPage === i + 1 ? "var(--neon-orange)" : "var(--glass-border)",
                    transition: "all 0.2s",
                    boxShadow: currentPage === i + 1 ? "0 0 8px rgba(255,106,0,0.4)" : "none",
                    transform: currentPage === i + 1 ? "scale(1.3)" : "scale(1)",
                    cursor: "pointer"
                  }} onClick={() => { sound.playClockTick(); setCurrentPage(i + 1); }} />
                ))}
              </div>
              <button className="cv4-page-btn" disabled={currentPage === totalPages} onClick={() => { sound.playClockTick(); setCurrentPage(p => p + 1); }}>NEXT →</button>
            </div>
          )}
        </div>}
      </div>

      {/* Profile Modal */}
      {selectedProfileUser && (
        <div className="cv4-modal-overlay" onClick={() => { sound.playClockTick(); setSelectedProfileUser(null); }}>
          <div className="cv4-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="cv4-close-btn" onClick={() => { sound.playClockTick(); setSelectedProfileUser(null); }}>✕</button>
            <div style={{ padding: "32px" }}>
              <ProfilePanel username={selectedProfileUser} selectedClass={null} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
