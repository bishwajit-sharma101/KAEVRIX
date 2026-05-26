import { useState, useEffect, useRef, useMemo } from "react";

/* ─── TRACK DATA ──────────────────────────────────────────────── */

const TRACKS = [
  {
    src: "/motivation.mpeg",
    segments: [
      { start: 0, end: 3900, words: ["PEOPLE", "ARE", "NOTHING", "BUT", "TOOLS", "TO", "ME."], style: "quote", size: "lg" },
      { start: 3900, end: 5500, words: ["ALL", "OF", "THEM."], style: "impact", size: "xl" },
      { start: 5500, end: 9000, words: ["I", "DON'T", "CARE", "WHAT", "I", "HAVE", "TO", "DO", "TO", "WIN."], style: "quote", size: "md" },
      { start: 9000, end: 12800, words: ["I", "DON'T", "CARE", "WHAT", "I", "HAVE", "TO", "SACRIFICE."], style: "quote", size: "md" },
      { start: 12800, end: 17500, words: ["IN", "THIS", "WORLD,", "WINNING", "IS", "EVERYTHING."], style: "proclamation", size: "lg" },
      { start: 17500, end: 21500, words: ["AND", "IN", "THE", "END", "I AM", "GOING", "TO", "WIN..."], style: "whisper", size: "md" },
      { start: 21500, end: 25000, words: ["...THAT'S", "ALL", "THAT", "MATTERS."], style: "whisper", size: "lg" },
      { start: 25000, end: 28500, words: ["SURPASS", "YOUR", "LIMITS."], style: "limitbreak", size: "hero" },
      { start: 28500, end: 32000, words: ["FOCUS.", "CONQUER."], style: "limitbreak", size: "hero" },
      { start: 32000, end: 34032, words: ["GO", "DOMINATE."], style: "limitbreak", size: "hero" },
    ],
    beatDrop: 25000,
  },
  {
    src: "/motivation2.mp3",
    segments: [
      { start: 0, end: 2400, words: ["DON'T", "YOU", "DARE", "GIVE", "UP", "AGAIN."], style: "rage", size: "lg" },
      { start: 2400, end: 5820, words: ["ALL", "YOU'VE", "DONE", "IS", "GIVE", "UP", "INSTEAD", "OF", "FACING", "YOUR", "PROBLEMS."], style: "quote", size: "md" },
      { start: 5820, end: 10360, words: ["YOU", "LOCKED", "US", "AWAY", "AND", "HID", "IN", "THE", "DARKNESS", "BECAUSE", "IT", "WAS", "THE", "EASIEST", "THING", "TO", "DO."], style: "whisper", size: "md" },
      { start: 10360, end: 17280, words: ["AND", "NOW,", "AFTER", "ALL", "YOU", "DID,", "YOU'RE", "ACTING", "LIKE", "THIS", "JUST", "BECAUSE", "YOU", "MADE", "A", "MISTAKE", "THAT", "YOU", "CAN'T", "FIX?"], style: "quote", size: "md" },
      { start: 17280, end: 19840, words: ["THIS", "DOESN'T", "MEAN", "YOU'RE", "ALLOWED", "TO", "RUN", "AWAY", "AND", "CRY!"], style: "impact", size: "lg" },
      { start: 20640, end: 24680, words: ["THINK", "ABOUT", "IT.", "YOU", "HAD", "THE", "GUTS", "TO", "MAKE", "EVERYTHING", "ELSE", "HAPPEN,", "RIGHT?"], style: "proclamation", size: "lg" },
      { start: 25160, end: 27160, words: ["YOU", "DID", "THAT."], style: "impact", size: "xl" },
      { start: 27160, end: 31320, words: ["MAYBE", "YOU", "WEREN'T", "CHOSEN,", "MAYBE", "NO", "ONE", "WANTED", "YOU,", "AND", "MAYBE", "YOU", "CAN'T", "BE", "FORGIVEN."], style: "whisper", size: "lg" },
      { start: 31320, end: 36000, words: ["BUT", "YOU", "STILL", "HAVE", "TO", "STAND", "YOUR", "GROUND", "WITHOUT", "MAKING", "EXCUSES", "FOR", "YOURSELF!"], style: "limitbreak", size: "hero" },
    ],
    beatDrop: 31320,
  },
  {
    src: "/motivation3.mp3",
    segments: [
      { start: 0, end: 7000, words: ["VICTORY", "DOESN'T", "COME", "TO", "THE", "STRONGEST,", "FASTEST,", "OR", "SMARTEST."], style: "proclamation", size: "lg" },
      { start: 8000, end: 14000, words: ["IT", "COMES", "TO", "THOSE", "WHO", "DO", "ANYTHING", "TO", "ACHIEVE", "IT."], style: "limitbreak", size: "hero" },
    ],
    beatDrop: 8000,
  },
  {
    src: "/motivation4.mp3",
    segments: [
      { start: 0, end: 2500, words: ["WHAT", "ARE", "YOU", "DOING?"], style: "rage", size: "xl" },
      { start: 3000, end: 7000, words: ["WHY", "ARE", "YOU", "STILL", "HOLDING", "BACK?"], style: "quote", size: "lg" },
      { start: 8000, end: 11000, words: ["HAVE", "YOU", "FORGOTTEN", "WHAT", "THEY", "SAID","TO","US"], style: "whisper", size: "lg" },
      { start: 11000, end: 12500, words: ["WHAT", "THEY", "DID?"], style: "impact", size: "xl" },
      { start: 12500, end: 14500, words: ["THEY", "THINK", "YOU'RE A", "MONSTER."], style: "rage", size: "lg" },
      { start: 15000, end: 17500, words: ["PROVE", "THEM.", "RIGHT."], style: "command", size: "xl" },
      { start: 18000, end: 19500, words: ["FIGHT!"], style: "limitbreak", size: "hero" },
      { start: 19500, end: 26000, words: ["OR", "BE", "FORGOTTEN."], style: "limitbreak", size: "hero" },
    ],
    beatDrop: 18000,
  },
];

