import AITracking from "../models/AITracking.js";
import SecurityEvent from "../models/SecurityEvent.js";

const MONTHLY_AI_BUDGET_USD = process.env.MONTHLY_AI_BUDGET_USD ? parseFloat(process.env.MONTHLY_AI_BUDGET_USD) : 100.0;

// Gemini Flash 1.5 token costs (approximate)
const COST_PER_1M_INPUT_TOKENS = 0.35;
const COST_PER_1M_OUTPUT_TOKENS = 1.05;

export async function trackAICost(userId, endpoint, inputTokens, outputTokens) {
  const cost = ((inputTokens / 1000000) * COST_PER_1M_INPUT_TOKENS) + ((outputTokens / 1000000) * COST_PER_1M_OUTPUT_TOKENS);
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.substring(0, 7); // YYYY-MM

  // Track daily per-user usage
  if (userId) {
    await AITracking.findOneAndUpdate(
      { date: today, userId, endpoint },
      { $inc: { requestsCount: 1, estimatedInputTokens: inputTokens, estimatedOutputTokens: outputTokens, estimatedCostUSD: cost } },
      { upsert: true, new: true }
    );
  }

  // Track monthly global usage
  const globalTracker = await AITracking.findOneAndUpdate(
    { date: currentMonth, userId: null, endpoint: "GLOBAL_MONTHLY" },
    { $inc: { requestsCount: 1, estimatedInputTokens: inputTokens, estimatedOutputTokens: outputTokens, estimatedCostUSD: cost } },
    { upsert: true, new: true }
  );

  // Check budget thresholds
  const totalCost = globalTracker.estimatedCostUSD;
  
  if (totalCost >= MONTHLY_AI_BUDGET_USD * 1.0) {
    await logBudgetAlert("100%", totalCost);
  } else if (totalCost >= MONTHLY_AI_BUDGET_USD * 0.95) {
    await logBudgetAlert("95%", totalCost);
  } else if (totalCost >= MONTHLY_AI_BUDGET_USD * 0.90) {
    await logBudgetAlert("90%", totalCost);
  } else if (totalCost >= MONTHLY_AI_BUDGET_USD * 0.80) {
    await logBudgetAlert("80%", totalCost);
  }
}

async function logBudgetAlert(threshold, currentCost) {
  // Prevent spamming the db for the same threshold continuously
  const recentAlert = await SecurityEvent.findOne({
    eventType: "AI_BUDGET_ALERT",
    "details.threshold": threshold,
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });

  if (!recentAlert) {
    await SecurityEvent.create({
      ipAddress: "system",
      endpoint: "budget_tracker",
      eventType: "AI_BUDGET_ALERT",
      details: { threshold, currentCost, budget: MONTHLY_AI_BUDGET_USD }
    });
    console.error(`[CRITICAL] AI Budget Alert: ${threshold} consumed. Cost: $${currentCost}`);
  }
}

export async function checkKillSwitch() {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const globalTracker = await AITracking.findOne({ date: currentMonth, userId: null, endpoint: "GLOBAL_MONTHLY" });
  if (globalTracker && globalTracker.estimatedCostUSD >= MONTHLY_AI_BUDGET_USD) {
    return true; // Kill switch activated
  }
  return false;
}
