# Event Readiness Tasks

Pre-event checklist to ensure Clash of Codes 2.0 runs without issues.

---

## Development Checklist

### Backend

- [x] MongoDB Atlas cluster (or local instance) is set up and accessible
- [x] `.env` file configured with `MONGO_URI`, `PORT`, `ADMIN_SECRET`
- [x] All REST API endpoints tested (Postman / Thunder Client)
- [x] Socket.IO duel flow tested end-to-end (2 browser tabs)
- [x] Phase 1 session start/end correctly sets `phase1Qualified`
- [x] Matchmaking generates correct pairs per track
- [x] Duel result computed correctly (score → time tiebreaker)
- [x] Admin token middleware working on protected routes

### Frontend

- [ ] Registration form validates and submits correctly
- [ ] Phase 1 quiz loads questions, timer counts down, submits answers
- [ ] Phase 2 lobby connects to correct Socket.IO room
- [ ] Phase 2 duel shows live opponent progress
- [ ] Duel end screen shows winner/loser correctly
- [ ] Admin dashboard can start/end phases, trigger matchmaking
- [ ] Responsive on the screen sizes used in the venue (laptops / desktops)

### Data

- [ ] Phase 1 questions loaded into DB (verified count per track)
- [ ] Phase 2 questions loaded into DB (enough for all rounds)
- [ ] Test run: 2 dummy participants registered, duel completed end-to-end

---

## Scaling & Load Handling (100-150 Users)

- [ ] Load Test Socket.IO: Simulate 100-150 concurrent `join_room` and `submit_answer` events.
- [ ] Configure Socket.IO options: Adjust `pingInterval` and `pingTimeout` to prevent disconnects on possibly slow venue WiFi.
- [ ] Implement PM2 Cluster Mode: Run Node.js across all available CPU cores to handle connections efficiently.
- [ ] Database Indexing: Preemptively add indexes on `Participant.usn`, `Participant.track`, `Participant.phase1Score`, `Match.round`, and `Match.status`.
- [ ] API Rate Limiting: Add `express-rate-limit` on endpoints like `/api/phase1/submit` to mitigate spam requests.

---

## Deployment Checklist

- [ ] Server deployed and accessible on venue network
- [ ] Client deployed (or accessible via local IP)
- [ ] MongoDB connection string points to production DB
- [ ] Admin secret set and not shared with participants
- [ ] CORS configured for deployed client origin

---

## On Event Day

### Before Opening Registration

- [ ] Confirm server is running
- [ ] Confirm DB is accessible
- [ ] Brief admin on dashboard workflow ([admin_workflow.md](./admin_workflow.md))
- [ ] Test registration with a dummy USN

### Before Phase 1

- [ ] Confirm question count loaded
- [ ] Announce to all participants to visit the registration link
- [ ] Wait for registrations to settle, then start Phase 1

### Before Phase 2

- [ ] Verify top 64 per track are marked `phase1Qualified = true`
- [ ] Announce Phase 2 format to participants
- [ ] Trigger Round 1 matchmaking only when all players are ready

### Before Phase 3

- [ ] Confirm top 8 per track are identified
- [ ] HackerRank contest created and tested
- [ ] Invite links sent to finalists only

---

## Contingency

| Issue                           | Fallback                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------- |
| Server crashes mid-Phase 1      | Restart server; Phase 1 submissions are persisted — continue from last state |
| Player disconnects mid-duel     | Opponent wins after timeout (configurable in server)                         |
| Odd number of qualified players | Admin manually promotes/drops a player to make the count even                |
| HackerRank outage               | Use backup coding platform (Codeforces / custom judge)                       |
