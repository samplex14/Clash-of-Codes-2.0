# System Design

## Core Components

### 1. WebClient (React)
A Single Page Application (SPA) serving as the interface for both Participants and Admins.
- **State:** Uses `ParticipantContext` for session persistence.
- **Real-time:** `socket.io-client` handles interruptions and dual-channel communication (Broadcasts vs Game logic).

### 2. API Server (Node/Express)
Handles stateless requests (Registration, CRUD).
- **Middleware:** `adminAuth` ensures secure access to control endpoints.

### 3. Game Server (Socket.IO)
Handles stateful game sessions.
- **Namespace `/phase1`:** Low frequency, high broadcast volume (Start/Stop signals).
    - **Memory Store:** Participant question order and submit state are held in memory during active session.

### 4. Database (MongoDB)
- **Collections:**
    - `participants`: User profiles, scores, status.
    - `questions`: Content bank.
    - `phase1sessions`: Audit log of phase 1 start/stop times.

## Data Flow Diagram (Conceptual)

```
[React Client] <--(HTTP)--> [Express Routes] <--(Mongoose)--> [MongoDB]
      ^                                                            ^
      |                                                            |
   (Socket.IO)                                               (Persistence)
      |                                                            |
      v                                                            v
[Socket Namespace /phase1] --(Events: Start/Confirm/Submit)--> [Phase1 Handler]
```

## Scaling Considerations
- **Socket:** Designed to handle ~100-200 concurrent connections.
- **Database:** Indexed on participant and question fields used by Phase 1 queries.
- **Rate Limiting:** Implemented on API routes to prevent abuse.
