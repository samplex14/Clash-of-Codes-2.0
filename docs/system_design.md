# System Design

## Runtime Layers

1. Next.js App Router for UI and API routes.
2. Custom Node server (server.ts) hosts Next.js + Socket.IO.
3. Prisma client for Neon PostgreSQL persistence.

## Realtime Model

- Socket namespace: /phase1
- Stateful maps in lib/socketHandler.ts keep runtime session data.
- Server emits user-targeted question arrays and outcomes.

## Participant State Machine

- searching
- found
- battle
- result

All states are rendered in app/arena/page.tsx with opacity transitions.

## Scale Notes

- In-memory maps assume single realtime process.
- For horizontal scale, external shared state/adapter would be required.
