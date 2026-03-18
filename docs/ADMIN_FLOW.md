# Admin Flow

## Actions

1. Authenticate in admin panel.
2. Review current session state and matchmaking status.
3. Start Phase 1.
4. Server creates round salt, deterministic per-user shuffles, and emits phase1:questions.
5. Participants transition inline to battle in /arena.
6. End Phase 1.
7. Qualification computes Top 8 and emits outcomes.
8. Review leaderboard and pair status.

## Trigger Effects

- phase1:start
  - sets phase session active
  - initializes answer/submit maps
  - emits phase1:started
  - emits phase1:questions per participant

- phase1:end
  - closes active session
  - computes qualification
  - emits phase1:qualified / phase1:eliminated
