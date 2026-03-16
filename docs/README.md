# Clash of Codes 2.0

> A 1v1 coding competition themed around Clash of Clans, built to crown a single champion across three phases.

## Tech Stack

| Layer    | Technology             |
| -------- | ---------------------- |
| Frontend | React                  |
| Backend  | Node.js + Express      |
| Database | MongoDB                |
| Realtime | WebSockets (Socket.IO) |

## Tracks

- **1st Year** students
- **2nd Year** students

Both tracks run independently through all three phases.

## Phases at a Glance

| Phase | Name             | Format                  | Who Competes   | Who Advances |
| ----- | ---------------- | ----------------------- | -------------- | ------------ |
| 1     | Rapid Fire Round | Fast Q&A (custom built) | All registered | Top 64       |
| 2     | MCQ Duels        | 1v1 live WebSocket duel | Top 64         | Top 8        |
| 3     | Grand Finals     | HackerRank CP problems  | Top 8          | Champion     |

## Docs Index

| File                                                   | Description                                   |
| ------------------------------------------------------ | --------------------------------------------- |
| [overview.md](./overview.md)                           | Competition overview and structure            |
| [phase-1-rapid-fire.md](./phase-1-rapid-fire.md)       | Phase 1 rules and format                      |
| [phase-2-mcq-duels.md](./phase-2-mcq-duels.md)         | Phase 2 rules, tiebreakers, elimination       |
| [phase-3-grand-finals.md](./phase-3-grand-finals.md)   | Phase 3 HackerRank finals                     |
| [folder_structure.md](./folder_structure.md)           | Project directory layout                      |
| [database_schema.md](./database_schema.md)             | MongoDB collections and fields                |
| [api_routes.md](./api_routes.md)                       | REST API endpoints and WebSocket events       |
| [system_design.md](./system_design.md)                 | Architecture and component overview           |
| [event_flow.md](./event_flow.md)                       | End-to-end flow from registration to champion |
| [matchmaking_algorithm.md](./matchmaking_algorithm.md) | Phase 2 pairing logic                         |
| [admin_workflow.md](./admin_workflow.md)               | Admin controls per phase                      |
| [event_readiness_tasks.md](./event_readiness_tasks.md) | Pre-event checklist                           |
| [features_and_testing.md](./features_and_testing.md)   | Feature list and testing plan                 |

## Quick Start

```bash
# Clone the repo
git clone https://github.com/your-org/clash-of-codes-2.0.git
cd clash-of-codes-2.0

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Start MongoDB locally (or set MONGO_URI in .env)
# Start server
cd ../server && npm run dev

# Start client
cd ../client && npm start
```

## Registration Flow (No Auth)

Participants do not need to create an account or log in.
They simply visit the site, fill in their **USN**, **Name**, and **Year**, and are registered instantly.
