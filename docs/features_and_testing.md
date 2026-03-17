# Features and Testing

Complete feature list and corresponding test scenarios for Clash of Codes 2.0.

---

## Feature List

### Registration

- [x] Participant can register with USN, name, and year
- [x] Duplicate USN is rejected (400 error)
- [x] Track (`1st_year` / `2nd_year`) is auto-assigned from year field (pre-save hook)
- [x] USN is trimmed and uppercased automatically
- [x] Admin can view all registered participants (sorted by `registeredAt` desc)
- [x] Rate limited: 8 registrations per 5 minutes per USN or IP

### Phase 1 — Rapid Fire Round

- [x] Admin can start Phase 1 (any existing active sessions are auto-ended)
- [x] Participants see questions only while Phase 1 is active (`correctIndex` excluded)
- [x] Participant submits answers; server scores them immediately
- [x] Double-submit is prevented (409 "Already submitted")
- [x] Admin can end Phase 1 (session set to "ended")
- [x] After Phase 1 ends, top 64 per track are automatically qualified
- [x] Admin can view the Phase 1 leaderboard sorted by score desc, then time asc
- [x] Rate limited: 4 submit attempts per minute per USN or IP

### Phase 2 — MCQ Duels

- [x] Admin triggers matchmaking to create pairs for a round (body: `{ round }`)
- [x] Players shuffled randomly via Fisher-Yates; paired adjacently
- [x] Each match assigned 10 random Phase 2 questions
- [x] Player joins duel room via Socket.IO (`join_room` with ack response)
- [x] Both players must signal "ready" before duel starts
- [x] Questions delivered simultaneously to both players via `duel_start` event
- [x] Opponent progress (questions answered count) broadcast live
- [x] 90-second timer auto-submits unanswered questions at expiry (configurable via env)
- [x] Duplicate answers for the same question are rejected
- [x] Winner determined by score first, then total time as tiebreaker
- [x] Loser is marked `phase2Eliminated = true`, `phase2Active = false`
- [x] Admin can advance all round winners to next round
- [x] When ≤ 8 players remain per track, they are marked `phase3Qualified = true`
- [x] Disconnect grace period: 15s (configurable) before opponent wins by forfeit
- [x] Reconnecting within grace period cancels the forfeit timer

### Phase 3 — Grand Finals

- [x] Top 8 players per track are identified after Phase 2
- [x] Admin can view the finalists list (sorted by track, score, time)
- [x] (Conducted externally on HackerRank)

### Admin Dashboard

- [x] Protected by admin token (`x-admin-token` header vs `ADMIN_SECRET` env var)
- [x] Can add / delete questions for Phase 1 and Phase 2
- [x] Can view all registered participants
- [x] Can view qualified participants (sorted by track, score, time)
- [x] Can start / end Phase 1
- [x] Can trigger Phase 2 matchmaking
- [x] Can view all matches (filterable by round)
- [x] Can advance round winners
- [x] Can view Phase 3 finalists
- [x] Rate limited: 30 admin requests per minute per token or IP

### Infrastructure

- [x] Health check endpoint (`GET /api/health`)
- [x] API rate limiting with `express-rate-limit` (3 separate limiters)
- [x] Socket.IO env-configurable ping/timeout for unreliable WiFi
- [x] PM2 cluster mode configuration (`ecosystem.config.js`)
- [x] Database compound indexes for leaderboard and matchmaking performance
- [x] Socket.IO load test script (`npm run loadtest:socket`)
- [x] Unit tests for admin auth middleware and matchmaking shuffle (`npm test`)

---

## Test Scenarios

### Registration

| Scenario                        | Expected                           |
| ------------------------------- | ---------------------------------- |
| Valid USN, name, year submitted | 201 Created, participant returned  |
| Duplicate USN submitted         | 400 "USN already registered"       |
| Missing field (usn/name/year)   | 400 validation error               |
| Year = 1                        | Track = "1st_year"                 |
| Year = 2                        | Track = "2nd_year"                 |
| Year = 3 (invalid)              | 400 "year must be 1 or 2"         |
| 9th registration in 5 min       | 429 rate limited                   |

### Phase 1

| Scenario                          | Expected                           |
| --------------------------------- | ---------------------------------- |
| Submit before Phase 1 starts      | 403 "Phase 1 not active"           |
| Submit valid answers              | Score computed, total returned      |
| Submit after Phase 1 ends         | 403 "Phase 1 not active"           |
| Same USN submits twice            | 409 "Already submitted"            |
| End Phase 1 with 100 participants | Top 64 per track set `phase1Qualified = true` |
| 5th submit attempt in 1 min       | 429 rate limited                   |

### Phase 2 — Duel

| Scenario                                     | Expected                           |
| -------------------------------------------- | ---------------------------------- |
| Player joins room                            | `room_joined` event + ack response |
| Non-match player joins                       | Error "You are not in this match"  |
| Both players ready                           | `duel_start` sent with 10 questions |
| Player A answers 7/10, Player B answers 5/10 | Player A wins                      |
| Both answer 7/10 but A is faster             | Player A wins (time tiebreaker)    |
| Player disconnects for > 15s                 | Opponent wins (disconnect_forfeit) |
| Player reconnects within 15s                 | Forfeit timer cancelled, duel continues |
| Duplicate answer for same question           | Error "Question already answered"  |
| Timer expires (90s)                          | Unanswered marked wrong, winner computed |

### Matchmaking

| Scenario              | Expected                           |
| --------------------- | ---------------------------------- |
| 64 qualified players  | 32 match documents created         |
| 32 remaining          | 16 match documents created         |
| Odd number of players | Error "Admin must resolve"         |
| < 2 players           | Error "Not enough players"         |
| < 10 Phase 2 questions | Error "Not enough Phase 2 questions" |

### Admin Auth

| Scenario              | Expected         |
| --------------------- | ---------------- |
| Valid token            | Request proceeds |
| Missing / wrong token | 401 Unauthorized |
| 31st admin req in 1 min | 429 rate limited |
