# Shuffle Logic

## Principles

- Shuffle is performed only on server.
- Client must render question order exactly as received.
- No client-side reordering is allowed.

## Algorithm

- Server computes per-user question order at phase1:start.
- Base list: all question IDs in canonical order.
- Seed input: usn + round salt.
- Deterministic RNG derives from seed.
- Fisher-Yates uses that RNG to produce user-specific order.

## Guarantees

- Different participants see different order.
- Same participant reconnecting during same round gets same order.
- Server emits pre-shuffled array directly in phase1:questions.
