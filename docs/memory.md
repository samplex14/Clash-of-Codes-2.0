# 🧠 Memory — Clash of Codes 2.0

> **Purpose:** Single source of truth for the entire codebase. Read this file first before analyzing anything. Update this file whenever a feature is added or changed.
>
> **Last updated:** 2026-03-17

---

## Project Overview

A 1v1 coding competition platform with 3 phases, 2 year-based tracks (`1st_year`, `2nd_year`), running independently. No user auth — USN-based identity for frictionless one-day event registration.

---

## Tech Stack

| Layer | Tech | Version |
|---|---|---|
| Frontend | React (Vite) | — |
| Backend | Node.js + Express | Express 4.21 |
| Database | MongoDB (Mongoose) | Mongoose 8.9 |
| Realtime | Socket.IO | 4.8 |
| Rate Limiting | express-rate-limit | 7.5 |
| Process Manager | PM2 | ecosystem.config.js at project root |

---

## Server Directory Map

```
server/
├── index.js                          # Entry point: Express + Socket.IO bootstrap
├── package.json                      # Dependencies and npm scripts
├── .env                              # MONGO_URI, PORT, ADMIN_SECRET, DUEL_*, SOCKET_*
├── config/
│   └── db.js                         # mongoose.connect(MONGO_URI)
├── controllers/
│   ├── participantController.js      # register, getByUSN, getAll, getQualified
│   ├── questionController.js         # addQuestion(phase), getQuestions(phase), deleteQuestion
│   ├── phase1Controller.js           # startPhase1, endPhase1, getPhase1Status, submitPhase1, getLeaderboard, getPhase1Questions
│   └── phase2Controller.js           # matchmake, getMatches, getMatch, advanceWinners, getFinalists
├── middleware/
│   ├── adminAuth.js                  # x-admin-token vs ADMIN_SECRET
│   └── rateLimiters.js               # phase1SubmitLimiter, participantRegisterLimiter, adminActionLimiter
├── models/
│   ├── Participant.js                # USN, name, year, track, phase1/2/3 flags + indexes + pre-save hook
│   ├── Question.js                   # phase, text, options[4], correctIndex, difficulty, tags
│   ├── Match.js                      # round, track, players, questions, answers, scores, winner + indexes
│   └── Phase1Session.js              # status (idle/active/ended), startedAt, endedAt, durationSeconds
├── routes/
│   ├── participantRoutes.js          # /participants/register, /participants/:usn, /admin/participants/*
│   ├── questionRoutes.js             # /admin/phase1/questions, /admin/phase2/questions (CRUD)
│   ├── phase1Routes.js               # /admin/phase1/start|end|status, /phase1/submit|questions|leaderboard
│   └── phase2Routes.js               # /admin/phase2/matchmake|matches|advance, /admin/phase3/finalists, /matches/:matchId
├── sockets/
│   ├── index.js                      # Socket.IO init with env-configurable ping/timeout, /duel namespace
│   └── duelHandler.js                # join_room, ready, submit_answer, disconnect (383 lines)
├── utils/
│   └── matchmaking.js                # Fisher-Yates shuffle, generateMatches(track, round), 10 questions/match
└── tests/
    ├── adminAuth.test.js             # 2 tests: reject missing token, allow valid token
    ├── matchmaking.test.js           # 2 tests: shuffle keeps elements, handles edge cases
    └── socketLoadTest.js             # Simulates concurrent Socket.IO clients
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGO_URI` | — | MongoDB connection string |
| `PORT` | `5000` | Server port |
| `ADMIN_SECRET` | — | Admin auth token |
| `DUEL_DURATION_SECONDS` | `90` | Duel timer |
| `DUEL_DISCONNECT_GRACE_SECONDS` | `15` | Reconnect window before forfeit |
| `SOCKET_PING_INTERVAL_MS` | `30000` | Socket.IO ping interval |
| `SOCKET_PING_TIMEOUT_MS` | `45000` | Socket.IO ping timeout |
| `SOCKET_CONNECT_TIMEOUT_MS` | `45000` | Socket.IO connect timeout |

---

## NPM Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm start` | `node index.js` | Production |
| `npm run dev` | `nodemon index.js` | Dev with auto-reload |
| `npm test` | `node --test "tests/**/*.test.js"` | Unit tests |
| `npm run loadtest:socket` | `node tests/socketLoadTest.js` | Socket.IO load test |

---

## Database Collections & Indexes

### `participants`

