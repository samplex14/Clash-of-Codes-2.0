# Folder Structure

## Client (`/client`)

```
client/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images and global styles
│   ├── components/      # Reusable UI components
│   │   ├── Leaderboard.jsx  # Displays ranking
│   │   ├── QuestionCard.jsx # UI for single question
│   │   └── Timer.jsx        # Countdown timer
│   ├── context/
│   │   └── ParticipantContext.jsx # Global user state (Auth)
│   ├── hooks/
│   │   ├── useSocket.js   # Wrapper for Socket.io connection
│   │   └── useTimer.js    # Custom hook for countdowns
│   ├── pages/
│   │   ├── AdminDashboard.jsx # Admin control panel
│   │   ├── Home.jsx           # Landing page
│   │   ├── NotFound.jsx       # 404 page
│   │   ├── Phase1.jsx         # Phase 1 Quiz Interface
│   │   └── Register.jsx       # Registration form
│   ├── utils/
│   │   └── api.js         # Axios instance config
│   ├── App.jsx          # Main Router
│   └── main.jsx         # Entry point
└── vite.config.js       # Vite configuration
```

## Server (`/server`)

```
server/
├── config/
│   └── db.js            # MongoDB connection logic
├── controllers/
│   ├── participantController.js # Registration & User logic
│   ├── phase1Controller.js      # Phase 1 scoring & mgmt
│   └── questionController.js    # CRUD for questions
├── middleware/
│   └── adminAuth.js     # Admin token verification
├── models/
│   ├── Participant.js   # User Schema
│   ├── Phase1Session.js # Phase 1 State Schema
│   └── Question.js      # Question Bank Schema
├── routes/
│   ├── participantRoutes.js
│   ├── phase1Routes.js
│   └── questionRoutes.js
├── sockets/
│   ├── phase1Handler.js # Broadcast logic for Phase 1
│   └── index.js         # Socket.io initialization & Namespaces
├── tests/               # Unit & Integration Tests
└── index.js             # Server Entry Point
```

## Docs (`/docs`)
Contains project documentation including API refs, design docs, and readiness checklists.
