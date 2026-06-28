import { useState, useEffect, useMemo } from "react";
import * as sound from "../../utils/audio";
import { parseMarkdownToHTML } from "../../utils/markdown";

export default function StudyHistory({ username, isDarkMode, onStartSoloStudy }) {
  const [historyList, setHistoryList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const historyKey = `kaevrix_study_history_${username}`;
      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setHistoryList(parsed);
          if (parsed.length > 0) {
            setSelectedItem(parsed[0]);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load study history:", e);
    }
  }, [username]);

  // Telemetry Readouts
  const stats = useMemo(() => {
    if (historyList.length === 0) return { totalTopics: 0, totalVideos: 0, lastStudyDate: "N/A" };
    const topicsSet = new Set(historyList.map(h => h.topic));
    const dates = historyList.map(h => new Date(h.timestamp));
    const latestDate = new Date(Math.max(...dates));

    return {
      totalTopics: topicsSet.size,
      totalVideos: historyList.length,
      lastStudyDate: latestDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" })
    };
  }, [historyList]);

  // Handle PDF Print/Download for saved notes
  const handleDownloadNotes = (item) => {
    if (!item) return;
    sound.playClockTick();

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);

    const htmlContent = parseMarkdownToHTML(item.notes);
    const doc = iframe.contentWindow.document;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>${item.video.title.replace(/[^a-z0-9]/gi, "_")} - Study Guide</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;700;900&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              padding: 40px;
              color: #0f172a;
              line-height: 1.8;
              font-size: 14px;
            }
            h1, h2, h3 {
              font-family: 'Outfit', sans-serif;
              font-weight: 900;
              letter-spacing: -0.02em;
              line-height: 1.2;
              color: #ea580c;
              border-bottom: 2px solid #ffedd5;
              padding-bottom: 8px;
              margin-top: 30px;
            }
            h1 { font-size: 28px; }
            h2 { font-size: 22px; }
            h3 { font-size: 18px; color: #f97316; border-bottom: none; }
            code {
              font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
              background: #f1f5f9;
              padding: 2px 6px;
              border-radius: 4px;
              color: #ef4444;
              font-size: 13px;
            }
            pre {
              background: #0f172a;
              color: #f8fafc;
              padding: 16px;
              border-radius: 12px;
              overflow-x: auto;
              border: 1px solid #1e293b;
            }
            pre code {
              background: transparent;
              color: #e2e8f0;
              padding: 0;
            }
            blockquote {
              border-left: 4px solid #ff6a00;
              background: #fff7ed;
              margin: 1.5em 0;
              padding: 12px 20px;
              border-radius: 0 8px 8px 0;
              color: #475569;
              font-style: italic;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #e2e8f0;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f8fafc;
              font-weight: 700;
              color: #0f172a;
            }
            ul, ol {
              padding-left: 24px;
            }
            li {
              margin-bottom: 8px;
            }
            a {
              color: #ff6a00;
              text-decoration: none;
            }
            @media print {
              body { padding: 0; }
              pre { white-space: pre-wrap; word-wrap: break-word; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();

    iframe.contentWindow.addEventListener("afterprint", () => {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    });

    setTimeout(() => {
      iframe.contentWindow.print();
    }, 500);
  };

  const handleItemSelect = (item) => {
    sound.playClockTick();
    setSelectedItem(item);
  };

  const handleRevisitClick = (item) => {
    if (onStartSoloStudy && item) {
      sound.playMatchFound();
      // Pass the video details structure matching standard video object
      onStartSoloStudy({
        id: item.video.id || item.video.videoId,
        videoId: item.video.videoId || item.video.id,
        title: item.video.title,
        channel: item.video.channel,
        url: item.video.url
      });
    }
  };

  return (
    <div style={{
      fontFamily: "var(--font-gamer)",
      color: "var(--text-light)",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      width: "100%"
    }}>
      <style>{`
        @keyframes sweepLine {
          0% { left: -100%; }
          100% { left: 150%; }
        }
        .chrono-card {
          border: 1px solid ${isDarkMode ? "rgba(255,255,255,0.06)" : "#e2e8f0"};
          background: ${isDarkMode ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.005)"};
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .chrono-card:hover {
          background: ${isDarkMode ? "rgba(255, 106, 0, 0.04)" : "#fff7ed"};
          border-color: #ff6a00;
          transform: translateX(4px);
        }
        .chrono-card-active {
          border-color: #ff6a00 !important;
          background: ${isDarkMode ? "rgba(255, 106, 0, 0.08)" : "#ffedd5"} !important;
          box-shadow: 0 4px 20px rgba(255,106,0,0.08);
        }
        .chrono-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 106, 0, 0.1), transparent);
          transform: skewX(-25deg);
          transition: 0.75s;
        }
        .chrono-card:hover::after {
          animation: sweepLine 1.2s ease-in-out forwards;
        }
        .history-hud-panel {
          position: relative;
          padding: 24px;
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.005)" : "rgba(0, 0, 0, 0.002)"};
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)"};
          border-radius: 16px;
        }
        .history-corner-bracket {
          position: absolute;
          width: 10px;
          height: 10px;
          border-color: #ff6a00;
          border-style: solid;
          opacity: 0.35;
          pointer-events: none;
          transition: all 0.3s ease;
        }
        .history-hud-panel:hover .history-corner-bracket {
          opacity: 0.85;
          filter: drop-shadow(0 0 4px #ff6a00);
        }
        .hist-bracket-tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
        .hist-bracket-tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
        .hist-bracket-bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
        .hist-bracket-br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

        /* Typography for rendered markdown */
        .history-notes-document {
          font-family: 'Inter', sans-serif;
        }
        .history-notes-document h1, .history-notes-document h2, .history-notes-document h3 {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.2;
          color: #ff6a00;
        }
        .history-notes-document h1 { font-size: 26px; margin: 30px 0 16px 0; border-bottom: 2px solid #ffedd5; padding-bottom: 8px; }
        .history-notes-document h2 { font-size: 20px; margin: 24px 0 12px 0; border-bottom: 1px solid rgba(255, 106, 0, 0.15); padding-bottom: 6px; }
        .history-notes-document h3 { font-size: 16px; margin: 20px 0 10px 0; }
        .history-notes-document p { font-size: 14.5px; line-height: 1.75; margin-bottom: 16px; color: ${isDarkMode ? "rgba(255,255,255,0.85)" : "#334155"}; }
        .history-notes-document code {
          font-family: 'Fira Code', 'Courier New', monospace;
          background: ${isDarkMode ? "rgba(255, 106, 0, 0.1)" : "#fff7ed"};
          color: #ff6a00;
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 13.5px;
        }
        .history-notes-document pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 16px;
          border-radius: 10px;
          overflow-x: auto;
          margin: 16px 0;
          border: 1px solid #1e293b;
        }
        .history-notes-document pre code {
          background: transparent !important;
          color: inherit !important;
          padding: 0 !important;
        }
        .history-notes-document blockquote {
          border-left: 4px solid #ff6a00;
          background: ${isDarkMode ? "rgba(255,106,0,0.05)" : "#fff7ed"};
          margin: 1.5em 0;
          padding: 12px 20px;
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: ${isDarkMode ? "#fb923c" : "#c2410c"};
        }
        .history-notes-document ul, .history-notes-document ol { padding-left: 20px; margin-bottom: 16px; }
        .history-notes-document li { margin-bottom: 6px; line-height: 1.6; color: ${isDarkMode ? "rgba(255,255,255,0.8)" : "#475569"}; }
      `}</style>

      {/* 1. High-Tech Header Section */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
        paddingBottom: "16px",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <span style={{ fontSize: "10px", fontWeight: "950", color: "#ff6a00", letterSpacing: "3px", textTransform: "uppercase" }}>
            📚 CHRONO-LOG ARCHIVES
          </span>
          <h2 style={{
            fontSize: "36px",
            fontWeight: "900",
            margin: "6px 0 0 0",
            fontFamily: "var(--font-outfit)",
            letterSpacing: "-1.5px",
            background: "linear-gradient(135deg, #ff6a00, #ffb300)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: isDarkMode ? "transparent" : "#ea580c"
          }}>
            Study History
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0", fontFamily: "sans-serif" }}>
            Revisit your study decks, watch lessons, and access saved notes instantly.
          </p>
        </div>

        {/* Telemetry Stats widgets */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div className="history-hud-panel" style={{ position: "relative", padding: "8px 16px", minWidth: "100px", borderRadius: "10px", borderStyle: "dashed" }}>
            <div className="history-corner-bracket hist-bracket-tl" />
            <div className="history-corner-bracket hist-bracket-tr" />
            <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>TOPICS</div>
            <div style={{ fontSize: "18px", fontWeight: "900", color: "#ff6a00", marginTop: "2px" }}>{stats.totalTopics}</div>
          </div>
          <div className="history-hud-panel" style={{ position: "relative", padding: "8px 16px", minWidth: "100px", borderRadius: "10px", borderStyle: "dashed" }}>
            <div className="history-corner-bracket hist-bracket-tl" />
            <div className="history-corner-bracket hist-bracket-tr" />
            <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>DECKS SAVED</div>
            <div style={{ fontSize: "18px", fontWeight: "900", color: "#ff6a00", marginTop: "2px" }}>{stats.totalVideos}</div>
          </div>
          <div className="history-hud-panel" style={{ position: "relative", padding: "8px 16px", minWidth: "130px", borderRadius: "10px", borderStyle: "dashed" }}>
            <div className="history-corner-bracket hist-bracket-tl" />
            <div className="history-corner-bracket hist-bracket-tr" />
            <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>LAST ACTIVE</div>
            <div style={{ fontSize: "16px", fontWeight: "900", color: "var(--text-light)", marginTop: "4px" }}>{stats.lastStudyDate}</div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {historyList.length === 0 ? (
        <div className="history-hud-panel" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 32px",
          textAlign: "center",
          borderRadius: "16px"
        }}>
          <div className="history-corner-bracket hist-bracket-tl" />
          <div className="history-corner-bracket hist-bracket-tr" />
          <div className="history-corner-bracket hist-bracket-bl" />
          <div className="history-corner-bracket hist-bracket-br" />
          
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>📖</div>
          <h3 style={{ fontSize: "18px", fontWeight: "900", margin: "0 0 8px 0" }}>Chrono-Log is Empty</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", maxWidth: "340px", margin: "0 0 24px 0", fontFamily: "sans-serif", lineHeight: "1.5" }}>
            You haven't completed any Solo Study guides yet. Complete study videos in the Pathfinder module to compile guides.
          </p>
        </div>
      ) : (
        /* 2. Main Double-Panel HUD Layout */
        <div className="study-history-grid">
          {/* LEFT SIDEBAR: Timeline List */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxHeight: "650px",
            overflowY: "auto",
            paddingRight: "6px"
          }} className="custom-scrollbar">
            {historyList.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric"
              });

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  className={`chrono-card ${isSelected ? "chrono-card-active" : ""}`}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span style={{
                      fontSize: "9px",
                      background: "rgba(255, 106, 0, 0.12)",
                      color: "#ff6a00",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontWeight: "900",
                      letterSpacing: "0.5px"
                    }}>
                      {item.topic && item.topic.toUpperCase().substring(0, 16)}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600" }}>
                      {dateStr}
                    </span>
                  </div>

                  <h4 style={{
                    fontSize: "13px",
                    fontWeight: "800",
                    margin: "0 0 4px 0",
                    color: isSelected ? "#ff6a00" : "var(--text-light)",
                    lineHeight: "1.4",
                    fontFamily: "var(--font-outfit)",
                    display: "-webkit-box",
                    WebkitLineClamp: "2",
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}>
                    {item.video.title}
                  </h4>
                  <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                    📺 {item.video.channel}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT VIEWPORT: Content Detail View */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            maxHeight: "650px",
            overflowY: "auto",
            boxSizing: "border-box"
          }} className="history-detail-panel custom-scrollbar history-hud-panel">
            <div className="history-corner-bracket hist-bracket-tl" />
            <div className="history-corner-bracket hist-bracket-tr" />
            <div className="history-corner-bracket hist-bracket-bl" />
            <div className="history-corner-bracket hist-bracket-br" />

            {selectedItem ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Header Action toolbar */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                  paddingBottom: "16px",
                  flexWrap: "wrap",
                  gap: "12px"
                }}>
                  <div>
                    <span style={{ fontSize: "9px", color: "#ff6a00", fontWeight: "900", letterSpacing: "1px" }}>
                      📍 ACTIVE DIRECTIVE
                    </span>
                    <h3 style={{
                      fontSize: "18px",
                      fontWeight: "900",
                      margin: "4px 0 0 0",
                      fontFamily: "var(--font-outfit)",
                      color: "var(--text-light)"
                    }}>
                      {selectedItem.video.title}
                    </h3>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleRevisitClick(selectedItem)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #ff6a00, #ea580c)",
                        border: "none",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: "900",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(255, 106, 0, 0.25)",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={e => e.currentTarget.style.filter = "brightness(1.1)"}
                      onMouseOut={e => e.currentTarget.style.filter = "none"}
                    >
                      ⚔️ Revisit Training
                    </button>
                    <button
                      onClick={() => handleDownloadNotes(selectedItem)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "10px",
                        background: isDarkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
                        border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #cbd5e1",
                        color: "var(--text-light)",
                        fontSize: "12px",
                        fontWeight: "800",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={e => e.currentTarget.style.background = isDarkMode ? "rgba(255,255,255,0.08)" : "#f1f5f9"}
                      onMouseOut={e => e.currentTarget.style.background = isDarkMode ? "rgba(255,255,255,0.04)" : "#ffffff"}
                    >
                      📥 Download Notes (.pdf)
                    </button>
                  </div>
                </div>

                {/* Split detail: Embedded Video + Markdown text */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {selectedItem.video.videoId && (
                    <div style={{ maxWidth: "560px", width: "100%", margin: "0 auto" }}>
                      <iframe
                        width="100%"
                        height="315"
                        src={`https://www.youtube.com/embed/${selectedItem.video.videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                          borderRadius: "16px",
                          border: "1.5px solid rgba(255, 106, 0, 0.25)",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
                        }}
                      />
                    </div>
                  )}

                  {/* Rendered markdown notes document */}
                  <div
                    className="history-notes-document"
                    style={{ textAlign: "left", padding: "0 10px" }}
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(selectedItem.notes) }}
                  />
                </div>

              </div>
            ) : (
              <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "350px", color: "var(--text-muted)" }}>
                Select a completed study deck from the list to view its details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
