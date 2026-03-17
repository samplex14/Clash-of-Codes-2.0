# Clash of Codes 2.0

Clash of Codes 2.0 is now a Next.js 14 full-stack app using Neon PostgreSQL, Prisma, and Socket.IO with a custom server.

## Stack

- Next.js 14 App Router
- TypeScript
- Prisma + Neon
- Socket.IO
- Tailwind CSS

## Run

1. npm install
2. npm run db:migrate
3. npm run db:generate
4. npm run dev

## Important Paths

- app for pages and API route handlers
- components for themed UI
- hooks for realtime and timer hooks
- lib for db, env, socket runtime utilities
- prisma/schema.prisma for database models
- types for shared type definitions

## Migration Notes

See MIGRATION.md for full migration details and custom-server operational gotchas.
