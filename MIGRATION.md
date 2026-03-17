# Migration Guide

## What Changed

The platform has been migrated from the previous split frontend/backend architecture to a unified Next.js 14 App Router architecture with a custom Socket.IO server process.

## Old Stack

- React (Vite) frontend
- Node.js + Express backend
- Socket.IO in standalone backend
- Non-PostgreSQL data store

## New Stack

- Next.js 14 (App Router)
- Neon PostgreSQL
- Prisma ORM with Neon serverless adapter
- Socket.IO attached to custom Next.js server
- Tailwind CSS + Clash-themed UI components
- TypeScript across application code

## Key Architectural Notes

1. The app now runs through a custom server entrypoint at root server.ts so Socket.IO can persist with App Router.
2. REST endpoints were migrated into App Router handlers under app/api.
3. Persistent data access is handled by Prisma through lib/db.ts.
4. Runtime socket state is held in custom server scope (lib/socketHandler.ts), not in route handlers.
5. Environment variable access is centralized in lib/env.ts for typed usage in app code.

## Socket + Next.js Gotchas

1. Avoid running Next in purely serverless mode for realtime sessions; use npm run dev and npm run start for dev and prod.
2. Keep all in-memory phase runtime maps in the long-lived socket process, not in API routes.
3. Ensure NEXT_PUBLIC_SOCKET_URL points to the same origin where server.ts is listening.
4. If deploying behind a proxy, forward websocket upgrade headers.

## Database and Prisma Workflow

1. Configure DATABASE_URL in .env.local.
2. Run npm run db:migrate.
3. Run npm run db:generate.
4. Optionally inspect data with npm run db:studio.

## Validation Checklist

- npm run dev (or npm run start) boots the custom server and Socket.IO namespace.
- App routes load under App Router paths.
- /api endpoints return expected responses.
- Phase 1 socket flow works end-to-end (start, questions, confirm, submit, qualification).
- Leaderboard reflects persisted Phase 1 scores.
