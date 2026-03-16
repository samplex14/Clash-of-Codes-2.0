# Matchmaking Algorithm

How Phase 2 player pairing works for each round.

---

## Overview

Matchmaking is run **once per round** by the admin. It operates independently per track (1st year and 2nd year pools never mix).

---

## Input

- A list of **active (uneliminated) participants** in the current track.
- In Round 1: the top 64 qualifiers from Phase 1.
- In subsequent rounds: winners from the previous round.

---

## Algorithm (per track)

```
function generateMatches(activePlayers, round, trackId):
  1. Filter: players where phase2Active = true AND phase2Eliminated = false
  2. Shuffle: Fisher-Yates random shuffle of the filtered list
  3. Pair: zip adjacent elements → [p[0],p[1]], [p[2],p[3]], ...
  4. For each pair:
       - Create a `matches` document with status = "pending"
       - Assign a unique roomId (= match._id)
       - Fetch N questions from `questions` collection (phase = 2, random)
       - Embed question IDs in the match document
  5. Return array of created match documents
```

### Fisher-Yates Shuffle (used in `utils/matchmaking.js`)

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

## Round Progression

| Round | Players In | Pairs | Players Advancing |
| ----- | ---------- | ----- | ----------------- |
| 1     | 64         | 32    | 32                |
| 2     | 32         | 16    | 16                |
| 3     | 16         | 8     | 8                 |
| 4     | 8          | 4     | 4 → Phase 3       |

> Phase 2 ends after Round 3 (when 8 players remain). Round 4 does not run.

---

## Duel Winner Determination

After both players submit all answers (or the timer expires):

```
1. Count correct answers for each player.
2. If player1Score > player2Score → player1 wins.
3. If player2Score > player1Score → player2 wins.
4. If scores are equal → compare totalTime:
     - Lower time wins.
5. Update match.winner, set losing player's phase2Eliminated = true.
```

---

## Edge Cases

| Scenario              | Handling                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| Odd number of players | Should not happen (64 → 32 → 16 → 8 are all even). Admin verifies count before triggering matchmaking. |
| Player drops mid-duel | Opponent is awarded the win after a timeout (configurable).                                            |
| Same score, same time | Extremely unlikely; admin manually resolves.                                                           |
