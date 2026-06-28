import { useState, useEffect, useLayoutEffect, useRef } from "react";
import * as sound from "../../utils/audio";
import { CHARACTER_CLASSES } from "../../utils/characterClasses";

const BACKEND_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=transparent`;

import { CLASS_COLORS, CLASS_ICONS, CLASS_STATS, PATHFINDER_QUESTIONS, RETRO_TIPS } from "../../utils/authConstants";

export function useWelcomeState({
  onAuthSuccess,
  isDarkMode,
  setIsDarkMode,
  isMusicMuted,
  setIsMusicMuted,
  musicProfile,
  setMusicProfile,
  keepMusicInGame,
  setKeepMusicInGame
}) {
  // Theme styling toggle state: "workspace" or "retro-game"
  const [portalStyle, setPortalStyle] = useState(() => localStorage.getItem("kaevrix_portal_style") || "workspace");
  const [showMusicSettings, setShowMusicSettings] = useState(false);
  
  const [authMode, setAuthMode] = useState("menu"); // menu, signin, signup
  const [retroShowForm, setRetroShowForm] = useState(false);
  const [retroTipIdx, setRetroTipIdx] = useState(0);



  useEffect(() => {
    const tipInterval = setInterval(() => {
      setRetroTipIdx(prev => (prev + 1) % RETRO_TIPS.length);
    }, 6000);
    
  return { /* TODO: all state */ };
}