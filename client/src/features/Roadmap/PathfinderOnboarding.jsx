import { useState, useEffect, useRef } from "react";
import * as sound from "../../utils/audio";

const QUICK_QUESTIONS = [
  {
    id: "topic",
    question: "What do you want to learn?",
    hint: "Be specific — e.g. 'Full Stack Web Dev', 'Machine Learning', 'Guitar', 'Physics', 'Investing'",
    placeholder: "I want to learn..."
  },
  {
    id: "why",
    question: "Why do you want to learn this?",
    hint: "Your reason shapes the whole roadmap — job, startup, curiosity, exam, passion project?",
    placeholder: "Because I want to..."
  },
  {
    id: "time",
    question: "How much time can you dedicate daily?",
    hint: "Be realistic — 20 min? 1 hour? 3 hours on weekends?",
    placeholder: "About... hours/day..."
  },
  {
    id: "background",
    question: "What's your current level with this topic?",
    hint: "Complete beginner? Some basics? Stuck at intermediate? Coming from a related field?",
    placeholder: "Right now I..."
  },
  {
    id: "goal",
    question: "What does success look like in 3 months?",
    hint: "A job offer? A working app? Passing an exam? Being able to explain it to someone?",
    placeholder: "In 3 months I want to..."
  }
];

const DETAILED_QUESTIONS = [
  {
    id: "problem",
    question: "What exactly are you trying to achieve, and what problem is driving you?",
    hint: "Tell me the specific reason or frustration pushing you to learn this right now.",
    placeholder: "I want to achieve... because I am currently facing..."
  },
  {
    id: "history",
    question: "What have you tried so far, and where did you get stuck?",
    hint: "Did you watch videos? Read books? What confused or frustrated you the most?",
    placeholder: "So far I have tried... and I usually get stuck when..."
  },
  {
    id: "dream",
    question: "What is your ultimate 'dream outcome' if you master this?",
    hint: "How would this change your day-to-day life, career, or personal satisfaction?",
    placeholder: "My dream outcome is..."
  },
  {
    id: "constraints",
    question: "What are your biggest distractions or time constraints?",
    hint: "Be honest. Social media? Work? Procrastination? How much time can you really commit?",
    placeholder: "My biggest distraction is... I can realistically commit..."
  },
  {
    id: "style",
    question: "How do you learn best?",
    hint: "Visual examples? Building projects? Reading docs? Let the AI know your style.",
    placeholder: "I learn best when..."
  }
];

const ENGINEER_QUESTIONS = [
  {
    id: "why",
    question: "Why do you want to learn this?",
    hint: "This shapes your roadmap's focus.",
    type: "options",
    options: ["Job", "School / College", "Knowledge"]
  },
  {
    id: "topic",
    question: "What language or technology do you wanna use?",
    hint: "Be specific — e.g. 'JavaScript', 'Python', 'React', 'Rust'",
    placeholder: "I want to learn...",
    type: "text"
  },
  {
    id: "specialty",
    question: "What specific area do you want to focus on?",
    hint: "e.g. 'Backend', 'Frontend', 'Data Science', 'Game Dev'",
    placeholder: "I want to focus on...",
    type: "text"
  },
  {
    id: "difficulty",
    question: "Choose your difficulty level.",
    hint: "Easy covers basics. Hell Mode ensures maximum practical mastery.",
    type: "options",
    options: ["Easy", "Medium", "Hell"]
  }
];

