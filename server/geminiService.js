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
    options: { temperature: 0.7, num_predict: 4096, num_ctx: 8192 }
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
  const milestoneBase = (level, idx, titles, descs) => ({
    id: `${level}-${idx}`,
    title: titles[idx] || `${t} Step ${idx + 1}`,
    description: descs[idx] || `Learn the essential sub-topic under ${titles[idx]}.`,
    searchQuery: `${t} ${titles[idx]} tutorial`,
    keyPoints: ["Understand core concepts", "Practice with examples", "Review common pitfalls", "Check interview questions"],
    estimatedMinutes: 50,
    status: level === 1 && idx === 0 ? "unlocked" : "locked",
    xpReward: 40 + idx * 10,
    isRevision: false
  });

  const level1Titles = [`${t} Introduction`, `${t} Core Syntax`, `${t} Essential Concepts`, `${t} Basic Setup & Tools`, `${t} First Exercises`, `${t} Core Foundations Review`];
  const level1Descs = [
    `Get started with ${t}, understanding its history, purpose, and installation.`,
    `Learn the basic syntax, keywords, and structural rules of ${t}.`,
    `Deep dive into the primary building blocks and concepts.`,
    `Configure your local environment and code editor for optimal ${t} development.`,
    `Write your first scripts/programs and solve basic exercises.`,
    `Review all Level 1 foundational elements to solidify your base before proceeding.`
  ];

  const level2Titles = [`Intermediate ${t} Syntax`, `${t} Best Practices`, `Testing & Debugging ${t}`, `${t} Data Operations`, `Practical ${t} Applications`, `Level 2 Review & Exercises`];
  const level2Descs = [
    `Advance your knowledge with intermediate structures and keywords.`,
    `Learn standard conventions, clean code guidelines, and design principles.`,
    `Find, diagnose, and resolve bugs using tools and writing tests.`,
    `Manage, filter, and structure data in ${t} programs.`,
    `Build functional small-scale projects applying intermediate logic.`,
    `Consolidate intermediate methods and complete interactive test challenges.`
  ];

  const level3Titles = [`Advanced ${t} Concepts`, `${t} Interview Questions`, `${t} Under the Hood`, `${t} Practical Case Study`, `Asynchronous & Advanced Foundations`, `${t} Final Review`];
  const level3Descs = [
    `Understand advanced features and complex topics.`,
    `Prepare for common tests and job interview questions related to ${t}.`,
    `Discover how ${t} runs behind the scenes and manages memory.`,
    `Deconstruct real-world implementations and solve a complex problem.`,
    `Explore standard asynchronous patterns and basic external integrations.`,
    `Reflect on key takeaways and test your complete knowledge.`
  ];

  return {
    topic: t,
    goal: goal || "Master the subject",
    summary: `A highly detailed, personalized 3-level roadmap to build a rock-solid basic understanding in ${t} tailored to your goals.`,
    level1: {
      title: "Level 1 — Foundations",
      subtitle: "Basic Syntax & Setups",
      color: "#10b981",
      milestones: Array.from({ length: 6 }, (_, i) => milestoneBase(1, i, level1Titles, level1Descs))
    },
    level2: {
      title: "Level 2 — Intermediate Basics",
      subtitle: "Data, Tools & Practical Logic",
      color: "#f59e0b",
      milestones: Array.from({ length: 6 }, (_, i) => milestoneBase(2, i, level2Titles, level2Descs))
    },
    level3: {
      title: "Level 3 — Interview Prep & Mastery",
      subtitle: "Advanced Foundations & Mock Tests",
      color: "#8b5cf6",
      milestones: Array.from({ length: 6 }, (_, i) => milestoneBase(3, i, level3Titles, level3Descs))
    }
  };
}

/**
 * Generates a personalized 3-level learning roadmap using Ollama gemma4:e4b or Gemini API.
 * Falls back to template if Ollama is unavailable.
 */
