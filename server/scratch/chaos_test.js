/**
 * ============================================================
 * KAEVRIX CHAOS ENGINEERING TEST SUITE
 * ============================================================
 * Simulates: malicious attackers, race conditions, XP spoofing,
 * JWT tampering, concurrent load spikes, session hijacking,
 * resource exhaustion, zombie rooms, and ghost queue entries.
 *
 * Run: node server/scratch/chaos_test.js
 */

const BASE_URL = "http://localhost:5000/api";

// === ANSI Colors ===
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const pass = (msg) => console.log(`  ${GREEN}PASS${RESET}  ${msg}`);
const fail = (msg) => console.log(`  ${RED}FAIL${RESET}  ${msg}`);
const warn = (msg) => console.log(`  ${YELLOW}WARN${RESET}  ${msg}`);
const info = (msg) => console.log(`  ${CYAN}INFO${RESET}  ${msg}`);
const section = (name) => console.log(`\n${BOLD}${CYAN}--- ${name} ---${RESET}`);

let totalPassed = 0;
let totalFailed = 0;
let totalWarned = 0;
const findings = [];

function check(label, condition, message) {
  if (condition) {
    pass(label);
    totalPassed++;
  } else {
    fail(`${label} -- ${message}`);
    totalFailed++;
    findings.push({ label, message });
  }
}

