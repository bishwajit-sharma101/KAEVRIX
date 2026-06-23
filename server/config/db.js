import mongoose from "mongoose";
import dotenv from "dotenv";
import { logInfrastructureError } from "../services/telemetryHealthService.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ytplay");
    console.log(`========================================`);
    console.log(` MongoDB Connected: ${conn.connection.host}`);
    console.log(`========================================`);
  } catch (error) {
    logInfrastructureError("MONGO_CONNECTION_FAILED", { message: error.message, stack: error.stack });
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }

  mongoose.connection.on("error", (error) => {
    logInfrastructureError("MONGO_CONNECTION_FAILED", { message: error.message, stack: error.stack, type: "runtime_disconnect" });
  });
};

export default connectDB;
