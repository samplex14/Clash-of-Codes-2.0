/*
  Automated Phase 1 load test.

  Runs the full flow for local rehearsals:
  1) starts Phase 1 session (admin endpoint)
  2) fetches Phase 1 questions
  3) registers N participants
  4) submits Phase 1 answers for all participants
  5) optionally ends Phase 1 session

  Usage:
    ADMIN_TOKEN=... npm run loadtest:phase1

  PowerShell example:
    $env:ADMIN_TOKEN="your-admin-secret-here"
    $env:USERS="150"
    npm run loadtest:phase1
*/

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000/api";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

const USERS = Number(process.env.USERS || 150);
const STAGGER_MS = Number(process.env.STAGGER_MS || 8);
const REGISTER_STAGGER_MS = Number(process.env.REGISTER_STAGGER_MS || 4);
const USN_PREFIX = process.env.USN_PREFIX || "P1LT";
const START_PHASE1 = process.env.START_PHASE1 !== "false";
const END_PHASE1 = process.env.END_PHASE1 === "true";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

function randomAnswers(count) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 4));
}

async function fetchJson(url, options = {}) {
  const started = Date.now();
  const res = await fetch(url, options);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return {
    ok: res.ok,
    status: res.status,
    body,
    latencyMs: Date.now() - started,
  };
}

function adminHeaders() {
  return {
    "x-admin-token": ADMIN_TOKEN,
    "Content-Type": "application/json",
  };
}

async function ensureHealth() {
  const health = await fetchJson(`${API_BASE_URL}/health`);
  if (!health.ok) {
    throw new Error(`Server health check failed (${health.status})`);
  }
}

async function maybeStartPhase1() {
  if (!START_PHASE1) return;

  if (!ADMIN_TOKEN) {
    throw new Error("ADMIN_TOKEN is required to start Phase 1");
  }

  const res = await fetchJson(`${API_BASE_URL}/admin/phase1/start`, {
    method: "POST",
    headers: adminHeaders(),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to start Phase 1 (${res.status}): ${JSON.stringify(res.body)}`,
    );
  }
}

async function fetchQuestions() {
  const res = await fetchJson(`${API_BASE_URL}/phase1/questions`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch Phase 1 questions (${res.status}): ${JSON.stringify(res.body)}`,
    );
  }

  if (!Array.isArray(res.body) || res.body.length === 0) {
    throw new Error(
      "No Phase 1 questions returned; seed questions before load testing",
    );
  }

  return res.body;
}

function buildUsers(count) {
  return Array.from({ length: count }, (_, idx) => {
    const n = String(idx + 1).padStart(3, "0");
    const usn = `${USN_PREFIX}${n}`;
    return {
      usn,
      name: `Phase1 Load User ${n}`,
      year: idx % 2 === 0 ? 1 : 2,
    };
  });
}

async function registerUser(user, index) {
  await sleep(index * REGISTER_STAGGER_MS);

  const res = await fetchJson(`${API_BASE_URL}/participants/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  // Existing users are acceptable for repeated rehearsals.
  const alreadyRegistered =
    res.status === 400 &&
    typeof res.body === "object" &&
    res.body &&
    String(res.body.error || "")
      .toLowerCase()
      .includes("already");

  return {
    ok: res.ok || alreadyRegistered,
    alreadyRegistered,
    status: res.status,
    latencyMs: res.latencyMs,
    error: res.ok || alreadyRegistered ? null : res.body,
  };
}

async function submitForUser(user, questionCount, index) {
  await sleep(index * STAGGER_MS);

  const payload = {
    usn: user.usn,
    answers: randomAnswers(questionCount),
    timeTaken: 30 + Math.floor(Math.random() * 120),
  };

  const res = await fetchJson(`${API_BASE_URL}/phase1/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return {
    ok: res.ok,
    status: res.status,
    latencyMs: res.latencyMs,
    error: res.ok ? null : res.body,
  };
}

function printStatusHistogram(label, results) {
  const hist = {};
  for (const r of results) {
    hist[r.status] = (hist[r.status] || 0) + 1;
  }

  console.log(`\n${label} status histogram:`);
  for (const status of Object.keys(hist).sort(
    (a, b) => Number(a) - Number(b),
  )) {
    console.log(`  ${status}: ${hist[status]}`);
  }
}

async function maybeEndPhase1() {
  if (!END_PHASE1) return;

  if (!ADMIN_TOKEN) {
    console.warn("Skipping END_PHASE1 because ADMIN_TOKEN is missing");
    return;
  }

  const res = await fetchJson(`${API_BASE_URL}/admin/phase1/end`, {
    method: "POST",
    headers: adminHeaders(),
  });

  if (!res.ok) {
    console.warn(`Failed to end Phase 1 (${res.status}):`, res.body);
  }
}

async function main() {
  if (USERS < 1) {
    throw new Error("USERS must be greater than 0");
  }

  const started = Date.now();

  await ensureHealth();
  await maybeStartPhase1();

  const questions = await fetchQuestions();
  const users = buildUsers(USERS);

  console.log("\n=== Phase 1 Automated Load Test ===");
  console.log(`API base:               ${API_BASE_URL}`);
  console.log(`Users:                  ${USERS}`);
  console.log(`Question count:         ${questions.length}`);
  console.log(`USN prefix:             ${USN_PREFIX}`);
  console.log(`Start phase1:           ${START_PHASE1}`);
  console.log(`End phase1:             ${END_PHASE1}`);

  const registerResults = await Promise.all(
    users.map((u, i) => registerUser(u, i)),
  );
  const regSuccess = registerResults.filter((r) => r.ok).length;
  const regAlready = registerResults.filter((r) => r.alreadyRegistered).length;

  console.log("\nRegistration");
  console.log(`Success:                ${regSuccess}/${USERS}`);
  console.log(`Already registered:     ${regAlready}`);
  console.log(
    `Avg latency:            ${avg(registerResults.map((r) => r.latencyMs)).toFixed(2)} ms`,
  );
  console.log(
    `P95 latency:            ${percentile(
      registerResults.map((r) => r.latencyMs),
      95,
    ).toFixed(2)} ms`,
  );
  printStatusHistogram("Registration", registerResults);

  const submitResults = await Promise.all(
    users.map((u, i) => submitForUser(u, questions.length, i)),
  );

  const submitSuccess = submitResults.filter((r) => r.ok).length;
  const submitFail = USERS - submitSuccess;

  console.log("\nSubmissions");
  console.log(`Success:                ${submitSuccess}/${USERS}`);
  console.log(`Failure:                ${submitFail}`);
  console.log(
    `Avg latency:            ${avg(submitResults.map((r) => r.latencyMs)).toFixed(2)} ms`,
  );
  console.log(
    `P95 latency:            ${percentile(
      submitResults.map((r) => r.latencyMs),
      95,
    ).toFixed(2)} ms`,
  );
  printStatusHistogram("Submission", submitResults);

  const failures = submitResults.filter((r) => !r.ok).slice(0, 8);
  if (failures.length) {
    console.log("\nSample submission failures (first 8):");
    failures.forEach((f, i) => {
      console.log(
        `  ${i + 1}. status=${f.status} error=${JSON.stringify(f.error)}`,
      );
    });
  }

  await maybeEndPhase1();

  console.log(`\nTotal elapsed:          ${Date.now() - started} ms`);
}

main().catch((err) => {
  console.error("Phase 1 load test failed:", err.message);
  process.exitCode = 1;
});
