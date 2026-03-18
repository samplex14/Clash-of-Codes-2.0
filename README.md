# Clash of Codes 2.0

Clash of Codes 2.0 is a Clash-themed competitive coding platform built with Next.js, TypeScript, Prisma, and Neon PostgreSQL.

This codebase is now fully serverless and deployable on Vercel.

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Prisma ORM
- Neon PostgreSQL
- Tailwind CSS

## Architecture

- No custom Node server
- No Socket.IO or WebSocket runtime
- No admin panel
- Client/server communication uses HTTP route handlers and polling

Key state persistence:

- TournamentState for global phase flags
- ParticipantSession for per-warrior question order and confirmations

## Participant Journey

1. Register on home page.
2. Enter /arena and join matchmaking.
3. If unmatched, arena polls matchmaking status every 3 seconds.
4. Versus card appears when rival is assigned.
5. Any warrior can press Sound the Battle Horn.
6. Questions load inline in /arena from shuffled server-side session state.
7. Confirm answers and submit final strike.
8. Wait-for-others card polls tournament status every 5 seconds.
9. Auto-redirect to /leaderboard when final standings are unlocked.

## Local Development

1. npm install
2. npm run db:generate
3. npm run dev

## Migrations

Use direct URL for migrations and pooled URL for runtime.

- DATABASE_URL: Neon pooled connection string
- DIRECT_URL: Neon non-pooled/direct connection string

Apply migration files:

- npx prisma migrate deploy

## Vercel Deployment

1. Push repository to GitHub.
2. Import project in Vercel.
3. Set environment variables:
   - DATABASE_URL
   - DIRECT_URL
   - NEXT_PUBLIC_APP_URL
   - NODE_ENV=production
4. Deploy.

vercel.json is included with:

- framework: nextjs
- installCommand: npm install
- buildCommand: prisma generate && next build

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/PARTICIPANT_FLOW.md](docs/PARTICIPANT_FLOW.md)
- [docs/API_ROUTES.md](docs/API_ROUTES.md)
- [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [MIGRATION.md](MIGRATION.md)