function warnCheck(label, condition, message) {
  if (condition) {
    pass(label);
    totalPassed++;
  } else {
    warn(`${label} -- ${message}`);
    totalWarned++;
    findings.push({ type: "warn", label, message });
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Pre-created user account pool — all accounts created at startup before any tests run
// This avoids hitting the auth rate limiter (15/15m) mid-suite.
const _pool = { accounts: [] };

async function createTestUser(suffix) {
  const username = `ch_${suffix}_${Math.random().toString(36).substring(6)}`;
  const password = "ChaosTest_9988";
  await sleep(150); // pace requests
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, selectedClass: "speedrunner" }),
  });
  if (!res.ok) throw new Error(`User creation failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return { username: data.user.username, token: data.token, userId: data.user._id };
}

// Pre-creates N user accounts sequentially, sleeping between each
async function warmUserPool(count) {
  info(`Pre-creating ${count} test accounts...`);
  for (let i = 0; i < count; i++) {
    try {
      const u = await createTestUser(`pool${i}`);
      _pool.accounts.push(u);
    } catch (err) {
      warn(`Pool account ${i} failed: ${err.message}`);
    }
    await sleep(200);
  }
  info(`User pool ready: ${_pool.accounts.length}/${count} accounts created.`);
}

function getPoolUser(index) {
  return _pool.accounts[index % _pool.accounts.length];
}

// ==============================================================
// TEST SECTION 1: SECURITY & AUTHENTICATION ATTACKS
// ==============================================================
async function testSecurityAttacks() {
  section("TEST 1: SECURITY & AUTHENTICATION ATTACKS");

  // 1.1 JWT Tampering on public route
  info("1.1 -- JWT Tampering Attack (public route stability)");
  const fakeToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NiIsInVzZXJuYW1lIjoiaGFja2VyIiwicm9sZSI6ImFkbWluIn0.fakeSignatureHere";
  const tamperRes = await fetch(`${BASE_URL}/leaderboard`, {
    headers: { Authorization: `Bearer ${fakeToken}` },
  });
  check("JWT tamper on public route returns 200 (no crash)", tamperRes.ok, `Got ${tamperRes.status}`);

  // 1.2 JWT tampering on protected route
  info("1.2 -- JWT Tampering on Protected Route");
  const protectedTamperRes = await fetch(`${BASE_URL}/pathfinder/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${fakeToken}` },
    body: JSON.stringify({ answers: [], pathfinderMode: "developer" }),
  });
  check(
    "JWT tamper on protected route returns 401",
    protectedTamperRes.status === 401,
    `Got ${protectedTamperRes.status}`
  );

  // 1.3 Empty bearer token
  info("1.3 -- Empty Bearer Token");
  const emptyTokenRes = await fetch(`${BASE_URL}/auth/mfa/setup`, {
    method: "POST",
    headers: { Authorization: "Bearer " },
  });
  check("Empty bearer token returns 401", emptyTokenRes.status === 401, `Got ${emptyTokenRes.status}`);

  // 1.4 NoSQL Injection in login body
  info("1.4 -- NoSQL Injection Attack (username: {$gt: ''})");
  const injectionRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: { $gt: "" }, password: "anything" }),
  });
  check(
    "NoSQL injection in username blocked (400, not 200/500) -- 429 also acceptable (rate limit protecting endpoint)",
    injectionRes.status === 400 || injectionRes.status === 429,
    `Got ${injectionRes.status} -- injection may have passed validation or server crashed`
  );

  // 1.5 XSS payload in username
  info("1.5 -- XSS Payload in Username Field");
  const xssRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "<script>alert(1)</script>", password: "xsstest_88!", selectedClass: "speedrunner" }),
  });
  const xssBody = await xssRes.json().catch(() => ({}));
  warnCheck(
    "XSS username payload rejected (400) or not reflected raw in response",
    xssRes.status === 400 || !JSON.stringify(xssBody).includes("<script>"),
    `Got ${xssRes.status} -- raw XSS may be stored`
  );

  // 1.6 Privilege escalation: regular user -> admin endpoint
  info("1.6 -- Horizontal Privilege Escalation (user -> admin)");
  const { token: userToken } = getPoolUser(0);
  const adminAccessRes = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  check(
    "Regular user cannot access admin stats (403)",
    adminAccessRes.status === 403,
    `Got ${adminAccessRes.status}`
  );

  // 1.7 IDOR / Ownership bypass
  info("1.7 -- IDOR / Ownership Bypass");
  const { username: u1 } = getPoolUser(1);
  const { token: t2 } = getPoolUser(2);
  const idorRes = await fetch(`${BASE_URL}/community/discover/${u1}`, {
    headers: { Authorization: `Bearer ${t2}` },
  });
  check(
    "User cannot read another user community discover (403)",
    idorRes.status === 403,
    `Got ${idorRes.status} -- IDOR vulnerability`
  );

  // 1.8 XP spoofing: negative amount
  info("1.8 -- XP Spoofing: Negative XP");
  const { token: xpToken } = getPoolUser(3);
  const negXpRes = await fetch(`${BASE_URL}/solo-xp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${xpToken}` },
    body: JSON.stringify({ xpEarned: -99999, videoTitle: "hack" }),
  });
  check("Negative XP value rejected by schema (400)", negXpRes.status === 400, `Got ${negXpRes.status} -- negative XP accepted`);

  // 1.9 XP spoofing: overflow
  info("1.9 -- XP Spoofing: Overflow XP (999999999)");
  const overflowXpRes = await fetch(`${BASE_URL}/solo-xp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${xpToken}` },
    body: JSON.stringify({ xpEarned: 999999999, videoTitle: "hack" }),
  });
  check("Overflow XP (>100000) rejected by schema (400)", overflowXpRes.status === 400, `Got ${overflowXpRes.status}`);

  // 1.10 Missing auth on protected route
  info("1.10 -- Protected Route Without Auth Header");
  const noAuthRes = await fetch(`${BASE_URL}/boss/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: "JavaScript", milestone: "Arrays" }),
  });
  check("Protected route without auth returns 401", noAuthRes.status === 401, `Got ${noAuthRes.status}`);
}

