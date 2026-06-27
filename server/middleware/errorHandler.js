import * as Sentry from "@sentry/node";
import TelemetryEvent from "../models/TelemetryEvent.js";
import logger from "../config/logger.js";

export function errorHandler(err, req, res, next) {
  logger.error("[ErrorHandler] Error occurred", { message: err.message, stack: err.stack, statusCode: err.statusCode || 500 });
  
  // Capture unhandled errors in Sentry for all environments if SENTRY_DSN is configured
  if (process.env.SENTRY_DSN && !err.isJoi && err.name !== "ZodError" && err.name !== "ValidationError") {
    Sentry.withScope((scope) => {
      if (req.user) {
        scope.setUser({
          id: req.user.userId || req.user.id || "",
          username: req.user.username || "",
          email: req.user.email || ""
        });
      }
      if (req.requestId) {
        scope.setTag("requestId", req.requestId);
      }
      if (req.correlationId) {
        scope.setTag("correlationId", req.correlationId);
      }
      scope.setTag("method", req.method);
      scope.setTag("url", req.originalUrl);
      scope.setTag("statusCode", String(err.statusCode || 500));
      Sentry.captureException(err);
    });
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
    }).catch(e => logger.error("[Telemetry] Failed to log API_ERROR", { error: e.message }));
  } catch (telemetryErr) {
    // Ignore telemetry insertion failures
  }

  // Handle Mongoose Duplicate Key
  if (err.code === 11000) {
    return res.status(400).json({ error: "Resource already exists", code: 400 });
  }


  // Handle Zod Validation Errors (Zod v4 uses .issues, Zod v3 used .errors)
  if (err.name === "ZodError") {
    const issues = err.issues || err.errors || [];
    return res.status(400).json({
      error: "Validation Error",
      details: issues.map(e => `${Array.isArray(e.path) ? e.path.join(".") : e.path}: ${e.message}`)
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
