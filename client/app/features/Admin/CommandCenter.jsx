import React, { useState, useEffect } from "react";
import "./CommandCenter.css";

export default function CommandCenter({ backendUrl, onExit }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Entire operational state
  const [data, setData] = useState({
    overview: null,
    reliability: null,
    aiDetail: null,
    behavior: null,
    activity: [],
    errors: [],
    sessions: null,
    securityStats: null,
    securityStream: [],
    config: [],
    health: null
  });

  // Journey Reconstructor States
  const [journeyQuery, setJourneyQuery] = useState("");
  const [journeyType, setJourneyType] = useState("username");
  const [journeyResults, setJourneyResults] = useState([]);
  const [searchingJourney, setSearchingJourney] = useState(false);
  const [expandedJourneyEvent, setExpandedJourneyEvent] = useState(null);

  // Config Flags Form
  const [configKey, setConfigKey] = useState("");
  const [configValue, setConfigValue] = useState("");
  const [updatingConfig, setUpdatingConfig] = useState(false);

  // Error Stack Viewport State
  const [expandedErrorId, setExpandedErrorId] = useState(null);

  const fetchAllData = async () => {
    const headers = { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}` };
    try {
      const [
        overviewRes,
        reliabilityRes,
        aiDetailRes,
        behaviorRes,
        activityRes,
        errorsRes,
        sessionsRes,
        securityStatsRes,
        securityStreamRes,
        configRes,
        healthRes
      ] = await Promise.all([
        fetch(`${backendUrl}/api/admin/overview`, { headers }),
        fetch(`${backendUrl}/api/admin/api-reliability`, { headers }),
        fetch(`${backendUrl}/api/admin/ai-failure-intelligence`, { headers }),
        fetch(`${backendUrl}/api/admin/behavior`, { headers }),
        fetch(`${backendUrl}/api/admin/activity-feed`, { headers }),
        fetch(`${backendUrl}/api/admin/error-center`, { headers }),
        fetch(`${backendUrl}/api/admin/sessions`, { headers }),
        fetch(`${backendUrl}/api/admin/security-stats`, { headers }),
        fetch(`${backendUrl}/api/admin/security-stream`, { headers }),
        fetch(`${backendUrl}/api/admin/config`, { headers }),
        fetch(`${backendUrl}/api/admin/health`, { headers })
      ]);

      if (overviewRes.status === 401 || overviewRes.status === 403) {
        throw new Error("ACCESS DENIED");
      }

      setData({
        overview: await overviewRes.json(),
        reliability: await reliabilityRes.json(),
        aiDetail: await aiDetailRes.json(),
        behavior: await behaviorRes.json(),
        activity: await activityRes.json(),
        errors: await errorsRes.json(),
        sessions: await sessionsRes.json(),
        securityStats: await securityStatsRes.json(),
        securityStream: await securityStreamRes.json(),
        config: await configRes.json(),
        health: await healthRes.json()
      });
      setLoading(false);
    } catch (err) {
      if (err.message === "ACCESS DENIED") {
        setError("ACCESS DENIED: INSUFFICIENT CLEARANCE");
      } else {
        setError("SYSTEM ERROR: FAILED TO ESTABLISH CONNECTION");
      }
    }
  };

  useEffect(() => {
    // Inject typography link if missing
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=JetBrains+Mono:wght@300;400;500;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    fetchAllData();
    const interval = setInterval(fetchAllData, 8000); // Poll live stats every 8s
    return () => clearInterval(interval);
  }, []);

  const handleKillSwitch = async (enable) => {
    const headers = { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`, "Content-Type": "application/json" };
    try {
      await fetch(`${backendUrl}/api/admin/ai-costs/kill-switch`, {
        method: "POST",
        headers,
        body: JSON.stringify({ enable })
      });
      fetchAllData();
    } catch (err) { console.error("Killswitch failed:", err); }
  };

  const handleToggleFlag = async (key, currentValue) => {
    const headers = { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`, "Content-Type": "application/json" };
    try {
      await fetch(`${backendUrl}/api/admin/config`, {
        method: "POST",
        headers,
        body: JSON.stringify({ key, value: !currentValue })
      });
      fetchAllData();
    } catch (err) { console.error("Flag toggle failed:", err); }
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    if (!configKey || !configValue) return;
    setUpdatingConfig(true);
    const headers = { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`, "Content-Type": "application/json" };
    try {
      let parsedValue = configValue;
      try {
        parsedValue = JSON.parse(configValue);
      } catch (e) {}

      await fetch(`${backendUrl}/api/admin/config`, {
        method: "POST",
        headers,
        body: JSON.stringify({ key: configKey.trim().toUpperCase(), value: parsedValue })
      });
      setConfigKey("");
      setConfigValue("");
      fetchAllData();
    } catch (err) {
      console.error("Config update failed:", err);
    } finally {
      setUpdatingConfig(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!window.confirm("Forcibly disconnect this player session and revoke their neuro-token?")) return;
    const headers = { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}`, "Content-Type": "application/json" };
    try {
      const res = await fetch(`${backendUrl}/api/admin/sessions/revoke`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId })
      });
      const resData = await res.json();
      if (resData.success) {
        fetchAllData();
      } else {
        alert("Failed to terminate session: " + resData.error);
      }
    } catch (err) { console.error("Session revoke failed:", err); }
  };

  const runJourneySearch = async (e) => {
    if (e) e.preventDefault();
    if (!journeyQuery.trim()) return;
    setSearchingJourney(true);
    setExpandedJourneyEvent(null);
    const headers = { "Authorization": `Bearer ${localStorage.getItem("kaevrix_token")}` };
    try {
      const res = await fetch(`${backendUrl}/api/admin/journey/reconstruct?query=${encodeURIComponent(journeyQuery.trim())}&type=${journeyType}`, { headers });
      const journey = await res.json();
      setJourneyResults(journey);
    } catch (err) {
      console.error("Journey search failed:", err);
    } finally {
      setSearchingJourney(false);
    }
  };

  if (error) {
    return (
      <div className="cc-denied-screen">
        <div className="cc-glitch" data-text={error}>{error}</div>
        <button onClick={onExit} className="cc-denied-btn">RETURN TO SAFETY</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cc-loading-screen">
        <div className="cc-loader"></div>
        <div className="cc-loading-text">INITIALIZING MISSION CONTROL HUB...</div>
      </div>
    );
  }

  const { overview, reliability, aiDetail, behavior, activity, errors, sessions, securityStats, securityStream, config, health } = data;

  // Simple browser parser for session descriptions
  const cleanUserAgent = (ua) => {
    if (!ua) return "Unknown System";
    if (ua.includes("Chrome")) return "Google Chrome";
    if (ua.includes("Firefox")) return "Mozilla Firefox";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Apple Safari";
    if (ua.includes("Postman")) return "Postman Client";
    if (ua.includes("WindowsPowerShell")) return "PowerShell Shell";
    return ua.substring(0, 30) + "...";
  };

  // ----------------------------------------------------
  // OVERVIEW TAB
  // ----------------------------------------------------
  const renderOverviewTab = () => (
    <div className="cc-dashboard-grid">
      {/* HUD Cards */}
      <div className="cc-card col-span-3 glow-border-orange">
        <div className="cc-card-subtitle">TOTAL ACCOUNTS</div>
        <div className="cc-metric-value">{overview?.totalUsers}</div>
        <div className="cc-metric-trend cc-trend-up">↑ +{overview?.newRegsToday} Today</div>
      </div>
      <div className="cc-card col-span-3 glow-border-blue">
        <div className="cc-card-subtitle">ACTIVE NEURAL LINKS</div>
        <div className="cc-metric-value cc-blue-text">{sessions?.activeSessions || 0}</div>
        <div className="cc-metric-trend cc-trend-up"><span className="cc-live-indicator"></span>Active</div>
      </div>
      <div className="cc-card col-span-3 glow-border-gold">
        <div className="cc-card-subtitle">GLOBAL XP EARNED</div>
        <div className="cc-metric-value cc-gold-text">{overview?.totalXP?.toLocaleString()}</div>
        <div className="cc-metric-trend cc-trend-up">Total</div>
      </div>
      <div className="cc-card col-span-3 glow-border-purple">
        <div className="cc-card-subtitle">API SUCCESS RATE</div>
        <div className="cc-metric-value cc-purple-text">{overview?.successRate}%</div>
        <div className="cc-metric-trend cc-trend-up">HTTP Inbound</div>
      </div>

      {/* Funnel Pipeline */}
      <div className="cc-card col-span-7">
        <div className="cc-card-header">
          <div className="cc-card-title">LEARNING PIPELINE CONVERSION</div>
          <div className="cc-card-subtitle">Pathfinder user onboarding funnel drops</div>
        </div>
        <div className="cc-funnel-container">
          <div className="cc-funnel-step">
            <div className="cc-funnel-count">{behavior?.funnel?.signups || 0}</div>
            <div className="cc-funnel-label">Signups</div>
          </div>
          <div className="cc-funnel-arrow">
            <span>{behavior?.funnel?.signups > 0 ? Math.round((behavior?.funnel?.roadmapsGenerated / behavior?.funnel?.signups) * 100) : 0}%</span>
            →
          </div>
          <div className="cc-funnel-step">
            <div className="cc-funnel-count">{behavior?.funnel?.roadmapsGenerated || 0}</div>
            <div className="cc-funnel-label">Roadmaps</div>
          </div>
          <div className="cc-funnel-arrow">
            <span>{behavior?.funnel?.roadmapsGenerated > 0 ? Math.round((behavior?.funnel?.nodesOpened / behavior?.funnel?.roadmapsGenerated) * 100) : 0}%</span>
            →
          </div>
          <div className="cc-funnel-step">
            <div className="cc-funnel-count">{behavior?.funnel?.nodesOpened || 0}</div>
            <div className="cc-funnel-label">Nodes Opened</div>
          </div>
          <div className="cc-funnel-arrow">
            <span>{behavior?.funnel?.nodesOpened > 0 ? Math.round((behavior?.funnel?.nodesCompleted / behavior?.funnel?.nodesOpened) * 100) : 0}%</span>
            →
          </div>
          <div className="cc-funnel-step">
            <div className="cc-funnel-count">{behavior?.funnel?.nodesCompleted || 0}</div>
            <div className="cc-funnel-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Telemetry Grid Performance */}
      <div className="cc-card col-span-5">
        <div className="cc-card-header">
          <div className="cc-card-title">TELEMETRY GRID PIPELINE</div>
          <div className="cc-card-subtitle">Ingress and Caught Exception count</div>
        </div>
        <div className="cc-health-list">
          <div className="cc-health-item">
            <span>Total Logged Events</span>
            <strong className="cc-monospace">{overview?.totalEventsCount?.toLocaleString()}</strong>
          </div>
          <div className="cc-health-item">
            <span>Writes Flow (WPM)</span>
            <strong className="cc-monospace cc-orange-text">{overview?.writesPerMinute} events/min</strong>
          </div>
          <div className="cc-health-item">
            <span>Average AI Response Latency</span>
            <strong className="cc-monospace cc-blue-text">{overview?.averageAiLatencyMs} ms</strong>
          </div>
          <div className="cc-health-item">
            <span>Client Intercept Errors</span>
            <strong className={`cc-monospace ${overview?.clientErrorsCount > 0 ? 'cc-red-text' : ''}`}>{overview?.clientErrorsCount}</strong>
          </div>
          <div className="cc-health-item">
            <span>Server Caught API Errors</span>
            <strong className={`cc-monospace ${overview?.apiErrorsCount > 0 ? 'cc-red-text' : ''}`}>{overview?.apiErrorsCount}</strong>
          </div>
        </div>
      </div>

      {/* Top Accounts */}
      <div className="cc-card col-span-12">
        <div className="cc-card-header">
          <div className="cc-card-title">TOP USERS (BY XP)</div>
          <div className="cc-card-subtitle">Leaderboard profiles details</div>
        </div>
        <table className="cc-table">
          <thead>
            <tr>
              <th>Gamer Tag</th>
              <th>Rank Tier</th>
              <th>Total XP</th>
              <th>Watch Time</th>
            </tr>
          </thead>
          <tbody>
            {behavior?.topUsers?.map(u => (
              <tr key={u._id}>
                <td><strong>{u.username}</strong></td>
                <td><span className="cc-level-badge">LVL {u.level}</span></td>
                <td className="cc-gold-text cc-monospace">{u.xp?.toLocaleString()} XP</td>
                <td>{Math.floor((u.totalWatchTime || 0)/60)} minutes</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // API RELIABILITY TAB
  // ----------------------------------------------------
  const renderApiTab = () => (
    <div className="cc-dashboard-grid">
      <div className="cc-card col-span-3">
        <div className="cc-card-subtitle">TOTAL HTTP REQUESTS</div>
        <div className="cc-metric-value">{reliability?.totalRequests?.toLocaleString()}</div>
      </div>
      <div className="cc-card col-span-3">
        <div className="cc-card-subtitle">SUCCESS RATE</div>
        <div className="cc-metric-value cc-green-text">{reliability?.successRate}%</div>
      </div>
      <div className="cc-card col-span-3">
        <div className="cc-card-subtitle">CLIENT 4XX ERRORS</div>
        <div className="cc-metric-value cc-orange-text">{reliability?.err4xxRequests}</div>
      </div>
      <div className="cc-card col-span-3">
        <div className="cc-card-subtitle">SERVER 5XX FAILURES</div>
        <div className="cc-metric-value cc-red-text">{reliability?.err5xxRequests}</div>
      </div>

      {/* Endpoint Table */}
      <div className="cc-card col-span-7">
        <div className="cc-card-header">
          <div className="cc-card-title">ENDPOINT HEALTH STATISTICS</div>
          <div className="cc-card-subtitle">In-memory route statistics</div>
        </div>
        <div className="cc-scroll-table-container">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Route Method & Path</th>
                <th>Requests</th>
                <th>Success %</th>
                <th>4xx / 5xx</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(reliability?.endpointStats || {}).map(([key, stat]) => {
                const routeSuccessRate = stat.total > 0 ? Math.round((stat.success / stat.total) * 100) : 100;
                return (
                  <tr key={key}>
                    <td><strong className="cc-monospace cc-monospace-endpoint">{key}</strong></td>
                    <td className="cc-monospace">{stat.total}</td>
                    <td className="cc-monospace" style={{ color: routeSuccessRate >= 95 ? '#10b981' : routeSuccessRate >= 80 ? '#fbbf24' : '#ef4444' }}>
                      {routeSuccessRate}%
                    </td>
                    <td className="cc-monospace">
                      <span className="cc-orange-text">{stat.err4xx}</span> / <span className="cc-red-text">{stat.err5xx}</span>
                    </td>
                  </tr>
                );
              })}
              {Object.keys(reliability?.endpointStats || {}).length === 0 && (
                <tr>
                  <td colSpan="4" className="cc-table-empty">No API requests monitored yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent API Failures */}
      <div className="cc-card col-span-5">
        <div className="cc-card-header">
          <div className="cc-card-title">RECENT API FAILURES (LOG)</div>
          <div className="cc-card-subtitle">Rolling list of recent non-2xx responses</div>
        </div>
        <div className="cc-terminal-box">
          {reliability?.recentFailures?.map((fail, idx) => (
            <div key={idx} className="cc-terminal-row danger-text">
              <span className="cc-terminal-time">[{new Date(fail.timestamp).toLocaleTimeString()}]</span>
              <strong>{fail.method} {fail.url}</strong> ➔ status: <code>{fail.statusCode}</code> ➔ <span>{fail.message}</span>
            </div>
          ))}
          {reliability?.recentFailures?.length === 0 && (
            <div className="cc-terminal-empty">No API failures recorded. All endpoints operational.</div>
          )}
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // AI OPERATIONS & BUDGET TAB
  // ----------------------------------------------------
  const renderAiCostsTab = () => {
    const limitPercentage = Math.min(100, ((aiDetail?.monthlyCost || 0) / 100.0) * 100);
    const progressColor = limitPercentage >= 90 ? "#ef4444" : limitPercentage >= 75 ? "#ffb300" : "#10b981";

    return (
      <div className="cc-dashboard-grid">
        {/* Budget breakdown widgets */}
        <div className="cc-card col-span-3">
          <div className="cc-card-subtitle">MONTH Spend</div>
          <div className="cc-metric-value cc-gold-text">${aiDetail?.monthlyCost?.toFixed(4)}</div>
          <div className="cc-card-subtitle">Current Month Spend</div>
        </div>
        <div className="cc-card col-span-3">
          <div className="cc-card-subtitle">DAILY Spend (AVG)</div>
          <div className="cc-metric-value cc-blue-text">${aiDetail?.dailySpend?.toFixed(4)}</div>
          <div className="cc-card-subtitle">Burn Rate Per Day</div>
        </div>
        <div className="cc-card col-span-3">
          <div className="cc-card-subtitle">PROJECTED MONTH-END</div>
          <div className="cc-metric-value" style={{ color: aiDetail?.projectedSpend >= 100.0 ? '#ef4444' : '#a78bfa' }}>
            ${aiDetail?.projectedSpend?.toFixed(2)}
          </div>
          <div className="cc-card-subtitle">Est. Monthly Total</div>
        </div>
        <div className="cc-card col-span-3">
          <div className="cc-card-subtitle">REMAINING BUDGET</div>
          <div className="cc-metric-value cc-green-text">${aiDetail?.remainingBudget?.toFixed(2)}</div>
          <div className="cc-card-subtitle">Limit: $100.00</div>
        </div>

        {/* Projections Meter */}
        <div className="cc-card col-span-6">
          <div className="cc-card-header">
            <div className="cc-card-title">BUDGET BURN METERS</div>
            <div className="cc-card-subtitle">Real-time expenditure tracking</div>
          </div>
          <div style={{ marginTop: "10px" }}>
            <span className="cc-card-subtitle">Monthly Incurred: ${(aiDetail?.monthlyCost || 0).toFixed(4)} / $100.00</span>
            <div className="cc-budget-progress-container" style={{ margin: "10px 0 20px" }}>
              <div className="cc-budget-progress-bar" style={{ width: `${limitPercentage}%`, backgroundColor: progressColor }}></div>
            </div>
            
            <span className="cc-card-subtitle">Projected Burn: ${(aiDetail?.projectedSpend || 0).toFixed(2)} / $100.00</span>
            <div className="cc-budget-progress-container" style={{ margin: "10px 0 10px" }}>
              <div className="cc-budget-progress-bar" style={{ 
                width: `${Math.min(100, ((aiDetail?.projectedSpend || 0) / 100.0) * 100)}%`, 
                backgroundColor: aiDetail?.projectedSpend >= 100.0 ? '#ef4444' : '#0ea5e9' 
              }}></div>
            </div>
          </div>
        </div>

        {/* Emergency Kill Switches */}
        <div className="cc-card col-span-6">
          <div className="cc-card-header">
            <div className="cc-card-title">EMERGENCY AI CONTROL CONSOLE</div>
            <div className="cc-card-subtitle">Manual overrides for AI services</div>
          </div>
          <div className="cc-killswitch-card-body">
            <p className="cc-killswitch-desc">
              If costs spiral or the API goes down, click below to deactivate raw Gemini/Ollama generation routes and fallback to structured template generation.
            </p>
            <button 
              className={`cc-kill-switch-btn ${aiDetail?.killSwitchEngaged ? 'safe' : 'danger'}`}
              onClick={() => handleKillSwitch(!aiDetail?.killSwitchEngaged)}
            >
              {aiDetail?.killSwitchEngaged ? 'RESTORE AI ORCHESTRATION' : 'ENGAGE GLOBAL AI KILL SWITCH'}
            </button>
          </div>
        </div>

        {/* Feature Allocation */}
        <div className="cc-card col-span-4">
          <div className="cc-card-header">
            <div className="cc-card-title">COST PER FEATURE CHANNEL</div>
            <div className="cc-card-subtitle">Budget allocation by category</div>
          </div>
          <div className="cc-engagement-detail-list">
            <div className="cc-detail-row">
              <span>Pathfinder Onboarding</span>
              <strong className="cc-monospace cc-purple-text">${aiDetail?.features?.pathfinder?.toFixed(4)}</strong>
            </div>
            <div className="cc-detail-row">
              <span>Study Notes Generation</span>
              <strong className="cc-monospace cc-blue-text">${aiDetail?.features?.notes?.toFixed(4)}</strong>
            </div>
            <div className="cc-detail-row">
              <span>Quiz & Assessment Generator</span>
              <strong className="cc-monospace cc-gold-text">${aiDetail?.features?.quiz?.toFixed(4)}</strong>
            </div>
            <div className="cc-detail-row">
              <span>Other AI endpoints</span>
              <strong className="cc-monospace">${aiDetail?.features?.other?.toFixed(4)}</strong>
            </div>
          </div>
        </div>

        {/* Latency Stats */}
        <div className="cc-card col-span-4">
          <div className="cc-card-header">
            <div className="cc-card-title">AI PERFORMANCE AUDIT</div>
            <div className="cc-card-subtitle">Request failures & provider metrics</div>
          </div>
          <div className="cc-health-list">
            <div className="cc-health-item">
              <span>Success Logs</span>
              <strong className="cc-monospace cc-green-text">{aiDetail?.totalExecuted} requests</strong>
            </div>
            <div className="cc-health-item">
              <span>Failure Logs</span>
              <strong className="cc-monospace cc-red-text">{aiDetail?.totalFailed} requests</strong>
            </div>
            <div className="cc-health-item">
              <span>Fail Rate %</span>
              <strong className="cc-monospace">{aiDetail?.failureRate}%</strong>
            </div>
            <div className="cc-health-item">
              <span>AI Server Timeouts</span>
              <strong className="cc-monospace cc-orange-text">{aiDetail?.timeoutsCount} counts</strong>
            </div>
            <div className="cc-health-item">
              <span>Slowest Model</span>
              <strong className="cc-monospace cc-red-text">{aiDetail?.slowestModel ? `${aiDetail.slowestModel.name} (${aiDetail.slowestModel.latency}ms)` : 'None'}</strong>
            </div>
          </div>
        </div>

        {/* Budget Alerts History */}
        <div className="cc-card col-span-4">
          <div className="cc-card-header">
            <div className="cc-card-title">BUDGET THRESHOLD ALERTS</div>
            <div className="cc-card-subtitle">Automated warnings history</div>
          </div>
          <div className="cc-terminal-box" style={{ height: "180px" }}>
            {aiDetail?.warningEvents?.map((evt, idx) => (
              <div key={idx} className="cc-terminal-row warning-text">
                <span className="cc-terminal-time">[{new Date(evt.timestamp).toLocaleDateString()}]</span>
                <span>Threshold: <code>{evt.details?.threshold}</code> reached. Cost: ${evt.details?.currentCost?.toFixed(2)}</span>
              </div>
            ))}
            {aiDetail?.warningEvents?.length === 0 && (
              <div className="cc-terminal-empty">No budget threshold warnings triggered.</div>
            )}
          </div>
        </div>

        {/* Provider Comparison */}
        <div className="cc-card col-span-6">
          <div className="cc-card-header">
            <div className="cc-card-title">AI PROVIDER PERFORMANCE COMPARISON</div>
            <div className="cc-card-subtitle">Active AI endpoints benchmark</div>
          </div>
          <table className="cc-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Requests</th>
                <th>Average Latency</th>
              </tr>
            </thead>
            <tbody>
              {aiDetail?.providerStats?.map((prov, idx) => (
                <tr key={idx}>
                  <td><span className={`cc-tag ${prov._id === 'gemini' ? 'tag-purple' : 'tag-orange'}`}>{prov._id}</span></td>
                  <td className="cc-monospace">{prov.count}</td>
                  <td className="cc-blue-text cc-monospace">{Math.round(prov.avgLatency)} ms</td>
                </tr>
              ))}
              {(!aiDetail?.providerStats || aiDetail.providerStats.length === 0) && (
                <tr>
                  <td colSpan="3" className="cc-table-empty">No provider benchmark logs.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Endpoint Costs Table */}
        <div className="cc-card col-span-6">
          <div className="cc-card-header">
            <div className="cc-card-title">ENDPOINT CUMULATIVE CHARGES</div>
            <div className="cc-card-subtitle">Monthly bills per route</div>
          </div>
          <table className="cc-table">
            <thead>
              <tr>
                <th>Route Path</th>
                <th>Calls</th>
                <th>Monthly Charge</th>
              </tr>
            </thead>
            <tbody>
              {aiDetail?.endpointCosts?.map((ec, idx) => (
                <tr key={idx}>
                  <td><strong className="cc-monospace cc-monospace-endpoint">{ec.endpoint}</strong></td>
                  <td className="cc-monospace">{ec.requestsCount}</td>
                  <td className="cc-gold-text cc-monospace">${ec.estimatedCostUSD?.toFixed(4)}</td>
                </tr>
              ))}
              {(!aiDetail?.endpointCosts || aiDetail.endpointCosts.length === 0) && (
                <tr>
                  <td colSpan="3" className="cc-table-empty">No endpoint billing logs.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // USER ACTIVITY FEED TAB
  // ----------------------------------------------------
  const renderActivityTab = () => (
    <div className="cc-dashboard-grid" style={{ height: "100%" }}>
      <div className="cc-card col-span-12" style={{ height: "calc(100vh - 200px)", padding: 0, overflow: "hidden" }}>
        <div className="cc-card-header" style={{ padding: "28px 28px 0" }}>
          <div className="cc-card-title">REAL-TIME USER ACTIVITY FEED</div>
          <div className="cc-card-subtitle">Scrolling stream of student interactions and roadmap progression</div>
        </div>
        <div className="cc-event-stream" style={{ margin: "20px", height: "calc(100% - 110px)" }}>
          {activity?.map((evt, idx) => {
            let badgeClass = "cc-event-info";
            if (evt.eventType.includes("COMPLETED") || evt.eventType.includes("PASSED")) badgeClass = "cc-event-info";
            else if (evt.eventType.includes("FAILED")) badgeClass = "cc-event-critical";
            else if (evt.eventType.includes("XP") || evt.eventType.includes("LEVEL")) badgeClass = "cc-event-warning";

            return (
              <div key={evt._id || idx} className={`cc-event-row ${badgeClass}`}>
                <span className="cc-event-time">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                <span className="cc-event-type">[{evt.eventType}]</span>
                <span className="cc-event-user">{evt.username}</span>
                <span className="cc-event-ip" style={{ textAlign: "right" }}>
                  {evt.journeyId ? `Journey: ${evt.journeyId.substring(0, 18)}...` : "No Journey ID"}
                </span>
              </div>
            );
          })}
          {activity?.length === 0 && (
            <div className="cc-stream-empty">No recent activity logged by students.</div>
          )}
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // OPERATIONAL ERROR CENTER TAB
  // ----------------------------------------------------
  const renderErrorsTab = () => (
    <div className="cc-dashboard-grid">
      <div className="cc-card col-span-12">
        <div className="cc-card-header">
          <div className="cc-card-title">OPERATIONAL ERROR CENTER</div>
          <div className="cc-card-subtitle">Tabular diagnostics stream of caught exceptions & client logs</div>
        </div>
        <table className="cc-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event/Error Type</th>
              <th>Active User</th>
              <th>Route/File</th>
              <th>Message</th>
              <th>Inspection</th>
            </tr>
          </thead>
          <tbody>
            {errors?.map((errItem) => {
              const isExpanded = expandedErrorId === errItem._id;
              return (
                <React.Fragment key={errItem._id}>
                  <tr>
                    <td className="cc-monospace">{new Date(errItem.timestamp).toLocaleTimeString()}</td>
                    <td><span className="cc-tag tag-orange">{errItem.eventType}</span></td>
                    <td><strong>{errItem.username || "anonymous"}</strong></td>
                    <td className="cc-monospace">{errItem.pagePath || "client-side"}</td>
                    <td className="cc-red-text">{errItem.metadata?.message || errItem.metadata?.errorMessage || "Unknown error"}</td>
                    <td>
                      <button 
                        className="cc-config-btn" 
                        style={{ padding: "4px 10px" }}
                        onClick={() => setExpandedErrorId(isExpanded ? null : errItem._id)}
                      >
                        {isExpanded ? "COLLAPSE" : "INSPECT STACK"}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan="6" style={{ background: "rgba(0,0,0,0.3)", padding: "16px 28px" }}>
                        <div className="cc-json-title">STACK TRACE (ADMIN SECURITY COGNIZANCE):</div>
                        <pre className="cc-json-pre" style={{ color: "#ef4444", fontSize: "11px", whiteSpace: "pre-wrap" }}>
                          {errItem.metadata?.stack || "No stack trace generated for this caught warning."}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {errors?.length === 0 && (
              <tr>
                <td colSpan="6" className="cc-table-empty">No platform exceptions logged. System operating inside design parameters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // NEURAL LINKS (SESSION OPERATIONS) TAB
  // ----------------------------------------------------
  const renderSessionsTab = () => (
    <div className="cc-dashboard-grid">
      {/* Sessions Per User */}
      <div className="cc-card col-span-4">
        <div className="cc-card-header">
          <div className="cc-card-title">CONCURRENT SESSIONS PER USER</div>
          <div className="cc-card-subtitle">Active logins distribution</div>
        </div>
        <table className="cc-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Open Sessions</th>
            </tr>
          </thead>
          <tbody>
            {sessions?.sessionsPerUser?.map((item, idx) => (
              <tr key={idx}>
                <td><strong>{item.username}</strong></td>
                <td className="cc-monospace cc-blue-text">{item.count} open</td>
              </tr>
            ))}
            {(!sessions?.sessionsPerUser || sessions.sessionsPerUser.length === 0) && (
              <tr>
                <td colSpan="2" className="cc-table-empty">No concurrent sessions.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Revoke Sessions Grid */}
      <div className="cc-card col-span-8">
        <div className="cc-card-header">
          <div className="cc-card-title">ACTIVE PLATFORM SESSIONS</div>
          <div className="cc-card-subtitle">Neural links with terminal controls</div>
        </div>
        <div className="cc-scroll-table-container" style={{ maxHeight: "400px" }}>
          <table className="cc-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Username</th>
                <th>IP Address</th>
                <th>Device Client</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions?.recent?.map((sess) => (
                <tr key={sess._id}>
                  <td className="cc-monospace" style={{ fontSize: "11px" }}>{sess._id.substring(0, 10)}...</td>
                  <td><strong>{sess.userId?.username || "unknown"}</strong></td>
                  <td className="cc-monospace">{sess.ipAddress}</td>
                  <td><span className="cc-card-subtitle">{cleanUserAgent(sess.userAgent)}</span></td>
                  <td>
                    <button 
                      onClick={() => handleRevokeSession(sess._id)}
                      className="cc-exit-btn"
                      style={{ padding: "6px 12px", background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.2)", fontSize: "11px" }}
                    >
                      REVOKE LINK
                    </button>
                  </td>
                </tr>
              ))}
              {(!sessions?.recent || sessions.recent.length === 0) && (
                <tr>
                  <td colSpan="5" className="cc-table-empty">No active logins found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // SECURITY & ABUSE TAB
  // ----------------------------------------------------
  const renderSecurityTab = () => (
    <div className="cc-dashboard-grid">
      {/* Security overview cards */}
      <div className="cc-card col-span-2">
        <div className="cc-card-subtitle">SUCCESS LOGINS</div>
        <div className="cc-metric-value cc-green-text">{securityStats?.successfulLogins}</div>
      </div>
      <div className="cc-card col-span-2">
        <div className="cc-card-subtitle">FAILED LOGINS</div>
        <div className="cc-metric-value cc-orange-text">{securityStats?.failedLogins}</div>
      </div>
      <div className="cc-card col-span-2">
        <div className="cc-card-subtitle">LOCKOUTS</div>
        <div className="cc-metric-value cc-red-text">{securityStats?.lockouts}</div>
      </div>
      <div className="cc-card col-span-2">
        <div className="cc-card-subtitle">CC DENIALS</div>
        <div className="cc-metric-value cc-red-text">{securityStats?.ccAccessDenied}</div>
      </div>
      <div className="cc-card col-span-2">
        <div className="cc-card-subtitle">MFA FAILURES</div>
        <div className="cc-metric-value cc-orange-text">{securityStats?.mfaFailures}</div>
      </div>
      <div className="cc-card col-span-2">
        <div className="cc-card-subtitle">PASSWORD RESETS</div>
        <div className="cc-metric-value">{securityStats?.passwordResets}</div>
      </div>

      {/* Abuse lists */}
      <div className="cc-card col-span-4">
        <div className="cc-card-header">
          <div className="cc-card-title">TOP OFFENDING IPS</div>
          <div className="cc-card-subtitle">Rate limit triggers count</div>
        </div>
        <table className="cc-table">
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Blocks</th>
            </tr>
          </thead>
          <tbody>
            {behavior?.topIPs?.map((ip, idx) => (
              <tr key={idx}>
                <td className="cc-monospace"><strong>{ip._id}</strong></td>
                <td className="cc-monospace cc-red-text">{ip.count} rate limits</td>
              </tr>
            ))}
            {(!behavior?.topIPs || behavior.topIPs.length === 0) && (
              <tr>
                <td colSpan="2" className="cc-table-empty">No offending IP records.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cc-card col-span-4">
        <div className="cc-card-header">
          <div className="cc-card-title">TOP OFFENDING USERS</div>
          <div className="cc-card-subtitle">Rate limit triggers count</div>
        </div>
        <table className="cc-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Blocks</th>
            </tr>
          </thead>
          <tbody>
            {behavior?.topOffenders?.map((user, idx) => (
              <tr key={idx}>
                <td><strong>{user._id || "anonymous"}</strong></td>
                <td className="cc-monospace cc-red-text">{user.count} rate limits</td>
              </tr>
            ))}
            {(!behavior?.topOffenders || behavior.topOffenders.length === 0) && (
              <tr>
                <td colSpan="2" className="cc-table-empty">No offending user records.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cc-card col-span-4">
        <div className="cc-card-header">
          <div className="cc-card-title">MOST ABUSED ENDPOINTS</div>
          <div className="cc-card-subtitle">Blocked URLs frequencies</div>
        </div>
        <table className="cc-table">
          <thead>
            <tr>
              <th>Endpoint URL</th>
              <th>Blocks</th>
            </tr>
          </thead>
          <tbody>
            {behavior?.topEndpoints?.map((ep, idx) => (
              <tr key={idx}>
                <td className="cc-monospace cc-monospace-endpoint">{ep._id}</td>
                <td className="cc-monospace cc-red-text">{ep.count} rate limits</td>
              </tr>
            ))}
            {(!behavior?.topEndpoints || behavior.topEndpoints.length === 0) && (
              <tr>
                <td colSpan="2" className="cc-table-empty">No endpoints blocked.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Security Event Stream */}
      <div className="cc-card col-span-12" style={{ padding: 0 }}>
        <div className="cc-card-header" style={{ padding: "28px 28px 0" }}>
          <div className="cc-card-title">LIVE SECURITY EVENT STREAM</div>
          <div className="cc-card-subtitle">Real-time locks, authentication failures, and alerts</div>
        </div>
        <div className="cc-event-stream" style={{ margin: "20px", height: "250px" }}>
          {securityStream?.map((evt, idx) => (
            <div key={evt._id || idx} className={`cc-event-row cc-event-${evt.severity ? evt.severity.toLowerCase() : 'info'}`}>
              <span className="cc-event-time">{new Date(evt.timestamp).toLocaleTimeString()}</span>
              <span className="cc-event-type">[{evt.eventType}]</span>
              <span className="cc-event-user">{evt.username || "SYSTEM"}</span>
              <span className="cc-event-ip">{evt.ipAddress}</span>
            </div>
          ))}
          {securityStream?.length === 0 && (
            <div className="cc-stream-empty">No security logging recorded. System parameters secured.</div>
          )}
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // SYSTEM & FEATURE FLAGS TAB
  // ----------------------------------------------------
  const renderSystemTab = () => {
    // Group system config flags for the dashboard
    const displayFlags = [
      // --- Platform Core ---
      { label: "User Registrations", flagKey: "REGISTRATION_DISABLED", desc: "Block new registrations in welcoming page", badgeColor: "purple" },
      { label: "Pathfinder Onboarding", flagKey: "PATHFINDER_DISABLED", desc: "Block Pathfinder onboarding answers form", badgeColor: "orange" },
      { label: "Profile Tab", flagKey: "PROFILE_DISABLED", desc: "Lock user profile tab access", badgeColor: "purple" },
      { label: "Chronos Analytics", flagKey: "CHRONOS_DISABLED", desc: "Lock Chronos analytics tab access", badgeColor: "blue" },
      { label: "Study History", flagKey: "HISTORY_DISABLED", desc: "Lock History tab access", badgeColor: "gold" },
      { label: "Global Rankings", flagKey: "RANKINGS_DISABLED", desc: "Lock global leaderboard rankings tab", badgeColor: "blue" },
      { label: "Command Center Gate", flagKey: "COMMAND_CENTER_DISABLED", desc: "Revoke command center access from dashboard", badgeColor: "red" },
      { label: "Onboarding Waitlist", flagKey: "WAITLIST_ENABLED", desc: "Redirect new registrations to waitlists", badgeColor: "blue" },
      // --- Matchmaking & Arena ---
      { label: "Clash Arena", flagKey: "CLASH_DISABLED", desc: "Lock Arena matchmaking duel entry", badgeColor: "red" },
      { label: "Multiplayer Sanctum", flagKey: "SANCTUM_DISABLED", desc: "Lock Sanctum boss fight challenges", badgeColor: "red" },
      // --- AI & Study ---
      { label: "AI Route Generators", flagKey: "AI_KILL_SWITCH", desc: "Force offline stubs fallback on all AI routes", badgeColor: "red" },
      { label: "Quiz Generator", flagKey: "QUIZ_DISABLED", desc: "Block post-video quiz generations", badgeColor: "gold" },
      { label: "Roadmap Generation", flagKey: "ROADMAP_GEN_DISABLED", desc: "Block generating new Pathfinder roadmaps", badgeColor: "orange" },
      { label: "Notes & Quiz Generation", flagKey: "NOTES_GEN_DISABLED", desc: "Block AI study notes and quiz generation in Solo Study", badgeColor: "orange" },
      { label: "Telemetry Pipeline", flagKey: "TELEMETRY_DISABLED", desc: "Suppress database telemetry logs ingestion", badgeColor: "purple" },
      // --- Community ---
      { label: "Community Tab", flagKey: "COMMUNITY_DISABLED", desc: "Lock Community tab access entirely", badgeColor: "blue" },
      { label: "Direct Chat Messaging", flagKey: "CHAT_DISABLED", desc: "Block sending chat messages between users", badgeColor: "blue" },
      { label: "Friend Requests", flagKey: "FRIENDS_DISABLED", desc: "Block sending new friend requests", badgeColor: "purple" },
      { label: "Public Profile Views", flagKey: "PUBLIC_PROFILES_DISABLED", desc: "Block viewing other users' profile cards", badgeColor: "purple" },
    ];

    return (
      <div className="cc-dashboard-grid">
        {/* Flag Visibility Control */}
        <div className="cc-card col-span-7">
          <div className="cc-card-header">
            <div className="cc-card-title">GLOBAL FEATURE STATUS TOGGLES</div>
            <div className="cc-card-subtitle">Active platform toggles list</div>
          </div>
          
          <div className="cc-flags-grid">
            {displayFlags.map((item, idx) => {
              const matchedConfig = config?.find(c => c.key === item.flagKey);
              const isFlagActive = matchedConfig ? !!matchedConfig.value : false;
              const lastModified = matchedConfig ? new Date(matchedConfig.updatedAt || Date.now()).toLocaleDateString() : "Never";
              const modifiedBy = matchedConfig ? matchedConfig.updatedBy : "system";

              return (
                <div key={idx} className="cc-flag-row">
                  <div className="cc-flag-info">
                    <div className="cc-flag-label-row">
                      <strong>{item.label}</strong>
                      <span className={`cc-tag tag-${item.badgeColor}`} style={{ fontSize: "9px", padding: "1px 6px" }}>
                        {item.flagKey}
                      </span>
                    </div>
                    <span className="cc-card-subtitle">{item.desc}</span>
                    <div className="cc-flag-time">Modified: {lastModified} by {modifiedBy}</div>
                  </div>
                  
                  <button 
                    onClick={() => handleToggleFlag(item.flagKey, isFlagActive)}
                    className={`cc-flag-toggle-btn ${isFlagActive ? 'flag-disabled' : 'flag-enabled'}`}
                  >
                    {isFlagActive ? "OFFLINE / BLOCK" : "ACTIVE / ALLOW"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Configurations List & Flag Injector */}
        <div className="cc-card col-span-5">
          <div className="cc-card-header">
            <div className="cc-card-title">CONFIG DATABASE OVERRIDES</div>
            <div className="cc-card-subtitle">Flag injector terminal overrides</div>
          </div>
          
          <div className="cc-scroll-table-container" style={{ maxHeight: "250px" }}>
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Configuration Key</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {config?.map(c => (
                  <tr key={c._id}>
                    <td><strong className="cc-monospace">{c.key}</strong></td>
                    <td><span className="cc-monospace cc-config-val">{JSON.stringify(c.value)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form className="cc-config-form" onSubmit={handleUpdateConfig}>
            <div className="cc-form-title">Inject DB Configuration Override</div>
            <div className="cc-form-row">
              <input 
                type="text" 
                placeholder="Key (e.g. DAILY_XP_MAX)..."
                className="cc-form-input"
                value={configKey}
                onChange={(e) => setConfigKey(e.target.value)}
                required
              />
              <input 
                type="text" 
                placeholder="Value..."
                className="cc-form-input"
                value={configValue}
                onChange={(e) => setConfigValue(e.target.value)}
                required
              />
              <button type="submit" className="cc-config-btn" disabled={updatingConfig}>
                {updatingConfig ? "COMMIT..." : "INJECT"}
              </button>
            </div>
          </form>
        </div>

        {/* Server stats */}
        <div className="cc-card col-span-12">
          <div className="cc-card-header">
            <div className="cc-card-title">SERVER PROCESS DIAGNOSTICS</div>
            <div className="cc-card-subtitle">System environment memory and uptime stats</div>
          </div>
          <div className="cc-health-list" style={{ flexDirection: "row", flexWrap: "wrap", gap: "20px" }}>
            <div className="cc-health-item" style={{ flex: "1 1 200px" }}>
              <span>Database Connection Status</span>
              <strong className={`cc-monospace ${health?.mongodb === 'Connected' ? 'cc-green-text' : 'cc-red-text'}`}>{health?.mongodb}</strong>
            </div>
            <div className="cc-health-item" style={{ flex: "1 1 200px" }}>
              <span>API Gateway Health</span>
              <strong className="cc-monospace cc-green-text">{health?.api}</strong>
            </div>
            <div className="cc-health-item" style={{ flex: "1 1 200px" }}>
              <span>Mock Redis Cache</span>
              <strong className="cc-monospace cc-blue-text">{health?.redis}</strong>
            </div>
            <div className="cc-health-item" style={{ flex: "1 1 200px" }}>
              <span>Process Uptime</span>
              <strong className="cc-monospace">
                {Math.floor((health?.uptime || 0)/3600)}h {Math.floor(((health?.uptime || 0)%3600)/60)}m
              </strong>
            </div>
            <div className="cc-health-item" style={{ flex: "1 1 200px" }}>
              <span>Server Heap Memory Allocation</span>
              <strong className="cc-monospace">{health?.memoryUsedMb} MB / {health?.memoryTotalMb} MB</strong>
            </div>
            <div className="cc-health-item" style={{ flex: "1 1 200px" }}>
              <span>Core Service Version</span>
              <strong className="cc-monospace cc-orange-text">v{health?.version}</strong>
            </div>
          </div>
        </div>

        {/* Timeline Journey Reconstruction */}
        <div className="cc-card col-span-12" style={{ marginTop: "10px" }}>
          <div className="cc-card-header">
            <div className="cc-card-title">TIMELINE & JOURNEY RECONSTRUCTOR</div>
            <div className="cc-card-subtitle">Query and reconstruct chronological event pathways</div>
          </div>
          <form className="cc-search-form" onSubmit={runJourneySearch}>
            <div className="cc-search-group">
              <select 
                className="cc-search-select"
                value={journeyType}
                onChange={(e) => setJourneyType(e.target.value)}
              >
                <option value="username">Gamer Tag / Username</option>
                <option value="journeyId">Journey ID</option>
                <option value="sessionId">Session ID</option>
                <option value="eventType">Event Type</option>
              </select>
              <input 
                type="text" 
                className="cc-search-input"
                placeholder="Enter query key (e.g. bishw, session_xxxx, journey_xxxx)..."
                value={journeyQuery}
                onChange={(e) => setJourneyQuery(e.target.value)}
              />
              <button type="submit" className="cc-search-btn" disabled={searchingJourney}>
                {searchingJourney ? "STREAMING..." : "RECONSTRUCT"}
              </button>
            </div>
          </form>

          {searchingJourney && (
            <div className="cc-timeline-loading">
              <div className="cc-timeline-loader"></div>
              <span>ASSEMBLING AUDIT CHRONOLOGY...</span>
            </div>
          )}

          {!searchingJourney && journeyResults.length === 0 && (
            <div className="cc-timeline-empty">
              <span>No telemetry trail matches found. Enter query above to pull Mongo collections.</span>
            </div>
          )}

          {!searchingJourney && journeyResults.length > 0 && (
            <div className="cc-timeline-tree" style={{ marginTop: "25px" }}>
              <div className="cc-timeline-line"></div>
              {journeyResults.map((evt, idx) => {
                const isExpanded = expandedJourneyEvent === evt._id;
                
                let categoryClass = "node-info";
                if (evt.eventType.includes("ERROR") || evt.eventType.includes("FAILED")) categoryClass = "node-danger";
                else if (evt.eventType.includes("AI_")) categoryClass = "node-ai";
                else if (evt.eventType.includes("XP_") || evt.eventType.includes("LEVEL_")) categoryClass = "node-progression";
                else if (evt.eventType.includes("VIDEO_")) categoryClass = "node-video";
                else if (evt.eventType.includes("QUIZ_")) categoryClass = "node-quiz";
                else if (evt.eventType.includes("SANCTUM_")) categoryClass = "node-sanctum";

                return (
                  <div key={evt._id || idx} className={`cc-timeline-node ${categoryClass} ${isExpanded ? 'expanded' : ''}`}>
                    <div className="cc-node-bullet"></div>
                    <div className="cc-node-content" onClick={() => setExpandedJourneyEvent(isExpanded ? null : evt._id)}>
                      <div className="cc-node-header">
                        <span className="cc-node-time">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                        <strong className="cc-node-title">{evt.eventType}</strong>
                        <span className="cc-node-user">User: {evt.username}</span>
                        {evt.pagePath && <span className="cc-node-path">{evt.pagePath}</span>}
                        <span className="cc-node-arrow-icon">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                      
                      {isExpanded && (
                        <div className="cc-node-details" onClick={(e) => e.stopPropagation()}>
                          <div className="cc-node-meta-grid">
                            <div><strong>Session ID:</strong> <span className="cc-monospace cc-copyable">{evt.sessionId || "none"}</span></div>
                            <div><strong>Journey ID:</strong> <span className="cc-monospace cc-copyable">{evt.journeyId || "none"}</span></div>
                            <div><strong>Correlation ID:</strong> <span className="cc-monospace cc-copyable">{evt.correlationId || "none"}</span></div>
                            <div><strong>IP Address:</strong> <span className="cc-monospace">{evt.ipAddress}</span></div>
                            <div><strong>Schema Version:</strong> <span className="cc-monospace">{evt.schemaVersion}</span></div>
                            <div><strong>User Agent:</strong> <span className="cc-monospace cc-ua-field">{evt.userAgent}</span></div>
                          </div>
                          
                          {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                            <div className="cc-node-json-block">
                              <div className="cc-json-title">Event Metadata Payload:</div>
                              <pre className="cc-json-pre">{JSON.stringify(evt.metadata, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActiveTab = () => {
    switch(activeTab) {
      case "overview": return renderOverviewTab();
      case "apiReliability": return renderApiTab();
      case "aiCosts": return renderAiCostsTab();
      case "activity": return renderActivityTab();
      case "errors": return renderErrorsTab();
      case "sessions": return renderSessionsTab();
      case "security": return renderSecurityTab();
      case "system": return renderSystemTab();
      default: return renderOverviewTab();
    }
  };

  return (
    <div className="cc-container">
      {/* SIDEBAR */}
      <div className="cc-sidebar">
        <div className="cc-sidebar-header">
          <div className="cc-logo-shield">🛡️</div>
          <div className="cc-sidebar-title">KAEVRIX HUD</div>
        </div>

        <div className="cc-nav-list">
          <div className={`cc-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <span className="cc-nav-icon">📊</span>
            <span>Platform Overview</span>
          </div>
          <div className={`cc-nav-item ${activeTab === 'apiReliability' ? 'active' : ''}`} onClick={() => setActiveTab('apiReliability')}>
            <span className="cc-nav-icon">📡</span>
            <span>API Reliability</span>
          </div>
          <div className={`cc-nav-item ${activeTab === 'aiCosts' ? 'active' : ''}`} onClick={() => setActiveTab('aiCosts')}>
            <span className="cc-nav-icon">🤖</span>
            <span>AI & Budget</span>
          </div>
          <div className={`cc-nav-item ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
            <span className="cc-nav-icon">📈</span>
            <span>User Activity</span>
          </div>
          <div className={`cc-nav-item ${activeTab === 'errors' ? 'active' : ''}`} onClick={() => setActiveTab('errors')}>
            <span className="cc-nav-icon">⚠️</span>
            <span>Error Center</span>
          </div>
          <div className={`cc-nav-item ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
            <span className="cc-nav-icon">🔌</span>
            <span>Session Control</span>
          </div>
          <div className={`cc-nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            <span className="cc-nav-icon">🛡️</span>
            <span>Security & Abuse</span>
          </div>
          <div className={`cc-nav-item ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
            <span className="cc-nav-icon">⚙️</span>
            <span>System Toggles</span>
          </div>
        </div>

        <div className="cc-sidebar-footer">
          <button className="cc-exit-btn" onClick={onExit}>
            <span>🚪</span> TERMINATE HUD LINK
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="cc-main-content">
        <div className="cc-topbar">
          <div>
            <div className="cc-page-subtitle">Platform Diagnostics Console</div>
            <div className="cc-page-title">
              {activeTab === 'overview' && "Mission Overview HUD"}
              {activeTab === 'apiReliability' && "API Gateway & Inbound Reliability"}
              {activeTab === 'aiCosts' && "AI Resource Billing & Quotas"}
              {activeTab === 'activity' && "Real-Time User Activity Ingress"}
              {activeTab === 'errors' && "Operational Diagnostics Error Center"}
              {activeTab === 'sessions' && "Platform Session Operations"}
              {activeTab === 'security' && "Security Auditing & Abuse Ingress"}
              {activeTab === 'system' && "Neural Gate System Configuration"}
            </div>
          </div>

          <div className="cc-system-status">
            <div className={`cc-status-pill ${health?.mongodb === 'Connected' ? 'healthy' : 'critical'}`}>
              DB: {health?.mongodb || "UNKNOWN"}
            </div>
            <div className={`cc-status-pill ${health?.api === 'Healthy' ? 'healthy' : 'warning'}`}>
              API: {health?.api || "UNKNOWN"}
            </div>
            {aiDetail?.killSwitchEngaged && (
              <div className="cc-status-pill critical">
                AI OFF
              </div>
            )}
          </div>
        </div>

        {renderActiveTab()}
      </div>
    </div>
  );
}
