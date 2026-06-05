import React, { useEffect, useState } from "react";

export default function GlobalSplashScreen({ onComplete }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Hold the splash screen for 2.2 seconds to allow the full premium animation to play out
    const holdTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2200);

    // After fade out starts, wait 800ms for it to finish visually before unmounting
    const unmountTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(unmountTimer);
    };
  }, [onComplete]);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "#030305", // Extremely deep premium dark
      zIndex: 999999, // Above everything
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      opacity: isFadingOut ? 0 : 1,
      visibility: isFadingOut ? "hidden" : "visible",
      transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.8s",
      overflow: "hidden"
    }}>
      <style>{`
        @keyframes revealLogo {
          0% { opacity: 0; transform: scale(0.9) translateY(20px); filter: blur(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes textGlowMask {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes backgroundBreathe {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes subtleZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
      `}</style>

      {/* Cinematic Background Glows */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "60vw",
        height: "60vw",
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(circle, rgba(255, 106, 0, 0.08) 0%, rgba(255, 179, 0, 0.03) 40%, transparent 70%)",
        animation: "backgroundBreathe 4s ease-in-out infinite",
        pointerEvents: "none"
      }} />

      {/* Main Branding Container */}
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        animation: "revealLogo 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}>
        {/* The Icon (Smooth Pulse) */}
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, rgba(255, 106, 0, 0.2), rgba(255, 179, 0, 0.05))",
          border: "1px solid rgba(255, 106, 0, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 40px rgba(255, 106, 0, 0.3), inset 0 0 20px rgba(255, 179, 0, 0.2)",
          marginBottom: "8px"
        }}>
          <img 
            src="/logo.png" 
            alt="Kaevrix Emblem" 
            style={{ 
              width: "40px", 
              height: "40px", 
              objectFit: "contain",
              filter: "drop-shadow(0 0 8px rgba(255,106,0,0.6))"
            }} 
          />
        </div>

        {/* The Typography (Metallic Sweep) */}
        <h1 style={{
          fontFamily: "var(--font-gamer), 'Orbitron', sans-serif",
          fontSize: "42px",
          fontWeight: "900",
          letterSpacing: "8px",
          margin: 0,
          background: "linear-gradient(to right, rgba(255,255,255,0.1) 0%, #ffffff 40%, #ffb300 50%, #ffffff 60%, rgba(255,255,255,0.1) 100%)",
          backgroundSize: "200% auto",
          color: "transparent",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          animation: "textGlowMask 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          filter: "drop-shadow(0 0 10px rgba(255, 106, 0, 0.2))"
        }}>
          KAEVRIX
        </h1>
        
        {/* Subtle tagline */}
        <div style={{
          fontFamily: "var(--font-outfit), sans-serif",
          fontSize: "13px",
          fontWeight: "400",
          letterSpacing: "4px",
          color: "rgba(255, 255, 255, 0.4)",
          textTransform: "uppercase",
          marginTop: "4px",
          opacity: 0,
          animation: "revealLogo 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards"
        }}>
          Synchronized Mastery
        </div>
      </div>
    </div>
  );
}
