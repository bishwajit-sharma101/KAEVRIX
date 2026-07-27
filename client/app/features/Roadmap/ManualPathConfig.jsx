import { useState, useMemo } from "react";
import * as sound from "../../utils/audio";

export default function ManualPathConfig({ onRoadmapReady, onBack, isDarkMode }) {
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [levelsCount, setLevelsCount] = useState("dynamic");
  const [maxTopics, setMaxTopics] = useState("dynamic");
  const [maxSubtopics, setMaxSubtopics] = useState("dynamic");
  const [customInstructions, setCustomInstructions] = useState("");
  const [difficulty, setDifficulty] = useState("Professional");
  const [copied, setCopied] = useState(false);
  const [pastedJSON, setPastedJSON] = useState("");
  const [validationError, setValidationError] = useState("");
  const [validationSuccess, setValidationSuccess] = useState(false);

  // Dynamically build the prompt for copying
  const generatedPrompt = useMemo(() => {
    const cleanTopic = topic.trim() || "[Topic, e.g. Docker]";
    const cleanGoal = goal.trim() || "[Goal, e.g. Pass my DevOps interview]";
    
    const levelsInstruction = levelsCount === "dynamic"
      ? "Decide the optimal number of levels (typically 2 to 5 levels) based on the scope and complexity of this topic."
      : `Generate exactly ${levelsCount} levels.`;

    const topicsInstruction = maxTopics === "dynamic"
      ? "Determine the optimal number of milestones (nodes) per level based on the learning depth. Limit each level to a maximum of 12 milestones."
      : `Each level MUST contain between 1 and ${maxTopics} milestones.`;

    const subtopicsInstruction = maxSubtopics === "dynamic"
      ? "Generate an appropriate number of keyPoints (sub-topics) per milestone based on the topic complexity."
      : `Each milestone's keyPoints (sub-topics) array MUST contain a maximum of ${maxSubtopics} items.`;

    const templateLevels = levelsCount === "dynamic" ? 3 : levelsCount;
    
    // Construct the level template
    let levelTemplates = "";
    for (let i = 1; i <= Math.min(templateLevels, 5); i++) {
      levelTemplates += `  "level${i}": {
    "title": "Level ${i} Title",
    "subtitle": "Short focus description",
    "color": "${i === 1 ? "#10b981" : i === 2 ? "#f59e0b" : i === 3 ? "#8b5cf6" : i === 4 ? "#ec4899" : "#ef4444"}",
    "milestones": [
      {
        "id": "${i}-0",
        "title": "Introduction to a core concept",
        "description": "2-3 sentences explaining this milestone's focus",
        "searchQuery": "Specific YouTube search query for this subtopic",
        "keyPoints": ["Key concept 1", "Key concept 2"],
        "estimatedMinutes": 45,
        "status": "${i === 1 ? "unlocked" : "locked"}",
        "xpReward": ${i * 40},
        "isRevision": false
      }
    ]
  }${i < templateLevels ? ",\n" : ""}`;
    }

    if (levelsCount === "dynamic") {
      levelTemplates += `,\n  // ... generate as many level objects (level4, level5, etc.) as appropriate following the exact same structure`;
    } else if (levelsCount > 5) {
      levelTemplates += `,\n  // ... continue up to level${levelsCount} following the same format`;
    }

    const maxTopicsVal = maxTopics === "dynamic" ? 12 : maxTopics;
    const maxSubtopicsVal = maxSubtopics === "dynamic" ? 12 : maxSubtopics;

    let customText = "";
    if (customInstructions.trim()) {
      customText = `\nADDITIONAL USER DIRECTION & CONTEXT:\n${customInstructions.trim()}\nYou MUST strictly follow these instructions when generating the roadmap content.\n`;
    }

    let difficultyDetail = "";
    if (difficulty === "Explorer") {
      difficultyDetail = "🟢 EXPLORER: Learn only the essentials. Generate the shortest roadmap that teaches the highest-value concepts. Focus on the critical 20% of knowledge that provides roughly 80% of the practical understanding. Intentionally omit advanced, niche, or low-impact topics. Optimize for fast completion and quick competence.";
    } else if (difficulty === "Professional") {
      difficultyDetail = "⚔️ PROFESSIONAL: Build strong proficiency. Generate a comprehensive roadmap covering all major concepts, practical techniques, and common applications. Include enough depth to become highly capable while excluding only specialized or niche areas that most learners won't need.";
    } else if (difficulty === "Hell Mode") {
      difficultyDetail = "🔥 HELL MODE — Maximum Mastery: This mode is for learners who want to go as far as reasonably possible toward mastering their chosen goal. The AI should generate the most comprehensive roadmap possible, covering everything that meaningfully contributes to true mastery. It should include foundational knowledge, deeper concepts, advanced topics, underlying principles, practical applications, edge cases, best practices, common mistakes, and the connections between ideas. Nothing important that contributes to mastering the chosen goal should be intentionally left out. Prioritize completeness over speed, exploring the subject in depth rather than stopping at practical competence. Hell Mode is not about making learning artificially harder. It is about pursuing the deepest, most complete understanding possible within the scope of the goal.";
    }

    return `You are an expert learning curriculum designer for the Kaevrix educational platform.
Generate a structured, highly personalized learning roadmap for: "${cleanTopic}".
User's preparation goal: "${cleanGoal}".
Target Learning Mode:
${difficultyDetail}${customText}

${levelsInstruction}
${topicsInstruction}
${subtopicsInstruction}

You MUST strictly output a raw JSON object with this EXACT structure (no markdown wrappers, no backticks like \`\`\`json, just raw JSON text):

{
  "topic": "${cleanTopic}",
  "summary": "2-3 sentences explaining what this roadmap covers and why it is tailored to the user's goal",
  "totalVideosEstimated": ${levelsCount === "dynamic" ? 24 : levelsCount * 8},
  "totalEstimatedHours": ${levelsCount === "dynamic" ? 15 : levelsCount * 5},
  "dailyGoal": "Complete 1 node daily",
${levelTemplates}
}

CRITICAL RULES:
1. Every milestone MUST have unique "id" (e.g. "1-0", "1-1", "2-0", etc.).
2. The "status" of the very first milestone ("1-0") must be "unlocked". The status of ALL other milestones must be "locked".
3. "estimatedMinutes" and "xpReward" must be numbers (not strings).
4. Limit the topics/milestones per level to a maximum of ${maxTopicsVal}. Do not exceed this limit.
5. Each milestone's keyPoints array must have at most ${maxSubtopicsVal} items.
6. "searchQuery" must be a highly specific search query suitable for locating educational YouTube videos on that specific subtopic.
7. The final milestone of Level 1 must be a Test, Review, or Capstone Project.
8. Return ONLY valid, minified or formatted JSON. Do not write introductory text, explanations, or code blocks.`;
  }, [topic, goal, levelsCount, maxTopics, maxSubtopics, customInstructions, difficulty]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      sound.playClockTick();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Failed to copy text. Please select and copy manually.");
    }
  };

  const handleValidateAndSubmit = () => {
    setValidationError("");
    setValidationSuccess(false);
    
    const text = pastedJSON.trim();
    if (!text) {
      setValidationError("Please paste the AI-generated JSON response.");
      return;
    }

    let parsed;
    try {
      // Basic JSON syntax checking
      parsed = JSON.parse(text);
    } catch (err) {
      setValidationError(`JSON Syntax Error: ${err.message}. Please make sure you copied the JSON correctly without any extra text or backticks.`);
      return;
    }

    // Structural Validation
    if (!parsed.topic || typeof parsed.topic !== "string") {
      setValidationError("Validation Error: Missing or invalid 'topic' field (must be a string).");
      return;
    }
    if (!parsed.summary || typeof parsed.summary !== "string") {
      setValidationError("Validation Error: Missing or invalid 'summary' field (must be a string).");
      return;
    }

    // Dynamic level finder
    const keys = Object.keys(parsed);
    const levelKeys = keys.filter(k => /^level\d+$/.test(k)).sort((a, b) => {
      const numA = parseInt(a.replace("level", ""), 10);
      const numB = parseInt(b.replace("level", ""), 10);
      return numA - numB;
    });

    if (levelKeys.length === 0) {
      setValidationError("Validation Error: The JSON must contain at least one level object (e.g., 'level1').");
      return;
    }

    // Ensure sequential level numbering
    for (let idx = 0; idx < levelKeys.length; idx++) {
      const expectedKey = `level${idx + 1}`;
      if (levelKeys[idx] !== expectedKey) {
        setValidationError(`Validation Error: Level keys must be sequential. Expected '${expectedKey}' but found '${levelKeys[idx]}'.`);
        return;
      }
    }

    // Enforce fixed level count if selected
    if (levelsCount !== "dynamic" && levelKeys.length !== levelsCount) {
      setValidationError(`Validation Error: Expected exactly ${levelsCount} levels as configured, but found ${levelKeys.length} level objects.`);
      return;
    }

    const resolvedMax = maxTopics === "dynamic" ? 12 : maxTopics;
    const resolvedMaxSub = maxSubtopics === "dynamic" ? 12 : maxSubtopics;

    // Validate each level
    for (const lvlKey of levelKeys) {
      const level = parsed[lvlKey];
      if (!level || typeof level !== "object" || Array.isArray(level)) {
        setValidationError(`Validation Error: '${lvlKey}' must be an object.`);
        return;
      }
      if (!level.title || typeof level.title !== "string") {
        setValidationError(`Validation Error: '${lvlKey}' is missing a 'title' string.`);
        return;
      }
      if (!level.color || typeof level.color !== "string") {
        setValidationError(`Validation Error: '${lvlKey}' is missing a 'color' hex code string.`);
        return;
      }
      if (!level.milestones || !Array.isArray(level.milestones)) {
        setValidationError(`Validation Error: '${lvlKey}' must contain a 'milestones' array.`);
        return;
      }
      if (level.milestones.length === 0) {
        setValidationError(`Validation Error: '${lvlKey}' milestones array cannot be empty.`);
        return;
      }
      if (level.milestones.length > resolvedMax) {
        setValidationError(`Validation Error: '${lvlKey}' has ${level.milestones.length} milestones, which exceeds the limit of ${resolvedMax}.`);
        return;
      }

      // Validate individual milestones
      for (let mIdx = 0; mIdx < level.milestones.length; mIdx++) {
        const m = level.milestones[mIdx];
        const pathLabel = `${lvlKey}.milestones[${mIdx}]`;

        if (!m.id || typeof m.id !== "string") {
          setValidationError(`Validation Error: ${pathLabel} is missing an 'id' string.`);
          return;
        }
        if (!m.title || typeof m.title !== "string") {
          setValidationError(`Validation Error: ${pathLabel} is missing a 'title' string.`);
          return;
        }
        if (!m.description || typeof m.description !== "string") {
          setValidationError(`Validation Error: ${pathLabel} is missing a 'description' string.`);
          return;
        }
        if (!m.searchQuery || typeof m.searchQuery !== "string") {
          setValidationError(`Validation Error: ${pathLabel} is missing a 'searchQuery' string.`);
          return;
        }
        if (!m.keyPoints || !Array.isArray(m.keyPoints)) {
          setValidationError(`Validation Error: ${pathLabel} must contain a 'keyPoints' array.`);
          return;
        }
        if (m.keyPoints.length > resolvedMaxSub) {
          setValidationError(`Validation Error: ${pathLabel} has ${m.keyPoints.length} keyPoints (sub-topics), which exceeds the limit of ${resolvedMaxSub}.`);
          return;
        }
        if (typeof m.estimatedMinutes !== "number") {
          setValidationError(`Validation Error: ${pathLabel} 'estimatedMinutes' must be a number.`);
          return;
        }
        if (typeof m.xpReward !== "number") {
          setValidationError(`Validation Error: ${pathLabel} 'xpReward' must be a number.`);
          return;
        }
      }
    }

    // Normalizing validation states: force level 1, milestone 0 to be unlocked, and others locked
    levelKeys.forEach((lvlKey, lvlIdx) => {
      parsed[lvlKey].milestones.forEach((m, mIdx) => {
        if (lvlIdx === 0 && mIdx === 0) {
          m.status = "unlocked";
        } else {
          m.status = "locked";
        }
        m.isRevision = !!m.isRevision;
        m.isEncrypted = false;
      });
    });

    // Save configuration states
    parsed.isEngineer = false;
    parsed.difficulty = difficulty;
    parsed.devGoal = goal;

    setValidationSuccess(true);
    sound.playCorrect();
    
    // Small delay to let user see success state before launching roadmap
    setTimeout(() => {
      onRoadmapReady(parsed);
    }, 1000);
  };

  return (
    <div style={{
      width: "100%",
      maxWidth: "960px",
      margin: "0 auto",
      padding: "24px",
      background: isDarkMode ? "rgba(13, 8, 5, 0.6)" : "rgba(255, 255, 255, 0.6)",
      backdropFilter: "blur(16px)",
      borderRadius: "24px",
      border: isDarkMode ? "1px solid rgba(255, 106, 0, 0.15)" : "1px solid rgba(255, 106, 0, 0.1)",
      boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
      fontFamily: "'Outfit', sans-serif",
      textAlign: "left",
      boxSizing: "border-box"
    }}>
      <style>{`
        .manual-config-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .manual-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .manual-label {
          font-size: 13px;
          font-weight: 800;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .manual-input {
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "#cbd5e1"};
          background: ${isDarkMode ? "rgba(255,255,255,0.03)" : "#ffffff"};
          color: var(--text-light);
          font-size: 14.5px;
          outline: none;
          transition: border-color 0.2s;
        }
        .manual-input:focus {
          border-color: #ff6a00;
        }
        .manual-btn {
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          font-size: 14px;
        }
        .manual-btn-primary {
          background: linear-gradient(135deg, #ff6a00 0%, #ff4500 100%);
          color: #fff;
          box-shadow: 0 4px 15px rgba(255, 106, 0, 0.25);
        }
        .manual-btn-primary:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(255, 106, 0, 0.35);
        }
        .manual-btn-secondary {
          background: ${isDarkMode ? "rgba(255,255,255,0.05)" : "#f1f5f9"};
          color: var(--text-light);
          border: 1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0"};
        }
        .manual-btn-secondary:hover {
          background: ${isDarkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0"};
        }
        .prompt-container {
          background: ${isDarkMode ? "#0d0805" : "#f8fafc"};
          border: 1.5px solid ${isDarkMode ? "rgba(255, 106, 0, 0.2)" : "#ffedd5"};
          border-radius: 12px;
          padding: 16px;
          position: relative;
          margin-bottom: 24px;
        }
        .prompt-pre {
          margin: 0;
          font-family: monospace;
          font-size: 12.5px;
          color: var(--text-light);
          max-height: 200px;
          overflow-y: auto;
          white-space: pre-wrap;
          line-height: 1.5;
        }
        .difficulty-cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
          margin-top: 6px;
        }
        .difficulty-card {
          border: 1.5px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0"};
          background: ${isDarkMode ? "rgba(255,255,255,0.02)" : "#ffffff"};
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 6px;
          text-align: left;
        }
        .difficulty-card:hover {
          border-color: ${isDarkMode ? "rgba(255,106,0,0.5)" : "#fdba74"};
          transform: translateY(-1.5px);
        }
        .difficulty-card-selected {
          border-color: #ff6a00 !important;
          background: ${isDarkMode ? "rgba(255, 106, 0, 0.05)" : "#fff7ed"};
          box-shadow: 0 4px 15px rgba(255, 106, 0, 0.1);
        }
        .difficulty-card-title {
          font-size: 14.5px;
          font-weight: 850;
          color: var(--text-light);
          margin: 0;
        }
        .difficulty-card-subtitle {
          font-size: 11px;
          font-weight: 700;
          color: #ff6a00;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
        }
        .difficulty-card-desc {
          font-size: 11.5px;
          line-height: 1.45;
          color: var(--text-muted);
          margin: 0;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`, paddingBottom: "16px", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: isDarkMode ? "#ffffff" : "#0f172a" }}>🛠️ Custom AI Pathway Builder</h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>Generate prompts for external AIs and load custom roadmaps manually.</p>
        </div>
        <button className="manual-btn manual-btn-secondary" onClick={onBack} style={{ padding: "8px 16px", fontSize: "12.5px" }}>
          Back
        </button>
      </div>

      {/* Configuration Fields */}
      <div className="manual-config-grid">
        <div className="manual-input-group">
          <label className="manual-label">1. Target Topic</label>
          <input 
            type="text" 
            placeholder="e.g., Kubernetes, Rust, IELTS Prep" 
            className="manual-input"
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
        </div>

        <div className="manual-input-group">
          <label className="manual-label">2. Preparation Goal</label>
          <input 
            type="text" 
            placeholder="e.g., Pass job interview, build a side project" 
            className="manual-input"
            value={goal}
            onChange={e => setGoal(e.target.value)}
          />
        </div>

        <div className="manual-input-group">
          <label className="manual-label">3. Total Levels</label>
          <select 
            className="manual-input"
            value={levelsCount}
            onChange={e => setLevelsCount(e.target.value === "dynamic" ? "dynamic" : Number(e.target.value))}
          >
            <option value="dynamic">✨ Let AI Decide (Dynamic)</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? "Level" : "Levels"}</option>
            ))}
          </select>
        </div>

        <div className="manual-input-group">
          <label className="manual-label">4. Max Topics / Level</label>
          <select 
            className="manual-input"
            value={maxTopics}
            onChange={e => setMaxTopics(e.target.value === "dynamic" ? "dynamic" : Number(e.target.value))}
          >
            <option value="dynamic">✨ Let AI Decide (Dynamic, max 12)</option>
            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
              <option key={n} value={n}>{n} Nodes max</option>
            ))}
          </select>
        </div>

        <div className="manual-input-group">
          <label className="manual-label">5. Max Sub-Topics / Topic</label>
          <select 
            className="manual-input"
            value={maxSubtopics}
            onChange={e => setMaxSubtopics(e.target.value === "dynamic" ? "dynamic" : Number(e.target.value))}
          >
            <option value="dynamic">✨ Let AI Decide (Dynamic)</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <option key={n} value={n}>{n} Sub-topics max</option>
            ))}
          </select>
        </div>

        <div className="manual-input-group" style={{ gridColumn: "1 / -1" }}>
          <label className="manual-label">6. Target Learning Mode (Depth)</label>
          <div className="difficulty-cards-container">
            {/* Explorer Card */}
            <div 
              className={`difficulty-card ${difficulty === "Explorer" ? "difficulty-card-selected" : ""}`}
              onClick={() => { sound.playClockTick(); setDifficulty("Explorer"); }}
            >
              <div className="difficulty-card-title">🟢 Explorer</div>
              <div className="difficulty-card-subtitle">Learn only the essentials</div>
              <div className="difficulty-card-desc">
                Generate the shortest roadmap that teaches the highest-value concepts. Focuses on the critical 20% of knowledge providing roughly 80% of practical understanding. Intentionally omits advanced or niche topics.
              </div>
            </div>

            {/* Professional Card */}
            <div 
              className={`difficulty-card ${difficulty === "Professional" ? "difficulty-card-selected" : ""}`}
              onClick={() => { sound.playClockTick(); setDifficulty("Professional"); }}
            >
              <div className="difficulty-card-title">⚔️ Professional</div>
              <div className="difficulty-card-subtitle">Build strong proficiency</div>
              <div className="difficulty-card-desc">
                Generate a comprehensive roadmap covering all major concepts, practical techniques, and common applications. Includes enough depth to become highly capable, excluding only highly specialized or niche areas.
              </div>
            </div>

            {/* Hell Mode Card */}
            <div 
              className={`difficulty-card ${difficulty === "Hell Mode" ? "difficulty-card-selected" : ""}`}
              onClick={() => { sound.playClockTick(); setDifficulty("Hell Mode"); }}
            >
              <div className="difficulty-card-title">🔥 Hell Mode</div>
              <div className="difficulty-card-subtitle">Maximum Mastery</div>
              <div className="difficulty-card-desc">
                Generate the most comprehensive roadmap possible, covering foundational knowledge, deeper concepts, advanced topics, edge cases, underlying principles, and connections between ideas. Prioritizes completeness over speed.
              </div>
            </div>
          </div>
        </div>

        <div className="manual-input-group" style={{ gridColumn: "1 / -1" }}>
          <label className="manual-label">7. Custom Instructions / Context (Optional)</label>
          <textarea 
            rows={2}
            placeholder="e.g. Focus on practical projects. Skip basic tool installation. Tailor examples to standard Javascript instead of Typescript." 
            className="manual-input"
            value={customInstructions}
            onChange={e => setCustomInstructions(e.target.value)}
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
        </div>
      </div>

      {/* Copy Prompt Section */}
      <div style={{ marginBottom: "12px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "14.5px", fontWeight: "800", textTransform: "uppercase", color: "var(--text-light)" }}>
          📋 Step 1: Copy Prompt & Generate AI Response
        </h3>
        <p style={{ margin: "0 0 12px 0", fontSize: "13.5px", color: "var(--text-muted)", lineHeight: "1.4" }}>
          Copy this system prompt and paste it in ChatGPT, Claude, Gemini, or any LLM. The AI will output a valid JSON structure tailored to your settings.
        </p>
      </div>

      <div className="prompt-container">
        <button 
          onClick={handleCopy}
          className="manual-btn manual-btn-primary"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            padding: "6px 14px",
            fontSize: "12px",
            borderRadius: "6px",
            zIndex: 2,
            background: copied ? "#10b981" : "#ff6a00"
          }}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy Prompt</span>
            </>
          )}
        </button>
        <pre className="prompt-pre custom-scrollbar">{generatedPrompt}</pre>
      </div>

      {/* Paste Response Section */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "14.5px", fontWeight: "800", textTransform: "uppercase", color: "var(--text-light)" }}>
          📥 Step 2: Paste Response & Initialize Pathway
        </h3>
        <p style={{ margin: "0 0 12px 0", fontSize: "13.5px", color: "var(--text-muted)", lineHeight: "1.4" }}>
          Paste the raw JSON response output by the AI in the box below. We will analyze the structure to build your visual roadmap.
        </p>

        <textarea
          rows={8}
          placeholder="Paste raw JSON here..."
          value={pastedJSON}
          onChange={e => setPastedJSON(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: `1.5px solid ${validationError ? "#ef4444" : isDarkMode ? "rgba(255,255,255,0.1)" : "#cbd5e1"}`,
            background: isDarkMode ? "rgba(255,255,255,0.02)" : "#ffffff",
            color: "var(--text-light)",
            fontFamily: "monospace",
            fontSize: "13px",
            outline: "none",
            boxSizing: "border-box",
            resize: "vertical",
            transition: "border-color 0.2s"
          }}
        />
      </div>

      {/* Validation Messages & Actions */}
      {validationError && (
        <div style={{
          padding: "14px 16px",
          background: isDarkMode ? "rgba(239,68,68,0.1)" : "#fef2f2",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: "10px",
          color: isDarkMode ? "#f87171" : "#b91c1c",
          fontSize: "13.5px",
          fontWeight: "600",
          lineHeight: "1.4",
          marginBottom: "20px"
        }}>
          ⚠️ {validationError}
        </div>
      )}

      {validationSuccess && (
        <div style={{
          padding: "14px 16px",
          background: isDarkMode ? "rgba(16,185,129,0.1)" : "#ecfdf5",
          border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: "10px",
          color: isDarkMode ? "#34d399" : "#047857",
          fontSize: "13.5px",
          fontWeight: "600",
          lineHeight: "1.4",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Pathway parsed successfully! Decrypting curriculum nodes...</span>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <button className="manual-btn manual-btn-secondary" onClick={onBack}>
          Cancel
        </button>
        <button 
          className="manual-btn manual-btn-primary" 
          onClick={handleValidateAndSubmit}
          disabled={validationSuccess}
          style={validationSuccess ? { opacity: 0.6, cursor: "not-allowed" } : {}}
        >
          <span>Validate & Launch Path</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
