# Phase 1: Rapid Fire

## Status

Implemented and active.

## Delivery Model

- Phase 1 is delivered inline on /arena.
- Participants do not navigate to a separate quiz route.
- Questions appear only when admin starts phase via socket event.

## Participant Experience

1. Matchmaking search
2. Versus waiting screen
3. Inline transition to battle panel on phase1:questions
4. Answer lock and final submit
5. Inline result view

## Answer Rules

- Answer can be locked per question.
- Final submit is allowed only on last question.
- All previous questions must be locked before submit.
