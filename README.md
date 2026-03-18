# Clash of Codes 2.0

Clash of Codes 2.0 is a Next.js 14 + TypeScript realtime coding event platform themed around Clash of Clans.

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Prisma ORM + Neon PostgreSQL
- Socket.IO (custom server via server.ts)
- Tailwind CSS

## Participant Flow (Single Page Arena)

1. Register on /.
2. Enter /arena and see matchmaking searching UI.
3. Opponent is revealed on the versus layout.
4. Participant stays on /arena waiting for admin start signal.
5. Admin starts Phase 1.
6. phase1:questions arrives and arena transitions inline to question panel (no route change).
7. Participant answers and submits inside /arena.
8. Result is shown inline in /arena (qualified celebration or eliminated summary).

## Admin Flow

1. Open /admin and authenticate using ADMIN_SECRET.
2. Start Phase 1 using admin controls.
3. Server generates a per-participant deterministic shuffle and emits pre-shuffled questions.
4. End Phase 1 to compute qualification.
5. Review leaderboard and matchmaking status.

## Environment Variables

Create .env.local with the following:

- DATABASE_URL: Neon PostgreSQL connection string
- ADMIN_SECRET: Admin dashboard secret token
- NEXT_PUBLIC_SOCKET_URL: Base app URL, for example http://localhost:3000
- PORT: Server port (default 3000)

## Local Development

1. npm install
2. npm run db:generate
3. Apply schema SQL if needed:
   - npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20260318120000_add_matchmaking_fields/migration.sql
4. npm run dev

## Prisma Notes

- This repository currently uses manual SQL migration application because the shared DB has drifted history.
- Use npm run db:generate after schema changes.

## Documentation

Project docs are under docs/. Start with docs/README.md.