export async function generateRoadmapFromAnswers(answers) {
  const qa = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n");
  const userTopic = answers[0]?.answer || "General Learning";
  const userGoal = answers[1]?.answer || "";
  const userReason = answers.find(a => a.question.toLowerCase().includes("why"))?.answer || "learning";

  const prompt = `You are an expert learning path designer for the ytPlay educational gaming platform.
A user has completed an onboarding interview. Based on their answers, generate a highly personalized, detailed 3-level learning roadmap focusing EXCLUSIVELY on teaching the BASICS / FOUNDATIONS of the topic "${userTopic}" extremely well.

USER INTERVIEW:
${qa}

CRITICAL REQUIREMENT:
The generated roadmap MUST cover only the basic, fundamental aspects of "${userTopic}" in extreme, granular detail.
Do NOT include advanced topics like system architecture, complex scaling, advanced design patterns, or highly specialized production techniques. Focus on building a rock-solid, deep understanding of the basics.
Tailor the details (especially Level 3) to the user's specific reason for learning: "${userReason}" and their goals. For example, if their reason is a "job", include common entry-level interview questions and core concepts asked in tests. If it is for a "project", include practical foundations.

Generate a JSON roadmap with this EXACT structure:
{
  "topic": "short specific topic name (2-4 words)",
  "goal": "one sentence summarizing what they want to achieve",
  "summary": "2-3 sentences describing why this roadmap is tailored for them, focusing on mastering the basics for their goal",
  "level1": {
    "title": "Level 1 — Foundations",
    "subtitle": "Essential Basics & Core Concepts",
    "color": "#10b981",
    "milestones": [
      {
        "id": "1-0",
        "title": "specific basic sub-topic title",
        "description": "2-3 sentences describing what this covers, why it matters, and common pitfalls/questions asked in relation to it",
        "searchQuery": "YouTube search query to find the best educational video or tutorial for this milestone",
        "keyPoints": ["point 1", "point 2", "point 3", "point 4"],
        "estimatedMinutes": 40,
        "status": "unlocked",
        "xpReward": 30,
        "isRevision": false
      }
    ]
  },
  "level2": {
    "title": "Level 2 — Core Operations & Logic",
    "subtitle": "Intermediate Foundations & Structural Concepts",
    "color": "#f59e0b",
    "milestones": [/* same structure, status: "locked", xpReward: 50-70 */]
  },
  "level3": {
    "title": "Level 3 — Basic Applications & Preparation",
    "subtitle": "Foundational practice, common questions and practical tasks",
    "color": "#8b5cf6",
    "milestones": [/* same structure, status: "locked", xpReward: 80-100 */]
  }
}

Rules:
- Each of the three levels MUST contain EXACTLY 6 to 8 milestones (do not generate fewer than 6 milestones per level under any circumstances). A detailed and granular roadmap is required.
- Do not limit the roadmap to a high-level overview. Provide granular, distinct milestones for specific sub-topics. Split different foundational building blocks into separate, dedicated milestones to teach them really well.
- Level 1 milestone 0 must have status "unlocked", all others "locked"
- Milestones must be highly specific to the actual topic basics and goal — NOT generic templates
- searchQuery should return real, relevant YouTube search queries (e.g., "[topic] [milestone title] tutorial")
- keyPoints should be actionable and specific to the milestone sub-topic
- estimatedMinutes: 30-120 based on depth
- Be extremely detailed, practical, and tailored to the topic "${userTopic}"

Return ONLY valid JSON, no markdown.`;

  const apiKey = process.env.GEMINI_API_KEY;
  const useGemini = apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE";

  try {
    let raw;
    if (useGemini) {
      console.log(`[Pathfinder] Generating roadmap for: "${userTopic}" via Gemini API`);
      raw = await callGeminiAPI(prompt, "application/json");
    } else {
      console.log(`[Pathfinder] Generating roadmap for: "${userTopic}" via Ollama ${OLLAMA_MODEL}`);
      raw = await ollamaGenerate(prompt, "json");
    }
    const roadmap = JSON.parse(raw);

    // Validate structure
    if (!roadmap.level1?.milestones || !roadmap.level2?.milestones || !roadmap.level3?.milestones) {
      throw new Error("Invalid roadmap structure from AI");
    }

    // Enforce unlock rules
    roadmap.level1.milestones.forEach((m, i) => { m.status = i === 0 ? "unlocked" : "locked"; });
    roadmap.level2.milestones.forEach(m => { m.status = "locked"; });
    roadmap.level3.milestones.forEach(m => { m.status = "locked"; });

    console.log(`[Pathfinder] Successfully generated roadmap: "${roadmap.topic}"`);
    return roadmap;
  } catch (err) {
    console.error(`[Pathfinder] AI roadmap generation failed (${err.message}), using fallback template`);
    return buildFallbackRoadmap(userTopic, userGoal);
  }
}

/**
 * Generates AI study notes (markdown) for a specific milestone.
 */
