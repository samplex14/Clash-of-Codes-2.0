# Database Schema

MongoDB is used as the database. All collections are listed below.

---

## Collection: `participants`

Stores all registered participants.

```js
{
  _id: ObjectId,
  usn: String,              // Unique — e.g. "1BM23CS001" (trimmed, uppercase)
  name: String,             // Trimmed
  year: Number,             // 1 or 2
  track: String,            // "1st_year" | "2nd_year" (auto-set from year via pre-save hook)

  // Phase 1
  phase1Score: Number,      // Default: 0
  phase1Time: Number,       // Time taken in seconds — Default: 0
  phase1Submitted: Boolean, // Default: false — prevents double-submit
  phase1Qualified: Boolean, // Default: false — true if in top 64

  // Phase 2 status
  phase2Active: Boolean,    // Default: false — set true when qualified for Phase 2
  phase2Eliminated: Boolean,// Default: false — set true when knocked out

  // Phase 3
  phase3Qualified: Boolean, // Default: false — set true when ≤8 remain

  registeredAt: Date        // Default: Date.now
}
```

**Indexes:**

| Index Fields | Purpose |
|---|---|
| `usn` (unique) | Fast lookup by USN |
| `{ track: 1 }` | Track-scoped queries in qualification and matchmaking |
| `{ track: 1, phase1Score: -1, phase1Time: 1 }` | Top-N leaderboard queries with tiebreaker |
| `{ phase1Qualified: 1, track: 1, phase1Score: -1, phase1Time: 1 }` | Admin qualified-list views |

**Pre-save hook:** Auto-assigns `track` from `year` (`1 → "1st_year"`, `2 → "2nd_year"`).

---

## Collection: `questions`

Stores questions for Phase 1 and Phase 2.

```js
{
  _id: ObjectId,
  phase: Number,            // 1 or 2
  text: String,             // Question body (required)
  options: [String],        // Array of exactly 4 options (validated)
  correctIndex: Number,     // 0–3 index of correct option (required)
  difficulty: String,       // "easy" | "medium" | "hard" — Default: "medium"
  tags: [String],           // e.g. ["arrays", "time-complexity"]
  createdAt: Date           // Default: Date.now
}
```

---

## Collection: `phase1sessions`

Tracks Phase 1 event state (admin-controlled).

```js
{
  _id: ObjectId,
  status: String,           // "idle" | "active" | "ended" — Default: "idle"
  startedAt: Date,
  endedAt: Date,
  durationSeconds: Number
}
```

---

## Collection: `matches`

Represents a single Phase 2 1v1 duel.

```js
{
  _id: ObjectId,
  round: Number,            // 1 = Round of 64, 2 = Round of 32, etc. (required)
  track: String,            // "1st_year" | "2nd_year" (required)

  player1: ObjectId,        // ref: Participant (required)
  player2: ObjectId,        // ref: Participant (required)

  questions: [ObjectId],    // ref: Question — same set for both players (10 per match)

  player1Answers: [
    {
      questionId: ObjectId, // ref: Question
      answerIndex: Number,  // null if auto-submitted on timeout
      correct: Boolean,
      answeredAt: Date
    }
  ],
  player2Answers: [...],    // Same schema as player1Answers

  player1Score: Number,     // Default: 0
  player2Score: Number,     // Default: 0
  player1TotalTime: Number, // ms from match start to last answer
  player2TotalTime: Number, // ms from match start to last answer

  winner: ObjectId,         // ref: Participant
  status: String,           // "pending" | "active" | "completed" — Default: "pending"

  startedAt: Date,
  endedAt: Date
}
```

**Indexes:**

| Index Fields | Purpose |
|---|---|
| `{ round: 1, track: 1, _id: 1 }` | All matches for a round, sorted admin list views |
| `{ round: 1, status: 1 }` | Phase progression checks (incomplete matches in a round) |
| `{ status: 1 }` | Operational dashboards filtered by state |

---

## Admin Authentication

Admin identity is **not stored in the database**. Instead, admin endpoints are protected by a shared secret (`ADMIN_SECRET` in `.env`), validated via the `x-admin-token` HTTP header in the `adminAuth` middleware. There is no `admin` collection.