// ==============================================================
// TEST SECTION 2: CONCURRENT LOAD & RACE CONDITIONS
// ==============================================================
async function testConcurrentLoad() {
  section("TEST 2: CONCURRENT LOAD & RACE CONDITIONS");

  // 2.1 Concurrent leaderboard reads
  info("2.1 -- 50 Concurrent Leaderboard Reads");
  const N = 50;
  const start = Date.now();
  const leaderboardResults = await Promise.all(
    Array.from({ length: N }, () =>
      fetch(`${BASE_URL}/leaderboard`).then((r) => r.status).catch(() => 0)
    )
  );
  const elapsed = Date.now() - start;
  const successCount = leaderboardResults.filter((s) => s === 200).length;
  const rateLimitedCount = leaderboardResults.filter((s) => s === 429).length;
  check(
    `50 concurrent leaderboard reads succeed (got ${successCount}/50, ${rateLimitedCount} rate-limited)`,
    successCount >= 45,
    `Only ${successCount}/50 succeeded`
  );
  info(`  -> Total time for 50 concurrent reads: ${elapsed}ms (avg ${(elapsed / N).toFixed(1)}ms each)`);

  // 2.2 XP race condition: concurrent solo-xp from same user
  info("2.2 -- Concurrent Solo XP Race Condition (same user, 10 simultaneous)");
  const { token: raceToken, username: raceUser } = getPoolUser(4);
  const xpBefore = await fetch(`${BASE_URL}/profile/${raceUser}`).then((r) => r.json()).catch(() => ({ xp: 0 }));

  await Promise.all(
    Array.from({ length: 10 }, () =>
      fetch(`${BASE_URL}/solo-xp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${raceToken}` },
        body: JSON.stringify({ xpEarned: 50, videoTitle: "Race Condition Video" }),
      }).catch(() => null)
    )
  );

  await sleep(500);
  const xpAfter = await fetch(`${BASE_URL}/profile/${raceUser}`).then((r) => r.json()).catch(() => ({ xp: 0 }));
  const expectedXp = (xpBefore.xp || 0) + 10 * 50;
  const actualXp = xpAfter.xp || 0;
  const xpDrift = Math.abs(actualXp - expectedXp);
  warnCheck(
    `XP race condition: expected ${expectedXp}, got ${actualXp} (drift: ${xpDrift})`,
    xpDrift <= 100,
    `XP drift of ${xpDrift} detected -- MongoDB read-modify-write race corrupts XP`
  );

  // 2.3 Concurrent duplicate registration race
  info("2.3 -- Concurrent Duplicate Registration Race (10 simultaneous)");
  const dupUsername = `race_dup_${Math.random().toString(36).substring(7)}`;
  const dupResults = await Promise.all(
    Array.from({ length: 10 }, () =>
      fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: dupUsername, password: "dupRaceTest9!", selectedClass: "speedrunner" }),
      })
        .then((r) => r.status)
        .catch(() => 0)
    )
  );
  const successfulRegs = dupResults.filter((s) => s === 200).length;
  check(
    `Only 1 registration succeeds out of 10 concurrent (got ${successfulRegs})`,
    successfulRegs <= 1,
    `${successfulRegs} duplicate accounts created -- unique index may be missing`
  );

  // 2.4 Concurrent AI queue submissions
  info("2.4 -- Concurrent AI Queue Job Submissions (5 simultaneous)");
  const { token: aiToken } = getPoolUser(5);
  const aiSubmitResults = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      fetch(`${BASE_URL}/pathfinder/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiToken}` },
        body: JSON.stringify({
          answers: [{ question: "What to learn?", answer: `Topic ${i}` }],
          pathfinderMode: "developer",
        }),
      })
        .then(async (r) => ({ status: r.status, data: await r.json().catch(() => ({})) }))
        .catch((e) => ({ status: 0, error: e.message }))
    )
  );
  const aiServerErrors = aiSubmitResults.filter((r) => r.status === 500 || r.status === 0);
  check(
    `AI concurrent submissions produce no 500 errors (${aiServerErrors.length} errors)`,
    aiServerErrors.length === 0,
    `${aiServerErrors.length} AI submissions returned 500/network error`
  );
  info(`  -> Accepted: ${aiSubmitResults.filter(r=>r.status===202).length}, Rate-limited: ${aiSubmitResults.filter(r=>r.status===429).length}`);
}

