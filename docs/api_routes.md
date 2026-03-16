# API Routes

Base URL: `/api`

Admin-protected routes require the `x-admin-token` header.

---

## Participants

| Method | Endpoint                        | Auth  | Description                |
| ------ | ------------------------------- | ----- | -------------------------- |
| `POST` | `/participants/register`        | —     | Register a new participant |
| `GET`  | `/participants/:usn`            | —     | Get participant by USN     |
| `GET`  | `/admin/participants`           | Admin | Get all participants       |
| `GET`  | `/admin/participants/qualified` | Admin | Get top 64 per track       |

### POST `/participants/register`

**Body:**

```json
{
  "usn": "1BM23CS001",
  "name": "Ravi Kumar",
  "year": 1
}
```

**Response:**

```json
{
  "success": true,
  "participant": {
    "_id": "...",
    "usn": "...",
    "name": "...",
    "year": 1,
    "track": "1st_year"
  }
}
```

---

## Questions

Questions are scoped to their phase. Phase 1 and Phase 2 have completely separate routes.

### Phase 1 Questions

| Method   | Endpoint                      | Auth  | Description                                         |
| -------- | ----------------------------- | ----- | --------------------------------------------------- |
| `POST`   | `/admin/phase1/questions`     | Admin | Add a Phase 1 question                              |
| `GET`    | `/admin/phase1/questions`     | Admin | Get all Phase 1 questions                           |
| `DELETE` | `/admin/phase1/questions/:id` | Admin | Delete a Phase 1 question                           |
| `GET`    | `/phase1/questions`           | —     | Get Phase 1 questions (only when session is active) |

### Phase 2 Questions

| Method   | Endpoint                      | Auth  | Description               |
| -------- | ----------------------------- | ----- | ------------------------- |
| `POST`   | `/admin/phase2/questions`     | Admin | Add a Phase 2 question    |
| `GET`    | `/admin/phase2/questions`     | Admin | Get all Phase 2 questions |
| `DELETE` | `/admin/phase2/questions/:id` | Admin | Delete a Phase 2 question |

> Phase 2 questions are **not exposed publicly** — they are delivered directly to players via Socket.IO (`duel_start` event) when a match begins.

---

## Phase 1

| Method | Endpoint               | Auth  | Description                              |
| ------ | ---------------------- | ----- | ---------------------------------------- |
| `POST` | `/admin/phase1/start`  | Admin | Start Phase 1 session                    |
| `POST` | `/admin/phase1/end`    | Admin | End Phase 1 and compute top 64           |
| `GET`  | `/admin/phase1/status` | Admin | Get current Phase 1 session status       |
| `POST` | `/phase1/submit`       | —     | Submit Phase 1 answers for a participant |
| `GET`  | `/phase1/leaderboard`  | Admin | Phase 1 scores sorted                    |

### POST `/phase1/submit`

**Body:**

```json
{
  "usn": "1BM23CS001",
  "answers": [0, 2, 1, 3],
  "timeTaken": 45
}
```

---

## Phase 2

| Method | Endpoint                  | Auth  | Description                         |
| ------ | ------------------------- | ----- | ----------------------------------- |
| `POST` | `/admin/phase2/matchmake` | Admin | Generate pairings for current round |
| `GET`  | `/admin/phase2/matches`   | Admin | Get all matches for current round   |
| `GET`  | `/matches/:matchId`       | —     | Get match details                   |
| `POST` | `/admin/phase2/advance`   | Admin | Advance winners to next round       |
| `GET`  | `/admin/phase3/finalists` | Admin | Get Phase 3 finalists (top 8/track) |

---

## WebSocket Events (Socket.IO)

Namespace: `/duel`

### Client → Server

| Event           | Payload                                                   | Description                   |
| --------------- | --------------------------------------------------------- | ----------------------------- |
| `join_room`     | `{ matchId, usn }`                                        | Player joins their duel room  |
| `submit_answer` | `{ matchId, usn, questionIndex, answerIndex, timestamp }` | Player submits an answer      |
| `ready`         | `{ matchId, usn }`                                        | Player signals ready to start |

### Server → Client

| Event               | Payload                                             | Description                                             |
| ------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| `room_joined`       | `{ matchId, opponent }`                             | Confirms room join                                      |
| `duel_start`        | `{ questions, startTime, durationSeconds, endsAt }` | Duel begins, questions delivered                        |
| `opponent_progress` | `{ answered: Number }`                              | How many questions opponent has answered                |
| `duel_end`          | `{ winner, player1Score, player2Score, reason }`    | Duel result (reason: "disconnect_forfeit" or undefined) |
| `error`             | `{ message }`                                       | Error message                                           |
