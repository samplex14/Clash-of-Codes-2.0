# Database Schema

MongoDB is used as the database. All collections are listed below.

---

## Collection: `participants`

Stores all registered participants.

```js
{
  _id: ObjectId,
  usn: String,           // Unique — e.g. "1BM23CS001"
  name: String,
  year: Number,          // 1 or 2
  track: String,         // "1st_year" | "2nd_year"

  // Phase 1
  phase1Score: Number,   // Default: 0
  phase1Time: Number,    // Time taken in seconds
  phase1Qualified: Boolean, // true if in top 64

  // Phase 2 status
  phase2Active: Boolean,
  phase2Eliminated: Boolean,

  // Phase 3
  phase3Qualified: Boolean,

  registeredAt: Date
}
```

**Indexes:** `usn` (unique)

---

## Collection: `questions`

Stores questions for Phase 1 and Phase 2.

```js
{
  _id: ObjectId,
  phase: Number,         // 1 or 2
  text: String,          // Question body
  options: [String],     // Array of 4 options
  correctIndex: Number,  // 0-based index of correct option
  difficulty: String,    // "easy" | "medium" | "hard"
  tags: [String],        // e.g. ["arrays", "time-complexity"]
  createdAt: Date
}
```

---

## Collection: `phase1_sessions`

Tracks Phase 1 event state (single document, admin-controlled).

```js
{
  _id: ObjectId,
  status: String,        // "idle" | "active" | "ended"
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
  round: Number,         // 1 = Round of 64, 2 = Round of 32, etc.
  track: String,         // "1st_year" | "2nd_year"

  player1: ObjectId,     // ref: participants
  player2: ObjectId,     // ref: participants

  questions: [ObjectId], // ref: questions (same set for both)

  player1Answers: [
    {
      questionId: ObjectId,
      answerIndex: Number,
      correct: Boolean,
      answeredAt: Date
    }
  ],
  player2Answers: [...],

  player1Score: Number,
  player2Score: Number,
  player1TotalTime: Number,  // ms
  player2TotalTime: Number,

  winner: ObjectId,      // ref: participants
  status: String,        // "pending" | "active" | "completed"

  startedAt: Date,
  endedAt: Date
}
```

---

## Collection: `admin`

Stores admin credentials/token (single document).

```js
{
  _id: ObjectId,
  token: String          // Hashed admin secret for API protection
}
```
