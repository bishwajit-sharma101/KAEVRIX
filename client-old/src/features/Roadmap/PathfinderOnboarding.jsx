import { useState, useEffect, useRef } from "react";
import { fetchWithJobPolling } from "../../utils/asyncJob";
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

export default function PathfinderOnboarding({ username, backendUrl, onRoadmapReady, initialTopic, isDarkMode }) {
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

        const res = await fetchWithJobPolling(`${backendUrl}/api/pathfinder/generate`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`
          },
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
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: pathfinderMode ? "10px 20px" : "30px 20px" }}>
      {/* Header */}
      {!pathfinderMode ? (
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: isDarkMode ? "rgba(255, 106, 0, 0.1)" : "#fff7ed",
            padding: "6px 16px", borderRadius: "20px",
            border: isDarkMode ? "1px solid rgba(255, 106, 0, 0.2)" : "1px solid #fed7aa",
            marginBottom: "16px"
          }}>
            <span style={{ fontSize: "14px" }}>🧠</span>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#ea580c", textTransform: "uppercase", letterSpacing: "1px" }}>
              Pathfinder Onboarding
            </span>
          </div>
          <h1 style={{ fontSize: "30px", fontWeight: "900", color: "var(--text-light)", marginBottom: "8px", fontFamily: "var(--font-outfit)", letterSpacing: "-0.5px" }}>
            Let's build your<br />
            <span style={{ background: "linear-gradient(135deg, #ff6a00, #ffb300)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              learning roadmap
            </span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
            Answer 5 quick questions. AI reads them and builds your personalized path.
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: isDarkMode ? "1px solid rgba(255,106,0,0.15)" : "1px solid rgba(255,106,0,0.08)", paddingBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>🧠</span>
            <span style={{ fontSize: "13px", fontWeight: "800", color: "var(--text-light)", fontFamily: "var(--font-outfit)" }}>
              Pathfinder Onboarding
            </span>
          </div>
          <span style={{ fontSize: "11px", fontWeight: "800", color: "#ff6a00", background: "rgba(255, 106, 0, 0.06)", border: "1px solid rgba(255, 106, 0, 0.15)", padding: "3px 8px", borderRadius: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {pathfinderMode === "engineer" ? "Technical Track" : "General Track"}
          </span>
        </div>
      )}

      {!role && (
        <div style={{ marginTop: "24px" }}>
          <h2 style={{
            textAlign: "center",
            fontSize: "20px",
            fontWeight: "800",
            color: "var(--text-light)",
            marginBottom: "24px",
            fontFamily: "var(--font-outfit)",
            letterSpacing: "-0.3px"
          }}>
            What is your background?
          </h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            maxWidth: "680px",
            margin: "0 auto"
          }}>
            {/* Engineer Option */}
            <button
              onClick={() => {
                sound.playClockTick();
                setRole("engineer");
                setPathfinderMode("engineer");
                setCurrentQ(0);
                setInputVal("");
                setAnswers(Array(3).fill(""));
              }}
              style={{
                position: "relative",
                background: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.25)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: isDarkMode ? "1px solid rgba(255, 106, 0, 0.15)" : "1px solid rgba(255, 106, 0, 0.1)",
                borderRadius: "24px",
                padding: "32px 24px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "space-between",
                height: "100%",
                minHeight: "200px",
                overflow: "hidden"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.background = isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.65)";
                e.currentTarget.style.borderColor = "#ff6a00";
                e.currentTarget.style.boxShadow = isDarkMode ? "0 12px 30px rgba(255, 106, 0, 0.15)" : "0 12px 30px rgba(255, 106, 0, 0.06)";
                const arrow = e.currentTarget.querySelector(".btn-arrow");
                if (arrow) arrow.style.transform = "translateX(4px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.background = isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.borderColor = isDarkMode ? "rgba(255, 106, 0, 0.15)" : "rgba(255, 106, 0, 0.1)";
                e.currentTarget.style.boxShadow = "none";
                const arrow = e.currentTarget.querySelector(".btn-arrow");
                if (arrow) arrow.style.transform = "none";
              }}
            >
              {/* Badge label */}
              <div style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                fontSize: "10px",
                fontWeight: "900",
                color: "#ff6a00",
                background: "rgba(255, 106, 0, 0.08)",
                padding: "4px 8px",
                borderRadius: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Technical
              </div>

              <div>
                {/* Custom SVG Icon wrapper */}
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(255, 106, 0, 0.04)",
                  border: "1px solid rgba(255, 106, 0, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px"
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                    <line x1="14" y1="4" x2="10" y2="20" />
                  </svg>
                </div>

                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "var(--text-light)",
                  marginBottom: "8px",
                  fontFamily: "var(--font-outfit)"
                }}>
                  Engineer / Comp Science
                </h3>

                <p style={{
                  fontSize: "13.5px",
                  color: "var(--text-muted)",
                  lineHeight: "1.5",
                  margin: "0 0 16px 0",
                  fontWeight: "500"
                }}>
                  Tailored paths for developers with specialized technical depths and rigorous capabilities.
                </p>
              </div>

              {/* Action indicator link */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: "700",
                color: "#ff6a00",
                marginTop: "auto"
              }}>
                <span>Select Track</span>
                <span className="btn-arrow" style={{ transition: "transform 0.3s" }}>→</span>
              </div>
            </button>

            {/* Non-Engineer Option */}
            <button
              onClick={() => {
                sound.playClockTick();
                setRole("non-engineer");
              }}
              style={{
                position: "relative",
                background: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.25)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: isDarkMode ? "1px solid rgba(255, 106, 0, 0.15)" : "1px solid rgba(255, 106, 0, 0.1)",
                borderRadius: "24px",
                padding: "32px 24px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "space-between",
                height: "100%",
                minHeight: "200px",
                overflow: "hidden"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.background = isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.65)";
                e.currentTarget.style.borderColor = "#ff6a00";
                e.currentTarget.style.boxShadow = isDarkMode ? "0 12px 30px rgba(255, 106, 0, 0.15)" : "0 12px 30px rgba(255, 106, 0, 0.06)";
                const arrow = e.currentTarget.querySelector(".btn-arrow");
                if (arrow) arrow.style.transform = "translateX(4px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.background = isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.borderColor = isDarkMode ? "rgba(255, 106, 0, 0.15)" : "rgba(255, 106, 0, 0.1)";
                e.currentTarget.style.boxShadow = "none";
                const arrow = e.currentTarget.querySelector(".btn-arrow");
                if (arrow) arrow.style.transform = "none";
              }}
            >
              {/* Badge label */}
              <div style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                fontSize: "10px",
                fontWeight: "900",
                color: "#ff6a00",
                background: "rgba(255, 106, 0, 0.08)",
                padding: "4px 8px",
                borderRadius: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                General
              </div>

              <div>
                {/* Custom SVG Icon wrapper */}
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(255, 106, 0, 0.04)",
                  border: "1px solid rgba(255, 106, 0, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px"
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                  </svg>
                </div>

                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "var(--text-light)",
                  marginBottom: "8px",
                  fontFamily: "var(--font-outfit)"
                }}>
                  Non-Engineer
                </h3>

                <p style={{
                  fontSize: "13.5px",
                  color: "var(--text-muted)",
                  lineHeight: "1.5",
                  margin: "0 0 16px 0",
                  fontWeight: "500"
                }}>
                  Learn anything else—languages, sciences, history, or business.
                </p>
              </div>

              {/* Action indicator link */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: "700",
                color: "#ff6a00",
                marginTop: "auto"
              }}>
                <span>Select Track</span>
                <span className="btn-arrow" style={{ transition: "transform 0.3s" }}>→</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {role === "non-engineer" && !pathfinderMode && (
        <div style={{ marginTop: "24px" }}>
          <h2 style={{
            textAlign: "center",
            fontSize: "20px",
            fontWeight: "800",
            color: "var(--text-light)",
            marginBottom: "24px",
            fontFamily: "var(--font-outfit)",
            letterSpacing: "-0.3px"
          }}>
            Select Pathfinder Mode
          </h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            maxWidth: "680px",
            margin: "0 auto"
          }}>
            {/* Quick Setup */}
            <button
              onClick={() => {
                sound.playClockTick();
                setPathfinderMode("quick");
                setCurrentQ(0);
                setInputVal("");
                setAnswers(Array(5).fill(""));
              }}
              style={{
                position: "relative",
                background: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.25)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: isDarkMode ? "1px solid rgba(255, 106, 0, 0.15)" : "1px solid rgba(255, 106, 0, 0.1)",
                borderRadius: "24px",
                padding: "32px 24px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "space-between",
                height: "100%",
                minHeight: "200px",
                overflow: "hidden"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.background = isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.65)";
                e.currentTarget.style.borderColor = "#ff6a00";
                e.currentTarget.style.boxShadow = isDarkMode ? "0 12px 30px rgba(255, 106, 0, 0.15)" : "0 12px 30px rgba(255, 106, 0, 0.06)";
                const arrow = e.currentTarget.querySelector(".btn-arrow");
                if (arrow) arrow.style.transform = "translateX(4px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.background = isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.borderColor = isDarkMode ? "rgba(255, 106, 0, 0.15)" : "rgba(255, 106, 0, 0.1)";
                e.currentTarget.style.boxShadow = "none";
                const arrow = e.currentTarget.querySelector(".btn-arrow");
                if (arrow) arrow.style.transform = "none";
              }}
            >
              {/* Badge label */}
              <div style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                fontSize: "10px",
                fontWeight: "900",
                color: "#ff6a00",
                background: "rgba(255, 106, 0, 0.08)",
                padding: "4px 8px",
                borderRadius: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Standard
              </div>

              <div>
                {/* Custom SVG Icon wrapper */}
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(255, 106, 0, 0.04)",
                  border: "1px solid rgba(255, 106, 0, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px"
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>

                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "var(--text-light)",
                  marginBottom: "8px",
                  fontFamily: "var(--font-outfit)"
                }}>
                  Quick Setup
                </h3>

                <p style={{
                  fontSize: "13.5px",
                  color: "var(--text-muted)",
                  lineHeight: "1.5",
                  margin: "0 0 16px 0",
                  fontWeight: "500"
                }}>
                  Standard 5 questions to build your path quickly. Ideal for straightforward topics.
                </p>
              </div>

              {/* Action indicator link */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: "700",
                color: "#ff6a00",
                marginTop: "auto"
              }}>
                <span>Select Setup</span>
                <span className="btn-arrow" style={{ transition: "transform 0.3s" }}>→</span>
              </div>
            </button>

            {/* Deep Dive */}
            <button
              onClick={() => {
                sound.playClockTick();
                setPathfinderMode("detailed");
                setCurrentQ(0);
                setInputVal("");
                setAnswers(Array(5).fill(""));
              }}
              style={{
                position: "relative",
                background: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.25)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: isDarkMode ? "1px solid rgba(255, 106, 0, 0.15)" : "1px solid rgba(255, 106, 0, 0.1)",
                borderRadius: "24px",
                padding: "32px 24px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "space-between",
                height: "100%",
                minHeight: "200px",
                overflow: "hidden"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.background = isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.65)";
                e.currentTarget.style.borderColor = "#ff6a00";
                e.currentTarget.style.boxShadow = isDarkMode ? "0 12px 30px rgba(255, 106, 0, 0.15)" : "0 12px 30px rgba(255, 106, 0, 0.06)";
                const arrow = e.currentTarget.querySelector(".btn-arrow");
                if (arrow) arrow.style.transform = "translateX(4px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.background = isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.borderColor = isDarkMode ? "rgba(255, 106, 0, 0.15)" : "rgba(255, 106, 0, 0.1)";
                e.currentTarget.style.boxShadow = "none";
                const arrow = e.currentTarget.querySelector(".btn-arrow");
                if (arrow) arrow.style.transform = "none";
              }}
            >
              {/* Badge label */}
              <div style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                fontSize: "10px",
                fontWeight: "900",
                color: "#ff6a00",
                background: "rgba(255, 106, 0, 0.08)",
                padding: "4px 8px",
                borderRadius: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Advanced
              </div>

              <div>
                {/* Custom SVG Icon wrapper */}
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(255, 106, 0, 0.04)",
                  border: "1px solid rgba(255, 106, 0, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px"
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2Z" />
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2Z" />
                  </svg>
                </div>

                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "var(--text-light)",
                  marginBottom: "8px",
                  fontFamily: "var(--font-outfit)"
                }}>
                  Deep Dive
                </h3>

                <p style={{
                  fontSize: "13.5px",
                  color: "var(--text-muted)",
                  lineHeight: "1.5",
                  margin: "0 0 16px 0",
                  fontWeight: "500"
                }}>
                  Open-ended questions about your problems, goals, and learning style for a highly tailored AI roadmap.
                </p>
              </div>

              {/* Action indicator link */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: "700",
                color: "#ff6a00",
                marginTop: "auto"
              }}>
                <span>Select Setup</span>
                <span className="btn-arrow" style={{ transition: "transform 0.3s" }}>→</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {pathfinderMode && (
        <>
          {/* Progress bar */}
      <div style={{ marginBottom: "16px" }}>
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
        background: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.35)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: "24px",
        padding: "24px 30px",
        border: isDarkMode ? "1px solid rgba(255, 106, 0, 0.15)" : "1px solid rgba(255, 106, 0, 0.12)",
        boxShadow: "none",
        marginBottom: "16px"
      }}>
        {/* Question number badge */}
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          background: "rgba(255, 106, 0, 0.05)",
          border: "1px solid rgba(255, 106, 0, 0.25)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: "800", color: "#ff6a00",
          marginBottom: "16px"
        }}>
          {currentQ + 1}
        </div>

        {/* Question text with typewriter */}
        <h2 style={{
          fontSize: "20px", fontWeight: "800", color: "var(--text-light)",
          marginBottom: "6px", lineHeight: "1.35", minHeight: "44px",
          fontFamily: "var(--font-outfit)", letterSpacing: "-0.3px"
        }}>
          {typed}
          {isTyping && (
            <span style={{
              display: "inline-block", width: "3px", height: "22px",
              background: "#ff6a00", marginLeft: "2px",
              verticalAlign: "middle", animation: "pulse 0.8s infinite"
            }} />
          )}
        </h2>

        {/* Hint */}
        <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px", lineHeight: "1.5", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>💡</span> {activeQuestions[currentQ]?.hint}
        </p>

        {/* Input */}
        {activeQuestions[currentQ]?.type === "options" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activeQuestions[currentQ].options.map(opt => (
              <button
                key={opt}
                onClick={() => {
                  setInputVal(opt);
                  sound.playClockTick();
                }}
                style={{
                  padding: "12px 16px",
                  borderRadius: "16px",
                  textAlign: "left",
                  fontSize: "15px",
                  fontWeight: "700",
                  color: inputVal === opt ? "#fff" : "var(--text-light)",
                  background: inputVal === opt
                    ? "linear-gradient(135deg, #ff6a00, #ffb300)"
                    : isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.35)",
                  border: inputVal === opt
                    ? "1px solid #ff6a00"
                    : isDarkMode ? "1px solid rgba(255, 106, 0, 0.15)" : "1px solid rgba(0, 0, 0, 0.08)",
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "none"
                }}
                onMouseEnter={e => {
                  if (inputVal !== opt) {
                    e.currentTarget.style.borderColor = "#ff6a00";
                    e.currentTarget.style.background = isDarkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.6)";
                  }
                }}
                onMouseLeave={e => {
                  if (inputVal !== opt) {
                    e.currentTarget.style.borderColor = isDarkMode ? "rgba(255, 106, 0, 0.15)" : "rgba(0, 0, 0, 0.08)";
                    e.currentTarget.style.background = isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.35)";
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
            rows={2}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "15px",
              color: "var(--text-light)",
              background: isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.35)",
              border: isDarkMode ? "1px solid rgba(255, 106, 0, 0.15)" : "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: "16px",
              outline: "none",
              resize: "none",
              fontFamily: "var(--font-sans)",
              lineHeight: "1.5",
              transition: "all 0.2s",
              boxSizing: "border-box"
            }}
            onFocus={e => {
              e.target.style.borderColor = "#ff6a00";
              e.target.style.boxShadow = "0 0 0 3px rgba(255,106,0,0.06)";
              e.target.style.background = isDarkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.65)";
            }}
            onBlur={e => {
              e.target.style.borderColor = isDarkMode ? "rgba(255, 106, 0, 0.15)" : "rgba(0, 0, 0, 0.08)";
              e.target.style.boxShadow = "none";
              e.target.style.background = isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.35)";
            }}
          />
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
          <button
            onClick={handleBack}
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              border: isDarkMode ? "1px solid rgba(255, 106, 0, 0.2)" : "1px solid rgba(0, 0, 0, 0.08)",
              background: "transparent",
              color: "var(--text-muted)",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#ff6a00";
              e.currentTarget.style.color = "#ff6a00";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = isDarkMode ? "rgba(255, 106, 0, 0.2)" : "rgba(0, 0, 0, 0.08)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            disabled={!inputVal.trim()}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              border: "none",
              background: inputVal.trim() ? "linear-gradient(135deg, #ff6a00, #ffb300)" : isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#e2e8f0",
              color: inputVal.trim() ? "#fff" : "var(--text-muted)",
              fontWeight: "800",
              fontSize: "14px",
              cursor: inputVal.trim() ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              boxShadow: inputVal.trim() ? "0 4px 14px rgba(255,106,0,0.2)" : "none",
              letterSpacing: "0.3px"
            }}
            onMouseOver={e => { if (inputVal.trim()) e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "none"; }}
          >
            {currentQ === activeQuestions.length - 1 ? "🚀 Build My Roadmap" : "Continue →"}
          </button>
        </div>

        {/* Enter hint */}
        <p style={{ textAlign: "right", marginTop: "8px", fontSize: "11px", color: "#cbd5e1", margin: "6px 0 0 0" }}>
          Press Enter to continue
        </p>
      </div>

      {/* Previous answers recap */}
      {currentQ > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          {answers.slice(0, currentQ).map((ans, i) => ans && (
            <div key={i} style={{
              display: "flex", gap: "12px", alignItems: "center",
              padding: "10px 14px",
              background: isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.25)",
              borderRadius: "14px",
              border: isDarkMode ? "1px solid rgba(255, 106, 0, 0.12)" : "1px solid rgba(0, 0, 0, 0.05)"
            }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%",
                background: "rgba(255, 106, 0, 0.08)",
                border: "1px solid rgba(255, 106, 0, 0.2)",
                color: "#ff6a00",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "10px", fontWeight: "900", flexShrink: 0
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {activeQuestions[i].question}
                </div>
                <div style={{ fontSize: "12.5px", color: "var(--text-light)", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ans}
                </div>
              </div>
              <button
                onClick={() => { sound.playClockTick(); setCurrentQ(i); setInputVal(ans); }}
                style={{
                  background: "none", border: "none", color: "#ff6a00",
                  cursor: "pointer", fontSize: "11px", fontWeight: "700", padding: "2px 6px",
                  borderRadius: "4px", flexShrink: 0
                }}
                onMouseOver={e => e.currentTarget.style.opacity = "0.8"}
                onMouseOut={e => e.currentTarget.style.opacity = "1"}
              >
                Edit
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
