import mongoose from "mongoose";

const securityEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  username: { type: String, required: false }, // Useful for failed logins where user might not exist
  ipAddress: { type: String, required: true },
  endpoint: { type: String, required: true },
  eventType: { 
    type: String, 
    enum: ["FAILED_LOGIN", "RATE_LIMIT", "AI_ABUSE", "BOLA_ATTEMPT", "LOCKOUT", "SUCCESSFUL_LOGIN", "UNKNOWN_ABUSE", "AI_BUDGET_ALERT"],
    required: true 
  },
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, expires: 2592000 } // Auto-delete after 30 days
});

// Indexes for abuse detection (lockouts, brute-force)
securityEventSchema.index({ username: 1, eventType: 1, timestamp: -1 });
securityEventSchema.index({ ipAddress: 1, eventType: 1, timestamp: -1 });
securityEventSchema.index({ timestamp: -1 });

export default mongoose.model("SecurityEvent", securityEventSchema);
