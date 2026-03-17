# Folder Structure

```
clash-of-codes-2.0/
│
├── client/                         # React frontend
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/             # Reusable UI components
│       │   ├── Timer.jsx
│       │   ├── QuestionCard.jsx
│       │   ├── Leaderboard.jsx
│       │   └── RegistrationForm.jsx
│       ├── pages/                  # Route-level pages
│       │   ├── Home.jsx
│       │   ├── Register.jsx
│       │   ├── Phase1.jsx          # Rapid fire quiz UI
│       │   ├── Phase2Lobby.jsx     # Waiting room before duel
│       │   ├── Phase2Duel.jsx      # Live 1v1 duel UI
│       │   ├── Phase3.jsx          # HackerRank redirect + info
│       │   ├── AdminDashboard.jsx
│       │   └── NotFound.jsx
│       ├── hooks/
│       │   ├── useSocket.js        # Socket.IO connection hook
│       │   └── useTimer.js
│       ├── context/
│       │   └── ParticipantContext.jsx
│       ├── utils/
│       │   └── api.js              # Axios base config
│       ├── App.jsx
│       └── main.jsx
│
├── server/                         # Node.js + Express backend
│   ├── config/
│   │   └── db.js                   # MongoDB connection
│   ├── controllers/
│   │   ├── participantController.js  # Registration + admin participant queries
│   │   ├── questionController.js     # CRUD for Phase 1 & Phase 2 questions
│   │   ├── phase1Controller.js       # Start/end Phase 1, submit answers, leaderboard
│   │   └── phase2Controller.js       # Matchmaking, match queries, advance winners, finalists
│   ├── models/
│   │   ├── Participant.js            # USN, name, year, track, phase progression flags
│   │   ├── Question.js               # Phase-scoped MCQ (text, options, correctIndex, difficulty, tags)
│   │   ├── Match.js                  # Phase 2 duel (players, answers, scores, winner)
│   │   └── Phase1Session.js          # Phase 1 event state (idle / active / ended)
│   ├── routes/
│   │   ├── participantRoutes.js      # /participants/* and /admin/participants/*
│   │   ├── questionRoutes.js         # /admin/phase1/questions and /admin/phase2/questions
│   │   ├── phase1Routes.js           # /admin/phase1/* and /phase1/*
│   │   └── phase2Routes.js           # /admin/phase2/*, /admin/phase3/finalists, /matches/:matchId
│   ├── sockets/
│   │   ├── index.js                  # Socket.IO server setup (env-configurable ping/timeout)
│   │   └── duelHandler.js            # Phase 2 duel event handlers (join, ready, answer, disconnect)
│   ├── middleware/
│   │   ├── adminAuth.js              # x-admin-token header validation
│   │   └── rateLimiters.js           # Per-endpoint rate limiters (submit, register, admin)
│   ├── utils/
│   │   └── matchmaking.js            # Fisher-Yates shuffle + pair generation (10 questions/match)
│   ├── tests/
│   │   ├── adminAuth.test.js         # Unit tests for admin auth middleware
│   │   ├── matchmaking.test.js       # Unit tests for shuffle utility
│   │   └── socketLoadTest.js         # Socket.IO load test script (simulates concurrent clients)
│   ├── .env                          # MONGO_URI, PORT, ADMIN_SECRET, DUEL_DURATION_SECONDS, etc.
│   ├── package.json
│   └── index.js                      # Entry point — Express + Socket.IO bootstrap
│
├── ecosystem.config.js               # PM2 cluster mode configuration
│
└── docs/                             # All project documentation
    ├── README.md
    ├── overview.md
    ├── phase-1-rapid-fire.md
    ├── phase-2-mcq-duels.md
    ├── phase-3-grand-finals.md
    ├── folder_structure.md
    ├── database_schema.md
    ├── api_routes.md
    ├── system_design.md
    ├── event_flow.md
    ├── matchmaking_algorithm.md
    ├── admin_workflow.md
    ├── event_readiness_tasks.md
    └── features_and_testing.md
```
