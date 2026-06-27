import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { validateEnv } from "./validateEnv.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Validate them immediately
validateEnv();
