# Migration Guide

## Overview

This project migrated to a unified Next.js 14 App Router architecture with a custom Socket.IO server process.

## Key UX Architecture Decision

Participant flow is now consolidated into a single page at /arena for the entire Phase 1 lifecycle:

1. Matchmaking search
2. Versus reveal and waiting for admin start
3. Inline question delivery on phase1:questions
4. Inline result rendering after submission

There is no route navigation between matchmaking, battle questions, and result states.

## Runtime Architecture

- server.ts runs Next.js and Socket.IO in one long-lived process.
- In-memory socket state (question order, submissions, matchmaking intervals) is held in lib/socketHandler.ts.
- Database persistence is handled by Prisma in lib/db.ts.

## Phase 1 Delivery Change

- phase1:start now pushes pre-shuffled questions directly to each participant socket.
- Each participant receives a deterministic server-side shuffle keyed by USN + round salt.
- Client never shuffles questions locally.

## Qualification Change

- Qualification logic is Top 8 (not Top 64).
- Ranking uses score desc, submittedAt asc for tie-breaks.

## Prisma / Migration Operational Notes

- Shared DB drift exists, so prisma migrate dev may request reset.
- Non-destructive path used here: apply SQL migration files directly using prisma db execute.
- Regenerate Prisma Client with engine support for runtime adapter compatibility:
  - npm run db:generate
