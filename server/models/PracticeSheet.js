import mongoose from "mongoose";

const practiceSheetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  roadmapTopic: { type: String, required: true },
  level: { type: Number, required: true },
  milestones: [
    {
      milestoneId: { type: String, required: true },
      milestoneTitle: { type: String, required: true },
      questions: [
        {
          id: { type: String, required: true },
          type: { type: String, enum: ["theory", "practical"], required: true },
          difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
          question: { type: String, required: true },
          guidance: { type: String, required: true },
          answer: { type: String, required: false },
          codeTemplate: { type: String, required: false },
          variants: [String]
        }
      ]
    }
  ],
  completedQuestionIds: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

practiceSheetSchema.index({ userId: 1, roadmapTopic: 1, level: 1 }, { unique: true });

export default mongoose.model("PracticeSheet", practiceSheetSchema);
