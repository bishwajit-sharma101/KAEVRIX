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
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState("");
  const itemsPerPage = 8;
  
  // Chat & Presence State
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef(null);

  const filteredFriendsForSidebar = useMemo(() => {
    return friends.filter(f => f.username.toLowerCase().includes(sidebarSearchQuery.toLowerCase()));
  }, [friends, sidebarSearchQuery]);

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
      fetch(`${backendUrl}/api/chat/messages/${username}/${activeChatUser}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}` }
      })
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
      const res = await fetch(`${backendUrl}/api/community/friends/${username}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setIncomingRequests(data.incomingRequests || []);
      }
    } catch (err) { console.error("Error fetching friends:", err); }
  };

  const fetchDiscoverUsers = async (filter = "") => {
    try {
      const res = await fetch(`${backendUrl}/api/community/discover/${username}?filter=${encodeURIComponent(filter)}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}` }
      });
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

  // Listen for real-time friend updates
  useEffect(() => {
    if (!socket) return;
    
    const handleFriendUpdate = (data) => {
      // Reload friends list when a request is received or accepted
      fetchFriendsData();
      if (data && data.sender) {
        // Optionally show a small toast here if a toast system exists
        console.log(`Friend update from ${data.sender}`);
      }
    };

    socket.on("receive_friend_request", handleFriendUpdate);
    socket.on("friend_request_accepted", handleFriendUpdate);

    return () => {
      socket.off("receive_friend_request", handleFriendUpdate);
      socket.off("friend_request_accepted", handleFriendUpdate);
    };
  }, [socket, username, backendUrl]);

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
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`
        },
        body: JSON.stringify({ fromUser: username, toUser })
      });
      if (res.ok) {
        setSentThisSession(prev => [...prev, toUser]);
        sound.playLevelUp();
        if (socket) {
          socket.emit("send_friend_request", { sender: username, receiver: toUser });
        }
      }
    } catch (err) { console.error("Send request failed", err); }
  };

  const handleRespond = async (e, fromUser, action) => {
    e.stopPropagation();
    sound.playClockTick();
    try {
      const res = await fetch(`${backendUrl}/api/community/respond`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`
        },
        body: JSON.stringify({ username, fromUser, action })
      });
      if (res.ok) {
        if (action === "accept") {
          sound.playLevelUp();
          if (socket) {
            socket.emit("respond_friend_request", { sender: username, receiver: fromUser, action: "accept" });
          }
        }
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
    let s = document.getElementById(id);
    if (s) {
      s.remove();
    }
    s = document.createElement("style");
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
        margin: 8px 0;
        position: relative;
        flex-wrap: wrap;
        background: var(--bg-dark-surface);
        border: 1px solid var(--glass-border);
      }
      .cv4-row-info {
        width: 140px;
        flex-shrink: 0;
      }
      .cv4-row-mid {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 24px;
        min-width: 0;
      }
      .cv4-row-action {
        flex-shrink: 0;
        margin-left: auto;
      }
      .cv4-stat-desktop {
        display: block;
      }
      .cv4-filter-bar {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .cv4-search-form {
        display: flex;
        gap: 6px;
      }
      @media (max-width: 768px) {
        .cv4-row {
          padding: 12px;
          margin: 6px 0;
          gap: 12px;
        }
        .cv4-row-info {
          flex: 1 1 auto;
          width: auto;
          min-width: 100px;
        }
        .cv4-row-mid {
          flex: 0 0 100% !important;
          width: 100% !important;
          order: 3;
          margin-top: 8px;
          gap: 12px;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255, 106, 0, 0.03);
          border-radius: 8px;
          border: 1px solid rgba(255, 106, 0, 0.08);
        }
        .cv4-stat-desktop {
          display: none !important;
        }
        .cv4-add-btn {
          padding: 8px 16px;
        }
        
        /* Mobile DM Split to Single View Layout */
        .cv4-chat-back-btn {
          display: flex !important;
        }
        .cv4-chat-container .cv4-chat-sidebar {
          display: flex;
          width: 100% !important;
          border-right: none !important;
        }
        .cv4-chat-container .cv4-chat-area {
          display: none;
        }
        .cv4-chat-container.cv4-chat-has-active .cv4-chat-sidebar {
          display: none;
        }
        .cv4-chat-container.cv4-chat-has-active .cv4-chat-area {
          display: flex;
          width: 100% !important;
        }
      }
      @media (max-width: 600px) {
        .cv4-filter-bar {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          width: 100% !important;
          gap: 8px !important;
          align-items: center !important;
        }
        .cv4-filter-select {
          width: 42px !important;
          flex: 0 0 42px !important;
        }
        .cv4-search-form {
          flex: 1 1 auto;
          display: flex;
          gap: 6px;
        }
        .cv4-search-input {
          flex: 1;
          min-width: 0;
        }
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
      @media (max-width: 600px) {
        .cv4-tab-bar {
          overflow-x: auto;
          flex-wrap: nowrap !important;
          -webkit-overflow-scrolling: touch;
          gap: 0;
          padding-bottom: 2px;
          margin-bottom: 24px;
        }
        .cv4-tab-bar::-webkit-scrollbar {
          display: none;
        }
        .cv4-tab {
          padding: 10px 16px !important;
          flex-shrink: 0;
        }
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
        width: 42px;
        height: 38px;
        border-radius: 10px;
        border: 1px solid var(--glass-border);
        background: var(--bg-dark-surface) no-repeat center;
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23ff6a00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>');
        color: transparent !important;
        text-indent: -9999px;
        overflow: hidden;
        cursor: pointer;
        outline: none;
        flex-shrink: 0;
        appearance: none;
        -webkit-appearance: none;
        transition: all 0.2s;
      }
      .cv4-filter-select option {
        color: #ffffff !important;
        background: #140d0a !important;
        text-indent: 0;
        font-size: 13px;
      }
      .cv4-filter-select:hover,
      .cv4-filter-select:focus {
        border-color: var(--neon-orange);
        box-shadow: 0 0 8px rgba(255, 106, 0, 0.25);
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
      
      /* Modern DM Styling */
      .cv4-chat-container {
        display: flex;
        height: 65vh;
        background: rgba(10, 15, 30, 0.45);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: 20px;
        border: 1px solid var(--glass-border);
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      }
      .cv4-chat-sidebar {
        width: 280px;
        border-right: 1px solid var(--glass-border);
        display: flex;
        flex-direction: column;
        background: rgba(4, 8, 16, 0.35);
      }
      .cv4-chat-sidebar-header {
        padding: 20px 16px;
        border-bottom: 1px solid var(--glass-border);
      }
      .cv4-chat-sidebar-title {
        font-size: 11px;
        font-weight: 900;
        color: var(--neon-orange);
        font-family: var(--font-gamer);
        letter-spacing: 2px;
        text-shadow: 0 0 10px rgba(255, 106, 0, 0.35);
      }
      .cv4-chat-contact-search {
        margin-top: 12px;
        position: relative;
      }
      .cv4-chat-contact-search input {
        width: 100%;
        padding: 8px 12px 8px 30px;
        border-radius: 8px;
        border: 1px solid var(--glass-border);
        background: rgba(0, 0, 0, 0.25);
        color: var(--text-light);
        font-size: 12px;
        outline: none;
        transition: all 0.2s ease;
      }
      .cv4-chat-contact-search input:focus {
        border-color: var(--neon-orange);
        box-shadow: 0 0 8px rgba(255,106,0,0.15);
      }
      .cv4-chat-contact-search::before {
        content: '🔍';
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 11px;
        opacity: 0.5;
      }
      .cv4-contact-list {
        flex: 1;
        overflow-y: auto;
        padding: 12px 8px;
      }
      .cv4-contact-list::-webkit-scrollbar {
        width: 4px;
      }
      .cv4-contact-list::-webkit-scrollbar-thumb {
        background: rgba(255,106,0,0.15);
        border-radius: 2px;
      }
      .cv4-contact-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        margin-bottom: 4px;
        border: 1px solid transparent;
      }
      .cv4-contact-item:hover {
        background: rgba(255, 106, 0, 0.04);
        transform: translateX(2px);
      }
      .cv4-contact-item-active {
        background: linear-gradient(90deg, rgba(255, 106, 0, 0.12) 0%, rgba(255, 106, 0, 0.02) 100%);
        border-color: rgba(255, 106, 0, 0.25);
        box-shadow: 0 4px 15px rgba(255,106,0,0.05);
      }
      .cv4-contact-item-active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 15%;
        height: 70%;
        width: 3px;
        background: var(--accent-gradient);
        border-radius: 0 3px 3px 0;
        box-shadow: 0 0 10px var(--neon-orange);
      }
      .cv4-chat-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: rgba(6, 10, 20, 0.15);
      }
      .cv4-chat-header {
        padding: 16px 24px;
        border-bottom: 1px solid var(--glass-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(10, 15, 30, 0.2);
        backdrop-filter: blur(10px);
      }
      .cv4-chat-header-user {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .cv4-chat-back-btn {
        display: none !important;
      }
      .cv4-chat-header-name {
        font-size: 16px;
        font-weight: 800;
        color: var(--text-light);
        font-family: var(--font-outfit);
        letter-spacing: 0.5px;
      }
      .cv4-chat-header-badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1px;
        font-family: var(--font-gamer);
      }
      .cv4-chat-scroller {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .cv4-chat-scroller::-webkit-scrollbar {
        width: 6px;
      }
      .cv4-chat-scroller::-webkit-scrollbar-track {
        background: transparent;
      }
      .cv4-chat-scroller::-webkit-scrollbar-thumb {
        background: rgba(255,106,0,0.15);
        border-radius: 3px;
      }
      .cv4-chat-scroller::-webkit-scrollbar-thumb:hover {
        background: rgba(255,106,0,0.3);
      }
      .cv4-msg-wrapper {
        display: flex;
        flex-direction: column;
        max-width: 68%;
        animation: cv4SlideInMsg 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      @keyframes cv4SlideInMsg {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .cv4-msg-wrapper-me {
        align-self: flex-end;
        align-items: flex-end;
      }
      .cv4-msg-wrapper-other {
        align-self: flex-start;
        align-items: flex-start;
      }
      .cv4-msg-bubble {
        padding: 12px 18px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.45;
        font-family: var(--font-sans);
        font-weight: 500;
        word-break: break-word;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        position: relative;
        transition: all 0.2s ease;
      }
      .cv4-msg-bubble-me {
        background: var(--accent-gradient);
        color: #fff;
        border-bottom-right-radius: 4px;
        box-shadow: 0 4px 15px rgba(255,106,0,0.2);
      }
      .cv4-msg-bubble-other {
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-light);
        border: 1px solid var(--glass-border);
        border-bottom-left-radius: 4px;
      }
      .cv4-msg-meta {
        font-size: 10px;
        color: var(--text-muted);
        margin-top: 5px;
        font-weight: 700;
        font-family: var(--font-gamer);
        letter-spacing: 0.5px;
        opacity: 0.75;
      }
      .cv4-chat-form {
        padding: 18px 24px;
        border-top: 1px solid var(--glass-border);
        display: flex;
        gap: 12px;
        background: rgba(10, 15, 30, 0.1);
        align-items: center;
      }
      .cv4-chat-form-input-wrapper {
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;
      }
      .cv4-chat-form-input {
        width: 100%;
        padding: 14px 20px;
        border-radius: 30px;
        border: 1px solid var(--glass-border);
        background: rgba(0, 0, 0, 0.35);
        color: var(--text-light);
        outline: none;
        font-size: 14px;
        font-family: var(--font-sans);
        font-weight: 500;
        transition: all 0.3s ease;
      }
      .cv4-chat-form-input:focus {
        border-color: var(--neon-orange);
        background: rgba(0, 0, 0, 0.5);
        box-shadow: 0 0 15px rgba(255, 106, 0, 0.12), inset 0 2px 4px rgba(0,0,0,0.5);
      }
      .cv4-chat-send-btn {
        height: 48px;
        padding: 0 26px;
        border-radius: 24px;
        background: var(--accent-gradient);
        color: #fff;
        border: none;
        font-family: var(--font-gamer);
        font-weight: 900;
        font-size: 12px;
        letter-spacing: 1.5px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 15px rgba(255,106,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .cv4-chat-send-btn:hover:not(:disabled) {
        transform: translateY(-2px) scale(1.03);
        box-shadow: 0 6px 20px rgba(255,106,0,0.45);
      }
      .cv4-chat-send-btn:active:not(:disabled) {
        transform: translateY(0) scale(0.98);
      }
      .cv4-chat-send-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        box-shadow: none;
      }
      .cv4-chat-empty-state {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        flex-direction: column;
        gap: 16px;
        background: radial-gradient(circle at center, rgba(255,106,0,0.02) 0%, transparent 70%);
      }
      .cv4-chat-empty-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: rgba(255,106,0,0.06);
        border: 2px dashed rgba(255,106,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        animation: cv4PulseIcon 2s ease infinite alternate;
        box-shadow: inset 0 0 15px rgba(255,106,0,0.05);
      }
      @keyframes cv4PulseIcon {
        0% { transform: scale(0.96); box-shadow: 0 0 10px transparent, inset 0 0 15px rgba(255,106,0,0.05); }
        100% { transform: scale(1.04); border-color: rgba(255,106,0,0.4); box-shadow: 0 0 20px rgba(255,106,0,0.1), inset 0 0 15px rgba(255,106,0,0.1); }
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
      <div className="cv4-row-info">
        <div className="cv4-username" style={{ fontWeight: "700", color: "var(--text-light)", fontSize: "15px", fontFamily: "var(--font-outfit)", letterSpacing: "0.2px" }}>
          {user.username}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", fontWeight: "600" }}>
          {getRankTitle(user.level)}
        </div>
      </div>
      {/* Mid section: Level badge + XP bar + Win Rate */}
      <div className="cv4-row-mid">
        {/* Level Badge */}
        <div style={{
          background: "var(--accent-gradient)", borderRadius: "6px", padding: "4px 12px",
          fontSize: "11px", fontWeight: "900", color: "#fff", fontFamily: "var(--font-gamer)",
          letterSpacing: "1px", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(255,106,0,0.2)"
        }}>
          LVL {user.level}
        </div>
        {/* XP Progress Bar */}
        <div className="cv4-stat-desktop" style={{ flex: 1, minWidth: "80px", maxWidth: "200px" }}>
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
      <div className="cv4-row-action" onClick={e => e.stopPropagation()}>
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
      <div style={{ padding: 0 }}>
        
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
          <div className={`cv4-chat-container ${activeChatUser ? "cv4-chat-has-active" : ""}`}>
            {/* Friends Sidebar */}
            <div className="cv4-chat-sidebar">
              <div className="cv4-chat-sidebar-header">
                <div className="cv4-chat-sidebar-title">SECURE COMMUNICATIONS</div>
                <div className="cv4-chat-sidebar-title" style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px", fontWeight: "500", textShadow: "none" }}>DIRECT MESSAGES</div>
                <div className="cv4-chat-contact-search">
                  <input 
                    type="text" 
                    placeholder="Search squad..." 
                    value={sidebarSearchQuery} 
                    onChange={e => setSidebarSearchQuery(e.target.value)} 
                  />
                </div>
              </div>
              <div className="cv4-contact-list">
                {filteredFriendsForSidebar.length > 0 ? filteredFriendsForSidebar.map(user => {
                  const isActive = activeChatUser === user.username;
                  return (
                    <div key={user.username} 
                      onClick={() => { sound.playClockTick(); setActiveChatUser(user.username); }}
                      className={`cv4-contact-item ${isActive ? "cv4-contact-item-active" : ""}`}
                    >
                      <div className="cv4-avatar" style={{ width: "34px", height: "34px" }}>
                        <div className="cv4-avatar-ring" style={{ borderColor: isActive ? "var(--neon-orange)" : "var(--glass-border)" }} />
                        {user.avatar && user.avatar.includes('http') ? (
                          <img src={user.avatar} alt="" />
                        ) : (
                          <div style={{width:"100%",height:"100%",background:"rgba(255,106,0,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}>👤</div>
                        )}
                        <div className={`cv4-status-dot ${onlineUsers.has(user.username) ? 'cv4-status-online' : 'cv4-status-offline'}`} style={{ width: "9px", height: "9px", bottom: 0, right: 0 }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <div style={{ 
                          fontSize: "14px", 
                          fontWeight: "700", 
                          color: isActive ? "var(--neon-orange)" : "var(--text-light)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}>
                          {user.username}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", marginTop: "1px" }}>
                          LVL {user.level} {getRankTitle(user.level).split(" ")[0]}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", padding: "12px", textAlign: "center" }}>
                    {friends.length > 0 ? "No matching contacts found." : "No friends in squad to message."}
                  </div>
                )}
              </div>
            </div>
            {/* Chat Area */}
            <div className="cv4-chat-area">
              {activeChatUser ? (
                <>
                  {/* Chat Header */}
                  {(() => {
                    const activeUserObj = friends.find(f => f.username === activeChatUser);
                    return (
                      <div className="cv4-chat-header">
                        <div className="cv4-chat-header-user" style={{ display: "flex", alignItems: "center" }}>
                          <button 
                            className="cv4-chat-back-btn" 
                            onClick={(e) => { e.stopPropagation(); sound.playClockTick(); setActiveChatUser(null); }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--neon-orange)",
                              cursor: "pointer",
                              padding: "0 12px 0 0",
                              fontSize: "18px",
                              alignItems: "center"
                            }}
                          >
                            ◀
                          </button>
                          <div className="cv4-avatar" style={{ width: "36px", height: "36px", marginRight: "12px" }}>
                            <div className="cv4-avatar-ring" style={{ borderColor: "var(--neon-orange)" }} />
                            {activeUserObj?.avatar && activeUserObj.avatar.includes('http') ? (
                              <img src={activeUserObj.avatar} alt="" />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", background: "rgba(255,106,0,0.08)" }}>👤</div>
                            )}
                            <div className={`cv4-status-dot ${onlineUsers.has(activeChatUser) ? 'cv4-status-online' : 'cv4-status-offline'}`} style={{ width: "9px", height: "9px", bottom: 0, right: 0 }} />
                          </div>
                          <div>
                            <div className="cv4-chat-header-name">@{activeChatUser}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", marginTop: "1px" }}>
                              {activeUserObj ? `${getRankTitle(activeUserObj.level)} · Level ${activeUserObj.level}` : "Squad Member"}
                            </div>
                          </div>
                        </div>
                        <div>
                          {onlineUsers.has(activeChatUser) ? (
                            <span className="cv4-chat-header-badge" style={{ background: "rgba(16,185,129,0.08)", color: "var(--neon-green)", border: "1px solid rgba(16,185,129,0.15)" }}>ONLINE</span>
                          ) : (
                            <span className="cv4-chat-header-badge" style={{ background: "rgba(255,255,255,0.02)", color: "var(--text-muted)", border: "1px solid var(--glass-border)" }}>OFFLINE</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  {/* Message Stream */}
                  <div ref={chatScrollRef} className="cv4-chat-scroller">
                    {chatMessages.length === 0 ? (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", opacity: 0.6, color: "var(--text-muted)", fontSize: "12px", fontFamily: "var(--font-gamer)", letterSpacing: "1px" }}>
                        <span>⚡ SECURE CORRELATION TUNNEL ACTIVE. GREET @{activeChatUser.toUpperCase()}!</span>
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => {
                        const isMe = msg.sender === username;
                        return (
                          <div key={i} className={`cv4-msg-wrapper ${isMe ? 'cv4-msg-wrapper-me' : 'cv4-msg-wrapper-other'}`}>
                            <div className={`cv4-msg-bubble ${isMe ? 'cv4-msg-bubble-me' : 'cv4-msg-bubble-other'}`}>
                              {msg.content}
                            </div>
                            <div className="cv4-msg-meta">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {/* Send Input */}
                  <form onSubmit={handleSendDm} className="cv4-chat-form">
                    <div className="cv4-chat-form-input-wrapper">
                      <input 
                        type="text" 
                        value={chatInput} 
                        onChange={e => setChatInput(e.target.value)} 
                        placeholder={`Transmit secure message to @${activeChatUser}...`} 
                        className="cv4-chat-form-input" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="cv4-chat-send-btn"
                      disabled={!chatInput.trim()}
                    >
                      SEND ⚡
                    </button>
                  </form>
                </>
              ) : (
                <div className="cv4-chat-empty-state">
                  <div className="cv4-chat-empty-icon">💬</div>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-light)", fontFamily: "var(--font-outfit)", letterSpacing: "0.2px" }}>Neural Comms Interface</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "280px", textAlign: "center", fontWeight: "500", lineHeight: 1.4 }}>
                    Select an allied player from your squad sidebar to establish a secure messaging tunnel.
                  </div>
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
            <div className="cv4-filter-bar">
              <select className="cv4-filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="level_high">↓ Highest Level</option>
                <option value="level_low">↑ Lowest Level</option>
                <option value="wins">🏆 Most Wins</option>
              </select>
              <form onSubmit={handleFilterSearch} className="cv4-search-form">
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
