import dotenv from "dotenv";
import { YoutubeTranscript } from "youtube-transcript";
import path from "path";
import { fileURLToPath } from "url";
import TelemetryEvent from "./models/TelemetryEvent.js";
import { trackAICost } from "./services/budgetTracker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = "gemma4:e4b";

// ── Ollama helpers ──────────────────────────────────────────────────────────
async function ollamaGenerate(prompt, format = "json", userId = null, endpoint = "unknown") {
  const body = {
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
    options: { temperature: 0.7, num_predict: -1, num_ctx: 16384 }
  };
  if (format === "json") body.format = "json";

  const startTime = Date.now();
  console.log(`[Ollama] Sending request to ${OLLAMA_URL}/api/generate for model ${OLLAMA_MODEL}...`);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(300000) // 5 min timeout to allow local models to process
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Ollama HTTP ${res.status}: ${errorText || "Unknown error"}`);
    }
    const data = await res.json();
    
    TelemetryEvent.create({
      username: "system",
      eventType: "AI_REQUEST_EXECUTED",
      metadata: { provider: "ollama", model: OLLAMA_MODEL, latencyMs: Date.now() - startTime }
    }).catch(e => console.error(e));

    const text = data.response || "";
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(text.length / 4);
    trackAICost(userId, endpoint, inputTokens, outputTokens).catch(e => console.error("trackAICost failed:", e));

    return text;
  } catch (err) {
    TelemetryEvent.create({
      username: "system",
      eventType: "AI_REQUEST_FAILED",
      metadata: { provider: "ollama", model: OLLAMA_MODEL, errorMessage: err.message, latencyMs: Date.now() - startTime }
    }).catch(e => console.error(e));
    throw err;
  }
}

// ── Gemini API helpers ────────────────────────────────────────────────────────
async function callGeminiAPI(prompt, responseMimeType = "text/plain", userId = null, endpoint = "unknown") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    throw new Error("No Gemini API key configured");
  }

  const startTime = Date.now();
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API HTTP Error ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    TelemetryEvent.create({
      username: "system",
      eventType: "AI_REQUEST_EXECUTED",
      metadata: { provider: "gemini", model: "gemini-2.5-flash", latencyMs: Date.now() - startTime }
    }).catch(e => console.error(e));

    const usage = data.usageMetadata || {};
    const inputTokens = usage.promptTokenCount || Math.ceil(prompt.length / 4);
    const outputTokens = usage.candidatesTokenCount || Math.ceil(text.length / 4);
    trackAICost(userId, endpoint, inputTokens, outputTokens).catch(e => console.error("trackAICost failed:", e));

    return text;
  } catch (err) {
    TelemetryEvent.create({
      username: "system",
      eventType: "AI_REQUEST_FAILED",
      metadata: { provider: "gemini", model: "gemini-2.5-flash", errorMessage: err.message, latencyMs: Date.now() - startTime }
    }).catch(e => console.error(e));
    throw err;
  }
}

function buildFallbackRoadmap(topic, goal) {
  const t = topic || "Your Subject";

  // Smart detailed fallback for any generic subject
  const milestoneBase = (level, idx, titles, descs) => {
    const title = titles[idx] || `${t} Step ${idx + 1}`;
    return {
      id: `${level}-${idx}`,
      title,
      description: descs[idx] || `Learn the essential sub-topic under ${title}.`,
      searchQuery: `${t} ${title} tutorial`,
      keyPoints: [
        `Understand ${title} concepts`,
        `Practice ${title} with examples`,
        `Review common pitfalls in ${title}`,
        `Check interview questions for ${title}`
      ],
      estimatedMinutes: 45,
      status: level === 1 && idx === 0 ? "unlocked" : "locked",
      xpReward: 40 + idx * 5,
      isRevision: false
    };
  };

  const level1Titles = [
    `${t} Orientation`,
    `${t} Basic Terminology`,
    `${t} Environment Setup`,
    `First Hello World Script`,
    `Data Types & Variables`,
    `Basic Assignments`,
    `Arithmetic Operators`,
    `Logical Operators`,
    `Conditionals (If/Else)`,
    `Loops (While)`,
    `Loops (For)`,
    `Foundations Review Challenge`
  ];
  const level1Descs = [
    `Get started with ${t}, understanding its history, purpose, and installation.`,
    `Learn the basic terminology and core keywords used in ${t}.`,
    `Configure your local environment and code editor for optimal development.`,
    `Write and execute your first basic script or program.`,
    `Learn about primitive types, variables, and memory references.`,
    `Understand assignment operators and naming conventions.`,
    `Learn mathematical computations and operator precedence.`,
    `Master Boolean logic, comparison, and short-circuit operators.`,
    `Write branching statements to control program flow based on criteria.`,
    `Learn how to repeat actions using basic conditional iteration.`,
    `Master standard collection loops and index-based traversal.`,
    `Review and test your complete foundational understanding of Level 1.`
  ];

  const level2Titles = [
    `Arrays / Lists Introduction`,
    `Modifying Collections`,
    `Key-Value Maps / Objects`,
    `Function Syntax Basics`,
    `Function Parameters`,
    `Function Return Values`,
    `Scope & Variable Lifetime`,
    `String Manipulation`,
    `File Input/Output`,
    `Debugging Tools Introduction`,
    `Common Code Conventions`,
    `Intermediate Foundations Review`
  ];
  const level2Descs = [
    `Learn to store ordered data structures in memory.`,
    `Add, remove, and update elements within arrays or lists.`,
    `Understand associative dictionaries or object mappings.`,
    `Define reusable blocks of execution logic.`,
    `Pass arguments and default parameters to functions.`,
    `Retrieve outputs from functions and handle return types.`,
    `Learn local vs global scopes and block-scoped variables.`,
    `Concatenate, slice, and format strings/text inputs.`,
    `Read from and write data to text files on disk.`,
    `Inspect variables, use step-through execution, and locate bugs.`,
    `Learn naming styling, comment conventions, and linting tools.`,
    `Integrate intermediate structures and complete challenges.`
  ];

  const level3Titles = [
    `Exception Handling`,
    `Try/Catch Blocks`,
    `Module Imports`,
    `Creating Simple Modules`,
    `Asynchronous Concept Overview`,
    `Callbacks Introduction`,
    `Promises / Async Syntax`,
    `Parsing JSON Data`,
    `Basic Networking Concepts`,
    `HTTP GET Requests`,
    `Entry-Level Test Questions`,
    `Final Basic Capstone Project`
  ];
  const level3Descs = [
    `Learn why programs crash and how to anticipate runtime exceptions.`,
    `Gracefully capture errors and implement fallback flows.`,
    `Import external files and standard library packages.`,
    `Export functions and structures to organize code components.`,
    `Understand non-blocking execution flow and thread loops.`,
    `Execute functions after asynchronous actions complete.`,
    `Write clean asynchronous flows with modern return signatures.`,
    `Deserialize web responses and text data into memory objects.`,
    `Understand IP, ports, clients, servers, and standard request loops.`,
    `Send API requests to fetch JSON data from external resources.`,
    `Practice common junior-level interview questions and coding tests.`,
    `Build a complete, CLI-based project combining all basics.`
  ];

  return {
    topic: t,
    goal: goal || "Master the subject",
    summary: `A highly detailed, personalized 3-level roadmap to build a rock-solid basic understanding in ${t} tailored to your goals.`,
    totalVideosEstimated: 36,
    totalEstimatedHours: 27,
    dailyGoal: "Complete 1 node and watch 1 video daily",
    level1: {
      title: "Level 1 — Foundations",
      subtitle: "Basic Syntax & Setups",
      color: "#10b981",
      milestones: Array.from({ length: 12 }, (_, i) => milestoneBase(1, i, level1Titles, level1Descs))
    },
    level2: {
      title: "Level 2 — Intermediate Basics",
      subtitle: "Data, Tools & Practical Logic",
      color: "#f59e0b",
      milestones: Array.from({ length: 12 }, (_, i) => milestoneBase(2, i, level2Titles, level2Descs))
    },
    level3: {
      title: "Level 3 — Interview Prep & Mastery",
      subtitle: "Advanced Foundations & Mock Tests",
      color: "#8b5cf6",
      milestones: Array.from({ length: 12 }, (_, i) => milestoneBase(3, i, level3Titles, level3Descs))
    }
  };
}

/**
 * Generates a personalized 3-level learning roadmap using Ollama gemma4:e4b or Gemini API.
 * Falls back to template if Ollama is unavailable.
 */
export async function generateRoadmapFromAnswers(answers, pathfinderMode, options = {}, userId = null) {
  const { isEngineer, devGoal, devLanguage, difficulty } = options;
  
  const qa = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n");
  
  let userTopicRaw = answers[0]?.answer || "General Learning";
  let userGoal = answers[1]?.answer || "";
  let userReason = pathfinderMode === 'detailed' ? (answers.find(a => a.question.toLowerCase().includes("dream"))?.answer || "achieve their dream outcome") : (answers.find(a => a.question.toLowerCase().includes("why"))?.answer || "learning");

  if (isEngineer) {
    userTopicRaw = devLanguage || userTopicRaw;
    userGoal = devGoal || userGoal;
    userReason = devGoal || userReason;
  }

  // Dynamically extract a short topic from the long prompt to prevent massive text blocks
  const extractShortTopic = (raw) => {
    if (!raw) return "General";
    if (raw.length <= 40) return raw;
    const words = raw.split(/\s+/);
    if (words.length > 5) return words.slice(0, 5).join(" ") + "...";
    return raw.substring(0, 40) + "...";
  };
  const userTopicShort = extractShortTopic(userTopicRaw);

  dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
  const apiKey = process.env.GEMINI_API_KEY;
  const useGemini = apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE";

  let modePrompt = "";
  let levelsCount = 3;
  let dynamicMilestonesInstruction = useGemini 
    ? `EXACTLY 12 MILESTONES PER LEVEL: You will generate the detailed milestones for ALL levels (Level 1 to Level 3). Do NOT leave any levels empty.`
    : "EXACTLY 12 MILESTONES FOR LEVEL 1: You will generate the detailed milestones for Level 1 ONLY. Leave Level 2 and Level 3 milestones arrays empty.";
  
  if (isEngineer) {
    if (difficulty === 'Easy') {
      modePrompt = `EASY MODE: Apply the Pareto Principle (80/20 rule). Focus ONLY on the 20% of topics that cover 80% of real-world usage. Ignore esoteric or advanced edge cases.`;
    } else if (difficulty === 'Medium') {
      modePrompt = `MEDIUM MODE: Create a standard, comprehensive developer roadmap.`;
    } else if (difficulty === 'Hell') {
      modePrompt = `HELL MODE (MAXIMUM PRACTICAL MASTERY): Generate a 5-level roadmap focused on Interview + Real World Mastery.
ANTI-FILLER CONSTRAINT: Do not create filler milestones to reach 5 levels. If a topic cannot justify additional depth, expand practical applications, real-world scenarios, and project-based mastery instead of inventing artificial topics.`;
      levelsCount = 5;
    }
    dynamicMilestonesInstruction = useGemini 
      ? `DYNAMIC MILESTONES: You decide the appropriate number of milestones per level based on the topic's natural complexity. Do not force exactly 12 if the topic requires fewer or more. You MUST generate the detailed milestones for ALL levels (Level 1 to Level ${levelsCount}). Do NOT leave any levels empty.`
      : `DYNAMIC MILESTONES: You decide the appropriate number of milestones per level based on the topic's natural complexity. Do not force exactly 12 if the topic requires fewer or more. Generate the detailed milestones for Level 1 ONLY. Leave the arrays for all subsequent levels (Level 2 to Level ${levelsCount}) empty.`;
  } else {
    modePrompt = pathfinderMode === 'detailed' ? 'This is a DEEP-DIVE mode interview. You must carefully analyze their specific problems, history, and constraints. Ensure the roadmap is incredibly comprehensive, leaving absolutely no topic out, so they feel fully confident and capable of achieving their dream outcome by the end of Level 3.' : 'Focus EXCLUSIVELY on teaching the BASICS / FOUNDATIONS of the topic extremely well.';
  }

  let jsonStructure = `{
  "topic": "short specific topic name (2-4 words)",
  "goal": "one sentence summarizing what they want to achieve",
  "summary": "2-3 sentences describing why this roadmap is tailored for them",
  "totalVideosEstimated": 36,
  "totalEstimatedHours": 25,
  "dailyGoal": "e.g. Complete 1 node daily",
  "level1": {
    "title": "Level 1 — Foundations",
    "subtitle": "Essential Basics & Core Concepts",
    "color": "#10b981",
    "milestones": [
      {
        "id": "1-0",
        "title": "specific basic sub-topic title",
        "description": "2-3 sentences describing what this covers",
        "searchQuery": "Highly specific YouTube search query (DO NOT use generic queries)",
        "keyPoints": ["Specific concept 1", "Specific concept 2"],
        "estimatedMinutes": 40,
        "status": "unlocked",
        "xpReward": 30,
        "isRevision": false
      }
    ]
  },
  "level2": {
    "title": "Level 2 — Core Operations & Logic",
    "subtitle": "Intermediate Foundations",
    "color": "#f59e0b",
    "milestones": ${useGemini ? `[ /* same array of milestones format as level 1 */ ]` : `[]`}
  },
  "level3": {
    "title": "Level 3 — Basic Applications & Preparation",
    "subtitle": "Foundational practice",
    "color": "#8b5cf6",
    "milestones": ${useGemini ? `[ /* same array of milestones format as level 1 */ ]` : `[]`}
  }`;

  if (levelsCount === 5) {
    jsonStructure += `,
  "level4": {
    "title": "Level 4 — Advanced Architecture",
    "subtitle": "Real World Mastery",
    "color": "#ec4899",
    "milestones": ${useGemini ? `[ /* same array of milestones format as level 1 */ ]` : `[]`}
  },
  "level5": {
    "title": "Level 5 — Supreme Mastery",
    "subtitle": "Interview Ready & Expert Applications",
    "color": "#ef4444",
    "milestones": ${useGemini ? `[ /* same array of milestones format as level 1 */ ]` : `[]`}
  }`;
  }
  
  jsonStructure += `\n}`;

  const prompt = `You are an expert learning path designer for the Kaevrix educational gaming platform.
A user has completed an onboarding interview. Based on their answers, generate a highly personalized, detailed ${levelsCount}-level learning roadmap.
${modePrompt}

USER INTERVIEW:
${qa}

CRITICAL REQUIREMENT:
1. The generated roadmap MUST cover the essential aspects of the topic.
2. The levels must be logically connected, starting from basics to practical application, guaranteeing they achieve their goal: "${userReason}".
3. ${dynamicMilestonesInstruction}

Generate a JSON roadmap with this EXACT structure:
${jsonStructure}

Rules:
${useGemini ? `- You MUST generate milestones for ALL levels (Level 1 to Level ${levelsCount}).` : `- DO NOT generate milestones for any level other than Level 1.`}
- The final milestone of Level 1 must be a Test or Capstone Project.
- Do NOT hardcode generic keyPoints like "Understand core concepts". You must generate highly specific, dynamic subtopics for the keyPoints.
- Ensure searchQuery is highly specific so the user gets relevant YouTube videos for that exact subtopic.
- Level 1 milestone 0 must have status "unlocked", all others "locked".
- Be extremely detailed, practical, and tailored to the topic "${userTopicShort}".

Return ONLY valid JSON, no markdown.`;

  try {
    let raw;
    let geminiFailed = false;

    if (useGemini) {
      try {
        console.log(`[Pathfinder] Generating roadmap for: "${userTopicShort}" via Gemini API`);
        raw = await callGeminiAPI(prompt, "application/json", userId, "/pathfinder/generate");
      } catch (gemErr) {
        console.error(`[Pathfinder] Gemini API failed (${gemErr.message}). Falling back to Ollama...`);
        geminiFailed = true;
      }
    }
    
    if (!useGemini || geminiFailed) {
      console.log(`[Pathfinder] Generating roadmap for: "${userTopicShort}" via Ollama ${OLLAMA_MODEL}`);
      raw = await ollamaGenerate(prompt, "json", userId, "/pathfinder/generate");
    }

    const roadmap = JSON.parse(raw);

    if (!roadmap.level1?.milestones) {
      throw new Error("Invalid roadmap structure from AI");
    }

    if (!roadmap.topic || roadmap.topic.length > 50 || roadmap.topic.toLowerCase().includes("short specific topic name")) {
      roadmap.topic = userTopicShort;
    }

    const createPlaceholders = (levelNum) => {
      // Default to 12 if dynamic count isn't specified, but frontend renders whatever is in array
      return Array.from({ length: 8 }, (_, i) => ({
        id: `${levelNum}-${i}`,
        title: `Encrypted Level ${levelNum} Node`,
        description: "This advanced topic is currently encrypted. Complete the previous level to establish the neural link and decrypt this curriculum.",
        searchQuery: "Encrypted Data",
        keyPoints: ["Classified", "Classified"],
        estimatedMinutes: 45,
        status: "locked",
        xpReward: 50 * levelNum,
        isRevision: false,
        isEncrypted: true
      }));
    };

    roadmap.level2 = roadmap.level2 || { title: "Level 2 — Core Operations", subtitle: "Intermediate Foundations", color: "#f59e0b" };
    roadmap.level3 = roadmap.level3 || { title: "Level 3 — Advanced Mastery", subtitle: "Preparation & Tests", color: "#8b5cf6" };
    
    if (!useGemini || !roadmap.level2.milestones || roadmap.level2.milestones.length === 0) {
      roadmap.level2.milestones = createPlaceholders(2);
    }
    if (!useGemini || !roadmap.level3.milestones || roadmap.level3.milestones.length === 0) {
      roadmap.level3.milestones = createPlaceholders(3);
    }

    roadmap.isEngineer = !!isEngineer;
    roadmap.devGoal = devGoal || "";
    roadmap.difficulty = difficulty || "Medium";

    if (levelsCount === 5) {
      roadmap.level4 = roadmap.level4 || { title: "Level 4 — Real World Mastery", subtitle: "Architecture", color: "#ec4899" };
      roadmap.level5 = roadmap.level5 || { title: "Level 5 — Supreme Mastery", subtitle: "Interview Ready", color: "#ef4444" };
      
      if (!useGemini || !roadmap.level4.milestones || roadmap.level4.milestones.length === 0) {
        roadmap.level4.milestones = createPlaceholders(4);
      }
      if (!useGemini || !roadmap.level5.milestones || roadmap.level5.milestones.length === 0) {
        roadmap.level5.milestones = createPlaceholders(5);
      }
    }

    roadmap.level1.milestones.forEach((m, i) => { m.status = i === 0 ? "unlocked" : "locked"; });

    console.log(`[Pathfinder] Successfully generated lazy roadmap: "${roadmap.topic}"`);
    return roadmap;
  } catch (err) {
    console.error(`[Pathfinder] AI roadmap generation failed (${err.message}), using fallback template`);
    return buildFallbackRoadmap(userTopicShort, userGoal);
  }
}

