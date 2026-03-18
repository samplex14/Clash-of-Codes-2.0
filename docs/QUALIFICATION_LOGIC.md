# Qualification Logic

## Rule

Top 8 participants qualify after Phase 1.

## Ranking Order

1. phase1Score descending
2. submittedAt ascending (earlier submission wins tie)
3. id ascending as final deterministic tie-break

## Execution Time

Qualification runs when:

- admin ends Phase 1, or
- server auto-closes after all participants submit

## Output

- qualified = true for top 8
- qualified = false for all others
- rank computed from ordered list
- leaderboard exposes rank and qualified fields