/* ─── STYLE CONFIG ────────────────────────────────────────────── */

const FONT = {
  quote: "'Cinzel', serif",
  impact: "'Bebas Neue', sans-serif",
  proclamation: "'Cinzel', serif",
  whisper: "'Cinzel', serif",
  limitbreak: "'Bebas Neue', sans-serif",
  rage: "'Bebas Neue', sans-serif",
  command: "'Bebas Neue', sans-serif",
};

const FONT_SIZE = {
  sm: "clamp(18px, 2.5vw, 28px)",
  md: "clamp(24px, 3.5vw, 44px)",
  lg: "clamp(32px, 5vw, 62px)",
  xl: "clamp(48px, 8vw, 90px)",
  hero: "clamp(60px, 12vw, 140px)",
};

const LETTER_SPACING = {
  quote: "0.22em",
  impact: "0.08em",
  proclamation: "0.28em",
  whisper: "0.35em",
  limitbreak: "0.06em",
  rage: "0.05em",
  command: "0.04em",
};

const MOOD_BG = {
  quote: "#06121e",
  impact: "#111",
  rage: "#250000",
  proclamation: "#1a1000",
  whisper: "#0c0016",
  limitbreak: "#201000",
  command: "#1f0000",
};

/* ─── COMPONENT ───────────────────────────────────────────────── */

