import AITracking from "../models/AITracking.js";
import SecurityEvent from "../models/SecurityEvent.js";
import redisClient from "../config/redis.js";

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

  const totalCost = globalTracker.estimatedCostUSD;

  // Cache global cost in Redis for kill switch checking
  const key = `ai:monthly_cost:${currentMonth}`;
  await redisClient.set(key, String(totalCost), "EX", 3600); // 1 hour TTL

  // Check budget thresholds
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
    }).catch(() => {});
    console.error(`[CRITICAL] AI Budget Alert: ${threshold} consumed. Cost: $${currentCost}`);
  }
}

export async function checkKillSwitch() {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const key = `ai:monthly_cost:${currentMonth}`;
  try {
    const cachedCost = await redisClient.get(key);
    if (cachedCost !== null) {
      return parseFloat(cachedCost) >= MONTHLY_AI_BUDGET_USD;
    }
    const globalTracker = await AITracking.findOne({ date: currentMonth, userId: null, endpoint: "GLOBAL_MONTHLY" });
    const cost = globalTracker ? globalTracker.estimatedCostUSD : 0;
    await redisClient.set(key, String(cost), "EX", 60); // Cache for 60s
    return cost >= MONTHLY_AI_BUDGET_USD;
  } catch (err) {
    console.error("Error checking kill switch:", err);
    return false;
  }
}