/**
 * Lazily generates detailed milestones for Level 2 or Level 3 based on prior context.
 */
export async function generateLevelMilestones(topic, level, previousMilestonesText, userId = null) {
  const prompt = `You are an expert learning path designer for the Kaevrix platform.
The user is learning "${topic}". They have just completed the previous levels.
Here are the topics they have ALREADY mastered:
${previousMilestonesText}

Your task: Generate EXACTLY 12 new, advanced, highly detailed milestones for Level ${level}.
DO NOT repeat the topics they already learned. Build directly upon their existing knowledge.
Node 12 MUST be a comprehensive test, quiz, or practical capstone project.

Generate a JSON object with this EXACT structure:
{
  "milestones": [
    {
      "id": "${level}-0",
      "title": "advanced sub-topic title",
      "description": "2-3 sentences describing what this covers",
      "searchQuery": "Highly specific YouTube search query (e.g., '${topic} specific sub-topic tutorial')",
      "keyPoints": ["Advanced concept 1", "Advanced concept 2", "Advanced concept 3", "Advanced concept 4"],
      "estimatedMinutes": 50,
      "status": "locked",
      "xpReward": ${level * 40},
      "isRevision": false
    }
    // ... MUST HAVE EXACTLY 12 MILESTONES HERE
  ]
}

Return ONLY valid JSON, no markdown.`;

  const apiKey = process.env.GEMINI_API_KEY;
  const useGemini = apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE";

  let raw;
  if (useGemini) {
    console.log(`[Pathfinder] Generating Level ${level} for: "${topic}" via Gemini API`);
    raw = await callGeminiAPI(prompt, "application/json", userId, "/pathfinder/generate-level");
  } else {
    console.log(`[Pathfinder] Generating Level ${level} for: "${topic}" via Ollama`);
    raw = await ollamaGenerate(prompt, "json", userId, "/pathfinder/generate-level");
  }

  const result = JSON.parse(raw);
  if (!result.milestones || result.milestones.length === 0) {
    throw new Error("Invalid level structure from AI");
  }
  
  // Ensure the first node is unlocked for them to start
  result.milestones[0].status = "unlocked";

  return result.milestones;
}

