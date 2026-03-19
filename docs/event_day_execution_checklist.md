# Event Day Execution Checklist

Last updated: 2026-03-18

## Scope

This checklist covers:

- Every page route in the app
- Every API route in app/api
- Leaderboard correctness and qualification consistency
- Event-day operational risks and mitigations

## Route Inventory

### Pages

- [x] / (home registration) exists and loads
- [x] /arena (battle + matchmaking UI) exists and loads
- [x] /leaderboard (single unified leaderboard) exists and loads

### API Routes

- [x] GET /api/health
- [x] GET /api/tournament/state
- [x] GET /api/tournament/status
- [x] POST /api/tournament/start
- [x] GET /api/phase1/status
- [x] GET /api/phase1/questions
- [x] POST /api/phase1/confirm
- [x] POST /api/phase1/submit
- [x] POST /api/participants/register
- [x] GET /api/participants/[usn]
- [x] POST /api/matchmaking
- [x] GET /api/matchmaking/status
- [x] GET /api/leaderboard

## Runtime Smoke Checks (Executed)

Executed safe checks against local dev server:

- [x] GET /api/health -> 200
- [x] GET /api/tournament/state -> 200
- [x] GET /api/tournament/status -> 200
- [x] GET /api/phase1/status -> 200
- [x] GET /api/leaderboard -> 200
- [x] GET /api/matchmaking/status without usn -> 400 (expected validation)
- [x] GET /api/phase1/questions without usn -> 400 (expected validation)
- [x] GET /api/participants/UNKNOWNUSN -> 404 (expected)
- [x] Production build passes

Note: destructive/flow-mutating endpoint scenarios are documented below as manual test cases.

## Issues Found and Resolved

- [x] Leaderboard split sections removed; now one unified board only.
- [x] Leaderboard ranking derives qualification from sorted submitted users each refresh.
- [x] Leaderboard read path no longer performs DB writes, reducing lock/contention risk.
- [x] Tournament start made idempotent to avoid accidental restart side effects.
- [x] Tournament start now updates phase timestamps/state atomically.
- [x] Qualification recomputation on completion no longer short-circuits on stale qualified flags.
- [x] Session preload for mapped participants parallelized for faster phase start.
- [x] Registration validation tightened (USN format + name length).
- [x] Final submit hardened against duplicate-race submissions with conditional transaction updates.

## Remaining Risks and Recommended Features

### Critical Priority

- [ ] Replace in-memory matchmaking lock set with distributed lock (Redis/DB lock token).
- [ ] Add snapshot total participant count at phase start to prevent dynamic-count drift.
- [ ] Add rate-limiting on high-frequency endpoints (/api/matchmaking/status, /api/tournament/status).

### High Priority

- [ ] Add visible network error UI + retry/backoff in arena polling.
- [ ] Add question integrity guard (correctOptionId must exist in options).
- [ ] Add anti-multi-tab answer conflict handling in client UX.
- [ ] Add endpoint-level structured logging with request ids for event debugging.

### Medium Priority

- [ ] Add manual admin reset endpoint (safe, authenticated) for event recovery.
- [ ] Add leaderboard response metadata (generatedAt, totalSubmitted, qualifiedCount).
- [ ] Add archiving/export script for final results.

## Manual End-to-End Tests Required Before Event

### Registration and Entry

- [ ] Register new 1st-year participant (valid USN)
- [ ] Register new 2nd-year participant (valid USN)
- [ ] Reject invalid USN
- [ ] Reject duplicate USN

### Matchmaking

- [ ] Two participants enter arena and both get mapped to each other
- [ ] Single participant remains WAITING_FOR_OPPONENT
- [ ] Refresh both clients and ensure mapping remains stable

### Battle Flow

- [ ] Horn click starts only local participant flow
- [ ] Questions load after horn when phase active
- [ ] Confirm answer locks value per question
- [ ] Submit works only after all pre-final confirmations are present
- [ ] Duplicate submit attempt returns 409

### Completion and Leaderboard

- [ ] After all mapped participants submit, leaderboard unlocks
- [ ] Ranking order: score desc, submittedAt asc, id asc
- [ ] Top 8 are marked qualified (or all submitted if total submitted < 8)
- [ ] Refresh leaderboard repeatedly and confirm deterministic ranking

## Event-Day Ops Checklist

### T-60 min

- [ ] Vercel deployment healthy and latest commit deployed
- [ ] Neon DB connectivity healthy
- [ ] No pending migration; prisma migrate deploy succeeded
- [ ] /api/health returns 200 from production URL

### During Event

- [ ] Monitor Vercel function errors
- [ ] Monitor DB connection pressure
- [ ] Spot-check stuck users in matchmaking queue
- [ ] Spot-check submission count progression

### Post Event

- [ ] Export final leaderboard
- [ ] Verify qualified set integrity against sorted submissions
- [ ] Archive participant session data
- [ ] Capture incident notes for next run

## Change Log for This Audit Pass

- Updated API and runtime safety in:
  - app/api/leaderboard/route.ts
  - app/api/tournament/start/route.ts
  - app/api/tournament/status/route.ts
  - app/api/participants/register/route.ts
  - app/api/phase1/submit/route.ts
  - lib/phase1Session.ts
- Updated leaderboard UI shape earlier in:
  - app/leaderboard/page.tsx
