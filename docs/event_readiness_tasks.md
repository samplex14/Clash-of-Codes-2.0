# Event Readiness Tasks

Pre-event checklist to ensure Clash of Codes 2.0 runs without issues.

---

## Development Checklist

### Backend

- [x] MongoDB Atlas cluster (or local instance) is set up and accessible
- [x] `.env` file configured with `MONGO_URI`, `PORT`, `ADMIN_SECRET`
- [x] All REST API endpoints tested (Postman / Thunder Client)
- [x] Socket.IO duel flow tested end-to-end (2 browser tabs)
- [x] Phase 1 session start/end correctly sets `phase1Qualified`
- [x] Matchmaking generates correct pairs per track
- [x] Duel result computed correctly (score → time tiebreaker)
- [x] Admin token middleware working on protected routes
- [x] Rate limiters configured (registration: 8/5min, submit: 4/min, admin: 30/min)
- [x] Database indexes defined on `Participant` and `Match` models
- [x] Socket.IO ping/timeout env-configurable for venue WiFi
- [x] Disconnect forfeit with grace period implemented (default 15s)
- [x] Unit tests for adminAuth and matchmaking shuffle
- [x] Socket.IO load test script available (`npm run loadtest:socket`)

### Frontend

- [ ] Registration form validates and submits correctly
- [ ] Phase 1 quiz loads questions, timer counts down, submits answers
- [ ] Phase 2 lobby connects to correct Socket.IO room
- [ ] Phase 2 duel shows live opponent progress
- [ ] Duel end screen shows winner/loser correctly
- [ ] Admin dashboard can start/end phases, trigger matchmaking
- [ ] Responsive on the screen sizes used in the venue (laptops / desktops)

### Data

- [ ] Phase 1 questions loaded into DB (verified count per track)
- [ ] Phase 2 questions loaded into DB (min 10 needed per match)
- [ ] Test run: 2 dummy participants registered, duel completed end-to-end

---

## Scaling & Load Handling (100-150 Users)

- [x] **Load Test Socket.IO:** `npm run loadtest:socket` simulates concurrent `join_room` and `submit_answer` events (script: `tests/socketLoadTest.js`)
- [x] **Socket.IO Options:** `pingInterval`, `pingTimeout`, and `connectTimeout` are env-configurable (`SOCKET_PING_INTERVAL_MS`, `SOCKET_PING_TIMEOUT_MS`, `SOCKET_CONNECT_TIMEOUT_MS`)
- [x] **PM2 Cluster Mode:** `ecosystem.config.js` at project root configured for multi-core deployment
- [x] **Database Indexing:** Compound indexes on `Participant` (track, score, qualified) and `Match` (round, track, status) — defined directly in Mongoose schemas
- [x] **API Rate Limiting:** `express-rate-limit` configured per endpoint in `middleware/rateLimiters.js`

---

## Deployment Checklist

- [ ] Server deployed and accessible on venue network
- [ ] Client deployed (or accessible via local IP)
- [ ] MongoDB connection string points to production DB
- [ ] Admin secret set and not shared with participants
- [ ] CORS configured for deployed client origin
- [ ] Environment variables tuned for venue WiFi (ping/timeout values)

---

## On Event Day

### Before Opening Registration

- [ ] Confirm server is running (`GET /api/health` returns `{ status: "ok" }`)
- [ ] Confirm DB is accessible
- [ ] Brief admin on dashboard workflow ([admin_workflow.md](./admin_workflow.md))
- [ ] Test registration with a dummy USN

### Before Phase 1

- [ ] Confirm question count loaded (`GET /api/admin/phase1/questions`)
- [ ] Announce to all participants to visit the registration link
- [ ] Wait for registrations to settle, then start Phase 1

### Before Phase 2

- [ ] Verify top 64 per track are marked `phase1Qualified = true`
- [ ] Confirm Phase 2 question pool ≥ 10 (`GET /api/admin/phase2/questions`)
- [ ] Announce Phase 2 format to participants
- [ ] Trigger Round 1 matchmaking only when all players are ready

### Before Phase 3

- [ ] Confirm top 8 per track are identified (`GET /api/admin/phase3/finalists`)
- [ ] HackerRank contest created and tested
- [ ] Invite links sent to finalists only

---

## Contingency

| Issue                           | Fallback                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------- |
| Server crashes mid-Phase 1      | Restart server; Phase 1 submissions are persisted — continue from last state |
| Player disconnects mid-duel     | Opponent wins after grace period (default 15s, configurable via `DUEL_DISCONNECT_GRACE_SECONDS`) |
| Odd number of qualified players | Admin manually promotes/drops a player to make the count even                |
| HackerRank outage               | Use backup coding platform (Codeforces / custom judge)                       |
| Rate limit triggered            | Wait for `retryAfterSec` (returned in 429 response), then retry             |
