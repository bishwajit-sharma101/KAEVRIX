import dotenv from "dotenv";
import { YoutubeTranscript } from "youtube-transcript";
dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = "gemma4:e4b";

// ── Ollama helpers ──────────────────────────────────────────────────────────
async function ollamaGenerate(prompt, format = "json") {
  const body = {
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
    options: { temperature: 0.7, num_predict: -1, num_ctx: 16384 }
  };
  if (format === "json") body.format = "json";

  console.log(`[Ollama] Sending request to ${OLLAMA_URL}/api/generate for model ${OLLAMA_MODEL}...`);
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(480000) // 8 min timeout for local execution/first run model loads
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Ollama HTTP ${res.status}: ${errorText || "Unknown error"}`);
  }
  const data = await res.json();
  return data.response;
}

// ── Gemini API helpers ────────────────────────────────────────────────────────
async function callGeminiAPI(prompt, responseMimeType = "text/plain") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    throw new Error("No Gemini API key configured");
  }

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
  return text;
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
export async function generateRoadmapFromAnswers(answers, pathfinderMode) {
  const qa = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n");
  const userTopicRaw = answers[0]?.answer || "General Learning";
  const userGoal = answers[1]?.answer || "";
  const userReason = pathfinderMode === 'detailed' ? (answers.find(a => a.question.toLowerCase().includes("dream"))?.answer || "achieve their dream outcome") : (answers.find(a => a.question.toLowerCase().includes("why"))?.answer || "learning");

  // Dynamically extract a short topic from the long prompt to prevent massive text blocks
  const extractShortTopic = (raw) => {
    if (raw.length <= 40) return raw;
    const words = raw.split(/\s+/);
    if (words.length > 5) return words.slice(0, 5).join(" ") + "...";
    return raw.substring(0, 40) + "...";
  };
  const userTopicShort = extractShortTopic(userTopicRaw);

  const prompt = `You are an expert learning path designer for the Kaevrix educational gaming platform.
A user has completed an onboarding interview. Based on their answers, generate a highly personalized, detailed 3-level learning roadmap.
${pathfinderMode === 'detailed' ? 'This is a DEEP-DIVE mode interview. You must carefully analyze their specific problems, history, and constraints. Ensure the roadmap is incredibly comprehensive, leaving absolutely no topic out, so they feel fully confident and capable of achieving their dream outcome by the end of Level 3.' : 'Focus EXCLUSIVELY on teaching the BASICS / FOUNDATIONS of the topic extremely well.'}

USER INTERVIEW:
${qa}

CRITICAL REQUIREMENT:
1. The generated roadmap MUST cover the fundamental aspects of the topic in extreme, granular detail. Ensure that no essential topic is left out, guaranteeing a complete learning journey.
2. The 3 levels must be logically connected, starting from absolute basics (Level 1) to intermediate foundations (Level 2), and finally practical application/tests (Level 3), guaranteeing they achieve their goal: "${userReason}".
3. EXACTLY 12 MILESTONES FOR LEVEL 1: You will generate the detailed milestones for Level 1 ONLY. Leave Level 2 and Level 3 milestones arrays empty.

Generate a JSON roadmap with this EXACT structure:
{
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
        "description": "2-3 sentences describing what this covers and why it matters",
        "searchQuery": "Highly specific YouTube search query (e.g., '${userTopicShort} specific sub-topic tutorial', DO NOT use generic queries like 'Learn ${userTopicShort}')",
        "keyPoints": ["Specific concept 1", "Specific concept 2", "Specific concept 3", "Specific concept 4"],
        "estimatedMinutes": 40,
        "status": "unlocked",
        "xpReward": 30,
        "isRevision": false
      }
      // ... MUST HAVE EXACTLY 12 MILESTONES HERE
    ]
  },
  "level2": {
    "title": "Level 2 — Core Operations & Logic",
    "subtitle": "Intermediate Foundations & Structural Concepts",
    "color": "#f59e0b",
    "milestones": []
  },
  "level3": {
    "title": "Level 3 — Basic Applications & Preparation",
    "subtitle": "Foundational practice, common questions and practical tasks",
    "color": "#8b5cf6",
    "milestones": []
  }
}

