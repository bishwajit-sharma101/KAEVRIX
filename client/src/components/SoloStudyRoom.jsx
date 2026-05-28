import { useState, useEffect, useRef } from "react";
import * as sound from "../utils/audio";
import YoutubePlayer from "./YoutubePlayer";
import { parseMarkdownToHTML } from "../utils/markdown";

const STUDY_GEN_LOGS = [
  "🔍 Analyzing video context & topics...",
  "🎯 Aligning guide with onboarding goals...",
  "📚 Structuring deep theoretical breakdown...",
  "📋 Constructing syntax comparison matrices...",
  "💻 Formulating Before/After code examples...",
  "💼 Pinpointing core mock interview questions...",
  "⚡ Preparing interactive practice challenges...",
  "✨ Finalizing formatting and rendering guide..."
];

export default function SoloStudyRoom({ video, username, isDarkMode, backendUrl, onBack, onAddSoloXp }) {
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("notes"); // notes, quiz
  const [notes, setNotes] = useState(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesGenStep, setNotesGenStep] = useState(0);
  const [notesGenLog, setNotesGenLog] = useState([]);

  // Quiz States: not_started, loading, active, completed
  const [quizState, setQuizState] = useState("not_started");
  const [questions, setQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [gradedAnswers, setGradedAnswers] = useState([]); // null, 'correct', 'incorrect' for each question
  const [earnedXp, setEarnedXp] = useState(0);
  const [quizScore, setQuizScore] = useState(0);

  // Retrieve onboarding answers for personalization
  const answersKey = `kaevrix_roadmap_answers_${username}`;
  const savedAnswers = localStorage.getItem(answersKey);
  const answers = savedAnswers ? JSON.parse(savedAnswers) : [];
  const topic = answers && answers[0] ? answers[0].answer : (video.category || "General learning");

  // Track if unlocked alert has played
  const alertPlayedRef = useRef(false);

  useEffect(() => {
    if (progress >= 90 && !alertPlayedRef.current) {
      alertPlayedRef.current = true;
      sound.playCorrect();
    }
  }, [progress]);

  const handleProgress = (percent) => {
    setProgress(percent);
  };

  const handleFinished = () => {
    setProgress(100);
  };

  // Generate Notes
  const handleGenerateNotes = async () => {
    setLoadingNotes(true);
    setNotesGenStep(0);
    setNotesGenLog([STUDY_GEN_LOGS[0]]);

    const logInterval = setInterval(() => {
      setNotesGenStep(prev => {
        const next = prev + 1;
        if (next < STUDY_GEN_LOGS.length) {
          setNotesGenLog(logs => [...logs, STUDY_GEN_LOGS[next]]);
          return next;
        } else {
          clearInterval(logInterval);
          return prev;
        }
      });
    }, 1200);

    try {
      sound.playClockTick();
      const milestone = {
        id: `solo-${video.id}`,
        title: video.title,
        description: video.channel,
        keyPoints: ["Understand video concepts", "Practice exercises", "Review interview prep"]
      };

      const res = await fetch(`${backendUrl}/api/pathfinder/study-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, milestone, answers })
      });
      const data = await res.json();
      clearInterval(logInterval);
      setNotes(data.notes);
      sound.playCorrect();
    } catch (err) {
      console.error("Notes generation failed:", err);
      clearInterval(logInterval);
      const fallback = `## ${video.title}\n\nGenerated fallback notes for ${video.title} on channel ${video.channel}.\n\n### ⚡ Key Points\n- Understand core concepts presented.\n- Practice coding or application.\n- Prepare for the level up quiz.`;
      setNotes(fallback);
    } finally {
      setLoadingNotes(false);
    }
  };

  // Start Quiz
  const handleStartQuiz = async () => {
    setQuizState("loading");
    sound.playClockTick();
    try {
      const res = await fetch(`${backendUrl}/api/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          title: video.title,
          duration: video.duration
        })
      });
      if (res.ok) {
        const quiz = await res.json();
        setQuestions(quiz.postVideoQuestions || []);
        setSelectedAnswers(Array(quiz.postVideoQuestions?.length || 5).fill(null));
        setGradedAnswers(Array(quiz.postVideoQuestions?.length || 5).fill(null));
        setCurrentQIdx(0);
        setQuizState("active");
        sound.playMatchFound();
      } else {
        throw new Error("Failed to fetch quiz");
      }
    } catch (err) {
      console.error("Quiz fetch error, using fallbacks:", err);
      // Fallback local quiz
      const fallbackQs = [
        {
          question: `What was the primary focus of "${video.title}"?`,
          options: [
            "A detailed exploration of the subject matter",
            "A random compilation of unrelated files",
            "A sports tournament highlights video",
            "A corporate advertisement campaign"
          ],
          answerIndex: 0,
          points: 100
        },
        {
          question: "Which strategy is most effective to retain knowledge from this video?",
          options: [
            "Playing it on mute while sleeping",
            "Active watching, note-taking, and practicing exercises",
            "Closing the browser tab after 5 seconds",
            "Skimming through at 8x speed"
          ],
          answerIndex: 1,
          points: 100
        },
        {
          question: "If you have questions about the topics in the video, what should you do?",
          options: [
            "Ignore them and guess on the quiz",
            "Read documentation, write test scripts, and verify concepts",
            "Post angry comments on the video",
            "Uninstall your code editor"
          ],
          answerIndex: 1,
          points: 100
        },
        {
          question: "Why are interactive quiz duels helpful for learning?",
          options: [
            "They test recall, reinforce active learning, and highlight knowledge gaps",
            "They are purely for cosmetic points and vanity level badges",
            "They make the computer run faster",
            "They automatically write the code for you"
          ],
          answerIndex: 0,
          points: 100
        },
        {
          question: "What is the best way to master a new programming framework?",
          options: [
            "Watch a video once and consider it mastered",
            "Build practical, hands-on projects and solve real challenges",
            "Pay someone else to do your work",
            "Memorize the syntax word-for-word without understanding"
          ],
          answerIndex: 1,
          points: 100
        }
      ];
      setQuestions(fallbackQs);
      setSelectedAnswers(Array(5).fill(null));
      setGradedAnswers(Array(5).fill(null));
      setCurrentQIdx(0);
      setQuizState("active");
      sound.playMatchFound();
    }
  };

  // Select Option
  const handleSelectOption = (optIdx) => {
    if (selectedAnswers[currentQIdx] !== null) return; // Answer already locked

    const correctIdx = questions[currentQIdx].answerIndex;
    const isCorrect = optIdx === correctIdx;

    setSelectedAnswers(prev => {
      const next = [...prev];
      next[currentQIdx] = optIdx;
      return next;
    });

    setGradedAnswers(prev => {
      const next = [...prev];
      next[currentQIdx] = isCorrect ? "correct" : "incorrect";
      return next;
    });

    if (isCorrect) {
      sound.playCorrect();
    } else {
      sound.playIncorrect();
    }
  };

  // Next Question
  const handleNextQ = () => {
    sound.playClockTick();
    if (currentQIdx < questions.length - 1) {
      setCurrentQIdx(prev => prev + 1);
    } else {
      // End Quiz
      const score = gradedAnswers.filter(g => g === "correct").length;
      const xp = score * 20; // 20 XP per correct answer
      setQuizScore(score);
      setEarnedXp(xp);
      setQuizState("completed");
      sound.playVictory();
    }
  };

  // Claim XP & Exit
  const handleClaimXpAndExit = () => {
    sound.playClockTick();
    onAddSoloXp(earnedXp, video.title);
    onBack();
  };

  // Download Notes
  const handleDownloadNotes = () => {
    sound.playClockTick();
    const element = document.createElement("a");
    const file = new Blob([notes], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_study_guide.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 2000,
      background: isDarkMode 
        ? "radial-gradient(circle at 80% 20%, #1f1105 0%, #0c0805 40%, #050302 100%)" 
        : "radial-gradient(circle at 80% 20%, #fff7f0 0%, #faf6f3 40%, #ffffff 100%)",
      color: isDarkMode ? "#f8fafc" : "#0f172a",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', var(--font-sans)",
      overflow: "hidden"
    }} className="animate-slideup animate-glow-background">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;700;900&display=swap');

        @keyframes slideUp {
          from { transform: translateY(100vh); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideup {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes progressGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(255,106,0,0.2), 0 0 30px rgba(255,106,0,0.1); }
          50% { box-shadow: 0 0 40px rgba(255,106,0,0.5), 0 0 80px rgba(255,106,0,0.2); }
        }
        .unlocked-pulse {
          animation: pulse 1.5s infinite ease-in-out;
        }
        
        /* Custom scrollbars */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 106, 0, 0.25);
          border-radius: 12px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 106, 0, 0.6);
        }

        /* High-Fidelity Markdown notes typography styling */
        .study-notes-document {
          font-family: 'Inter', sans-serif;
        }
        .study-notes-document h1, .study-notes-document h2, .study-notes-document h3 {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .study-notes-document h1 {
          font-size: 32px;
          margin: 40px 0 20px 0;
          background: linear-gradient(135deg, #ff6a00, #ffb300, #ff4500);
          background-size: 200% auto;
          animation: textGradient 4s linear infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @keyframes textGradient {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        .study-notes-document h2 {
          font-size: 24px;
          margin: 36px 0 16px 0;
          padding-bottom: 12px;
          position: relative;
        }
        .study-notes-document h2::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 60px;
          height: 4px;
          border-radius: 2px;
          background: linear-gradient(90deg, #ff6a00, transparent);
        }
        .notes-dark h2 { color: #facc15; }
        .notes-light h2 { color: #ea580c; }
        
        .study-notes-document h3 {
          font-size: 18px;
          margin: 28px 0 12px 0;
        }
        .notes-dark h3 { color: #fb923c; }
        .notes-light h3 { color: #c2410c; }
        
        .study-notes-document p {
          font-size: 15.5px;
          line-height: 1.85;
          margin-bottom: 20px;
          letter-spacing: 0.01em;
        }
        .notes-dark p { color: rgba(255,255,255,0.85); }
        .notes-light p { color: #334155; }
        
        .study-notes-document strong {
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 6px;
          display: inline-block;
          margin: 0 2px;
        }
        .notes-dark strong { 
          color: #fff;
          background: rgba(255, 106, 0, 0.2);
          box-shadow: 0 0 10px rgba(255,106,0,0.1);
        }
        .notes-light strong { 
          color: #9a3412;
          background: #ffedd5;
          box-shadow: 0 0 10px rgba(234,88,12,0.1);
        }

        .study-notes-document blockquote {
          margin: 24px 0;
          padding: 16px 24px;
          border-left: 4px solid #ff6a00;
          border-radius: 0 12px 12px 0;
          font-style: italic;
          font-size: 16px;
        }
        .notes-dark blockquote {
          background: linear-gradient(90deg, rgba(255,106,0,0.1) 0%, transparent 100%);
          color: #fb923c;
        }
        .notes-light blockquote {
          background: linear-gradient(90deg, rgba(255,106,0,0.05) 0%, transparent 100%);
          color: #c2410c;
        }

        /* Bullet points and lists */
        .study-notes-document ul, .study-notes-document ol {
          padding-left: 24px;
          margin: 16px 0 24px 0;
        }
        .study-notes-document li {
          margin-bottom: 10px;
          line-height: 1.7;
          font-size: 15.5px;
        }
        .study-notes-document li::marker {
          color: #ff6a00;
        }
        .notes-dark li { color: rgba(255,255,255,0.85); }
        .notes-light li { color: #475569; }

        /* Tables */
        .study-notes-document table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin: 32px 0;
          font-size: 14.5px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .notes-dark table {
          border: 1px solid rgba(255, 106, 0, 0.2);
          background: rgba(25, 20, 15, 0.4);
        }
        .notes-light table {
          border: 1px solid #fed7aa;
          background: #fffcf9;
        }
        .study-notes-document th, .study-notes-document td {
          padding: 16px 20px;
          text-align: left;
        }
        .study-notes-document th {
          font-weight: 800;
          text-transform: uppercase;
          font-size: 12.5px;
          letter-spacing: 0.8px;
        }
        .notes-dark th {
          background: rgba(255, 106, 0, 0.2);
          color: #fcd34d;
        }
        .notes-light th {
          background: #ffedd5;
          color: #c2410c;
        }
        .study-notes-document td {
          border-bottom: 1px solid rgba(255, 106, 0, 0.1);
        }
        .notes-dark td {
          color: rgba(255,255,255,0.85);
          border-color: rgba(255, 106, 0, 0.1);
        }
        .notes-light td {
          color: #475569;
          border-color: #ffedd5;
        }
        .study-notes-document tr:last-child td {
          border-bottom: none;
        }

        /* Code Snippets */
        .study-notes-document code {
          font-family: 'Fira Code', 'Courier New', monospace;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 600;
        }
        .notes-dark code {
          background: rgba(255, 106, 0, 0.15);
          color: #fb923c;
          border: 1px solid rgba(255, 106, 0, 0.25);
        }
        .notes-light code {
          background: #fff7ed;
          color: #ea580c;
          border: 1px solid #ffedd5;
        }
        .study-notes-document pre code {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          color: inherit !important;
          font-weight: 500;
          box-shadow: none;
        }
      `}</style>

      {/* Top Header Navigation */}
      <div style={{
        background: isDarkMode ? "rgba(13, 8, 5, 0.7)" : "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: isDarkMode ? "1px solid rgba(255, 106, 0, 0.15)" : "1px solid rgba(255, 106, 0, 0.1)",
        padding: "16px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        zIndex: 10,
        boxShadow: "0 4px 30px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={() => { sound.playClockTick(); onBack(); }}
            style={{
              background: isDarkMode ? "rgba(255, 106, 0, 0.08)" : "#fff7ed",
              border: isDarkMode ? "1px solid rgba(255, 106, 0, 0.2)" : "1px solid #ffedd5",
              color: isDarkMode ? "#ff8c3a" : "#ea580c",
              padding: "8px 16px",
              borderRadius: "10px",
              fontWeight: "750",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={e => { e.currentTarget.style.color = isDarkMode ? "#ffffff" : "#ea580c"; e.currentTarget.style.background = isDarkMode ? "rgba(255, 106, 0, 0.16)" : "#ffedd5"; }}
            onMouseOut={e => { e.currentTarget.style.color = isDarkMode ? "#ff8c3a" : "#ea580c"; e.currentTarget.style.background = isDarkMode ? "rgba(255, 106, 0, 0.08)" : "#fff7ed"; }}
          >
            ← Exit Training
          </button>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>
              ⚔️ Solo Training Theatre
            </div>
            <div style={{ fontSize: "16px", fontWeight: "900", color: isDarkMode ? "#ffffff" : "#0f172a", marginTop: "2px" }}>
              {video.title}
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{
            fontSize: "12px",
            fontWeight: "800",
            padding: "6px 14px",
            borderRadius: "20px",
            background: progress >= 90 ? "rgba(16,185,129,0.12)" : "rgba(255, 106, 0, 0.1)",
            color: progress >= 90 ? "#10b981" : "#ff6a00",
            border: `1.5px solid ${progress >= 90 ? "#10b981" : "#ff6a00"}`
          }}>
            {progress >= 90 ? "🔓 QUIZ AVAILABLE" : `⏱ ${Math.round(progress)}% WATCHED`}
          </span>
        </div>
      </div>
 
      {/* Main Splitscreen Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", padding: "24px", gap: "24px" }}>
        
        {/* Left Side: Large Immersive Player */}
        <div style={{
          width: "55%",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          background: isDarkMode ? "rgba(13, 8, 5, 0.6)" : "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(16px)",
          borderRadius: "24px",
          border: isDarkMode ? "1px solid rgba(255, 106, 0, 0.15)" : "1px solid rgba(255, 106, 0, 0.1)",
          boxShadow: isDarkMode ? "0 20px 40px rgba(0,0,0,0.4)" : "0 20px 40px rgba(0,0,0,0.05)",
          overflowY: "auto",
          boxSizing: "border-box"
        }} className="custom-scrollbar">
          
          {/* Theatre Player Wrapper */}
          <div style={{
            position: "relative",
            width: "100%",
            paddingTop: "56.25%", // 16:9 Aspect Ratio
            background: "#000000",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: isDarkMode ? "0 20px 50px rgba(0,0,0,0.5)" : "0 10px 30px rgba(0,0,0,0.15)",
            border: isDarkMode ? "2px solid rgba(255, 106, 0, 0.18)" : "2px solid #ffedd5",
            animation: "progressGlow 4s infinite"
          }}>
            <div style={{ position: "absolute", inset: 0 }}>
              <YoutubePlayer 
                videoId={video.id} 
                onProgress={handleProgress} 
                onFinished={handleFinished} 
                isFrozen={false} 
              />
            </div>
          </div>
 

        </div>
 
        {/* Right Side: Interactive Notes & Quizzes */}
        <div style={{
          width: "45%",
          display: "flex",
          flexDirection: "column",
          background: isDarkMode ? "rgba(13, 8, 5, 0.85)" : "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          border: isDarkMode ? "1px solid rgba(255, 106, 0, 0.2)" : "1px solid rgba(255, 106, 0, 0.15)",
          boxShadow: isDarkMode ? "0 20px 40px rgba(0,0,0,0.4)" : "0 20px 40px rgba(0,0,0,0.05)",
          overflow: "hidden"
        }}>
          
          {/* Tab Navigation */}
          <div style={{
            display: "flex",
            borderBottom: isDarkMode ? "1px solid rgba(255, 106, 0, 0.15)" : "1px solid #ffedd5",
            flexShrink: 0
          }}>
            {[
              { id: "notes", label: "📝 AI Study Guide" },
              { id: "quiz", label: progress >= 90 ? "⚡ Quest Quiz (Unlocked)" : "🔒 Quest Quiz (Locked)" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { sound.playClockTick(); setActiveTab(t.id); }}
                style={{
                  flex: 1,
                  padding: "16px 0",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === t.id 
                    ? `3px solid ${t.id === "quiz" && progress >= 90 ? "#10b981" : "#ff6a00"}` 
                    : "3px solid transparent",
                  color: activeTab === t.id 
                    ? (isDarkMode ? "#ffb300" : "#ea580c") 
                    : "var(--text-muted)",
                  fontWeight: "800",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content Display Pane */}
          <div style={{ flex: 1, overflowY: "auto", padding: "32px", boxSizing: "border-box" }}>
            
            {/* 1. STUDY NOTES TAB */}
            {activeTab === "notes" && (
              <div style={{ height: "100%" }}>
                {loadingNotes ? (
                  /* Notes Generation Loading Screen */
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    minHeight: "350px",
                    textAlign: "center"
                  }}>
                    <div style={{
                      width: "80px", height: "80px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #ff6a00, #ffb300)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "40px", color: "#fff",
                      boxShadow: "0 0 25px rgba(255,106,0,0.45)",
                      marginBottom: "24px",
                      animation: "pulse 1.8s infinite ease-in-out"
                    }}>
                      🧠
                    </div>
                    <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "8px" }}>
                      Generating Study Guide
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "13.5px", marginBottom: "28px", maxWidth: "320px", lineHeight: "1.4" }}>
                      Gemini is scanning transcript semantics, generating comparison grids, code examples, and mock interview prep...
                    </p>
                    
                    {/* Running terminal log */}
                    <div style={{
                      width: "100%",
                      background: "#05070c",
                      borderRadius: "12px",
                      padding: "16px 20px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      textAlign: "left"
                    }}>
                      {notesGenLog.map((log, idx) => (
                        <div key={idx} style={{
                          fontFamily: "monospace",
                          fontSize: "12px",
                          color: idx === notesGenLog.length - 1 ? "#ea580c" : "#94a3b8",
                          marginBottom: "5px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}>
                          <span style={{ color: idx < notesGenLog.length - 1 ? "#10b981" : "#ea580c" }}>
                            {idx < notesGenLog.length - 1 ? "✓" : "⚡"}
                          </span>
                          {log}
                        </div>
                      ))}
                      {notesGenStep < STUDY_GEN_LOGS.length - 1 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "monospace", fontSize: "11px", color: "#475569" }}>
                          <span style={{ display: "inline-block", width: "4px", height: "4px", borderRadius: "50%", background: "#ea580c", animation: "pulse 0.8s infinite" }} />
                          running compilation...
                        </div>
                      )}
                    </div>
                  </div>
                ) : notes ? (
                  /* Render Markdown guide */
                  <div className={`study-notes-document ${isDarkMode ? 'notes-dark' : 'notes-light'}`}>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
                      <button 
                        onClick={handleDownloadNotes}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "10px",
                          border: isDarkMode ? "1px solid rgba(255,255,255,0.12)" : "1px solid #cbd5e1",
                          background: isDarkMode ? "rgba(255,255,255,0.05)" : "#ffffff",
                          color: "var(--text-light)",
                          fontSize: "12.5px",
                          fontWeight: "750",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseOver={e => e.currentTarget.style.background = isDarkMode ? "rgba(255,255,255,0.1)" : "#f1f5f9"}
                        onMouseOut={e => e.currentTarget.style.background = isDarkMode ? "rgba(255,255,255,0.05)" : "#ffffff"}
                      >
                        📥 Download Notes (.md)
                      </button>
                    </div>
                    <div 
                      style={{ lineHeight: "1.8", fontSize: "15px", textAlign: "left" }} 
                      dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(notes) }} 
                    />
                  </div>
                ) : (
                  /* Call to Action Generate notes */
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    minHeight: "350px",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "44px", marginBottom: "16px" }}>✨</div>
                    <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "8px" }}>
                      Personalized Study Guide
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px", maxWidth: "340px", lineHeight: "1.5" }}>
                      Generate an exhaustive learning guide tailored to your goal of <strong>"{topic}"</strong>. Includes theoretical tables, bad vs good code examples, and mock interview preps.
                    </p>
                    <button
                      onClick={handleGenerateNotes}
                      style={{
                        padding: "14px 28px",
                        borderRadius: "12px",
                        border: "none",
                        background: "linear-gradient(135deg, #ff6a00, #ea580c)",
                        color: "#ffffff",
                        fontWeight: "800",
                        fontSize: "14px",
                        cursor: "pointer",
                        boxShadow: "0 6px 20px rgba(255,106,0,0.3)",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
                      onMouseOut={e => e.currentTarget.style.transform = "none"}
                    >
                      🧠 Generate Guide via Gemini
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. QUIZ TAB */}
            {activeTab === "quiz" && (
              <div style={{ height: "100%" }}>
                
                {/* 2a. Locked State (Progress < 90) */}
                {progress < 90 && (
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    minHeight: "350px",
                    textAlign: "center"
                  }}>
                    <div style={{
                      fontSize: "64px",
                      marginBottom: "20px",
                      color: isDarkMode ? "#475569" : "#94a3b8"
                    }}>
                      🔒
                    </div>
                    <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "8px" }}>
                      Quest Quiz Locked
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px", maxWidth: "300px", lineHeight: "1.5" }}>
                      You must watch at least 90% of the training video to unlock the Level Up Quiz. Watch, study, and return!
                    </p>
                    <div style={{
                      fontSize: "16px",
                      fontWeight: "800",
                      color: "#ff6a00",
                      padding: "8px 20px",
                      borderRadius: "20px",
                      background: "rgba(255, 106, 0, 0.08)",
                      border: "1.5px solid rgba(255, 106, 0, 0.2)"
                    }}>
                      Watch Progress: {Math.round(progress)}% / 90%
                    </div>
                  </div>
                )}

                {/* 2b. Unlocked but Not Started (Progress >= 90) */}
                {progress >= 90 && quizState === "not_started" && (
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    minHeight: "350px",
                    textAlign: "center"
                  }}>
                    <div style={{
                      fontSize: "64px",
                      marginBottom: "20px",
                      color: "#10b981",
                      animation: "pulse 1.5s infinite"
                    }} className="unlocked-pulse">
                      🔓
                    </div>
                    <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "8px" }}>
                      Quest Quiz Available!
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "28px", maxWidth: "340px", lineHeight: "1.5" }}>
                      You have watched enough content. Enter the quiz arena, test your comprehension, and earn Solo XP to level up your rank!
                    </p>
                    <button
                      onClick={handleStartQuiz}
                      style={{
                        padding: "16px 36px",
                        borderRadius: "14px",
                        border: "none",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "#ffffff",
                        fontWeight: "900",
                        fontSize: "14.5px",
                        cursor: "pointer",
                        boxShadow: "0 6px 20px rgba(16,185,129,0.35)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
                      onMouseOut={e => e.currentTarget.style.transform = "none"}
                    >
                      ⚔️ Start Level Up Quiz
                    </button>
                  </div>
                )}

                {/* 2c. Fetching/Loading Quiz */}
                {quizState === "loading" && (
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    minHeight: "350px",
                    textAlign: "center"
                  }}>
                    <div style={{
                      width: "50px", height: "50px",
                      borderRadius: "50%",
                      border: "3px solid #e2e8f0",
                      borderTopColor: "#10b981",
                      animation: "graceRotate 1s linear infinite",
                      marginBottom: "20px"
                    }} />
                    <h3 style={{ fontSize: "16px", fontWeight: "800" }}>
                      Constructing Quiz Arena...
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "6px" }}>
                      Gemini is generating comprehension questions from the video transcript...
                    </p>
                  </div>
                )}

                {/* 2d. Active Quiz Mode */}
                {quizState === "active" && questions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                    
                    <div>
                      {/* Progress header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "900", color: "#10b981", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                          QUESTION {currentQIdx + 1} OF {questions.length}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700" }}>
                          📚 Solo Quiz
                        </span>
                      </div>

                      {/* Question card */}
                      <div style={{
                        background: isDarkMode ? "#1e293b" : "#f8fafc",
                        border: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
                        borderRadius: "16px",
                        padding: "24px",
                        marginBottom: "24px",
                        lineHeight: "1.5",
                        fontSize: "15.5px",
                        fontWeight: "750"
                      }}>
                        {questions[currentQIdx].question}
                      </div>

                      {/* Options Grid */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {questions[currentQIdx].options.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[currentQIdx] === optIdx;
                          const correctIdx = questions[currentQIdx].answerIndex;
                          const wasGraded = gradedAnswers[currentQIdx] !== null;

                          let btnBg = isDarkMode ? "rgba(255,255,255,0.03)" : "#ffffff";
                          let btnBorder = isDarkMode ? "1.5px solid rgba(255,255,255,0.08)" : "1.5px solid #cbd5e1";
                          let btnColor = "var(--text-light)";

                          if (wasGraded) {
                            if (optIdx === correctIdx) {
                              // Correct answer glow
                              btnBg = "rgba(16,185,129,0.12)";
                              btnBorder = "1.5px solid #10b981";
                              btnColor = "#10b981";
                            } else if (isSelected) {
                              // Incorrect selected answer red glow
                              btnBg = "rgba(239, 68, 68, 0.12)";
                              btnBorder = "1.5px solid #ef4444";
                              btnColor = "#ef4444";
                            } else {
                              btnBg = isDarkMode ? "rgba(255,255,255,0.01)" : "#f8fafc";
                              btnBorder = isDarkMode ? "1.5px solid rgba(255,255,255,0.03)" : "1.5px solid #e2e8f0";
                              btnColor = "var(--text-muted)";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={wasGraded}
                              onClick={() => handleSelectOption(optIdx)}
                              style={{
                                width: "100%",
                                padding: "16px 20px",
                                borderRadius: "12px",
                                background: btnBg,
                                border: btnBorder,
                                color: btnColor,
                                fontSize: "14px",
                                fontWeight: "700",
                                textAlign: "left",
                                cursor: wasGraded ? "default" : "pointer",
                                transition: "all 0.15s",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px"
                              }}
                              onMouseOver={e => {
                                if (!wasGraded) {
                                  e.currentTarget.style.borderColor = "#10b981";
                                  e.currentTarget.style.background = isDarkMode ? "rgba(16,185,129,0.06)" : "#f0fdf4";
                                }
                              }}
                              onMouseOut={e => {
                                if (!wasGraded) {
                                  e.currentTarget.style.borderColor = isDarkMode ? "rgba(255,255,255,0.08)" : "#cbd5e1";
                                  e.currentTarget.style.background = btnBg;
                                }
                              }}
                            >
                              <span style={{
                                width: "24px", height: "24px",
                                borderRadius: "50%",
                                background: isSelected ? "#10b981" : (isDarkMode ? "rgba(255,255,255,0.06)" : "#f1f5f9"),
                                border: "1px solid #cbd5e1",
                                color: isSelected ? "#fff" : "var(--text-muted)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "11px", fontWeight: "900", flexShrink: 0
                              }}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Action (Next Q / Submit) */}
                    {gradedAnswers[currentQIdx] !== null && (
                      <div style={{ marginTop: "24px" }}>
                        <button
                          onClick={handleNextQ}
                          style={{
                            width: "100%",
                            padding: "16px",
                            borderRadius: "12px",
                            border: "none",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "#ffffff",
                            fontWeight: "800",
                            fontSize: "14.5px",
                            cursor: "pointer",
                            boxShadow: "0 6px 18px rgba(16,185,129,0.25)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                          }}
                        >
                          {currentQIdx < questions.length - 1 ? "Next Question →" : "Submit Quiz & Score"}
                        </button>
                      </div>
                    )}

                  </div>
                )}

                {/* 2e. Completed State (Victory) */}
                {quizState === "completed" && (
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    minHeight: "350px",
                    textAlign: "center"
                  }}>
                    <div style={{
                      fontSize: "72px",
                      marginBottom: "16px",
                      animation: "emblemPulse 2.5s infinite"
                    }}>
                      🏆
                    </div>
                    <h2 style={{ fontSize: "24px", fontWeight: "950", color: "#10b981", margin: "0 0 6px 0", textTransform: "uppercase", letterSpacing: "1px" }}>
                      Quiz Completed!
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "32px" }}>
                      Your performance has been evaluated by the master registry.
                    </p>

                    {/* Stats Score Box */}
                    <div style={{
                      background: isDarkMode ? "#1e293b" : "#f8fafc",
                      border: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "24px 32px",
                      display: "flex",
                      gap: "36px",
                      marginBottom: "36px"
                    }}>
                      <div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>COMPREHENSION</div>
                        <div style={{ fontSize: "28px", fontWeight: "950", color: "#10b981", marginTop: "4px" }}>
                          {quizScore} / {questions.length}
                        </div>
                      </div>
                      <div style={{ borderLeft: "1px solid #cbd5e1" }} />
                      <div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>XP REWARDED</div>
                        <div style={{ fontSize: "28px", fontWeight: "950", color: "#ffb300", marginTop: "4px" }}>
                          +{earnedXp} XP
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleClaimXpAndExit}
                      style={{
                        padding: "16px 48px",
                        borderRadius: "12px",
                        border: "none",
                        background: "linear-gradient(135deg, #ffd700, #ff8c00)",
                        color: "#0f172a",
                        fontWeight: "900",
                        fontSize: "15px",
                        cursor: "pointer",
                        boxShadow: "0 8px 24px rgba(255,179,0,0.35)",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"}
                      onMouseOut={e => e.currentTarget.style.transform = "none"}
                    >
                      ⚡ Claim XP & Exit Arena
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
