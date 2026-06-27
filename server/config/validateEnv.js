import { z } from "zod";
import logger from "./logger.js";

const envSchema = z.object({
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters long"),
  MONGODB_URI: z.string().url("MONGODB_URI must be a valid URL").default("mongodb://127.0.0.1:27017/ytplay"),
  REDIS_URL: z.string().url("REDIS_URL must be a valid URL").default("redis://127.0.0.1:6379"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  SENTRY_DSN: z.string().optional(),
  CLIENT_URL: z.string().url("CLIENT_URL must be a valid URL").default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONTHLY_AI_BUDGET_USD: z.coerce.number().default(100),
});

export function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    // Assign validated and defaulted values back to process.env
    Object.assign(process.env, parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("❌ Environment configuration validation failed:");
      error.errors.forEach((err) => {
        logger.error(`  - Env Var: ${err.path.join(".")}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}
