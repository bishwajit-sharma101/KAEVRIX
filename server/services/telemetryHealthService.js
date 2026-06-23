import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function logInfrastructureError(eventType, errorDetails) {
  const logPath = path.join(__dirname, "../../infra-errors.log");
  const logEntry = `[${new Date().toISOString()}] [${eventType}]: ${JSON.stringify(errorDetails)}\n`;
  try {
    fs.appendFileSync(logPath, logEntry);
  } catch (e) {
    console.error("Failed to write to infra error log", e);
  }
}
