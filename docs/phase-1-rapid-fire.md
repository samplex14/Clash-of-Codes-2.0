# Phase 1: Rapid Fire Round

**Status:** ✅ Implemented

## Format
*   **Participation:** Open to all registered users.
*   **Mode:** Asynchronous start (within window) or Synchronous broadcast start.
*   **Content:** Multiple Choice Questions (Tech + Logic).

## Implementation Details
*   **Controller:** `server/controllers/phase1Controller.js`
*   **Frontend:** `client/src/pages/Phase1.jsx`
*   **Data Model:** `Participant` schema stores `phase1Score` and `phase1Time`.

## Workflow
1. User logs in.
2. Waits for "Phase Active" signal.
3. Fetches questions from `/api/phase1/questions`.
4. Timer runs locally.
5. User submits all answers in one payload to `/api/phase1/submit`.
6. Server validates, scores, and saves.
7. Leaderboards available at `/api/phase1/leaderboard`.
