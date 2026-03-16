# System Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│                      (React SPA)                        │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐             │
│  │ Register │  │ Phase 1  │  │  Phase 2  │             │
│  │  Page    │  │  Quiz UI │  │  Duel UI  │             │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘            │
│       │             │              │                    │
│       └──── REST ───┘    ┌── Socket.IO ──┘             │
└──────────────────────────┼────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │       SERVER            │
              │   (Node.js + Express)   │
              │                         │
              │  ┌──────────────────┐   │
              │  │  REST API        │   │
              │  │  /api/*          │   │
              │  └────────┬─────────┘   │
              │           │             │
              │  ┌────────▼─────────┐   │
              │  │  Socket.IO       │   │
              │  │  /duel namespace │   │
              │  └────────┬─────────┘   │
              │           │             │
              │  ┌────────▼─────────┐   │
              │  │  Business Logic  │   │
              │  │  Controllers +   │   │
              │  │  Utils           │   │
              │  └────────┬─────────┘   │
              └───────────┼─────────────┘
                          │
              ┌───────────▼─────────────┐
              │         MongoDB          │
              │                         │
              │  participants            │
              │  questions               │
              │  matches                 │
              │  phase1_sessions         │
              └─────────────────────────┘
```

---

## Component Responsibilities

### React Client

- **Registration Form** — collects USN, name, year; calls `POST /api/participants/register`
- **Phase 1 UI** — displays randomized questions with countdown timer; submits answers via REST
- **Phase 2 Lobby** — waits for opponent to join room via Socket.IO
- **Phase 2 Duel UI** — shows questions in real-time; sends `submit_answer` events; shows opponent progress live
- **Admin Dashboard** — controls event phases, views leaderboard, triggers matchmaking

### Express Server

- **REST API** — handles registration, question management, Phase 1 submission, admin controls
- **Socket.IO Server** — manages duel rooms, syncs answers, computes duel results
- **Matchmaking Util** — randomly pairs players per track for each Phase 2 round
- **Admin Middleware** — validates `x-admin-token` header on protected routes

### MongoDB

- Single database with four collections (see [database_schema.md](./database_schema.md))

---

## Real-time Duel Flow (Phase 2)

```
Player A                   Server                   Player B
   │                          │                          │
   │──── join_room ──────────►│◄──────── join_room ──────│
   │                          │                          │
   │◄─── room_joined ─────────│──── room_joined ────────►│
   │                          │                          │
   │──── ready ──────────────►│◄─────────── ready ───────│
   │                          │                          │
   │◄─── duel_start ──────────│──── duel_start ─────────►│
   │     (questions)          │     (same questions)      │
   │                          │                          │
   │──── submit_answer ───────►│                          │
   │                          │──── opponent_progress ──►│
   │                          │                          │
   │◄─── opponent_progress ───│◄──── submit_answer ───────│
   │                          │                          │
   │◄─── duel_end ────────────│──── duel_end ────────────►│
```

---

## Key Design Decisions

| Decision           | Choice             | Reason                                        |
| ------------------ | ------------------ | --------------------------------------------- |
| No user auth       | USN-based identity | Frictionless registration for a one-day event |
| MongoDB            | Document store     | Flexible schema; easy to evolve during event  |
| Socket.IO          | WebSockets         | Reliable real-time sync for duel rooms        |
| Single-elimination | No repechage       | Keeps Phase 2 fast and exciting               |
| Separate tracks    | Per-year pools     | Fair competition within year cohorts          |
