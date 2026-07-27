// Centralized telemetry manager for generating and preserving session & journey tracking IDs.
export const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const SESSION_KEY = "kaevrix_session_id";
const JOURNEY_KEY = "kaevrix_journey_id";
const DEVICE_KEY = "kaevrix_device_id";

/**
 * Ensures a unique session ID exists for the current browser tab.
 * This is stored in sessionStorage and dies when the tab closes.
 */
export const getSessionId = () => {
  if (typeof window === "undefined") return "";
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${generateUUID()}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

/**
 * Gets the current overarching learning journey ID.
 * This persists across browser sessions (localStorage).
 * If none exists, creates a default one until a specific topic overrides it.
 */
export const getJourneyId = () => {
  if (typeof window === "undefined") return "";
  let journeyId = localStorage.getItem(JOURNEY_KEY);
  if (!journeyId) {
    journeyId = `journey_default_${generateUUID()}`;
    localStorage.setItem(JOURNEY_KEY, journeyId);
  }
  return journeyId;
};

/**
 * Ensures a persistent device ID is stored in localStorage.
 */
export const getDeviceId = () => {
  if (typeof window === "undefined") return "";
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = `device_${generateUUID()}`;
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
  return deviceId;
};

/**
 * Sets a new journey ID (e.g. when a new Roadmap is generated or specific learning goal starts).
 */
export const setJourneyTopic = (topic) => {
  const safeTopic = topic.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const journeyId = `journey_${safeTopic}_${generateUUID().substring(0, 8)}`;
  localStorage.setItem(JOURNEY_KEY, journeyId);
  return journeyId;
};

/**
 * Generates an ephemeral correlation ID for tracking a specific flow of events (like taking a quiz).
 */
export const generateCorrelationId = (prefix = "flow") => {
  return `${prefix}_${generateUUID().substring(0, 8)}`;
};

// State for deep metrics
let currentScrollDepth = 0;
let currentIdleTime = 0;
let currentPageDwellTime = 0;
let currentRageClicksCount = 0;

export const updateScrollDepth = (depth) => {
  if (depth > currentScrollDepth) {
    currentScrollDepth = depth;
  }
};
export const incrementIdleTime = (secs) => { currentIdleTime += secs; };
export const incrementPageDwellTime = (secs) => { currentPageDwellTime += secs; };
export const incrementRageClicks = () => { currentRageClicksCount += 1; };
export const resetDeepMetrics = () => {
  currentScrollDepth = 0;
  currentIdleTime = 0;
  currentPageDwellTime = 0;
  currentRageClicksCount = 0;
};

// Telemetry Buffer Queue config
let eventQueue = [];
const FLUSH_INTERVAL_MS = 5000;

// Helper to extract common client metrics dynamically
const getClientMetrics = () => {
  if (typeof window === "undefined") return {};
  return {
    connectionType: navigator.connection?.effectiveType || "unknown",
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pagePath: window.location.pathname,
    scrollDepth: currentScrollDepth,
    idleTime: currentIdleTime,
    pageDwellTime: currentPageDwellTime,
    rageClicksCount: currentRageClicksCount
  };
};

/**
 * Unified buffer tracker for queuing telemetry events.
 * Groups events and flushes every 5 seconds.
 */
export const trackTelemetry = (payload) => {
  const enrichedPayload = {
    ...getClientMetrics(),
    ...payload,
    sessionId: getSessionId(),
    journeyId: getJourneyId(),
    deviceId: getDeviceId(),
    timestamp: new Date().toISOString()
  };

  eventQueue.push(enrichedPayload);
};

/**
 * Performs actual batched HTTP upload of the events queue.
 */
export const flushTelemetryQueue = async () => {
  if (eventQueue.length === 0) return;
  const eventsToSend = [...eventQueue];
  eventQueue = [];

  const BACKEND_URL = typeof window !== "undefined" && ["localhost", "127.0.0.1", "::1", "[::1]"].includes(window.location.hostname)
    ? `http://${window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname}:5000`
    : "";
  const token = localStorage.getItem("kaevrix_token");

  try {
    const res = await fetch(`${BACKEND_URL}/api/telemetry/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify(eventsToSend)
    });
    
    if (!res.ok) {
      console.warn("[Telemetry] Failed to flush batch events");
    }
  } catch (err) {
    console.warn("[Telemetry] Error during telemetry batch upload:", err);
  }
};

// Setup background interval flusher and immediate flusher on tab unload
if (typeof window !== "undefined") {
  // Flush batch queue periodically
  setInterval(flushTelemetryQueue, FLUSH_INTERVAL_MS);

  const flushImmediate = () => {
    if (eventQueue.length === 0) return;
    const BACKEND_URL = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(window.location.hostname)
      ? `http://${window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname}:5000`
      : "";
    const url = `${BACKEND_URL}/api/telemetry/track`;
    const payloadBlob = new Blob([JSON.stringify(eventQueue)], { type: "application/json" });
    
    // Clear queue to ensure no double sends
    eventQueue = [];
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, payloadBlob);
    } else {
      fetch(url, {
        method: "POST",
        body: payloadBlob,
        keepalive: true
      }).catch(() => {});
    }
  };

  // Immediate upload triggers
  window.addEventListener("beforeunload", flushImmediate);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushImmediate();
    }
  });
}