export async function generateStudyNotes(topic, milestone, answers = []) {
  const userReason = answers.find(a => a.question.toLowerCase().includes("why"))?.answer || "learning";
  const userGoal = answers.find(a => a.question.toLowerCase().includes("success"))?.answer || "mastery";

  const prompt = `You are a world-class expert educator.
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
function generateFallbackQuiz(title) {
  const normalizedTitle = title.toLowerCase();
  
  // Topic: JavaScript/Web Development
  if (normalizedTitle.includes("javascript") || normalizedTitle.includes("js") || normalizedTitle.includes("react") || normalizedTitle.includes("html") || normalizedTitle.includes("web dev") || normalizedTitle.includes("coding")) {
    return [
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
  if (normalizedTitle.includes("python") || normalizedTitle.includes("java") || normalizedTitle.includes("c++") || normalizedTitle.includes("programming") || normalizedTitle.includes("tutorial")) {
    return [
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
  if (normalizedTitle.includes("science") || normalizedTitle.includes("space") || normalizedTitle.includes("quantum") || normalizedTitle.includes("physics") || normalizedTitle.includes("earth") || normalizedTitle.includes("nature")) {
    return [
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
  if (normalizedTitle.includes("game") || normalizedTitle.includes("gaming") || normalizedTitle.includes("minecraft") || normalizedTitle.includes("fortnite") || normalizedTitle.includes("zelda") || normalizedTitle.includes("gta")) {
    return [
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
  return [
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

/**
 * Generates quiz questions for a video.
 * It first tries to fetch the transcript, then calls Ollama (gemma4:e4b) to create the quiz.
 * Falls back to Gemini API or smart default questions if necessary.
 */
export async function generateQuizForVideo(videoId, title) {
  // 1. Try to fetch video transcript
  let transcriptText = "";
  if (videoId) {
    try {
      console.log(`[Transcript] Fetching transcript for video: "${title}" (${videoId})`);
      const transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
      transcriptText = transcriptList.map(t => t.text).join(" ");
      console.log(`[Transcript] Successfully fetched transcript of length ${transcriptText.length} characters.`);
    } catch (err) {
      console.warn(`[Transcript] Failed to fetch transcript for video "${title}" (${videoId}):`, err.message);
    }
  }

  // 2. Formulate the quiz prompt
  const prompt = `You are an expert quiz generator for the ytPlay educational platform.
Your task is to generate a quiz consisting of exactly 5 multiple choice questions based on the content of a YouTube video.

VIDEO DETAILS:
Title: "${title}"
${transcriptText ? `Transcript:\n"""\n${transcriptText.substring(0, 15000)}\n"""` : "(No transcript available)"}

Instructions:
1. Generate exactly 5 multiple choice questions.
2. The questions must test key facts, concepts, or information mentioned in the video (use the transcript if available, otherwise base it on the title).
3. The questions should be engaging and have one clear correct answer.
4. Each question must have exactly 4 options.
5. Respond ONLY with a valid JSON array of objects. Do not include markdown code blocks, backticks, or any conversational text.

Format specification:
[
  {
    "question": "The question text here?",
    "options": ["Option 0 text", "Option 1 text", "Option 2 text", "Option 3 text"],
    "answerIndex": 0, // integer index (0, 1, 2, or 3) of the correct option
    "points": 100
  }
]
`;

  const validateQuestions = (questions) => {
    if (!Array.isArray(questions) || questions.length !== 5) {
      throw new Error("Returned content is not a 5-question array");
    }
    return questions.map((q) => ({
      question: q.question || "Trivia Question",
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
      answerIndex: typeof q.answerIndex === "number" && q.answerIndex >= 0 && q.answerIndex <= 3 ? q.answerIndex : 0,
      points: q.points || 100
    }));
  };

  // 3. Try Ollama (gemma4:e4b) primary generator
  try {
    console.log(`[Ollama Quiz Generator] Generating quiz via Ollama ${OLLAMA_MODEL} for video: "${title}"`);
    const responseText = await ollamaGenerate(prompt, "json");
    const questions = JSON.parse(responseText.trim());
    return validateQuestions(questions);
  } catch (ollamaErr) {
    console.warn(`[Ollama Quiz Generator] Ollama failed: ${ollamaErr.message}. Trying Gemini API as fallback...`);
  }

  // 4. Try Gemini API fallback
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE") {
    try {
      console.log(`[Gemini Quiz Generator] Generating quiz via Gemini API for video: "${title}"`);
      const responseText = await callGeminiAPI(prompt, "application/json");
      const questions = JSON.parse(responseText.trim());
      return validateQuestions(questions);
    } catch (geminiErr) {
      console.warn(`[Gemini Quiz Generator] Gemini API failed: ${geminiErr.message}. Using default template fallback...`);
    }
  }

  // 5. Ultimate Fallback to smart pre-defined / template questions
  console.log(`[Quiz Generator Fallback] Using smart fallback quiz for: "${title}"`);
  return generateFallbackQuiz(title);
}