| Field | Type | Notes |
|---|---|---|
| `usn` | String | Unique, trimmed, uppercase |
| `name` | String | Trimmed |
| `year` | Number | 1 or 2 |
| `track` | String | `1st_year` / `2nd_year` (auto from year via pre-save) |
| `phase1Score` | Number | Default 0 |
| `phase1Time` | Number | Default 0 (seconds) |
| `phase1Submitted` | Boolean | Default false |
| `phase1Qualified` | Boolean | Default false |
| `phase2Active` | Boolean | Default false |
| `phase2Eliminated` | Boolean | Default false |
| `phase3Qualified` | Boolean | Default false |
| `registeredAt` | Date | Default Date.now |

**Indexes:** `usn` (unique), `{ track: 1 }`, `{ track: 1, phase1Score: -1, phase1Time: 1 }`, `{ phase1Qualified: 1, track: 1, phase1Score: -1, phase1Time: 1 }`

### `questions`

| Field | Type | Notes |
|---|---|---|
| `phase` | Number | 1 or 2 |
| `text` | String | Required |
| `options` | [String] | Exactly 4 (validated) |
| `correctIndex` | Number | 0–3 |
| `difficulty` | String | easy/medium/hard, default medium |
| `tags` | [String] | Optional |
| `createdAt` | Date | Default Date.now |

### `phase1sessions`

| Field | Type | Notes |
|---|---|---|
| `status` | String | idle/active/ended |
| `startedAt` | Date | |
| `endedAt` | Date | |
| `durationSeconds` | Number | |

### `matches`

| Field | Type | Notes |
|---|---|---|
| `round` | Number | Required |
| `track` | String | Required |
| `player1` / `player2` | ObjectId → Participant | Required |
| `questions` | [ObjectId → Question] | 10 per match |
| `player1Answers` / `player2Answers` | [{ questionId, answerIndex, correct, answeredAt }] | |
| `player1Score` / `player2Score` | Number | Default 0 |
| `player1TotalTime` / `player2TotalTime` | Number | ms |
| `winner` | ObjectId → Participant | |
| `status` | String | pending/active/completed |
| `startedAt` / `endedAt` | Date | |

**Indexes:** `{ round: 1, track: 1, _id: 1 }`, `{ round: 1, status: 1 }`, `{ status: 1 }`

---

## Complete API Surface

### Public Endpoints

| Method | Route | Rate Limit | Controller |
|---|---|---|---|
| `GET` | `/api/health` | — | Inline (index.js) |
| `POST` | `/api/participants/register` | 8/5min | participantController.register |
| `GET` | `/api/participants/:usn` | — | participantController.getByUSN |
| `GET` | `/api/phase1/status` | — | phase1Controller.getPhase1Status |
| `GET` | `/api/phase1/leaderboard` | — | phase1Controller.getLeaderboard (Public view if active) |
| `GET` | `/api/matches/:matchId` | — | phase2Controller.getMatch |

### Admin Endpoints (all require `x-admin-token`, rate limit 30/min)

| Method | Route | Controller |
|---|---|---|
| `GET` | `/api/admin/participants` | participantController.getAll |
| `GET` | `/api/admin/participants/qualified` | participantController.getQualified |
| `POST` | `/api/admin/phase1/start` | phase1Controller.startPhase1 |
| `POST` | `/api/admin/phase1/end` | phase1Controller.endPhase1 |
| `GET` | `/api/admin/phase1/status` | phase1Controller.getPhase1Status |
| `GET` | `/api/phase1/leaderboard` | phase1Controller.getLeaderboard |
| `POST` | `/api/admin/phase1/questions` | questionController.addQuestion(1) |
| `GET` | `/api/admin/phase1/questions` | questionController.getQuestions(1) |
| `DELETE` | `/api/admin/phase1/questions/:id` | questionController.deleteQuestion |
| `POST` | `/api/admin/phase2/questions` | questionController.addQuestion(2) |
| `GET` | `/api/admin/phase2/questions` | questionController.getQuestions(2) |
| `DELETE` | `/api/admin/phase2/questions/:id` | questionController.deleteQuestion |
| `POST` | `/api/admin/phase2/matchmake` | phase2Controller.matchmake |
| `GET` | `/api/admin/phase2/matches` | phase2Controller.getMatches |
| `POST` | `/api/admin/phase2/advance` | phase2Controller.advanceWinners |
| `GET` | `/api/admin/phase3/finalists` | phase2Controller.getFinalists |

### Socket.IO Events

#### Phase 1: Rapid Fire (namespace: `/phase1`)

