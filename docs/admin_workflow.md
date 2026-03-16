# Admin Workflow

Step-by-step guide for the admin managing Clash of Codes 2.0 on event day.

All admin API calls require the `x-admin-token` header. The admin dashboard UI wraps all of these actions.

---

## Pre-Event Setup

- [ ] Load Phase 1 questions into DB via `POST /api/admin/phase1/questions`
- [ ] Load Phase 2 questions into DB via `POST /api/admin/phase2/questions`
- [ ] Verify MongoDB connection and server are running
- [ ] Open registration on the frontend (no toggle needed — always open before Phase 1 starts)

---

## Phase 1 — Rapid Fire Round

| Step | Action                        | API Call                                |
| ---- | ----------------------------- | --------------------------------------- |
| 1    | Open quiz for participants    | `POST /api/admin/phase1/start`          |
| 2    | Monitor submission count live | `GET /api/admin/participants`           |
| 3    | Close quiz when time is up    | `POST /api/admin/phase1/end`            |
| 4    | View top 64 per track         | `GET /api/admin/participants/qualified` |

**After Phase 1 ends**, the server:

- Ranks participants by `phase1Score` (desc), then `phase1Time` (asc)
- Sets `phase1Qualified = true` for top 64 per track

---

## Phase 2 — MCQ Duels

Repeat the following steps for each round until 8 players remain.

| Step | Action                             | API Call                           |
| ---- | ---------------------------------- | ---------------------------------- |
| 1    | Generate pairings for round N      | `POST /api/admin/phase2/matchmake` |
| 2    | Announce match room IDs to players | — (display on screen / share)      |
| 3    | Monitor matches in real-time       | `GET /api/admin/phase2/matches`    |
| 4    | Wait for all matches to complete   | — (Socket.IO auto-resolves)        |
| 5    | Advance winners to next round      | `POST /api/admin/phase2/advance`   |

**Admin checklist before each round:**

- Confirm all players from the previous round's winners are present
- Confirm player count is even (must be 32 / 16 / 8)
- Confirm new question set is available for Phase 2 (or reuse)

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
