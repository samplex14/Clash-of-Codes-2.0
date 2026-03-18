# Migration Guide

## Summary

Clash of Codes has been migrated to a serverless architecture.

- Removed Socket.IO and all websocket infrastructure
- Removed admin dashboard, admin APIs, and admin auth logic
- Removed custom server runtime
- Added database-backed tournament state for stateless serverless requests

## Runtime Changes

- Old: long-lived custom server with in-memory phase state
- New: Next.js App Router route handlers with Prisma + Neon persistence

All state that must survive requests now lives in PostgreSQL:

- Global phase flags in TournamentState
- Per-warrior question order and confirmations in ParticipantSession

## Client Communication Changes

- Old: Socket emits/listeners for matchmaking and phase transitions
- New: HTTP polling and POST/GET route handlers

Polling cadence:

- Matchmaking status: every 3 seconds
- Tournament state (phase start): every 3 seconds
- Tournament progress after submit: every 5 seconds

## Deployment Changes

- Old: custom Node server entrypoint
- New: Vercel-compatible Next.js serverless deployment
- Added vercel.json and postinstall Prisma generate

## Environment Changes

Required now:

- DATABASE_URL (Neon pooled connection)
- DIRECT_URL (Neon direct/non-pooled connection for migrations)
- NEXT_PUBLIC_APP_URL
- NODE_ENV

Removed:

- NEXT_PUBLIC_SOCKET_URL
- ADMIN_SECRET
