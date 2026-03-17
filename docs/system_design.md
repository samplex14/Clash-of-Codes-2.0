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
              │  │  Rate Limiters   │   │
              │  │  (express-rate-  │   │
              │  │   limit)         │   │
              │  └────────┬─────────┘   │
              │           │             │
              │  ┌────────▼─────────┐   │
              │  │  Admin Auth      │   │
              │  │  (x-admin-token) │   │
              │  └────────┬─────────┘   │
              │           │             │
              │  ┌────────▼─────────┐   │
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
              │  phase1sessions          │
              └─────────────────────────┘
```

---

## Component Responsibilities

### React Client

- **Registration Form** — collects USN, name, year; calls `POST /api/participants/register`
- **Phase 1 UI** — displays questions with countdown timer; submits answers via REST
- **Phase 2 Lobby** — waits for opponent to join room via Socket.IO
- **Phase 2 Duel UI** — shows questions in real-time; sends `submit_answer` events; shows opponent progress live
- **Admin Dashboard** — controls event phases, views leaderboard, triggers matchmaking

### Express Server

- **Rate Limiters** — per-endpoint protection using `express-rate-limit` (registration, Phase 1 submit, admin actions)
- **Admin Auth Middleware** — validates `x-admin-token` header against `ADMIN_SECRET` env var
- **REST API** — handles registration, question CRUD, Phase 1 submission, admin controls
- **Socket.IO Server** — manages duel rooms on `/duel` namespace; env-configurable ping/timeout for unreliable WiFi
- **Duel Handler** — join room, ready signals, answer submission, auto-timeout, disconnect forfeit with grace period
- **Matchmaking Util** — Fisher-Yates shuffle + pair generation with 10 random Phase 2 questions per match

### MongoDB

- Single database with four collections (see [database_schema.md](./database_schema.md))
- Compound indexes on `participants` and `matches` for leaderboard and round-lookup performance

---

## Real-time Duel Flow (Phase 2)

```
Player A                   Server                   Player B
   │                          │                          │
   │──── join_room ──────────►│◄──────── join_room ──────│
   │                          │                          │
   │◄─── room_joined ─────────│──── room_joined ────────►│
   │     (+ opponent info)    │     (+ opponent info)    │
   │                          │                          │
   │──── ready ──────────────►│◄─────────── ready ───────│
   │                          │                          │
   │◄─── duel_start ──────────│──── duel_start ─────────►│
   │     (10 questions)       │     (same 10 questions)  │
   │                          │                          │
   │──── submit_answer ──────►│                          │
   │◄─── ack (correct/wrong)  │──── opponent_progress ──►│
   │                          │                          │
   │◄─── opponent_progress ───│◄──── submit_answer ──────│
   │                          │──── ack (correct/wrong) ─►│
   │                          │                          │
   │    ... 90s timer or      │                          │
   │    all answers in ...    │                          │
   │                          │                          │
   │◄─── duel_end ────────────│──── duel_end ───────────►│
   │     (winner, scores)     │     (winner, scores)     │
```

### Disconnect Recovery

If a player disconnects during an active duel:

1. Server starts a **grace period timer** (`DUEL_DISCONNECT_GRACE_SECONDS`, default 15s)
2. If the player **reconnects** (re-joins the room), the timer is cancelled
3. If the timer **expires**, the opponent wins by forfeit (`reason: "disconnect_forfeit"`)

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGO_URI` | — | MongoDB connection string |
| `PORT` | `5000` | Server listening port |
| `ADMIN_SECRET` | — | Shared secret for admin auth |
| `DUEL_DURATION_SECONDS` | `90` | Time limit per duel |
| `DUEL_DISCONNECT_GRACE_SECONDS` | `15` | Grace period before disconnect forfeit |
| `SOCKET_PING_INTERVAL_MS` | `30000` | Socket.IO ping interval |
| `SOCKET_PING_TIMEOUT_MS` | `45000` | Socket.IO ping timeout |
| `SOCKET_CONNECT_TIMEOUT_MS` | `45000` | Socket.IO connection timeout |

---

## Key Design Decisions

| Decision                    | Choice             | Reason                                        |
| --------------------------- | ------------------ | --------------------------------------------- |
| No user auth                | USN-based identity | Frictionless registration for a one-day event |
| MongoDB                     | Document store     | Flexible schema; easy to evolve during event  |
| Socket.IO                   | WebSockets         | Reliable real-time sync for duel rooms        |
| Single-elimination          | No repechage       | Keeps Phase 2 fast and exciting               |
| Separate tracks             | Per-year pools     | Fair competition within year cohorts          |
| Env-driven Socket.IO config | Tunable timeouts   | Adapts to unreliable venue WiFi without code changes |
| Rate limiting               | Per-endpoint       | Prevents spam from participants and protects admin routes |
| Disconnect grace period     | 15s default        | Recovers from brief WiFi drops without penalizing players |
