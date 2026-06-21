import React, { useEffect, useState } from "react";

export default function CanvasRuneLoader({ 
  isExploding, 
  onExplodeComplete, 
  isDarkMode = true, 
  statusText = "Loading...", 
  subtopic = "" 
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate a filling loading bar
    let current = 0;
    const interval = setInterval(() => {
      current += (100 - current) * 0.15 + 1; // Easing towards 100
      if (current >= 95 && !isExploding) {
        current = 95; // Hold at 95% until officially complete
      }
      if (isExploding) {
        current += 5; // Finish it off quickly
      }
      setProgress(Math.min(current, 100));
    }, 50);

    return () => clearInterval(interval);
  }, [isExploding]);

  useEffect(() => {
    if (isExploding && progress >= 100) {
      const timeout = setTimeout(() => {
        if (onExplodeComplete) onExplodeComplete();
      }, 600); // Wait for fade out
      return () => clearTimeout(timeout);
    }
  }, [isExploding, progress, onExplodeComplete]);

  // Determine which skeleton style to display
  const isQuizLoader = statusText.toLowerCase().includes("quiz") || statusText.toLowerCase().includes("synthesiz");

  // Shimmer styling object
  const shimmerStyle = {
    background: isDarkMode
      ? "linear-gradient(90deg, rgba(255, 255, 255, 0.015) 25%, rgba(255, 255, 255, 0.07) 50%, rgba(255, 255, 255, 0.015) 75%)"
      : "linear-gradient(90deg, rgba(0, 0, 0, 0.02) 25%, rgba(0, 0, 0, 0.06) 50%, rgba(0, 0, 0, 0.02) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite linear",
    borderRadius: "8px"
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      minHeight: "450px",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-start",
      background: "transparent",
      overflow: "hidden",
      opacity: (isExploding && progress >= 100) ? 0 : 1,
      transform: (isExploding && progress >= 100) ? "scale(0.97)" : "scale(1)",
      transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      padding: "32px 0px"
    }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes floatIn {
          0% { opacity: 0; transform: translate(-50%, calc(-50% + 15px)); }
          100% { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes spinRing {
          0% { stroke-dashoffset: 314; transform: rotate(0deg); }
          50% { stroke-dashoffset: 157; transform: rotate(180deg); }
          100% { stroke-dashoffset: 314; transform: rotate(360deg); }
        }
        @keyframes blobMorph1 {
          0%, 100% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; transform: rotate(0deg); }
          33% { border-radius: 70% 30% 52% 48% / 60% 40% 60% 40%; transform: rotate(120deg); }
          66% { border-radius: 50% 50% 30% 70% / 40% 60% 30% 70%; transform: rotate(240deg); }
        }
        @keyframes blobMorph2 {
          0%, 100% { border-radius: 50% 50% 30% 70% / 40% 60% 30% 70%; transform: rotate(360deg); }
          50% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; transform: rotate(180deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.25; transform: scale(0.95); }
          50% { opacity: 0.55; transform: scale(1.05); }
        }
        @keyframes floatParticle1 {
          0% { transform: translate(0, 0) scale(0.8); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translate(-25px, -45px) scale(0.4); opacity: 0; }
        }
        @keyframes floatParticle2 {
          0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
          50% { opacity: 0.9; }
          100% { transform: translate(25px, -35px) scale(0.3); opacity: 0; }
        }
        @keyframes floatParticle3 {
          0% { transform: translate(0, 0) scale(0.7); opacity: 0; }
          50% { opacity: 0.7; }
          100% { transform: translate(-10px, -55px) scale(0.2); opacity: 0; }
        }
        @keyframes textShine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Floating Centered Status HUD (No Container Box) */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        maxWidth: "340px",
        width: "calc(100% - 40px)",
        animation: "floatIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        pointerEvents: "none"
      }}>
        {/* $50k Loader Emblem Container */}
        <div style={{
          position: "relative",
          width: "120px",
          height: "120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px"
        }}>
          {/* Ambient Breathing Background Glow */}
          <div style={{
            position: "absolute",
            inset: "-10px",
            background: "radial-gradient(circle, rgba(255, 106, 0, 0.25) 0%, rgba(255, 179, 0, 0.05) 50%, transparent 70%)",
            animation: "pulseGlow 3s ease-in-out infinite",
            borderRadius: "50%"
          }} />

          {/* SVG Orbit Comet-Trail Ring */}
          <svg 
            width="120" 
            height="120" 
            viewBox="0 0 120 120" 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: "rotate(-90deg)",
              filter: "drop-shadow(0 0 8px rgba(255, 106, 0, 0.45))"
            }}
          >
            <defs>
              <linearGradient id="orbitCometGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6a00" />
                <stop offset="60%" stopColor="#ffb300" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Static thin track */}
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1.5" />
            {/* Rotating comet-trail circle */}
            <circle 
              cx="60" 
              cy="60" 
              r="50" 
              fill="none" 
              stroke="url(#orbitCometGrad)" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeDasharray="314" 
              strokeDashoffset="240" 
              style={{
                transformOrigin: "center",
                animation: "spinRing 1.8s cubic-bezier(0.4, 0.15, 0.3, 1) infinite"
              }}
            />
          </svg>

          {/* Dual-Layer Morphing Liquid Plasma Core */}
          <div style={{
            position: "absolute",
            width: "74px",
            height: "74px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Liquid Layer 1 */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, rgba(255, 106, 0, 0.45) 0%, rgba(255, 179, 0, 0.15) 100%)",
              filter: "blur(2px)",
              animation: "blobMorph1 6s ease-in-out infinite"
            }} />
            {/* Liquid Layer 2 */}
            <div style={{
              position: "absolute",
              inset: "4px",
              background: "linear-gradient(225deg, rgba(255, 179, 0, 0.4) 0%, rgba(255, 106, 0, 0.1) 100%)",
              filter: "blur(1px)",
              animation: "blobMorph2 5s ease-in-out infinite"
            }} />
          </div>

          {/* Central Logo/Emblem overlay */}
          <div style={{
            position: "absolute",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5
          }}>
            <img 
              src="/logo.png" 
              alt="" 
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{
                width: "32px",
                height: "32px",
                objectFit: "contain",
                filter: "drop-shadow(0 0 10px rgba(255, 106, 0, 0.8))",
                zIndex: 2
              }} 
            />
            {/* Diamond rune vector fallback */}
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#ffb300" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ 
                position: "absolute", 
                filter: "drop-shadow(0 0 6px rgba(255,106,0,0.6))",
                opacity: 0.85
              }}
            >
              <path d="M12 2L2 12h20L12 2zM12 22L2 12h20L12 22z" />
            </svg>
          </div>

          {/* Floating Gold/White Ambient Particles */}
          <div style={{
            position: "absolute",
            bottom: "25px",
            left: "40px",
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: "#ffb300",
            boxShadow: "0 0 6px #ffb300",
            animation: "floatParticle1 3.5s ease-in-out infinite"
          }} />
          <div style={{
            position: "absolute",
            bottom: "20px",
            right: "35px",
            width: "3px",
            height: "3px",
            borderRadius: "50%",
            background: "#ff6a00",
            boxShadow: "0 0 6px #ff6a00",
            animation: "floatParticle2 3s ease-in-out infinite 0.7s"
          }} />
          <div style={{
            position: "absolute",
            bottom: "30px",
            left: "60px",
            width: "3px",
            height: "3px",
            borderRadius: "50%",
            background: "#ffffff",
            boxShadow: "0 0 6px #ffffff",
            animation: "floatParticle3 4s ease-in-out infinite 1.4s"
          }} />
        </div>

        {/* Metallic statusText */}
        <h3 style={{
          fontFamily: "var(--font-outfit), system-ui, sans-serif",
          fontSize: "18px",
          fontWeight: "700",
          letterSpacing: "1.2px",
          margin: 0,
          background: isDarkMode 
            ? "linear-gradient(90deg, #f4f4f7 0%, #ffb300 25%, #ffffff 50%, #ffb300 75%, #f4f4f7 100%)"
            : "linear-gradient(90deg, #0f172a 0%, #ff6a00 25%, #0f172a 50%, #ff6a00 75%, #0f172a 100%)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          animation: "textShine 3s linear infinite",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
        }}>
          {statusText}
        </h3>
      </div>

      {/* Background Skeleton Content */}
      <div style={{ 
        opacity: 0.45, 
        filter: "blur(2px)", 
        width: "100%", 
        pointerEvents: "none",
        userSelect: "none"
      }}>
        {isQuizLoader ? (
          /* QUIZ TEMPLATE SKELETON */
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Top bar header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ ...shimmerStyle, width: "120px", height: "16px" }} />
              <div style={{ ...shimmerStyle, width: "80px", height: "16px" }} />
            </div>

            {/* Question block */}
            <div style={{ ...shimmerStyle, width: "100%", height: "90px" }} />

            {/* Answer Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ ...shimmerStyle, width: "100%", height: "52px" }} />
              <div style={{ ...shimmerStyle, width: "100%", height: "52px" }} />
              <div style={{ ...shimmerStyle, width: "100%", height: "52px" }} />
              <div style={{ ...shimmerStyle, width: "100%", height: "52px" }} />
            </div>
          </div>
        ) : (
          /* VIDEO GRID TEMPLATE SKELETON (YouTube Style, No outer borders/cards) */
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
            gap: "20px",
            width: "100%"
          }}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                {/* 16:9 Thumbnail Box */}
                <div style={{ 
                  ...shimmerStyle, 
                  width: "100%", 
                  paddingTop: "56.25%", 
                  borderRadius: "12px" 
                }} />
                {/* Title Line 1 */}
                <div style={{ ...shimmerStyle, width: "90%", height: "16px" }} />
                {/* Title Line 2 */}
                <div style={{ ...shimmerStyle, width: "60%", height: "16px" }} />
                {/* Channel Name */}
                <div style={{ ...shimmerStyle, width: "40%", height: "12px", marginTop: "4px" }} />
                {/* Meta details */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <div style={{ ...shimmerStyle, width: "50px", height: "10px" }} />
                  <div style={{ ...shimmerStyle, width: "70px", height: "10px" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