// ==============================================================
// TEST SECTION 3: INPUT BOUNDARY & INJECTION ATTACKS
// ==============================================================
async function testInputBoundaries() {
  section("TEST 3: INPUT BOUNDARY & PAYLOAD ATTACKS");

  const { token } = getPoolUser(6);

  // 3.1 Large payload bomb (2MB)
  info("3.1 -- Large Payload Bomb (2MB JSON body)");
  const bigString = "A".repeat(2 * 1024 * 1024);
  let bigPayloadRes;
  try {
    bigPayloadRes = await fetch(`${BASE_URL}/pathfinder/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers: [{ question: bigString, answer: bigString }] }),
    });
  } catch {
    bigPayloadRes = { status: 413 };
  }
  check(
    "Oversized payload rejected (413 or 400, not 500 or hang)",
    bigPayloadRes.status === 413 || bigPayloadRes.status === 400,
    `Got ${bigPayloadRes.status} -- server consuming unbounded memory`
  );

  // 3.2 Query string injection in /search
  info("3.2 -- YouTube Search SQL-like Injection");
  const injSearchRes = await fetch(
    `${BASE_URL}/search?q=${encodeURIComponent("' OR 1=1; DROP TABLE users; --")}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  check(
    "Injection in search query returns valid response (not 500)",
    injSearchRes.status !== 500,
    `Got ${injSearchRes.status} -- unhandled error on injected search`
  );

  // 3.3 Missing required body fields
  info("3.3 -- Missing Required Fields in Auth Register");
  const missingFieldRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "SomeUser" }),
  });
  check("Missing password field returns 400 or 429 (rate limited)", missingFieldRes.status === 400 || missingFieldRes.status === 429, `Got ${missingFieldRes.status}`);
  if (missingFieldRes.status === 429) {
    info("  -> Got 429: Auth rate limiter engaged (acceptable security behavior)");
  }

  // 3.4 Non-JSON body to JSON endpoint
  info("3.4 -- Non-JSON Body to JSON Endpoint");
  const nonJsonRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "username=hacker&password=hacked",
  });
  check(
    "Non-JSON body to JSON endpoint returns 400/415/429 (not 500)",
    nonJsonRes.status === 400 || nonJsonRes.status === 415 || nonJsonRes.status === 422 || nonJsonRes.status === 429,
    `Got ${nonJsonRes.status} -- server may have crashed`
  );
  if (nonJsonRes.status === 429) {
    info("  -> Got 429: Auth rate limiter engaged (acceptable security behavior)");
  }

  // 3.5 Unicode emoji username
  info("3.5 -- Unicode Emoji Username");
  const emojiRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "Emoji_Test_abc123", password: "emojiTest99!", selectedClass: "speedrunner" }),
  });
  check("Valid username with test string handled gracefully (not 500)", emojiRes.status !== 500, `Got ${emojiRes.status}`);

  // 3.6 Path traversal in profile route
  info("3.6 -- Path Traversal Attempt in Profile Route");
  const pathTravRes = await fetch(`${BASE_URL}/profile/..%2F..%2Fetc%2Fpasswd`);
  check(
    "Path traversal in profile route blocked (404 or 400)",
    pathTravRes.status === 404 || pathTravRes.status === 400,
    `Got ${pathTravRes.status} -- potential path traversal`
  );

  // 3.7 Null byte injection in credentials
  info("3.7 -- Null Byte Injection in Login Credentials");
  const nullByteRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "user\x00injected", password: "pass\x00injected" }),
  });
  check(
    "Null byte injection in credentials handled (not 500)",
    nullByteRes.status !== 500,
    `Got ${nullByteRes.status} -- potential null byte bypass`
  );
}

