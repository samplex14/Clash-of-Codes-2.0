# Clash of Codes 2.0 - Technical Context (Current)

## 1. Architecture Snapshot

- Stack: Next.js App Router + TypeScript + Prisma + Neon PostgreSQL.
- Runtime model: Serverless HTTP APIs (no WebSocket runtime).
- Core app shell: app/layout.tsx with provider composition in components/providers/AppProviders.tsx.
- Data access: lib/db.ts uses PrismaNeon adapter and singleton Prisma client.
- Global tournament state is persisted in TournamentState; per-player quiz state is persisted in ParticipantSession.

## 2. Primary User Journey

1. Registration on app/page.tsx posts to /api/register.
2. Year-based routing sends users to /arena/1st or /arena/2nd.
3. Arena pages execute matchmaking via /api/matchmaking and /api/matchmaking/status.
4. Bot fallback exists via /api/matchmaking/bot if no opponent is found in time.
5. Battle questions load from /api/phase1/questions using deterministic per-user question order.
6. Phase 1 submission posts to /api/phase1/submit where scoring and persistence are server-authoritative.
7. After successful submission, arena currently routes users directly to leaderboard pages:
   - 1st year -> /leaderboard1
   - 2nd year -> /leaderboard
8. Leaderboard pages themselves hold/poll until leaderboardVisible is true.

## 3. Domain API Map

### Registration and Participant

- POST /api/register: Primary registration endpoint (usn, name, year/track).
- POST /api/participants/register: Older/alternate registration route still present.

### Matchmaking

- POST /api/matchmaking: Pairing logic with DB locking and retries.
- GET /api/matchmaking/status: Reads mapping state for a user.
- POST /api/matchmaking/bot: Assigns fallback bot opponent.

### Phase 1

- GET /api/phase1/status: Reports phase state.
- GET /api/phase1/questions: Returns shuffled questions plus timer metadata.
- POST /api/phase1/submit: Validates, scores, and atomically persists submissions.
- GET /api/phase1/leaderboard: Legacy phase leaderboard route.

### Tournament and Leaderboard

- POST /api/tournament/start: Starts phase and preloads sessions.
- GET /api/tournament/status: Tracks completion and controls leaderboard visibility.
- GET /api/tournament/state: Lightweight state response.
- GET /api/leaderboard: Second-year/general leaderboard endpoint with pagination.
- GET /api/leaderboard1: First-year leaderboard endpoint with pagination.

## 4. Data Model Summary (Prisma)

- Participant:
  - identity and profile (usn, name, year, track)
  - gameplay state (phase1Score, qualified)
  - matchmaking state (isMapped, mappedTo, mappedAt)
  - submit marker (submittedAt)
- ParticipantSession:
  - per-user question order (shuffledQuestionIds)
  - persisted answer payload (confirmedAnswers)
  - submit marker (hasSubmitted, submittedAt)
  - session start anchor (createdAt)
- TournamentState:
  - single global record (id=1)
  - phase and leaderboard controls (phase1Active, leaderboardVisible)
  - status caching fields (cachedSubmitted, cachedTotal)
- Question:
  - year-scoped question bank
  - options JSON + correctOptionId for server-side scoring

## 5. Timer, Timeout, and Submission Behavior

- Time limit source: PHASE1_TIME_LIMIT_MINUTES (fallback 60).
- /api/phase1/questions returns timeLimitMinutes and sessionCreatedAt.
- Client computes deadline as sessionCreatedAt + timeLimitMinutes.
- Timer UI is shown in components/Phase1QuestionPanel.tsx.

### Manual Submit

- Requires full answer set for all expected question IDs.
- Deadline is enforced by server.

### Timeout Auto-Submit (Current)

- Trigger: timer reaches 00:00 in Phase1QuestionPanel.
- Client auto-submits only locked answers (confirmedQuestions).
- Unlocked/unanswered questions are omitted and do not contribute to score.
- Payload includes autoSubmitted=true.
- Server accepts partial payload for autoSubmitted requests and scores only submitted question IDs.
- After server success, client clears local state and routes to leaderboard.

## 6. Concurrency and Scalability Mechanisms

- Matchmaking uses database transaction + row-locking strategy with retries for serialization/locking failures.
- Polling uses jittered intervals to reduce synchronized spikes.
- Submission path is idempotent-aware and transaction-protected.
- Tournament status endpoint supports one-shot completion with cached counters.
- Leaderboards are paginated (limit/offset) and submitted-only.

## 7. Environment Variables in Active Use

- DATABASE_URL: required at server runtime.
- DIRECT_URL: optional direct DB URL (migration/runtime utility).
- NEXT_PUBLIC_APP_URL: optional base URL; client fallback exists.
- NODE_ENV: defaulted to development if missing in env loader.
- PHASE1_TIME_LIMIT_MINUTES: quiz deadline value (default 60).

## 8. Current Risks and Gaps

- No explicit rate limiting on polling-heavy routes.
- No distributed lock service for cross-instance matchmaking coordination.
- Multi-tab conflict handling is still limited.
- Structured request-level logging and consistent error envelope can be improved.
- Operational behavior still depends on DB pool sizing and serverless cold-start profile.

## 9. Operational Readiness Notes

- Migrations include matchmaking indexes and tournament status cache fields.
- Architecture is suitable for event traffic when DB pooling is sized correctly.
- Recommended before event day:
  - full end-to-end rehearsal (register -> match -> battle -> submit -> leaderboard)
  - monitor p95 latency and API error rate under synthetic concurrent load
  - verify leaderboard visibility transition under real submission race conditions
