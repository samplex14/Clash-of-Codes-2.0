# Event Flow

End-to-end flow of Clash of Codes 2.0, from registration to crowning the champion.

---

## Full Event Timeline

```
┌─────────────────────────────────────────────────────────────┐
│ PRE-EVENT                                                   │
│  - Admin loads questions into DB (Phase 1 & Phase 2)        │
│  - Admin verifies platform is live                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ REGISTRATION                                                │
│  Participants visit site → enter USN, Name, Year            │
│  → Stored in `participants` collection                      │
│  → Assigned to track (1st_year or 2nd_year)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ PHASE 1 — Rapid Fire Round                                  │
│  1. Admin hits "Start Phase 1"                              │
│     → `phase1_sessions.status` = "active"                   │
│  2. All participants see questions simultaneously           │
│  3. Each participant submits answers + time taken           │
│     → Server scores and saves to `participants`             │
│  4. Admin hits "End Phase 1"                                │
│     → Server ranks all participants per track               │
│     → Top 64 per track: `phase1Qualified` = true            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ PHASE 2 — MCQ Duels (6 rounds)                              │
│                                                             │
│  Round N:                                                   │
│  1. Admin triggers matchmaking for current pool             │
│     → Qualified players shuffled per track                  │
│     → Split into pairs → matches created in DB              │
│  2. Players enter their assigned duel room (Socket.IO)      │
│  3. Both players signal "ready"                             │
│  4. Server delivers the same question set to both           │
│  5. Players answer under time pressure                      │
│  6. Server computes winner (score → time tiebreaker)        │
│  7. Winner advances; loser is eliminated                    │
│  8. Repeat until 8 players remain                           │
│                                                             │
│  Rounds: 64→32→16→8 (top 8 advance to Phase 3)             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ PHASE 3 — Grand Finals on HackerRank                        │
│  1. Top 8 are divided into 4 pairs                          │
│  2. Admin shares HackerRank contest link                    │
│  3. Players compete on CP problems in fixed time window     │
│  4. Ranked by: problems solved → score → submission speed   │
│  5. Rank 1 = Champion of Clash of Codes                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    🏆 Champion Crowned
```

---

## State Transitions

### Participant States

```
registered
    │
    ▼
phase1_submitted
    │
    ├── (not top 64) → eliminated_phase1
    │
    ▼
phase2_active
    │
    ├── (lost duel) → eliminated_phase2
    │
    ▼
phase3_finalist
    │
    ▼
champion  (rank 1 on HackerRank)
```

### Event States (Admin View)

```
idle → registration_open → phase1_active → phase1_ended
     → phase2_round_N → phase2_complete → phase3_active → event_complete
```
