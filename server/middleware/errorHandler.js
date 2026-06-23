import * as Sentry from "@sentry/node";
import TelemetryEvent from "../models/TelemetryEvent.js";

export function errorHandler(err, req, res, next) {
  console.error("[ErrorHandler] Error:", err.message);
  
  // Capture unhandled errors in Sentry
  if (process.env.NODE_ENV === "production" && !err.isJoi && !err.isZod) {
    Sentry.captureException(err);
  }

  // Log API_ERROR to Telemetry
  try {
    TelemetryEvent.create({
      username: req.user ? req.user.username : "anonymous",
      eventType: "API_ERROR",
      pagePath: req.originalUrl,
      metadata: {
        method: req.method,
        errorMessage: err.message,
        stack: err.stack,
        statusCode: err.statusCode || 500
      }
    }).catch(e => console.error("[Telemetry] Failed to log API_ERROR:", e));
  } catch (telemetryErr) {
    // Ignore telemetry insertion failures
  }

  // Handle Mongoose Duplicate Key
  if (err.code === 11000) {
    return res.status(400).json({ error: "Resource already exists", code: 400 });
  }

  // Handle Zod Validation Errors
  if (err.name === "ZodError") {
    return res.status(400).json({ 
      error: "Validation Error", 
      details: err.errors.map(e => `${e.path.join(".")}: ${e.message}`)
    });
  }

  const statusCode = err.statusCode || 500;
  
  // Prevent stack traces from leaking to client in production
  const response = {
    error: err.message || "Internal Server Error",
    code: statusCode
  };

  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
