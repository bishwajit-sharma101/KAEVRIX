// Centralized telemetry manager for generating and preserving session & journey tracking IDs.
export const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const SESSION_KEY = "kaevrix_session_id";
const JOURNEY_KEY = "kaevrix_journey_id";

/**
 * Ensures a unique session ID exists for the current browser tab.
 * This is stored in sessionStorage and dies when the tab closes.
 */
export const getSessionId = () => {
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
  let journeyId = localStorage.getItem(JOURNEY_KEY);
  if (!journeyId) {
    journeyId = `journey_default_${generateUUID()}`;
    localStorage.setItem(JOURNEY_KEY, journeyId);
  }
  return journeyId;
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

/**
 * Unified fetch wrapper for sending telemetry to the backend, automatically injecting context.
 */
export const trackTelemetry = async (payload) => {
  const BACKEND_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
  const token = localStorage.getItem("kaevrix_token");
  
  const enrichedPayload = {
    ...payload,
    sessionId: getSessionId(),
    journeyId: getJourneyId(),
    // Allow payload to explicitly pass a correlationId, otherwise none
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/telemetry/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify(enrichedPayload)
    });
    
    if (!res.ok) {
      console.warn("[Telemetry] Failed to record event:", enrichedPayload.eventType);
    }
  } catch (err) {
    // Fail silently in prod so telemetry errors don't crash the app
    console.warn("[Telemetry] Error sending event:", err);
  }
};
