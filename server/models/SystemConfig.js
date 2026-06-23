import mongoose from "mongoose";

const systemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedBy: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("SystemConfig", systemConfigSchema);