/**
 * Generates highly structured, beautiful markdown study notes for a specific roadmap milestone.
 */
export async function generateStudyNotes(topic, milestone, answers = [], noteStyle = 'smart', userId = null) {
  const userReason = answers.find(a => a.question.toLowerCase().includes("why"))?.answer || "learning";
  const userGoal = answers.find(a => a.question.toLowerCase().includes("success"))?.answer || "mastery";

  let prompt = "";

  if (noteStyle === 'basic') {
    prompt = `You are a world-class expert educator.
Generate an exhaustive, high-fidelity, and deeply detailed study guide for this milestone:

Topic: ${topic}
Milestone: ${milestone.title}
Description: ${milestone.description || ""}
Key Points: ${(milestone.keyPoints || []).join(", ")}
User's Reason for learning: ${userReason}
User's 3-month success target: ${userGoal}

Your study guide MUST follow this exact Markdown structure and satisfy these strict guidelines:

# ${milestone.title}

## 🎯 What You'll Learn & Why It Matters
Explain the purpose of this milestone in depth. Why does it exist, what problem does it solve, and how does it fit into the broader topic? Relate it directly to the user's reason for learning: "${userReason}".

## 🔍 Core Concepts Explained
Provide an exhaustive breakdown of the sub-topics under this milestone.
Be extremely detailed. Explain the underlying rules, mechanics, and terminology. Use analogies if helpful. Do not summarize or gloss over edge cases. Teach this foundational aspect extremely well.

## 📋 Comparison Matrix
Include a clear Markdown table comparing key aspects, options, or dimensions of the sub-topics under this milestone (e.g., comparing different approaches, syntax, methods, tools, or concepts).

## 💻 Practical Demonstration & Examples
- If the topic is a programming language, framework, or software tool:
  Provide a clear "Common Pitfall / How NOT to do it" code block, followed by an explanation of the bug/error.
  Then show a "Best Practice / How to do it" code block with clean, modern code.
  Ensure code blocks are wrapped in standard triple-backticks specifying the correct language syntax (e.g., python, javascript, sql, bash, etc.).
- If the topic is non-technical (e.g., history, business, language, art):
  Provide a detailed "Common Misconception" section explaining a frequent error or incorrect belief, followed by an explanation of why it is incorrect.
  Then provide a "Best Practice / Correct Concept" section explaining the correct understanding or application.

## 💼 Core Interview Questions (Targeted for "${userReason}")
Identify 3-4 actual, high-quality questions related to this milestone (especially the tricky or fundamental ones that test deep understanding).
For each question, provide:
1. **The Question**
2. **The Ideal Answer** (what an expert or senior professional would say to impress the interviewer)
3. **Under-The-Hood Explanation** (the deep explanation of the mechanics/reasons behind the answer)

## ⚡ Interactive Practice & Exercises
Provide 2 small exercises, scenarios, or mental puzzles (with answers/explanations hidden under a "Spoiler" description or explanation below them) that the user can do to verify their understanding.

Ensure the tone is professional, encouraging, and highly educational. Generate the complete notes without placeholders.
Your word count and depth must dynamically adapt to the complexity of the milestone:
- For complex milestones (involving intricate rules, underlying architecture, or multi-step logic): Write a detailed, exhaustive study guide (800-1200 words) covering deep theory, edge cases, extensive examples, and detailed explanations.
- For simple or syntax-only milestones (straightforward definitions, basic terms, or simple conventions): Keep it concise and direct (400-600 words) with clear explanations and examples. Do NOT add unnecessary fluff or wordy explanations just to hit a high word count.`;
  } else {
    prompt = `You are a world-class expert educator.
Generate an exhaustive, high-fidelity, and deeply detailed "Smart Study Guide" for this milestone.
Before generating the text, SILENTLY ask yourself the following self-reflection questions about the topic and milestone:
- Is this topic conceptual?
- Is this topic practical?
- Is this topic visual?
- Does this topic require memorization?
- Does this topic require logic?
- Does this topic involve comparisons?
- Is this beginner difficult?
- Does this topic involve sequences/steps?
- Does this topic require real-world examples?
- Is this topic interview/job relevant?
- Does this topic involve cause/effect?
- Does this topic require diagrams/flow explanation?
- Would exercises improve retention?
- Is this topic skill-based or theory-based?

DO NOT output the answers to these questions. Instead, dynamically construct the markdown output based on the "Yes" answers using these mapping rules:
* Conceptual → Explain deep ideas and underlying understanding.
* Practical → Add real-world usage and implementation examples with code/actions.
* Visual → Use flows, structures, and visual formatting (e.g., markdown mermaid flowcharts/diagrams if helpful).
* Memorization → Add summaries, repetition, and cheat-sheet style lists.
* Logic/Sequences/Steps → Add step-by-step numbered breakdowns.
* Comparisons → Always include a comparison matrix/table.
* Real-world examples → Add industry-specific use-cases.
* Interview relevant → Include deep interview questions and under-the-hood explanations.
* Exercises → Include interactive practice problems.

Topic: ${topic}
Milestone: ${milestone.title}
Description: ${milestone.description || ""}
Key Points: ${(milestone.keyPoints || []).join(", ")}
User's Reason for learning: ${userReason}
User's 3-month success target: ${userGoal}

Ensure the tone is professional, encouraging, and highly educational.
Output ONLY the final Markdown formatted study guide. Use beautiful typography, bolding, and structuring. Make the notes visually stunning and awesome.`;
  }

  dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
  const apiKey = process.env.GEMINI_API_KEY;
  const useGemini = apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE";

  try {
    let notes;
    let geminiFailed = false;

    if (useGemini) {
      try {
        console.log(`[StudyNotes] Generating study notes for: "${milestone.title}" via Gemini API`);
        notes = await callGeminiAPI(prompt, "text/plain", userId, "/pathfinder/study-notes");
      } catch (gemErr) {
        console.error(`[StudyNotes] Gemini API failed (${gemErr.message}). Falling back to Ollama...`);
        geminiFailed = true;
      }
    }
    
    if (!useGemini || geminiFailed) {
      console.log(`[StudyNotes] Generating study notes for: "${milestone.title}" via Ollama ${OLLAMA_MODEL}`);
      notes = await ollamaGenerate(prompt, "text", userId, "/pathfinder/study-notes");
    }
    
    return notes.trim();
  } catch (err) {
    console.error(`[StudyNotes] AI study notes generation failed: ${err.message}`);
    return `## ${milestone.title || "Study Notes"}\n\n### 🎯 What You'll Learn\n${milestone.description || "Core concepts for this milestone."}\n\n### 📚 Key Points\n${(milestone.keyPoints || ["Study the fundamentals", "Practice regularly", "Build small projects"]).map(p => `- ${p}`).join("\n")}\n\n### ⚡ Quick Practice\nResearch this topic on YouTube and take notes on what surprises you most.`;
  }
}

