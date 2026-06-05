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
      background: isDarkMode 
        ? "rgba(10, 10, 14, 0.6)" 
        : "rgba(255, 255, 255, 0.6)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      overflow: "hidden",
      borderRadius: "20px",
      border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 0, 0, 0.06)",
      boxShadow: isDarkMode 
        ? "0 24px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)" 
        : "0 24px 64px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
      opacity: (isExploding && progress >= 100) ? 0 : 1,
      transform: (isExploding && progress >= 100) ? "scale(0.97)" : "scale(1)",
      transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      padding: "32px"
    }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes floatIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseIndicator {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
      `}</style>

      {/* Top Edge Sleek Progress Line */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "3px",
        background: isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
        zIndex: 5
      }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #ff6a00 0%, #ffb300 100%)",
          boxShadow: "0 1px 8px rgba(255, 106, 0, 0.5)",
          transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }} />
      </div>

      {/* Floating Centered Status HUD */}
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
        padding: "20px 32px",
        borderRadius: "16px",
        background: isDarkMode ? "rgba(6, 6, 8, 0.85)" : "rgba(255, 255, 255, 0.9)",
        border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        backdropFilter: "blur(8px)",
        textAlign: "center",
        maxWidth: "340px",
        width: "calc(100% - 40px)",
        animation: "floatIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      }}>
        {/* Sleek rotating ring inside status block */}
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          border: "2px solid rgba(255, 106, 0, 0.2)",
          borderTopColor: "#ff6a00",
          animation: "shimmer 1.5s infinite linear, spin 1s linear infinite",
          marginBottom: "12px"
        }} />
        <h3 style={{
          fontFamily: "var(--font-outfit), system-ui, sans-serif",
          fontSize: "16px",
          fontWeight: "600",
          color: isDarkMode ? "#f4f4f7" : "#0f172a",
          margin: "0 0 6px 0",
          letterSpacing: "0.5px"
        }}>
          {statusText}
        </h3>
        {subtopic && (
          <p style={{
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            fontSize: "12px",
            color: "var(--text-muted)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%"
          }}>
            {subtopic}
          </p>
        )}
        <div style={{
          marginTop: "12px",
          fontFamily: "var(--font-gamer), monospace",
          fontSize: "11px",
          fontWeight: "600",
          color: isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)"
        }}>
          {Math.floor(progress)}%
        </div>
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
          /* VIDEO GRID TEMPLATE SKELETON */
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
                  background: isDarkMode ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)",
                  border: isDarkMode ? "1px solid rgba(255,255,255,0.03)" : "1px solid rgba(0,0,0,0.03)",
                  borderRadius: "12px",
                  padding: "12px",
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
                  borderRadius: "8px" 
                }} />
                {/* Title Line 1 */}
                <div style={{ ...shimmerStyle, width: "90%", height: "16px" }} />
                {/* Title Line 2 */}
                <div style={{ ...shimmerStyle, width: "60%", height: "16px" }} />
                {/* Channel Name */}
                <div style={{ ...shimmerStyle, width: "40%", height: "12px", marginTop: "4px" }} />
                {/* Meta details */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
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