Rules:
- You MUST generate EXACTLY 12 milestones for Level 1.
- DO NOT generate milestones for Level 2 or Level 3 (leave the arrays empty).
- The 12th milestone of Level 1 must be a Test or Capstone Project.
- Do NOT hardcode generic keyPoints like "Understand core concepts". You must generate highly specific, dynamic subtopics for the keyPoints based on the milestone.
- Ensure searchQuery is highly specific so the user gets relevant YouTube videos for that exact subtopic.
- Level 1 milestone 0 must have status "unlocked", all others "locked".
- Be extremely detailed, practical, and tailored to the topic "${userTopicShort}".

Return ONLY valid JSON, no markdown.`;

  const apiKey = process.env.GEMINI_API_KEY;
  const useGemini = apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE";

  try {
    let raw;
    if (useGemini) {
      console.log(`[Pathfinder] Generating roadmap for: "${userTopicShort}" via Gemini API`);
      raw = await callGeminiAPI(prompt, "application/json");
    } else {
      console.log(`[Pathfinder] Generating roadmap for: "${userTopicShort}" via Ollama ${OLLAMA_MODEL}`);
      raw = await ollamaGenerate(prompt, "json");
    }
    const roadmap = JSON.parse(raw);

    // Validate structure
    if (!roadmap.level1?.milestones) {
      throw new Error("Invalid roadmap structure from AI");
    }

    // Use AI's generated topic if reasonable, otherwise use our extracted short topic
    if (!roadmap.topic || roadmap.topic.length > 50 || roadmap.topic.toLowerCase().includes("short specific topic name")) {
      roadmap.topic = userTopicShort;
    }

    // Inject Encrypted Placeholders for Level 2 and Level 3
    const createPlaceholders = (levelNum) => {
      return Array.from({ length: 12 }, (_, i) => ({
        id: `${levelNum}-${i}`,
        title: `Encrypted Level ${levelNum} Node`,
        description: "This advanced topic is currently encrypted. Complete the previous level to establish the neural link and decrypt this curriculum.",
        searchQuery: "Encrypted Data",
        keyPoints: ["Classified", "Classified", "Classified", "Classified"],
        estimatedMinutes: 45,
        status: "locked",
        xpReward: 50 * levelNum,
        isRevision: false,
        isEncrypted: true
      }));
    };

    roadmap.level2 = roadmap.level2 || { title: "Level 2 — Core Operations & Logic", subtitle: "Intermediate Foundations", color: "#f59e0b" };
    roadmap.level3 = roadmap.level3 || { title: "Level 3 — Advanced Mastery", subtitle: "Preparation & Tests", color: "#8b5cf6" };
    
    roadmap.level2.milestones = createPlaceholders(2);
    roadmap.level3.milestones = createPlaceholders(3);

    // Enforce unlock rules for Level 1
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
export async function generateLevelMilestones(topic, level, previousMilestonesText) {
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
    raw = await callGeminiAPI(prompt, "application/json");
  } else {
    console.log(`[Pathfinder] Generating Level ${level} for: "${topic}" via Ollama`);
    raw = await ollamaGenerate(prompt, "json");
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
export async function generateStudyNotes(topic, milestone, answers = [], noteStyle = 'smart') {
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

  const apiKey = process.env.GEMINI_API_KEY;
  const useGemini = apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE";

  try {
    let notes;
    if (useGemini) {
      console.log(`[StudyNotes] Generating study notes for: "${milestone.title}" via Gemini API`);
      notes = await callGeminiAPI(prompt, "text/plain");
    } else {
      console.log(`[StudyNotes] Generating study notes for: "${milestone.title}" via Ollama ${OLLAMA_MODEL}`);
      notes = await ollamaGenerate(prompt, "text");
    }
    return notes.trim();
  } catch (err) {
    console.error(`[StudyNotes] AI study notes generation failed: ${err.message}`);
    return `## ${milestone.title || "Study Notes"}\n\n### 🎯 What You'll Learn\n${milestone.description || "Core concepts for this milestone."}\n\n### 📚 Key Points\n${(milestone.keyPoints || ["Study the fundamentals", "Practice regularly", "Build small projects"]).map(p => `- ${p}`).join("\n")}\n\n### ⚡ Quick Practice\nResearch this topic on YouTube and take notes on what surprises you most.`;
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