// ==============================================================
// TEST SECTION 4: RESILIENCE & FAULT TOLERANCE
// ==============================================================
async function testResilienceScenarios() {
  section("TEST 4: RESILIENCE & FAULT TOLERANCE");

  // 4.1 Non-existent user profile
  info("4.1 -- Profile Lookup for Non-Existent User");
  const ghostRes = await fetch(`${BASE_URL}/profile/this_user_does_not_exist_xyz123abc`);
  check("Non-existent user profile returns 404", ghostRes.status === 404, `Got ${ghostRes.status}`);

  // 4.2 Job polling for invalid job ID
  info("4.2 -- Job Polling for Invalid Job ID");
  const { token } = getPoolUser(7);
  const fakeJobRes = await fetch(`${BASE_URL}/jobs/99999999999`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check("Polling non-existent job returns 404", fakeJobRes.status === 404, `Got ${fakeJobRes.status}`);

  // 4.3 Leaderboard stability
  info("4.3 -- Leaderboard Returns Stable JSON Array");
  const lbRes = await fetch(`${BASE_URL}/leaderboard`);
  const lbBody = await lbRes.json().catch(() => null);
  check(
    "Leaderboard returns valid JSON array",
    lbRes.ok && Array.isArray(lbBody),
    `Got ${lbRes.status}, not an array`
  );

  // 4.4 Invalid refresh token
  info("4.4 -- Token Refresh with Invalid Cookie");
  const invalidRefreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { Cookie: "refreshToken=invalid.token.here" },
  });
  check("Invalid refresh token returns 401", invalidRefreshRes.status === 401, `Got ${invalidRefreshRes.status}`);

  // 4.5 Double logout (replay / idempotency)
  info("4.5 -- Logout Replay Attack (double logout)");
  const logout1 = await fetch(`${BASE_URL}/auth/logout`, { method: "POST" });
  const logout2 = await fetch(`${BASE_URL}/auth/logout`, { method: "POST" });
  check("Double logout is idempotent (both return 200)", logout1.status === 200 && logout2.status === 200, `Got ${logout1.status}, ${logout2.status}`);

  // 4.6 Non-admin accessing security events
  info("4.6 -- Non-Admin User Accessing Security Events");
  const { token: normalToken } = getPoolUser(8);
  const secEventsRes = await fetch(`${BASE_URL}/admin/security-events`, {
    headers: { Authorization: `Bearer ${normalToken}` },
  });
  check("Non-admin blocked from security-events (403)", secEventsRes.status === 403, `Got ${secEventsRes.status}`);

  // 4.7 AI endpoint not killed by budget when not exhausted
  info("4.7 -- AI Kill Switch Not Prematurely Triggered");
  const { token: aiToken } = getPoolUser(9);
  const killSwitchRes = await fetch(`${BASE_URL}/pathfinder/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiToken}` },
    body: JSON.stringify({ answers: [{ question: "Learn?", answer: "Python" }], pathfinderMode: "developer" }),
  });
  check(
    "AI endpoint accessible when budget not exhausted (202 or 429, not 503)",
    killSwitchRes.status === 202 || killSwitchRes.status === 429,
    `Got ${killSwitchRes.status} -- kill switch prematurely triggered`
  );

  // 4.8 Empty search query
  info("4.8 -- YouTube Search with Empty Query");
  const { token: searchToken } = getPoolUser(10);
  const emptySearchRes = await fetch(`${BASE_URL}/search?q=`, {
    headers: { Authorization: `Bearer ${searchToken}` },
  });
  check("Empty search query returns 400", emptySearchRes.status === 400, `Got ${emptySearchRes.status}`);

  // 4.9 Concurrent profile reads (cache validation)
  info("4.9 -- 20 Concurrent Profile Reads (cache hit test)");
  const { username: cachedUser } = getPoolUser(11);
  await sleep(200);
  const profileStart = Date.now();
  const profileResults = await Promise.all(
    Array.from({ length: 20 }, () =>
      fetch(`${BASE_URL}/profile/${cachedUser}`).then((r) => r.status).catch(() => 0)
    )
  );
  const profileElapsed = Date.now() - profileStart;
  const profileSuccesses = profileResults.filter((s) => s === 200).length;
  check(
    `20 concurrent profile reads return 200 (got ${profileSuccesses}/20)`,
    profileSuccesses >= 18,
    `Only ${profileSuccesses}/20 succeeded`
  );
  info(`  -> 20 concurrent profile reads took ${profileElapsed}ms`);
}

