import { useState, useEffect } from "react";

export default function DailyLogin({ day, xp, level, wins, losses, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    // Stage-wise animations
    const t1 = setTimeout(() => setMounted(true), 50);
    const t2 = setTimeout(() => setShowStats(true), 800);
    
    // Play Elden Ring style boom sound
    playEldenBoom();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const playEldenBoom = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // 1. Deep Sub Bass Rumble (Impact)
      const oscSub = ctx.createOscillator();
      const gainSub = ctx.createGain();
      const filterSub = ctx.createBiquadFilter();
      
      oscSub.type = "sawtooth";
      oscSub.frequency.setValueAtTime(45, ctx.currentTime); // Deep F#1
      oscSub.frequency.linearRampToValueAtTime(30, ctx.currentTime + 1.8);
      
      filterSub.type = "lowpass";
      filterSub.frequency.setValueAtTime(90, ctx.currentTime);
      filterSub.Q.setValueAtTime(4, ctx.currentTime);
      
      gainSub.gain.setValueAtTime(0.35, ctx.currentTime);
      gainSub.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      
      oscSub.connect(filterSub);
      filterSub.connect(gainSub);
      gainSub.connect(ctx.destination);
      
      oscSub.start();
      oscSub.stop(ctx.currentTime + 2.1);
      
      // 2. Mid drone chord (Resonating pad)
      const droneNotes = [90, 135, 180]; // F#2, C#3, F#3
      droneNotes.forEach((freq) => {
        const oscD = ctx.createOscillator();
        const gainD = ctx.createGain();
        const filterD = ctx.createBiquadFilter();
        
        oscD.type = "triangle";
        oscD.frequency.setValueAtTime(freq, ctx.currentTime);
        
        filterD.type = "lowpass";
        filterD.frequency.setValueAtTime(250, ctx.currentTime);
        
        gainD.gain.setValueAtTime(0.05, ctx.currentTime);
        gainD.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
        
        oscD.connect(filterD);
        filterD.connect(gainD);
        gainD.connect(ctx.destination);
        
        oscD.start();
        oscD.stop(ctx.currentTime + 2.6);
      });
      
      // 3. Shimmering high bells (Grace discovery shimmer)
      const shimmerNotes = [739.99, 1109.73, 1479.98, 2217.46]; // F#5, C#6, F#6, C#7
      shimmerNotes.forEach((freq, idx) => {
        const oscS = ctx.createOscillator();
        const gainS = ctx.createGain();
        
        oscS.type = "sine";
        oscS.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
        
        gainS.gain.setValueAtTime(0.015, ctx.currentTime + idx * 0.05);
        gainS.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 2.2);
        
        oscS.connect(gainS);
        gainS.connect(ctx.destination);
        
        oscS.start(ctx.currentTime + idx * 0.05);
        oscS.stop(ctx.currentTime + idx * 0.05 + 2.3);
      });
      
    } catch (e) {
      console.error("Failed to play epic welcome sound:", e);
    }
  };

  const getDayTitle = (d) => {
    if (d === 1) return "JOURNEY INITIATED";
    if (d === 2) return "RECONSTRUCTING LIMITS";
    if (d === 3) return "RISING POTENTIAL";
    if (d === 4) return "UNSTABLE POWER";
    if (d === 5) return "COGNITIVE BREAKTHROUGH";
    if (d === 6) return "SURPASSING ASCENSION";
    return "GODLIKE PERSISTENCE";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;700;900&family=Cinzel+Decorative:wght@700&family=Montserrat:wght@300;400;600&display=swap');

        .er-overlay {
          position: fixed;
          inset: 0;
          z-index: 100000;
          background: rgba(0, 0, 0, 0.94);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          opacity: 0;
          transition: opacity 1.2s ease;
          font-family: 'Cinzel', serif;
        }

        .er-overlay.mounted {
          opacity: 1;
        }

        /* ── Elden Ring Particles ── */
        .er-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .er-particle {
          position: absolute;
          background: radial-gradient(circle, rgba(234, 179, 8, 0.6) 0%, transparent 80%);
          border-radius: 50%;
          animation: erRise var(--dur) ease-in-out infinite;
          opacity: 0;
        }

        @keyframes erRise {
          0% { transform: translateY(105vh) translateX(0) scale(0.6); opacity: 0; }
          15% { opacity: var(--op); }
          85% { opacity: var(--op); }
          100% { transform: translateY(-5vh) translateX(var(--drift)) scale(0.1); opacity: 0; }
        }

        /* ── Content Wrapper ── */
        .er-wrapper {
          position: relative;
          z-index: 5;
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0 4vw;
        }

        /* ── Elden Gold Line ── */
        .er-line {
          width: 0%;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(212, 175, 55, 0.08) 15%,
            rgba(212, 175, 55, 0.9) 50%, 
            rgba(212, 175, 55, 0.08) 85%,
            transparent 100%
          );
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.35);
          transition: width 1.8s cubic-bezier(.25,.8,.25,1);
          margin: 25px 0;
        }

        .er-overlay.mounted .er-line {
          width: 95%;
        }

        /* ── Announcement Text ── */
        .er-subheader {
          font-size: clamp(10px, 1.5vw, 13px);
          letter-spacing: 0.45em;
          color: rgba(212, 175, 55, 0.85);
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(10px);
          transition: all 1.2s ease 0.4s;
          text-shadow: 0 0 8px rgba(212, 175, 55, 0.2);
        }

        .er-title {
          font-family: 'Cinzel Decorative', serif;
          font-size: clamp(65px, 9vw, 105px);
          font-weight: 700;
          color: #f7ebd0;
          letter-spacing: 0.1em;
          line-height: 1;
          margin: 0;
          opacity: 0;
          transform: scale(0.92);
          transition: all 2.2s cubic-bezier(.16,1,.3,1) 0.1s;
          text-shadow: 0 0 35px rgba(212, 175, 55, 0.18);
        }

        .er-overlay.mounted .er-subheader {
          opacity: 1;
          transform: translateY(0);
        }

        .er-overlay.mounted .er-title {
          opacity: 1;
          transform: scale(1);
        }

        /* ── Character Stats Card ── */
        .er-stats-box {
          width: 100%;
          max-width: 440px;
          background: rgba(8, 8, 10, 0.75);
          border: 1px solid rgba(212, 175, 55, 0.12);
          padding: 24px 30px;
          border-radius: 4px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 1.2s ease 0.2s;
          box-shadow: 0 10px 40px rgba(0,0,0,0.8);
          margin-top: 15px;
        }

        .er-stats-box.visible {
          opacity: 0.95;
          transform: translateY(0);
        }

        .er-stats-header {
          font-size: 11px;
          letter-spacing: 0.2em;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
          border-bottom: 1px solid rgba(212, 175, 55, 0.15);
          padding-bottom: 8px;
          margin-bottom: 14px;
          font-weight: 700;
        }

        .er-stat-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          font-size: 12px;
          letter-spacing: 0.08em;
        }

        .er-stat-label {
          color: rgba(255, 255, 255, 0.55);
        }

        .er-stat-val {
          color: #f7ebd0;
          font-weight: 700;
        }

        .er-stat-val.gold {
          color: #d4af37;
          text-shadow: 0 0 6px rgba(212,175,55,0.3);
        }

        /* ── Dismiss Button ── */
        .er-btn {
          margin-top: 40px;
          background: transparent;
          border: 1px solid rgba(212, 175, 55, 0.4);
          color: rgba(212, 175, 55, 0.9);
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 0.35em;
          padding: 14px 48px;
          cursor: pointer;
          transition: all 0.6s ease;
          opacity: 0;
          transform: translateY(10px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }

        .er-stats-box.visible + .er-btn {
          opacity: 1;
          transform: translateY(0);
        }

        .er-btn:hover {
          color: #ffffff;
          border-color: rgba(212, 175, 55, 0.95);
          background: rgba(212, 175, 55, 0.08);
          box-shadow: 0 0 25px rgba(212, 175, 55, 0.25);
        }
      `}</style>

      <div className={`er-overlay ${mounted ? "mounted" : ""}`}>
        {/* Floating gold grace dust */}
        <div className="er-particles">
          {Array.from({ length: 18 }).map((_, i) => {
            const size = 3 + Math.random() * 5;
            const left = `${5 + Math.random() * 90}%`;
            const delay = `${Math.random() * 6}s`;
            const duration = `${6 + Math.random() * 8}s`;
            const drift = `${(Math.random() - 0.5) * 150}px`;
            const opacity = 0.25 + Math.random() * 0.55;
            return (
              <div 
                key={i} 
                className="er-particle" 
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left,
                  animationDelay: delay,
                  animationDuration: duration,
                  "--dur": duration,
                  "--drift": drift,
                  "--op": opacity
                }}
              />
            );
          })}
        </div>

        <div className="er-wrapper">
          <div className="er-subheader">{getDayTitle(day)}</div>
          <div className="er-line" />
          <h1 className="er-title">DAY {day}</h1>
          <div className="er-line" />

          {/* Character status details */}
          <div className={`er-stats-box ${showStats ? "visible" : ""}`}>
            <div className="er-stats-header">STAT DETAILS</div>
            <div className="er-stat-row">
              <span className="er-stat-label">OPERATOR ALIAS</span>
              <span className="er-stat-val">{xp !== undefined ? "ACTIVE" : "CONNECTED"}</span>
            </div>
            <div className="er-stat-row">
              <span className="er-stat-label">COGNITIVE LEVEL</span>
              <span className="er-stat-val gold">LVL {level}</span>
            </div>
            <div className="er-stat-row">
              <span className="er-stat-label">EXPERIENCE (XP)</span>
              <span className="er-stat-val">{xp}</span>
            </div>
            <div className="er-stat-row">
              <span className="er-stat-label">ARENA RECORD</span>
              <span className="er-stat-val">{wins} W / {losses} L</span>
            </div>
          </div>

          <button className="er-btn" onClick={onClose}>
            BEGIN JOURNEY
          </button>
        </div>
      </div>
    </>
  );
}