/**
 * Generates quiz questions for a video (both post-video and in-video pop quizzes).
 * It first tries to fetch the transcript, then calls Ollama (gemma4:e4b) to create the quiz.
 * Falls back to Gemini API or smart default questions if necessary.
 */
export async function generateQuizForVideo(videoId, title, duration = 300) {
  const parsedDuration = Number(duration) || 300;
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
  const prompt = `You are an expert quiz generator for the Kaevrix educational platform.
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

  const validateQuizData = (data) => {
    if (!data || typeof data !== "object") {
      throw new Error("Returned content is not a valid quiz object");
    }
    const postVideo = Array.isArray(data.postVideoQuestions) ? data.postVideoQuestions : [];
    const inVideo = Array.isArray(data.inVideoQuestions) ? data.inVideoQuestions : [];
    
    if (postVideo.length !== 5) {
      throw new Error(`Expected exactly 5 post-video questions, got ${postVideo.length}`);
    }
    if (inVideo.length !== numInVideoQuestions) {
      throw new Error(`Expected exactly ${numInVideoQuestions} in-video questions, got ${inVideo.length}`);
    }
    
    const validatedPostVideo = postVideo.map((q) => ({
      question: q.question || "Trivia Question",
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
      answerIndex: typeof q.answerIndex === "number" && q.answerIndex >= 0 && q.answerIndex <= 3 ? q.answerIndex : 0,
      points: q.points || 100
    }));
    
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

  // 3. Try Ollama (gemma4:e4b) primary generator
  try {
    console.log(`[Ollama Quiz Generator] Generating quiz via Ollama ${OLLAMA_MODEL} for video: "${title}"`);
    const responseText = await ollamaGenerate(prompt, "json");
    const quizData = JSON.parse(responseText.trim());
    const validated = validateQuizData(quizData);
    return { ...validated, captions: transcriptList };
  } catch (ollamaErr) {
    console.warn(`[Ollama Quiz Generator] Ollama failed: ${ollamaErr.message}. Trying Gemini API as fallback...`);
  }

  // 4. Try Gemini API fallback
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE") {
    try {
      console.log(`[Gemini Quiz Generator] Generating quiz via Gemini API for video: "${title}"`);
      const responseText = await callGeminiAPI(prompt, "application/json");
      const quizData = JSON.parse(responseText.trim());
      const validated = validateQuizData(quizData);
      return { ...validated, captions: transcriptList };
    } catch (geminiErr) {
      console.warn(`[Gemini Quiz Generator] Gemini API failed: ${geminiErr.message}. Using default template fallback...`);
    }
  }

  // 5. Ultimate Fallback to smart pre-defined / template questions
  console.log(`[Quiz Generator Fallback] Using smart fallback quiz for: "${title}"`);
  const fallback = generateFallbackQuiz(title, parsedDuration);
  return {
    ...fallback,
    captions: transcriptList
  };
}

/**
 * Generates custom Boss Battle questions, boss type, and intro dialog JIT.
 * Prioritizes local Ollama gemma4:e4b, falling back to Gemini API or a high-quality template.
 */
export async function generateBossQuestions(topic, milestone) {
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

  // 1. Try Ollama (gemma4:e4b) primary generator
  try {
    console.log(`[Ollama Boss Generator] Generating boss questions via Ollama ${OLLAMA_MODEL} for milestone: "${mTitle}"`);
    const responseText = await ollamaGenerate(prompt, "json");
    const bossData = JSON.parse(responseText.trim());
    return validateBossData(bossData);
  } catch (ollamaErr) {
    console.warn(`[Ollama Boss Generator] Ollama failed: ${ollamaErr.message}. Trying Gemini API as fallback...`);
  }

  // 2. Try Gemini API fallback
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE") {
    try {
      console.log(`[Gemini Boss Generator] Generating boss questions via Gemini API for milestone: "${mTitle}"`);
      const responseText = await callGeminiAPI(prompt, "application/json");
      const bossData = JSON.parse(responseText.trim());
      return validateBossData(bossData);
    } catch (geminiErr) {
      console.warn(`[Gemini Boss Generator] Gemini API failed: ${geminiErr.message}. Using default template fallback...`);
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
