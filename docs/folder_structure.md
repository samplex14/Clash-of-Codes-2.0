# Folder Structure

## App Router

- app/
  - arena/page.tsx: single participant page for matchmaking, waiting, questions, result
  - admin/page.tsx: admin dashboard
  - api/: route handlers

## Components

- components/Phase1QuestionPanel.tsx: inline question battle panel
- components/AdminDashboardClient.tsx
- components/HomeRegisterClient.tsx
- components/ui/loading-radar.tsx

## Runtime Libraries

- lib/socketHandler.ts: phase1 and matchmaking socket orchestration
- lib/matchmaking.ts: transactional matchmaking logic
- lib/phase1Qualification.ts: top-8 qualification logic
- lib/leaderboard.ts: leaderboard assembly
- lib/db.ts: Prisma client

## Shared Types

- types/socket.ts
- types/participant.ts
