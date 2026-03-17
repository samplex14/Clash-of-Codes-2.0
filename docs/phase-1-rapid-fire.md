# Phase 1 — Rapid Fire Round

## Overview

The opening phase of Clash of Codes, open to **all registered participants** across both tracks.

## Format

- All participants compete together simultaneously.
- A series of **quick MCQ questions** (4 options each) are thrown at players under strict time pressure.
- Questions are fast-paced and designed to test both **speed** and **accuracy**.
- Questions are only visible while the Phase 1 session is **active** (`correctIndex` is excluded from the public response).

## Submission

- Participants submit their answers along with `timeTaken` via `POST /api/phase1/submit`.
- The server scores answers immediately by comparing against `correctIndex`.
- Double-submission is prevented (returns `409 "Already submitted"`).
- **Rate limited:** 4 submit attempts per minute per USN or IP.

## Qualification

- Only the **top 64 scorers per track** from this round advance to Phase 2.
- Rankings are determined by `phase1Score` (descending); tiebreakers are applied based on `phase1Time` (ascending — faster is better).
- Qualification is computed automatically when the admin ends Phase 1.

## Key Points

| Detail     | Value                          |
| ---------- | ------------------------------ |
| Open to    | All registered participants    |
| Style      | Rapid-fire MCQ (4 options)     |
| Qualifiers | Top 64 per track               |
| Tracks     | 1st Year & 2nd Year (separate) |
| Tiebreaker | Fastest completion time        |
| Rate limit | 4 submits / min                |

## Next Phase

Top 64 qualifiers per track move on to [Phase 2 — MCQ Duels](./phase-2-mcq-duels.md).
