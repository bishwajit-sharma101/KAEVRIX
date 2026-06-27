import winston from "winston";
import { AsyncLocalStorage } from "async_hooks";

const { combine, timestamp, json, colorize, printf } = winston.format;

// Store request-specific context like requestId, userId, correlationId
export const logContextStorage = new AsyncLocalStorage();

const addContextFormat = winston.format((info) => {
  const store = logContextStorage.getStore();
  if (store) {
    return { ...info, ...store };
  }
  return info;
});

const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let metaStr = "";
  if (Object.keys(metadata).length > 0) {
    metaStr = " " + JSON.stringify(metadata);
  }
  return `${timestamp} [${level}]: ${message}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  format: combine(
    addContextFormat(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    process.env.NODE_ENV === "production" ? json() : combine(colorize(), devFormat)
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export default logger;
