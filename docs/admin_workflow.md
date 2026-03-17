# Admin Workflow

Step-by-step guide for the admin managing Clash of Codes 2.0 on event day.

All admin API calls require the `x-admin-token` header (value = `ADMIN_SECRET` env var). The admin dashboard UI wraps all of these actions. Admin actions are rate-limited to **30 requests per minute**.

---

## Pre-Event Setup

- [ ] Load Phase 1 questions into DB via `POST /api/admin/phase1/questions`
- [ ] Load Phase 2 questions into DB via `POST /api/admin/phase2/questions` (min 10 needed)
- [ ] Verify MongoDB connection and server are running (`GET /api/health`)
- [ ] Tune env vars for venue WiFi (`SOCKET_PING_INTERVAL_MS`, `SOCKET_PING_TIMEOUT_MS`, etc.)
- [ ] Open registration on the frontend (no toggle needed — always open before Phase 1 starts)

---

## Phase 1 — Rapid Fire Round

| Step | Action                        | API Call                                |
| ---- | ----------------------------- | --------------------------------------- |
| 1    | Open quiz for participants    | `POST /api/admin/phase1/start`          |
| 2    | Monitor submission count live | `GET /api/admin/participants`           |
| 3    | Check session status          | `GET /api/admin/phase1/status`          |
| 4    | Close quiz when time is up    | `POST /api/admin/phase1/end`            |
| 5    | View top 64 per track         | `GET /api/admin/participants/qualified` |
| 6    | View leaderboard              | `GET /api/phase1/leaderboard`           |

**After Phase 1 ends**, the server:

- Ranks participants by `phase1Score` (desc), then `phase1Time` (asc) per track
- Sets `phase1Qualified = true` and `phase2Active = true` for top 64 per track

> Note: Starting Phase 1 automatically ends any existing active session.

---

## Phase 2 — MCQ Duels

Repeat the following steps for each round until ≤ 8 players remain per track (typically 3 rounds: 64→32→16→8).

| Step | Action                             | API Call                           |
| ---- | ---------------------------------- | ---------------------------------- |
| 1    | Generate pairings for round N      | `POST /api/admin/phase2/matchmake` (body: `{ round: N }`) |
| 2    | View created matches               | `GET /api/admin/phase2/matches?round=N` |
| 3    | Announce match room IDs to players | — (display on screen / share)      |
| 4    | Monitor matches in real-time       | `GET /api/admin/phase2/matches`    |
| 5    | Wait for all matches to complete   | — (Socket.IO auto-resolves duels)  |
| 6    | Advance winners to next round      | `POST /api/admin/phase2/advance` (body: `{ round: N }`) |

**Admin checklist before each round:**

- Confirm all players from the previous round's winners are present
- Confirm player count is even (must be 64 / 32 / 16 / 8)
- Confirm Phase 2 question pool has ≥ 10 questions
- Advance will fail if any matches in the round are still incomplete

**Duel mechanics (handled by server):**
- Each match gets 10 random Phase 2 questions
- 90-second timer per duel (configurable via `DUEL_DURATION_SECONDS`)
- Unanswered questions auto-submitted as incorrect on timeout
- Disconnect grace period: 15s before opponent wins by forfeit

---

## Phase 3 — Grand Finals

| Step | Action                                             | API Call                          |
| ---- | -------------------------------------------------- | --------------------------------- |
| 1    | Confirm top 8 finalists (from Phase 2 winners)     | `GET /api/admin/phase3/finalists` |
| 2    | Create HackerRank contest and invite the 8 players | —                                 |
| 3    | Share contest link with finalists                  | —                                 |
| 4    | Start the contest at the scheduled time            | —                                 |
| 5    | Monitor HackerRank leaderboard live                | —                                 |
| 6    | Rank 1 player is the Champion                      | —                                 |

---

## Admin Dashboard Pages

| Page                  | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `/admin`              | Overview — current phase status                 |
| `/admin/participants` | View/search all registered participants         |
| `/admin/questions`    | Add / delete questions                          |
| `/admin/phase1`       | Start/stop Phase 1, view scores                 |
| `/admin/phase2`       | Trigger matchmaking, view current round matches |
| `/admin/leaderboard`  | Phase 1 rankings per track                      |
