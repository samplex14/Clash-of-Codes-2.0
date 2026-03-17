# API Routes

Base URL: `/api`

Admin-protected routes require the `x-admin-token` header.

---

## Health Check

| Method | Endpoint  | Auth | Rate Limit | Description          |
| ------ | --------- | ---- | ---------- | -------------------- |
| `GET`  | `/health` | —    | —          | Returns `{ status: "ok" }` |

---

## Participants

| Method | Endpoint                        | Auth  | Rate Limit | Description                |
| ------ | ------------------------------- | ----- | ---------- | -------------------------- |
| `POST` | `/participants/register`        | —     | `participantRegisterLimiter` (8 req / 5 min per USN or IP) | Register a new participant |
| `GET`  | `/participants/:usn`            | —     | —          | Get participant by USN     |
| `GET`  | `/admin/participants`           | Admin | `adminActionLimiter` (30 req / min) | Get all participants       |
| `GET`  | `/admin/participants/qualified` | Admin | `adminActionLimiter` | Get qualified participants (top 64 per track) |

### POST `/participants/register`

**Body:**

```json
{
  "usn": "1BM23CS001",
  "name": "Ravi Kumar",
  "year": 1
}
```

**Response (201):**

```json
{
  "success": true,
  "participant": {
    "_id": "...",
    "usn": "1BM23CS001",
    "name": "Ravi Kumar",
    "year": 1,
    "track": "1st_year"
  }
}
```

**Validation:** `usn`, `name`, `year` required. `year` must be `1` or `2`. Duplicate USN returns `400`.

---

## Questions

Questions are scoped to their phase. Phase 1 and Phase 2 have separate routes.

### Phase 1 Questions

| Method   | Endpoint                      | Auth  | Rate Limit | Description                                         |
| -------- | ----------------------------- | ----- | ---------- | --------------------------------------------------- |
| `POST`   | `/admin/phase1/questions`     | Admin | —          | Add a Phase 1 question                              |
| `GET`    | `/admin/phase1/questions`     | Admin | —          | Get all Phase 1 questions                           |
| `DELETE` | `/admin/phase1/questions/:id` | Admin | —          | Delete a Phase 1 question                           |
| `GET`    | `/phase1/questions`           | —     | —          | Get Phase 1 questions (only when session is active, `correctIndex` excluded) |

### Phase 2 Questions

| Method   | Endpoint                      | Auth  | Rate Limit | Description               |
| -------- | ----------------------------- | ----- | ---------- | ------------------------- |
| `POST`   | `/admin/phase2/questions`     | Admin | —          | Add a Phase 2 question    |
| `GET`    | `/admin/phase2/questions`     | Admin | —          | Get all Phase 2 questions |
| `DELETE` | `/admin/phase2/questions/:id` | Admin | —          | Delete a Phase 2 question |

> Phase 2 questions are **not exposed publicly** — they are delivered directly to players via Socket.IO (`duel_start` event) when a match begins.

---

## Phase 1

| Method | Endpoint               | Auth  | Rate Limit | Description                              |
| ------ | ---------------------- | ----- | ---------- | ---------------------------------------- |
| `POST` | `/admin/phase1/start`  | Admin | `adminActionLimiter` | Start Phase 1 session                    |
| `POST` | `/admin/phase1/end`    | Admin | `adminActionLimiter` | End Phase 1 and compute top 64 per track |
| `GET`  | `/admin/phase1/status` | Admin | `adminActionLimiter` | Get current Phase 1 session status       |
| `POST` | `/phase1/submit`       | —     | `phase1SubmitLimiter` (4 req / min per USN or IP) | Submit Phase 1 answers |
| `GET`  | `/phase1/leaderboard`  | Admin | `adminActionLimiter` | Phase 1 scores sorted by score desc, time asc |

### POST `/phase1/submit`

**Body:**

```json
{
  "usn": "1BM23CS001",
  "answers": [0, 2, 1, 3],
  "timeTaken": 45
}
```