/**
 * Generates both highly structured study notes and conceptual multiple-choice quiz questions
 * in a single LLM API prompt, returning a structured JSON response.
 */
export async function generateStudyNotesAndQuiz(topic, milestone, answers = [], noteStyle = 'smart', videoDetails = {}, userId = null) {
  const { videoId, videoTitle, videoDuration, isDeveloper, completedMilestones, difficulty, devGoal } = videoDetails;

  const userReason = answers.find(a => a.question.toLowerCase().includes("why"))?.answer || "learning";
  const userGoal = answers.find(a => a.question.toLowerCase().includes("success"))?.answer || "mastery";

  // 1. Fetch transcript if videoId is provided
  let transcriptText = "";
  let transcriptList = [];
  if (videoId) {
    try {
      console.log(`[NotesAndQuiz] Fetching transcript for: "${videoTitle || milestone.title}" (${videoId})`);
      transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
      transcriptText = transcriptList.map(t => t.text).join(" ");
    } catch (err) {
      console.warn(`[NotesAndQuiz] Failed to fetch transcript:`, err.message);
    }
  }

  const parsedDuration = Number(videoDuration) || 300;
  const numInVideoQuestions = Math.min(20, Math.max(1, Math.round(parsedDuration / 200)));
  const segments = getTranscriptSegments(transcriptList, parsedDuration, numInVideoQuestions, videoTitle || milestone.title);
  
  const segmentsText = segments.map((seg, idx) => 
    `Segment ${idx + 1} (target timestamp: ${seg.timestamp}s, context range ${seg.timestamp - 90}s to ${seg.timestamp}s):\n"${seg.text}"`
  ).join("\n\n");

  // 2. Prepare goal steering and difficulty steering
  let goalSteering = "";
  if (devGoal === "Job") {
    goalSteering = `Prioritize interview readiness and real-world implementation.`;
  } else if (devGoal === "School / College") {
    goalSteering = `Prioritize academic understanding and definitions/theory.`;
  } else {
    goalSteering = `Prioritize practical understanding and real-world applications.`;
  }

  let completedList = "";
  if (completedMilestones && completedMilestones.length > 0) {
    completedList = `Here are the concepts the user has ALREADY studied in previous roadmap nodes:\n${completedMilestones.map(m => `- ${m}`).join("\n")}`;
  }

  // Notes prompt part based on noteStyle
  let notesGuidelines = "";
  if (noteStyle === 'basic') {
    notesGuidelines = `
Your study guide MUST follow this exact Markdown structure:
# ${milestone.title}

## 🎯 What You'll Learn & Why It Matters
Explain the purpose of this milestone in depth. Relate it directly to the user's reason for learning: "${userReason}".

## 🔍 Core Concepts Explained
Provide an exhaustive breakdown of the sub-topics under this milestone. Explain the underlying rules, mechanics, and terminology.

## 📋 Comparison Matrix
Include a clear Markdown table comparing key aspects, options, or dimensions under this milestone.

## 💻 Practical Demonstration & Examples
Provide clear "Common Pitfall" vs "Best Practice" code blocks or misconceptions.

## 💼 Core Interview Questions
Identify 3-4 actual, high-quality questions related to this milestone, with Ideal Answer and Under-The-Hood Explanation.

## ⚡ Interactive Practice & Exercises
Provide 2 small exercises or mental puzzles with answers hidden below.
`;
  } else {
    notesGuidelines = `
Dynamically construct a "Smart Study Guide" based on these rules:
- Conceptual: Explain deep ideas and underlying understanding.
- Practical: Add real-world usage and implementation examples with code/actions.
- Visual: Use flows and visual formatting (e.g., markdown mermaid flowcharts/diagrams if helpful).
- Memorization: Add summaries and cheat-sheet style lists.
- Logic/Sequences/Steps: Add step-by-step numbered breakdowns.
- Comparisons: Always include a comparison matrix/table.
- Real-world examples: Add industry-specific use-cases.
- Interview relevant: Include deep interview questions and under-the-hood explanations.
- Exercises: Include interactive practice problems.
`;
  }

  const prompt = `You are a world-class technical educator, interviewer, and quiz generator for the Kaevrix educational platform.
Your task is to generate BOTH:
1. Exhaustive, high-fidelity study notes formatted in beautiful Markdown.
2. A comprehensive conceptual multiple-choice quiz (postVideoQuestions and inVideoQuestions) based on the content of the video and the study topics.

VIDEO DETAILS:
Title: "${videoTitle || milestone.title}"
${transcriptText ? `Transcript Summary:\n"""\n${transcriptText.substring(0, 5000)}\n"""` : "(No transcript available)"}

IN-VIDEO TRANSCRIPT SEGMENTS:
${segmentsText || "(No transcript segments available)"}

MILESTONE DETAILS:
Topic: ${topic}
Milestone: ${milestone.title}
Description: ${milestone.description || ""}
Key Points: ${(milestone.keyPoints || []).join(", ")}
User's Reason for learning: ${userReason}
User's 3-month success target: ${userGoal}

${goalSteering}
${completedList}

INSTRUCTIONS FOR STUDY NOTES:
- Generate a detailed study guide following these rules:
${notesGuidelines}
- Format the notes in clean, beautiful Markdown.

INSTRUCTIONS FOR QUIZ QUESTIONS:
- All questions MUST be multiple-choice conceptual questions. Do NOT generate coding challenges or any question with type "coding" where the user has to write code.
- Structure each question in postVideoQuestions as:
  {
    "type": "conceptual",
    "title": "Short title",
    "question": "Conceptual multiple-choice question text?",
    "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
    "answerIndex": 0,
    "explanation": "Detailed technical explanation.",
    "points": 100
  }
- Structure each question in inVideoQuestions as:
  {
    "question": "Pop quiz question testing segment details?",
    "options": ["Opt 0", "Opt 1", "Opt 2", "Opt 3"],
    "answerIndex": 1,
    "points": 50
  }
- Generate exactly 5 conceptual questions for postVideoQuestions.
- Generate exactly ${numInVideoQuestions} inVideoQuestions matching the video segments.

FORMAT SPECIFICATION:
Respond ONLY with a valid JSON object matching the format below. Do not wrap the JSON in markdown blocks (like \`\`\`json).
{
  "notes": "The complete markdown formatted study guide text string goes here. Use newlines (\\n) and proper markdown escape sequences.",
  "postVideoQuestions": [
    // exactly 5 conceptual questions
  ],
  "inVideoQuestions": [
    // exactly ${numInVideoQuestions} in-video questions
  ]
}`;

  dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
  const apiKey = process.env.GEMINI_API_KEY;
  const useGemini = apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE";

  try {
    let resultText = "";
    let geminiFailed = false;

    if (useGemini) {
      try {
        console.log(`[NotesAndQuiz] Generating notes and quiz via Gemini API`);
        resultText = await callGeminiAPI(prompt, "application/json", userId, "/pathfinder/study-notes-and-quiz");
      } catch (gemErr) {
        console.error(`[NotesAndQuiz] Gemini API failed (${gemErr.message}). Falling back to Ollama...`);
        geminiFailed = true;
      }
    }
    
    if (!useGemini || geminiFailed) {
      console.log(`[NotesAndQuiz] Generating notes and quiz via Ollama ${OLLAMA_MODEL}`);
      resultText = await ollamaGenerate(prompt, "json", userId, "/pathfinder/study-notes-and-quiz");
    }

    // Try parsing the combined JSON response
    let cleanedText = resultText.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }
    const parsed = JSON.parse(cleanedText);
    
    // Ensure all postVideoQuestions are marked conceptual and have valid keys
    if (parsed.postVideoQuestions && Array.isArray(parsed.postVideoQuestions)) {
      parsed.postVideoQuestions = parsed.postVideoQuestions.map(q => ({
        type: "conceptual",
        title: q.title || "Conceptual Question",
        question: q.question || "Conceptual multiple-choice question?",
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
        answerIndex: typeof q.answerIndex === "number" ? q.answerIndex : 0,
        explanation: q.explanation || "Detailed technical explanation.",
        points: typeof q.points === "number" ? q.points : 100
      }));
    }

    // Ensure all inVideoQuestions have valid keys
    if (parsed.inVideoQuestions && Array.isArray(parsed.inVideoQuestions)) {
      parsed.inVideoQuestions = parsed.inVideoQuestions.map(q => ({
        question: q.question || "Pop quiz question testing segment details?",
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["Opt A", "Opt B", "Opt C", "Opt D"],
        answerIndex: typeof q.answerIndex === "number" ? q.answerIndex : 0,
        points: typeof q.points === "number" ? q.points : 50
      }));
    }

    return {
      notes: parsed.notes || `## ${milestone.title}\n\nNotes generated successfully.`,
      postVideoQuestions: parsed.postVideoQuestions || [],
      inVideoQuestions: parsed.inVideoQuestions || []
    };
  } catch (err) {
    console.error(`[NotesAndQuiz] AI combined generation failed: ${err.message}`);
    throw err;
  }
}