export default function SurpassLimits({ onClose }) {
  const [trackIdx] = useState(() => Math.floor(Math.random() * TRACKS.length));
  const [currentTime, setCurrentTime] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const audioRef = useRef(null);
  const lastSegStartRef = useRef(-1);

  const track = TRACKS[trackIdx];

  // Pre-compute random ember positions once
  const embers = useMemo(() =>
    Array.from({ length: 28 }, () => ({
      left: `${4 + Math.random() * 92}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 4.5}s`,
      w: 2 + Math.random() * 4,
      opacity: 0.2 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 100,
    }))
  , []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 1.0;
      audio.play().catch(() => {});
    }
    return () => {
      clearTimeout(t);
      if (audio) { audio.pause(); audio.currentTime = 0; }
    };
  }, []);

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const currentMs = currentTime * 1000;
  const segment = track.segments.find(s => currentMs >= s.start && currentMs < s.end);
  const isBeatDrop = currentMs >= track.beatDrop;
  const isFlash = currentMs >= track.beatDrop - 200 && currentMs < track.beatDrop + 500;

  // Fire transition flash on hard-hitting segment entries
  useEffect(() => {
    if (segment && segment.start !== lastSegStartRef.current) {
      const wasNew = lastSegStartRef.current !== -1;
      lastSegStartRef.current = segment.start;
      if (wasNew && (segment.style === "impact" || segment.style === "rage" || segment.style === "command" || segment.style === "limitbreak")) {
        setFlashKey(k => k + 1);
      }
    }
  }, [segment]);

  const wordDelay = (seg) => {
    const dur = (seg.end - seg.start) / 1000;
    return Math.min(0.5, (dur * 0.55) / seg.words.length);
  };

  const isIntense = segment && (segment.style === "rage" || segment.style === "impact" || segment.style === "command");
  const moodColor = segment ? (MOOD_BG[segment.style] || "#000") : "#000";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Bebas+Neue&display=swap');

        /* ── ROOT ────────────────────── */
        .sl-root {
          position: fixed; inset: 0;
          background: #000;
          z-index: 99999;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          flex-direction: column;
        }

        /* ── MOOD GLOW ───────────────── */
        .sl-mood {
          position: absolute; inset: 0; z-index: 2;
          pointer-events: none;
          transition: background-color 1.8s ease;
        }

        /* ── VIGNETTE ────────────────── */
        .sl-vignette {
          position: absolute; inset: 0; z-index: 5;
          pointer-events: none;
          background: radial-gradient(ellipse at center,
            transparent 35%,
            rgba(0,0,0,0.85) 100%
          );
          transition: all 0.8s ease;
        }
        .sl-vignette.beat {
          background: radial-gradient(ellipse at center,
            transparent 25%,
            rgba(180,10,10,0.5) 70%,
            rgba(0,0,0,0.95) 100%
          );
        }

        /* ── GRAIN ───────────────────── */
        .sl-grain {
          position: absolute; inset: 0; z-index: 8;
          pointer-events: none; opacity: 0.045;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* ── SCAN LINES ──────────────── */
        .sl-scanlines {
          position: absolute; inset: 0; z-index: 7;
          pointer-events: none; opacity: 0.06;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.35) 2px,
            rgba(0,0,0,0.35) 4px
          );
        }

        /* ── SPEED LINES (BEAT DROP) ── */
        .sl-speedlines {
          position: absolute;
          inset: -50%; z-index: 3;
          pointer-events: none;
          opacity: 0;
          transition: opacity 1.2s ease;
          background: repeating-conic-gradient(
            transparent 0deg,
            rgba(255,255,255,0.012) 0.8deg,
            transparent 1.6deg,
            transparent 5deg
          );
          animation: speedSpin 40s linear infinite;
        }
        .sl-speedlines.active {
          opacity: 1;
        }
        @keyframes speedSpin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* ── EMBERS ──────────────────── */
        .sl-ember {
          position: absolute; bottom: -10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,120,20,0.9), rgba(255,50,0,0.2));
          z-index: 6; pointer-events: none;
          animation: emberFloat var(--dur) ease-out infinite;
          animation-delay: var(--delay);
          opacity: 0;
          box-shadow: 0 0 6px rgba(255,100,10,0.4);
        }
        .sl-root.beat-active .sl-ember {
          background: radial-gradient(circle, rgba(255,70,10,1), rgba(255,20,0,0.5));
          box-shadow: 0 0 12px rgba(255,50,0,0.7);
        }
        @keyframes emberFloat {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: var(--op); }
          80%  { opacity: calc(var(--op) * 0.5); }
          100% { transform: translateY(-105vh) translateX(var(--drift)) scale(0.2); opacity: 0; }
        }

        /* ── FLASH ───────────────────── */
        .sl-flash {
          position: absolute; inset: 0; z-index: 35;
          pointer-events: none;
          background: #fff;
          animation: flashBang 0.6s ease-out forwards;
        }
        @keyframes flashBang {
          0%   { opacity: 0.9; }
          100% { opacity: 0; }
        }

        /* ── TRANSITION FLASH (per-segment) */
        .sl-seg-flash {
          position: absolute; inset: 0; z-index: 34;
          pointer-events: none;
          animation: segFlash 0.4s ease-out forwards;
        }
        @keyframes segFlash {
          0%   { opacity: 0.6; }
          100% { opacity: 0; }
        }

        /* ── EXIT BUTTON ─────────────── */
        .sl-exit {
          position: absolute; top: 32px; right: 32px; z-index: 50;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.35);
          font-family: 'Cinzel', serif;
          font-size: 10px; letter-spacing: 3px;
          padding: 10px 22px; border-radius: 4px;
          cursor: pointer; transition: all 0.35s ease;
        }
        .sl-exit:hover {
          color: #fff;
          border-color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.05);
        }

        /* ── STAGE ───────────────────── */
        .sl-stage {
          position: relative; z-index: 15;
          width: 100%; padding: 0 6vw;
          text-align: center;
          display: flex; flex-direction: column;
          align-items: center; gap: 0;
        }

        /* Screen shake for intense segments */
        .sl-stage.sl-shake {
          animation: screenShake 0.45s ease-out;
        }
        @keyframes screenShake {
          0%   { transform: translate(0,0); }
          10%  { transform: translate(-6px, 3px); }
          20%  { transform: translate(5px, -4px); }
          30%  { transform: translate(-4px, 5px); }
          40%  { transform: translate(6px, -2px); }
          50%  { transform: translate(-3px, 4px); }
          60%  { transform: translate(4px, -3px); }
          70%  { transform: translate(-2px, 2px); }
          80%  { transform: translate(1px, -1px); }
          100% { transform: translate(0,0); }
        }

        /* ── HEARTBEAT PULSE (intense) ── */
        .sl-root.heartbeat {
          animation: heartbeat 1.1s ease-in-out infinite;
        }
        @keyframes heartbeat {
          0%, 100% { filter: brightness(1); }
          15%  { filter: brightness(1.15); }
          30%  { filter: brightness(1); }
          45%  { filter: brightness(1.07); }
        }

        /* ─── WORD ANIMATIONS ──────────── */

        /* Shared base for all words */
        .sl-word {
          display: inline-block;
          opacity: 0;
          margin: 0 0.12em;
          white-space: nowrap;
          animation-fill-mode: forwards;
        }

        /* Quote — gentle rise from below */
        .style-quote .sl-word { animation: wordRise 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes wordRise {
          0%   { opacity: 0; transform: translateY(35px); filter: blur(4px); }
          50%  { opacity: 0.8; filter: blur(0); }
          70%  { opacity: 1; transform: translateY(-3px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* Impact — hard slam with overshoot */
        .style-impact .sl-word { animation: wordSlam 0.35s cubic-bezier(0.13,0.98,0.47,1.12) forwards; }
        @keyframes wordSlam {
          0%   { opacity: 0; transform: scale(2) translateY(-15px); }
          60%  { opacity: 1; transform: scale(0.92) translateY(3px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Rage — aggressive drop from above */
        .style-rage .sl-word { animation: wordRage 0.38s cubic-bezier(0.17,0.67,0.42,1.18) forwards; }
        @keyframes wordRage {
          0%   { opacity: 0; transform: translateY(-50px) scaleY(1.3); }
          45%  { opacity: 1; transform: translateY(6px) scaleY(0.95); }
          70%  { transform: translateY(-2px) scaleY(1.02); }
          100% { opacity: 1; transform: translateY(0) scaleY(1); }
        }

        /* Proclamation — majestic scale-up */
        .style-proclamation .sl-word { animation: wordMajestic 0.95s ease-out forwards; }
        @keyframes wordMajestic {
          0%   { opacity: 0; transform: scale(0.55); letter-spacing: 0.6em; }
          60%  { opacity: 0.9; }
          100% { opacity: 1; transform: scale(1); letter-spacing: inherit; }
        }

        /* Whisper — ethereal slow fade */
        .style-whisper .sl-word { animation: wordFade 1.3s ease forwards; }
        @keyframes wordFade {
          0%   { opacity: 0; transform: translateY(8px); filter: blur(3px); }
          100% { opacity: 0.85; transform: translateY(0); filter: blur(0); }
        }

        /* Limitbreak — glitch entrance */
        .style-limitbreak .sl-word { animation: wordGlitch 0.55s ease-out forwards; }
        @keyframes wordGlitch {
          0%   { opacity: 0; transform: translateX(-15px) skewX(-8deg); filter: blur(6px); }
          25%  { opacity: 0.8; transform: translateX(8px) skewX(4deg); filter: blur(0); }
          45%  { opacity: 0.5; transform: translateX(-4px) skewX(-2deg); }
          65%  { opacity: 0.95; transform: translateX(2px) skewX(1deg); }
          100% { opacity: 1; transform: translateX(0) skewX(0); filter: blur(0); }
        }

        /* Command — fast zoom punch */
        .style-command .sl-word { animation: wordZoom 0.3s cubic-bezier(0.13,0.98,0.42,1) forwards; }
        @keyframes wordZoom {
          0%   { opacity: 0; transform: scale(3); filter: blur(8px); }
          50%  { opacity: 0.9; filter: blur(0); }
          70%  { transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* ─── TEXT COLOR STYLES ─────────── */

        .style-quote .sl-line-text {
          font-weight: 400;
          color: rgba(220, 215, 205, 0.95);
          text-shadow: 0 1px 30px rgba(100,160,255,0.12), 0 0 60px rgba(60,100,180,0.08);
        }

        .style-impact .sl-line-text {
          color: #ffffff;
          text-shadow:
            0 0 20px rgba(255,255,255,0.5),
            0 0 60px rgba(255,255,255,0.2),
            0 4px 30px rgba(0,0,0,0.6);
        }

        .style-rage .sl-line-text {
          color: #fff;
          text-shadow:
            0 0 15px rgba(255,30,0,0.7),
            0 0 50px rgba(200,0,0,0.4),
            0 2px 25px rgba(0,0,0,0.5);
        }

        .style-proclamation .sl-line-text {
          font-weight: 700;
          color: #f5e2b8;
          text-shadow:
            0 0 50px rgba(200,150,40,0.45),
            0 0 120px rgba(180,120,20,0.2);
        }

        .style-whisper .sl-line-text {
          font-weight: 400;
          color: rgba(180,170,200,0.75);
          text-shadow: 0 0 40px rgba(120,80,180,0.15);
        }

        .style-limitbreak .sl-line-text {
          color: #ffffff;
          text-shadow:
            0 0 30px rgba(255,160,30,0.7),
            0 0 80px rgba(255,100,0,0.45),
            0 0 160px rgba(255,60,0,0.25),
            0 4px 20px rgba(0,0,0,0.4);
        }

        .style-command .sl-line-text {
          color: #ff3a00;
          text-shadow:
            0 0 25px rgba(255,50,0,0.7),
            0 0 70px rgba(255,20,0,0.4),
            0 0 140px rgba(200,0,0,0.2);
        }

        /* ── UNDERLINE RULE ──────────── */
        .sl-rule {
          width: 0; height: 1px;
          background: rgba(255,255,255,0.3);
          margin-top: 20px;
          animation: ruleDraw 0.9s ease-out forwards;
        }
        @keyframes ruleDraw {
          from { width: 0; opacity: 0; }
          to   { width: 55%; opacity: 1; }
        }

        .style-impact .sl-rule      { background: rgba(255,255,255,0.55); height: 2px; }
        .style-rage .sl-rule         { background: rgba(255,40,0,0.45); height: 2px; }
        .style-proclamation .sl-rule { background: rgba(200,160,60,0.45); }
        .style-whisper .sl-rule      { opacity: 0.25; }
        .style-command .sl-rule      { background: rgba(255,50,0,0.5); height: 2px; }
        .style-limitbreak .sl-rule   {
          background: linear-gradient(90deg, transparent, rgba(255,160,30,0.65), transparent);
          height: 2px;
        }

        /* ── CHROMATIC ABERRATION (limitbreak text) ── */
        .style-limitbreak .sl-line-text {
          position: relative;
        }
        .style-limitbreak .sl-chromatic {
          position: absolute; inset: 0;
          pointer-events: none; z-index: -1;
          opacity: 0.15;
          animation: chromaShift 0.12s steps(2) infinite;
        }
        @keyframes chromaShift {
          0%   { transform: translate(-2px, 0); filter: hue-rotate(90deg); }
          50%  { transform: translate(2px, 0); filter: hue-rotate(-90deg); }
          100% { transform: translate(-1px, 1px); filter: hue-rotate(180deg); }
        }
      `}</style>

      <div className={`sl-root ${mounted ? "mounted" : ""} ${isBeatDrop ? "beat-active" : ""} ${isIntense || isBeatDrop ? "heartbeat" : ""}`}>

        {/* Mood glow */}
        <div className="sl-mood" style={{ backgroundColor: moodColor }} />

        {/* Grain noise */}
        <div className="sl-grain" />

        {/* Scan lines */}
        <div className="sl-scanlines" />

        {/* Speed lines (visible during beat drop) */}
        <div className={`sl-speedlines ${isBeatDrop ? "active" : ""}`} />

        {/* Vignette */}
        <div className={`sl-vignette ${isBeatDrop ? "beat" : ""}`} />

        {/* Floating embers */}
        {embers.map((e, i) => (
          <div
            key={i}
            className="sl-ember"
            style={{
              left: e.left,
              width: `${e.w}px`,
              height: `${e.w}px`,
              "--delay": e.delay,
              "--dur": e.duration,
              "--op": e.opacity,
              "--drift": `${e.drift}px`,
            }}
          />
        ))}

        {/* Beat-drop white flash */}
        {isFlash && <div className="sl-flash" />}

        {/* Per-segment transition flash */}
        {flashKey > 0 && <div key={flashKey} className="sl-seg-flash" style={{ background: segment?.style === "rage" ? "rgba(255,20,0,0.35)" : segment?.style === "command" ? "rgba(255,40,0,0.3)" : "rgba(255,255,255,0.3)" }} />}

        {/* Exit */}
        <button className="sl-exit" onClick={onClose}>✕ &nbsp; EXIT</button>

        {/* Audio */}
        <audio
          ref={audioRef}
          src={track.src}
          onTimeUpdate={handleTimeUpdate}
          onEnded={onClose}
          style={{ display: "none" }}
          autoPlay
        />

        {/* Main stage */}
        {segment && (
          <div
            key={segment.start}
            className={`sl-stage style-${segment.style} ${isIntense ? "sl-shake" : ""}`}
          >
            {/* Words row */}
            <div
              className="sl-line-text"
              style={{
                fontFamily: FONT[segment.style],
                fontSize: FONT_SIZE[segment.size],
                letterSpacing: LETTER_SPACING[segment.style],
                lineHeight: 1.15,
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "0",
                position: "relative",
              }}
            >
              {/* Chromatic aberration layer for limitbreak */}
              {segment.style === "limitbreak" && (
                <div className="sl-chromatic" style={{
                  fontFamily: FONT[segment.style],
                  fontSize: FONT_SIZE[segment.size],
                  letterSpacing: LETTER_SPACING[segment.style],
                  lineHeight: 1.15,
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  color: "#fff",
                }}>
                  {segment.words.map((w, i) => (
                    <span key={i} className="sl-word" style={{
                      animationDelay: `${i * wordDelay(segment)}s`,
                      margin: "0 0.12em",
                    }}>{w}</span>
                  ))}
                </div>
              )}

              {segment.words.map((word, i) => (
                <span
                  key={i}
                  className="sl-word"
                  style={{
                    animationDelay: `${i * wordDelay(segment)}s`,
                  }}
                >
                  {word}
                </span>
              ))}
            </div>

            {/* Underline rule */}
            <div
              className="sl-rule"
              style={{
                animationDelay: `${segment.words.length * wordDelay(segment) + 0.15}s`,
                animationFillMode: "both",
                opacity: 0,
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
