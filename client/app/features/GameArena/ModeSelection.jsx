import React, { useState, useEffect } from "react";
import * as sound from "../../utils/audio";

const DOORS = [
  {
    id: "solo",
    title: "Sanctum",
    desc: "Master the content at your own pace with AI-generated notes.",
    icon: "🎓",
    themeColor: "#4f46e5",
    glowColor: "rgba(79,70,229,0.4)",
    fogColor: "rgba(79,70,229,0.6)",
    isLocked: false
  },
  {
    id: "match",
    title: "Clash",
    desc: "Face off against a real opponent in a live knowledge battle.",
    icon: "⚔️",
    themeColor: "#ea580c",
    glowColor: "rgba(234,88,12,0.4)",
    fogColor: "rgba(234,88,12,0.6)",
    isLocked: false
  },
  {
    id: "social",
    title: "Gathering",
    desc: "Connect with other scholars, form guilds, and trade notes.",
    icon: "🤝",
    themeColor: "#10b981", // Emerald
    glowColor: "rgba(16,185,129,0.4)",
    fogColor: "rgba(16,185,129,0.6)",
    isLocked: true
  },
  {
    id: "crucible",
    title: "The Crucible",
    desc: "Survive the ultimate gauntlet. High stakes, high rewards.",
    icon: "💀",
    themeColor: "#dc2626", // Blood Red
    glowColor: "rgba(220,38,38,0.5)",
    fogColor: "rgba(220,38,38,0.7)",
    isLocked: true
  }
];

