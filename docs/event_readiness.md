# Event Readiness

This file tracks what features should still be implemented or hardened before live event execution.

## Critical Priority

- Replace in-memory matchmaking lock with distributed lock (Redis or DB lock token) to make pairing safe across serverless instances.
- Snapshot participant count at phase start and use that snapshot for completion checks to avoid drift if late registrations happen.
- Add rate limiting for polling-heavy routes:
  - /api/matchmaking/status
  - /api/tournament/status
  - /api/tournament/state

## High Priority

- Add resilient polling UX in arena:
  - exponential backoff on repeated failures
  - visible reconnect state
  - retry action for users
- Add structured request logging with request IDs for all API routes.
- Add stricter payload validation and consistent error envelope for API responses.
- Add anti-multi-tab protections for Phase 1 answer confirmation/submission conflicts.
- Add integrity checks for question data (correctOptionId must exist in options).

## Medium Priority

- Add authenticated admin recovery endpoints:
  - safe reset for tournament state
  - remap participant endpoint
  - force-complete participant session endpoint
- Add leaderboard metadata in API response:
  - generatedAt
  - totalSubmitted
  - qualifiedCount
- Add final result export utility (CSV/JSON).
- Add lightweight monitoring dashboard for event operators.

## Testing Readiness (Before Event)

- Complete end-to-end flow tests:
  - registration -> matchmaking -> questions -> submit -> leaderboard unlock
- Validate tie-break determinism under concurrent submissions.
- Validate duplicate submit conflict handling.
- Validate leaderboard stability across repeated refreshes.
- Run production smoke checks for all GET routes.

## Operational Readiness

- Confirm latest deploy is healthy.
- Confirm prisma migrations are fully applied.
- Confirm DB connection pool and limits are sufficient for peak polling.
- Confirm fallback plan for incident response and manual recovery.