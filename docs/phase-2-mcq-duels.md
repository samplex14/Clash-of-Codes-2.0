# Phase 2 — MCQ Duels (Matchmaking Rounds)

## Overview

The main tournament bracket phase. The 64 qualifiers from Phase 1 battle head-to-head in a **single-elimination** MCQ knockout.

## Format

- Top 64 qualifiers are **randomly paired** into 1v1 duels (Fisher-Yates shuffle).
- Both players in a duel receive the **exact same set of 10 questions simultaneously** via Socket.IO.
- Each duel has a **90-second time limit** (configurable via `DUEL_DURATION_SECONDS` env var).
- The player who correctly answers more questions **wins** and advances.

## Tiebreaker

If both players answer the same number of questions correctly, the player who **completed their answers in less time** (lower `totalTime` from match start to last answer) is declared the winner.

## Duel Mechanics

| Setting | Default | Env Variable |
|---|---|---|
| Questions per duel | 10 | Constant in `utils/matchmaking.js` |
| Time limit | 90 seconds | `DUEL_DURATION_SECONDS` |
| Disconnect grace | 15 seconds | `DUEL_DISCONNECT_GRACE_SECONDS` |

- **Auto-submit:** When the 90s timer expires, any unanswered questions are marked incorrect.
- **Live progress:** Each player sees how many questions their opponent has answered (not which ones).
- **Duplicate protection:** Answering the same question twice is rejected.
- **Disconnect handling:** If a player disconnects, a 15-second grace period starts. Reconnecting cancels the timer. If the grace period expires, the opponent wins by forfeit.

## Elimination

- The **losing player is immediately marked** `phase2Eliminated = true` and `phase2Active = false` (when admin advances the round).
- Each round halves the remaining field.

## Round Progression

| Round | Players In | Pairs | Players Advancing |
| ----- | ---------- | ----- | ----------------- |
| 1     | 64         | 32    | 32                |
| 2     | 32         | 16    | 16                |
| 3     | 16         | 8     | 8 → Phase 3      |

> Phase 2 ends when exactly **≤ 8 players** remain per track. They are automatically marked `phase3Qualified = true`.

## Key Points

| Detail                | Value                   |
| --------------------- | ----------------------- |
| Starting participants | 64 per track            |
| Match style           | 1v1 MCQ duel            |
| Questions per match   | 10                      |
| Time limit            | 90 seconds              |
| Elimination           | Single elimination      |
| Tiebreaker            | Fastest total time      |
| Disconnect handling   | 15s grace → forfeit     |
| Finalists             | Top 8 per track         |

## Next Phase

The surviving 8 players per track advance to [Phase 3 — Grand Finals](./phase-3-grand-finals.md).