**Response:**

```json
{
  "success": true,
  "score": 3,
  "total": 4
}
```

**Validation:** `usn`, `answers`, `timeTaken` required. Phase 1 must be active. Double-submit returns `409`.

---

## Phase 2

| Method | Endpoint                  | Auth  | Rate Limit | Description                         |
| ------ | ------------------------- | ----- | ---------- | ----------------------------------- |
| `POST` | `/admin/phase2/matchmake` | Admin | `adminActionLimiter` | Generate pairings for a round (body: `{ round }`) |
| `GET`  | `/admin/phase2/matches`   | Admin | `adminActionLimiter` | Get matches (optional `?round=N` filter) |
| `GET`  | `/matches/:matchId`       | —     | —          | Get match details (public)          |
| `POST` | `/admin/phase2/advance`   | Admin | `adminActionLimiter` | Advance winners, eliminate losers (body: `{ round }`) |
| `GET`  | `/admin/phase3/finalists` | Admin | `adminActionLimiter` | Get Phase 3 finalists (top 8 per track) |

---

## Rate Limiters

All rate limiters are defined in `middleware/rateLimiters.js` using `express-rate-limit`.

| Limiter Name | Window | Max Requests | Key Strategy | Applied To |
|---|---|---|---|---|
| `participantRegisterLimiter` | 5 min | 8 | USN (body) or IP | `POST /participants/register` |
| `phase1SubmitLimiter` | 1 min | 4 | USN (body) or IP | `POST /phase1/submit` |
| `adminActionLimiter` | 1 min | 30 | Admin token (header) or IP | All admin endpoints |

Rate-limited responses return `429` with `{ error, retryAfterSec }`.

---

## WebSocket Events (Socket.IO)

Namespace: `/duel`

### Environment Configuration

| Variable | Default | Description |
|---|---|---|
| `SOCKET_PING_INTERVAL_MS` | `30000` | How often server pings clients |
| `SOCKET_PING_TIMEOUT_MS` | `45000` | How long to wait for pong before considering client dead |
| `SOCKET_CONNECT_TIMEOUT_MS` | `45000` | Max time for initial connection handshake |
| `DUEL_DURATION_SECONDS` | `90` | Time limit per duel |
| `DUEL_DISCONNECT_GRACE_SECONDS` | `15` | Grace period before disconnect forfeit |

Transports: `["websocket", "polling"]` with `allowUpgrades: true`.

### Client → Server

| Event           | Payload                                                   | Ack Response | Description                   |
| --------------- | --------------------------------------------------------- | ------------ | ----------------------------- |
| `join_room`     | `{ matchId, usn }`                                        | `{ ok, matchId, opponentUsn }` or `{ ok: false, error }` | Player joins their duel room  |
| `ready`         | `{ matchId, usn }`                                        | — | Player signals ready to start |
| `submit_answer` | `{ matchId, usn, questionIndex, answerIndex, timestamp }` | `{ ok, correct, answeredCount }` or `{ ok: false, error }` | Player submits an answer      |

### Server → Client

| Event               | Payload                                             | Description                                             |
| ------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| `room_joined`       | `{ matchId, opponent: { usn, name } }`              | Confirms room join with opponent info                   |
| `duel_start`        | `{ questions, startTime, durationSeconds, endsAt }` | Duel begins, questions delivered (text + options only)  |
| `opponent_progress` | `{ answered: Number }`                              | How many questions opponent has answered                |
| `duel_end`          | `{ winner, player1Score, player2Score, reason? }`   | Duel result (reason: `"disconnect_forfeit"` if applicable) |
| `error`             | `{ message }`                                       | Error message                                           |

### Disconnect Handling

When a player disconnects during an active duel, a grace period timer starts (`DUEL_DISCONNECT_GRACE_SECONDS`, default 15s). If the player reconnects within this window, the timer is cancelled. If the timer expires, the opponent is awarded the win with `reason: "disconnect_forfeit"`.
