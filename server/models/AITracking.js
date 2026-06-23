import mongoose from "mongoose";

const aiTrackingSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // null means global daily tracker
  endpoint: { type: String, required: true },
  requestsCount: { type: Number, default: 0 },
  estimatedInputTokens: { type: Number, default: 0 },
  estimatedOutputTokens: { type: Number, default: 0 },
  estimatedCostUSD: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// For fast querying of daily usage per user or globally
aiTrackingSchema.index({ date: 1, userId: 1 });

export default mongoose.model("AITracking", aiTrackingSchema);
