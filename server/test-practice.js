import mongoose from "mongoose";
import connectDB from "./config/db.js";
import PracticeSheet from "./models/PracticeSheet.js";
import redisClient from "./config/redis.js";
import { practiceSheetGenerateSchema, practiceSheetToggleSchema } from "./validations/apiSchemas.js";
import { generateLevelPracticeSheet } from "./geminiService.js";

async function runPracticeSheetVerification() {
  console.log("==================================================");
  console.log("   STARTING PATHFINDER PRACTICE SHEET VERIFICATION ");
  console.log("==================================================\n");

  // 1. Zod Schema Verification
  console.log("Step 1: Testing Zod API schemas...");
  const validGenPayload = {
    topic: "javascript",
    level: 2,
    milestones: [
      { id: "m1", title: "ES6 Basics", subtopics: ["Arrow functions", "Destructuring"] },
      { id: "m2", title: "Async Flow", subtopics: ["Promises", "Async/Await"] }
    ],
    devGoal: "Job",
    devLanguage: "javascript",
    difficulty: "Medium"
  };

  const genResult = practiceSheetGenerateSchema.safeParse({ body: validGenPayload });
  if (!genResult.success) {
    console.error("❌ Zod failed to validate correct generation payload:", genResult.error);
    throw new Error("Zod generation validation failure");
  }
  console.log("✔ Zod generation validation succeeded");

  const validTogglePayload = {
    topic: "javascript",
    level: 2,
    questionId: "q_m1_1",
    completed: true
  };

  const toggleResult = practiceSheetToggleSchema.safeParse({ body: validTogglePayload });
  if (!toggleResult.success) {
    console.error("❌ Zod failed to validate correct toggle payload:", toggleResult.error);
    throw new Error("Zod toggle validation failure");
  }
  console.log("✔ Zod toggle validation succeeded");

  // 2. Connect DB
  console.log("\nStep 2: Connecting to database...");
  await connectDB();
  console.log("✔ Connected to database successfully");

  // 3. Database Persistence & Uniqueness Constraints
  console.log("\nStep 3: Verifying Mongoose persistence & compound indexes...");
  const testUserId = new mongoose.Types.ObjectId();
  
  // Clean old test entries
  await PracticeSheet.deleteMany({ userId: testUserId });

  // Create mock practice sheet
  const testSheet = await PracticeSheet.create({
    userId: testUserId,
    roadmapTopic: "javascript",
    level: 2,
    milestones: [
      {
        milestoneId: "m1",
        milestoneTitle: "ES6 Basics",
        questions: [
          {
            id: "q_m1_1",
            type: "practical",
            difficulty: "Medium",
            question: "Write an arrow function mapping array values.",
            guidance: "Use .map() and standard syntax.",
            answer: "const square = arr => arr.map(x => x * x);",
            codeTemplate: "const square = (arr) => { // code here }",
            variants: ["Optimize for memory complexity."]
          }
        ]
      }
    ],
    completedQuestionIds: []
  });

  if (!testSheet || testSheet.milestones.length !== 1) {
    throw new Error("Failed to persist practice sheet model");
  }
  console.log("✔ Successfully created and saved practice sheet document");

  // Test compound unique constraint: { userId, roadmapTopic, level }
  try {
    await PracticeSheet.create({
      userId: testUserId,
      roadmapTopic: "javascript",
      level: 2,
      milestones: []
    });
    throw new Error("Compound unique constraint failed! Allowed duplicate level entry!");
  } catch (err) {
    if (err.code === 11000) {
      console.log("✔ Correctly blocked duplicate unique index violation (Error 11000)");
    } else {
      throw err;
    }
  }

  // 4. Test toggle question operation
  console.log("\nStep 4: Verifying toggle status updates...");
  // Complete the question
  const addedDoc = await PracticeSheet.findOneAndUpdate(
    { userId: testUserId, roadmapTopic: "javascript", level: 2 },
    { $addToSet: { completedQuestionIds: "q_m1_1" } },
    { new: true }
  );
  if (!addedDoc.completedQuestionIds.includes("q_m1_1")) {
    throw new Error("Failed to add question to completed list");
  }
  console.log("✔ Successfully toggled question status to COMPLETED");

  // Incomplete the question
  const removedDoc = await PracticeSheet.findOneAndUpdate(
    { userId: testUserId, roadmapTopic: "javascript", level: 2 },
    { $pull: { completedQuestionIds: "q_m1_1" } },
    { new: true }
  );
  if (removedDoc.completedQuestionIds.includes("q_m1_1")) {
    throw new Error("Failed to remove question from completed list");
  }
  console.log("✔ Successfully toggled question status back to INCOMPLETE");

  // 5. Test Fallback generator handler in geminiService
  console.log("\nStep 5: Testing generator fallback pipeline helper...");
  const generatedDoc = await generateLevelPracticeSheet(
    testUserId,
    "javascript",
    2,
    [
      { id: "m1", title: "ES6 Basics", subtopics: ["Arrow functions"] }
    ],
    "Job",
    "javascript",
    "Medium"
  );

  if (!generatedDoc || generatedDoc.milestones.length !== 1) {
    throw new Error("Generator function failed to return document structure");
  }
  console.log(`✔ Generator resolved with document ID: ${generatedDoc._id}`);

  // Cleanup test data
  await PracticeSheet.deleteMany({ userId: testUserId });
  console.log("\n✔ Cleanup completed successfully");
  console.log("\n==================================================");
  console.log("   ALL PATHFINDER PRACTICE SHEET TESTS PASSED! ");
  console.log("==================================================");
}

runPracticeSheetVerification()
  .then(() => {
    setTimeout(async () => {
      try {
        await mongoose.disconnect();
        await redisClient.quit();
      } catch (e) {}
      process.exit(0);
    }, 2000);
  })
  .catch((err) => {
    console.error("\n❌ Practice Sheet verification test suite failed:", err);
    setTimeout(async () => {
      try {
        await mongoose.disconnect();
        await redisClient.quit();
      } catch (e) {}
      process.exit(1);
    }, 2000);
  });
