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
│   │   ├── participantController.js
│   │   ├── questionController.js
│   │   ├── matchController.js
│   │   └── adminController.js
│   ├── models/
│   │   ├── Participant.js
│   │   ├── Question.js
│   │   ├── Match.js
│   │   └── Phase1Result.js
│   ├── routes/
│   │   ├── participantRoutes.js
│   │   ├── questionRoutes.js
│   │   ├── matchRoutes.js
│   │   └── adminRoutes.js
│   ├── sockets/
│   │   ├── index.js                # Socket.IO server setup
│   │   └── duelHandler.js          # Phase 2 duel event handlers
│   ├── middleware/
│   │   └── adminAuth.js            # Simple admin token check
│   ├── utils/
│   │   └── matchmaking.js          # Phase 2 pairing logic
│   ├── .env                        # MONGO_URI, PORT, ADMIN_SECRET
│   └── index.js                    # Entry point
│
└── docs/                           # All project documentation
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
