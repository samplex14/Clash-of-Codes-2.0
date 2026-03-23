# Clash of Codes 2.0 - Technical Context (Refreshed)

## 1. Architecture Snapshot

- Stack: Next.js App Router + TypeScript + Prisma + Neon PostgreSQL.
- Runtime model: Serverless HTTP route handlers (no WebSocket runtime).
- Persistent state:
  - Global event state in `TournamentState`.
  - Per-participant phase state in `ParticipantSession`.
- Data access: Prisma via `lib/db.ts`.

## 2. Current End-to-End Participant Journey

1. Registration from home screen calls `POST /api/register`.
2. Year-based routing sends participant to `/arena/1st` or `/arena/2nd`.
3. Arena starts matchmaking using `POST /api/matchmaking` and then polls `GET /api/matchmaking/status`.
4. If no human match appears in time, fallback is assigned by `POST /api/matchmaking/bot`.
5. User clicks start battle button; this triggers `POST /api/tournament/start`.
6. Questions are loaded from `GET /api/phase1/questions`, with deterministic shuffled order per participant.
7. Participant answers and submits via `POST /api/phase1/submit`.
8. Arena routes to leaderboard page after submit:
   - 1st year -> `/leaderboard1`
   - 2nd year -> `/leaderboard`
9. Leaderboard pages do one load attempt; if leaderboard is not yet visible, UI stays in holding state and requires manual page refresh.

## 3. Domain API Map (Verified)

### Registration

- `POST /api/register`
  - Primary registration route.
  - Validates `usn`, `fullName`, and `year` (`1st` or `2nd`).
- `POST /api/participants/register`
  - Legacy/alternate registration route still present.

### Matchmaking

- `POST /api/matchmaking`
  - Requests opponent assignment.
  - Returns `matched` or `waiting`.
- `GET /api/matchmaking/status`
  - Reads current match state for a participant.
- `POST /api/matchmaking/bot`
  - Assigns bot opponent when human match is not found in time.

### Phase 1

- `GET /api/phase1/status`
  - Returns phase active state.
- `GET /api/phase1/questions`
  - Returns shuffled question set, `timeLimitMinutes`, and `sessionCreatedAt`.
- `POST /api/phase1/submit`
  - Validates payload and scores server-side.
  - Manual submit requires full answer set.
  - Timeout auto-submit accepts partial confirmed answers.
- `GET /api/phase1/leaderboard`
  - Legacy route still present.

### Tournament and Leaderboard

- `POST /api/tournament/start`
  - Idempotently activates phase and preloads sessions for mapped users.
- `GET /api/tournament/status`
  - Tracks submitted vs total mapped users.
  - When all mapped users submit, flips `leaderboardVisible=true` and caches counts.
- `GET /api/tournament/state`
  - Lightweight state read.
- `GET /api/leaderboard`
  - 2nd-year/general leaderboard route (`?year=2nd|1st`).
- `GET /api/leaderboard1`
  - 1st-year leaderboard route.

## 4. Data Model Behavior Summary

- `Participant`
  - Identity, track/year, phase score, mapping, submit timestamp, `qualified` flag.
- `ParticipantSession`
  - Shuffled question IDs, confirmed answers JSON, submit marker, created timestamp.
- `TournamentState`
  - Global phase flags plus cached totals used after completion.
- `Question`
  - Year-based question bank with `correctOptionId` for scoring.

## 5. Timing, Deadline, and Submission Rules

- Time limit source: `PHASE1_TIME_LIMIT_MINUTES` (default 60 if unset/invalid).
- Server returns `timeLimitMinutes` and `sessionCreatedAt`; client computes countdown deadline from these values.
- Server is authoritative on deadline enforcement:
  - Manual submit after deadline -> rejected.
  - Auto-submit (`autoSubmitted=true`) allows partial confirmed answers at timeout path.
- Submission transaction marks session submitted and writes participant score atomically.

## 6. Polling and Refresh Behavior (Current)

- Matchmaking status: polled from arena with jittered interval.
- Tournament completion status: polled from arena while waiting for leaderboard unlock.
- Leaderboard pages: no interval polling now; single load attempt only.
  - If locked, page remains in holding UI.
  - User must refresh manually to re-check visibility.

## 7. Current Inconsistencies and Risks

### Functional Inconsistencies

- Rules are duplicated in both arena pages (`app/arena/1st/page.tsx`, `app/arena/2nd/page.tsx`) instead of a shared source.
- Rules text says 30 minutes, while backend default remains 60 unless `PHASE1_TIME_LIMIT_MINUTES` is set.
- `docs/context.md` had outdated statements about leaderboard behavior; this file now reflects current behavior.

### Reliability/Scale Risks

- No route-level rate limiting on polling-heavy endpoints.
- Tournament completion uses dynamic mapped count (no phase-start participant snapshot), which can drift if late registrations occur.
- Matchmaking relies on DB transaction retries; robust for many cases, but still sensitive under heavy contention.
- Limited structured observability (no request IDs/correlated logs).
- No authenticated admin recovery endpoints for live incident handling.

### Fairness/Security Risks

- No participant auth token/session binding across APIs; USN is client-provided.
- Multi-tab/session conflict protection is limited on the client side.

## 8. Priority-Wise Implementation Roadmap for Better Event Conduction

### P0 - Must Implement Before Event

1. Add rate limiting on `GET /api/matchmaking/status`, `GET /api/tournament/status`, and leaderboard routes.
2. Snapshot participant baseline at phase start and use snapshot for completion checks.
3. Add admin recovery endpoints (secret-protected) for:
   - force leaderboard visibility
   - participant remap/unmap
   - safe participant/session reset
4. Lock timer policy to one source of truth:
   - set and verify `PHASE1_TIME_LIMIT_MINUTES`
   - ensure displayed rules match backend timer.

### P1 - Strongly Recommended

1. Centralize arena rules into shared module/component consumed by both `/arena/1st` and `/arena/2nd`.
2. Add structured logging with request IDs across all API routes.
3. Improve polling resilience UX (clear reconnect state + bounded backoff + retry controls).
4. Add anti-multi-tab safeguards in battle flow.
5. Add payload/integrity validation checks for question seed quality (e.g., `correctOptionId` exists in options).

### P2 - Nice to Have

1. Introduce participant auth/session token after registration.
2. Add cached/materialized leaderboard snapshots for larger concurrent loads.
3. Build small event-ops dashboard (mapped/submitted/visible/error counters).
4. Add export endpoint for final standings (CSV/JSON).

## 9. Event-Day Execution Checklist

1. Confirm env vars on deployed environment:
   - `DATABASE_URL`
   - `DIRECT_URL` (if used for migrations)
   - `NEXT_PUBLIC_APP_URL`
   - `PHASE1_TIME_LIMIT_MINUTES`
2. Run full dry-run path: register -> match -> start -> submit -> leaderboard unlock.
3. Validate tie-break ordering with same-score simulated submissions.
4. Validate duplicate submit behavior and conflict handling.
5. Monitor polling endpoints under expected participant concurrency.

## 10. Current State Verdict

- Platform is functionally complete for event flow.
- For reliable live conduction, P0 items should be implemented before event launch.