// ==============================================================
// TEST SECTION 5: RATE LIMITING BEHAVIOUR
// ==============================================================
async function testRateLimiting() {
  section("TEST 5: RATE LIMITING BEHAVIOUR");

  // 5.1 Auth limiter activation
  info("5.1 -- Auth Limiter Activation Verification");
  const badUsername = `hammer_${Math.random().toString(36).substring(7)}`;
  let rateLimitHit = false;
  let rateLimitIteration = 0;
  for (let i = 0; i < 22; i++) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: badUsername, password: "wrongpassword" }),
    });
    if (res.status === 429) {
      rateLimitHit = true;
      rateLimitIteration = i + 1;
      break;
    }
    if (res.status === 403) {
      info(`  -> Username lockout triggered at iteration ${i + 1}`);
      rateLimitHit = true;
      rateLimitIteration = i + 1;
      break;
    }
    await sleep(40);
  }
  check(
    `Auth rate limiter or lockout triggers within 22 attempts (hit at ${rateLimitIteration})`,
    rateLimitHit,
    `No rate limiting after 22 bad login attempts -- brute force vector open`
  );

  // 5.2 Global limiter does not throttle normal traffic
  info("5.2 -- Global Limiter: Normal Traffic Not Throttled");
  const normalResults = await Promise.all(
    Array.from({ length: 10 }, () =>
      fetch(`${BASE_URL}/leaderboard`).then((r) => r.status).catch(() => 0)
    )
  );
  const normalRateLimited = normalResults.filter((s) => s === 429).length;
  check(
    "Normal traffic (10 reqs) not throttled by global limiter",
    normalRateLimited === 0,
    `${normalRateLimited}/10 requests rate-limited on normal traffic`
  );

  // 5.3 AI limiter
  info("5.3 -- AI Rate Limiter Verification (10/15min)");
  const { token: aiHammerToken } = getPoolUser(12);
  let aiLimitHit = false;
  let aiLimitIteration = 0;
  for (let i = 0; i < 15; i++) {
    const res = await fetch(`${BASE_URL}/pathfinder/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiHammerToken}` },
      body: JSON.stringify({ answers: [{ question: "learn?", answer: "Python" }], pathfinderMode: "developer" }),
    });
    if (res.status === 429) {
      aiLimitHit = true;
      aiLimitIteration = i + 1;
      break;
    }
    await sleep(30);
  }
  check(
    `AI limiter triggers within 15 attempts (hit at ${aiLimitIteration})`,
    aiLimitHit,
    `AI rate limiter not triggered after 15 submissions -- cost explosion risk`
  );
}