/**
 * Generates a mock quiz based on the video title as a fallback.
 */
function generateFallbackQuiz(title, duration = 300) {
  const parsedDuration = Number(duration) || 300;
  const normalizedTitle = title.toLowerCase();
  let postVideoQuestions = [];
  
  // Topic: JavaScript/Web Development
  if (normalizedTitle.includes("javascript") || normalizedTitle.includes("js") || normalizedTitle.includes("react") || normalizedTitle.includes("html") || normalizedTitle.includes("web dev") || normalizedTitle.includes("coding")) {
    postVideoQuestions = [
      {
        question: "What is the primary purpose of JavaScript in web development?",
        options: ["To style the layout and colors", "To add interactivity and dynamic behavior", "To store physical database files", "To configure server operating systems"],
        answerIndex: 1,
        points: 100
      },
      {
        question: "Which keyword is used to declare a block-scoped variable in modern JavaScript?",
        options: ["var", "define", "let", "global"],
        answerIndex: 2,
        points: 100
      },
      {
        question: "In React, what hook is commonly used to manage local state within a component?",
        options: ["useEffect", "useContext", "useState", "useReducer"],
        answerIndex: 2,
        points: 100
      },
      {
        question: "Which of the following is NOT a JavaScript data type?",
        options: ["String", "Float", "Boolean", "Undefined"],
        answerIndex: 1,
        points: 100
      },
      {
        question: "What does the DOM stand for in web technologies?",
        options: ["Document Object Model", "Digital Order Module", "Direct Output Mechanism", "Data Object Monitor"],
        answerIndex: 0,
        points: 100
      }
    ];
  }
  // Topic: Python / General Programming
  else if (normalizedTitle.includes("python") || normalizedTitle.includes("java") || normalizedTitle.includes("c++") || normalizedTitle.includes("programming") || normalizedTitle.includes("tutorial")) {
    postVideoQuestions = [
      {
        question: "What is the correct file extension for Python source files?",
        options: [".pt", ".py", ".pyt", ".python"],
        answerIndex: 1,
        points: 100
      },
      {
        question: "How do you start a comment in Python code?",
        options: ["// comment", "/* comment */", "# comment", "<!-- comment -->"],
        answerIndex: 2,
        points: 100
      },
      {
        question: "What is the output of len([1, 2, 3]) in Python?",
        options: ["2", "3", "4", "An error is thrown"],
        answerIndex: 1,
        points: 100
      },
      {
        question: "Which data structure in Python is ordered, mutable, and allows duplicate elements?",
        options: ["List", "Set", "Tuple", "Dictionary"],
        answerIndex: 0,
        points: 100
      },
      {
        question: "What is the purpose of the 'git' system?",
        options: ["Writing documentation", "Compiling machine code", "Version control tracking of changes", "Deploying website hosting"],
        answerIndex: 2,
        points: 100
      }
    ];
  }
  // Topic: Science / Physics / Space / Nature
  else if (normalizedTitle.includes("science") || normalizedTitle.includes("space") || normalizedTitle.includes("quantum") || normalizedTitle.includes("physics") || normalizedTitle.includes("earth") || normalizedTitle.includes("nature")) {
    postVideoQuestions = [
      {
        question: "What is the approximate speed of light in a vacuum?",
        options: ["300,000 km/s", "150,000 km/s", "1,000,000 km/s", "10,000 km/s"],
        answerIndex: 0,
        points: 100
      },
      {
        question: "Which planet in our solar system is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        answerIndex: 1,
        points: 100
      },
      {
        question: "What is the chemical symbol for water?",
        options: ["O2", "CO2", "H2O", "HO2"],
        answerIndex: 2,
        points: 100
      },
      {
        question: "What force holds galaxies together and keeps planets in orbit?",
        options: ["Electromagnetism", "Friction", "Gravity", "Strong nuclear force"],
        answerIndex: 2,
        points: 100
      },
      {
        question: "What is the name of our home galaxy?",
        options: ["Andromeda", "The Milky Way", "Sombrero Galaxy", "Triangulum"],
        answerIndex: 1,
        points: 100
      }
    ];
  }
  // Topic: Gaming / Video Games
  else if (normalizedTitle.includes("game") || normalizedTitle.includes("gaming") || normalizedTitle.includes("minecraft") || normalizedTitle.includes("fortnite") || normalizedTitle.includes("zelda") || normalizedTitle.includes("gta")) {
    postVideoQuestions = [
      {
        question: "Which of the following is considered the best-selling video game of all time?",
        options: ["Tetris", "Grand Theft Auto V", "Minecraft", "Super Mario Bros."],
        answerIndex: 2,
        points: 100
      },
      {
        question: "What is the primary developer of the Mario and Zelda franchises?",
        options: ["Sony Interactive", "Nintendo", "Sega", "Ubisoft"],
        answerIndex: 1,
        points: 100
      },
      {
        question: "In gaming, what does 'NPC' stand for?",
        options: ["New Player Character", "Non-Player Character", "Net Play Controller", "Neutral Power Center"],
        answerIndex: 1,
        points: 100
      },
      {
        question: "Which console was released by Sony in the year 2020?",
        options: ["PlayStation 4 Pro", "PlayStation 5", "Xbox Series X", "PlayStation Portal"],
        answerIndex: 1,
        points: 100
      },
      {
        question: "What is the name of the main block-building protagonist in Minecraft?",
        options: ["Alex", "Steve", "notch", "Creeper"],
        answerIndex: 1,
        points: 100
      }
    ];
  }
  // Generic Fallback (suitable for any video)
  else {
    postVideoQuestions = [
      {
        question: `What is the primary topic of the video: "${title}"?`,
        options: [
          "A scientific overview of historical events",
          "A detailed review, explanation, or presentation of the subject matter",
          "A fictional short story depicting space travel",
          "An advertisement promoting an energy drink brand"
        ],
        answerIndex: 1,
        points: 100
      },
      {
        question: "Which of the following is a good strategy to retain information from this video?",
        options: [
          "Playing it in the background at 4x speed while sleeping",
          "Active listening, taking notes, and answering follow-up questions",
          "Immediately closing the browser tab after 10 seconds",
          "Muting the volume and staring at the wall"
        ],
        answerIndex: 1,
        points: 100
      },
      {
        question: "If a viewer has doubts about a claim made in the video, what is the best next step?",
        options: [
          "Accept it blindly without any further questioning",
          "Cross-reference the information with peer-reviewed sources or trusted documentation",
          "Write an angry comment in all capital letters",
          "Never watch videos on the internet again"
        ],
        answerIndex: 1,
        points: 100
      },
      {
        question: "What makes digital video formats (like YouTube) effective for modern learning?",
        options: [
          "They completely replace teachers and books forever",
          "They allow visual demonstration, self-paced pausing, and easy repeating",
          "They consume high bandwidth and deplete device batteries",
          "They guarantee a 100% grade in all college exams"
        ],
        answerIndex: 1,
        points: 100
      },
      {
        question: "In an online educational duel, what is the most honorable way to win?",
        options: [
          "Guessing randomly as fast as possible",
          "Watching the video carefully, understanding it, and answering accurately",
          "Hacking the website database to inject score points",
          "Distracting the opponent by spamming the chat panel"
        ],
        answerIndex: 1,
        points: 100
      }
    ];
  }

  // Generate in-video questions dynamically based on duration (minimum 1)
  const numInVideoQuestions = Math.min(20, Math.max(1, Math.round(parsedDuration / 200)));
  const halfDuration = parsedDuration / 2;
  const endLimit = parsedDuration - Math.min(30, parsedDuration * 0.15); // Leave at least 15% or 30s at the end
  
  const inVideoQuestions = [];
  for (let i = 0; i < numInVideoQuestions; i++) {
    let timestamp;
    if (numInVideoQuestions === 1) {
      timestamp = Math.round((halfDuration + endLimit) / 2);
    } else {
      timestamp = Math.round(halfDuration + i * ((endLimit - halfDuration) / (numInVideoQuestions - 1)));
    }
    timestamp = Math.max(1, Math.min(parsedDuration - 2, timestamp));

    inVideoQuestions.push({
      question: `Segment Pop Quiz ${i + 1}: Based on the information presented leading up to the ${Math.floor(timestamp / 60)}m ${timestamp % 60}s mark, what is the correct takeaway?`,
      options: [
        "Pay active attention to the key points and explanation details",
        "Assume the narrator is incorrect and skip to the end",
        "Answer as fast as possible without reading the question text",
        "Rely solely on luck and select the last option"
      ],
      answerIndex: 0,
      points: 50,
      timestamp
    });
  }

  return {
    postVideoQuestions,
    inVideoQuestions,
    captions: []
  };
}

