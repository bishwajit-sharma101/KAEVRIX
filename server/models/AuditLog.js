import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  adminUsername: { type: String, required: true },
  action: { type: String, required: true },
  target: { type: String, required: false },
  changes: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("AuditLog", auditLogSchema);
