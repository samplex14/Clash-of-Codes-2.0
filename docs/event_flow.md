# Event Flow

## Participant Flow

1. Participant registers.
2. Participant opens /arena.
3. Client emits matchmaking:enter_arena.
4. Server emits matchmaking:searching and then either:
   - matchmaking:opponent_found
   - matchmaking:waiting_in_queue
   - matchmaking:timeout with ghost opponent
5. Client remains on versus waiting state.
6. Admin emits phase1:start.
7. Server emits phase1:questions with pre-shuffled per-user question order.
8. Client transitions inline to battle panel.
9. Participant emits phase1:confirm_answer and phase1:submit.
10. Server emits phase1:result, then phase1:qualified or phase1:eliminated.
11. Client renders result inline on /arena.

## Admin Flow

1. Admin authenticates at /admin.
2. Admin starts Phase 1.
3. Server creates session and pushes personalized question arrays.
4. Admin ends Phase 1 when required.
5. Qualification is computed and outcomes are emitted.
