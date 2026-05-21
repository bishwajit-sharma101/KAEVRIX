import { generateRoadmapFromAnswers } from "./geminiService.js";

async function runTest() {
  console.log("Running Pathfinder generation test...");
  
  // Test case 1: Fallback template test (Ollama and Gemini fail or no key)
  const answers = [
    { question: "What topic do you want to learn?", answer: "javascript" },
    { question: "What is your main goal?", answer: "job" },
    { question: "Why do you want to learn this?", answer: "job preparation" }
  ];
  
  const roadmap = await generateRoadmapFromAnswers(answers);
  console.log("Roadmap Topic:", roadmap.topic);
  console.log("Level 1 milestones count:", roadmap.level1.milestones.length);
  console.log("Level 2 milestones count:", roadmap.level2.milestones.length);
  console.log("Level 3 milestones count:", roadmap.level3.milestones.length);
  
  const allMilestones = [
    ...roadmap.level1.milestones,
    ...roadmap.level2.milestones,
    ...roadmap.level3.milestones
  ];
  
  console.log("All Milestone Titles:");
  allMilestones.forEach(m => console.log(` - [${m.id}] ${m.title} (Status: ${m.status})`));
}

runTest().catch(console.error);