/**
 * Helper to segment the transcript to get context for pop quizzes
 */
function getTranscriptSegments(transcriptList, duration, numQuestions, title) {
  const parsedDuration = Number(duration) || 300;
  if (!transcriptList || transcriptList.length === 0) return [];
  
  const halfDuration = parsedDuration / 2;
  const endLimit = parsedDuration - Math.min(30, parsedDuration * 0.15);
  const segments = [];
  
  for (let i = 0; i < numQuestions; i++) {
    let timestamp;
    if (numQuestions === 1) {
      timestamp = Math.round((halfDuration + endLimit) / 2);
    } else {
      timestamp = Math.round(halfDuration + i * ((endLimit - halfDuration) / (numQuestions - 1)));
    }
    timestamp = Math.max(1, Math.min(parsedDuration - 2, timestamp));
    
    const windowStart = Math.max(0, timestamp - 90);
    const windowEnd = timestamp;
    
    // Filter transcript items in this window (YoutubeTranscript offset is in ms)
    const itemsInWindow = transcriptList.filter(item => {
      const offsetSec = item.offset > 1000 ? item.offset / 1000 : item.offset;
      return offsetSec >= windowStart && offsetSec <= windowEnd;
    });
    
    const segmentText = itemsInWindow.map(item => item.text).join(" ");
    segments.push({
      timestamp,
      text: segmentText || `Discussing details related to "${title}" leading up to this segment.`
    });
  }
  
  return segments;
}

function checkIsDeveloper(title, topic, why) {
  const text = `${title || ""} ${topic || ""} ${why || ""}`.toLowerCase();
  const devKeywords = [
    "developer", "engineer", "programming", "coding", "software", "web dev",
    "frontend", "backend", "fullstack", "full stack", "javascript", "python",
    "react", "node", "java", "c++", "c#", "rust", "go language", "golang", "devops",
    "data science", "machine learning", "database", "sql", "html", "css", "git", "leet", "leetcode", "hacker", "hackerrank"
  ];
  return devKeywords.some(keyword => text.includes(keyword));
}

function generateFallbackDevQuiz(title, duration = 300) {
  const parsedDuration = Number(duration) || 300;
  
  const postVideoQuestions = [
    {
      type: "coding",
      title: "Reverse a String",
      difficulty: "Easy",
      question: "Write a function `solve(str)` that takes a string `str` and returns the string reversed.\n\n### Examples:\n- `solve(\"hello\")` should return `\"olleh\"`\n- `solve(\"world\")` should return `\"dlrow\"`",
      starterCode: "function solve(str) {\n  // Write your code here\n  \n}",
      testCases: [
        { input: JSON.stringify("hello"), expected: JSON.stringify("olleh") },
        { input: JSON.stringify("world"), expected: JSON.stringify("dlrow") },
        { input: JSON.stringify(""), expected: JSON.stringify("") }
      ],
      solution: "function solve(str) { return str.split('').reverse().join(''); }",
      points: 100
    },
    {
      type: "coding",
      title: "Sum of Array Elements",
      difficulty: "Easy",
      question: "Write a function `solve(arr)` that takes an array of numbers and returns the sum of all elements.\n\n### Examples:\n- `solve([1, 2, 3])` should return `6`\n- `solve([-1, 5])` should return `4`",
      starterCode: "function solve(arr) {\n  // Write your code here\n  \n}",
      testCases: [
        { input: JSON.stringify([1, 2, 3]), expected: JSON.stringify(6) },
        { input: JSON.stringify([-1, 5]), expected: JSON.stringify(4) },
        { input: JSON.stringify([]), expected: JSON.stringify(0) }
      ],
      solution: "function solve(arr) { return arr.reduce((a, b) => a + b, 0); }",
      points: 100
    },
    {
      type: "conceptual",
      title: "Scope in JavaScript",
      question: "Which of the following keywords declares a block-scoped local variable in modern JavaScript?",
      options: ["var", "let", "define", "global"],
      answerIndex: 1,
      explanation: "The `let` and `const` keywords declare variables that are block-scoped, meaning they are only accessible within the block in which they are defined. `var` is function-scoped.",
      points: 100
    },
    {
      type: "coding",
      title: "Check Even Number",
      difficulty: "Easy",
      question: "Write a function `solve(n)` that returns `true` if the integer `n` is even, and `false` if it is odd.\n\n### Examples:\n- `solve(4)` should return `true`\n- `solve(7)` should return `false`",
      starterCode: "function solve(n) {\n  // Write your code here\n  \n}",
      testCases: [
        { input: "4", expected: "true" },
        { input: "7", expected: "false" },
        { input: "0", expected: "true" }
      ],
      solution: "function solve(n) { return n % 2 === 0; }",
      points: 100
    },
    {
      type: "conceptual",
      title: "Promises and Async/Await",
      question: "What does an `async` function always return in JavaScript?",
      options: ["A Promise", "The resolved value", "undefined", "A callback function"],
      answerIndex: 0,
      explanation: "An async function always returns a Promise. If the function returns a value, the Promise is resolved with that value. If it throws an error, the Promise is rejected with that error.",
      points: 100
    }
  ];

  // Generate in-video questions dynamically based on duration (minimum 1)
  const numInVideoQuestions = Math.min(20, Math.max(1, Math.round(parsedDuration / 200)));
  const halfDuration = parsedDuration / 2;
  const endLimit = parsedDuration - Math.min(30, parsedDuration * 0.15);
  
  const inVideoQuestions = [];
  for (let i = 0; i < numInVideoQuestions; i++) {
    let timestamp;
    if (numInVideoQuestions === 1) {
      timestamp = Math.round((halfDuration + endLimit) / 2);
    } else {
      timestamp = Math.round(halfDuration + i * ((endLimit - halfDuration) / (numInVideoQuestions - 1)));
    }
    timestamp = Math.max(1, Math.min(parsedDuration - 2, timestamp));

    inVideoQuestions.push({
      question: `Segment Pop Quiz ${i + 1}: Based on the information presented leading up to the ${Math.floor(timestamp / 60)}m ${timestamp % 60}s mark, what is the correct takeaway?`,
      options: [
        "Pay active attention to the key points and explanation details",
        "Assume the narrator is incorrect and skip to the end",
        "Answer as fast as possible without reading the question text",
        "Rely solely on luck and select the last option"
      ],
      answerIndex: 0,
      points: 50,
      timestamp
    });
  }

  return {
    postVideoQuestions,
    inVideoQuestions,
    captions: []
  };
}

/**
 * Generates quiz questions for a video (both post-video and in-video pop quizzes).
 * It first tries to fetch the transcript, then calls Ollama (gemma4:e4b) to create the quiz.
 * Falls back to Gemini API or smart default questions if necessary.
 */
