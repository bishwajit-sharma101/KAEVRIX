import { useState, useEffect } from "react";
import YoutubePlayer from "../Shared/YoutubePlayer";
import ChatBox from "../Shared/ChatBox";
import * as sound from "../../utils/audio";
import { getUnlockedSkills } from "../../utils/characterClasses";

export default function GameArena({
  room,
  socket,
  username,
  opponent,
  myProgress,
  opponentProgress,
  energy,
  isFrozen,
  isBlurred,
  opponentWaiting,
  chatMessages,
  chatInput,
  setChatInput,
  onSendChat,
  onVideoProgress,
  onVideoFinished,
  onUsePowerup,
  selectedClass,
  level
}) {
  const myUnlockedSkills = getUnlockedSkills(selectedClass || "doomscroller", level || 1);
  const [videoPlaybackRate, setVideoPlaybackRate] = useState(1);
  const isSpeedrunner = (selectedClass || "").toLowerCase() === "speedrunner";
  const [activeMilestones, setActiveMilestones] = useState([]);
  const isHellMode = localStorage.getItem("hellMode") === "true" || (JSON.parse(localStorage.getItem(`kaevrix_roadmap_progress_${username}`) || '{}').difficulty === "Hell");

  useEffect(() => {
    if (!username) return;
    const saved = localStorage.getItem(`kaevrix_roadmap_progress_${username}`);
    if (saved) {
      try {
        const roadmap = JSON.parse(saved);
        // Hell mode detection is handled synchronously above
        let milestones = [];
        if (roadmap.level1?.milestones?.some(m => m.status !== "completed")) {
          milestones = roadmap.level1.milestones;
        } else if (roadmap.level2?.milestones?.some(m => m.status !== "completed")) {
          milestones = roadmap.level2.milestones;
        } else if (roadmap.level3?.milestones?.some(m => m.status !== "completed")) {
          milestones = roadmap.level3.milestones;
        } else {
          milestones = roadmap.level3?.milestones || [];
        }
        
        // Only show completed and currently unlocked milestones, hide future locked ones
        milestones = milestones.filter(m => m.status !== "locked");
        
        setActiveMilestones(milestones);
      } catch (e) {
        console.error("Failed to parse roadmap logic in GameArena:", e);
      }
    }
  }, [username]);

  // Pop Quiz States
  const [activeInVideoQuestion, setActiveInVideoQuestion] = useState(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(-1);
  const [promptedQuestionIndices, setPromptedQuestionIndices] = useState([]);
  const [timer, setTimer] = useState(6);
  const [isLocalPaused, setIsLocalPaused] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [submittedAnswerIndex, setSubmittedAnswerIndex] = useState(null);
  const [feedbackActive, setFeedbackActive] = useState(false);
  const [correctAnswerIdx, setCorrectAnswerIdx] = useState(null);

  const handleAnswerSubmit = (oIdx, remainingSecs = timer) => {
    if (feedbackActive || submittedAnswerIndex !== null) return;
    setSubmittedAnswerIndex(oIdx);
    socket.emit("submit_in_video_answer", {
      questionIdx: activeQuestionIdx,
      answerIndex: oIdx,
      remainingSeconds: remainingSecs
    });
  };

  const handleLocalProgress = (currentTime) => {
    if (!room || !room.video || !room.video.inVideoQuestions) return;

    const inVideoQs = room.video.inVideoQuestions;
    const nextQIdx = inVideoQs.findIndex((q, idx) => 
      currentTime >= q.timestamp && !promptedQuestionIndices.includes(idx)
    );

    if (nextQIdx !== -1) {
      const q = inVideoQs[nextQIdx];
      setActiveInVideoQuestion(q);
      setActiveQuestionIdx(nextQIdx);
      setPromptedQuestionIndices((prev) => [...prev, nextQIdx]);
      setIsLocalPaused(true);
      setTimer(6);
      setSubmittedAnswerIndex(null);
      setFeedbackActive(false);
      setResultMessage("");
      setCorrectAnswerIdx(null);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleResult = ({ questionIdx, isCorrect, correctAnswerIdx: serverCorrectIdx, submittedAnswerIdx, xpGained, scoreGained }) => {
      if (isCorrect) {
        sound.playCorrect();
        setResultMessage(`🎉 Correct! +${xpGained} XP`);
      } else {
        sound.playIncorrect();
        setResultMessage(submittedAnswerIdx === -1 ? `⏰ Time's Up!` : `❌ Incorrect!`);
      }

      setCorrectAnswerIdx(serverCorrectIdx);
      setFeedbackActive(true);

      setTimeout(() => {
        setIsLocalPaused(false);
        setActiveInVideoQuestion(null);
        setFeedbackActive(false);
        setResultMessage("");
        setCorrectAnswerIdx(null);
        setSubmittedAnswerIndex(null);
      }, 2000);
    };

    socket.on("in_video_answer_result", handleResult);
    return () => {
      socket.off("in_video_answer_result", handleResult);
    };
  }, [socket, activeQuestionIdx]);

  useEffect(() => {
    let interval = null;
    if (activeInVideoQuestion && !feedbackActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(interval);
            handleAnswerSubmit(-1, 0);
            return 0;
          }
          sound.playClockTick();
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeInVideoQuestion, feedbackActive, timer, activeQuestionIdx]);

  const getSkillCost = (skillLevel) => {
    if (skillLevel === 1) return 25;
    if (skillLevel === 10) return 40;
    if (skillLevel === 20) return 60;
    if (skillLevel === 30) return 80;
    return 100;
  };

  const handleUsePowerupClick = (skill) => {
    const cost = getSkillCost(skill.level);
    if (energy < cost) return;
    sound.playClockTick();

    // Speedrunner's "2x Speed" is a LOCAL self-buff — toggle video speed directly
    if (isSpeedrunner && skill.name === "2x Speed") {
      const newRate = videoPlaybackRate === 2 ? 1 : 2;
      setVideoPlaybackRate(newRate);
      // Still deduct energy
      onUsePowerup({ type: "__local_2x_speed__", cost });
      return;
    }

    onUsePowerup({ type: skill.name, cost });
  };

  const handleSkipToQuiz = () => {
    sound.playClockTick();
    onVideoFinished(true);
  };

  return (
    <div className="arena-grid">
      <main className="arena-video-pane">
        {/* Video Frame Area */}
        <div className="video-player-outer-wrapper">
          <div className={isBlurred ? "arena-viewport-blurred" : "arena-viewport-normal"}>
            <YoutubePlayer
              videoId={room?.video.id}
              onProgress={(progress, currentTime) => {
                onVideoProgress(progress);
                handleLocalProgress(currentTime);
              }}
              onFinished={() => onVideoFinished(false)}
              isFrozen={isFrozen || isLocalPaused}
              playbackRate={videoPlaybackRate}
            />
          </div>

          {/* Pop Quiz Overlay */}
          {activeInVideoQuestion && (
            <div className="in-video-quiz-overlay" style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(10, 10, 18, 0.9)",
              backdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              color: "#fff",
              padding: "20px",
              boxSizing: "border-box"
            }}>
              <div style={{
                width: "100%",
                maxWidth: "480px",
                background: "rgba(20, 20, 35, 0.8)",
                border: "2px solid var(--glass-border)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                position: "relative",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                {/* Header with Countdown */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  paddingBottom: "12px"
                }}>
                  <span style={{
                    fontFamily: "var(--font-gamer)",
                    fontSize: "13px",
                    color: "var(--neon-orange)",
                    letterSpacing: "1px",
                    fontWeight: "900"
                  }}>
                    ⚠️ POP QUIZ DETECTED
                  </span>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-gamer)" }}>TIMER:</span>
                    <span style={{
                      fontFamily: "var(--font-gamer)",
                      fontSize: "18px",
                      color: timer <= 2 ? "var(--neon-pink)" : "var(--neon-gold)",
                      textShadow: timer <= 2 ? "0 0 10px var(--neon-pink)" : "0 0 10px var(--neon-gold)",
                      fontWeight: "900"
                    }}>
                      {timer}s
                    </span>
                  </div>
                </div>

                {/* Feedback Message */}
                {feedbackActive && resultMessage && (
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 10,
                    background: "rgba(10, 10, 18, 0.95)",
                    border: "2px solid var(--glass-border)",
                    borderRadius: "12px",
                    padding: "16px 24px",
                    textAlign: "center",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                    fontFamily: "var(--font-gamer)",
                    fontSize: "20px",
                    color: resultMessage.includes("Correct") ? "var(--neon-green)" : "var(--neon-pink)",
                    textShadow: resultMessage.includes("Correct") ? "0 0 10px var(--neon-green)" : "0 0 10px var(--neon-pink)",
                    width: "80%"
                  }}>
                    {resultMessage}
                  </div>
                )}

                {/* Question Text */}
                <div style={{
                  fontFamily: "var(--font-outfit)",
                  fontSize: "16px",
                  fontWeight: "700",
                  lineHeight: "1.4"
                }}>
                  {activeInVideoQuestion.question}
                </div>

                {/* Options */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}>
                  {activeInVideoQuestion.options.map((opt, oIdx) => {
                    let btnBg = "var(--bg-dark-surface)";
                    let btnBorder = "1px solid var(--glass-border)";
                    let letterBg = "rgba(128,128,128,0.15)";
                    let letterColor = "var(--text-muted)";

                    if (feedbackActive) {
                      if (oIdx === correctAnswerIdx) {
                        btnBg = "rgba(0, 230, 118, 0.15)";
                        btnBorder = "1px solid var(--neon-green)";
                        letterBg = "var(--neon-green)";
                        letterColor = "#fff";
                      } else if (oIdx === submittedAnswerIndex) {
                        btnBg = "rgba(255, 0, 127, 0.15)";
                        btnBorder = "1px solid var(--neon-pink)";
                        letterBg = "var(--neon-pink)";
                        letterColor = "#fff";
                      }
                    } else if (oIdx === submittedAnswerIndex) {
                      btnBorder = "1px solid var(--neon-orange)";
                      btnBg = "rgba(255, 106, 0, 0.1)";
                      letterBg = "var(--neon-orange)";
                      letterColor = "#fff";
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={feedbackActive || submittedAnswerIndex !== null}
                        onClick={() => handleAnswerSubmit(oIdx)}
                        style={{
                          background: btnBg,
                          border: btnBorder,
                          borderRadius: "10px",
                          padding: "10px 14px",
                          textAlign: "left",
                          color: "var(--text-light)",
                          fontSize: "13px",
                          cursor: feedbackActive ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          width: "100%",
                          outline: "none"
                        }}
                      >
                        <div style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          background: letterBg,
                          color: letterColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--font-gamer)",
                          fontWeight: "800",
                          fontSize: "10px",
                          flexShrink: 0
                        }}>
                          {String.fromCharCode(65 + oIdx)}
                        </div>
                        <div style={{ flex: 1 }}>{opt}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2x speed active badge */}
          {videoPlaybackRate === 2 && (
            <div className="speedrun-badge" style={{
              position: "absolute", top: "10px", left: "10px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff", fontWeight: "900", fontSize: "13px",
              padding: "4px 12px", borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(16,185,129,0.5)",
              letterSpacing: "0.5px", zIndex: 10,
              animation: "pulse 1.5s infinite",
              width: "auto",
              height: "auto",
              pointerEvents: "none"
            }}>
              ⚡ 2× SPEED ACTIVE
            </div>
          )}
          
          {/* Active Glitch Overlays */}
          {isFrozen && (
            <div className="debuff-overlay-freeze">
              <div className="debuff-text-freeze">⚡ EMP FREEZE ACTIVE ⚡</div>
              <div className="debuff-desc-freeze">Opponent jammer deployed. Video feed suspended!</div>
            </div>
          )}

          {isBlurred && (
            <div className="debuff-overlay-blur">
              <div className="debuff-text-blur">🌫️ SMOKE SCREEN ACTIVE 🌫️</div>
              <div style={{ color: "#fff", fontSize: "12px", textShadow: "0 0 5px #000", fontFamily: "var(--font-gamer)" }}>
                Tactical visibility shield engaged.
              </div>
            </div>
          )}
        </div>
        
        {/* Video Header Controls */}
        <div className="video-title-bar">
          <div>
            <h3 className="arena-video-title">{room?.video.title}</h3>
            <p className="arena-video-creator">📺 {room?.video.channel} | Category: {room?.video.category}</p>
          </div>
          <button 
            className={`btn-primary ${room?.generatingQuiz ? "btn-disabled" : ""}`} 
            style={{ padding: "10px 20px", borderRadius: "10px" }} 
            onClick={handleSkipToQuiz}
            disabled={room?.generatingQuiz}
          >
            Skip to Quiz ➜
          </button>
        </div>

        {/* Cyber Weapon Action Panel */}
        <div className="powerups-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
          {myUnlockedSkills.map(skill => {
            const cost = getSkillCost(skill.level);
            return (
              <button 
                key={skill.name}
                className="powerup-btn" 
                disabled={energy < cost} 
                onClick={() => handleUsePowerupClick(skill)}
                style={{ 
                  background: energy >= cost ? "var(--accent-gradient)" : "var(--bg-dark-surface)",
                  color: energy >= cost ? "#fff" : "var(--text-muted)",
                  border: energy >= cost ? "none" : "1px solid var(--glass-border)",
                  opacity: energy >= cost ? 1 : 0.6,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: energy >= cost ? "pointer" : "not-allowed",
                  transition: "all 0.2s"
                }}
                title={skill.desc}
              >
                <span style={{ fontSize: "14px", fontWeight: "bold", textAlign: "center" }}>{skill.name}</span>
                <span className="powerup-btn-cost" style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" }}>{cost}% energy</span>
              </button>
            )
          })}
          {myUnlockedSkills.length === 0 && (
            <div style={{ color: "var(--text-muted)", padding: "10px" }}>No skills unlocked yet.</div>
          )}
        </div>
      </main>

      {/* Side Tracker Monitor & Chat */}
      <aside className="dashboard-sidebar">
        {/* Duel Progress Track Monitor */}
        <div className="glass-panel duel-monitor">
          <h4 className="panel-title" style={{ borderLeftColor: "var(--neon-pink)" }}>Duel Status Tracker</h4>
          
          <div className="progress-track-row">
            <div className="progress-track-info">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="track-label player-indicator">👤 {username} (You)</span>
                {isHellMode && (
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "#ef4444", border: "1px solid #ef4444", padding: "1px 6px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", letterSpacing: "1px", marginLeft: "4px" }}>🔥 HELL</span>
                )}
              </div>
              <span style={{ color: "var(--neon-gold)", fontFamily: "var(--font-gamer)", fontWeight: "bold" }}>
                {room?.players.find(p => p.username === username)?.score || 0} pts
              </span>
              <span>{myProgress}%</span>
            </div>
            <div className="progress-bar-base">
              <div className="progress-bar-fill player-fill" style={{ width: `${myProgress}%` }}></div>
            </div>
          </div>

          <div className="progress-track-row">
            <div className="progress-track-info">
              <span className="track-label opponent-indicator">
                {opponent?.isBot ? "🤖" : "👤"} {opponent?.username}
              </span>
              <span style={{ color: "var(--neon-gold)", fontFamily: "var(--font-gamer)", fontWeight: "bold" }}>
                {room?.players.find(p => p.username !== username)?.score || 0} pts
              </span>
              <span>{opponentProgress}%</span>
            </div>
            <div className="progress-bar-base">
              <div className="progress-bar-fill opponent-fill" style={{ width: `${opponentProgress}%` }}></div>
            </div>
          </div>
          
          {opponentWaiting && (
            <div className="opponent-waiting-alert animate-pulse">
              ⚠️ Opponent has finished watching and is solving the quiz!
            </div>
          )}
        </div>

        {/* Battery Widget */}
        <div className="energy-bar-container glowing-border-cyan">
          <div className="energy-bar-header">
            <span>⚡ SYSTEM BATTERY POWERS</span>
            <span>{energy}%</span>
          </div>
          <div className="energy-bar-base">
            <div className={`energy-bar-fill ${energy === 100 ? "full" : ""}`} style={{ width: `${energy}%` }}></div>
          </div>
        </div>

        {/* Pathfinder To-Do Widget */}
        {activeMilestones.length > 0 && (
          <div className="glass-panel" style={{ padding: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <h4 className="panel-title" style={{ borderLeftColor: "var(--neon-orange)", marginBottom: "5px" }}>Active Directives</h4>
            <div className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto", paddingRight: "5px" }}>
              {activeMilestones.map(m => {
                const isMilestoneDone = m.status === "completed";
                const subtopicIndex = m.subtopicIndex || 0;
                
                return (
                  <div key={m.id} style={{ marginBottom: "12px" }}>
                    <div style={{
                      fontSize: "12px", fontWeight: "900", color: "var(--text-light)",
                      marginBottom: "6px", borderBottom: "1px solid rgba(255, 106, 0, 0.2)",
                      paddingBottom: "4px"
                    }}>
                      {m.title}
                    </div>
                    
                    {m.keyPoints?.map((pt, i) => {
                      const isDone = isMilestoneDone || i < subtopicIndex;
                      
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "flex-start", gap: "10px",
                          opacity: isDone ? 0.5 : 1,
                          background: isDone ? "transparent" : "rgba(255, 106, 0, 0.05)",
                          border: isDone ? "1px dashed transparent" : "1px solid rgba(255, 106, 0, 0.2)",
                          padding: isDone ? "4px 8px" : "8px 10px",
                          borderRadius: "6px",
                          marginBottom: "4px",
                          transition: "all 0.3s"
                        }}>
                          <div style={{
                            marginTop: isDone ? "0px" : "2px",
                            color: isDone ? "var(--neon-green)" : "var(--neon-orange)",
                            fontSize: "12px"
                          }}>
                            {isDone ? "✅" : "🔲"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: "12px", 
                              fontWeight: isDone ? "500" : "700", 
                              color: isDone ? "var(--text-muted)" : "var(--text-light)",
                              textDecoration: isDone ? "line-through" : "none",
                              lineHeight: "1.3"
                            }}>
                              {pt}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Chat Component */}
        <div className="glass-panel" style={{ flex: 1, minHeight: "280px", padding: "15px" }}>
          <ChatBox
            messages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSendChat={onSendChat}
            username={username}
            placeholder="Distract them during playback..."
          />
        </div>
      </aside>
    </div>
  );
}
