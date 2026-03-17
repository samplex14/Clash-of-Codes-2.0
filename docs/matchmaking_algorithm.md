# Matchmaking Algorithm

How Phase 2 player pairing works for each round.

---

## Overview

Matchmaking is run **once per round** by the admin via `POST /api/admin/phase2/matchmake` (body: `{ round }`). It operates independently per track (1st year and 2nd year pools never mix).

---

## Input

- A list of **active (uneliminated) participants** in the current track.
- In Round 1: the top 64 qualifiers from Phase 1.
- In subsequent rounds: winners from the previous round.

---

## Algorithm (per track)

```
function generateMatches(track, round):
  1. Query: participants where track = track, phase2Active = true, phase2Eliminated = false
  2. Validate: must have ≥ 2 players, must be even count
  3. Shuffle: Fisher-Yates random shuffle of the player list
  4. For each adjacent pair [players[i], players[i+1]]:
       - Fetch all Phase 2 questions from DB
       - Shuffle them and pick first 10 (QUESTIONS_PER_MATCH = 10)
       - Create a `matches` document with:
           · round, track
           · player1 = players[i], player2 = players[i+1]
           · questions = 10 randomly selected question IDs
           · status = "pending"
  5. Return array of created match documents
```

### Fisher-Yates Shuffle (from `utils/matchmaking.js`)

```js
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

---

## Match Configuration

| Setting | Value | Source |
|---|---|---|
| Questions per match | 10 | `QUESTIONS_PER_MATCH` constant in `utils/matchmaking.js` |
| Duel duration | 90 seconds | `DUEL_DURATION_SECONDS` env var (default: 90) |
| Disconnect grace period | 15 seconds | `DUEL_DISCONNECT_GRACE_SECONDS` env var (default: 15) |

---

## Round Progression

| Round | Players In | Pairs | Players Advancing |
| ----- | ---------- | ----- | ----------------- |
| 1     | 64         | 32    | 32                |
| 2     | 32         | 16    | 16                |
| 3     | 16         | 8     | 8 → Phase 3      |

> Phase 2 ends when ≤ 8 players remain per track. The `advanceWinners` endpoint automatically sets `phase3Qualified = true` for remaining players.

---

## Duel Winner Determination

After both players submit all answers (or the 90-second timer expires):

```
1. Auto-submit: mark any unanswered questions as incorrect (answerIndex = null).
2. Count correct answers for each player.
3. If player1Score > player2Score → player1 wins.
4. If player2Score > player1Score → player2 wins.
5. If scores are equal → compare totalTime (ms from match start to last answer):
     - Lower totalTime wins.
6. Update match.winner, match.status = "completed".
7. Emit `duel_end` to both players.
```

Loser elimination happens when the admin calls `POST /api/admin/phase2/advance` (sets `phase2Eliminated = true`, `phase2Active = false` for each loser).

---

## Disconnect Handling

If a player disconnects during an active duel:

1. Server starts a grace period timer (`DUEL_DISCONNECT_GRACE_SECONDS`)
2. If the player reconnects (`join_room` again), the timer is cancelled
3. If the timer expires, the remaining player wins with `reason: "disconnect_forfeit"`

---

## Edge Cases

| Scenario              | Handling                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| Odd number of players | Error returned: "Admin must resolve." Admin must manually adjust player count before matchmaking.      |
| < 2 players in track  | Error returned: "Not enough players in {track}."                                                       |
| < 10 Phase 2 questions | Error returned: "Not enough Phase 2 questions." Admin must add more questions before matchmaking.    |
| Player drops mid-duel | Opponent wins after grace period (default 15s, configurable).                                         |
| Same score, same time | Player 1 wins (deterministic tiebreaker — `player1TotalTime <= player2TotalTime`).                     |
