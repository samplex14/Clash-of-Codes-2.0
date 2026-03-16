# Features and Testing

Complete feature list and corresponding test scenarios for Clash of Codes 2.0.

---

## Feature List

### Registration

- [ ] Participant can register with USN, name, and year
- [ ] Duplicate USN is rejected
- [ ] Track (1st_year / 2nd_year) is auto-assigned from year field
- [ ] Admin can view all registered participants

### Phase 1 — Rapid Fire Round

- [ ] Admin can start Phase 1 (set session to "active")
- [ ] Participants see questions only while Phase 1 is active
- [ ] Questions are displayed with a countdown timer
- [ ] Participant submits answers; server scores them immediately
- [ ] Admin can end Phase 1 (set session to "ended")
- [ ] After Phase 1 ends, top 64 per track are automatically flagged
- [ ] Admin can view the Phase 1 leaderboard sorted by score, then time

### Phase 2 — MCQ Duels

- [x] Admin triggers matchmaking to create pairs for a round
- [x] Matched players are given a unique room ID
- [x] Player joins duel room via Socket.IO
- [x] Both players must signal "ready" before duel starts
- [x] Questions are delivered simultaneously to both players
- [x] Opponent progress (questions answered count) shown live
- [x] Timer runs and auto-submits unanswered questions at expiry
- [x] Winner is determined by score, then time (if tied)
- [x] Loser is marked `phase2Eliminated = true`
- [x] Admin can advance all round winners to next round
- [x] Process repeats until 8 players remain
- [x] Duplicate answers for the same question are rejected (Implemented)

### Phase 3 — Grand Finals

- [x] Top 8 players are identified after Phase 2
- [x] Admin can view the finalists list
- [ ] (Conducted externally on HackerRank)

### Admin Dashboard

- [ ] Protected by admin token (unauthorized requests rejected)
- [ ] Can add / delete questions for Phase 1 and Phase 2
- [ ] Can view and search participants
- [ ] Can start / end Phase 1
- [ ] Can trigger Phase 2 matchmaking
- [ ] Can view all current round matches and their status

---

## Test Scenarios

### Registration

| Scenario                        | Expected                           |
| ------------------------------- | ---------------------------------- |
| Valid USN, name, year submitted | Participant created, 200 OK        |
| Duplicate USN submitted         | 400 error "USN already registered" |
| Missing field                   | 400 validation error               |
| Year = 1                        | Track = "1st_year"                 |
| Year = 2                        | Track = "2nd_year"                 |

### Phase 1

| Scenario                          | Expected                           |
| --------------------------------- | ---------------------------------- |
| Submit before Phase 1 starts      | 403 "Phase 1 not active"           |
| Submit valid answers              | Score computed correctly           |
| Submit after Phase 1 ends         | 403 "Phase 1 ended"                |
| Same USN submits twice            | 409 "Already submitted"            |
| End Phase 1 with 100 participants | Top 64 per track flagged correctly |

### Phase 2 — Duel

| Scenario                                     | Expected                           |
| -------------------------------------------- | ---------------------------------- |
| Player joins room                            | Confirmed with `room_joined` event |
| Both players ready                           | `duel_start` sent with questions   |
| Player A answers 7/10, Player B answers 5/10 | Player A wins                      |
| Both answer 7/10 but A is faster             | Player A wins                      |
| Player disconnects                           | Opponent wins after timeout        |
| Duplicate answer for same question           | Error returned, answer ignored     |

### Matchmaking

| Scenario              | Expected                           |
| --------------------- | ---------------------------------- |
| 64 qualified players  | 32 match documents created         |
| 32 remaining          | 16 match documents created         |
| Odd number of players | Error returned, admin must resolve |

### Admin Auth

| Scenario              | Expected         |
| --------------------- | ---------------- |
| Valid token           | Request proceeds |
| Missing / wrong token | 401 Unauthorized |
