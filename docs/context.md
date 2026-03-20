# Code Context And File Connections

This document explains what code is in which file and how two or more files connect to each other.

## Top-Level Structure

- app/: Next.js App Router pages and API route handlers.
- components/: reusable UI and client logic components.
- hooks/: reusable React hooks.
- lib/: shared server utilities, DB, and domain logic.
- prisma/: schema, migrations, and seed data.
- types/: shared TypeScript types.

## What Code Is In Which File

### Core Pages

- app/page.tsx: home page entry point.
- app/arena/page.tsx: arena flow UI (matchmaking, phase state, battle progression).
- app/leaderboard/page.tsx: leaderboard display UI.
- app/layout.tsx: global app layout and providers.
- app/globals.css: global styles.

### API Routes

- app/api/health/route.ts: health check endpoint.
- app/api/participants/register/route.ts: participant registration logic.
- app/api/participants/[usn]/route.ts: participant fetch by USN.
- app/api/matchmaking/route.ts: matchmaking and mapping logic.
- app/api/matchmaking/status/route.ts: polling endpoint for mapping state.
- app/api/tournament/start/route.ts: activates phase and initializes sessions.
- app/api/tournament/state/route.ts: returns global phase flags.
- app/api/tournament/status/route.ts: submission progress and completion state.
- app/api/phase1/questions/route.ts: returns participant question set.
- app/api/phase1/confirm/route.ts: locks selected answers per question.
- app/api/phase1/submit/route.ts: validates and stores final submission score.
- app/api/phase1/status/route.ts: phase status endpoint.
- app/api/phase1/leaderboard/route.ts: phase-specific leaderboard data.
- app/api/leaderboard/route.ts: final leaderboard endpoint.

### Shared Logic

- lib/db.ts: Prisma client initialization.
- lib/env.ts: environment configuration helpers.
- lib/api.ts: client-side API helper calls.
- lib/matchmaking.ts: matchmaking utility logic.
- lib/phase1Session.ts: participant session lifecycle utilities.
- lib/phase1Qualification.ts: qualification/ranking calculations.
- lib/questions.ts: question sourcing/format helpers.
- lib/tournamentState.ts: global tournament state helpers.
- lib/utils.ts: common utilities.

### UI Components

- components/HomeRegisterClient.tsx: registration client component.
- components/Phase1QuestionPanel.tsx: question navigation and confirmation UI.
- components/QuestionCard.tsx: question rendering block.
- components/Leaderboard.tsx: leaderboard presentation.
- components/Timer.tsx: timer UI logic.
- components/ErrorBoundary.tsx: React error boundary.
- components/providers/AppProviders.tsx: app-level context providers.
- components/providers/ParticipantProvider.tsx: participant context state.

### Data Model

- prisma/schema.prisma: data models and relations.
- prisma/migrations/*: schema migration history.
- prisma/seed.ts: seed script.

### Type Contracts

- types/index.ts, types/participant.ts, types/question.ts, types/match.ts: shared TypeScript contracts.

## File Connections (Two Or More Files Connected)

### Registration Flow Connection

- app/page.tsx -> components/HomeRegisterClient.tsx -> app/api/participants/register/route.ts -> lib/db.ts -> prisma/schema.prisma

### Matchmaking Flow Connection

- app/arena/page.tsx -> lib/api.ts -> app/api/matchmaking/route.ts + app/api/matchmaking/status/route.ts -> lib/matchmaking.ts -> lib/db.ts

### Tournament Activation Connection

- app/arena/page.tsx -> app/api/tournament/start/route.ts -> lib/tournamentState.ts + lib/phase1Session.ts -> lib/db.ts

### Question Delivery Connection

- components/Phase1QuestionPanel.tsx + components/QuestionCard.tsx -> lib/api.ts -> app/api/phase1/questions/route.ts -> lib/questions.ts + lib/phase1Session.ts

### Answer Confirm/Submit Connection

- components/Phase1QuestionPanel.tsx -> app/api/phase1/confirm/route.ts + app/api/phase1/submit/route.ts -> lib/phase1Session.ts -> lib/db.ts

### Completion And Leaderboard Connection

- app/api/tournament/status/route.ts -> lib/phase1Qualification.ts + lib/tournamentState.ts -> app/api/leaderboard/route.ts -> app/leaderboard/page.tsx + components/Leaderboard.tsx

### Shared Type Connection

- types/*.ts are consumed by components/*, app/*, and lib/* to keep request/response and domain shapes consistent.

## Maintenance Notes

- When adding a new API route, update lib/api.ts if the client calls it.
- When changing DB fields, update prisma/schema.prisma and affected lib/* + app/api/* handlers.
- When changing UI flow, check related provider state in components/providers/*.