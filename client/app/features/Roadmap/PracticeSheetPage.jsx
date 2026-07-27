import React, { useState, useEffect } from "react";
import * as sound from "../../utils/audio";
import CanvasRuneLoader from "../Shared/CanvasRuneLoader";

export default function PracticeSheetPage({ username, isDarkMode, backendUrl, onBack, practiceContext }) {
  const { topic, level, milestoneId, milestones } = practiceContext || {};
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [practiceSheet, setPracticeSheet] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);
  
  // Selection states
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [activeTab, setActiveTab] = useState("spec"); // 'spec' | 'hints' | 'solution'
  const [solutionRevealed, setSolutionRevealed] = useState({}); // map of qId -> boolean
  
  // AI job polling states
  const [polling, setPolling] = useState(false);
  const [jobId, setJobId] = useState(null);

  useEffect(() => {
    if (!topic || !level) {
      setError("Missing active topic or level context.");
      setLoading(false);
      return;
    }

    const loadSheet = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/practice-sheet?topic=${encodeURIComponent(topic)}&level=${level}`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}` }
        });
        if (!response.ok) throw new Error("Failed to load practice sheets from server.");
        const data = await response.json();
        
        if (data.exists) {
          setPracticeSheet(data.sheet);
          setCompletedIds(data.sheet.completedQuestionIds || []);
          
          const currentMilestoneSheet = data.sheet.milestones?.find(m => m.milestoneId === milestoneId);
          if (currentMilestoneSheet?.questions?.length > 0) {
            setActiveQuestionId(currentMilestoneSheet.questions[0].id);
          }
          setLoading(false);
        } else {
          triggerGeneration();
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadSheet();
  }, [topic, level]);

  useEffect(() => {
    if (!jobId || !polling) return;

    let timer = setInterval(async () => {
      try {
        const res = await fetch(`${backendUrl}/api/jobs/${jobId}`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}` }
        });
        if (!res.ok) throw new Error("Job polling request failed");
        
        const data = await res.json();
        if (data.status === "completed" && data.result) {
          clearInterval(timer);
          setPolling(false);
          setJobId(null);
          const sheetRes = await fetch(`${backendUrl}/api/practice-sheet?topic=${encodeURIComponent(topic)}&level=${level}`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}` }
          });
          const sheetData = await sheetRes.json();
          if (sheetData.exists) {
            setPracticeSheet(sheetData.sheet);
            setCompletedIds(sheetData.sheet.completedQuestionIds || []);
            const currentMilestoneSheet = sheetData.sheet.milestones?.find(m => m.milestoneId === milestoneId);
            if (currentMilestoneSheet?.questions?.length > 0) {
              setActiveQuestionId(currentMilestoneSheet.questions[0].id);
            }
          }
          setLoading(false);
        } else if (data.status === "failed") {
          clearInterval(timer);
          setPolling(false);
          setJobId(null);
          setError(data.error || "AI Generation failed");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error polling practice sheet job:", err);
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [jobId, polling]);

  const triggerGeneration = async () => {
    setLoading(true);
    setError(null);
    try {
      const savedProgress = JSON.parse(localStorage.getItem(`kaevrix_roadmap_progress_${username}`) || '{}');
      const devGoal = savedProgress.devGoal || "Knowledge";
      const devLanguage = savedProgress.devLanguage || topic;
      const difficulty = savedProgress.difficulty || "Medium";

      const res = await fetch(`${backendUrl}/api/practice-sheet/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`
        },
        body: JSON.stringify({
          topic,
          level,
          milestones: milestones.map(m => ({ id: m.id, title: m.title, subtopics: m.subtopics || [] })),
          devGoal,
          devLanguage,
          difficulty
        })
      });

      if (!res.ok) throw new Error("Could not start AI practice sheet generation.");

      const data = await res.json();
      if (data.jobId) {
        setJobId(data.jobId);
        setPolling(true);
      } else {
        throw new Error("No job ID returned from AI queue.");
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleToggleQuestion = async (qId, e) => {
    if (e) e.stopPropagation();
    sound.playClockTick();
    const isCompleted = completedIds.includes(qId);
    const updated = isCompleted 
      ? completedIds.filter(id => id !== qId) 
      : [...completedIds, qId];
    
    setCompletedIds(updated);

    try {
      const res = await fetch(`${backendUrl}/api/practice-sheet/toggle-question`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`
        },
        body: JSON.stringify({
          topic,
          level,
          questionId: qId,
          completed: !isCompleted
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCompletedIds(data.completedQuestionIds || []);
      }
    } catch (err) {
      console.error("Failed to sync question status:", err);
    }
  };

  const currentMilestoneSheet = practiceSheet?.milestones?.find(m => m.milestoneId === milestoneId);
  const questionsList = currentMilestoneSheet?.questions || [];
  const activeQuestion = questionsList.find(q => q.id === activeQuestionId) || questionsList[0];

  const sortedQuestions = [...questionsList].sort((a, b) => {
    const diffOrder = { "Easy": 1, "Medium": 2, "Hard": 3 };
    return diffOrder[a.difficulty] - diffOrder[b.difficulty];
  });

  const getDiffColor = (difficulty) => {
    if (difficulty === "Easy") return "#10b981";
    if (difficulty === "Medium") return "#f59e0b";
    return "#ef4444";
  };

  if (loading) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(10, 10, 14, 0.96)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1000
      }}>
        <CanvasRuneLoader isActive={true} text="Initializing Premium Sandbox..." />
        {polling && (
          <p style={{ marginTop: "24px", color: "var(--neon-orange, #ff6a00)", fontSize: "13px", fontWeight: "500", letterSpacing: "1px" }}>
            Generative AI assembling custom practice vectors...
          </p>
        )}
      </div>
    );
  }

  // Linear / Vercel-style sleek adaptive theme
  const theme = {
    bg: isDarkMode ? "transparent" : "transparent",
    textPrimary: isDarkMode ? "#f8fafc" : "#0f172a",
    textSecondary: isDarkMode ? "#94a3b8" : "#475569",
    textTertiary: isDarkMode ? "#475569" : "#94a3b8",
    border: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
    borderHighlight: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)",
    
    // Glassmorphism panels
    panelBg: isDarkMode ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.7)",
    panelBlur: "blur(24px)",
    panelShadow: isDarkMode ? "0 20px 40px rgba(0,0,0,0.3)" : "0 20px 40px rgba(0,0,0,0.03)",
    
    // Task List Items
    taskHoverBg: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.4)",
    taskActiveBg: isDarkMode ? "rgba(255,255,255,0.06)" : "#ffffff",
    taskActiveShadow: isDarkMode ? "0 4px 20px rgba(0,0,0,0.2)" : "0 8px 30px rgba(0,0,0,0.04)",
    
    // Segmented Control Tabs
    tabTrack: isDarkMode ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.04)",
    tabActiveBg: isDarkMode ? "#1e293b" : "#ffffff",
    tabActiveShadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 10px rgba(0,0,0,0.05)",
    
    // Buttons
    btnPrimaryBg: isDarkMode ? "#f8fafc" : "#0f172a",
    btnPrimaryText: isDarkMode ? "#0f172a" : "#ffffff",
    
    // Code block is always dark for premium sleekness
    codeBg: "#0B0E14",
    codeBorder: "rgba(255,255,255,0.05)",
    codeText: "#e2e8f0"
  };

  // Helper for Markdown-style inline code formatting
  const formatText = (text) => {
    if (!text) return null;
    return text.split(/`([^`]+)`/g).map((part, i) => {
      if (i % 2 === 1) {
        return (
          <span key={i} style={{ 
            color: "var(--neon-orange, #ff6a00)", 
            fontFamily: "'Fira Code', monospace", 
            background: isDarkMode ? "rgba(255, 106, 0, 0.15)" : "rgba(255, 106, 0, 0.08)", 
            padding: "2px 6px", 
            borderRadius: "4px", 
            fontSize: "0.9em",
            fontWeight: "500"
          }}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div style={{
      width: "100%", maxWidth: "1280px", margin: "0 auto", padding: "40px 24px",
      minHeight: "100vh", display: "flex", flexDirection: "column", gap: "32px",
      color: theme.textPrimary, fontFamily: "'Inter', sans-serif"
    }}>
      {/* Import Inter & Fira Code */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap');
        
        .sleek-task-row {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sleek-task-row:hover:not(.active) {
          background: ${theme.taskHoverBg} !important;
        }
        
        .sleek-copy-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sleek-copy-btn:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }
      `}</style>

      {/* minimal back button to Roadmap */}
      <button 
        onClick={onBack}
        style={{
          alignSelf: "flex-start",
          background: "transparent",
          border: "none",
          color: "var(--neon-orange, #ff6a00)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          padding: "0 0 16px 0"
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Pathfinder
      </button>

      {error ? (
        <div style={{
          padding: "32px", background: "rgba(239, 68, 68, 0.05)",
          border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "16px", textAlign: "center"
        }}>
          <h3 style={{ color: "#ef4444", margin: "0 0 8px", fontSize: "16px", fontWeight: "600" }}>Failed to load workspace</h3>
          <p style={{ color: theme.textSecondary, fontSize: "14px", marginBottom: "20px" }}>{error}</p>
          <button onClick={triggerGeneration} style={{
            background: theme.btnPrimaryBg, color: theme.btnPrimaryText, border: "none",
            padding: "10px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer"
          }}>
            Retry
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: "32px", alignItems: "start" }}>
          
          {/* LEFT COLUMN (NOW THE WORKSPACE) */}
          {activeQuestion ? (
            <div style={{
              background: theme.panelBg,
              backdropFilter: theme.panelBlur,
              WebkitBackdropFilter: theme.panelBlur,
              border: `1px solid ${theme.border}`,
              borderRadius: "24px",
              boxShadow: theme.panelShadow,
              display: "flex",
              flexDirection: "column",
              minHeight: "680px",
              overflow: "hidden"
            }}>
              
              {/* Full Width Tabs at Top */}
              <div style={{ display: "flex", width: "100%", borderBottom: `1px solid ${theme.border}` }}>
                {[
                  { id: "spec", label: "Description" },
                  { id: "hints", label: "Hints & Variants" },
                  { id: "solution", label: "Solution" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => { sound.playClockTick(); setActiveTab(t.id); }}
                    style={{
                      flex: 1, padding: "18px 0", border: "none", background: "transparent",
                      borderBottom: activeTab === t.id ? `3px solid var(--neon-orange, #ff6a00)` : "3px solid transparent",
                      color: activeTab === t.id ? theme.textPrimary : theme.textSecondary,
                      fontSize: "14px", fontWeight: "600", cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Header inside Content */}
              <div style={{ padding: "40px 40px 20px", borderBottom: `1px solid ${theme.border}` }}>
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "99px",
                    background: getDiffColor(activeQuestion.difficulty) + "15",
                    color: getDiffColor(activeQuestion.difficulty)
                  }}>
                    {activeQuestion.difficulty}
                  </span>
                  <span style={{
                    fontSize: "11px", fontWeight: "500", padding: "4px 10px", borderRadius: "99px",
                    background: theme.border, color: theme.textSecondary
                  }}>
                    {activeQuestion.type === "practical" ? "Coding Challenge" : "Theory Concept"}
                  </span>
                </div>
                
                <h2 style={{ fontSize: "22px", fontWeight: "600", margin: 0, lineHeight: "1.5", color: theme.textPrimary, letterSpacing: "-0.3px" }}>
                  {formatText(activeQuestion.question)}
                </h2>
              </div>

              {/* Content Area */}
              <div style={{ padding: "32px 40px", flex: 1, display: "flex", flexDirection: "column" }}>
                
                {/* 1. Description Tab */}
                {activeTab === "spec" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "1px", color: theme.textTertiary, textTransform: "uppercase", marginBottom: "12px" }}>
                        Task Directions
                      </div>
                      <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.7", color: theme.textPrimary, whiteSpace: "pre-wrap" }}>
                        {formatText(activeQuestion.guidance)}
                      </p>
                    </div>

                    {activeQuestion.codeTemplate && (
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "1px", color: theme.textTertiary, textTransform: "uppercase", marginBottom: "12px" }}>
                          Starter Template
                        </div>
                        <div style={{
                          background: theme.codeBg, border: `1px solid ${theme.codeBorder}`,
                          borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                        }}>
                          <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 16px", borderBottom: `1px solid ${theme.codeBorder}`,
                            background: "rgba(255,255,255,0.02)"
                          }}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f56" }} />
                              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ffbd2e" }} />
                              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#27c93f" }} />
                            </div>
                            <button
                              className="sleek-copy-btn"
                              onClick={() => {
                                sound.playCorrect();
                                navigator.clipboard.writeText(activeQuestion.codeTemplate);
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                Copy
                              </div>
                            </button>
                          </div>
                          <pre style={{ margin: 0, padding: "20px", fontSize: "13px", fontFamily: "'Fira Code', monospace", color: theme.codeText, overflowX: "auto", lineHeight: "1.6" }}>
                            <code>{activeQuestion.codeTemplate}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Hints & Variants */}
                {activeTab === "hints" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "1px", color: theme.textTertiary, textTransform: "uppercase", marginBottom: "12px" }}>
                        Study Hints
                      </div>
                      <div style={{
                        padding: "20px", background: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                        borderRadius: "12px", border: `1px solid ${theme.borderHighlight}`
                      }}>
                        <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.7", color: theme.textSecondary }}>
                          {activeQuestion.guidance.length > 200 ? formatText(activeQuestion.guidance.substring(0, 150) + "...") : "Analyze the constraints, time complexity rules, and potential edge cases carefully."}
                        </p>
                      </div>
                    </div>

                    {activeQuestion.variants && activeQuestion.variants.length > 0 && (
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "1px", color: theme.textTertiary, textTransform: "uppercase", marginBottom: "12px" }}>
                          Interview Variants
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {activeQuestion.variants.map((v, i) => (
                            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: theme.textTertiary, marginTop: "8px" }} />
                              <span style={{ fontSize: "15px", color: theme.textPrimary, lineHeight: "1.6" }}>{formatText(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Solution Tab */}
                {activeTab === "solution" && (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    {!solutionRevealed[activeQuestion.id] ? (
                      <div style={{
                        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        padding: "40px", border: `1px dashed ${theme.borderHighlight}`, borderRadius: "16px"
                      }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "16px" }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        <h4 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "600", color: theme.textPrimary }}>Solution Hidden</h4>
                        <p style={{ color: theme.textSecondary, fontSize: "14px", margin: "0 0 24px", textAlign: "center", maxWidth: "280px", lineHeight: "1.5" }}>
                          Try to solve the challenge before viewing the solution to maximize your learning.
                        </p>
                        
                        <button
                          onClick={() => { sound.playVictory(); setSolutionRevealed(prev => ({ ...prev, [activeQuestion.id]: true })); }}
                          style={{
                            background: theme.btnPrimaryBg, color: theme.btnPrimaryText, border: "none",
                            padding: "10px 24px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                          }}
                        >
                          Reveal Answer
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "1px", color: "#10b981", textTransform: "uppercase" }}>
                            Model Solution
                          </div>
                          <button
                            onClick={() => setSolutionRevealed(prev => ({ ...prev, [activeQuestion.id]: false }))}
                            style={{ background: "transparent", border: "none", color: theme.textTertiary, fontSize: "12px", fontWeight: "500", cursor: "pointer" }}
                          >
                            Hide
                          </button>
                        </div>
                        
                        {activeQuestion.codeTemplate ? (
                          <div style={{
                            background: theme.codeBg, border: `1px solid ${theme.codeBorder}`,
                            borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                          }}>
                            <div style={{
                              display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${theme.codeBorder}`, background: "rgba(255,255,255,0.02)"
                            }}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f56" }} />
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ffbd2e" }} />
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#27c93f" }} />
                              </div>
                            </div>
                            <pre style={{ margin: 0, padding: "20px", fontSize: "13px", fontFamily: "'Fira Code', monospace", color: theme.codeText, overflowX: "auto", lineHeight: "1.6" }}>
                              <code>{activeQuestion.answer}</code>
                            </pre>
                          </div>
                        ) : (
                          <div style={{
                            padding: "24px", background: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                            borderRadius: "12px", border: `1px solid ${theme.borderHighlight}`, fontSize: "15px", lineHeight: "1.7", color: theme.textPrimary
                          }}>
                            {formatText(activeQuestion.answer)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
            </div>
          ) : (
            <div style={{
              background: theme.panelBg, backdropFilter: theme.panelBlur, WebkitBackdropFilter: theme.panelBlur,
              border: `1px solid ${theme.border}`, borderRadius: "24px", padding: "40px",
              display: "flex", alignItems: "center", justifyContent: "center", minHeight: "680px", color: theme.textTertiary
            }}>
              Select a task from the list to view its details.
            </div>
          )}

          {/* RIGHT COLUMN (NOW THE MINIMALIST LIST) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
            {sortedQuestions.map((q, idx) => {
              const isActive = activeQuestionId === q.id;
              const isDone = completedIds.includes(q.id);
              
              return (
                <div
                  key={q.id}
                  onClick={() => { sound.playClockTick(); setActiveQuestionId(q.id); }}
                  className={`sleek-task-row ${isActive ? "active" : ""}`}
                  style={{
                    background: isActive ? theme.taskActiveBg : "transparent",
                    border: isActive ? `1px solid ${theme.borderHighlight}` : "1px solid transparent",
                    borderRadius: "16px", padding: "16px", cursor: "pointer",
                    display: "flex", gap: "16px", alignItems: "center",
                    boxShadow: isActive ? theme.taskActiveShadow : "none",
                  }}
                >
                  <div
                    onClick={(e) => handleToggleQuestion(q.id, e)}
                    style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      border: isDone ? "none" : `1.5px solid ${theme.textTertiary}`,
                      background: isDone ? "#10b981" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s ease", flexShrink: 0,
                      boxShadow: isDone ? "0 0 12px rgba(16,185,129,0.3)" : "none"
                    }}
                  >
                    {isDone && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: getDiffColor(q.difficulty) }} />
                      <span style={{ fontSize: "11px", fontWeight: "600", color: theme.textSecondary }}>
                        {q.difficulty}
                      </span>
                    </div>
                    
                    <h4 style={{
                      margin: 0, fontSize: "13px", fontWeight: "500", lineHeight: "1.5",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      overflow: "hidden", textOverflow: "ellipsis",
                      color: isDone ? theme.textTertiary : theme.textPrimary
                    }}>
                      {formatText(q.question)}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