| Direction | Event | Payload |
|---|---|---|
| C→S | `phase1:join` | `{ usn }` → ack `{ ok, alreadySubmitted, reconnected, confirmedAnswers, submitted, score, questions }` |
| Admin→S | `phase1:start` | `{ adminToken }` (triggers question push) |
| S→C | `phase1:questions` | `[{ questionId, text, options: [{id, text}] }]` (unique shuffle per socket) |
| C→S | `phase1:confirm_answer` | `{ questionId, selectedOptionId }` → ack `{ ok, questionId }` |
| S→C | `phase1:answer_confirmed`| `{ questionId }` |
| C→S | `phase1:submit` | `{ questionId, selectedOptionId }` (last Q) → ack `{ ok, score, total }` |
| S→C | `phase1:submit_error` | `{ message, missingQuestions }` |
| S→C | `phase1:result` | `{ score, total, breakdown: [{ questionId, correct }] }` |

#### Phase 2: MCQ Duels (namespace: `/duel`)

| Direction | Event | Payload |
|---|---|---|
| C→S | `join_room` | `{ matchId, usn }` → ack `{ ok, matchId, opponentUsn }` |
| C→S | `ready` | `{ matchId, usn }` |
| C→S | `submit_answer` | `{ matchId, usn, questionIndex, answerIndex, timestamp }` → ack `{ ok, correct, answeredCount }` |
| S→C | `room_joined` | `{ matchId, opponent: { usn, name } }` |
| S→C | `duel_start` | `{ questions, startTime, durationSeconds, endsAt }` |
| S→C | `opponent_progress` | `{ answered }` |
| S→C | `duel_end` | `{ winner, player1Score, player2Score, reason? }` |
| S→C | `error` | `{ message }` |

---

## Rate Limiters (`middleware/rateLimiters.js`)

| Name | Window | Max | Key |
|---|---|---|---|
| `participantRegisterLimiter` | 5 min | 8 | USN or IP |
| `phase1SubmitLimiter` | 1 min | 4 | USN or IP |
| `adminActionLimiter` | 1 min | 30 | Admin token or IP |

Returns `429 { error, retryAfterSec }` when triggered.

---

## Core Business Logic

### Phase 1 Flow (Socket.IO Real-Time)
1. Participant loads page → connects to `/phase1` → emits `phase1:join { usn }`. Session created in memory.
2. Admin emits `phase1:start` → Server fetches questions from DB, caches them.
3. Server generates unique shuffle (Fisher-Yates) for each participant session.
4. Server emits `phase1:questions` to participant sockets (no correct answers exposed).
5. Participant selects an option and clicks "Confirm Answer" → emits `phase1:confirm_answer`.
6. Server records confirmed answer in memory → emits `phase1:answer_confirmed` → UI locks question.
7. Participant reaches last question → "Submit" button appears.
8. Participant clicks Submit → emits `phase1:submit`.
9. Server validates all prior questions are confirmed. If missing, emits `phase1:submit_error`.
10. If valid, server grades answers vs cache, saves `phase1Score` to DB, marks `phase1Submitted` = true.
11. Server emits `phase1:result` to that participant only.
12. Admin calls REST `POST /api/admin/phase1/end` → marks top 64 per track `phase1Qualified` = true.

### Phase 2 Flow
1. Admin calls matchmake with `{ round }` → runs per track independently
2. Active uneliminated players shuffled (Fisher-Yates) → paired adjacently
3. Each match gets 10 random Phase 2 questions
4. Players join Socket.IO room → signal ready → duel_start when both ready
5. 90-second timer starts → auto-submits unanswered as incorrect on expiry
6. Winner: highest score, tiebreak by lowest totalTime (player1 wins if identical)
7. Admin calls advance → losers: `phase2Eliminated = true`, `phase2Active = false`
8. When ≤ 8 remain per track → `phase3Qualified = true`

### Disconnect Recovery
- Player disconnects during active duel → 15s grace timer starts
- Player reconnects (re-joins room) → timer cancelled
- Timer expires → opponent wins with `reason: "disconnect_forfeit"`
- In-memory tracking: `readyStates`, `duelTimers`, `disconnectTimers` objects

### Matchmaking Validation
- Must have ≥ 2 players per track
- Must be even count (odd → error, admin resolves manually)
- Must have ≥ 10 Phase 2 questions in DB

---

## Key Constants

| Constant | Value | Location |
|---|---|---|
| `QUESTIONS_PER_MATCH` | 10 | `utils/matchmaking.js` |
| Year → Track mapping | `1 → "1st_year"`, `2 → "2nd_year"` | `models/Participant.js` pre-save |
| Top qualifiers per track | 64 | `controllers/phase1Controller.js` endPhase1 |
| Phase 3 threshold | ≤ 8 per track | `controllers/phase2Controller.js` advanceWinners |

---

## Dependencies (`package.json`)

**Production:** cors, dotenv, express, express-rate-limit, mongoose, socket.io

**Dev:** nodemon, socket.io-client

---

## Changelog

| Date | Change |
|---|---|
| 2026-03-17 | Initial memory created from full codebase analysis |
