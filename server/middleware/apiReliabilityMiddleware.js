// In-memory collector for API reliability analytics
let totalRequests = 0;
let successfulRequests = 0;
let err4xxRequests = 0;
let err5xxRequests = 0;

// Mapping of route + method -> { total, success, err4xx, err5xx }
const endpointStats = {};

// Rolling log of the last 30 API failures: { timestamp, method, url, statusCode, message }
const recentFailures = [];

export function apiReliabilityMiddleware(req, res, next) {
  // Only monitor API calls (exclude statics, assets, or socket streams if they hit HTTP)
  if (!req.originalUrl.startsWith("/api")) {
    return next();
  }

  totalRequests++;
  
  // Track start time for potential latency tracking
  const startTime = Date.now();

  // Capture response finish
  res.on("finish", () => {
    const statusCode = res.statusCode;
    const isSuccess = statusCode < 400;
    const is4xx = statusCode >= 400 && statusCode < 500;
    const is5xx = statusCode >= 500;

    if (isSuccess) successfulRequests++;
    else if (is4xx) err4xxRequests++;
    else if (is5xx) err5xxRequests++;

    // Endpoint grouping key
    // Remove query params to prevent cardinality explosion (e.g. /api/profile/bishw -> /api/profile/:param)
    // Simplify URLs: replace IDs with placeholders
    let cleanUrl = req.originalUrl.split("?")[0];
    cleanUrl = cleanUrl.replace(/\/[a-f0-9]{24}(\/|$)/gi, "/:id$1"); // Mongo IDs
    cleanUrl = cleanUrl.replace(/\/profile\/[a-zA-Z0-9_\-]+(\/|$)/gi, "/profile/:username$1"); // Profile usernames
    cleanUrl = cleanUrl.replace(/\/chat\/messages\/[a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+(\/|$)/gi, "/chat/messages/:user1/:user2$1"); // Chat users
    
    const key = `[${req.method}] ${cleanUrl}`;

    if (!endpointStats[key]) {
      endpointStats[key] = { total: 0, success: 0, err4xx: 0, err5xx: 0 };
    }
    
    endpointStats[key].total++;
    if (isSuccess) endpointStats[key].success++;
    else if (is4xx) endpointStats[key].err4xx++;
    else if (is5xx) endpointStats[key].err5xx++;

    // Log recent failure
    if (!isSuccess) {
      const errorMessage = res.statusMessage || (statusCode === 429 ? "Rate Limit Exceeded" : statusCode === 401 ? "Unauthorized" : "API Error");
      recentFailures.unshift({
        timestamp: new Date(),
        method: req.method,
        url: req.originalUrl,
        statusCode,
        message: errorMessage
      });
      // Keep only last 30
      if (recentFailures.length > 30) {
        recentFailures.pop();
      }
    }
  });

  next();
}

export function getApiReliabilityStats() {
  const successRate = totalRequests > 0 ? parseFloat(((successfulRequests / totalRequests) * 100).toFixed(2)) : 100;
  
  // Find the endpoint with most failures (4xx + 5xx)
  let mostFailingEndpoint = "None";
  let maxFailures = 0;

  for (const [endpoint, stats] of Object.entries(endpointStats)) {
    const totalFails = stats.err4xx + stats.err5xx;
    if (totalFails > maxFailures) {
      maxFailures = totalFails;
      mostFailingEndpoint = endpoint;
    }
  }

  return {
    totalRequests,
    successfulRequests,
    err4xxRequests,
    err5xxRequests,
    successRate,
    mostFailingEndpoint,
    endpointStats,
    recentFailures
  };
}
