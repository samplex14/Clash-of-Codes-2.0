# Overview

Clash of Codes 2.0 runs a realtime Phase 1 coding battle with a matchmaking illusion and a single-page participant UX.

## Core Idea

- Participants are cosmetically paired with an opponent.
- Real scoring is individual across all participants.
- Top 8 qualify after Phase 1.

## Participant UX

The participant remains on /arena for:

1. Matchmaking search
2. Versus reveal + waiting
3. Inline question delivery when admin starts Phase 1
4. Inline result rendering after submission

No route navigation occurs between these states.

## Admin UX

Admin controls start/end of Phase 1 from /admin and monitors leaderboard plus matchmaking status.