export async function generateQuizForVideo(videoId, title, duration = 300, topic = "", why = "", isDeveloper = false, completedMilestones = [], difficulty = "Medium", devGoal = "", userId = null) {
  const parsedDuration = Number(duration) || 300;
  
  // Detect developer topic
  const isDev = isDeveloper || checkIsDeveloper(title, topic, why);
  
  // 1. Try to fetch video transcript
  let transcriptText = "";
  let transcriptList = [];
  if (videoId) {
    try {
      console.log(`[Transcript] Fetching transcript for video: "${title}" (${videoId})`);
      transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
      transcriptText = transcriptList.map(t => t.text).join(" ");
      console.log(`[Transcript] Successfully fetched transcript of length ${transcriptText.length} characters.`);
    } catch (err) {
      console.warn(`[Transcript] Failed to fetch transcript for video "${title}" (${videoId}):`, err.message);
    }
  }

  // Calculate dynamic count of in-video questions (minimum 1)
  const numInVideoQuestions = Math.min(20, Math.max(1, Math.round(parsedDuration / 200)));
  const segments = getTranscriptSegments(transcriptList, parsedDuration, numInVideoQuestions, title);
  
  const segmentsText = segments.map((seg, idx) => 
    `Segment ${idx + 1} (target timestamp: ${seg.timestamp}s, transcript context range ${seg.timestamp - 90}s to ${seg.timestamp}s):\n"${seg.text}"`
  ).join("\n\n");

  // 2. Formulate the quiz prompt
  let prompt = "";
  if (isDev) {
    let completedList = "";
    if (completedMilestones && completedMilestones.length > 0) {
      completedList = `Here are the concepts the user has ALREADY studied/completed in previous roadmap nodes:
${completedMilestones.map(m => `- ${m}`).join("\n")}`;
    }

    let goalSteering = "";
    if (devGoal === "Job") {
      goalSteering = `Prioritize interview readiness and real-world implementation.
Favor: Coding challenges, Debugging, Feature building, Code review, Modification tasks.
Generate questions similar to those encountered in junior developer interviews and take-home assignments.`;
    } else if (devGoal === "School / College") {
      goalSteering = `Prioritize academic understanding.
Favor: Concepts, Definitions, Theory, Explanations, Exam-style questions.`;
    } else if (devGoal === "Knowledge" || !devGoal) {
      goalSteering = `Prioritize practical understanding and curiosity.
Favor: Understanding why things work, Real-world usage, Practical applications.
Avoid excessive interview-style difficulty.`;
    }

    let difficultySteering = "";
    if (difficulty === "Hell") {
      difficultySteering = `HELL MODE CONSTRAINTS:
1. Verify capability, not completion: Do NOT verify if they watched the video. Test if they can DO the thing. Build a component, write a function, debug this snippet. Do not ask "What did the instructor say about X".
2. Question Count: Generate the minimum number of questions required to verify mastery. Do not force exactly 5. It can be 4, 8, 12, etc. Do not generate repetitive questions. Every question must test a unique skill.
3. Category Prioritization: The seven categories (Concept, Interview, Coding, Debugging, Code Review, Feature Building, Modification Tasks) are available. Use ONLY categories that are relevant to the topic. Prioritize categories that best verify mastery.
4. Spaced Repetition (Crucial): Provide a mix of questions: 70% testing the Current Topic, 20% testing Previous Topics (from the completed milestones list), and 10% Integrated Topics combining current and past knowledge.`;
    } else {
      difficultySteering = `STANDARD MODE CONSTRAINTS:
Generate EXACTLY 5 questions for the END of the video. Focus on the core basics covered in the video.`;
    }

    prompt = `You are an expert technical interviewer and quiz generator for the Kaevrix platform.
Your task is to generate a comprehensive developer-centric assessment (postVideoQuestions) and some short pop quizzes (inVideoQuestions).

${goalSteering}

${difficultySteering}

${completedList}

VIDEO DETAILS:
Title: "${title}"
${transcriptText ? `Transcript Summary:\n"""\n${transcriptText.substring(0, 5000)}\n"""` : "(No transcript available)"}

IN-VIDEO TRANSCRIPT SEGMENTS:
${segmentsText || "(No transcript segments available)"}

Instructions for postVideoQuestions:
- All questions MUST be multiple-choice conceptual questions. Do NOT generate coding challenges or any question with type "coding" where the user has to write code.
- For all questions, structure the JSON object as:
  {
    "type": "conceptual",
    "title": "Short title",
    "question": "Conceptual multiple-choice question text?",
    "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
    "answerIndex": 0,
    "explanation": "Detailed technical explanation.",
    "points": 100
  }

Format specification:
Respond ONLY with a valid JSON object matching the format below. Do not include markdown blocks.
{
  "postVideoQuestions": [
    // Array of questions. Length is dynamic based on difficulty mode.
  ],
  "inVideoQuestions": [
    {
      "question": "Pop quiz question?",
      "options": ["Opt 0", "Opt 1", "Opt 2", "Opt 3"],
      "answerIndex": 1,
      "points": 50
    }
  ]
}`;
  } else {
    prompt = `You are an expert quiz generator for the Kaevrix educational platform.
Your task is to generate a comprehensive quiz consisting of two parts based on the content of a YouTube video:
1. exactly 5 general multiple choice questions for the END of the video (postVideoQuestions).
2. exactly ${numInVideoQuestions} in-video pop quiz questions (inVideoQuestions), each testing details presented in the corresponding segment transcript below.

VIDEO DETAILS:
Title: "${title}"
${transcriptText ? `Transcript Summary:\n"""\n${transcriptText.substring(0, 5000)}\n"""` : "(No transcript available)"}

IN-VIDEO TRANSCRIPT SEGMENTS:
${segmentsText || "(No transcript segments available)"}

Instructions:
1. Generate exactly 5 post-video questions.
2. Generate exactly ${numInVideoQuestions} in-video questions.
3. For each in-video question, it MUST test the viewer's memory or understanding of the events/concepts discussed in its corresponding Segment.
4. Each question must have exactly 4 options.
5. Respond ONLY with a valid JSON object matching the format below. Do not include markdown code blocks, backticks, or any conversational text.

Format specification:
{
  "postVideoQuestions": [
    {
      "question": "The post-video question text here?",
      "options": ["Option 0 text", "Option 1 text", "Option 2 text", "Option 3 text"],
      "answerIndex": 0, // integer index (0, 1, 2, or 3) of the correct option
      "points": 100
    }
  ],
  "inVideoQuestions": [
    {
      "question": "The segment-specific in-video question text here?",
      "options": ["Option 0 text", "Option 1 text", "Option 2 text", "Option 3 text"],
      "answerIndex": 1, // integer index of correct option
      "points": 50
    }
  ]
}
`;
  }

  const validateQuizData = (data) => {
    if (!data || typeof data !== "object") {
      throw new Error("Returned content is not a valid quiz object");
    }
    const postVideo = Array.isArray(data.postVideoQuestions) ? data.postVideoQuestions : [];
    const inVideo = Array.isArray(data.inVideoQuestions) ? data.inVideoQuestions : [];
    
    if (postVideo.length === 0) {
      throw new Error(`Expected at least 1 post-video question, got 0`);
    }
    if (inVideo.length === 0) {
      console.warn("No in-video questions generated. Ignoring validation failure.");
    }
    
    const validatedPostVideo = postVideo.map((q) => {
      if (q.type === "coding") {
        return {
          type: "coding",
          title: q.title || "Coding Challenge",
          difficulty: q.difficulty || "Medium",
          question: q.question || q.description || "Solve this coding problem.",
          starterCode: q.starterCode || "function solve(input) {\n  // Write code here\n}",
          testCases: Array.isArray(q.testCases) ? q.testCases.map(tc => ({
            input: typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input),
            expected: typeof tc.expected === "string" ? tc.expected : JSON.stringify(tc.expected)
          })) : [
            { input: "1", expected: "1" }
          ],
          solution: q.solution || "",
          points: q.points || 100
        };
      } else {
        return {
          type: "conceptual",
          title: q.title || "Conceptual Question",
          question: q.question || q.question || "Trivia Question",
          options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
          answerIndex: typeof q.answerIndex === "number" && q.answerIndex >= 0 && q.answerIndex <= 3 ? q.answerIndex : 0,
          explanation: q.explanation || "No explanation provided.",
          points: q.points || 100
        };
      }
    });
    
    // Inject programmatic timestamps to guarantee alignment
    const validatedInVideo = inVideo.map((q, idx) => ({
      question: q.question || `Pop Quiz from Video Segment`,
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
      answerIndex: typeof q.answerIndex === "number" && q.answerIndex >= 0 && q.answerIndex <= 3 ? q.answerIndex : 0,
      points: q.points || 50,
      timestamp: segments[idx] ? segments[idx].timestamp : Math.round((parsedDuration / 2) + idx * (parsedDuration / 2 / numInVideoQuestions))
    }));
    
    return {
      postVideoQuestions: validatedPostVideo,
      inVideoQuestions: validatedInVideo
    };
  };

  dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
  const apiKey = process.env.GEMINI_API_KEY;
  const useGemini = apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE";
  let geminiFailed = false;

  // 3. Try Gemini API primary generator
  if (useGemini) {
    try {
      console.log(`[Gemini Quiz Generator] Generating quiz via Gemini API for video: "${title}"`);
      const responseText = await callGeminiAPI(prompt, "application/json", userId, "/quiz/generate");
      const quizData = JSON.parse(responseText.trim());
      const validated = validateQuizData(quizData);
      return { ...validated, captions: transcriptList };
    } catch (geminiErr) {
      console.warn(`[Gemini Quiz Generator] Gemini API failed: ${geminiErr.message}. Trying Ollama as fallback...`);
      geminiFailed = true;
    }
  }

  // 4. Try Ollama (gemma4:e4b) fallback generator
  if (!useGemini || geminiFailed) {
    try {
      console.log(`[Ollama Quiz Generator] Generating quiz via Ollama ${OLLAMA_MODEL} for video: "${title}"`);
      const responseText = await ollamaGenerate(prompt, "json", userId, "/quiz/generate");
      const quizData = JSON.parse(responseText.trim());
      const validated = validateQuizData(quizData);
      return { ...validated, captions: transcriptList };
    } catch (ollamaErr) {
      console.warn(`[Ollama Quiz Generator] Ollama failed: ${ollamaErr.message}. Both Ollama and Gemini APIs failed.`);
    }
  }

  // 5. Fallback to pre-defined quiz templates if AI engines fail
  console.log(`[Quiz Generator Fallback] Using fallback quiz template for: "${title}"`);
  try {
    const rawFallback = isDev 
      ? generateFallbackDevQuiz(title, parsedDuration)
      : generateFallbackQuiz(title, parsedDuration);
    const validated = validateQuizData(rawFallback);
    return { ...validated, captions: transcriptList || [] };
  } catch (fallbackErr) {
    console.error(`[Quiz Generator] Fallback quiz generation failed: ${fallbackErr.message}`);
    throw new Error("Failed to generate quiz: Both local and remote AI engines failed.");
  }
}

