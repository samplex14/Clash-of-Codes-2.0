# Event Flow

End-to-end flow of Clash of Codes 2.0, from registration to crowning the champion.

---

## Full Event Timeline

```
┌─────────────────────────────────────────────────────────────┐
│ PRE-EVENT                                                   │
│  - Admin loads questions into DB (Phase 1 & Phase 2)        │
│  - Admin verifies platform is live (GET /api/health)        │
│  - Env vars tuned for venue WiFi                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ REGISTRATION                                                │
│  Participants visit site → enter USN, Name, Year            │
│  → POST /api/participants/register (rate limited: 8/5min)   │
│  → Stored in `participants` collection                      │
│  → Track auto-assigned (1st_year or 2nd_year via pre-save)  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ PHASE 1 — Rapid Fire Round                                  │
│  1. Admin hits "Start Phase 1"                              │
│     → POST /api/admin/phase1/start                          │
│     → `phase1sessions.status` = "active"                    │
│  2. All participants see questions simultaneously           │
│     → GET /api/phase1/questions (correctIndex excluded)     │
│  3. Each participant submits answers + time taken           │
│     → POST /api/phase1/submit (rate limited: 4/min)         │
│     → Server scores and saves to `participants`             │
│  4. Admin hits "End Phase 1"                                │
│     → POST /api/admin/phase1/end                            │
│     → Server ranks all participants per track               │
│     → Top 64 per track: `phase1Qualified` = true            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ PHASE 2 — MCQ Duels (3 rounds per track)                    │
│                                                             │
│  Round N:                                                   │
│  1. Admin triggers matchmaking for current pool             │
│     → POST /api/admin/phase2/matchmake { round: N }         │
│     → Qualified players shuffled per track                  │
│     → Split into pairs → matches created with 10 questions  │
│  2. Players enter their assigned duel room (Socket.IO /duel)│
│     → join_room { matchId, usn }                            │
│  3. Both players signal "ready"                             │
│     → ready { matchId, usn }                                │
│  4. Server delivers 10 questions to both players            │
│     → duel_start { questions, startTime, durationSeconds }  │
│  5. Players answer under 90-second time pressure            │
│     → submit_answer { matchId, usn, questionIndex, ... }    │
│     → opponent_progress broadcast to opponent               │
│  6. Server computes winner (score → time tiebreaker)        │
│     → duel_end { winner, scores }                           │
│  7. Admin advances winners                                  │
│     → POST /api/admin/phase2/advance { round: N }           │
│     → Losers: phase2Eliminated = true, phase2Active = false │
│  8. Repeat until ≤ 8 players remain per track               │
│     → Remaining marked phase3Qualified = true               │
│                                                             │
│  Rounds: 64→32→16→8 (3 rounds to reach top 8)              │
│                                                             │
│  Disconnect handling:                                       │
│  - Player disconnects → 15s grace period starts             │
│  - Reconnects within 15s → timer cancelled, duel continues  │
│  - Grace period expires → opponent wins (disconnect_forfeit)│
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ PHASE 3 — Grand Finals on HackerRank                        │
│  1. Confirm finalists (GET /api/admin/phase3/finalists)     │
│  2. Admin shares HackerRank contest link with finalists     │
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
phase1_submitted (phase1Submitted = true)
    │
    ├── (not top 64) → eliminated_phase1
    │
    ▼
phase2_active (phase1Qualified = true, phase2Active = true)
    │
    ├── (lost duel) → eliminated_phase2 (phase2Eliminated = true)
    │
    ▼
phase3_finalist (phase3Qualified = true, when ≤ 8 remain)
    │
    ▼
champion  (rank 1 on HackerRank)
```

### Event States (Admin View)

```
idle → registration_open → phase1_active → phase1_ended
     → phase2_round_1 → phase2_round_2 → phase2_round_3
     → phase3_active → event_complete
```
