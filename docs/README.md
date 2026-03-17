# Clash of Codes 2.0

> A 1v1 coding competition themed around Clash of Clans, built to crown a single champion across three phases.

## Tech Stack

| Layer    | Technology             |
| -------- | ---------------------- |
| Frontend | React (Vite)           |
| Backend  | Node.js + Express      |
| Database | MongoDB (Mongoose)     |
| Realtime | WebSockets (Socket.IO) |

## Tracks

- **1st Year** students
- **2nd Year** students

Both tracks run independently through all three phases.

## Phases at a Glance

| Phase | Name             | Format                  | Who Competes   | Who Advances     |
| ----- | ---------------- | ----------------------- | -------------- | ---------------- |
| 1     | Rapid Fire Round | Fast MCQ Q&A            | All registered | Top 64 per track |
| 2     | MCQ Duels        | 1v1 live WebSocket duel | Top 64         | Top 8 per track  |
| 3     | Grand Finals     | HackerRank CP problems  | Top 8          | Champion         |

## Docs Index

| File                                                   | Description                                   |
| ------------------------------------------------------ | --------------------------------------------- |
| [overview.md](./overview.md)                           | Competition overview and structure            |
| [phase-1-rapid-fire.md](./phase-1-rapid-fire.md)       | Phase 1 rules and format                      |
| [phase-2-mcq-duels.md](./phase-2-mcq-duels.md)         | Phase 2 rules, tiebreakers, elimination       |
| [phase-3-grand-finals.md](./phase-3-grand-finals.md)   | Phase 3 HackerRank finals                     |
| [folder_structure.md](./folder_structure.md)           | Project directory layout                      |
| [database_schema.md](./database_schema.md)             | MongoDB collections, fields, and indexes      |
| [api_routes.md](./api_routes.md)                       | REST API endpoints, rate limits, and WebSocket events |
| [system_design.md](./system_design.md)                 | Architecture, components, and design decisions |
| [event_flow.md](./event_flow.md)                       | End-to-end flow from registration to champion |
| [matchmaking_algorithm.md](./matchmaking_algorithm.md) | Phase 2 pairing and duel logic                |
| [admin_workflow.md](./admin_workflow.md)               | Admin controls per phase                      |
| [event_readiness_tasks.md](./event_readiness_tasks.md) | Pre-event checklist                           |
| [features_and_testing.md](./features_and_testing.md)   | Feature list and test scenarios               |

## Quick Start

```bash
# Clone the repo
git clone https://github.com/your-org/clash-of-codes-2.0.git
cd clash-of-codes-2.0

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Configure environment
# Copy server/.env and set: MONGO_URI, PORT, ADMIN_SECRET

# Start server
cd ../server && npm run dev

# Start client (separate terminal)
cd ../client && npm run dev
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGO_URI` | — | MongoDB connection string |
| `PORT` | `5000` | Server listening port |
| `ADMIN_SECRET` | — | Shared secret for admin API auth |
| `DUEL_DURATION_SECONDS` | `90` | Time limit per Phase 2 duel |
| `DUEL_DISCONNECT_GRACE_SECONDS` | `15` | Grace period before disconnect forfeit |
| `SOCKET_PING_INTERVAL_MS` | `30000` | Socket.IO ping interval |
| `SOCKET_PING_TIMEOUT_MS` | `45000` | Socket.IO ping timeout |
| `SOCKET_CONNECT_TIMEOUT_MS` | `45000` | Socket.IO connection timeout |

## NPM Scripts (Server)

| Script | Command | Description |
|---|---|---|
| `npm start` | `node index.js` | Start production server |
| `npm run dev` | `nodemon index.js` | Start dev server with auto-reload |
| `npm test` | `node --test "tests/**/*.test.js"` | Run unit tests |
| `npm run loadtest:socket` | `node tests/socketLoadTest.js` | Run Socket.IO load test |

## Registration Flow (No Auth)

Participants do not need to create an account or log in.
They simply visit the site, fill in their **USN**, **Name**, and **Year**, and are registered instantly.
The `track` field is auto-assigned from `year` (1 → `1st_year`, 2 → `2nd_year`).