/**
 * Generates custom Boss Battle questions, boss type, and intro dialog JIT.
 * Prioritizes local Ollama gemma4:e4b, falling back to Gemini API or a high-quality template.
 */
export async function generateBossQuestions(topic, milestone, userId = null) {
  const mTitle = milestone?.title || "Core Concepts";
  const mPoints = (milestone?.keyPoints || []).join(", ");
  const mDesc = milestone?.description || "";
  
  const prompt = `You are a game systems designer for the Kaevrix platform.
The user is challenging a Milestone Boss in the topic "${topic}".
Milestone: "${mTitle}"
Description: "${mDesc}"
Key Subtopics: ${mPoints}

Your task: Generate an epic boss battle setup. Choose one fitting boss type from this list:
- "Callback Demon" (for async, callbacks, network, promises, threads)
- "Scope Warden" (for variables, memory, closures, references, parameters)
- "DOM Destroyer" (for UI, HTML, CSS, frontend, DOM, events)
- "Syntax Sentinel" (for basics, loops, conditionals, parsing, basic syntax)
- "Garbage Collector" (for memory management, object lifecycle, OOP, class internals)

Generate exactly 5 advanced, conceptual multiple-choice questions about the key subtopics of this milestone. The questions should be challenging but fair.

Return ONLY a valid JSON object matching the format below. Do not include markdown code blocks, backticks, or any conversational text.

Format specification:
{
  "bossType": "Callback Demon", // One of: Callback Demon | Scope Warden | DOM Destroyer | Syntax Sentinel | Garbage Collector
  "bossIntro": "A short, epic, retro-style fighting game boss threat/quote tailored to the topic (e.g. 'I will garbage-collect your soul!')",
  "questions": [
    {
      "question": "The advanced conceptual question text here?",
      "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
      "answerIndex": 0,
      "damageExplanation": "A short, punchy 1-2 sentence explanation of the correct mechanism to teach the user if they miss."
    }
  ]
}
`;

  const validateBossData = (data) => {
    if (!data || typeof data !== "object") {
      throw new Error("Returned content is not a valid boss object");
    }
    const qList = Array.isArray(data.questions) ? data.questions : [];
    if (qList.length !== 5) {
      throw new Error(`Expected exactly 5 questions, got ${qList.length}`);
    }
    const validBossTypes = ["Callback Demon", "Scope Warden", "DOM Destroyer", "Syntax Sentinel", "Garbage Collector"];
    const bossType = validBossTypes.includes(data.bossType) ? data.bossType : "Syntax Sentinel";
    const bossIntro = data.bossIntro || "Foolish mortal! You think your code compiles here?";
    
    const validatedQuestions = qList.map((q) => ({
      question: q.question || "Conceptual Challenge Question",
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
      answerIndex: typeof q.answerIndex === "number" && q.answerIndex >= 0 && q.answerIndex <= 3 ? q.answerIndex : 0,
      damageExplanation: q.damageExplanation || "Make sure to review the core rules of this node."
    }));
    
    return { bossType, bossIntro, questions: validatedQuestions };
  };

  dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
  const apiKey = process.env.GEMINI_API_KEY;
  const useGemini = apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE";
  let geminiFailed = false;

  // 1. Try Gemini API primary generator
  if (useGemini) {
    try {
      console.log(`[Gemini Boss Generator] Generating boss questions via Gemini API for milestone: "${mTitle}"`);
      const responseText = await callGeminiAPI(prompt, "application/json", userId, "/boss/generate");
      const bossData = JSON.parse(responseText.trim());
      return validateBossData(bossData);
    } catch (geminiErr) {
      console.warn(`[Gemini Boss Generator] Gemini API failed: ${geminiErr.message}. Trying Ollama as fallback...`);
      geminiFailed = true;
    }
  }

  // 2. Try Ollama (gemma4:e4b) fallback generator
  if (!useGemini || geminiFailed) {
    try {
      console.log(`[Ollama Boss Generator] Generating boss questions via Ollama ${OLLAMA_MODEL} for milestone: "${mTitle}"`);
      const responseText = await ollamaGenerate(prompt, "json", userId, "/boss/generate");
      const bossData = JSON.parse(responseText.trim());
      return validateBossData(bossData);
    } catch (ollamaErr) {
      console.warn(`[Ollama Boss Generator] Ollama failed: ${ollamaErr.message}. Using default template fallback...`);
    }
  }

  // 3. Fallback to pre-defined questions
  console.log(`[Boss Generator Fallback] Using fallback boss questions for: "${mTitle}"`);
  
  // Choose boss type based on title keywords
  let bossType = "Syntax Sentinel";
  const lowerTitle = mTitle.toLowerCase();
  if (lowerTitle.includes("async") || lowerTitle.includes("callback") || lowerTitle.includes("promise") || lowerTitle.includes("network") || lowerTitle.includes("http")) {
    bossType = "Callback Demon";
  } else if (lowerTitle.includes("scope") || lowerTitle.includes("variable") || lowerTitle.includes("closure") || lowerTitle.includes("parameter")) {
    bossType = "Scope Warden";
  } else if (lowerTitle.includes("dom") || lowerTitle.includes("css") || lowerTitle.includes("html") || lowerTitle.includes("ui") || lowerTitle.includes("event")) {
    bossType = "DOM Destroyer";
  } else if (lowerTitle.includes("memory") || lowerTitle.includes("object") || lowerTitle.includes("oop") || lowerTitle.includes("class")) {
    bossType = "Garbage Collector";
  }

  const fallbackIntro = `You challenge the ${bossType}! Prepare to have your logic tested!`;

  const fallbackQuestions = [
    {
      question: `What is the primary concern when organizing topics under "${mTitle}"?`,
      options: [
        "Ensuring correct syntax and logical flow",
        "Decreasing font size to speed up loading",
        "Writing all code in a single line of text",
        "Ignoring errors and assuming they self-heal"
      ],
      answerIndex: 0,
      damageExplanation: "Logical structure and syntax rules are paramount to functional compilation."
    },
    {
      question: `Which of the following represents a major failure mode in "${mTitle}"?`,
      options: [
        "Unchecked variables leading to runtime reference exceptions",
        "Writing too many descriptive comments in the source file",
        "Using camelCase naming conventions instead of snake_case",
        "Formatting text using double quotes instead of single quotes"
      ],
      answerIndex: 0,
      damageExplanation: "Unchecked reference states or variables are the most common source of system crashes."
    },
    {
      question: `Why is deep understanding of "${mTitle}" critical for junior developers?`,
      options: [
        "It prevents common memory leaks and scoping issues",
        "It allows them to skip unit tests entirely",
        "It speeds up internet connection bandwidth",
        "It increases the screen refresh rate of the browser"
      ],
      answerIndex: 0,
      damageExplanation: "Proper structural habits eliminate logic errors, memory leaks, and scope pollution."
    },
    {
      question: `In production environments, what is the best practice for "${mTitle}"?`,
      options: [
        "Thorough validation, error containment, and structural checks",
        "Hardcoding values to save computation overhead",
        "Disabling console logging globally so errors go unnoticed",
        "Deleting the git history before every deployment"
      ],
      answerIndex: 0,
      damageExplanation: "Robust validation and error isolation ensure production builds remain resilient."
    },
    {
      question: `Which tool is standard for maintaining constraints in "${mTitle}"?`,
      options: [
        "Linter checks and code compilers/transpilers",
        "Image optimization compressors",
        "Browser history clean utilities",
        "Sound player controls"
      ],
      answerIndex: 0,
      damageExplanation: "Linters and strict compilers automatically catch formatting, scope, and validation issues."
    }
  ];

  return { bossType, bossIntro: fallbackIntro, questions: fallbackQuestions };
}