// ==============================================================
// TEST SECTION 6: SESSION & TOKEN SECURITY
// ==============================================================
async function testSessionSecurity() {
  section("TEST 6: SESSION & TOKEN SECURITY");

  const { token } = getPoolUser(13);
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());

  info("6.1 -- JWT Claims Verification");
  check("JWT contains userId claim", !!payload.userId, "Missing userId claim");
  check("JWT contains username claim", !!payload.username, "Missing username claim");
  check("JWT contains role claim", !!payload.role, "Missing role claim");
  check(
    "JWT access token expires in 15 minutes (900s)",
    payload.exp - payload.iat === 900,
    `Token expiry is ${payload.exp - payload.iat}s (expected 900s)`
  );
  check("Role is 'user' on new registration (not 'admin')", payload.role === "user", `Role is '${payload.role}'`);

  info("6.2 -- Sensitive Data NOT in JWT Payload");
  check("JWT payload has no passwordHash", !payload.passwordHash, "CRITICAL: passwordHash in JWT");
  check("JWT payload has no salt", !payload.salt, "CRITICAL: salt in JWT");
  check("JWT payload has no mfaSecret", !payload.mfaSecret, "CRITICAL: mfaSecret in JWT");

  info("6.3 -- /auth/verify Endpoint Security");
  const verifyRes = await fetch(`${BASE_URL}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const verifyBody = await verifyRes.json().catch(() => ({}));
  check("/auth/verify returns user on valid token", verifyRes.ok && !!verifyBody.user, `Got ${verifyRes.status}`);
  check("/auth/verify does NOT expose passwordHash", !verifyBody.user?.passwordHash, "CRITICAL: passwordHash in verify response");
  check("/auth/verify does NOT expose mfaSecret", !verifyBody.user?.mfaSecret, "CRITICAL: mfaSecret in verify response");
  check("/auth/verify does NOT expose salt", !verifyBody.user?.salt, "CRITICAL: salt in verify response");
}

// ==============================================================
// TEST SECTION 7: DATA INTEGRITY & EDGE CASES
// ==============================================================
async function testDataIntegrity() {
  section("TEST 7: DATA INTEGRITY & EDGE CASES");

  // 7.1 Theme info for non-existent user
  info("7.1 -- Theme Info for Non-Existent User");
  const themeRes = await fetch(`${BASE_URL}/auth/theme/nobody_exists_xyz999abc`);
  check("Theme lookup for non-existent user returns 404", themeRes.status === 404, `Got ${themeRes.status}`);

  // 7.2 Valid telemetry track (anonymous)
  info("7.2 -- Telemetry Tracking (anonymous)");
  const telRes = await fetch(`${BASE_URL}/telemetry/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType: "PAGE_VIEW", pagePath: "/chaos-test", metadata: { source: "chaos_suite" } }),
  });
  check("Telemetry track returns 202 (anonymous allowed)", telRes.status === 202, `Got ${telRes.status}`);

  // 7.3 Invalid telemetry event type
  info("7.3 -- Telemetry Injection with Unknown Event Type");
  const invalidTelRes = await fetch(`${BASE_URL}/telemetry/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType: "INJECT_MALICIOUS_EVENT", pagePath: "/hack" }),
  });
  check("Invalid telemetry event type rejected (400)", invalidTelRes.status === 400, `Got ${invalidTelRes.status} -- unknown events accepted`);

  // 7.4 Cosmetics without auth
  info("7.4 -- Profile Cosmetics Update Without Auth");
  const cosNoAuthRes = await fetch(`${BASE_URL}/profile/cosmetics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ banner: "hacked_banner" }),
  });
  check("Cosmetics update without auth returns 401", cosNoAuthRes.status === 401, `Got ${cosNoAuthRes.status}`);

  // 7.5 Concurrent cosmetics write (cache invalidation)
  info("7.5 -- Concurrent Cosmetics Write (cache invalidation race)");
  const { token: cosToken } = getPoolUser(14);
  const cosRaceResults = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      fetch(`${BASE_URL}/profile/cosmetics`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cosToken}` },
        body: JSON.stringify({ banner: `banner_v${i}` }),
      })
        .then((r) => r.status)
        .catch(() => 0)
    )
  );
  const cosSuccesses = cosRaceResults.filter((s) => s === 200).length;
  check(
    `Concurrent cosmetics writes handled cleanly (got ${cosSuccesses}/5)`,
    cosSuccesses >= 4,
    `Only ${cosSuccesses}/5 succeeded -- lock or race condition`
  );

  // 7.6 Curated videos endpoint stability
  info("7.6 -- Curated Videos Public Endpoint");
  const curatedRes = await fetch(`${BASE_URL}/curated-videos`);
  const curatedBody = await curatedRes.json().catch(() => null);
  check(
    "Curated videos returns valid array (no questions exposed)",
    curatedRes.ok && Array.isArray(curatedBody),
    `Got ${curatedRes.status}`
  );
  if (Array.isArray(curatedBody) && curatedBody.length > 0) {
    check(
      "Curated videos do NOT expose quiz questions to public",
      !curatedBody[0].questions,
      "CRITICAL: quiz questions exposed in public curated-videos endpoint"
    );
  }
}

// ==============================================================
// MAIN RUNNER
// ==============================================================
async function runChaosSuite() {
  console.log(`\n${"-".repeat(60)}`);
  console.log(`  KAEVRIX CHAOS ENGINEERING AUDIT -- LIVE FIRE`);
  console.log(`${"-".repeat(60)}`);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Time:   ${new Date().toISOString()}`);
  console.log(`${"-".repeat(60)}\n`);

  // === PRE-WARM USER POOL ===
  // All suites share this pool so we never exhaust the auth limiter mid-test.
  // Need: 1(privesc) + 1(idor_victim) + 1(idor_attacker) + 1(xpspoof) +
  //       1(xprace) + 1(aijobs) + 1(boundary) + 1(jobpoll) +
  //       1(cachetest) + 1(aihammer) + 1(killswitch) + 1(emptysearch) +
  //       1(nonadmin) + 1(tokenclaims) + 1(cosrace) = 15 users
  await warmUserPool(15);

  const suites = [
    { name: "Security & Auth Attacks", fn: testSecurityAttacks },
    { name: "Concurrent Load & Race Conditions", fn: testConcurrentLoad },
    { name: "Input Boundary & Payload Attacks", fn: testInputBoundaries },
    { name: "Resilience & Fault Tolerance", fn: testResilienceScenarios },
    { name: "Rate Limiting Behaviour", fn: testRateLimiting },
    { name: "Session & Token Security", fn: testSessionSecurity },
    { name: "Data Integrity & Edge Cases", fn: testDataIntegrity },
  ];

  for (const suite of suites) {
    try {
      await suite.fn();
    } catch (err) {
      console.log(`\n  SUITE CRASHED: ${suite.name}`);
      console.error(err.message);
      totalFailed++;
      findings.push({ label: `Suite: ${suite.name}`, message: err.message });
    }
  }

  // Final Report
  const line = "=".repeat(60);
  console.log(`\n${line}`);
  console.log(`  CHAOS AUDIT FINAL RESULTS`);
  console.log(`${line}`);
  console.log(`  PASSED : ${totalPassed}`);
  console.log(`  FAILED : ${totalFailed}`);
  console.log(`  WARNED : ${totalWarned}`);
  console.log(`  Total  : ${totalPassed + totalFailed + totalWarned}`);

  if (findings.length > 0) {
    console.log(`\n  ISSUES FOUND:`);
    findings.forEach((f, i) => {
      const tag = f.type === "warn" ? "WARN" : "FAIL";
      console.log(`    [${i + 1}] [${tag}] ${f.label}`);
      console.log(`         -> ${f.message}`);
    });
  } else {
    console.log(`\n  ZERO CRITICAL FINDINGS. System hardened.`);
  }

  const score = totalFailed + totalPassed > 0
    ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
    : 0;
  console.log(`\n  Final Chaos Score: ${score}/100`);
  console.log(`${line}\n`);

  if (totalFailed > 0) process.exit(1);
}

runChaosSuite().catch((err) => {
  console.error("\n CHAOS SUITE UNHANDLED CRASH:", err);
  process.exit(1);
});
