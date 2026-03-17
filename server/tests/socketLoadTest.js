/*
  Socket.IO load test for duel namespace.

  Usage examples:
  1) npm run loadtest:socket
  2) SOCKET_URL=http://localhost:5000 USERS=150 STAGGER_MS=25 npm run loadtest:socket
  3) ADMIN_TOKEN=... ROUND=1 npm run loadtest:socket
*/

const { io } = require("socket.io-client");

const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:5000";
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000/api";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

const USERS = Number(process.env.USERS || 120);
const MIN_USERS = 100;
const MAX_USERS = 150;
const STAGGER_MS = Number(process.env.STAGGER_MS || 20);
const SUBMISSIONS_PER_USER = Number(process.env.SUBMISSIONS_PER_USER || 3);
const ROUND = process.env.ROUND;
const ACK_TIMEOUT_MS = Number(process.env.ACK_TIMEOUT_MS || 8000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function avg(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

async function fetchMatches() {
  if (!ADMIN_TOKEN) {
    throw new Error(
      "ADMIN_TOKEN is required so the script can fetch real matches/usn pairs from /api/admin/phase2/matches",
    );
  }

  const roundQuery = ROUND ? `?round=${encodeURIComponent(ROUND)}` : "";
  const res = await fetch(`${API_BASE_URL}/admin/phase2/matches${roundQuery}`, {
    headers: {
      "x-admin-token": ADMIN_TOKEN,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch matches (${res.status}): ${text}`);
  }

  const matches = await res.json();
  if (!Array.isArray(matches) || matches.length === 0) {
    throw new Error("No matches found for load test");
  }

  return matches;
}

function buildVirtualUsers(matches, totalUsers) {
  const allPlayers = [];

  for (const match of matches) {
    if (!match?._id || !match?.player1?.usn || !match?.player2?.usn) continue;

    allPlayers.push({ matchId: match._id, usn: match.player1.usn });
    allPlayers.push({ matchId: match._id, usn: match.player2.usn });
  }

  if (allPlayers.length === 0) {
    throw new Error("No valid players found in fetched matches");
  }

  const users = [];
  for (let i = 0; i < totalUsers; i++) {
    users.push(allPlayers[i % allPlayers.length]);
  }

  return users;
}

async function emitWithAck(socket, eventName, payload, timeoutMs) {
  const started = Date.now();

  const ackPromise = new Promise((resolve, reject) => {
    socket.emit(eventName, payload, (ack) => {
      if (ack?.ok) {
        resolve(ack);
      } else {
        reject(new Error(ack?.error || "Unknown ack failure"));
      }
    });
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${eventName} ack timeout`)), timeoutMs);
  });

  await Promise.race([ackPromise, timeoutPromise]);
  return Date.now() - started;
}

async function simulateUser(userSpec, userIndex, metrics) {
  await sleep(userIndex * STAGGER_MS);

  return new Promise((resolve) => {
    const socket = io(`${SOCKET_URL}/duel`, {
      transports: ["websocket", "polling"],
      timeout: ACK_TIMEOUT_MS,
      reconnection: false,
    });

    let resolved = false;

    const finalize = (result) => {
      if (resolved) return;
      resolved = true;
      socket.disconnect();
      resolve(result);
    };

    socket.on("connect_error", (err) => {
      metrics.connectFailure += 1;
      finalize({ ok: false, stage: "connect", error: err.message });
    });

    socket.on("error", () => {
      metrics.serverErrors += 1;
    });

    socket.on("connect", async () => {
      metrics.connected += 1;

      try {
        const joinLatency = await emitWithAck(
          socket,
          "join_room",
          {
            matchId: userSpec.matchId,
            usn: userSpec.usn,
          },
          ACK_TIMEOUT_MS,
        );

        metrics.join.success += 1;
        metrics.join.latencies.push(joinLatency);
      } catch (err) {
        metrics.join.failure += 1;
        return finalize({ ok: false, stage: "join_room", error: err.message });
      }

      for (let i = 0; i < SUBMISSIONS_PER_USER; i++) {
        const questionIndex = i;
        const answerIndex = Math.floor(Math.random() * 4);

        try {
          const submitLatency = await emitWithAck(
            socket,
            "submit_answer",
            {
              matchId: userSpec.matchId,
              usn: userSpec.usn,
              questionIndex,
              answerIndex,
              timestamp: Date.now(),
            },
            ACK_TIMEOUT_MS,
          );

          metrics.submit.success += 1;
          metrics.submit.latencies.push(submitLatency);
        } catch (err) {
          metrics.submit.failure += 1;
        }

        await sleep(15 + Math.floor(Math.random() * 35));
      }

      finalize({ ok: true });
    });
  });
}

function printReport(metrics, userResults, durationMs) {
  const totalUsers = userResults.length;
  const successfulUsers = userResults.filter((r) => r.ok).length;

  console.log("\n=== Socket Load Test Report ===");
  console.log(`Target URL:            ${SOCKET_URL}/duel`);
  console.log(`Concurrent users:      ${totalUsers}`);
  console.log(`Connected sockets:     ${metrics.connected}`);
  console.log(`Connection failures:   ${metrics.connectFailure}`);
  console.log(`Server error events:   ${metrics.serverErrors}`);
  console.log(`Successful users:      ${successfulUsers}`);
  console.log(`Failed users:          ${totalUsers - successfulUsers}`);
  console.log(`Elapsed:               ${durationMs} ms`);

  console.log("\njoin_room metrics");
  console.log(`Success:               ${metrics.join.success}`);
  console.log(`Failure:               ${metrics.join.failure}`);
  console.log(
    `Avg latency:           ${avg(metrics.join.latencies).toFixed(2)} ms`,
  );
  console.log(
    `P95 latency:           ${percentile(metrics.join.latencies, 95).toFixed(2)} ms`,
  );

  console.log("\nsubmit_answer metrics");
  console.log(`Success:               ${metrics.submit.success}`);
  console.log(`Failure:               ${metrics.submit.failure}`);
  console.log(
    `Avg latency:           ${avg(metrics.submit.latencies).toFixed(2)} ms`,
  );
  console.log(
    `P95 latency:           ${percentile(metrics.submit.latencies, 95).toFixed(2)} ms`,
  );

  const failures = userResults.filter((r) => !r.ok).slice(0, 10);
  if (failures.length > 0) {
    console.log("\nSample failures (first 10)");
    for (const failure of failures) {
      console.log(`- stage=${failure.stage} error=${failure.error}`);
    }
  }
}

async function main() {
  if (USERS < MIN_USERS || USERS > MAX_USERS) {
    throw new Error(`USERS must be between ${MIN_USERS} and ${MAX_USERS}`);
  }

  const matches = await fetchMatches();
  const virtualUsers = buildVirtualUsers(matches, USERS);

  const metrics = {
    connected: 0,
    connectFailure: 0,
    serverErrors: 0,
    join: { success: 0, failure: 0, latencies: [] },
    submit: { success: 0, failure: 0, latencies: [] },
  };

  const started = Date.now();
  const userResults = await Promise.all(
    virtualUsers.map((user, idx) => simulateUser(user, idx, metrics)),
  );
  const durationMs = Date.now() - started;

  printReport(metrics, userResults, durationMs);
}

main().catch((err) => {
  console.error("Load test failed:", err.message);
  if (err.message.includes("No matches found for load test")) {
    console.error(
      "Hint: create Phase 2 matches first via POST /api/admin/phase2/matchmake (with x-admin-token)",
    );
  }

  // Prefer setting exitCode over immediate process.exit on Windows terminals.
  process.exitCode = 1;
});
