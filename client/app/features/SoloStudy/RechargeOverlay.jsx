import { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   PREMIUM RECHARGE OVERLAY — Cinematic break experience (Audio Fixed)
   ═══════════════════════════════════════════════════════════════ */

const RECHARGE_DURATION = 240; // 4 minutes

const SONG_CATALOG = [
  { file: "/songs/song13.mp3", category: "AURA" },
  { file: "/songs/song6.mp3", category: "AURA" },
  { file: "/songs/song11.mp3", category: "AURA" },
  { file: "/songs/song2.mp3", category: "CHILL" },
  { file: "/songs/song10.mp3", category: "CHILL" },
  { file: "/songs/song12.mp3", category: "CHILL" },
  { file: "/songs/song14.mp3", category: "CHILL" },
  { file: "/songs/song3.mp3", category: "FOCUS" },
  { file: "/songs/song4.mp3", category: "FOCUS" },
  { file: "/songs/song1.mp3", category: "FOCUS" },
  { file: "/songs/song7.mp3", category: "FOCUS" },
  { file: "/songs/song5.mp3", category: "ENERGIZE" },
  { file: "/songs/song15.mp3", category: "ENERGIZE" },
  { file: "/songs/song9.mp3", category: "ENERGIZE" },
  { file: "/songs/song8.mp3", category: "ENERGIZE" },
];

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function RechargeOverlay({ onComplete }) {
  const [elapsed, setElapsed] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Music state - completely randomized
  const [playlist] = useState(() => shuffleArray(SONG_CATALOG));
  const [currentIdx, setCurrentIdx] = useState(0);
  const audioRef = useRef(null);
  
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentSong = playlist[currentIdx];
  const remaining = Math.max(0, RECHARGE_DURATION - elapsed);
  const progressPercent = Math.min(1, elapsed / RECHARGE_DURATION);

  // Mount animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => {
        if (prev >= RECHARGE_DURATION) {
          clearInterval(interval);
          return RECHARGE_DURATION;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-complete
  useEffect(() => {
    if (elapsed >= RECHARGE_DURATION) {
      const t = setTimeout(() => onComplete(), 1000);
      return () => clearTimeout(t);
    }
  }, [elapsed, onComplete]);

  // Audio player logic (Standard Audio, No Web Audio API)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    
    audio.src = currentSong.file;
    audio.volume = 0.65;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setNeedsInteraction(false);
        setIsPlaying(true);
      }).catch(() => {
        console.warn("Autoplay blocked");
        setNeedsInteraction(true);
        setIsPlaying(false);
      });
    }

    const onEnded = () => {
      setCurrentIdx(prev => (prev + 1) % playlist.length);
    };

    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [currentIdx, currentSong, playlist.length]);

  // Cleanup audio
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const handleUserInteraction = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setNeedsInteraction(false);
        setIsPlaying(true);
      }).catch(() => {});
    }
  }, []);

  const handleSkipSong = useCallback(() => {
    setCurrentIdx(prev => (prev + 1) % playlist.length);
    setNeedsInteraction(false);
  }, [playlist.length]);

  const handleExit = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onComplete();
  }, [onComplete]);

  // Visuals
  const catColor = {
    AURA: { c1: "#7c3aed", c2: "#4c1d95" },
    CHILL: { c1: "#0ea5e9", c2: "#0369a1" },
    FOCUS: { c1: "#f59e0b", c2: "#b45309" },
    ENERGIZE: { c1: "#ef4444", c2: "#991b1b" },
  };
  const colors = catColor[currentSong?.category] || catColor.AURA;

  // Background particles
  const particles = useMemo(() =>
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 8,
      delay: Math.random() * 10,
      duration: 10 + Math.random() * 10,
    }))
  , []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@400;700;900&display=swap');

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes textReveal {
          from { opacity: 0; transform: translateY(20px); letter-spacing: 0.1em; }
          to { opacity: 1; transform: translateY(0); letter-spacing: 0.15em; }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes drift {
          0% { transform: translate(0,0) rotate(0deg); opacity: 0; }
          20% { opacity: 0.3; }
          80% { opacity: 0.3; }
          100% { transform: translate(calc(var(--dx) * 1px), calc(var(--dy) * 1px)) rotate(180deg); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(255,255,255,0.2); }
          50% { text-shadow: 0 0 40px rgba(255,255,255,0.6), 0 0 80px var(--glow-color); }
        }
        /* CSS-based heartbeat for feelable rhythm */
        @keyframes beatPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          20% { transform: scale(1.05); opacity: 1; }
        }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#030303",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        animation: mounted ? "fadeIn 2s ease-out forwards" : "none",
        opacity: 0,
      }}>
        <audio ref={audioRef} />

        {/* Needs Interaction Overlay */}
        {needsInteraction && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 10000,
            background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <button onClick={handleUserInteraction} style={{
              padding: "20px 40px", fontSize: "24px", fontWeight: "900", fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "4px", background: "transparent", color: "#fff",
              border: "2px solid #fff", cursor: "pointer", borderRadius: "8px",
              boxShadow: "0 0 40px rgba(255,255,255,0.2)", transition: "all 0.3s"
            }}
            onMouseOver={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}
            onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#fff"; }}>
              START BREAK // SYNC AUDIO
            </button>
          </div>
        )}

        {/* Ambient colored glow based on song category */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${colors.c1}33 0%, ${colors.c2}11 50%, transparent 80%)`,
          animation: isPlaying ? "beatPulse 2s ease-in-out infinite" : "none",
          transition: "background 3s ease",
        }} />

        {/* Massive scrolling background text */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "40vw",
          color: `${colors.c1}22`,
          WebkitTextStroke: `4px ${colors.c1}66`,
          opacity: 0,
          filter: "blur(6px)",
          pointerEvents: "none",
          animation: "fadeIn 4s ease-out forwards",
          transition: "all 3s ease",
        }}>
          {currentSong?.category} {currentSong?.category}
        </div>

        {/* Slow moving ambient particles */}
        {particles.map((p, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${p.x}%`, top: `${p.y}%`,
            width: `${p.size}px`, height: `${p.size}px`,
            background: colors.c1,
            borderRadius: "50%",
            filter: "blur(4px)",
            opacity: 0,
            animation: `drift ${p.duration}s linear ${p.delay}s infinite`,
            "--dx": (Math.random() - 0.5) * 400,
            "--dy": (Math.random() - 0.5) * 400,
            transition: "background 3s ease",
          }} />
        ))}

        {/* Top Controls (Subtle) */}
        <div style={{
          position: "absolute", top: "40px", width: "100%", padding: "0 60px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontFamily: "'Inter', sans-serif", zIndex: 20,
        }}>
          {/* Skip Song Button */}
          <button onClick={handleSkipSong} style={{
            background: "transparent", border: "none", color: "rgba(255,255,255,0.3)",
            fontSize: "12px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase",
            cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", gap: "8px"
          }}
          onMouseOver={e => e.currentTarget.style.color = "#fff"}
          onMouseOut={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="4,3 16,12 4,21" />
              <rect x="17" y="3" width="3" height="18" rx="1" />
            </svg>
            CHANGE VIBE
          </button>

          {/* End Break Button */}
          <button onClick={handleExit} style={{
            background: "transparent", border: "none", color: "rgba(255,255,255,0.3)",
            fontSize: "12px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase",
            cursor: "pointer", transition: "all 0.3s"
          }}
          onMouseOver={e => e.currentTarget.style.color = "#fff"}
          onMouseOut={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}>
            END BREAK ✕
          </button>
        </div>

        {/* ═══ KINETIC TYPOGRAPHY ═══ */}
        <div style={{
          position: "relative", zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", width: "100%", overflow: "hidden",
        }}>
          
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "14px", fontWeight: "700", color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.6em", textTransform: "uppercase", marginBottom: "20px",
            animation: "textReveal 1.5s cubic-bezier(0.2, 1, 0.3, 1) 0.5s both"
          }}>
            SYSTEM PAUSED
          </div>

          {/* Massive Main Text */}
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(80px, 15vw, 180px)",
            lineHeight: "0.85", color: "#ffffff",
            letterSpacing: "0.05em",
            animation: "textReveal 2s cubic-bezier(0.2, 1, 0.3, 1) 0.4s both",
            textShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 40px ${colors.c1}88`,
          }}>
            <div style={{ animation: isPlaying ? "beatPulse 2s ease-out infinite" : "none" }}>
              TIME TO<br />RECHARGE.
            </div>
          </div>

          {/* The minimal countdown timer */}
          <div style={{
            marginTop: "40px",
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "64px", color: "rgba(255,255,255,0.9)",
            letterSpacing: "0.1em",
            animation: "textReveal 2s cubic-bezier(0.2, 1, 0.3, 1) 1.1s both, pulseGlow 4s infinite",
            "--glow-color": colors.c1,
            transition: "color 3s ease",
          }}>
            {formatTime(remaining)}
          </div>

        </div>

        {/* Bottom Vibe Indicator */}
        <div style={{
          position: "absolute", bottom: "60px", width: "100%",
          display: "flex", justifyContent: "center", zIndex: 10,
        }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "16px", fontWeight: "900", color: colors.c1,
            letterSpacing: "0.4em", textTransform: "uppercase",
            background: `linear-gradient(90deg, transparent, ${colors.c1}33, transparent)`,
            padding: "10px 60px",
            animation: "fadeIn 3s ease-out 2s both",
            transition: "all 3s ease",
          }}>
            VIBE: {currentSong?.category}
          </div>
        </div>

        {/* Very subtle progress bar at the absolute bottom of the screen */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, height: "3px",
          background: colors.c1,
          width: `${progressPercent * 100}%`,
          transition: "width 1s linear, background 3s ease",
          boxShadow: `0 0 10px ${colors.c1}`,
          zIndex: 20
        }} />

      </div>
    </>
  );
}