export default function ModeSelection({ isDarkMode, video, onStartSoloStudy, onStartMatchmaking, onBack }) {
  const [hoveredDoor, setHoveredDoor] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSelect = (door) => {
    if (door.isLocked) {
      sound.playGlitch && sound.playGlitch();
      return;
    }
    sound.playClockTick();
    if (door.id === "solo") {
      onStartSoloStudy(video);
    } else if (door.id === "match") {
      onStartMatchmaking();
    }
  };

  const bgBase = "#050505";
  const activeDoor = DOORS.find(d => d.id === hoveredDoor);
  
  return (
    <div style={{
      position: "fixed", 
      inset: 0, 
      zIndex: 1000,
      background: bgBase,
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: isMobile ? "flex-start" : "center",
      padding: isMobile ? "100px 20px 40px 20px" : "0px",
      fontFamily: "'Cinzel', 'Playfair Display', serif",
      opacity: mounted ? 1 : 0,
      transition: "opacity 1.5s ease-in-out",
      overflowY: isMobile ? "auto" : "hidden"
    }}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&display=swap');
        
        .ds-door-container {
          position: relative;
          width: 250px;
          height: 480px;
          cursor: pointer;
          perspective: 1000px;
          transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .ds-door-container:hover {
          transform: scale(1.03);
        }
        
        .ds-door-frame {
          position: absolute;
          inset: 0;
          border-radius: 125px 125px 0 0;
          background: #111;
          border: 4px solid #2a2a2a;
          border-bottom: none;
          box-shadow: 
            inset 0 0 30px rgba(0,0,0,0.9),
            inset 0 0 60px rgba(0,0,0,0.8),
            0 15px 40px rgba(0,0,0,0.9);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.5s ease;
        }

        .ds-door-fog {
          position: absolute;
          inset: 0;
          opacity: 0.7;
          background-size: cover;
          filter: blur(8px);
          transition: opacity 1s ease, transform 3s ease;
          transform: scale(1.1);
        }

        .ds-door-container:hover .ds-door-fog {
          opacity: 0.3;
          transform: scale(1.3);
        }

        .ds-door-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          opacity: 0.9;
          transition: all 0.5s ease;
          padding: 20px;
        }

        .ds-door-container:hover .ds-door-content {
          opacity: 1;
          transform: translateY(-6px);
        }

        .ds-door-title {
          font-family: 'Cinzel', serif;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 12px;
          text-shadow: 0 4px 10px rgba(0,0,0,0.9);
          transition: color 0.4s ease;
        }

        .ds-door-desc {
          font-family: 'sans-serif';
          font-size: 11px;
          line-height: 1.5;
          color: rgba(255,255,255,0.75);
          text-transform: uppercase;
          letter-spacing: 1px;
          max-width: 95%;
          opacity: 0.8;
          transform: translateY(0);
          transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .ds-door-container:hover .ds-door-desc {
          opacity: 1;
          color: #ffffff;
        }

        .ds-locked-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 20;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 125px 125px 0 0;
          backdrop-filter: blur(4px);
          transition: all 0.3s ease;
        }

        .ds-door-container:hover .ds-locked-overlay {
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(2px);
        }

        .ds-locked-text {
          font-family: 'Cinzel', serif;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 4px;
          color: #ef4444;
          text-transform: uppercase;
          text-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
          margin-top: 15px;
        }

        .ds-ember {
          position: absolute;
          border-radius: 50%;
          animation: floatEmber 4s infinite linear;
          opacity: 0;
        }

        @keyframes floatEmber {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-80px) scale(0.5); opacity: 0; }
        }

        .ds-ambient-glow {
          position: absolute;
          width: 800px;
          height: 800px;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.15;
          pointer-events: none;
          transition: all 1s ease;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        @media (max-width: 768px) {
          .ds-door-container {
            width: 200px !important;
            height: 380px !important;
          }
          .ds-door-frame {
            border-radius: 100px 100px 0 0 !important;
            border-width: 3px !important;
          }
          .ds-locked-overlay {
            border-radius: 100px 100px 0 0 !important;
          }
          .ds-door-title {
            font-size: 16px !important;
            letter-spacing: 2px !important;
          }
          .ds-door-desc {
            font-size: 10px !important;
            line-height: 1.4 !important;
            max-width: 90% !important;
          }
        }
      `}</style>

      {/* Dynamic Background Glow based on hover */}
      <div className="ds-ambient-glow" style={{
        background: activeDoor ? `radial-gradient(circle, ${activeDoor.glowColor} 0%, transparent 70%)` : "transparent"
      }} />

      {/* Top Header */}
      <div style={{
        position: isMobile ? "fixed" : "absolute", 
        top: isMobile ? "0px" : "40px", 
        left: "0", 
        right: "0",
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: isMobile ? "20px 24px" : "0 60px",
        background: isMobile ? "rgba(5, 5, 5, 0.85)" : "transparent",
        backdropFilter: isMobile ? "blur(10px)" : "none",
        borderBottom: isMobile ? "1px solid rgba(255,255,255,0.05)" : "none",
        zIndex: 100
      }}>
        <button
          onClick={() => { sound.playClockTick(); onBack(); }}
          style={{
            background: "transparent", border: "none", color: "rgba(255,255,255,0.7)",
            fontFamily: "'Cinzel', serif", fontSize: "14px", fontWeight: "700", cursor: "pointer", 
            textTransform: "uppercase", letterSpacing: "3px",
            transition: "color 0.3s, text-shadow 0.3s"
          }}
          onMouseOver={e => {
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.textShadow = "0 0 10px rgba(255,255,255,0.5)";
          }}
          onMouseOut={e => {
            e.currentTarget.style.color = "rgba(255,255,255,0.7)";
            e.currentTarget.style.textShadow = "none";
          }}
        >
          Return
        </button>
      </div>

      {/* Cinematic Title */}
      <div style={{
        textAlign: "center", 
        marginTop: isMobile ? "20px" : "0px",
        marginBottom: isMobile ? "30px" : "60px", 
        zIndex: 20,
        transform: mounted ? "translateY(0)" : "translateY(-20px)",
        transition: "all 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s"
      }}>
        <h1 style={{
          fontFamily: "'Cinzel', serif", 
          fontSize: isMobile ? "28px" : "42px", 
          fontWeight: "400", 
          color: "#e2e8f0",
          letterSpacing: isMobile ? "4px" : "8px", 
          textTransform: "uppercase",
          textShadow: "0 4px 20px rgba(0,0,0,1)", 
          margin: 0
        }}>
          Choose Your Path
        </h1>
      </div>

      {/* The Giant Doors Grid */}
      <div style={{
        display: "flex", 
        gap: isMobile ? "24px" : "40px", 
        zIndex: 20, 
        flexWrap: "wrap", 
        justifyContent: "center",
        maxWidth: "1300px", 
        margin: "0 auto",
        transform: mounted ? "translateY(0)" : "translateY(40px)",
        opacity: mounted ? 1 : 0,
        transition: "all 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.6s"
      }}>
        
        {DOORS.map((door) => {
          const isHovered = hoveredDoor === door.id;
          
          return (
            <div 
              key={door.id}
              className="ds-door-container"
              onClick={() => handleSelect(door)}
              onMouseEnter={() => setHoveredDoor(door.id)}
              onMouseLeave={() => setHoveredDoor(null)}
              style={door.isLocked ? { cursor: "not-allowed" } : {}}
            >
              <div className="ds-door-frame" style={{
                borderColor: isHovered ? door.themeColor : "#2a2a2a",
                boxShadow: isHovered 
                  ? `inset 0 0 60px ${door.glowColor}, inset 0 0 20px rgba(0,0,0,0.9), 0 20px 60px rgba(0,0,0,0.8)`
                  : "inset 0 0 30px rgba(0,0,0,0.9), inset 0 0 60px rgba(0,0,0,0.8), 0 15px 40px rgba(0,0,0,0.9)"
              }}>
                
                {/* Fog background */}
                <div className="ds-door-fog" style={{
                  background: `radial-gradient(circle at bottom, ${door.fogColor} 0%, rgba(10,10,10,0.9) 60%, #050505 100%)`
                }} />

                {/* Door Content */}
                <div className="ds-door-content">
                  <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.9 }}>{door.icon}</div>
                  <div className="ds-door-title" style={{ color: isHovered ? "#e0e7ff" : "#cbd5e1" }}>
                    {door.title}
                  </div>
                  <div className="ds-door-desc">
                    {door.desc.split('\\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
                  </div>
                </div>

                {/* Locked Overlay */}
                {door.isLocked && (
                  <div className="ds-locked-overlay">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <div className="ds-locked-text">Coming Soon</div>
                  </div>
                )}

                {/* Particle Effects on Hover */}
                {isHovered && !door.isLocked && Array.from({length: 8}).map((_, i) => (
                  <div key={i} className="ds-ember" style={{
                    left: `${15 + Math.random() * 70}%`,
                    bottom: `${Math.random() * 15}%`,
                    width: `${2 + Math.random() * 3}px`,
                    height: `${2 + Math.random() * 3}px`,
                    background: door.themeColor,
                    boxShadow: `0 0 10px ${door.themeColor}`,
                    animationDelay: `${Math.random() * 2}s`
                  }} />
                ))}
                
                {/* Intense Ember Effects for The Crucible even when locked */}
                {isHovered && door.id === "crucible" && Array.from({length: 15}).map((_, i) => (
                  <div key={i} className="ds-ember" style={{
                    left: `${5 + Math.random() * 90}%`,
                    bottom: `${Math.random() * 20}%`,
                    width: `${3 + Math.random() * 4}px`,
                    height: `${3 + Math.random() * 4}px`,
                    background: door.themeColor,
                    boxShadow: `0 0 15px ${door.themeColor}`,
                    animationDelay: `${Math.random() * 2}s`,
                    zIndex: 30
                  }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