export default function PathfinderOnboarding({ username, backendUrl, onRoadmapReady, initialTopic }) {
  const [role, setRole] = useState(initialTopic ? "non-engineer" : null); // 'engineer' | 'non-engineer'
  const [pathfinderMode, setPathfinderMode] = useState(initialTopic ? "quick" : null); // 'quick' | 'detailed' | 'engineer'
  
  const activeQuestions = pathfinderMode === 'engineer' ? ENGINEER_QUESTIONS : pathfinderMode === 'detailed' ? DETAILED_QUESTIONS : QUICK_QUESTIONS;
  
  const [currentQ, setCurrentQ] = useState(initialTopic ? 1 : 0);
  const [answers, setAnswers] = useState(() => {
    const saved = Array(5).fill("");
    if (initialTopic) {
      saved[0] = initialTopic;
    }
    return saved;
  });
  const [inputVal, setInputVal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genLog, setGenLog] = useState([]);
  const [genStep, setGenStep] = useState(0);
  const [typed, setTyped] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const inputRef = useRef(null);

  const GEN_LOGS = [
    "🔗 Connecting to cognitive engine...",
    "📖 Reading your learning profile...",
    "🧠 Analyzing goals and motivations...",
    "🗺️ Architecting personalized roadmap...",
    "🎯 Curating milestone video queries...",
    "⚡ Generating XP rewards and unlock logic...",
    "✅ Roadmap construction complete!"
  ];

  // Typewriter effect for question
  useEffect(() => {
    if (!pathfinderMode) return;
    const q = activeQuestions[currentQ]?.question || "";
    setTyped("");
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < q.length) {
        setTyped(q.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
        inputRef.current?.focus();
      }
    }, 28);
    return () => clearInterval(interval);
  }, [currentQ, pathfinderMode]);

  // Generation log animation
  useEffect(() => {
    if (!isGenerating) return;
    setGenLog([]);
    setGenStep(0);
    const interval = setInterval(() => {
      setGenStep(prev => {
        const next = prev + 1;
        setGenLog(GEN_LOGS.slice(0, next));
        sound.playClockTick();
        if (next >= GEN_LOGS.length) clearInterval(interval);
        return next;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleNext = async () => {
    if (!inputVal.trim()) return;
    sound.playClockTick();

    const newAnswers = [...answers];
    newAnswers[currentQ] = inputVal.trim();
    setAnswers(newAnswers);
    setInputVal("");

    if (currentQ < activeQuestions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      // All questions answered — generate roadmap
      setIsGenerating(true);
      try {
        const payload = activeQuestions.map((q, i) => ({
          question: q.question,
          answer: newAnswers[i] || answers[i]
        }));
        
        let reqBody = { answers: payload, pathfinderMode };
        if (pathfinderMode === 'engineer') {
          reqBody.isEngineer = true;
          reqBody.devGoal = newAnswers[0];
          reqBody.devLanguage = newAnswers[1];
          // newAnswers[2] is the specialty, which is automatically included in the QA string sent to the LLM
          reqBody.difficulty = newAnswers[3];
        }

        const res = await fetch(`${backendUrl}/api/pathfinder/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody)
        });

        const roadmap = await res.json();
        // Save to localStorage
        localStorage.setItem(`kaevrix_roadmap_${username}`, JSON.stringify(roadmap));
        localStorage.setItem(`kaevrix_roadmap_answers_${username}`, JSON.stringify(payload));

        setTimeout(() => {
          onRoadmapReady(roadmap);
        }, 800);
      } catch (err) {
        console.error("Roadmap generation error:", err);
        setIsGenerating(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const handleBack = () => {
    sound.playClockTick();
    if (currentQ > 0) {
      setCurrentQ(prev => prev - 1);
      setInputVal(answers[currentQ - 1]);
    } else if (pathfinderMode) {
      setPathfinderMode(null);
      if (role === 'engineer') setRole(null);
    } else if (role) {
      setRole(null);
    }
  };

  if (isGenerating) {
    return (
      <div style={{
        minHeight: "60vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "40px 20px"
      }}>
        {/* Brain animation */}
        <div style={{
          width: "90px", height: "90px", borderRadius: "50%",
          background: "linear-gradient(135deg, #ff6a00, #ffb300)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "44px", marginBottom: "32px",
          boxShadow: "0 10px 30px rgba(255,106,0,0.3)",
          animation: "pulse 1.5s infinite"
        }}>
          🧠
        </div>

        <h2 style={{ 
          fontSize: "28px", 
          fontWeight: "900", 
          fontFamily: "var(--font-outfit), sans-serif",
          color: "var(--text-light)", 
          marginBottom: "8px", 
          textAlign: "center" 
        }}>
          Building Your Personalized Roadmap
        </h2>
        <p style={{ 
          color: "var(--text-muted)", 
          fontSize: "15px",
          fontFamily: "var(--font-sans)",
          marginBottom: "40px", 
          textAlign: "center" 
        }}>
          Gemma AI is reading your profile and crafting your learning path...
        </p>

        {/* Clean, open SaaS-style processing list */}
        <div style={{
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          {genLog.map((log, i) => (
            <div key={i} style={{
              fontSize: "14px",
              fontWeight: "700",
              fontFamily: "var(--font-outfit), sans-serif",
              color: i === genLog.length - 1 ? "#ff6a00" : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 18px",
              borderRadius: "12px",
              background: i === genLog.length - 1 
                ? "rgba(255, 106, 0, 0.05)"
                : "transparent",
              border: i === genLog.length - 1
                ? "1px solid rgba(255, 106, 0, 0.15)"
                : "1px solid transparent",
              transition: "all 0.3s ease"
            }}>
              <span style={{
                fontSize: "14px",
                color: i < genLog.length - 1 ? "#10b981" : "#ff6a00",
                fontWeight: "900"
              }}>
                {i < genLog.length - 1 ? "✓" : "⚡"}
              </span>
              <span>{log}</span>
            </div>
          ))}
          {genStep < GEN_LOGS.length && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px" }}>
              <div style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: "#ff6a00", animation: "pulse 0.8s infinite"
              }} />
              <span style={{ 
                fontFamily: "var(--font-sans)", 
                fontSize: "13px", 
                color: "var(--text-muted)",
                fontWeight: "500" 
              }}>
                processing...
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const progress = (currentQ / activeQuestions.length) * 100;

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "#fff7ed", padding: "6px 16px", borderRadius: "20px",
          border: "1px solid #fed7aa", marginBottom: "16px"
        }}>
          <span style={{ fontSize: "14px" }}>🧠</span>
          <span style={{ fontSize: "12px", fontWeight: "800", color: "#ea580c", textTransform: "uppercase", letterSpacing: "1px" }}>
            Pathfinder Onboarding
          </span>
        </div>
        <h1 style={{ fontSize: "32px", fontWeight: "900", color: "var(--text-light)", marginBottom: "8px" }}>
          Let's build your<br />
          <span style={{ background: "linear-gradient(135deg, #ff6a00, #ffb300)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            learning roadmap
          </span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
          Answer 5 quick questions. AI reads them and builds your personalized path.
        </p>
      </div>

      {!role && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
          <h2 style={{ textAlign: "center", fontSize: "20px", fontWeight: "800", color: "var(--text-light)", marginBottom: "8px" }}>What is your background?</h2>
          <button
            onClick={() => { sound.playClockTick(); setRole("engineer"); setPathfinderMode("engineer"); setCurrentQ(0); setInputVal(""); setAnswers(Array(3).fill("")); }}
            style={{
              background: "#ffffff", border: "1px solid #e2e8f0",
              borderRadius: "16px", padding: "24px",
              textAlign: "left", cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#ff6a00"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            <div style={{ fontSize: "18px", fontWeight: "900", color: "var(--text-light)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>💻</span> Engineer / Comp Science
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.5" }}>
              Tailored paths for developers with specialized technical depths and rigorous capabilities.
            </div>
          </button>

          <button
            onClick={() => { sound.playClockTick(); setRole("non-engineer"); }}
            style={{
              background: "#ffffff", border: "1px solid #e2e8f0",
              borderRadius: "16px", padding: "24px",
              textAlign: "left", cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#ff6a00"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            <div style={{ fontSize: "18px", fontWeight: "900", color: "var(--text-light)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🌍</span> Non-Engineer
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.5" }}>
              Learn anything else—languages, sciences, history, or business.
            </div>
          </button>
        </div>
      )}

      {role === "non-engineer" && !pathfinderMode && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
          <button
            onClick={() => { sound.playClockTick(); setPathfinderMode("quick"); setCurrentQ(0); setInputVal(""); setAnswers(Array(5).fill("")); }}
            style={{
              background: "#ffffff", border: "1px solid #e2e8f0",
              borderRadius: "16px", padding: "24px",
              textAlign: "left", cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#ff6a00"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            <div style={{ fontSize: "18px", fontWeight: "900", color: "var(--text-light)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚡</span> Quick Setup
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.5" }}>
              Standard 5 questions to build your path quickly. Ideal for straightforward topics.
            </div>
          </button>

          <button
            onClick={() => { sound.playClockTick(); setPathfinderMode("detailed"); setCurrentQ(0); setInputVal(""); setAnswers(Array(5).fill("")); }}
            style={{
              background: "#ffffff", border: "1px solid #e2e8f0",
              borderRadius: "16px", padding: "24px",
              textAlign: "left", cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#ff6a00"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            <div style={{ fontSize: "18px", fontWeight: "900", color: "var(--text-light)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🧠</span> Deep Dive
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.5" }}>
              Open-ended questions about your problems, goals, and learning style for a highly tailored AI roadmap.
            </div>
          </button>
        </div>
      )}

      {pathfinderMode && (
        <>
          {/* Progress bar */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>
            Question {currentQ + 1} of {activeQuestions.length}
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            {activeQuestions.map((_, i) => (
              <div key={i} style={{
                width: i === currentQ ? "24px" : "8px",
                height: "8px", borderRadius: "4px",
                background: i < currentQ ? "#ff6a00" : i === currentQ ? "linear-gradient(90deg, #ff6a00, #ffb300)" : "#e2e8f0",
                backgroundColor: i < currentQ ? "#ff6a00" : i === currentQ ? "#ff6a00" : "#e2e8f0",
                transition: "all 0.3s"
              }} />
            ))}
          </div>
        </div>
        <div style={{ height: "4px", background: "#e2e8f0", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: "linear-gradient(90deg, #ff6a00, #ffb300)",
            borderRadius: "2px", transition: "width 0.4s ease"
          }} />
        </div>
      </div>

      {/* Question card */}
      <div style={{
        background: "#ffffff", borderRadius: "24px",
        padding: "40px", border: "1px solid #e2e8f0",
        boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
        marginBottom: "20px"
      }}>
        {/* Question number badge */}
        <div style={{
          width: "40px", height: "40px", borderRadius: "12px",
          background: "linear-gradient(135deg, #ff6a00, #ffb300)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px", fontWeight: "900", color: "#fff",
          marginBottom: "20px", boxShadow: "0 4px 12px rgba(255,106,0,0.3)"
        }}>
          {currentQ + 1}
        </div>

        {/* Question text with typewriter */}
        <h2 style={{
          fontSize: "26px", fontWeight: "800", color: "var(--text-light)",
          marginBottom: "8px", lineHeight: "1.3", minHeight: "64px"
        }}>
          {typed}
          {isTyping && (
            <span style={{
              display: "inline-block", width: "3px", height: "28px",
              background: "#ff6a00", marginLeft: "2px",
              verticalAlign: "middle", animation: "pulse 0.8s infinite"
            }} />
          )}
        </h2>

        {/* Hint */}
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "28px", lineHeight: "1.6" }}>
          💡 {activeQuestions[currentQ]?.hint}
        </p>

        {/* Input */}
        {activeQuestions[currentQ]?.type === "options" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activeQuestions[currentQ].options.map(opt => (
              <button
                key={opt}
                onClick={() => {
                  setInputVal(opt);
                  sound.playClockTick();
                }}
                style={{
                  padding: "16px", borderRadius: "14px", textAlign: "left",
                  fontSize: "16px", fontWeight: "700", color: inputVal === opt ? "#fff" : "var(--text-light)",
                  background: inputVal === opt ? "linear-gradient(135deg, #ff6a00, #ffb300)" : "#f8fafc",
                  border: inputVal === opt ? "2px solid #ff6a00" : "2px solid #e2e8f0",
                  cursor: "pointer", transition: "all 0.2s",
                  boxShadow: inputVal === opt ? "0 4px 12px rgba(255,106,0,0.2)" : "none"
                }}
                onMouseOver={e => {
                  if (inputVal !== opt) {
                    e.currentTarget.style.borderColor = "#ff6a00";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseOut={e => {
                  if (inputVal !== opt) {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.transform = "none";
                  }
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            ref={inputRef}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeQuestions[currentQ]?.placeholder}
            rows={3}
            style={{
              width: "100%", padding: "16px 20px",
              fontSize: "16px", color: "var(--text-light)",
              background: "#f8fafc", border: "2px solid #e2e8f0",
              borderRadius: "14px", outline: "none", resize: "none",
              fontFamily: "var(--font-sans)", lineHeight: "1.6",
              transition: "border-color 0.2s, box-shadow 0.2s",
              boxSizing: "border-box"
            }}
            onFocus={e => {
              e.target.style.borderColor = "#ff6a00";
              e.target.style.boxShadow = "0 0 0 3px rgba(255,106,0,0.1)";
              e.target.style.background = "#ffffff";
            }}
            onBlur={e => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.boxShadow = "none";
              e.target.style.background = "#f8fafc";
            }}
          />
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
          <button
            onClick={handleBack}
            style={{
              padding: "12px 24px", borderRadius: "12px",
              border: "1.5px solid #e2e8f0", background: "transparent",
              color: "var(--text-muted)", fontWeight: "700", fontSize: "14px",
              cursor: "pointer", transition: "all 0.2s"
            }}
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            disabled={!inputVal.trim()}
            style={{
              padding: "14px 32px", borderRadius: "14px",
              border: "none",
              background: inputVal.trim() ? "linear-gradient(135deg, #ff6a00, #ffb300)" : "#e2e8f0",
              color: inputVal.trim() ? "#fff" : "#94a3b8",
              fontWeight: "800", fontSize: "15px",
              cursor: inputVal.trim() ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              boxShadow: inputVal.trim() ? "0 6px 20px rgba(255,106,0,0.35)" : "none",
              letterSpacing: "0.5px"
            }}
            onMouseOver={e => { if (inputVal.trim()) e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "none"; }}
          >
            {currentQ === activeQuestions.length - 1 ? "🚀 Build My Roadmap" : "Continue →"}
          </button>
        </div>

        {/* Enter hint */}
        <p style={{ textAlign: "right", marginTop: "8px", fontSize: "11px", color: "#cbd5e1" }}>
          Press Enter to continue
        </p>
      </div>

      {/* Previous answers recap */}
      {currentQ > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {answers.slice(0, currentQ).map((ans, i) => ans && (
            <div key={i} style={{
              display: "flex", gap: "12px", alignItems: "flex-start",
              padding: "12px 16px", background: "#f8fafc", borderRadius: "12px",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{
                width: "24px", height: "24px", borderRadius: "6px",
                background: "#ff6a00", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: "900", flexShrink: 0
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>
                  {activeQuestions[i].question}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-light)", fontWeight: "600" }}>
                  {ans}
                </div>
              </div>
              <button
                onClick={() => { sound.playClockTick(); setCurrentQ(i); setInputVal(ans); }}
                style={{
                  background: "none", border: "none", color: "var(--text-muted)",
                  cursor: "pointer", fontSize: "12px", padding: "2px 6px",
                  borderRadius: "4px", flexShrink: 0
                }}
                onMouseOver={e => e.currentTarget.style.color = "#ff6a00"}
                onMouseOut={e => e.currentTarget.style.color = "var(--text-muted)"}
              >
                ✏️ Edit
              </button>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
