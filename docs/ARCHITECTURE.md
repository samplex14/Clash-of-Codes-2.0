# Architecture

## Stack

- Next.js App Router
- TypeScript
- Prisma ORM
- Neon PostgreSQL
- Tailwind CSS

## Runtime Model

The app is fully serverless. There is no persistent Node process and no websocket server.

- UI and APIs run through Next.js route handlers
- Shared state is persisted in PostgreSQL
- Client updates use HTTP polling

## State Storage

- TournamentState: global flags for phase activation and leaderboard visibility
- ParticipantSession: per-warrior shuffled question order, locked answers, and submission status
- Participant: profile, mapping, score, and qualification

## Realtime Replacement

Polling endpoints replace realtime sockets:

- /api/matchmaking/status
- /api/tournament/state
- /api/tournament/status

This is sufficient for controlled event scale around 100-150 participants.
